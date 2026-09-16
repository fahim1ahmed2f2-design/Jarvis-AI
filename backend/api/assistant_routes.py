from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.assistant.reminder_engine import reminder_engine
from backend.assistant.notification_center import notification_center

router = APIRouter(prefix="/assistant", tags=["assistant"])

class CreateReminderRequest(BaseModel):
    title: str
    time_expression: str
    recurring: Optional[bool] = False
    recurrence_rule: Optional[str] = "none"

class CreateTimerRequest(BaseModel):
    duration_seconds: float
    label: Optional[str] = "Timer"

class SnoozeRequest(BaseModel):
    minutes: Optional[int] = 10

# ── Reminders ──
@router.get("/reminders")
def get_reminders(status: str = Query("pending")):
    rems = reminder_engine.get_reminders(status=status)
    return {"total": len(rems), "reminders": rems}

@router.post("/reminders")
def create_reminder(req: CreateReminderRequest):
    if not req.title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty.")
    rem = reminder_engine.create_reminder(
        title=req.title,
        time_expression=req.time_expression,
        recurring=bool(req.recurring),
        recurrence_rule=req.recurrence_rule or "none"
    )
    return {"status": "success", "reminder": rem}

@router.delete("/reminders/{reminder_id}")
def delete_reminder(reminder_id: str):
    success = reminder_engine.delete_reminder(reminder_id)
    if not success:
        raise HTTPException(status_code=404, detail="Reminder not found.")
    return {"status": "success", "deleted": True}

@router.delete("/reminders")
def clear_reminders():
    reminder_engine.clear_all()
    return {"status": "success", "cleared": True}

@router.post("/reminders/{reminder_id}/snooze")
def snooze_reminder(reminder_id: str, req: SnoozeRequest):
    res = reminder_engine.snooze_reminder(reminder_id, minutes=req.minutes or 10)
    if not res:
        raise HTTPException(status_code=404, detail="Reminder not found.")
    return {"status": "success", "reminder": res}

@router.post("/reminders/{reminder_id}/dismiss")
def dismiss_reminder(reminder_id: str):
    res = reminder_engine.dismiss_reminder(reminder_id)
    return {"status": "success", "dismissed": res}

# ── Timers ──
@router.get("/timers")
def get_timers():
    timers = reminder_engine.get_timers()
    return {"timers": timers}

@router.post("/timers")
def create_timer(req: CreateTimerRequest):
    if req.duration_seconds <= 0:
        raise HTTPException(status_code=400, detail="Duration must be greater than 0.")
    timer = reminder_engine.create_timer(duration_seconds=req.duration_seconds, label=req.label or "Timer")
    return {"status": "success", "timer": timer}

@router.post("/timers/{timer_id}/stop")
def stop_timer(timer_id: str):
    success = reminder_engine.stop_timer(timer_id)
    return {"status": "success", "stopped": success}

# ── Notifications ──
@router.get("/notifications")
def get_notifications():
    notifs = notification_center.get_pending_notifications()
    return {"total": len(notifs), "notifications": notifs}
