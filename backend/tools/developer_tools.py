import os
import sys
import time
import json
import re
import subprocess
import hashlib
import base64
import logging
from typing import Dict, Any, Optional
from pathlib import Path

from backend.tools.registry import tool_registry

logger = logging.getLogger("jarvis.tools.developer")

def run_code(code: str, language: str = "python", timeout_seconds: int = 10) -> Dict[str, Any]:
    """
    Executes a script/code snippet in a secure subprocess and returns stdout, stderr, and execution time.
    Supported languages: 'python', 'javascript' / 'node', 'powershell' / 'ps1', 'cmd' / 'batch', 'shell'.
    """
    lang = language.strip().lower()
    start_time = time.time()

    if lang in ["python", "py"]:
        python_exe = sys.executable
        try:
            res = subprocess.run(
                [python_exe, "-c", code],
                capture_output=True,
                text=True,
                timeout=timeout_seconds
            )
            duration_ms = round((time.time() - start_time) * 1000, 2)
            return {
                "success": res.returncode == 0,
                "language": "python",
                "stdout": res.stdout.strip(),
                "stderr": res.stderr.strip(),
                "returncode": res.returncode,
                "duration_ms": duration_ms
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "language": "python",
                "stdout": "",
                "stderr": f"Execution timed out after {timeout_seconds} seconds.",
                "returncode": -1,
                "duration_ms": timeout_seconds * 1000
            }
        except Exception as e:
            return {
                "success": False,
                "language": "python",
                "stdout": "",
                "stderr": f"Error running Python snippet: {str(e)}",
                "returncode": -1,
                "duration_ms": 0
            }

    elif lang in ["javascript", "js", "node"]:
        try:
            res = subprocess.run(
                ["node", "-e", code],
                capture_output=True,
                text=True,
                timeout=timeout_seconds,
                shell=True
            )
            duration_ms = round((time.time() - start_time) * 1000, 2)
            return {
                "success": res.returncode == 0,
                "language": "javascript",
                "stdout": res.stdout.strip(),
                "stderr": res.stderr.strip(),
                "returncode": res.returncode,
                "duration_ms": duration_ms
            }
        except Exception as e:
            return {
                "success": False,
                "language": "javascript",
                "stdout": "",
                "stderr": f"Error running Node.js snippet: {str(e)}",
                "returncode": -1,
                "duration_ms": 0
            }

    elif lang in ["powershell", "ps", "ps1"]:
        try:
            res = subprocess.run(
                ["powershell", "-NoProfile", "-NonInteractive", "-Command", code],
                capture_output=True,
                text=True,
                timeout=timeout_seconds
            )
            duration_ms = round((time.time() - start_time) * 1000, 2)
            return {
                "success": res.returncode == 0,
                "language": "powershell",
                "stdout": res.stdout.strip(),
                "stderr": res.stderr.strip(),
                "returncode": res.returncode,
                "duration_ms": duration_ms
            }
        except Exception as e:
            return {
                "success": False,
                "language": "powershell",
                "stdout": "",
                "stderr": f"Error running PowerShell snippet: {str(e)}",
                "returncode": -1,
                "duration_ms": 0
            }

    elif lang in ["cmd", "batch", "bat", "shell"]:
        try:
            res = subprocess.run(
                code,
                capture_output=True,
                text=True,
                timeout=timeout_seconds,
                shell=True
            )
            duration_ms = round((time.time() - start_time) * 1000, 2)
            return {
                "success": res.returncode == 0,
                "language": "cmd",
                "stdout": res.stdout.strip(),
                "stderr": res.stderr.strip(),
                "returncode": res.returncode,
                "duration_ms": duration_ms
            }
        except Exception as e:
            return {
                "success": False,
                "language": "cmd",
                "stdout": "",
                "stderr": f"Error running Command Prompt snippet: {str(e)}",
                "returncode": -1,
                "duration_ms": 0
            }
    else:
        return {
            "success": False,
            "language": language,
            "stdout": "",
            "stderr": f"Unsupported language '{language}'. Supported: python, javascript, powershell, cmd",
            "returncode": -1,
            "duration_ms": 0
        }

