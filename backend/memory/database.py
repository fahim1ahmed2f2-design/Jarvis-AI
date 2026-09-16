import sqlite3
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from backend.config import DB_PATH

logger = logging.getLogger("jarvis.database")

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), timeout=15.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn

def init_db():
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        
        # 1. Memories Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                category TEXT NOT NULL DEFAULT 'preference',
                topic_key TEXT DEFAULT '',
                content TEXT NOT NULL,
                importance INTEGER DEFAULT 1,
                source TEXT DEFAULT 'user',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_memories_topic ON memories(topic_key);")

        # 2. Reminders Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS reminders (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                due_timestamp TEXT NOT NULL,
                due_epoch REAL NOT NULL,
                recurring INTEGER DEFAULT 0,
                recurrence_rule TEXT DEFAULT 'none',
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TEXT NOT NULL
            );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_reminders_epoch ON reminders(due_epoch);")

        # 3. Timers Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS timers (
                id TEXT PRIMARY KEY,
                label TEXT NOT NULL DEFAULT 'Timer',
                duration_seconds REAL NOT NULL,
                remaining_seconds REAL NOT NULL,
                start_epoch REAL NOT NULL,
                end_epoch REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'running',
                created_at TEXT NOT NULL
            );
        """)

        # 4. User Tasks (Kanban / Project Tasks)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                priority TEXT NOT NULL DEFAULT 'medium',
                status TEXT NOT NULL DEFAULT 'TODO',
                created_at TEXT NOT NULL,
                due_at TEXT DEFAULT NULL,
                completed_at TEXT DEFAULT NULL
            );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_tasks_status ON user_tasks(status);")

        # 5. Conversations Sessions Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL DEFAULT 'New Conversation',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)

        # 6. Conversation Messages Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                sender TEXT NOT NULL,
                content TEXT NOT NULL,
                intent TEXT DEFAULT NULL,
                timestamp TEXT NOT NULL,
                steps_json TEXT DEFAULT '[]',
                is_error INTEGER DEFAULT 0,
                FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);")

        # 7. Contacts Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS contacts (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT DEFAULT '',
                phone TEXT DEFAULT '',
                telegram_handle TEXT DEFAULT '',
                whatsapp_id TEXT DEFAULT '',
                notes TEXT DEFAULT ''
            );
        """)

        # 8. Emails Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS emails (
                id TEXT PRIMARY KEY,
                sender_name TEXT NOT NULL,
                sender_email TEXT NOT NULL,
                subject TEXT NOT NULL,
                snippet TEXT DEFAULT '',
                body TEXT DEFAULT '',
                timestamp TEXT NOT NULL,
                is_unread INTEGER DEFAULT 1
            );
        """)

        # 9. Smart Devices Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS smart_devices (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                room TEXT NOT NULL,
                capabilities_json TEXT DEFAULT '[]',
                state_json TEXT DEFAULT '{}',
                provider TEXT DEFAULT 'virtual',
                online INTEGER DEFAULT 1
            );
        """)

        # 10. Action History Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS action_history (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                time_display TEXT NOT NULL,
                user_command TEXT NOT NULL,
                tool TEXT NOT NULL,
                status TEXT NOT NULL,
                result TEXT NOT NULL,
                duration_ms REAL DEFAULT 0,
                arguments_json TEXT DEFAULT '{}'
            );
        """)

        # 11. Autonomous Agent Tasks
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS autonomous_tasks (
                task_id TEXT PRIMARY KEY,
                goal TEXT NOT NULL,
                status TEXT NOT NULL,
                steps_json TEXT DEFAULT '[]',
                current_step INTEGER DEFAULT 0,
                requires_confirmation INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                duration_seconds REAL DEFAULT 0,
                error_message TEXT DEFAULT '',
                result_summary TEXT DEFAULT ''
            );
        """)

        # Seed initial smart devices and default conversation if empty
        cursor.execute("SELECT COUNT(*) as count FROM smart_devices;")
        if cursor.fetchone()["count"] == 0:
            initial_devices = [
                ("dev_light_living", "Living Room Light", "light", "Living Room", json.dumps(["power", "brightness"]), json.dumps({"power": "on", "brightness": 80}), "virtual", 1),
                ("dev_light_bedroom", "Bedroom Ceiling Lamp", "light", "Bedroom", json.dumps(["power", "brightness"]), json.dumps({"power": "off", "brightness": 50}), "virtual", 1),
                ("dev_ac_living", "Living Room AC", "thermostat", "Living Room", json.dumps(["power", "temperature"]), json.dumps({"power": "on", "temperature": 22}), "virtual", 1),
                ("dev_fan_office", "Office Desk Fan", "fan", "Office", json.dumps(["power", "speed"]), json.dumps({"power": "off", "speed": 1}), "virtual", 1),
                ("dev_plug_tv", "Smart TV Plug", "plug", "Living Room", json.dumps(["power"]), json.dumps({"power": "on"}), "virtual", 1),
            ]
            cursor.executemany(
                "INSERT INTO smart_devices (id, name, type, room, capabilities_json, state_json, provider, online) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                initial_devices
            )

        cursor.execute("SELECT COUNT(*) as count FROM conversations WHERE id = 'default';")
        if cursor.fetchone()["count"] == 0:
            now_iso = datetime.now(timezone.utc).isoformat()
            cursor.execute(
                "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
                ("default", "Main Command Session", now_iso, now_iso)
            )

        conn.commit()
        logger.info("Database schema verified and initialized.")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        conn.rollback()
        raise e
    finally:
        conn.close()

# Initialize immediately on module load
init_db()
