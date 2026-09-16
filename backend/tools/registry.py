import logging
from typing import Dict, Any, Callable, List, Optional

logger = logging.getLogger("jarvis.tools.registry")

class ToolRegistry:
    def __init__(self):
        self.tools: Dict[str, Dict[str, Any]] = {}

    def register_tool(self, name: str, description: str, func: Callable, permission_level: str = "normal", timeout_seconds: int = 15):
        self.tools[name] = {
            "name": name,
            "description": description,
            "func": func,
            "permission_level": permission_level,  # "normal", "elevated", "critical"
            "timeout_seconds": timeout_seconds
        }
        logger.debug(f"Registered tool: {name}")

    def get_tool(self, name: str) -> Optional[Dict[str, Any]]:
        return self.tools.get(name)

    def list_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": t["name"],
                "description": t["description"],
                "permission_level": t["permission_level"],
                "timeout_seconds": t["timeout_seconds"]
            }
            for t in self.tools.values()
        ]

    def execute_tool(self, name: str, **kwargs) -> Dict[str, Any]:
        tool = self.tools.get(name)
        if not tool:
            return {"success": False, "error": f"Tool '{name}' not found."}
        try:
            res = tool["func"](**kwargs)
            return {"success": True, "result": res}
        except Exception as e:
            logger.error(f"Error executing tool '{name}': {e}")
            return {"success": False, "error": str(e)}

tool_registry = ToolRegistry()
