from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from backend.system.metrics import get_system_metrics
from backend.system.keep_awake import keep_awake_service
from backend.system.autostart import autostart_manager
from backend.tools.diagnostics_tools import (
    get_top_processes, kill_process, get_storage_breakdown,
    get_battery_detailed, system_deep_clean, get_system_uptime,
    boost_pc_performance, get_advanced_system_health
)
from backend.tools.network_tools import (
    ping_target, dns_lookup, get_ip_info, port_scan, check_network_speed_fast
)
from backend.tools.media_tools import media_key_action, copy_to_clipboard, read_clipboard

router = APIRouter(prefix="/system", tags=["system"])

class KeepAwakeRequest(BaseModel):
    enabled: bool
    keep_display_on: Optional[bool] = False

class AutostartRequest(BaseModel):
    enabled: bool

class KillProcessRequest(BaseModel):
    pid: Optional[int] = None
    name: Optional[str] = None

class PingRequest(BaseModel):
    host: str = "8.8.8.8"
    count: int = 4

class DnsRequest(BaseModel):
    domain: str

class PortScanRequest(BaseModel):
    host: str = "127.0.0.1"
    ports: Optional[List[int]] = None

class MediaActionRequest(BaseModel):
    action: str  # 'play_pause' | 'next' | 'previous' | 'stop' | 'mute' | 'volume_up' | 'volume_down'

class ClipboardRequest(BaseModel):
    text: str

@router.get("/metrics")
def get_metrics():
    return get_system_metrics()

@router.get("/always-on")
def get_always_on_status():
    return {
        "status": "healthy",
        "is_24x7": True,
        "keep_awake": keep_awake_service.get_status(),
        "autostart": autostart_manager.get_status(),
        "watchdog": {
            "status": "running",
            "last_healthy": datetime.now(timezone.utc).isoformat(),
            "total_recoveries": 0,
            "consecutive_failures": 0
        },
        "server_time": datetime.now(timezone.utc).isoformat()
    }

@router.post("/always-on/keep-awake")
def set_keep_awake(req: KeepAwakeRequest):
    return keep_awake_service.set_keep_awake(req.enabled, bool(req.keep_display_on))

@router.post("/always-on/autostart")
def set_autostart(req: AutostartRequest):
    return autostart_manager.toggle_autostart(req.enabled)

# Deep Diagnostics & Process Matrix
@router.get("/processes")
def get_processes(limit: int = 15, sort_by: str = "memory"):
    return get_top_processes(limit=limit, sort_by=sort_by)

@router.post("/kill-process")
def handle_kill_process(req: KillProcessRequest):
    return kill_process(pid=req.pid, name=req.name)

@router.get("/storage")
def get_storage():
    return get_storage_breakdown()

@router.get("/battery")
def get_battery():
    return get_battery_detailed()

@router.post("/deep-clean")
def handle_deep_clean():
    return system_deep_clean()

@router.get("/uptime")
def get_uptime():
    return get_system_uptime()

@router.get("/health-index")
def handle_health_index():
    return get_advanced_system_health()

@router.post("/boost")
def handle_system_boost():
    return boost_pc_performance()

# Network Diagnostics
@router.post("/network/ping")
def handle_ping(req: PingRequest):
    return ping_target(host=req.host, count=req.count)

@router.post("/network/dns")
def handle_dns(req: DnsRequest):
    return dns_lookup(domain=req.domain)

@router.get("/network/ip-info")
def handle_ip_info():
    return get_ip_info()

@router.post("/network/port-scan")
def handle_port_scan(req: PortScanRequest):
    return port_scan(host=req.host, ports=req.ports)

@router.get("/network/speed")
def handle_network_speed():
    return check_network_speed_fast()

# Media & Clipboard
@router.post("/media/action")
def handle_media_action(req: MediaActionRequest):
    return media_key_action(action=req.action)

@router.get("/clipboard")
def handle_read_clipboard():
    return read_clipboard()

@router.post("/clipboard")
def handle_write_clipboard(req: ClipboardRequest):
    return copy_to_clipboard(text=req.text)
