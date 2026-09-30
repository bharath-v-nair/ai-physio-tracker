import json
from typing import List

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect

from app.api.deps import SessionDep, CurrentUser, get_db, get_current_user
from app.ai.focus_analyzer import FocusAnalyzer
from app.ai.exercises.base_exercise import frame_size
from app.models.focus_session import FocusSession
from app.schemas.focus import FocusSessionCreate, FocusSessionInDB

router = APIRouter()


def to_response(s: FocusSession) -> dict:
    return {
        "id": s.id, "started_at": s.started_at, "duration_seconds": s.duration_seconds,
        "samples": s.samples, "good_samples": s.good_samples, "good_pct": s.good_pct, "nudges": s.nudges,
        "timeline": json.loads(s.timeline or "[]"), "reasons": json.loads(s.reasons or "{}"),
        "created_at": s.created_at,
    }


@router.websocket("/ws")
async def focus_socket(websocket: WebSocket, token: str = Query(...), db=Depends(get_db)):
    """Receives body points only (the video stays in the browser) and returns a posture status."""
    await websocket.accept()
    try:
        get_current_user(db, token)
    except Exception:
        await websocket.close(code=1008)
        return
    analyzer = FocusAnalyzer()
    try:
        while True:
            message = json.loads(await websocket.receive_text())
            result = analyzer.analyze(message.get("landmarks"), message.get("world"),
                                      frame_size(message.get("dimensions")))
            await websocket.send_json(result)
    except WebSocketDisconnect:
        pass


@router.post("/sessions", response_model=FocusSessionInDB)
def save_session(session_in: FocusSessionCreate, db: SessionDep, current_user: CurrentUser):
    good_pct = 100.0 * session_in.good_samples / session_in.samples if session_in.samples else 0.0
    s = FocusSession(
        user_id=current_user.id, started_at=session_in.started_at, duration_seconds=session_in.duration_seconds,
        samples=session_in.samples, good_samples=min(session_in.good_samples, session_in.samples),
        good_pct=round(good_pct, 1), nudges=session_in.nudges,
        timeline=json.dumps([p.model_dump() for p in session_in.timeline]),
        reasons=json.dumps(session_in.reasons),
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return to_response(s)


@router.get("/sessions", response_model=List[FocusSessionInDB])
def list_sessions(db: SessionDep, current_user: CurrentUser):
    sessions = (db.query(FocusSession).filter(FocusSession.user_id == current_user.id)
                .order_by(FocusSession.started_at.desc()).limit(50).all())
    return [to_response(s) for s in sessions]
