import time
import logging
from typing import List, Dict, Any
from datetime import datetime, timezone
from backend.assistant.reminder_engine import reminder_engine

logger = logging.getLogger("jarvis.assistant.notifications")

class NotificationCenter:
    def get_pending_notifications(self) -> List[Dict[str, Any]]:
        notifications = []
        now_epoch = time.time()

        # 1. Check due reminders
        reminders = reminder_engine.get_reminders(status="pending")
        for r in reminders:
            if r["due_epoch"] <= now_epoch:
                notifications.append({
                    "type": "reminder",
                    "id": r["id"],
                    "title": r["title"],
                    "due_timestamp": r["due_timestamp"],
                    "speech": f"Sir, reminder: {r['title']}",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })

        # 2. Check completed timers
        timers = reminder_engine.get_timers()
        for t in timers:
            if t.get("remaining_seconds", 0) <= 0 and t.get("status") == "completed":
                notifications.append({
                    "type": "timer",
                    "id": t["id"],
                    "label": t["label"],
                    "speech": f"Sir, timer for {t['label']} has finished.",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })

        return notifications

notification_center = NotificationCenter()
