import os
import sys
import subprocess
import logging
import ctypes
import urllib.parse
import webbrowser
from pathlib import Path
from typing import Dict, Any, Optional
import psutil
from backend.tools.registry import tool_registry

logger = logging.getLogger("jarvis.tools.system_ops")

# Comprehensive map of apps, websites, and Windows URI schemes
KNOWN_TARGETS = {
    # Popular Websites
    "youtube": "https://www.youtube.com",
    "ইউটিউব": "https://www.youtube.com",
    "google": "https://www.google.com",
    "গুগল": "https://www.google.com",
    "facebook": "https://www.facebook.com",
    "ফেসবুক": "https://www.facebook.com",
    "github": "https://www.github.com",
    "chatgpt": "https://chatgpt.com",
    "chat gpt": "https://chatgpt.com",
    "openai": "https://chatgpt.com",
    "gmail": "https://mail.google.com",
    "mail": "https://mail.google.com",
    "whatsapp": "https://web.whatsapp.com",
    "twitter": "https://x.com",
    "x": "https://x.com",
    "instagram": "https://www.instagram.com",
    "ইনস্টাগ্রাম": "https://www.instagram.com",
    "linkedin": "https://www.linkedin.com",
    "reddit": "https://www.reddit.com",
    "netflix": "https://www.netflix.com",
    "amazon": "https://www.amazon.com",
    "wikipedia": "https://www.wikipedia.org",
    "spotify web": "https://open.spotify.com",
    "discord web": "https://discord.com/app",
    "notion web": "https://www.notion.so",
    "figma": "https://www.figma.com",
    "maps": "https://www.google.com/maps",
    "google maps": "https://www.google.com/maps",
    "translate": "https://translate.google.com",
    "google translate": "https://translate.google.com",
    "drive": "https://drive.google.com",
    "google drive": "https://drive.google.com",

    # Windows Applications & Executables
    "chrome": "chrome",
    "google chrome": "chrome",
    "browser": "chrome",
    "edge": "msedge",
    "microsoft edge": "msedge",
    "notepad": "notepad",
    "নোটপ্যাড": "notepad",
    "calculator": "calc",
    "calc": "calc",
    "ক্যালকুলেটর": "calc",
    "explorer": "explorer",
    "file explorer": "explorer",
    "files": "explorer",
    "my computer": "explorer",
    "cmd": "cmd",
    "command prompt": "cmd",
    "powershell": "powershell",
    "terminal": "wt",
    "windows terminal": "wt",
    "vscode": "code",
    "code": "code",
    "vs code": "code",
    "spotify": "spotify",
    "paint": "mspaint",
    "ms paint": "mspaint",
    "task manager": "taskmgr",
    "taskmgr": "taskmgr",
    "control panel": "control",
    "settings": "ms-settings:",
    "সেটিংস": "ms-settings:",
    "camera": "microsoft.windows.camera:",
    "ক্যামেরা": "microsoft.windows.camera:",
    "snip": "snippingtool",
    "snipping tool": "snippingtool",
    "word": "winword",
    "excel": "excel",
    "powerpoint": "powerpnt"
}

def is_url_or_domain(target: str) -> bool:
    """Checks if a string is a web URL or domain name."""
    t = target.strip().lower()
    if t.startswith("http://") or t.startswith("https://") or t.startswith("www."):
        return True
    tlds = [".com", ".org", ".net", ".io", ".ai", ".co", ".bd", ".dev", ".app", ".gov", ".edu", ".info", ".me", ".tv"]
    return any(t.endswith(tld) or f"{tld}/" in t for tld in tlds)

