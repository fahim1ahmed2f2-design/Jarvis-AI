import logging
from datetime import datetime, timezone
from typing import Dict, Any, List

from backend.system.metrics import get_system_metrics
from backend.tools.live_data_tools import get_live_weather, get_live_crypto_and_fx, get_live_tech_news
from backend.memory.user_task_store import user_task_store
from backend.assistant.reminder_engine import reminder_engine
from backend.memory.memory_engine import memory_engine

logger = logging.getLogger("jarvis.intelligence.briefing")

class BriefingEngine:
    def generate_tactical_briefing(self, location: str = "Dhaka", language: str = "auto") -> Dict[str, Any]:
        """
        Generates a comprehensive executive intelligence briefing combining
        telemetry, weather, tasks, reminders, news, and market data.
        """
        now = datetime.now()
        time_str = now.strftime("%I:%M %p")
        date_str = now.strftime("%A, %d %B %Y")
        
        # 1. System Health & Hardware Audit
        metrics = get_system_metrics()
        cpu_pct = metrics.get("cpu", {}).get("usage_percent", 0)
        ram_pct = metrics.get("ram", {}).get("percent", 0)
        ram_free_gb = metrics.get("ram", {}).get("available_gb", 0)
        disk_pct = metrics.get("disk", {}).get("percent", 0)
        battery_pct = metrics.get("battery", {}).get("percent", 100)
        battery_plugged = metrics.get("battery", {}).get("plugged", True)

        system_status = "Optimal"
        if cpu_pct > 80 or ram_pct > 90:
            system_status = "High Load Warning"
        elif battery_pct < 20 and not battery_plugged:
            system_status = "Critical Battery Advisory"

        # 2. Weather
        weather_res = get_live_weather(location)
        weather_summary = weather_res.get("summary", f"Weather data unavailable for {location}")
        temp_c = weather_res.get("temperature_c", "--")
        condition = weather_res.get("condition", "Clear")

        # 3. Tasks & Reminders
        pending_tasks = user_task_store.get_all_tasks(status="pending")
        task_count = len(pending_tasks)
        top_tasks = [t.get("title", "") for t in pending_tasks[:3]]

        upcoming_reminders = reminder_engine.get_reminders(status="pending")
        reminder_count = len(upcoming_reminders)
        top_reminders = [r.get("title", "") for r in upcoming_reminders[:2]]

        # 4. Market & Crypto
        market_res = get_live_crypto_and_fx()
        btc_price = market_res.get("rates", {}).get("crypto", {}).get("BTC", {}).get("usd", 0)
        btc_change = market_res.get("rates", {}).get("crypto", {}).get("BTC", {}).get("change_24h", 0)
        usd_bdt = market_res.get("rates", {}).get("forex", {}).get("USD_BDT", 121.5)

        # 5. Top News
        news_res = get_live_tech_news(limit=3)
        headlines = [s.get("title") for s in news_res.get("stories", []) if s.get("title")]

        # 6. User Profile & Memory Recall
        memories = memory_engine.get_all_memories()
        memory_count = len(memories)

        # Generate Audio Script (Concise, cinematic JARVIS speech)
        audio_greeting = "Good day, Sir."
        if now.hour < 12:
            audio_greeting = "Good morning, Sir."
        elif now.hour < 17:
            audio_greeting = "Good afternoon, Sir."
        elif now.hour >= 20:
            audio_greeting = "Good evening, Sir."

        audio_script = (
            f"{audio_greeting} Tactical briefing initiated for {date_str}. "
            f"Current local time is {time_str}. "
            f"All core systems are currently {system_status}. CPU utilization is at {cpu_pct} percent, with {ram_free_gb} gigabytes of RAM available. "
            f"Weather in {location} reports {condition} at {temp_c} degrees Celsius. "
            f"You have {task_count} pending operational tasks and {reminder_count} scheduled reminders queued. "
            f"Bitcoin is trading at {btc_price:,.0f} dollars, and the US dollar stands at {usd_bdt} Taka. "
            "All autonomous security and agent capabilities remain standing by for your command."
        )

        markdown_report = (
            f"### 🛡️ JARVIS v2.0 TACTICAL INTELLIGENCE DOSSIER\n"
            f"**Timestamp:** `{date_str} // {time_str}` | **Status:** `{system_status.upper()}`\n\n"
            f"---\n\n"
            f"#### ⚡ 1. System & Hardware Audit\n"
            f"- **Core Status:** {system_status}\n"
            f"- **CPU Load:** `{cpu_pct}%` | **RAM Utilized:** `{ram_pct}%` (Free: `{ram_free_gb} GB`)\n"
            f"- **Disk Used:** `{disk_pct}%` | **Battery:** `{battery_pct}%` {'(Plugged In)' if battery_plugged else '(On Battery)'}\n\n"
            f"#### 🌤️ 2. Environment & Weather (`{location}`)\n"
            f"- **Condition:** {condition} | **Temperature:** `{temp_c}°C`\n"
            f"- **Summary:** {weather_summary}\n\n"
            f"#### 📋 3. Operations & Task Queue\n"
            f"- **Pending Tasks:** `{task_count}`" + (f" ({', '.join(top_tasks)})" if top_tasks else " (None queued)") + f"\n"
            f"- **Active Reminders:** `{reminder_count}`" + (f" ({', '.join(top_reminders)})" if top_reminders else " (None queued)") + f"\n\n"
            f"#### 📈 4. Financial & Market Radar\n"
            f"- **Bitcoin (BTC):** `${btc_price:,.2f}` (`{'+' if btc_change >= 0 else ''}{btc_change}% 24h`)\n"
            f"- **Forex Exchange:** `1 USD = {usd_bdt:.2f} BDT`\n\n"
            f"#### 🌐 5. Global Tech Radar\n"
            + "\n".join([f"- {h}" for h in headlines[:3]]) + f"\n\n"
            f"---\n"
            f"*JARVIS Mark-VII Autonomous Tactical Engine standing by.*"
        )

        return {
            "status": "success",
            "timestamp": now.isoformat(),
            "date": date_str,
            "time": time_str,
            "system_health": {
                "status": system_status,
                "cpu_percent": cpu_pct,
                "ram_percent": ram_pct,
                "ram_free_gb": ram_free_gb,
                "disk_percent": disk_pct,
                "battery_percent": battery_pct,
                "battery_plugged": battery_plugged
            },
            "weather": weather_res,
            "tasks": {
                "count": task_count,
                "items": pending_tasks[:5]
            },
            "reminders": {
                "count": reminder_count,
                "items": upcoming_reminders[:5]
            },
            "market": {
                "btc_usd": btc_price,
                "btc_change_24h": btc_change,
                "usd_bdt": usd_bdt
            },
            "news": headlines,
            "audio_script": audio_script,
            "markdown_report": markdown_report
        }

briefing_engine = BriefingEngine()
