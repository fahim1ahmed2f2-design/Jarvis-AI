import uuid
import math
import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from backend.memory.database import get_db_connection

class MemoryEngine:
    def __init__(self):
        self.enabled = True

    def create_memory(self, content: str, category: str = "preference", topic_key: str = "", importance: int = 1, source: str = "user") -> Dict[str, Any]:
        mem_id = str(uuid.uuid4())
        now_iso = datetime.now(timezone.utc).isoformat()
        if not topic_key:
            words = re.findall(r'\b[A-Za-z0-9_]{3,}\b', content)
            topic_key = words[0].lower() if words else "general"

        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO memories (id, category, topic_key, content, importance, source, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (mem_id, category, topic_key, content.strip(), importance, source, now_iso, now_iso)
            )
            conn.commit()
            return {
                "id": mem_id,
                "category": category,
                "topic_key": topic_key,
                "content": content.strip(),
                "importance": importance,
                "source": source,
                "created_at": now_iso,
                "updated_at": now_iso
            }
        finally:
            conn.close()

    def add_memory(self, content: str, category: str = "preference", topic_key: str = "", importance: int = 1, source: str = "user") -> Dict[str, Any]:
        """Convenience alias for create_memory."""
        return self.create_memory(
            content=content,
            category=category,
            topic_key=topic_key,
            importance=importance,
            source=source
        )

    def get_all_memories(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            if category:
                cursor.execute(
                    "SELECT * FROM memories WHERE category = ? ORDER BY importance DESC, updated_at DESC",
                    (category,)
                )
            else:
                cursor.execute("SELECT * FROM memories ORDER BY importance DESC, updated_at DESC")
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    def get_memory_by_id(self, memory_id: str) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM memories WHERE id = ?", (memory_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
        finally:
            conn.close()

    def update_memory(self, memory_id: str, content: str, category: Optional[str] = None, importance: Optional[int] = None) -> Optional[Dict[str, Any]]:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            now_iso = datetime.now(timezone.utc).isoformat()
            if category is not None and importance is not None:
                cursor.execute(
                    "UPDATE memories SET content = ?, category = ?, importance = ?, updated_at = ? WHERE id = ?",
                    (content.strip(), category, importance, now_iso, memory_id)
                )
            elif category is not None:
                cursor.execute(
                    "UPDATE memories SET content = ?, category = ?, updated_at = ? WHERE id = ?",
                    (content.strip(), category, now_iso, memory_id)
                )
            else:
                cursor.execute(
                    "UPDATE memories SET content = ?, updated_at = ? WHERE id = ?",
                    (content.strip(), now_iso, memory_id)
                )
            conn.commit()
            return self.get_memory_by_id(memory_id)
        finally:
            conn.close()

    def delete_memory(self, memory_id: str) -> bool:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM memories WHERE id = ?", (memory_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

    def clear_all(self) -> bool:
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM memories")
            conn.commit()
            return True
        finally:
            conn.close()

    def search_memories(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Hybrid keyword and TF-IDF relevance search across stored memories.
        """
        all_mems = self.get_all_memories()
        if not all_mems or not query.strip():
            return []

        q_terms = set(re.findall(r'\w+', query.lower()))
        if not q_terms:
            return all_mems[:limit]

        scored = []
        for m in all_mems:
            text = f"{m['category']} {m['topic_key']} {m['content']}".lower()
            text_terms = re.findall(r'\w+', text)
            
            # Simple TF-IDF / term overlap scoring
            matches = sum(1 for t in q_terms if t in text)
            importance_boost = m.get("importance", 1) * 0.5
            
            if matches > 0:
                score = matches + importance_boost
                scored.append((score, m))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored[:limit]]

    def get_memory_context_string(self, query: str = "") -> str:
        """
        Formats relevant memories into a clean prompt context block for the AI brain.
        """
        if query:
            relevant = self.search_memories(query, limit=5)
        else:
            relevant = self.get_all_memories()[:5]

        if not relevant:
            return ""

        lines = ["[LONG-TERM RECALLED MEMORIES]"]
        for m in relevant:
            lines.append(f"- [{m.get('category', 'general').upper()}] {m.get('content')}")
        return "\n".join(lines)

memory_engine = MemoryEngine()
