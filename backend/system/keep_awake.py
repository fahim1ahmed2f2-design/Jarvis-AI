import sys
import ctypes
import time
import logging
from typing import Dict, Any

logger = logging.getLogger("jarvis.system.keep_awake")

ES_CONTINUOUS = 0x80000000
ES_SYSTEM_REQUIRED = 0x00000001
ES_DISPLAY_REQUIRED = 0x00000002

class KeepAwakeService:
    def __init__(self):
        self.enabled = False
        self.keep_display_on = False
        self.last_heartbeat = time.time()

    def set_keep_awake(self, enabled: bool, keep_display_on: bool = False) -> Dict[str, Any]:
        self.enabled = enabled
        self.keep_display_on = keep_display_on
        self.last_heartbeat = time.time()

        if sys.platform == "win32":
            try:
                flags = ES_CONTINUOUS
                if enabled:
                    flags |= ES_SYSTEM_REQUIRED
                    if keep_display_on:
                        flags |= ES_DISPLAY_REQUIRED
                ctypes.windll.kernel32.SetThreadExecutionState(flags)
                logger.info(f"Keep-awake set to {enabled} (flags: {hex(flags)})")
            except Exception as e:
                logger.error(f"Error calling SetThreadExecutionState: {e}")

        return self.get_status()

    def get_status(self) -> Dict[str, Any]:
        return {
            "enabled": self.enabled,
            "running": self.enabled,
            "keep_display_on": self.keep_display_on,
            "platform": sys.platform,
            "last_heartbeat": self.last_heartbeat
        }

keep_awake_service = KeepAwakeService()
