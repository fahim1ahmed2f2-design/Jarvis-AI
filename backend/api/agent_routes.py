from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.tools.registry import tool_registry
from backend.agent.action_history import action_history_logger
from backend.agent.task_manager import task_manager

router = APIRouter(prefix="/agent", tags=["agent"])

class ConfirmRequest(BaseModel):
    session_id: Optional[str] = "default"
    confirm: bool

class SessionRequest(BaseModel):
    session_id: Optional[str] = "default"

@router.get("/tools")
def list_available_tools():
    tools = tool_registry.list_tools()
    return {"total_tools": len(tools), "tools": tools}

@router.get("/history")
def get_action_history(limit: int = Query(50)):
    history = action_history_logger.get_history(limit=limit)
    return {"total": len(history), "history": history}

@router.delete("/history")
def clear_action_history():
    action_history_logger.clear_history()
    return {"status": "success", "message": "Action history cleared."}

@router.get("/task")
def get_current_task_progress():
    active = task_manager.get_active_task()
    return {"active": active is not None, "task": active}

@router.post("/stop")
def stop_agent(req: SessionRequest):
    task_manager.cancel_task()
    return {"status": "success", "message": "Agent execution halted."}

@router.post("/confirm")
def confirm_agent_action(req: ConfirmRequest):
    if req.confirm:
        return {"reply": "Action confirmed and proceeding, Sir.", "status": "success", "is_configured": True, "timestamp": ""}
    else:
        task_manager.cancel_task()
        return {"reply": "Action was cancelled by your directive, Sir.", "status": "success", "is_configured": True, "timestamp": ""}

@router.post("/cancel")
def cancel_agent_session_task(req: SessionRequest):
    task_manager.cancel_task()
    return {"status": "success", "message": "Task cancelled."}
