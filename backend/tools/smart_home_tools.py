import logging
from typing import Dict, Any, Optional
from backend.tools.registry import tool_registry
from backend.smart_home.device_manager import smart_device_manager

logger = logging.getLogger("jarvis.tools.smart_home")

def smart_home_control(
    device_name: str,
    action: str = "toggle",
    brightness: Optional[int] = None,
    temperature: Optional[float] = None,
    speed: Optional[int] = None
) -> Dict[str, Any]:
    """
    Controls smart home devices (Google Home, Nest, Lights, AC, Fans, Plugs).
    - device_name: name of the device or room (e.g. 'Living Room Light', 'Bedroom Lamp', 'AC', 'Fan')
    - action: 'on', 'off', 'toggle', 'set'
    - brightness: optional brightness percentage (10-100)
    - temperature: optional AC/thermostat target temperature in Celsius
    - speed: optional fan speed (1-3)
    """
    device = smart_device_manager.find_device_by_name(device_name)
    if not device:
        # Check if user specified a room
        rooms = [r["name"].lower() for r in smart_device_manager.get_rooms()]
        for r in rooms:
            if r in device_name.lower():
                return smart_home_room_control(r, action)
        return {
            "success": False,
            "error": f"Smart device '{device_name}' not found. Check registered devices."
        }

    dev_id = device["id"]
    results = {"device": device["name"], "room": device["room"]}

    if action == "toggle":
        res = smart_device_manager.toggle_device(dev_id)
        return {"success": True, "action": "toggle", "state": res.get("state"), **results}

    if action in ["on", "off"]:
        smart_device_manager.set_device_value(dev_id, "power", action)
        results["power"] = action

    if brightness is not None and "brightness" in device.get("capabilities", []):
        smart_device_manager.set_device_value(dev_id, "brightness", int(brightness))
        results["brightness"] = int(brightness)

    if temperature is not None and "temperature" in device.get("capabilities", []):
        smart_device_manager.set_device_value(dev_id, "temperature", float(temperature))
        results["temperature"] = float(temperature)

    if speed is not None and "speed" in device.get("capabilities", []):
        smart_device_manager.set_device_value(dev_id, "speed", int(speed))
        results["speed"] = int(speed)

    return {"success": True, "status": "executed", **results}

def smart_home_room_control(room: str, action: str = "off") -> Dict[str, Any]:
    """
    Controls all smart devices in a specified room (e.g. 'Living Room', 'Bedroom', 'Office').
    """
    clean_room = room.strip().title()
    clean_action = action.lower()
    devices = smart_device_manager.get_devices(room=clean_room)
    if not devices:
        # Try case-insensitive matching
        for r in smart_device_manager.get_rooms():
            if room.lower() in r["name"].lower():
                clean_room = r["name"]
                devices = smart_device_manager.get_devices(room=clean_room)
                break

    if not devices:
        return {"success": False, "error": f"No smart devices found in room '{room}'."}

    updated = []
    for d in devices:
        if clean_action in ["on", "off"]:
            smart_device_manager.set_device_value(d["id"], "power", clean_action)
            updated.append(d["name"])

    return {
        "success": True,
        "room": clean_room,
        "action": clean_action,
        "devices_affected": updated,
        "count": len(updated)
    }

def smart_home_activate_scene(scene_name: str) -> Dict[str, Any]:
    """
    Activates pre-configured cinematic smart home scenes:
    - 'movie_night': Dims living room lights to 15%, TV plug on, AC to 22C
    - 'focus_mode': Office desk lamp 100%, desk fan on, quiet other zones
    - 'cyber_shield': High-contrast tactical lighting and system audit
    - 'night_standby': All lights off, appliances off, AC quiet 24C
    - 'arc_reactor_pulse': Full illumination test 100% across all fixtures
    """
    return smart_device_manager.activate_scene(scene_name)

def smart_home_list_devices(room: Optional[str] = None, type: Optional[str] = None) -> Dict[str, Any]:
    """Lists all smart home devices, states, and active provider."""
    devs = smart_device_manager.get_devices(room=room, dev_type=type)
    return {
        "success": True,
        "active_provider": smart_device_manager.get_active_provider(),
        "total": len(devs),
        "devices": devs
    }

def google_home_broadcast(message: str) -> Dict[str, Any]:
    """
    Broadcasts a voice message / announcement to all Google Home / Nest speakers across the network.
    """
    return smart_device_manager.broadcast_announcement(message)

def smart_home_set_provider(provider: str) -> Dict[str, Any]:
    """
    Switches active smart home provider ('virtual', 'google_home', 'home_assistant').
    """
    return smart_device_manager.set_active_provider(provider)

# Register tools
tool_registry.register_tool("smart_home_control", "Control smart home devices (Google Home, Lights, AC, Plugs)", smart_home_control)
tool_registry.register_tool("smart_home_room_control", "Batch control all devices in a room (e.g. turn off bedroom)", smart_home_room_control)
tool_registry.register_tool("smart_home_activate_scene", "Activate cinematic smart scenes (movie_night, focus_mode, night_standby)", smart_home_activate_scene)
tool_registry.register_tool("smart_home_list_devices", "List all smart home IoT devices and current states", smart_home_list_devices)
tool_registry.register_tool("google_home_broadcast", "Broadcast voice announcement to all Google Home / Nest speakers", google_home_broadcast)
tool_registry.register_tool("smart_home_set_provider", "Switch smart home provider (virtual, google_home, home_assistant)", smart_home_set_provider)
