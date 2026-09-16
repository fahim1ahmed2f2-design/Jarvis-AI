import uuid
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from backend.memory.database import get_db_connection

logger = logging.getLogger("jarvis.agent.tasks")

class TaskManager:
    def __init__(self):
        self.active_task: Optional[Dict[str, Any]] = None

    def get_active_task(self) -> Optional[Dict[str, Any]]:
        return self.active_task

    def create_task(self, goal: str, steps: List[Dict[str, Any]], requires_confirmation: bool = False) -> Dict[str, Any]:
        task_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        task = {
            "task_id": task_id,
            "goal": goal,
            "status": "waiting_confirmation" if requires_confirmation else "executing",
            "steps": steps,
            "current_step": 0,
            "requires_confirmation": requires_confirmation,
            "created_at": now_iso,
            "updated_at": now_iso,
            "duration_seconds": 0.0,
            "error_message": "",
            "result_summary": ""
        }
        self.active_task = task
        self._persist_task(task)
        return task

    def update_task_step(self, step_index: int, status: str, observation: str = "", error: str = ""):
        if not self.active_task:
            return
        if 0 <= step_index < len(self.active_task["steps"]):
            self.active_task["steps"][step_index]["status"] = status
            self.active_task["steps"][step_index]["observation"] = observation
            self.active_task["steps"][step_index]["error"] = error
            self.active_task["steps"][step_index]["verified"] = (status == "completed")
            self.active_task["current_step"] = step_index
            self.active_task["updated_at"] = datetime.now(timezone.utc).isoformat()
            self._persist_task(self.active_task)

    def complete_task(self, result_summary: str = ""):
        if not self.active_task:
            return
        self.active_task["status"] = "completed"
        self.active_task["result_summary"] = result_summary
        self.active_task["updated_at"] = datetime.now(timezone.utc).isoformat()
        self._persist_task(self.active_task)
        completed = self.active_task
        self.active_task = None
        return completed

    def fail_task(self, error_message: str):
        if not self.active_task:
            return
        self.active_task["status"] = "failed"
        self.active_task["error_message"] = error_message
        self.active_task["updated_at"] = datetime.now(timezone.utc).isoformat()
        self._persist_task(self.active_task)
        failed = self.active_task
        self.active_task = None
        return failed

    def cancel_task(self):
        if not self.active_task:
            return None
        self.active_task["status"] = "cancelled"
        self.active_task["updated_at"] = datetime.now(timezone.utc).isoformat()
        self._persist_task(self.active_task)
        cancelled = self.active_task
        self.active_task = None
        return cancelled

    def get_task_history(self, limit: int = 20) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM autonomous_tasks ORDER BY updated_at DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                try:
                    steps = json.loads(item.get("steps_json", "[]"))
                except Exception:
                    steps = []
                results.append({
                    "task_id": item["task_id"],
                    "goal": item["goal"],
                    "status": item["status"],
                    "steps": steps,
                    "current_step": item["current_step"],
                    "requires_confirmation": bool(item["requires_confirmation"]),
                    "created_at": item["created_at"],
                    "updated_at": item["updated_at"],
                    "duration_seconds": item["duration_seconds"],
                    "error_message": item["error_message"],
                    "result_summary": item["result_summary"]
                })
            return results
        finally:
            conn.close()

    def _persist_task(self, task: Dict[str, Any]):
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO autonomous_tasks (task_id, goal, status, steps_json, current_step, requires_confirmation, created_at, updated_at, duration_seconds, error_message, result_summary)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(task_id) DO UPDATE SET
                    status=excluded.status,
                    steps_json=excluded.steps_json,
                    current_step=excluded.current_step,
                    updated_at=excluded.updated_at,
                    error_message=excluded.error_message,
                    result_summary=excluded.result_summary
                """,
                (
                    task["task_id"],
                    task["goal"],
                    task["status"],
                    json.dumps(task["steps"]),
                    task["current_step"],
                    1 if task["requires_confirmation"] else 0,
                    task["created_at"],
                    task["updated_at"],
                    task.get("duration_seconds", 0.0),
                    task.get("error_message", ""),
                    task.get("result_summary", "")
                )
            )
            conn.commit()
        except Exception as e:
            logger.error(f"Error persisting autonomous task: {e}")
        finally:
            conn.close()

task_manager = TaskManager()