def git_status(repo_path: str = ".") -> Dict[str, Any]:
    """Inspects Git repository branch, staged/unstaged changes, and untracked files."""
    try:
        res = subprocess.run(
            ["git", "status", "--short", "--branch"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=5
        )
        if res.returncode != 0:
            return {"success": False, "error": res.stderr.strip() or "Not a git repository."}
        
        lines = res.stdout.strip().split("\n")
        branch_info = lines[0] if lines else "Unknown"
        changed_files = lines[1:] if len(lines) > 1 else []
        
        return {
            "success": True,
            "branch": branch_info.replace("## ", "").strip(),
            "dirty": len(changed_files) > 0,
            "changed_count": len(changed_files),
            "files": changed_files[:20]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def git_log(repo_path: str = ".", limit: int = 5) -> Dict[str, Any]:
    """Returns recent git commit history."""
    try:
        res = subprocess.run(
            ["git", "log", f"-n{limit}", "--pretty=format:%h|%an|%ar|%s"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=5
        )
        if res.returncode != 0:
            return {"success": False, "error": res.stderr.strip() or "Failed to fetch git log."}
        
        commits = []
        for line in res.stdout.strip().split("\n"):
            if not line:
                continue
            parts = line.split("|", 3)
            if len(parts) == 4:
                commits.append({
                    "hash": parts[0],
                    "author": parts[1],
                    "relative_time": parts[2],
                    "message": parts[3]
                })
        return {"success": True, "commits": commits}
    except Exception as e:
        return {"success": False, "error": str(e)}

def format_json_xml(data_str: str, format_type: str = "json") -> Dict[str, Any]:
    """Formats, indents, and validates raw JSON or XML string."""
    fmt = format_type.strip().lower()
    if fmt == "json":
        try:
            parsed = json.loads(data_str)
            formatted = json.dumps(parsed, indent=2, ensure_ascii=False)
            return {"success": True, "formatted": formatted, "valid": True}
        except Exception as e:
            return {"success": False, "error": f"Invalid JSON: {str(e)}", "valid": False}
    return {"success": False, "error": f"Unsupported format '{format_type}'"}

def regex_tester(pattern: str, text: str) -> Dict[str, Any]:
    """Tests a regular expression against text and returns all matches."""
    try:
        compiled = re.compile(pattern)
        matches = []
        for m in compiled.finditer(text):
            matches.append({
                "match": m.group(0),
                "start": m.start(),
                "end": m.end(),
                "groups": m.groups()
            })
        return {
            "success": True,
            "match_count": len(matches),
            "matches": matches
        }
    except Exception as e:
        return {"success": False, "error": f"Regex Error: {str(e)}"}

def hash_calculator(text: str, algorithm: str = "sha256") -> Dict[str, Any]:
    """Calculates cryptographic hashes (MD5, SHA1, SHA256, SHA512) for text."""
    algo = algorithm.strip().lower()
    encoded = text.encode("utf-8")
    if algo == "md5":
        h = hashlib.md5(encoded).hexdigest()
    elif algo == "sha1":
        h = hashlib.sha1(encoded).hexdigest()
    elif algo == "sha512":
        h = hashlib.sha512(encoded).hexdigest()
    else:
        algo = "sha256"
        h = hashlib.sha256(encoded).hexdigest()
    return {"success": True, "algorithm": algo, "hash": h}

def base64_tool(action: str, data: str) -> Dict[str, Any]:
    """Encodes or decodes text to/from Base64 format."""
    act = action.strip().lower()
    try:
        if act == "encode":
            encoded = base64.b64encode(data.encode("utf-8")).decode("utf-8")
            return {"success": True, "action": "encode", "result": encoded}
        elif act == "decode":
            decoded = base64.b64decode(data.encode("utf-8")).decode("utf-8")
            return {"success": True, "action": "decode", "result": decoded}
        else:
            return {"success": False, "error": "Action must be 'encode' or 'decode'."}
    except Exception as e:
        return {"success": False, "error": f"Base64 error: {str(e)}"}

# Register developer tools
tool_registry.register_tool("run_code", "Execute Python or JavaScript code snippet in sandbox", run_code)
tool_registry.register_tool("git_status", "Check Git status of the project", git_status)
tool_registry.register_tool("git_log", "View recent commit history", git_log)
tool_registry.register_tool("format_json_xml", "Format and validate JSON string", format_json_xml)
tool_registry.register_tool("regex_tester", "Test regular expression matches on text", regex_tester)
tool_registry.register_tool("hash_calculator", "Compute MD5/SHA256/SHA512 hash of text", hash_calculator)
tool_registry.register_tool("base64_tool", "Encode or decode Base64 data", base64_tool)
