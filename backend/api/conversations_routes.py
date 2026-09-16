from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.memory.conversation_store import conversation_store

router = APIRouter(prefix="/conversations", tags=["conversations"])

class CreateConversationRequest(BaseModel):
    title: Optional[str] = "New Conversation"

class RenameConversationRequest(BaseModel):
    title: str

@router.get("")
def list_conversations():
    convs = conversation_store.get_all_conversations()
    return {"total": len(convs), "conversations": convs}

@router.post("")
def create_new_conversation(req: CreateConversationRequest):
    conv = conversation_store.create_conversation(title=req.title or "New Conversation")
    return {"status": "success", "conversation": conv}

@router.get("/search")
def search_conversations(query: str = Query("")):
    convs = conversation_store.search_conversations(query)
    return {"total": len(convs), "conversations": convs}

@router.get("/{conv_id}")
def get_conversation_details(conv_id: str):
    conv = conversation_store.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation session not found.")
    return {"conversation": conv}

@router.put("/{conv_id}/rename")
def rename_conversation_session(conv_id: str, req: RenameConversationRequest):
    success = conversation_store.rename_conversation(conv_id, req.title)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation session not found.")
    return {"status": "success", "renamed": True}

@router.delete("/{conv_id}")
def delete_conversation_session(conv_id: str):
    success = conversation_store.delete_conversation(conv_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation session not found.")
    return {"status": "success", "deleted": True}
