import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
desktop = Path(os.environ.get("USERPROFILE", os.path.expanduser("~"))) / "Desktop"
temp_vbs = Path(os.environ.get("TEMP", str(ROOT / "data" / "temp"))) / "create_jarvis_shortcuts.vbs"

run_bat = ROOT / "run.bat"
silent_vbs = ROOT / "start_jarvis_silent.vbs"

vbs_content = f"""
Set oWS = CreateObject("WScript.Shell")
sDesktop = oWS.SpecialFolders("Desktop")

Set oLink = oWS.CreateShortcut(sDesktop & "\\JARVIS.lnk")
oLink.TargetPath = "{str(run_bat).replace('\\', '\\\\')}"
oLink.WorkingDirectory = "{str(ROOT).replace('\\', '\\\\')}"
oLink.Description = "JARVIS AI System"
oLink.Save

Set oLink2 = oWS.CreateShortcut(sDesktop & "\\JARVIS 24x7 Silent.lnk")
oLink2.TargetPath = "{str(silent_vbs).replace('\\', '\\\\')}"
oLink2.WorkingDirectory = "{str(ROOT).replace('\\', '\\\\')}"
oLink2.Description = "JARVIS AI 24x7 Silent Background"
oLink2.Save
"""

temp_vbs.write_text(vbs_content, encoding="utf-8")
subprocess.run(["cscript", "//nologo", str(temp_vbs)], check=True)
if temp_vbs.exists():
    temp_vbs.unlink()

print(f"Shortcuts created successfully on Desktop: {desktop}")

