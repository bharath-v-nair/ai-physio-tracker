from typing import List
from fastapi import APIRouter, HTTPException, status, WebSocket, WebSocketDisconnect, Query, Depends
from app.api.deps import SessionDep, CurrentUser, get_db, get_current_user
from app.schemas.assessment import AssessmentCreate, AssessmentInDB
from app.models.assessment import Assessment
from app.ai.pose_detector import PoseDetector
from app.ai.posture_analyzer import PostureAnalyzer
from app.ai.recorder import LandmarkRecorder
import json
import asyncio

router = APIRouter()

# Initialize AI components
# In production, consider a dependency or pooling for better scaling
pose_detector = PoseDetector()
posture_analyzer = PostureAnalyzer()

@router.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(...), db = Depends(get_db)):
    await websocket.accept()
    # Authenticate via query param for WS
    try:
        user = get_current_user(db, token)
    except Exception as e:
        await websocket.close(code=1008)
        return
    recorder = LandmarkRecorder("posture_assessment")
        
    try:
        while True:
            data = await websocket.receive_text()
            # Try parsing JSON if client sends structured data, or base64 directly
            try:
                frame_data = json.loads(data)
                base64_img = frame_data.get("image")
            except:
                base64_img = data
                
            if not base64_img:
                await websocket.send_json({"error": "No image data"})
                continue
                
            # Process in thread pool to avoid blocking async loop
            # For simplicity in this sprint, we run it directly (mediapipe is fast)
            landmarks, (w, h) = pose_detector.process_frame(base64_img)
            analysis = posture_analyzer.analyze(landmarks)
            recorder.record(landmarks, analysis)
            
            await websocket.send_json({
                "landmarks": landmarks,
                "analysis": analysis,
                "width": w,
                "height": h
            })
            
            # Small sleep to yield to event loop
            await asyncio.sleep(0.01)
            
    except WebSocketDisconnect:
        print(f"User {user.email} disconnected from live assessment")
    except Exception as e:
        print(f"WS Error: {e}")
        try:
            await websocket.close()
        except:
            pass
    finally:
        recorder.close()


@router.post("", response_model=AssessmentInDB, status_code=status.HTTP_201_CREATED)
def create_assessment(assessment_in: AssessmentCreate, db: SessionDep, current_user: CurrentUser):
    assessment_db = Assessment(
        user_id=current_user.id,
        posture_score=assessment_in.posture_score,
        detected_issue=assessment_in.detected_issue,
        confidence=assessment_in.confidence
    )
    db.add(assessment_db)
    db.commit()
    db.refresh(assessment_db)
    return assessment_db

@router.get("/history", response_model=List[AssessmentInDB])
def get_assessment_history(db: SessionDep, current_user: CurrentUser):
    return db.query(Assessment).filter(Assessment.user_id == current_user.id).order_by(Assessment.created_at.desc()).all()

@router.get("/{id}", response_model=AssessmentInDB)
def get_assessment(id: int, db: SessionDep, current_user: CurrentUser):
    assessment = db.query(Assessment).filter(Assessment.id == id, Assessment.user_id == current_user.id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment
