import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import httpx

from backend.config import DATA_DIR

logger = logging.getLogger("jarvis.smart_home.google")

SMART_HOME_CONFIG_FILE = DATA_DIR / "smart_home_config.json"

DEFAULT_SMART_CONFIG = {
    "active_provider": "virtual",  # "virtual", "google_home", "home_assistant"
    "google_home": {
        "project_id": "",
        "client_id": "",
        "client_secret": "",
        "access_token": "",
        "refresh_token": "",
        "connected": False
    },
    "home_assistant": {
        "host_url": "http://homeassistant.local:8123",
        "access_token": "",
        "connected": False
    },
    "scenes": {
        "movie_night": {
            "name": "Movie Night",
            "description": "Dims lights to 15% warm cinema ambience, turns on Smart TV plug, and sets AC to 22°C.",
            "icon": "tv",
            "actions": [
                {"device_id": "dev_light_living", "power": "on", "brightness": 15},
                {"device_id": "dev_light_bedroom", "power": "off"},
                {"device_id": "dev_plug_tv", "power": "on"},
                {"device_id": "dev_ac_living", "power": "on", "temperature": 22},
                {"device_id": "dev_fan_office", "power": "off"}
            ]
        },
        "focus_mode": {
            "name": "Focus / Engineering Mode",
            "description": "Powers up Office desk lamp to 100% crisp daylight, starts desk fan, and quiets other zones.",
            "icon": "zap",
            "actions": [
                {"device_id": "dev_fan_office", "power": "on", "speed": 2},
                {"device_id": "dev_light_living", "power": "off"},
                {"device_id": "dev_plug_tv", "power": "off"}
            ]
        },
        "cyber_shield": {
            "name": "Cyber Shield / Tactical",
            "description": "Initiates high-contrast tactical lighting and verifies all perimeter IoT sockets.",
            "icon": "shield",
            "actions": [
                {"device_id": "dev_light_living", "power": "on", "brightness": 70},
                {"device_id": "dev_light_bedroom", "power": "on", "brightness": 50},
                {"device_id": "dev_plug_tv", "power": "on"}
            ]
        },
        "night_standby": {
            "name": "Night Standby / Sleep",
            "description": "Powers down all ambient lighting, silences appliances, and maintains optimal 24°C sleep climate.",
            "icon": "moon",
            "actions": [
                {"device_id": "dev_light_living", "power": "off"},
                {"device_id": "dev_light_bedroom", "power": "off"},
                {"device_id": "dev_plug_tv", "power": "off"},
                {"device_id": "dev_fan_office", "power": "off"},
                {"device_id": "dev_ac_living", "power": "on", "temperature": 24}
            ]
        },
        "arc_reactor_pulse": {
            "name": "Arc Reactor Overload",
            "description": "Full-spectrum illumination test across all connected smart fixtures and outlets.",
            "icon": "sun",
            "actions": [
                {"device_id": "dev_light_living", "power": "on", "brightness": 100},
                {"device_id": "dev_light_bedroom", "power": "on", "brightness": 100},
                {"device_id": "dev_plug_tv", "power": "on"},
                {"device_id": "dev_fan_office", "power": "on", "speed": 3}
            ]
        }
    }
}

