import sqlite3
import json
import logging
from typing import List, Optional, Dict, Any
from backend.config import DB_PATH
from backend.ambient_memory.models import AmbientMemoryItem

logger = logging.getLogger("jarvis.ambient_memory.storage")

class AmbientMemoryStorage:
    """
    Dedicated local SQLite storage adapter for Ambient Memory episodes.
    
    Guarantees:
    - 100% local persistence surviving JARVIS and PC restarts.
    - Idempotency and duplicate prevention.
    - Zero API keys or secrets in records.
    - Robust error isolation preventing database locks from affecting JARVIS.
    """
    def __init__(self, db_path=None):
        self.db_path = str(db_path or DB_PATH)
        self.init_schema()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=15.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        return conn

    def init_schema(self):
        """Creates table and indexes, adding status column if needed."""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS ambient_memories (
                    id TEXT PRIMARY KEY,
                    date TEXT NOT NULL,
                    start_time TEXT NOT NULL,
                    end_time TEXT NOT NULL,
                    transcript TEXT NOT NULL,
                    language TEXT DEFAULT 'auto',
                    confidence REAL DEFAULT 1.0,
                    audio_reference TEXT DEFAULT NULL,
                    status TEXT DEFAULT 'processed',
                    metadata_json TEXT DEFAULT '{}',
                    created_at TEXT NOT NULL
                );
            """)
            
            # Migration check: Ensure status column exists if table was created earlier
            cursor.execute("PRAGMA table_info(ambient_memories);")
            columns = [row["name"] for row in cursor.fetchall()]
            if "status" not in columns:
                try:
                    cursor.execute("ALTER TABLE ambient_memories ADD COLUMN status TEXT DEFAULT 'processed';")
                except Exception as col_err:
                    logger.debug(f"Status column migration notice: {col_err}")

            cursor.execute("CREATE INDEX IF NOT EXISTS idx_ambient_date ON ambient_memories(date);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_ambient_time ON ambient_memories(date, start_time);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_ambient_created ON ambient_memories(created_at);")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_ambient_lang ON ambient_memories(language);")
            conn.commit()
        except Exception as e:
            logger.error(f"[AMBIENT_STORAGE] Schema initialization error: {e}")
            conn.rollback()
            raise e
        finally:
            conn.close()

    def save(self, item: AmbientMemoryItem) -> AmbientMemoryItem:
        """
        Inserts or updates an AmbientMemoryItem.
        Prevents duplicate entries for identical timestamp and content.
        """
        conn = self._get_connection()
        try:
            cursor = conn.cursor()

            # Duplicate prevention check (same date, start_time, and transcript)
            cursor.execute(
                """
                SELECT id FROM ambient_memories 
                WHERE date = ? AND start_time = ? AND transcript = ? AND id != ?
                LIMIT 1
                """,
                (item.date, item.start_time, item.transcript, item.id)
            )
            existing_duplicate = cursor.fetchone()
            if existing_duplicate:
                # If duplicate already recorded under another ID, return the existing ID item
                logger.debug(f"[AMBIENT_STORAGE] Deduplicated ambient item at {item.date} {item.start_time}")
                return self.get(existing_duplicate["id"]) or item

            # Strip any potential sensitive keys or auth tokens before storing metadata
            clean_metadata = {k: v for k, v in item.metadata.items() if not any(s in k.lower() for s in ["key", "secret", "token", "password", "auth"])}

            cursor.execute(
                """
                INSERT INTO ambient_memories (
                    id, date, start_time, end_time, transcript,
                    language, confidence, audio_reference, status, metadata_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    date=excluded.date,
                    start_time=excluded.start_time,
                    end_time=excluded.end_time,
                    transcript=excluded.transcript,
                    language=excluded.language,
                    confidence=excluded.confidence,
                    audio_reference=excluded.audio_reference,
                    status=excluded.status,
                    metadata_json=excluded.metadata_json,
                    created_at=excluded.created_at
                """,
                (
                    item.id,
                    item.date,
                    item.start_time,
                    item.end_time,
                    item.transcript,
                    item.language,
                    item.confidence,
                    item.audio_reference,
                    item.status,
                    json.dumps(clean_metadata, ensure_ascii=False),
                    item.created_at
                )
            )
            conn.commit()
            return item
        except Exception as e:
            logger.error(f"[AMBIENT_STORAGE] Error saving memory item: {e}")
            conn.rollback()
            raise e
        finally:
            conn.close()

    def get(self, item_id: str) -> Optional[AmbientMemoryItem]:
        """Retrieves a single AmbientMemoryItem by unique ID."""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM ambient_memories WHERE id = ?", (item_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return self._row_to_item(row)
        except Exception as e:
            logger.error(f"[AMBIENT_STORAGE] Error retrieving memory {item_id}: {e}")
            return None
        finally:
            conn.close()

    def get_by_id(self, item_id: str) -> Optional[AmbientMemoryItem]:
        """Alias for get."""
        return self.get(item_id)

    def get_by_date(self, date_str: str, limit: int = 100, offset: int = 0) -> List[AmbientMemoryItem]:
        """Retrieves ambient memories for a specific date (YYYY-MM-DD)."""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT * FROM ambient_memories 
                WHERE date = ? 
                ORDER BY start_time ASC 
                LIMIT ? OFFSET ?
                """,
                (date_str, limit, offset)
            )
            rows = cursor.fetchall()
            return [self._row_to_item(r) for r in rows]
        except Exception as e:
            logger.error(f"[AMBIENT_STORAGE] Error fetching memories for date {date_str}: {e}")
            return []
        finally:
            conn.close()

    def get_by_time_range(
        self,
        date_str: str,
        start_time: str,
        end_time: str,
        limit: int = 200
    ) -> List[AmbientMemoryItem]:
        """
        Retrieves ambient memories within a specific time range on a given date.
        e.g., date="2026-08-31", start_time="14:00:00", end_time="14:30:00"
        """
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT * FROM ambient_memories 
                WHERE date = ? 
                  AND start_time >= ? 
                  AND start_time <= ? 
                ORDER BY start_time ASC 
                LIMIT ?
                """,
                (date_str, start_time, end_time, limit)
            )
            rows = cursor.fetchall()
            return [self._row_to_item(r) for r in rows]
        except Exception as e:
            logger.error(f"[AMBIENT_STORAGE] Error querying time range: {e}")
            return []
        finally:
            conn.close()

    def search_memories(
        self,
        date: Optional[str] = None,
        start_time: Optional[str] = None,
        end_time: Optional[str] = None,
        topic: Optional[str] = None,
        language: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
        order_asc: bool = True
    ) -> List[AmbientMemoryItem]:
        """
        Executes a multi-criteria search with guaranteed chronological ordering.
        """
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            query_parts = ["SELECT * FROM ambient_memories WHERE 1=1"]
            params = []

            if date:
                query_parts.append("AND date = ?")
                params.append(date)

            if start_time:
                query_parts.append("AND start_time >= ?")
                params.append(start_time)

            if end_time:
                query_parts.append("AND start_time <= ?")
                params.append(end_time)

            if language and language != "all":
                query_parts.append("AND language = ?")
                params.append(language)

            if status and status != "all":
                query_parts.append("AND status = ?")
                params.append(status)

            if topic and topic.strip():
                tokens = [t.strip() for t in topic.strip().split() if len(t.strip()) > 1]
                if tokens:
                    clause = " OR ".join(["transcript LIKE ?"] * len(tokens))
                    query_parts.append(f"AND ({clause})")
                    for tok in tokens:
                        params.append(f"%{tok}%")
                else:
                    query_parts.append("AND transcript LIKE ?")
                    params.append(f"%{topic.strip()}%")

            order_dir = "ASC" if order_asc else "DESC"
            query_parts.append(f"ORDER BY date {order_dir}, start_time {order_dir} LIMIT ? OFFSET ?")
            params.extend([limit, offset])

            cursor.execute(" ".join(query_parts), params)
            rows = cursor.fetchall()
            return [self._row_to_item(r) for r in rows]
        except Exception as e:
            logger.error(f"[AMBIENT_STORAGE] Error in search_memories: {e}")
            return []
        finally:
            conn.close()

    def list_all(
        self,
        date: Optional[str] = None,
        search_query: Optional[str] = None,
        language: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[AmbientMemoryItem]:
        """Retrieves a paginated list of ambient memories with optional filters."""
        return self.search_memories(
            date=date,
            topic=search_query,
            language=language,
            limit=limit,
            offset=offset,
            order_asc=False
        )

    def delete(self, item_id: str) -> bool:
        """Deletes a single ambient memory item by ID."""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM ambient_memories WHERE id = ?", (item_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            logger.error(f"[AMBIENT_STORAGE] Error deleting memory {item_id}: {e}")
            conn.rollback()
            return False
        finally:
            conn.close()

    def delete_one(self, item_id: str) -> bool:
        """Alias for delete."""
        return self.delete(item_id)

    def delete_by_time_range(self, date_str: str, start_time: str, end_time: str) -> int:
        """
        Deletes all ambient memories within a specified time range on a date.
        Returns number of deleted records.
        """
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                DELETE FROM ambient_memories 
                WHERE date = ? 
                  AND start_time >= ? 
                  AND start_time <= ?
                """,
                (date_str, start_time, end_time)
            )
            count = cursor.rowcount
            conn.commit()
            return count
        except Exception as e:
            logger.error(f"[AMBIENT_STORAGE] Error deleting by time range: {e}")
            conn.rollback()
            return 0
        finally:
            conn.close()

    def delete_all(self) -> int:
        """Deletes all ambient memory records."""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM ambient_memories")
            count = cursor.rowcount
            conn.commit()
            logger.info(f"[AMBIENT_STORAGE] Cleared all {count} ambient memories.")
            return count
        except Exception as e:
            logger.error(f"[AMBIENT_STORAGE] Error clearing all memories: {e}")
            conn.rollback()
            return 0
        finally:
            conn.close()

    def clear_all(self) -> int:
        """Alias for delete_all."""
        return self.delete_all()

    def count(self) -> int:
        """Returns the total count of stored ambient memory episodes."""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as cnt FROM ambient_memories")
            row = cursor.fetchone()
            return row["cnt"] if row else 0
        except Exception as e:
            logger.error(f"[AMBIENT_STORAGE] Error counting memories: {e}")
            return 0
        finally:
            conn.close()

    def get_distinct_dates(self) -> List[str]:
        """Returns distinct dates having ambient memories recorded."""
        conn = self._get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT DISTINCT date FROM ambient_memories ORDER BY date DESC")
            rows = cursor.fetchall()
            return [r["date"] for r in rows]
        except Exception as e:
            logger.error(f"[AMBIENT_STORAGE] Error getting distinct dates: {e}")
            return []
        finally:
            conn.close()

    def _row_to_item(self, row: sqlite3.Row) -> AmbientMemoryItem:
        meta = {}
        try:
            raw_meta = row["metadata_json"]
            if raw_meta:
                meta = json.loads(raw_meta)
        except Exception:
            meta = {}

        # Handle optional status column
        status_val = "processed"
        try:
            status_val = row["status"] or "processed"
        except Exception:
            status_val = "processed"

        return AmbientMemoryItem(
            id=row["id"],
            date=row["date"],
            start_time=row["start_time"],
            end_time=row["end_time"],
            transcript=row["transcript"],
            language=row["language"] or "auto",
            confidence=float(row["confidence"] if row["confidence"] is not None else 1.0),
            audio_reference=row["audio_reference"],
            status=status_val,
            metadata=meta,
            created_at=row["created_at"]
        )

ambient_storage = AmbientMemoryStorage()
