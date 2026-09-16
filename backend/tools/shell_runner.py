import subprocess
import logging
from typing import Dict, Any
from backend.tools.registry import tool_registry

logger = logging.getLogger("jarvis.tools.shell_runner")

BLOCKED_COMMANDS = [
    "format ", "del /f /s /q c:", "rmdir /s /q c:", "rd /s /q c:",
    ":(){ :|:& };:", "diskpart"
]

def run_shell_command(command: str, timeout_seconds: int = 15) -> str:
    """Runs a PowerShell command and returns the standard output / error."""
    clean_cmd = command.strip()
    low_cmd = clean_cmd.lower()
    
    for blocked in BLOCKED_COMMANDS:
        if blocked in low_cmd:
            return f"Security Exception: Command '{command}' is blocked by JARVIS safety protocol."

    try:
        proc = subprocess.run(
            ["powershell", "-NoProfile", "-NonInteractive", "-Command", clean_cmd],
            capture_output=True,
            text=True,
            timeout=timeout_seconds
        )
        stdout = proc.stdout.strip()
        stderr = proc.stderr.strip()

        if proc.returncode != 0 and stderr:
            return f"[Exit {proc.returncode}] Error:\n{stderr[:2000]}"
        elif stdout:
            if len(stdout) > 3000:
                return stdout[:3000] + f"\n... [Output truncated {len(stdout) - 3000} characters]"
            return stdout
        else:
            return f"Command executed successfully (Exit Code {proc.returncode})."
    except subprocess.TimeoutExpired:
        return f"Execution timed out after {timeout_seconds} seconds."
    except Exception as e:
        return f"Failed to execute command: {e}"

tool_registry.register_tool("run_shell_command", "Execute a safe PowerShell / CMD command", run_shell_command, permission_level="elevated")
