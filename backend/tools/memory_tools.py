from typing import Dict, Any, List
from backend.memory.memory_engine import memory_engine
from backend.tools.registry import tool_registry

def store_memory(content: str, category: str = "preference", topic: str = "") -> str:
    """Stores information into JARVIS long-term memory."""
    res = memory_engine.create_memory(content=content, category=category, topic_key=topic)
    return f"Saved to memory: '{content}' (Category: {category})"

def recall_memory(query: str) -> str:
    """Recalls memories relevant to a query."""
    mems = memory_engine.search_memories(query, limit=5)
    if not mems:
        return f"No memories found matching '{query}'."
    return "\n".join([f"- [{m.get('category')}] {m.get('content')}" for m in mems])

tool_registry.register_tool("store_memory", "Save a piece of knowledge, preference, or fact to memory", store_memory)
tool_registry.register_tool("recall_memory", "Search and retrieve facts from long-term memory", recall_memory)
