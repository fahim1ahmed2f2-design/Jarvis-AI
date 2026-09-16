from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.memory.memory_engine import memory_engine

router = APIRouter(prefix="/memory", tags=["memory"])

class CreateMemoryRequest(BaseModel):
    content: str
    category: Optional[str] = "preference"
    topic_key: Optional[str] = None
    importance: Optional[int] = 1

class UpdateMemoryRequest(BaseModel):
    content: str
    category: Optional[str] = None
    importance: Optional[int] = None

@router.get("")
def list_memories(category: Optional[str] = Query(None)):
    mems = memory_engine.get_all_memories(category=category)
    return {
        "enabled": memory_engine.enabled,
        "total": len(mems),
        "memories": mems
    }

@router.post("")
def add_memory(req: CreateMemoryRequest):
    if not req.content.strip():
        raise HTTPException(status_code=400, detail="Memory content cannot be empty.")
    mem = memory_engine.create_memory(
        content=req.content,
        category=req.category or "preference",
        topic_key=req.topic_key or "",
        importance=req.importance or 1
    )
    return {"status": "success", "memory": mem}

@router.put("/{memory_id}")
def update_memory_item(memory_id: str, req: UpdateMemoryRequest):
    updated = memory_engine.update_memory(
        memory_id=memory_id,
        content=req.content,
        category=req.category,
        importance=req.importance
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Memory record not found.")
    return {"status": "success", "memory": updated}

@router.delete("/{memory_id}")
def delete_memory_item(memory_id: str):
    success = memory_engine.delete_memory(memory_id)
    if not success:
        raise HTTPException(status_code=404, detail="Memory record not found.")
    return {"status": "success", "deleted": True}

@router.delete("")
def clear_all_memories():
    memory_engine.clear_all()
    return {"status": "success", "message": "All memories cleared."}
