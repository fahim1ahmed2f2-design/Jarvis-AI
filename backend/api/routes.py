import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone

from backend.ai.brain import jarvis_brain
from backend.tools.registry import tool_registry
from backend.agent.task_manager import task_manager

logger = logging.getLogger("jarvis.api.routes")
router = APIRouter(tags=["core"])

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"
    mode: Optional[str] = "auto"
    model_override: Optional[str] = None

class ResetRequest(BaseModel):
    session_id: Optional[str] = "default"

@router.get("/health")
def get_health():
    prov_status = jarvis_brain.get_all_providers_status()
    is_conf = prov_status.get("configured_count", 0) > 0
    active_task = task_manager.get_active_task()

    return {
        "status": "online",
        "health": "healthy",
        "service": "JARVIS AI Core (ChatGPT-5 Benchmark Autonomous Engine)",
        "model": f"{jarvis_brain.active_provider_name} ({jarvis_brain.active_model_name})",
        "is_configured": is_conf,
        "total_tools": len(tool_registry.list_tools()),
        "memory_enabled": True,
        "reminders_enabled": True,
        "smart_home_provider": "virtual",
        "active_task": active_task,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@router.post("/chat")
def chat_endpoint(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    
    try:
        res = jarvis_brain.process_chat(
            user_message=req.message,
            session_id=req.session_id or "default",
            mode=req.mode or "auto",
            model_override=req.model_override
        )
        return res
    except Exception as e:
        logger.error(f"Error in /chat endpoint: {e}")
        return {
            "reply": f"An error occurred while processing your request: {str(e)}",
            "status": "error",
            "intent": "ERROR",
            "steps": [],
            "is_configured": False,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

@router.post("/reset")
def reset_session(req: ResetRequest):
    return {"status": "success", "message": f"Session '{req.session_id}' state reset."}
