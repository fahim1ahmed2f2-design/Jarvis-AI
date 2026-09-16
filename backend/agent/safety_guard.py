import re
from typing import Dict, Any, Tuple

CRITICAL_PATTERNS = [
    r"\b(shutdown|power off|reboot|restart)\b",
    r"\b(format [a-zA-Z]:)\b",
    r"\b(delete all|remove everything|wipe all)\b",
    r"\b(kill process|terminate system)\b"
]

class SafetyGuard:
    def check_safety(self, tool_name: str, arguments: Dict[str, Any], user_command: str) -> Tuple[bool, bool, str]:
        """
        Returns (is_safe: bool, requires_confirmation: bool, warning_message: str)
        """
        if tool_name == "system_power":
            act = arguments.get("action", "")
            if act in ["shutdown", "restart"]:
                return True, True, f"System {act} requires user confirmation."

        for pattern in CRITICAL_PATTERNS:
            if re.search(pattern, user_command, re.IGNORECASE):
                if "delete all data" in user_command.lower():
                    return True, True, "Destructive wipe command requires explicit confirmation."

        return True, False, ""

safety_guard = SafetyGuard()
