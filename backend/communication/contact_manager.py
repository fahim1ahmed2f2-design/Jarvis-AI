import uuid
import logging
from typing import List, Dict, Any, Optional
from backend.memory.database import get_db_connection

logger = logging.getLogger("jarvis.communication.contacts")

class ContactManager:
    def get_contacts(self) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM contacts ORDER BY name ASC")
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    def add_contact(self, name: str, email: str = "", phone: str = "", telegram: str = "", whatsapp: str = "", notes: str = "") -> Dict[str, Any]:
        c_id = str(uuid.uuid4())
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO contacts (id, name, email, phone, telegram_handle, whatsapp_id, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (c_id, name.strip(), email.strip(), phone.strip(), telegram.strip(), whatsapp.strip(), notes.strip())
            )
            conn.commit()
            return {
                "id": c_id,
                "name": name.strip(),
                "email": email.strip(),
                "phone": phone.strip(),
                "telegram_handle": telegram.strip(),
                "whatsapp_id": whatsapp.strip(),
                "notes": notes.strip()
            }
        finally:
            conn.close()

contact_manager = ContactManager()
