import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.tools.developer_tools import (
    run_code, git_status, git_log, format_json_xml, regex_tester, hash_calculator, base64_tool
)

logger = logging.getLogger("jarvis.api.developer")
router = APIRouter(prefix="/developer", tags=["developer"])

class CodeRunRequest(BaseModel):
    code: str
    language: str = "python"
    timeout: int = 10

class JsonFormatRequest(BaseModel):
    data: str
    format_type: str = "json"

class RegexRequest(BaseModel):
    pattern: str
    text: str

class HashRequest(BaseModel):
    text: str
    algorithm: str = "sha256"

class Base64Request(BaseModel):
    action: str  # 'encode' | 'decode'
    data: str

@router.post("/run-code")
async def handle_run_code(req: CodeRunRequest):
    res = run_code(code=req.code, language=req.language, timeout_seconds=req.timeout)
    return res

@router.get("/git-status")
async def handle_git_status(repo_path: str = "."):
    return git_status(repo_path=repo_path)

@router.get("/git-log")
async def handle_git_log(repo_path: str = ".", limit: int = 5):
    return git_log(repo_path=repo_path, limit=limit)

@router.post("/format-json")
async def handle_format_json(req: JsonFormatRequest):
    return format_json_xml(data_str=req.data, format_type=req.format_type)

@router.post("/regex")
async def handle_regex_test(req: RegexRequest):
    return regex_tester(pattern=req.pattern, text=req.text)

@router.post("/hash")
async def handle_hash(req: HashRequest):
    return hash_calculator(text=req.text, algorithm=req.algorithm)

@router.post("/base64")
async def handle_base64(req: Base64Request):
    return base64_tool(action=req.action, data=req.data)
