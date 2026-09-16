import uuid
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from backend.memory.database import get_db_connection

logger = logging.getLogger("jarvis.agent.history")

class ActionHistoryLogger:
    def log_action(self, user_command: str, tool: str, status: str, result: str, duration_ms: float = 0.0, arguments: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        rec_id = str(uuid.uuid4())
        now = datetime.now()
        now_iso = now.isoformat()
        time_disp = now.strftime("%I:%M:%S %p")
        args_json = json.dumps(arguments or {})

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO action_history (id, timestamp, time_display, user_command, tool, status, result, duration_ms, arguments_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (rec_id, now_iso, time_disp, user_command, tool, status, result, duration_ms, args_json)
            )
            conn.commit()
            return {
                "id": rec_id,
                "timestamp": now_iso,
                "time_display": time_disp,
                "user_command": user_command,
                "tool": tool,
                "status": status,
                "result": result,
                "duration_ms": duration_ms,
                "arguments": arguments or {}
            }
        except Exception as e:
            logger.error(f"Failed to log action history: {e}")
            return {}
        finally:
            conn.close()

    def get_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM action_history ORDER BY timestamp DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                try:
                    args = json.loads(item.get("arguments_json", "{}"))
                except Exception:
                    args = {}
                results.append({
                    "id": item["id"],
                    "timestamp": item["timestamp"],
                    "time_display": item["time_display"],
                    "user_command": item["user_command"],
                    "tool": item["tool"],
                    "status": item["status"],
                    "result": item["result"],
                    "duration_ms": item["duration_ms"],
                    "arguments": args
                })
            return results
        finally:
            conn.close()

    def clear_history(self) -> bool:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM action_history")
            conn.commit()
            return True
        finally:
            conn.close()

action_history_logger = ActionHistoryLogger()
