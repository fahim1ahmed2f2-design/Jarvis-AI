import uuid
import time
import re
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from backend.memory.database import get_db_connection

logger = logging.getLogger("jarvis.assistant.reminders")

class ReminderEngine:
    def create_reminder(self, title: str, time_expression: str = "in 10 minutes", recurring: bool = False, recurrence_rule: str = "none") -> Dict[str, Any]:
        rem_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        now_epoch = time.time()

        # Parse relative time expression
        seconds_offset = 600  # Default 10 mins
        match = re.search(r'(\d+)\s*(second|sec|minute|min|hour|hr|day)', time_expression.lower())
        if match:
            num = int(match.group(1))
            unit = match.group(2)
            if "sec" in unit:
                seconds_offset = num
            elif "min" in unit:
                seconds_offset = num * 60
            elif "hour" in unit or "hr" in unit:
                seconds_offset = num * 3600
            elif "day" in unit:
                seconds_offset = num * 86400

        due_epoch = now_epoch + seconds_offset
        due_dt = datetime.fromtimestamp(due_epoch, timezone.utc)
        due_iso = due_dt.isoformat()
        now_iso = now.isoformat()

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO reminders (id, title, due_timestamp, due_epoch, recurring, recurrence_rule, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
                """,
                (rem_id, title.strip(), due_iso, due_epoch, 1 if recurring else 0, recurrence_rule, now_iso)
            )
            conn.commit()
            return {
                "id": rem_id,
                "title": title.strip(),
                "due_timestamp": due_iso,
                "due_epoch": due_epoch,
                "recurring": recurring,
                "recurrence_rule": recurrence_rule,
                "status": "pending",
                "created_at": now_iso
            }
        finally:
            conn.close()

    def get_reminders(self, status: str = "pending") -> List[Dict[str, Any]]:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            if status == "all":
                cursor.execute("SELECT * FROM reminders ORDER BY due_epoch ASC")
            else:
                cursor.execute("SELECT * FROM reminders WHERE status = ? ORDER BY due_epoch ASC", (status,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    def delete_reminder(self, reminder_id: str) -> bool:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM reminders WHERE id = ?", (reminder_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

    def clear_all(self) -> bool:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM reminders")
            conn.commit()
            return True
        finally:
            conn.close()

    def snooze_reminder(self, reminder_id: str, minutes: int = 10) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            new_epoch = time.time() + (minutes * 60)
            new_iso = datetime.fromtimestamp(new_epoch, timezone.utc).isoformat()
            cursor.execute(
                "UPDATE reminders SET due_epoch = ?, due_timestamp = ?, status = 'pending' WHERE id = ?",
                (new_epoch, new_iso, reminder_id)
            )
            conn.commit()
            cursor.execute("SELECT * FROM reminders WHERE id = ?", (reminder_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    def dismiss_reminder(self, reminder_id: str) -> bool:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("UPDATE reminders SET status = 'completed' WHERE id = ?", (reminder_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

    # ── Timers ──
    def create_timer(self, duration_seconds: float, label: str = "Timer") -> Dict[str, Any]:
        timer_id = str(uuid.uuid4())
        now_epoch = time.time()
        end_epoch = now_epoch + duration_seconds
        now_iso = datetime.now(timezone.utc).isoformat()

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO timers (id, label, duration_seconds, remaining_seconds, start_epoch, end_epoch, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 'running', ?)
                """,
                (timer_id, label, duration_seconds, duration_seconds, now_epoch, end_epoch, now_iso)
            )
            conn.commit()
            return {
                "id": timer_id,
                "label": label,
                "duration_seconds": duration_seconds,
                "remaining_seconds": duration_seconds,
                "start_epoch": now_epoch,
                "end_epoch": end_epoch,
                "status": "running",
                "created_at": now_iso
            }
        finally:
            conn.close()

    def set_timer(self, duration_seconds: float = 0, label: str = "Timer", seconds: Optional[float] = None) -> Dict[str, Any]:
        """Convenience alias for create_timer supporting both duration_seconds and seconds."""
        dur = seconds if seconds is not None else duration_seconds
        return self.create_timer(duration_seconds=dur, label=label)

    def get_timers(self) -> List[Dict[str, Any]]:
        now_epoch = time.time()
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM timers WHERE status = 'running' ORDER BY created_at DESC")
            rows = cursor.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                rem = max(0.0, item["end_epoch"] - now_epoch)
                item["remaining_seconds"] = round(rem, 1)
                if rem == 0 and item["status"] == "running":
                    item["status"] = "completed"
                    cursor.execute("UPDATE timers SET status = 'completed', remaining_seconds = 0 WHERE id = ?", (item["id"],))
                results.append(item)
            conn.commit()
            return results
        finally:
            conn.close()

    def stop_timer(self, timer_id: str) -> bool:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("UPDATE timers SET status = 'canceled' WHERE id = ?", (timer_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

reminder_engine = ReminderEngine()
