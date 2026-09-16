import uuid
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from backend.memory.database import get_db_connection

logger = logging.getLogger("jarvis.user_tasks")

class UserTaskStore:
    def get_all_tasks(self, status: Optional[str] = None, query: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            sql = "SELECT * FROM user_tasks WHERE 1=1"
            params: list = []

            if status:
                st = status.strip().upper()
                if st in ("PENDING", "ACTIVE", "OPEN"):
                    sql += " AND status NOT IN ('COMPLETED', 'CANCELLED')"
                else:
                    sql += " AND status = ?"
                    params.append(st)
            if query:
                sql += " AND (title LIKE ? OR description LIKE ?)"
                params.extend([f"%{query}%", f"%{query}%"])

            sql += " ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, created_at DESC"
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            
            result = []
            for r in rows:
                item = dict(r)
                result.append({
                    "id": item["id"],
                    "title": item["title"],
                    "description": item.get("description", ""),
                    "priority": item.get("priority", "medium"),
                    "status": item.get("status", "TODO"),
                    "createdAt": item.get("created_at"),
                    "dueAt": item.get("due_at"),
                    "completedAt": item.get("completed_at")
                })
            return result
        finally:
            conn.close()

    def create_task(self, title: str, description: str = "", priority: str = "medium", due_at: Optional[str] = None) -> Dict[str, Any]:
        task_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO user_tasks (id, title, description, priority, status, created_at, due_at, completed_at)
                VALUES (?, ?, ?, ?, 'TODO', ?, ?, NULL)
                """,
                (task_id, title.strip(), description.strip(), priority.lower(), now_iso, due_at)
            )
            conn.commit()
            return {
                "id": task_id,
                "title": title.strip(),
                "description": description.strip(),
                "priority": priority.lower(),
                "status": "TODO",
                "createdAt": now_iso,
                "dueAt": due_at,
                "completedAt": None
            }
        finally:
            conn.close()

    def add_task(self, title: str, description: str = "", priority: str = "medium", due_at: Optional[str] = None) -> Dict[str, Any]:
        """Alias for create_task to support callers expecting add_task and maintain backward compatibility."""
        return self.create_task(title=title, description=description, priority=priority, due_at=due_at)

    def update_task(self, task_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM user_tasks WHERE id = ?", (task_id,))
            current = cursor.fetchone()
            if not current:
                return None

            title = updates.get("title", current["title"])
            description = updates.get("description", current["description"])
            priority = updates.get("priority", current["priority"]).lower()
            status = updates.get("status", current["status"]).upper()
            due_at = updates.get("dueAt", updates.get("due_at", current["due_at"]))
            completed_at = current["completed_at"]
            
            if status == "COMPLETED" and not completed_at:
                completed_at = datetime.now(timezone.utc).isoformat()
            elif status != "COMPLETED":
                completed_at = None

            cursor.execute(
                """
                UPDATE user_tasks
                SET title = ?, description = ?, priority = ?, status = ?, due_at = ?, completed_at = ?
                WHERE id = ?
                """,
                (title, description, priority, status, due_at, completed_at, task_id)
            )
            conn.commit()
            return {
                "id": task_id,
                "title": title,
                "description": description,
                "priority": priority,
                "status": status,
                "createdAt": current["created_at"],
                "dueAt": due_at,
                "completedAt": completed_at
            }
        finally:
            conn.close()

    def complete_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        return self.update_task(task_id, {"status": "COMPLETED"})

    def delete_task(self, task_id: str) -> bool:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM user_tasks WHERE id = ?", (task_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

    def clear_all(self) -> bool:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM user_tasks")
            conn.commit()
            return True
        finally:
            conn.close()

user_task_store = UserTaskStore()
