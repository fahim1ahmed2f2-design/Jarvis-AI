from typing import Dict, Any
from backend.tools.registry import tool_registry

def set_reminder_tool(title: str, time_expression: str = "in 10 minutes") -> str:
    """Schedules a reminder for the assistant."""
    from backend.assistant.reminder_engine import reminder_engine
    res = reminder_engine.create_reminder(title=title, time_expression=time_expression)
    return f"Reminder set for '{title}' due at {res.get('due_timestamp')}."

def set_timer_tool(duration_seconds: int, label: str = "Timer") -> str:
    """Starts a countdown timer."""
    from backend.assistant.reminder_engine import reminder_engine
    res = reminder_engine.create_timer(duration_seconds=duration_seconds, label=label)
    return f"Timer started for {duration_seconds} seconds ('{label}')."

tool_registry.register_tool("set_reminder", "Schedule an assistant reminder at a specified time", set_reminder_tool)
tool_registry.register_tool("set_timer", "Start a countdown timer", set_timer_tool)
