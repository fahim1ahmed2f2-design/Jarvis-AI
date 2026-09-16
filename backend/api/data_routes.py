from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from backend.memory.memory_engine import memory_engine
from backend.memory.user_task_store import user_task_store
from backend.assistant.reminder_engine import reminder_engine
from backend.agent.action_history import action_history_logger

router = APIRouter(prefix="/data", tags=["data"])

class ImportMemoryRequest(BaseModel):
    memories: List[Dict[str, Any]]

class DeleteAllDataRequest(BaseModel):
    confirm: bool

@router.get("/export")
def export_all_data():
    return {
        "memories": memory_engine.get_all_memories(),
        "tasks": user_task_store.get_all_tasks(),
        "reminders": reminder_engine.get_reminders(status="all"),
        "action_history": action_history_logger.get_history(limit=200)
    }

@router.post("/import/memory")
def import_memory_data(req: ImportMemoryRequest):
    imported_count = 0
    for m in req.memories:
        content = m.get("content", "").strip()
        if content:
            memory_engine.create_memory(
                content=content,
                category=m.get("category", "preference"),
                topic_key=m.get("topic_key", "")
            )
            imported_count += 1
    return {"status": "success", "imported_count": imported_count}

@router.delete("/all")
def delete_all_data(req: DeleteAllDataRequest):
    if not req.confirm:
        raise HTTPException(status_code=400, detail="Confirmation required to delete all data.")
    memory_engine.clear_all()
    user_task_store.clear_all()
    reminder_engine.clear_all()
    action_history_logger.clear_history()
    return {"status": "success", "message": "All user data wiped successfully."}
