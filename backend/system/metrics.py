import os
import platform
import socket
import logging
from typing import Dict, Any
import psutil

logger = logging.getLogger("jarvis.system.metrics")

def get_system_metrics() -> Dict[str, Any]:
    """
    Collects V2 enhanced real-time hardware telemetry and system metrics.
    """
    try:
        # CPU
        cpu_pct = psutil.cpu_percent(interval=0.1)
        cpu_freq = psutil.cpu_freq().current if psutil.cpu_freq() else 0
        phys_cores = psutil.cpu_count(logical=False) or 4
        logical_cores = psutil.cpu_count(logical=True) or 8
        cpu_brand = platform.processor() or "x86_64 Processor"

        # RAM
        vm = psutil.virtual_memory()
        
        # Disk Usage and I/O
        disk_path = 'C:\\' if os.name == 'nt' else '/'
        disk_usage = psutil.disk_usage(disk_path)
        disk_io = psutil.disk_io_counters()

        # Network I/O
        net_io = psutil.net_io_counters()

        # Battery
        batt = psutil.sensors_battery()
        
        # Temperatures (Platform dependent)
        temps = {}
        try:
            sensors = psutil.sensors_temperatures()
            for name, entries in sensors.items():
                temps[name] = [e.current for e in entries]
        except:
            temps = {"cpu": None}

        # Compute disk % for backward compat
        disk_pct = round((disk_usage.used / disk_usage.total) * 100, 1) if disk_usage.total else 0
        
        # Process list: top 5 by CPU
        try:
            top_procs = []
            for proc in sorted(
                psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent"]),
                key=lambda p: p.info.get("cpu_percent") or 0,
                reverse=True
            )[:5]:
                info = proc.info
                top_procs.append({
                    "pid": info.get("pid"),
                    "name": (info.get("name") or "unknown")[:20],
                    "cpu_pct": round(info.get("cpu_percent") or 0, 1),
                    "mem_pct": round(info.get("memory_percent") or 0, 1)
                })
        except Exception:
            top_procs = []

        # Network connections
        try:
            net_conn_count = len(psutil.net_connections(kind='inet'))
        except Exception:
            net_conn_count = 0

        threads_count = len(psutil.pids())

        return {
            "version": "2.0",
            "status": "online",
            "health": "healthy",
            "cpu": {
                "usage_percent": cpu_pct,
                "frequency_mhz": round(cpu_freq, 0),
                "brand": cpu_brand,
                "physical_cores": phys_cores,
                "logical_cores": logical_cores,
                "cores": {"physical": phys_cores, "logical": logical_cores},
                "temperatures": temps
            },
            "ram": {
                "total_gb": round(vm.total / (1024**3), 1),
                "used_gb": round(vm.used / (1024**3), 1),
                "available_gb": round(vm.available / (1024**3), 1),
                "percent": vm.percent
            },
            "disk": {
                "total_gb": round(disk_usage.total / (1024**3), 1),
                "used_gb": round(disk_usage.used / (1024**3), 1),
                "percent": disk_pct,
                "read_bytes": disk_io.read_bytes if disk_io else 0,
                "write_bytes": disk_io.write_bytes if disk_io else 0
            },
            "network": {
                "bytes_sent": net_io.bytes_sent if net_io else 0,
                "bytes_recv": net_io.bytes_recv if net_io else 0,
                "active_connections": net_conn_count
            },
            "battery": {
                "percent": batt.percent if batt else 100.0,
                "plugged": batt.power_plugged if batt else True,
                "minutes_left": (
                    round(batt.secsleft / 60) if batt and batt.secsleft and batt.secsleft > 0 else None
                )
            },
            "threads": threads_count,
            "top_processes": top_procs,
            "os": {
                "name": f"{platform.system()} {platform.release()}",
                "machine": platform.machine(),
                "computer_name": socket.gethostname()
            }
        }
    except Exception as e:
        logger.error(f"Error fetching V2 system metrics: {e}")
        return {
            "status": "error",
            "health": "degraded",
            "cpu": {"usage_percent": 12.5, "brand": "System CPU", "physical_cores": 4, "logical_cores": 8, "per_core_usage": []},
            "ram": {"total_gb": 16.0, "used_gb": 8.0, "available_gb": 8.0, "percent": 50.0},
            "disk": {"total_gb": 512.0, "used_gb": 256.0, "percent": 50.0, "read_bytes": 0, "write_bytes": 0},
            "battery": {"percent": 100.0, "plugged": True, "minutes_left": None},
            "network": {"bytes_sent": 0, "bytes_recv": 0, "active_connections": 0},
            "threads": 150,
            "top_processes": [],
            "os": {"name": "Windows 11", "machine": "AMD64", "computer_name": "JARVIS-HOST"}
        }
