from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.models.assessment import Assessment
from app.models.rehab_plan import RehabPlan
from app.models.exercise_session import ExerciseSession
from app.models.exercise import Exercise
from app.models.focus_session import FocusSession
from pydantic import BaseModel
from datetime import datetime

from app.services.gemini_service import GeminiService
from app.services.safety import find_red_flag, safety_reply

router = APIRouter()
gemini_service = GeminiService()

# Schemas
class ChatMessageCreate(BaseModel):
    content: str
    context_exercise: str = None # Optional context passed from frontend

class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    sources: List[str]
    created_at: datetime
    class Config:
        from_attributes = True

class ChatSessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    class Config:
        from_attributes = True

@router.post("/sessions", response_model=ChatSessionResponse)
def create_chat_session(title: str = "New Conversation", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = ChatSession(user_id=current_user.id, title=title)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_chat_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ChatSession).filter(ChatSession.user_id == current_user.id).order_by(ChatSession.created_at.desc()).all()

@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
def get_chat_messages(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()
    
    result = []
    for msg in messages:
        sources_list = json.loads(msg.sources) if msg.sources else []
        result.append({
            "id": msg.id,
            "role": msg.role,
            "content": msg.content,
            "sources": sources_list,
            "created_at": msg.created_at
        })
    return result

@router.post("/sessions/{session_id}/message", response_model=ChatMessageResponse)
def send_message(session_id: int, message_in: ChatMessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get previous chat history before saving the new user message
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()
    history = [{"role": msg.role, "content": msg.content} for msg in messages]
        
    # Save User message
    user_msg = ChatMessage(session_id=session_id, role="user", content=message_in.content, sources="[]")
    db.add(user_msg)
    db.commit()
    
    # 1. Build User Context (Assessment + Active Plan + Exercise Sessions)
    latest_assessment = db.query(Assessment).filter(Assessment.user_id == current_user.id).order_by(Assessment.created_at.desc()).first()
    active_plan = db.query(RehabPlan).filter(RehabPlan.user_id == current_user.id, RehabPlan.status == "active").first()
    recent_sessions = db.query(ExerciseSession, Exercise).join(Exercise).filter(ExerciseSession.user_id == current_user.id).order_by(ExerciseSession.completed_at.desc()).limit(3).all()
    
    context_str = f"User Name: {current_user.full_name}\n"
    if current_user.rehabilitation_goal:
        context_str += f"User's goal: {current_user.rehabilitation_goal}\n"
    if latest_assessment:
        context_str += f"Latest Posture Assessment: {latest_assessment.posture_score}/100. Detected Issue: {latest_assessment.detected_issue}\n"
        if latest_assessment.head_offset_pct is not None:
            context_str += (f"Measurements: head {latest_assessment.head_offset_pct:.0f}% of shoulder width off centre (flagged above 12%), "
                            f"shoulder tilt {latest_assessment.shoulder_tilt_deg:.1f} degrees (flagged above 5)")
            if latest_assessment.neck_angle_deg is not None:
                context_str += f", side-view neck angle {latest_assessment.neck_angle_deg:.1f} degrees (higher = head further back)"
            context_str += "\n"
    latest_focus = db.query(FocusSession).filter(FocusSession.user_id == current_user.id).order_by(FocusSession.started_at.desc()).first()
    if latest_focus:
        context_str += f"Latest focus-mode work session: {latest_focus.good_pct}% of {latest_focus.duration_seconds // 60} minutes in good posture.\n"
        
    if active_plan and active_plan.exercises:
        exercises = [pe.exercise.name for pe in active_plan.exercises]
        context_str += f"Active Recommended Exercises: {', '.join(exercises)}\n"
        
    if recent_sessions:
        context_str += "Recent Exercise Sessions:\n"
        for sess, ex in recent_sessions:
            context_str += f"- {ex.name}: {sess.completed_reps}/{sess.target_reps} reps, Form: {sess.form_score}%\n"

    if message_in.context_exercise:
        context_str += f"\nThe user is currently viewing the exercise: {message_in.context_exercise}. Tailor your advice to this exercise if asked about it.\n"
        
    system_instruction = f"""You are an educational AI Physiotherapy Assistant.
Your goal is to help the user understand their posture issues, recommended exercises, exercise instructions, general physiotherapy concepts, and their saved exercise progress.

Context about the user:
{context_str}

RULES:
1. EXPLAIN posture concepts clearly and explain the purpose of recommended exercises.
2. ENCOURAGE safe exercise practices and advise users to stop if an exercise causes pain.
3. USE the user's actual saved data (provided above) when asked about their progress. Do NOT invent values, sessions, or results.
4. DO NOT diagnose diseases or injuries, and do not claim to replace a physiotherapist.
5. DO NOT prescribe or suggest medication, supplements, diets, food or drinks, and do not claim medical certainty.
6. IF the user mentions any symptom (pain that is severe, sudden or worsening, dizziness, fainting, chest pain, breathing trouble, numbness, tingling, weakness, vision changes, or an injury), do NOT suggest causes or home remedies. Tell them to stop exercising, rest somewhere safe, and see a doctor or physiotherapist; for anything severe or sudden, tell them to call 112.
7. STAY on posture, the app's exercises and the user's progress. For other health topics, say you can only help with posture and exercise, and suggest a professional.

Be friendly, concise, and supportive.
"""

    # 2. Warning signs get a fixed reply; everything else goes to Gemini
    symptom = find_red_flag(message_in.content)
    if symptom:
        ai_result = {"answer": safety_reply(symptom), "sources": []}
    else:
        ai_result = gemini_service.get_chat_response(message_in.content, system_instruction, history)
    
    # Save Assistant message
    assistant_msg = ChatMessage(
        session_id=session_id, 
        role="assistant", 
        content=ai_result["answer"],
        sources="[]"
    )
    db.add(assistant_msg)
    
    # Update session title if it's new
    if session.title == "New Conversation":
        session.title = message_in.content[:30] + "..." if len(message_in.content) > 30 else message_in.content
        
    db.commit()
    db.refresh(assistant_msg)
    
    return {
        "id": assistant_msg.id,
        "role": assistant_msg.role,
        "content": assistant_msg.content,
        "sources": [],
        "created_at": assistant_msg.created_at
    }
