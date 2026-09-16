import uuid
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from backend.memory.database import get_db_connection

logger = logging.getLogger("jarvis.conversations")

class ConversationStore:
    def get_all_conversations(self) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM conversations ORDER BY updated_at DESC")
            rows = cursor.fetchall()
            result = []
            for r in rows:
                conv = dict(r)
                conv["createdAt"] = conv.get("created_at")
                conv["updatedAt"] = conv.get("updated_at")
                result.append(conv)
            return result
        finally:
            conn.close()

    def get_conversation(self, conv_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
            row = cursor.fetchone()
            if not row:
                return None
            conv = dict(row)
            conv["createdAt"] = conv.get("created_at")
            conv["updatedAt"] = conv.get("updated_at")

            # Fetch messages
            cursor.execute("SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC", (conv_id,))
            msg_rows = cursor.fetchall()
            messages = []
            for mr in msg_rows:
                m = dict(mr)
                try:
                    steps = json.loads(m.get("steps_json", "[]"))
                except Exception:
                    steps = []
                messages.append({
                    "id": m["id"],
                    "sender": m["sender"],
                    "text": m["content"],
                    "content": m["content"],
                    "role": "assistant" if m["sender"] == "JARVIS" else "user",
                    "intent": m.get("intent"),
                    "timestamp": m["timestamp"],
                    "steps": steps,
                    "isError": bool(m.get("is_error", 0))
                })
            conv["messages"] = messages
            return conv
        finally:
            conn.close()

    def create_conversation(self, title: str = "New Chat", conv_id: Optional[str] = None) -> Dict[str, Any]:
        cid = conv_id or str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
                (cid, title, now_iso, now_iso)
            )
            conn.commit()
            return {
                "id": cid,
                "title": title,
                "createdAt": now_iso,
                "updatedAt": now_iso,
                "messages": []
            }
        finally:
            conn.close()

    def add_message(self, conv_id: str, sender: str, content: str, intent: Optional[str] = None, steps: Optional[List[Dict[str, Any]]] = None, is_error: bool = False) -> Dict[str, Any]:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            # Ensure conversation exists
            cursor.execute("SELECT id FROM conversations WHERE id = ?", (conv_id,))
            if not cursor.fetchone():
                now_init = datetime.now(timezone.utc).isoformat()
                cursor.execute(
                    "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
                    (conv_id, "Conversation " + conv_id[:8], now_init, now_init)
                )

            msg_id = str(uuid.uuid4())
            now_iso = datetime.now(timezone.utc).isoformat()
            steps_json = json.dumps(steps or [])

            cursor.execute(
                """
                INSERT INTO messages (id, conversation_id, sender, content, intent, timestamp, steps_json, is_error)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (msg_id, conv_id, sender, content, intent, now_iso, steps_json, 1 if is_error else 0)
            )

            # Update conversation timestamp & auto-title if it's the first user message
            cursor.execute("SELECT COUNT(*) as cnt FROM messages WHERE conversation_id = ?", (conv_id,))
            cnt = cursor.fetchone()["cnt"]
            if cnt <= 2 and sender == "USER":
                title_preview = (content[:32] + "...") if len(content) > 32 else content
                cursor.execute(
                    "UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?",
                    (title_preview, now_iso, conv_id)
                )
            else:
                cursor.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (now_iso, conv_id))

            conn.commit()
            return {
                "id": msg_id,
                "conversation_id": conv_id,
                "sender": sender,
                "text": content,
                "content": content,
                "intent": intent,
                "timestamp": now_iso,
                "steps": steps or [],
                "isError": is_error
            }
        finally:
            conn.close()

    def rename_conversation(self, conv_id: str, new_title: str) -> bool:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_iso = datetime.now(timezone.utc).isoformat()
            cursor.execute(
                "UPDATE conversations SET title = ?, updated_at = ? WHERE id = ?",
                (new_title, now_iso, conv_id)
            )
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

    def delete_conversation(self, conv_id: str) -> bool:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM messages WHERE conversation_id = ?", (conv_id,))
            cursor.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

    def search_conversations(self, query: str) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            like_query = f"%{query}%"
            cursor.execute(
                """
                SELECT DISTINCT c.* FROM conversations c
                LEFT JOIN messages m ON c.id = m.conversation_id
                WHERE c.title LIKE ? OR m.content LIKE ?
                ORDER BY c.updated_at DESC
                """,
                (like_query, like_query)
            )
            rows = cursor.fetchall()
            return [{"id": r["id"], "title": r["title"], "createdAt": r["created_at"], "updatedAt": r["updated_at"]} for r in rows]
        finally:
            conn.close()

    def get_recent_history_for_prompt(self, conv_id: str, limit: int = 8) -> List[Dict[str, str]]:
        """Returns message list formatted for LLM prompts"""
        conv = self.get_conversation(conv_id)
        if not conv or not conv.get("messages"):
            return []
        msgs = conv["messages"][-limit:]
        return [{"role": "assistant" if m["sender"] == "JARVIS" else "user", "content": m["text"]} for m in msgs]

conversation_store = ConversationStore()
