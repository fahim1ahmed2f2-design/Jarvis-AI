import os
import sys
import subprocess
import logging
from pathlib import Path
from typing import Dict, Any
from backend.config import PROJECT_ROOT

logger = logging.getLogger("jarvis.system.autostart")

STARTUP_DIR = Path(os.environ.get("APPDATA", "")) / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup"
SHORTCUT_FILE = STARTUP_DIR / "JARVIS_24x7.lnk"

class AutostartManager:
    def get_status(self) -> Dict[str, Any]:
        bat_file = PROJECT_ROOT / "start_jarvis_24x7.bat"
        vbs_file = PROJECT_ROOT / "start_jarvis_silent.vbs"
        shortcut_installed = SHORTCUT_FILE.exists()
        return {
            "autostart_enabled": shortcut_installed,
            "shortcut_installed": shortcut_installed,
            "shortcut_path": str(SHORTCUT_FILE),
            "launcher_vbs": str(vbs_file),
            "launcher_bat": str(bat_file),
            "vbs_exists": vbs_file.exists(),
            "bat_exists": bat_file.exists()
        }

    def toggle_autostart(self, enabled: bool) -> Dict[str, Any]:
        logger.info(f"Autostart toggle requested: {enabled}")
        vbs_file = PROJECT_ROOT / "start_jarvis_silent.vbs"
        temp_script = PROJECT_ROOT / "data" / "temp" / "toggle_autostart.vbs"
        temp_script.parent.mkdir(parents=True, exist_ok=True)

        if enabled:
            try:
                STARTUP_DIR.mkdir(parents=True, exist_ok=True)
                vbs_code = f"""
Set oWS = CreateObject("WScript.Shell")
Set oLink = oWS.CreateShortcut("{str(SHORTCUT_FILE).replace('\\', '\\\\')}")
oLink.TargetPath = "{str(vbs_file).replace('\\', '\\\\')}"
oLink.WorkingDirectory = "{str(PROJECT_ROOT).replace('\\', '\\\\')}"
oLink.Description = "JARVIS AI 24x7 Background Assistant"
oLink.Save
"""
                temp_script.write_text(vbs_code, encoding="utf-8")
                subprocess.run(["cscript", "//nologo", str(temp_script)], check=True)
                logger.info(f"Created autostart shortcut at {SHORTCUT_FILE}")
            except Exception as e:
                logger.error(f"Failed to create autostart shortcut: {e}")
            finally:
                if temp_script.exists():
                    temp_script.unlink()
        else:
            try:
                if SHORTCUT_FILE.exists():
                    SHORTCUT_FILE.unlink()
                    logger.info(f"Removed autostart shortcut at {SHORTCUT_FILE}")
            except Exception as e:
                logger.error(f"Failed to remove autostart shortcut: {e}")

        return self.get_status()

autostart_manager = AutostartManager()