def open_url_in_browser(url: str) -> bool:
    """
    Opens a URL in the user's browser reliably on Windows.
    Uses multi-stage fallback (direct browser executables, PowerShell Start-Process, cmd start, webbrowser).
    """
    clean_url = url.strip()
    if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
        clean_url = f"https://{clean_url}"

    # 1. Primary: Direct browser execution (Chrome / Edge / Brave / Firefox) - most reliable in background/GUI
    browser_candidates = [
        os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe"),
        os.path.expandvars(r"%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe"),
        os.path.expandvars(r"%ProgramFiles%\Mozilla Firefox\firefox.exe"),
    ]
    for b_path in browser_candidates:
        if os.path.exists(b_path):
            try:
                subprocess.Popen([b_path, clean_url], shell=False)
                return True
            except Exception as e:
                logger.debug(f"Direct browser launch ({b_path}) failed: {e}")

    # 2. PowerShell Start-Process
    try:
        cmd = ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", f'Start-Process "{clean_url}"']
        proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        proc.wait(timeout=3)
        if proc.returncode == 0:
            return True
    except Exception as e:
        logger.debug(f"PowerShell Start-Process failed: {e}")

    # 3. Cmd start
    try:
        subprocess.Popen(f'cmd.exe /c start "" "{clean_url}"', shell=True)
        return True
    except Exception as e:
        logger.debug(f"cmd start failed: {e}")

    # 4. Standard Python webbrowser
    try:
        if webbrowser.open(clean_url):
            return True
    except Exception as e:
        logger.debug(f"webbrowser.open failed: {e}")

    return False

