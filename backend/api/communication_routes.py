from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.communication.contact_manager import contact_manager
from backend.communication.email_manager import email_manager

router = APIRouter(prefix="/communication", tags=["communication"])

class DraftEmailRequest(BaseModel):
    recipient: str
    body: str
    subject: Optional[str] = "Message from JARVIS"

class SendEmailRequest(BaseModel):
    draft_id: Optional[str] = None

@router.get("/contacts")
def get_contacts():
    contacts = contact_manager.get_contacts()
    return {"total": len(contacts), "contacts": contacts}

@router.get("/emails")
def get_emails():
    recent = email_manager.get_recent_emails()
    return {"recent_emails": recent, "active_draft": email_manager.active_draft}

@router.post("/emails/draft")
def draft_email(req: DraftEmailRequest):
    draft = email_manager.draft_email(recipient=req.recipient, body=req.body, subject=req.subject or "Message from JARVIS")
    return {"status": "success", "draft": draft}

@router.post("/emails/send")
def send_email(req: SendEmailRequest):
    res = email_manager.send_email(draft_id=req.draft_id)
    return res

@router.get("/emails/unread/summary")
def get_unread_summary():
    summary = email_manager.get_unread_summary()
    return {"summary": summary}
