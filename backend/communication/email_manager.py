import uuid
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from backend.memory.database import get_db_connection

logger = logging.getLogger("jarvis.communication.emails")

class EmailManager:
    def __init__(self):
        self.active_draft: Optional[Dict[str, Any]] = None

    def get_recent_emails(self, limit: int = 10) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM emails ORDER BY timestamp DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    def draft_email(self, recipient: str, body: str, subject: str = "Message from JARVIS") -> Dict[str, Any]:
        draft_id = str(uuid.uuid4())
        draft = {
            "id": draft_id,
            "recipient": recipient,
            "subject": subject,
            "body": body,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        self.active_draft = draft
        return draft

    def send_email(self, draft_id: Optional[str] = None) -> Dict[str, Any]:
        if not self.active_draft:
            return {"success": False, "message": "No active email draft found."}
        draft = self.active_draft
        self.active_draft = None
        # Mock / extensible delivery
        return {
            "success": True,
            "message": f"Email successfully dispatched to '{draft['recipient']}'.",
            "email": draft
        }

    def get_unread_summary(self) -> str:
        emails = self.get_recent_emails(limit=5)
        unread = [e for e in emails if e.get("is_unread", 0) == 1]
        if not unread:
            return "You have no unread messages in your primary inbox, Sir."
        return f"You have {len(unread)} unread emails. Latest from {unread[0]['sender_name']}: '{unread[0]['subject']}'."

email_manager = EmailManager()