def launch_app(app_name: str) -> str:
    """
    Launches an application, website, folder, or Windows URI scheme reliably.
    Directly opens URLs in the user's default browser window.
    """
    clean_name = app_name.strip().lower()
    
    # Check if known target
    target = KNOWN_TARGETS.get(clean_name, clean_name)

    # Check for direct URL
    if target.startswith("http://") or target.startswith("https://") or is_url_or_domain(target):
        url = target if target.startswith("http") else f"https://{target}"
        if open_url_in_browser(url):
            return f"Opened website: {url}"
        return f"Failed to open '{url}'"

    # Check for Windows URI scheme (e.g. ms-settings:, microsoft.windows.camera:)
    if ":" in target and not Path(target).is_absolute():
        try:
            cmd = ["powershell.exe", "-NoProfile", "-Command", f'Start-Process "{target}"']
            subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return f"Launched Windows service: {target}"
        except Exception as e:
            return f"Failed to open '{target}': {e}"

    # Try launching local application / executable
    try:
        # Check standard common app executables
        common_apps = {
            "calc": "calc.exe",
            "calculator": "calc.exe",
            "notepad": "notepad.exe",
            "mspaint": "mspaint.exe",
            "paint": "mspaint.exe",
            "explorer": "explorer.exe",
            "taskmgr": "taskmgr.exe",
            "cmd": "cmd.exe",
            "powershell": "powershell.exe",
            "code": "code",
            "vscode": "code",
            "chrome": os.path.expandvars(r"%ProgramFiles%\Google\Chrome\Application\chrome.exe"),
            "msedge": os.path.expandvars(r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"),
            "spotify": os.path.expandvars(r"%APPDATA%\Spotify\Spotify.exe"),
        }
        
        exe = common_apps.get(target, target)
        if isinstance(exe, str) and os.path.exists(exe):
            subprocess.Popen([exe], shell=False)
            return f"Launched application '{app_name}' successfully."

        # Try PowerShell Start-Process
        cmd = ["powershell.exe", "-NoProfile", "-Command", f'Start-Process "{target}"']
        proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return f"Launched application '{app_name}' successfully."
    except Exception:
        # Fallback: Search on Google if application not found on local PC
        try:
            search_url = f"https://www.google.com/search?q={urllib.parse.quote(app_name)}"
            open_url_in_browser(search_url)
            return f"Could not find local application '{app_name}'. Opened search in browser."
        except Exception as e:
            return f"Failed to launch '{app_name}': {e}"

def search_youtube(query: str) -> str:
    """Searches and plays videos/music on YouTube in the user's browser."""
    encoded = urllib.parse.quote_plus(query.strip())
    url = f"https://www.youtube.com/results?search_query={encoded}"
    try:
        if open_url_in_browser(url):
            return f"Opened YouTube search for: '{query}'"
        return f"Failed to search YouTube for: '{query}'"
    except Exception as e:
        logger.error(f"Error launching YouTube search: {e}")
        return f"Failed to search YouTube: {e}"

def search_google(query: str) -> str:
    """Performs a Google Search directly in the user's browser."""
    encoded = urllib.parse.quote_plus(query.strip())
    url = f"https://www.google.com/search?q={encoded}"
    try:
        if open_url_in_browser(url):
            return f"Opened Google search for: '{query}'"
        return f"Failed to search Google for: '{query}'"
    except Exception as e:
        logger.error(f"Error launching Google search: {e}")
        return f"Failed to search Google: {e}"

def control_window(action: str = "minimize_all") -> str:
    """Manages active Windows and desktop display states."""
    import pyautogui
    act = action.lower().strip()
    try:
        if act in ["minimize_all", "desktop", "show_desktop"]:
            pyautogui.hotkey('win', 'd')
            return "Toggled desktop display / minimized all windows."
        elif act in ["maximize", "max"]:
            pyautogui.hotkey('win', 'up')
            return "Maximized active window."
        elif act in ["restore", "minimize_active", "down"]:
            pyautogui.hotkey('win', 'down')
            return "Restored/minimized active window."
        elif act in ["close_window", "close", "exit"]:
            pyautogui.hotkey('alt', 'f4')
            return "Closed active window."
        elif act in ["switch_app", "next_window", "alt_tab"]:
            pyautogui.hotkey('alt', 'tab')
            return "Switched active window."
        return f"Window control '{action}' processed."
    except Exception as e:
        return f"Window control error: {e}"

def kill_app(process_name: str) -> str:
    """Terminates a running process by name."""
    clean = process_name.lower().replace(".exe", "")
    terminated = 0
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            if clean in proc.info['name'].lower():
                proc.terminate()
                terminated += 1
        except Exception:
            continue
    if terminated > 0:
        return f"Terminated {terminated} process(es) matching '{process_name}'."
    return f"No running processes found matching '{process_name}'."

def control_volume(action: str = "up", step: int = 5) -> str:
    """Controls Windows system volume (up, down, mute, unmute) via native Win32 virtual keys."""
    action = action.lower().strip()
    VK_VOLUME_MUTE = 0xAD
    VK_VOLUME_DOWN = 0xAE
    VK_VOLUME_UP = 0xAF

    try:
        if action in ["up", "increase"]:
            for _ in range(max(1, step // 2)):
                ctypes.windll.user32.keybd_event(VK_VOLUME_UP, 0, 0, 0)
                ctypes.windll.user32.keybd_event(VK_VOLUME_UP, 0, 2, 0)
            return "Increased system volume."
        elif action in ["down", "decrease"]:
            for _ in range(max(1, step // 2)):
                ctypes.windll.user32.keybd_event(VK_VOLUME_DOWN, 0, 0, 0)
                ctypes.windll.user32.keybd_event(VK_VOLUME_DOWN, 0, 2, 0)
            return "Decreased system volume."
        elif action in ["mute", "unmute", "toggle"]:
            ctypes.windll.user32.keybd_event(VK_VOLUME_MUTE, 0, 0, 0)
            ctypes.windll.user32.keybd_event(VK_VOLUME_MUTE, 0, 2, 0)
            return "Toggled volume mute."
        return "Volume command processed."
    except Exception as e:
        return f"Volume control notice: {e}"

def empty_recycle_bin() -> str:
    """Empties the Windows Recycle Bin completely."""
    try:
        # Win32 API SHEmptyRecycleBinW
        flags = 0x00000007 # SHERB_NOCONFIRMATION | SHERB_NOPROGRESSUI | SHERB_NOSOUND
        ret = ctypes.windll.shell32.SHEmptyRecycleBinW(None, None, flags)
        if ret == 0 or ret == -2147418113: # 0 = Success, S_OK
            return "Recycle Bin emptied successfully."
        # Fallback to PowerShell
        subprocess.run(["powershell", "-NoProfile", "-Command", "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"], capture_output=True)
        return "Recycle Bin emptied successfully."
    except Exception as e:
        return f"Recycle Bin purge notice: {e}"

def open_folder(folder_name: str = "desktop") -> str:
    """Opens a system directory like Desktop, Downloads, Documents, Pictures, or custom path."""
    low = folder_name.lower().strip()
    home = Path.home()
    
    path_map = {
        "desktop": home / "Desktop",
        "ডেস্কটপ": home / "Desktop",
        "downloads": home / "Downloads",
        "ডাউনলোড": home / "Downloads",
        "ডাউনলোডস": home / "Downloads",
        "documents": home / "Documents",
        "ডকুমেন্টস": home / "Documents",
        "pictures": home / "Pictures",
        "ছবি": home / "Pictures",
        "photos": home / "Pictures",
        "music": home / "Music",
        "গান": home / "Music",
        "videos": home / "Videos",
        "ভিডিও": home / "Videos",
        "c": Path("C:\\"),
        "c drive": Path("C:\\"),
        "d": Path("D:\\"),
        "d drive": Path("D:\\")
    }
    
    target_path = path_map.get(low)
    if not target_path:
        # Check if user provided an exact path
        p = Path(folder_name).expanduser()
        if p.exists():
            target_path = p
        else:
            target_path = home / "Desktop"

    try:
        os.system(f'explorer "{target_path}"')
        return f"Opened folder: '{target_path}'."
    except Exception as e:
        return f"Failed to open folder '{folder_name}': {e}"

def set_screen_brightness(percent: int) -> str:
    """Adjusts display brightness on supported Windows laptops/displays (0-100%)."""
    val = max(0, min(100, percent))
    cmd = f"(Get-WmiObject -Namespace root/WMI -Class WmiMonitorBrightnessMethods).WmiSetBrightness(1, {val})"
    try:
        subprocess.run(["powershell", "-NoProfile", "-Command", cmd], capture_output=True, timeout=5)
        return f"Screen brightness adjusted to {val}%."
    except Exception as e:
        return f"Brightness adjustment error: {e}"

def create_desktop_item(item_name: str, content: str = "", is_folder: bool = False) -> str:
    """Creates a new folder or file directly on the user's Desktop."""
    desktop = Path.home() / "Desktop"
    target = desktop / item_name
    try:
        if is_folder:
            target.mkdir(parents=True, exist_ok=True)
            return f"Created folder on Desktop: '{item_name}'."
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content or "Created by JARVIS Autonomous Core.", encoding="utf-8")
            return f"Created file on Desktop: '{item_name}'."
    except Exception as e:
        return f"Failed to create desktop item: {e}"

def system_power(action: str) -> str:
    """Controls system power states (lock, sleep, restart, shutdown, cancel)."""
    act = action.lower().strip()
    if act in ["lock", "লক"]:
        ctypes.windll.user32.LockWorkStation()
        return "Workstation locked successfully."
    elif act in ["sleep", "স্লিপ"]:
        os.system("rundll32.exe powrprof.dll,SetSuspendState 0,1,0")
        return "System placed in sleep mode."
    elif act in ["restart", "রিস্টার্ট", "রিবুট"]:
        os.system("shutdown /r /t 5 /c \"Restarting by JARVIS request\"")
        return "System restart initiated in 5 seconds."
    elif act in ["shutdown", "শাটডাউন", "বন্ধ"]:
        os.system("shutdown /s /t 15 /c \"Shutting down by JARVIS request\"")
        return "System shutdown initiated in 15 seconds."
    elif act in ["cancel", "cancel_shutdown", "বাতিল"]:
        os.system("shutdown /a")
        return "Scheduled shutdown/restart cancelled."
    return f"Unknown power action '{action}'."

# Register tools
tool_registry.register_tool("launch_app", "Launch an application or open a file/url in browser", launch_app)
tool_registry.register_tool("search_youtube", "Search and play videos or music on YouTube in browser", search_youtube)
tool_registry.register_tool("search_google", "Search query on Google directly in browser", search_google)
tool_registry.register_tool("control_window", "Minimize, maximize, restore, or switch windows", control_window)
tool_registry.register_tool("kill_app", "Terminate a running application by process name", kill_app, permission_level="elevated")
tool_registry.register_tool("control_volume", "Increase, decrease, or mute system audio volume", control_volume)
tool_registry.register_tool("system_power", "Lock, sleep, restart, or shutdown system", system_power, permission_level="critical")
tool_registry.register_tool("empty_recycle_bin", "Empty the Windows Recycle Bin", empty_recycle_bin)
tool_registry.register_tool("open_folder", "Open system folder (Desktop, Downloads, Documents, etc.)", open_folder)
tool_registry.register_tool("set_screen_brightness", "Adjust display brightness level", set_screen_brightness)
tool_registry.register_tool("create_desktop_item", "Create a folder or text file on Desktop", create_desktop_item)
