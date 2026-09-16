from backend.tools.registry import tool_registry, ToolRegistry
import backend.tools.pc_control
import backend.tools.system_ops
import backend.tools.file_ops
import backend.tools.shell_runner
import backend.tools.web_search
import backend.tools.vision_ops
import backend.tools.memory_tools
import backend.tools.reminder_tools
import backend.tools.developer_tools
import backend.tools.network_tools
import backend.tools.diagnostics_tools
import backend.tools.media_tools
import backend.tools.live_data_tools
import backend.tools.smart_home_tools
import backend.tools.geo_tools
import backend.tools.knowledge_tools

__all__ = [
    "tool_registry",
    "ToolRegistry"
]
