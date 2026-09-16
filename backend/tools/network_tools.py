import socket
import subprocess
import time
import logging
from typing import Dict, Any, List, Optional
import httpx

from backend.tools.registry import tool_registry

logger = logging.getLogger("jarvis.tools.network")

def ping_target(host: str = "8.8.8.8", count: int = 4) -> Dict[str, Any]:
    """Sends ICMP ping requests to a target host/IP and returns latency and loss stats."""
    host = host.strip()
    try:
        # Windows ping command: ping -n <count> <host>
        res = subprocess.run(
            ["ping", "-n", str(count), host],
            capture_output=True,
            text=True,
            timeout=10
        )
        output = res.stdout
        is_reachable = res.returncode == 0 and "TTL=" in output.upper()

        # Parse average latency if available
        avg_ms = None
        if "Average =" in output:
            try:
                avg_ms = int(output.split("Average =")[1].split("ms")[0].strip())
            except Exception:
                pass
        elif "গড় =" in output or "গড় =" in output:
            try:
                avg_ms = int(output.split("=")[-1].replace("ms", "").strip())
            except Exception:
                pass

        return {
            "success": True,
            "host": host,
            "reachable": is_reachable,
            "average_latency_ms": avg_ms,
            "raw_output": output.strip()
        }
    except Exception as e:
        return {"success": False, "host": host, "error": str(e)}

def dns_lookup(domain: str) -> Dict[str, Any]:
    """Resolves IP addresses for a domain name."""
    clean_domain = domain.strip().replace("https://", "").replace("http://", "").split("/")[0]
    try:
        ip_list = socket.gethostbyname_ex(clean_domain)
        return {
            "success": True,
            "domain": clean_domain,
            "canonical_name": ip_list[0],
            "aliases": ip_list[1],
            "ip_addresses": ip_list[2]
        }
    except Exception as e:
        return {"success": False, "domain": clean_domain, "error": str(e)}

def get_ip_info() -> Dict[str, Any]:
    """Retrieves local network IP address and public IP address details."""
    local_ip = "127.0.0.1"
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        local_ip = socket.gethostbyname(socket.gethostname())

    public_info = {}
    try:
        with httpx.Client(timeout=3.0) as client:
            res = client.get("https://ipapi.co/json/")
            if res.status_code == 200:
                public_info = res.json()
    except Exception:
        try:
            with httpx.Client(timeout=2.0) as client:
                res = client.get("https://api.ipify.org?format=json")
                if res.status_code == 200:
                    public_info = res.json()
        except Exception:
            pass

    return {
        "success": True,
        "hostname": socket.gethostname(),
        "local_ip": local_ip,
        "public_ip": public_info.get("ip") or public_info.get("query") or "Unavailable",
        "city": public_info.get("city", "Unknown"),
        "region": public_info.get("region", "Unknown"),
        "country": public_info.get("country_name", "Unknown"),
        "org": public_info.get("org", "Unknown"),
        "timezone": public_info.get("timezone", "UTC")
    }

def port_scan(host: str = "127.0.0.1", ports: Optional[List[int]] = None) -> Dict[str, Any]:
    """Scans common TCP ports on a host to check open services."""
    target_ports = ports or [80, 443, 8000, 3000, 5000, 8080, 22, 21, 3306, 5432, 27017]
    open_ports = []
    
    for port in target_ports:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.3)
        res = s.connect_ex((host, port))
        if res == 0:
            open_ports.append(port)
        s.close()

    return {
        "success": True,
        "host": host,
        "scanned_ports": target_ports,
        "open_ports": open_ports,
        "open_count": len(open_ports)
    }

def check_network_speed_fast() -> Dict[str, Any]:
    """Performs a quick network latency & download speed measurement."""
    t0 = time.time()
    try:
        with httpx.Client(timeout=6.0) as client:
            res = client.get("https://www.google.com/generate_204")
            latency_ms = round((time.time() - t0) * 1000, 2)
            
            # Download a small 1MB test asset
            t_down_start = time.time()
            res_data = client.get("https://speed.cloudflare.com/__down?bytes=1000000")
            down_dur = time.time() - t_down_start
            
            mbps = 0.0
            if down_dur > 0:
                mbps = round((len(res_data.content) * 8 / 1_000_000) / down_dur, 2)

            return {
                "success": True,
                "latency_ms": latency_ms,
                "download_speed_mbps": mbps,
                "status": "online" if res.status_code in [200, 204] else "degraded"
            }
    except Exception as e:
        return {
            "success": False,
            "status": "offline",
            "error": str(e)
        }

# Register network tools
tool_registry.register_tool("ping_target", "Ping an IP or domain to measure latency and connectivity", ping_target)
tool_registry.register_tool("dns_lookup", "Resolve IP addresses for a domain name", dns_lookup)
tool_registry.register_tool("get_ip_info", "Get local and public IP address details", get_ip_info)
tool_registry.register_tool("port_scan", "Scan ports on a target host to find open services", port_scan)
tool_registry.register_tool("check_network_speed_fast", "Quickly measure network latency and download speed", check_network_speed_fast)
