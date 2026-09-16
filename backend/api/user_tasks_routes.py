from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.memory.user_task_store import user_task_store

router = APIRouter(prefix="/user-tasks", tags=["user_tasks"])

class CreateTaskRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    priority: Optional[str] = "medium"
    due_at: Optional[str] = None

class UpdateTaskRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_at: Optional[str] = None
    dueAt: Optional[str] = None

@router.get("")
def list_user_tasks(status: Optional[str] = Query(None), query: Optional[str] = Query(None)):
    tasks = user_task_store.get_all_tasks(status=status, query=query)
    return {"total": len(tasks), "tasks": tasks}

@router.post("")
def add_user_task(req: CreateTaskRequest):
    if not req.title.strip():
        raise HTTPException(status_code=400, detail="Task title cannot be empty.")
    task = user_task_store.create_task(
        title=req.title,
        description=req.description or "",
        priority=req.priority or "medium",
        due_at=req.due_at
    )
    return {"status": "success", "task": task}

@router.put("/{task_id}")
def update_user_task(task_id: str, req: UpdateTaskRequest):
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    updated = user_task_store.update_task(task_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Task not found.")
    return {"status": "success", "task": updated}

@router.post("/{task_id}/complete")
def complete_user_task(task_id: str):
    res = user_task_store.complete_task(task_id)
    if not res:
        raise HTTPException(status_code=404, detail="Task not found.")
    return {"status": "success", "task": res}

@router.delete("/{task_id}")
def delete_user_task(task_id: str):
    success = user_task_store.delete_task(task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found.")
    return {"status": "success", "deleted": True}

@router.delete("")
def clear_all_tasks():
    user_task_store.clear_all()
    return {"status": "success", "message": "All user tasks cleared."}
