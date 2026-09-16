import logging
import subprocess
import ctypes
from typing import Dict, Any

from backend.tools.registry import tool_registry

logger = logging.getLogger("jarvis.tools.media")

# Windows Virtual Key Codes for Media Keys
VK_MEDIA_NEXT_TRACK = 0xB0
VK_MEDIA_PREV_TRACK = 0xB1
VK_MEDIA_STOP = 0xB2
VK_MEDIA_PLAY_PAUSE = 0xB3
VK_VOLUME_MUTE = 0xAD
VK_VOLUME_DOWN = 0xAE
VK_VOLUME_UP = 0xAF

def media_key_action(action: str) -> Dict[str, Any]:
    """
    Emulates physical media keys on Windows keyboard:
    Actions: 'play_pause', 'next', 'previous', 'stop', 'mute', 'volume_up', 'volume_down'.
    """
    act = action.strip().lower()
    vk_map = {
        "play_pause": VK_MEDIA_PLAY_PAUSE,
        "play": VK_MEDIA_PLAY_PAUSE,
        "pause": VK_MEDIA_PLAY_PAUSE,
        "next": VK_MEDIA_NEXT_TRACK,
        "next_track": VK_MEDIA_NEXT_TRACK,
        "previous": VK_MEDIA_PREV_TRACK,
        "prev": VK_MEDIA_PREV_TRACK,
        "stop": VK_MEDIA_STOP,
        "mute": VK_VOLUME_MUTE,
        "volume_up": VK_VOLUME_UP,
        "volume_down": VK_VOLUME_DOWN
    }

    vk_code = vk_map.get(act)
    if not vk_code:
        return {"success": False, "error": f"Unknown media action '{action}'. Valid: {list(vk_map.keys())}"}

    try:
        # Key down and Key up event
        ctypes.windll.user32.keybd_event(vk_code, 0, 0, 0)
        ctypes.windll.user32.keybd_event(vk_code, 0, 2, 0)
        return {"success": True, "action": act, "message": f"Media key '{act}' triggered."}
    except Exception as e:
        return {"success": False, "action": act, "error": str(e)}

def copy_to_clipboard(text: str) -> Dict[str, Any]:
    """Copies text to the system clipboard."""
    try:
        import pyperclip
        pyperclip.copy(text)
        return {"success": True, "copied_length": len(text), "message": "Text successfully copied to clipboard."}
    except Exception:
        try:
            # Fallback to powershell Set-Clipboard
            process = subprocess.Popen(['powershell', '-Command', 'Set-Clipboard', '-Value', f'"{text}"'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            process.communicate(timeout=3)
            return {"success": True, "copied_length": len(text), "message": "Text copied via PowerShell clipboard."}
        except Exception as e:
            return {"success": False, "error": f"Failed to copy to clipboard: {str(e)}"}

def read_clipboard() -> Dict[str, Any]:
    """Reads the current text in the system clipboard."""
    try:
        import pyperclip
        content = pyperclip.paste()
        return {"success": True, "content": content, "length": len(content)}
    except Exception:
        try:
            res = subprocess.run(['powershell', '-Command', 'Get-Clipboard'], capture_output=True, text=True, timeout=3)
            content = res.stdout.strip()
            return {"success": True, "content": content, "length": len(content)}
        except Exception as e:
            return {"success": False, "error": f"Failed to read clipboard: {str(e)}"}

# Register media tools
tool_registry.register_tool("media_key_action", "Control media player with play/pause, next, previous, stop", media_key_action)
tool_registry.register_tool("copy_to_clipboard", "Copy text to Windows clipboard", copy_to_clipboard)
tool_registry.register_tool("read_clipboard", "Read text from Windows clipboard", read_clipboard)
