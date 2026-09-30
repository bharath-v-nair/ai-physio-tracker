from typing import List
from sqlalchemy import or_
from fastapi import APIRouter, HTTPException, status
from app.api.deps import SessionDep, CurrentUser
from app.schemas.exercise import ExerciseCreate, ExerciseInDB
from app.models.exercise import Exercise

router = APIRouter()

@router.get("", response_model=List[ExerciseInDB])
def get_exercises(db: SessionDep, current_user: CurrentUser):
    # Retired duplicates stay in the table (old sessions point to them) but are hidden
    return db.query(Exercise).filter(or_(Exercise.target_issue.is_(None), Exercise.target_issue != "retired")).all()

@router.get("/{id}", response_model=ExerciseInDB)
def get_exercise(id: int, db: SessionDep, current_user: CurrentUser):
    exercise = db.query(Exercise).filter(Exercise.id == id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return exercise

@router.post("", response_model=ExerciseInDB, status_code=status.HTTP_201_CREATED)
def create_exercise(exercise_in: ExerciseCreate, db: SessionDep, current_user: CurrentUser):
    exercise_db = Exercise(
        name=exercise_in.name,
        body_part=exercise_in.body_part,
        description=exercise_in.description,
        repetitions=exercise_in.repetitions,
        duration=exercise_in.duration
    )
    db.add(exercise_db)
    db.commit()
    db.refresh(exercise_db)
    return exercise_db

from fastapi import WebSocket, WebSocketDisconnect, Query, Depends
import json
from app.api.deps import get_db, get_current_user
from app.ai.pose_detector import PoseDetector
from app.ai.exercises.exercise_factory import ExerciseFactory
from app.ai.recorder import LandmarkRecorder
from app.schemas.rehab import ExerciseSessionCreate, ExerciseSessionInDB
from app.models.exercise_session import ExerciseSession

@router.post("/sessions", response_model=ExerciseSessionInDB)
def create_exercise_session(session_in: ExerciseSessionCreate, db: SessionDep, current_user: CurrentUser):
    session_db = ExerciseSession(
        user_id=current_user.id,
        exercise_id=session_in.exercise_id,
        plan_id=session_in.plan_id,
        skipped=session_in.skipped,
        notes=session_in.notes,
        completed_reps=session_in.completed_reps,
        target_reps=session_in.target_reps,
        form_score=session_in.form_score,
        duration=session_in.duration,
        feedback=session_in.feedback
    )
    db.add(session_db)
    db.commit()
    db.refresh(session_db)
    return session_db

@router.get("/sessions", response_model=List[ExerciseSessionInDB])
def get_exercise_sessions(db: SessionDep, current_user: CurrentUser):
    # Retrieve sessions belonging to the current user, ordered by most recent
    sessions = (
        db.query(ExerciseSession)
        .filter(ExerciseSession.user_id == current_user.id)
        .order_by(ExerciseSession.completed_at.desc())
        .all()
    )
    return sessions

@router.websocket("/ws/live")
async def live_exercise_endpoint(websocket: WebSocket, token: str = Query(...), exercise_name: str = Query(...), db = Depends(get_db)):
    await websocket.accept()
    try:
        user = get_current_user(db, token)
    except Exception as e:
        await websocket.close(code=1008)
        return
    pose_detector = PoseDetector()
    analyzer = ExerciseFactory.get_analyzer(exercise_name)
    recorder = LandmarkRecorder(exercise_name)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "frame":
                frame_data = message.get("data")
                landmarks, dims = pose_detector.process_frame(frame_data)
                
                analysis = analyzer.analyze(landmarks, dims, message.get("t"))
                recorder.record(landmarks, analysis)
                
                await websocket.send_json({"type": "analysis_result", "data": {**analysis, "landmarks": landmarks}})
            elif message.get("type") == "landmarks":
                landmarks = message.get("data")
                dims = message.get("dimensions", (640, 480))
                
                # "t" is the browser's timestamp in seconds, so holds are timed by the clock, not the frame rate
                analysis = analyzer.analyze(landmarks, dims, message.get("t"))
                recorder.record(landmarks, analysis)
                
                await websocket.send_json({"type": "analysis_result", "data": analysis})
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WS error: {e}")
        try:
            await websocket.close()
        except:
            pass
    finally:
        recorder.close()
        del pose_detector
