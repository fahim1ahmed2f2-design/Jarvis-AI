import os
import glob
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from backend.tools.registry import tool_registry

logger = logging.getLogger("jarvis.tools.file_ops")

def read_file_content(file_path: str, max_chars: int = 5000) -> str:
    """Reads content of a text file."""
    path = Path(file_path).expanduser().resolve()
    if not path.exists():
        return f"File '{file_path}' does not exist."
    if not path.is_file():
        return f"Path '{file_path}' is not a regular file."
    try:
        content = path.read_text(encoding="utf-8", errors="replace")
        if len(content) > max_chars:
            return content[:max_chars] + f"\n... [Truncated {len(content) - max_chars} characters]"
        return content
    except Exception as e:
        return f"Error reading file: {e}"

def write_file_content(file_path: str, content: str, append: bool = False) -> str:
    """Writes content to a file."""
    path = Path(file_path).expanduser().resolve()
    path.parent.mkdir(parents=True, exist_ok=True)
    mode = "a" if append else "w"
    try:
        with open(path, mode, encoding="utf-8") as f:
            f.write(content)
        return f"Successfully wrote {len(content)} characters to '{path.name}'."
    except Exception as e:
        return f"Error writing file: {e}"

def list_directory(directory_path: str = ".", pattern: str = "*") -> List[str]:
    """Lists files and folders in a directory."""
    path = Path(directory_path).expanduser().resolve()
    if not path.exists():
        return [f"Directory '{directory_path}' does not exist."]
    try:
        items = list(path.glob(pattern))[:40]
        return [f"{'[DIR] ' if i.is_dir() else '[FILE] '}{i.name}" for i in items]
    except Exception as e:
        return [f"Error listing directory: {e}"]

def search_files(directory_path: str, query: str) -> List[str]:
    """Searches for files matching a query recursively."""
    path = Path(directory_path).expanduser().resolve()
    matches = []
    try:
        for p in path.rglob(f"*{query}*"):
            matches.append(str(p))
            if len(matches) >= 20:
                break
        return matches
    except Exception as e:
        return [f"Error searching files: {e}"]

# Register tools
tool_registry.register_tool("read_file", "Read text content from a file", read_file_content)
tool_registry.register_tool("write_file", "Write text content to a file", write_file_content, permission_level="elevated")
tool_registry.register_tool("list_directory", "List files and folders in a path", list_directory)
tool_registry.register_tool("search_files", "Search files by name query", search_files)
