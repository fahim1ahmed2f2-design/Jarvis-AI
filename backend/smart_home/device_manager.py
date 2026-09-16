import json
import logging
from typing import List, Dict, Any, Optional
from backend.memory.database import get_db_connection
from backend.smart_home.google_home import (
    load_smart_home_config,
    save_smart_home_config,
    google_home_bridge,
    home_assistant_bridge,
    google_nest_broadcaster
)

logger = logging.getLogger("jarvis.smart_home")

class SmartDeviceManager:
    def __init__(self):
        self.config = load_smart_home_config()

    def get_active_provider(self) -> str:
        return load_smart_home_config().get("active_provider", "virtual")

    def set_active_provider(self, provider: str) -> Dict[str, Any]:
        cfg = load_smart_home_config()
        cfg["active_provider"] = provider
        save_smart_home_config(cfg)
        return {"success": True, "active_provider": provider}

    def get_devices(self, room: Optional[str] = None, dev_type: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            sql = "SELECT * FROM smart_devices WHERE 1=1"
            params = []
            if room:
                sql += " AND LOWER(room) = LOWER(?)"
                params.append(room)
            if dev_type:
                sql += " AND LOWER(type) = LOWER(?)"
                params.append(dev_type)
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            results = []
            prov = self.get_active_provider()
            for r in rows:
                item = dict(r)
                try:
                    caps = json.loads(item.get("capabilities_json", "[]"))
                except Exception:
                    caps = []
                try:
                    state = json.loads(item.get("state_json", "{}"))
                except Exception:
                    state = {}
                results.append({
                    "id": item["id"],
                    "name": item["name"],
                    "type": item["type"],
                    "room": item["room"],
                    "capabilities": caps,
                    "state": state,
                    "provider": prov if prov != "virtual" else item["provider"],
                    "online": bool(item["online"])
                })
            return results
        finally:
            conn.close()

    def find_device_by_name(self, query: str) -> Optional[Dict[str, Any]]:
        clean_q = query.lower().strip()
        devices = self.get_devices()
        for d in devices:
            if clean_q in d["name"].lower() or d["id"].lower() == clean_q:
                return d
        # Match by room + type (e.g. "living room light")
        for d in devices:
            r = d["room"].lower()
            t = d["type"].lower()
            if r in clean_q and t in clean_q:
                return d
        return None

    def get_rooms(self) -> List[Dict[str, Any]]:
        devices = self.get_devices()
        room_names = sorted(list(set(d["room"] for d in devices if d.get("room"))))
        return [{"id": f"room_{r.lower().replace(' ', '_')}", "name": r, "description": f"{r} smart zone"} for r in room_names]

    def toggle_device(self, device_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM smart_devices WHERE id = ?", (device_id,))
            row = cursor.fetchone()
            if not row:
                return None
            
            try:
                state = json.loads(row["state_json"])
            except Exception:
                state = {}

            curr_power = state.get("power", "off")
            new_power = "off" if curr_power == "on" else "on"
            state["power"] = new_power

            cursor.execute("UPDATE smart_devices SET state_json = ? WHERE id = ?", (json.dumps(state), device_id))
            conn.commit()

            # Forward to Google Home or Home Assistant if active
            prov = self.get_active_provider()
            if prov == "google_home":
                google_home_bridge.send_command(device_id, "action.devices.commands.OnOff", {"on": new_power == "on"})
            elif prov == "home_assistant":
                service = "turn_on" if new_power == "on" else "turn_off"
                domain = "light" if row["type"] == "light" else "switch"
                home_assistant_bridge.call_service(domain, service, device_id)

            return {"id": device_id, "name": row["name"], "state": state, "status": "success", "provider": prov}
        finally:
            conn.close()

    def set_device_value(self, device_id: str, capability: str, value: Any) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM smart_devices WHERE id = ?", (device_id,))
            row = cursor.fetchone()
            if not row:
                return None
            
            try:
                state = json.loads(row["state_json"])
            except Exception:
                state = {}

            state[capability] = value
            if capability in ["brightness", "speed", "temperature"] and state.get("power") == "off":
                state["power"] = "on"

            cursor.execute("UPDATE smart_devices SET state_json = ? WHERE id = ?", (json.dumps(state), device_id))
            conn.commit()

            # Forward to external bridge
            prov = self.get_active_provider()
            if prov == "google_home":
                if capability == "power":
                    google_home_bridge.send_command(device_id, "action.devices.commands.OnOff", {"on": value == "on"})
                elif capability == "brightness":
                    google_home_bridge.send_command(device_id, "action.devices.commands.BrightnessAbsolute", {"brightness": int(value)})
                elif capability == "temperature":
                    google_home_bridge.send_command(device_id, "action.devices.commands.ThermostatTemperatureSetpoint", {"thermostatTemperatureSetpoint": float(value)})
            elif prov == "home_assistant":
                if capability == "brightness":
                    home_assistant_bridge.call_service("light", "turn_on", device_id, brightness_pct=int(value))
                elif capability == "temperature":
                    home_assistant_bridge.call_service("climate", "set_temperature", device_id, temperature=float(value))

            return {"id": device_id, "name": row["name"], "capability": capability, "value": value, "state": state, "status": "success"}
        finally:
            conn.close()

    def control_group(self, group_type: str, action: str, room: Optional[str] = None) -> Dict[str, Any]:
        devices = self.get_devices(room=room, dev_type=group_type)
        updated = 0
        for d in devices:
            if action in ["on", "off"]:
                self.set_device_value(d["id"], "power", action)
                updated += 1
        return {"group_type": group_type, "action": action, "room": room, "updated_count": updated}

    def get_scenes(self) -> Dict[str, Any]:
        cfg = load_smart_home_config()
        return cfg.get("scenes", {})

    def activate_scene(self, scene_id: str) -> Dict[str, Any]:
        clean_id = scene_id.lower().replace(" ", "_").strip()
        scenes = self.get_scenes()
        scene = scenes.get(clean_id)
        if not scene:
            # Fuzzy match
            for k, sc in scenes.items():
                if clean_id in k or clean_id in sc.get("name", "").lower():
                    scene = sc
                    clean_id = k
                    break

        if not scene:
            return {"success": False, "error": f"Scene '{scene_id}' not found."}

        actions_taken = []
        for act in scene.get("actions", []):
            dev_id = act.get("device_id")
            if not dev_id:
                continue
            if "power" in act:
                self.set_device_value(dev_id, "power", act["power"])
            if "brightness" in act:
                self.set_device_value(dev_id, "brightness", act["brightness"])
            if "temperature" in act:
                self.set_device_value(dev_id, "temperature", act["temperature"])
            if "speed" in act:
                self.set_device_value(dev_id, "speed", act["speed"])
            actions_taken.append(dev_id)

        return {
            "success": True,
            "scene_id": clean_id,
            "scene_name": scene.get("name"),
            "devices_updated": len(actions_taken),
            "description": scene.get("description")
        }

    def broadcast_announcement(self, message: str) -> Dict[str, Any]:
        return google_nest_broadcaster.broadcast(message)

smart_device_manager = SmartDeviceManager()
