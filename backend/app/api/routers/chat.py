from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.chat import ChatSession, ChatMessage
from app.models.assessment import Assessment
from app.models.rehab_plan import RehabPlan
from pydantic import BaseModel
from datetime import datetime

from app.rag.chat_service import ChatService

router = APIRouter()
chat_service = ChatService()

# Schemas
class ChatMessageCreate(BaseModel):
    content: str

class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    sources: List[str]
    created_at: datetime
    class Config:
        orm_mode = True
        from_attributes = True

class ChatSessionResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    class Config:
        orm_mode = True
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
    
    # parse JSON sources
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
        
    # Save User message
    user_msg = ChatMessage(session_id=session_id, role="user", content=message_in.content, sources="[]")
    db.add(user_msg)
    db.commit()
    
    # 1. Build User Context (Assessment + Active Plan)
    latest_assessment = db.query(Assessment).filter(Assessment.user_id == current_user.id).order_by(Assessment.created_at.desc()).first()
    active_plan = db.query(RehabPlan).filter(RehabPlan.user_id == current_user.id, RehabPlan.status == "active").first()
    
    context_str = f"User Name: {current_user.full_name}\n"
    if latest_assessment:
        context_str += f"Latest Posture Score: {latest_assessment.posture_score}/100\n"
        context_str += f"Detected Issue: {latest_assessment.detected_issue}\n"
    else:
        context_str += "No recent assessments.\n"
        
    if active_plan and active_plan.exercises:
        exercises = [pe.exercise.name for pe in active_plan.exercises]
        context_str += f"Active Rehab Plan Exercises: {', '.join(exercises)}\n"
        
    # 2. Get AI Response from RAG
    ai_result = chat_service.get_response(message_in.content, context_str)
    
    # Save Assistant message
    assistant_msg = ChatMessage(
        session_id=session_id, 
        role="assistant", 
        content=ai_result["answer"],
        sources=json.dumps(ai_result.get("sources", []))
    )
    db.add(assistant_msg)
    
    # Update session title if it's new
    if session.title == "New Conversation":
        # simple truncation for title
        session.title = message_in.content[:30] + "..." if len(message_in.content) > 30 else message_in.content
        
    db.commit()
    db.refresh(assistant_msg)
    
    return {
        "id": assistant_msg.id,
        "role": assistant_msg.role,
        "content": assistant_msg.content,
        "sources": ai_result.get("sources", []),
        "created_at": assistant_msg.created_at
    }
