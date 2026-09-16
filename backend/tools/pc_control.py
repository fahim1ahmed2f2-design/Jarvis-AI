import logging
import time
from typing import Dict, Any, Optional
import pyautogui
import pyperclip
from backend.tools.registry import tool_registry

logger = logging.getLogger("jarvis.tools.pc_control")

pyautogui.FAILSAFE = False
pyautogui.PAUSE = 0.05

def mouse_click(x: Optional[int] = None, y: Optional[int] = None, button: str = "left", clicks: int = 1) -> str:
    """Clicks the mouse at specified coordinates or current location."""
    if x is not None and y is not None:
        pyautogui.click(x=x, y=y, clicks=clicks, button=button)
        return f"Clicked {button} button at ({x}, {y}) {clicks} time(s)."
    else:
        pyautogui.click(clicks=clicks, button=button)
        curr = pyautogui.position()
        return f"Clicked {button} button at current position ({curr.x}, {curr.y})."

def mouse_move(x: int, y: int, duration: float = 0.2) -> str:
    """Moves mouse to (x, y)."""
    pyautogui.moveTo(x, y, duration=duration)
    return f"Moved cursor to ({x}, {y})."

def mouse_scroll(clicks: int) -> str:
    """Scrolls mouse up or down."""
    pyautogui.scroll(clicks)
    return f"Scrolled {'up' if clicks > 0 else 'down'} by {abs(clicks)} clicks."

def keyboard_type(text: str, interval: float = 0.01) -> str:
    """Types text at current focused location or pastes directly."""
    try:
        # Use clipboard paste for unicode/emojis/multilingual characters
        pyperclip.copy(text)
        pyautogui.hotkey('ctrl', 'v')
        return f"Typed text: '{text}'"
    except Exception:
        pyautogui.write(text, interval=interval)
        return f"Typed text: '{text}'"

def keyboard_press(key: str) -> str:
    """Presses a single keyboard key (e.g. enter, esc, tab, space, backspace, f5)."""
    pyautogui.press(key.lower())
    return f"Pressed '{key}' key."

def keyboard_hotkey(*keys) -> str:
    """Presses a keyboard shortcut combination (e.g. 'ctrl', 'c' or 'alt', 'tab')."""
    pyautogui.hotkey(*keys)
    return f"Triggered hotkey combination: {' + '.join(keys)}"

def get_clipboard() -> str:
    """Reads current clipboard text."""
    return pyperclip.paste()

def set_clipboard(text: str) -> str:
    """Copies text to clipboard."""
    pyperclip.copy(text)
    return f"Copied '{text[:30]}...' to clipboard."

# Register tools
tool_registry.register_tool("mouse_click", "Click mouse at specified coordinates or current position", mouse_click)
tool_registry.register_tool("mouse_move", "Move mouse cursor to (x, y)", mouse_move)
tool_registry.register_tool("mouse_scroll", "Scroll mouse wheel up (positive) or down (negative)", mouse_scroll)
tool_registry.register_tool("keyboard_type", "Type text or string at active focus", keyboard_type)
tool_registry.register_tool("keyboard_press", "Press a single keyboard key", keyboard_press)
tool_registry.register_tool("keyboard_hotkey", "Execute a keyboard shortcut combo like ctrl+c", keyboard_hotkey)
tool_registry.register_tool("get_clipboard", "Read text from clipboard", get_clipboard)
tool_registry.register_tool("set_clipboard", "Copy text to clipboard", set_clipboard)
