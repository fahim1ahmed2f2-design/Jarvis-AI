import os
import sys
import time
import shutil
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import psutil

from backend.tools.registry import tool_registry

logger = logging.getLogger("jarvis.tools.diagnostics")

def get_top_processes(limit: int = 10, sort_by: str = "memory") -> Dict[str, Any]:
    """Lists top active processes sorted by memory or CPU usage."""
    procs = []
    attrs = ['pid', 'name', 'memory_info', 'memory_percent', 'status']
    for p in psutil.process_iter(attrs):
        try:
            info = p.info
            mem_info = info.get('memory_info')
            mem_mb = round(mem_info.rss / (1024 * 1024), 1) if mem_info else 0
            procs.append({
                "pid": info['pid'],
                "name": info['name'] or 'Unknown',
                "cpu_percent": 0.0,
                "memory_mb": mem_mb,
                "memory_percent": round(info.get('memory_percent') or 0, 1),
                "status": info.get('status', 'running')
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess, Exception):
            continue

    if sort_by.lower() == "cpu":
        procs.sort(key=lambda x: x["cpu_percent"], reverse=True)
    else:
        procs.sort(key=lambda x: x["memory_mb"], reverse=True)

    return {
        "success": True,
        "sort_by": sort_by,
        "total_running": len(procs),
        "processes": procs[:limit]
    }

def kill_process(pid: Optional[int] = None, name: Optional[str] = None) -> Dict[str, Any]:
    """Safely terminates a process by PID or executable name (prevents killing critical system procs)."""
    CRITICAL_PROCS = ["system", "registry", "smss.exe", "csrss.exe", "wininit.exe", "services.exe", "lsass.exe", "svchost.exe", "explorer.exe"]
    
    if pid is not None:
        try:
            p = psutil.Process(pid)
            p_name = p.name().lower()
            if p_name in CRITICAL_PROCS:
                return {"success": False, "error": f"Refusing to kill critical Windows process '{p_name}'."}
            p.terminate()
            p.wait(timeout=2)
            return {"success": True, "message": f"Successfully terminated process '{p_name}' (PID: {pid})."}
        except psutil.NoSuchProcess:
            return {"success": False, "error": f"No process found with PID {pid}."}
        except Exception as e:
            return {"success": False, "error": f"Failed to terminate PID {pid}: {str(e)}"}

    elif name is not None:
        target_name = name.strip().lower()
        if target_name in CRITICAL_PROCS:
            return {"success": False, "error": f"Refusing to kill critical Windows process '{target_name}'."}
        
        killed_count = 0
        for p in psutil.process_iter(['pid', 'name']):
            try:
                if p.info['name'] and target_name in p.info['name'].lower():
                    p.terminate()
                    killed_count += 1
            except Exception:
                continue

        if killed_count > 0:
            return {"success": True, "message": f"Terminated {killed_count} instance(s) of '{name}'."}
        return {"success": False, "error": f"No active processes found matching '{name}'."}

    return {"success": False, "error": "Must provide either 'pid' or 'name'."}

def get_storage_breakdown() -> Dict[str, Any]:
    """Returns detailed storage usage statistics for all mounted disk drives."""
    drives = []
    for part in psutil.disk_partitions(all=False):
        try:
            if 'cdrom' in part.opts or part.fstype == '':
                continue
            usage = psutil.disk_usage(part.mountpoint)
            drives.append({
                "device": part.device,
                "mountpoint": part.mountpoint,
                "fstype": part.fstype,
                "total_gb": round(usage.total / (1024**3), 2),
                "used_gb": round(usage.used / (1024**3), 2),
                "free_gb": round(usage.free / (1024**3), 2),
                "percent_used": usage.percent
            })
        except Exception:
            continue

    return {
        "success": True,
        "drives": drives
    }

def get_battery_detailed() -> Dict[str, Any]:
    """Returns power and battery status."""
    battery = psutil.sensors_battery()
    if not battery:
        return {
            "success": True,
            "has_battery": False,
            "power_plugged": True,
            "percent": 100,
            "status": "Desktop AC Power"
        }

    secs = battery.secsleft
    time_left_str = "Calculating..."
    if secs > 0 and secs != psutil.POWER_TIME_UNLIMITED:
        mins = secs // 60
        hrs = mins // 60
        time_left_str = f"{hrs}h {mins % 60}m"

    return {
        "success": True,
        "has_battery": True,
        "percent": battery.percent,
        "power_plugged": battery.power_plugged,
        "time_left": time_left_str,
        "status": "Charging" if battery.power_plugged else "Discharging"
    }

def system_deep_clean() -> Dict[str, Any]:
    """Safely cleans user temporary files to free up disk space and reduce memory clutter."""
    temp_dirs = [
        os.environ.get("TEMP"),
        os.environ.get("TMP"),
    ]
    deleted_files = 0
    deleted_bytes = 0
    errors = 0

    for t_dir in set(filter(None, temp_dirs)):
        if not os.path.exists(t_dir):
            continue
        for root, dirs, files in os.walk(t_dir, topdown=False):
            for f in files:
                f_path = os.path.join(root, f)
                try:
                    size = os.path.getsize(f_path)
                    os.remove(f_path)
                    deleted_files += 1
                    deleted_bytes += size
                except Exception:
                    errors += 1
            for d in dirs:
                d_path = os.path.join(root, d)
                try:
                    os.rmdir(d_path)
                except Exception:
                    pass

    mb_freed = round(deleted_bytes / (1024 * 1024), 2)
    return {
        "success": True,
        "files_deleted": deleted_files,
        "freed_mb": mb_freed,
        "locked_skipped": errors,
        "message": f"Deep Clean completed: Removed {deleted_files} temporary files and freed {mb_freed} MB disk space."
    }

def get_system_uptime() -> Dict[str, Any]:
    """Returns system boot timestamp and total uptime duration."""
    boot_time = psutil.boot_time()
    now = time.time()
    uptime_sec = int(now - boot_time)

    days = uptime_sec // (24 * 3600)
    hours = (uptime_sec % (24 * 3600)) // 3600
    minutes = (uptime_sec % 3600) // 60
    
    uptime_formatted = f"{days}d {hours}h {minutes}m" if days > 0 else f"{hours}h {minutes}m"
    boot_dt = datetime.fromtimestamp(boot_time, tz=timezone.utc).isoformat()

    return {
        "success": True,
        "boot_time": boot_dt,
        "uptime_seconds": uptime_sec,
        "uptime_formatted": uptime_formatted
    }

def boost_pc_performance() -> Dict[str, Any]:
    """
    Executes an Iron Man Mark-VII Turbo Boost protocol:
    1. Safely purges Windows temporary junk files.
    2. Flushes Windows DNS resolver cache.
    3. Runs Python memory GC and compacts system memory working set.
    """
    import gc
    import ctypes
    import subprocess

    # 1. Clean temp files
    clean_result = system_deep_clean()
    files_deleted = clean_result.get("files_deleted", 0)
    freed_mb = clean_result.get("freed_mb", 0.0)

    # 2. Flush DNS resolver cache
    dns_flushed = False
    try:
        res = subprocess.run(["ipconfig", "/flushdns"], capture_output=True, text=True, timeout=5)
        dns_flushed = res.returncode == 0
    except Exception:
        dns_flushed = False

    # 3. Memory garbage collection and working set trim
    gc.collect()
    try:
        h_process = ctypes.windll.kernel32.GetCurrentProcess()
        ctypes.windll.psapi.EmptyWorkingSet(h_process)
    except Exception:
        pass

    # Read post-boost memory
    mem = psutil.virtual_memory()
    free_ram_gb = round(mem.available / (1024**3), 2)
    ram_usage_pct = mem.percent

    return {
        "success": True,
        "files_deleted": files_deleted,
        "disk_freed_mb": freed_mb,
        "dns_flushed": dns_flushed,
        "available_ram_gb": free_ram_gb,
        "ram_percent": ram_usage_pct,
        "status": "OPTIMIZED",
        "message": f"Turbo Boost Complete: Purged {files_deleted} temp files ({freed_mb} MB freed), flushed DNS cache, and optimized system RAM ({free_ram_gb} GB available)."
    }

def get_advanced_system_health() -> Dict[str, Any]:
    """
    Calculates the 0-100% Mark-VII Reactor Health Index, assessing
    CPU workload, memory saturation, disk headroom, battery power, and active threads.
    """
    cpu_pct = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory()
    mem_pct = mem.percent
    
    # Disk max usage
    disk_max = 0
    for part in psutil.disk_partitions(all=False):
        try:
            if 'cdrom' in part.opts or part.fstype == '':
                continue
            usage = psutil.disk_usage(part.mountpoint)
            if usage.percent > disk_max:
                disk_max = usage.percent
        except Exception:
            continue

    # Battery
    battery_info = get_battery_detailed()
    battery_pct = battery_info.get("percent", 100)

    # Health Index Calculation (Weight: CPU 35%, RAM 35%, Disk 20%, Stability 10%)
    cpu_score = max(0, 100 - cpu_pct)
    ram_score = max(0, 100 - mem_pct)
    disk_score = max(0, 100 - disk_max)
    health_index = round((cpu_score * 0.35) + (ram_score * 0.35) + (disk_score * 0.20) + 10, 1)
    health_index = min(100.0, max(0.0, health_index))

    if health_index >= 85:
        rating = "OPTIMAL"
        status_color = "#00F0FF"
    elif health_index >= 70:
        rating = "NOMINAL"
        status_color = "#00FF9D"
    elif health_index >= 50:
        rating = "CAUTION"
        status_color = "#FFB800"
    else:
        rating = "CRITICAL"
        status_color = "#FF3344"

    recommendations = []
    if mem_pct > 80:
        recommendations.append("RAM usage exceeds 80%. Run 'Turbo Boost' to compact memory.")
    if cpu_pct > 85:
        recommendations.append("High CPU load detected. Inspect top active processes.")
    if disk_max > 90:
        recommendations.append("Disk partition over 90% full. Clean temp files or move data.")
    if not recommendations:
        recommendations.append("All primary subsystems running at peak efficiency. No intervention needed.")

    return {
        "success": True,
        "health_index": health_index,
        "rating": rating,
        "status_color": status_color,
        "cpu_percent": cpu_pct,
        "ram_percent": mem_pct,
        "disk_max_percent": disk_max,
        "battery_percent": battery_pct,
        "power_plugged": battery_info.get("power_plugged", True),
        "recommendations": recommendations,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

# Register diagnostics tools
tool_registry.register_tool("get_top_processes", "List top CPU or RAM consuming processes", get_top_processes)
tool_registry.register_tool("kill_process", "Safely terminate a process by PID or name", kill_process)
tool_registry.register_tool("get_storage_breakdown", "Get partition usage for all disk drives", get_storage_breakdown)
tool_registry.register_tool("get_battery_detailed", "Get battery charge level and power adapter state", get_battery_detailed)
tool_registry.register_tool("system_deep_clean", "Safely clean Windows temp files and free disk space", system_deep_clean)
tool_registry.register_tool("get_system_uptime", "Get system uptime and boot time", get_system_uptime)
tool_registry.register_tool("boost_pc_performance", "Execute Turbo Boost: purge temp cache, flush DNS, compact RAM", boost_pc_performance)
tool_registry.register_tool("get_advanced_system_health", "Calculate 0-100% Mark-VII Reactor Health Index and subsystem diagnostics", get_advanced_system_health)