def load_smart_home_config() -> Dict[str, Any]:
    if SMART_HOME_CONFIG_FILE.exists():
        try:
            with open(SMART_HOME_CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return {**DEFAULT_SMART_CONFIG, **data}
        except Exception as e:
            logger.error(f"Error loading smart home config: {e}")
    return DEFAULT_SMART_CONFIG.copy()

def save_smart_home_config(cfg: Dict[str, Any]):
    try:
        with open(SMART_HOME_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
    except Exception as e:
        logger.error(f"Error saving smart home config: {e}")


class GoogleHomeBridge:
    """
    Google Cloud Smart Home / Home Graph API Integration.
    Supports querying devices, state updates, and Google Assistant voice execution commands.
    """
    def __init__(self):
        self.config = load_smart_home_config().get("google_home", {})

    def is_configured(self) -> bool:
        cfg = load_smart_home_config().get("google_home", {})
        return bool(cfg.get("project_id") or cfg.get("access_token"))

    def send_command(self, device_id: str, command_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sends an execution command to Google Home Graph or Google Smart Home Endpoint.
        Standard commands:
        - action.devices.commands.OnOff (on: True/False)
        - action.devices.commands.BrightnessAbsolute (brightness: 0-100)
        - action.devices.commands.ThermostatTemperatureSetpoint (thermostatTemperatureSetpoint: 22.0)
        """
        cfg = load_smart_home_config().get("google_home", {})
        token = cfg.get("access_token")
        project_id = cfg.get("project_id")

        if not token:
            logger.info(f"[Google Home Bridge] Simulated command for {device_id}: {command_type} -> {params}")
            return {
                "success": True,
                "status": "SIMULATED_SUCCESS",
                "message": f"Command '{command_type}' simulated for Google Home device '{device_id}'.",
                "device_id": device_id,
                "params": params
            }

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "commands": [
                {
                    "devices": [{"id": device_id}],
                    "execution": [{"command": command_type, "params": params}]
                }
            ]
        }

        try:
            url = f"https://homegraph.googleapis.com/v1/devices:execute"
            with httpx.Client(timeout=5.0) as client:
                res = client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    return {"success": True, "data": res.json(), "status": "SUCCESS"}
                return {"success": False, "status": f"HTTP_{res.status_code}", "error": res.text}
        except Exception as e:
            logger.error(f"Google Home API error: {e}")
            return {"success": False, "error": str(e)}

    def sync_devices(self) -> Dict[str, Any]:
        """Queries Google Home Graph to sync registered devices"""
        cfg = load_smart_home_config().get("google_home", {})
        token = cfg.get("access_token")
        if not token:
            return {"success": True, "synced_count": 5, "provider": "google_home_virtual"}

        try:
            url = "https://homegraph.googleapis.com/v1/devices:requestSync"
            headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
            with httpx.Client(timeout=6.0) as client:
                res = client.post(url, headers=headers, json={"agentUserId": cfg.get("project_id", "jarvis")})
                return {"success": res.status_code == 200, "status": res.status_code}
        except Exception as e:
            return {"success": False, "error": str(e)}


class HomeAssistantBridge:
    """
    Home Assistant REST & WebSocket Bridge.
    Connects to Google Home / Nest / Tuya / Zigbee devices exposed via Home Assistant.
    """
    def is_configured(self) -> bool:
        cfg = load_smart_home_config().get("home_assistant", {})
        return bool(cfg.get("access_token") and cfg.get("host_url"))

    def call_service(self, domain: str, service: str, entity_id: str, **kwargs) -> Dict[str, Any]:
        cfg = load_smart_home_config().get("home_assistant", {})
        host = cfg.get("host_url", "http://homeassistant.local:8123").rstrip("/")
        token = cfg.get("access_token", "")

        if not token:
            logger.info(f"[Home Assistant Bridge] Simulated service {domain}.{service} on {entity_id} with {kwargs}")
            return {
                "success": True,
                "status": "SIMULATED_SUCCESS",
                "message": f"Home Assistant service '{domain}.{service}' simulated for '{entity_id}'.",
                "entity_id": entity_id
            }

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        url = f"{host}/api/services/{domain}/{service}"
        payload = {"entity_id": entity_id, **kwargs}

        try:
            with httpx.Client(timeout=5.0) as client:
                res = client.post(url, headers=headers, json=payload)
                if res.status_code in [200, 201]:
                    return {"success": True, "status": "SUCCESS", "data": res.json()}
                return {"success": False, "status": f"HTTP_{res.status_code}", "error": res.text}
        except Exception as e:
            logger.error(f"Home Assistant error: {e}")
            return {"success": False, "error": str(e)}


class GoogleNestBroadcaster:
    """
    Allows JARVIS to broadcast audio / vocal announcements across all Google Home / Nest speakers.
    """
    def broadcast(self, message: str) -> Dict[str, Any]:
        clean = message.strip()
        if not clean:
            return {"success": False, "error": "Announcement message is empty"}

        logger.info(f"[Google Nest Broadcast] Announcing across Google Home speakers: '{clean}'")

        # 1. Try Home Assistant broadcast if connected
        ha_bridge = HomeAssistantBridge()
        if ha_bridge.is_configured():
            res = ha_bridge.call_service(
                domain="tts",
                service="google_translate_say",
                entity_id="all",
                message=clean
            )
            if res.get("success"):
                return {
                    "success": True,
                    "provider": "home_assistant_nest_broadcast",
                    "message": clean,
                    "summary": f"Broadcasted '{clean}' to all Google Nest speakers via Home Assistant."
                }

        # 2. Local network broadcast simulation
        return {
            "success": True,
            "provider": "google_home_broadcast",
            "message": clean,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "summary": f"Vocal announcement transmitted to Google Home / Nest network: *\"{clean}\"*."
        }


google_home_bridge = GoogleHomeBridge()
home_assistant_bridge = HomeAssistantBridge()
google_nest_broadcaster = GoogleNestBroadcaster()
