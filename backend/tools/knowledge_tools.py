import logging
import urllib.parse
from typing import Dict, Any
import httpx
from backend.tools.registry import tool_registry

logger = logging.getLogger("jarvis.tools.knowledge")

def query_wikipedia_knowledge(topic: str) -> Dict[str, Any]:
    """
    Fetches direct encyclopedic summaries, facts, and citations from Wikipedia REST API.
    """
    clean_topic = topic.strip()
    if not clean_topic:
        return {"success": False, "error": "No topic provided"}

    encoded = urllib.parse.quote(clean_topic.replace(" ", "_"))
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{encoded}"

    try:
        with httpx.Client(timeout=5.0) as client:
            res = client.get(url, headers={"User-Agent": "JARVIS-Assistant/2.0 (jarvis@antigravity.ai)"})
            if res.status_code == 200:
                data = res.json()
                title = data.get("title", clean_topic)
                extract = data.get("extract", "")
                desc = data.get("description", "")
                page_url = data.get("content_urls", {}).get("desktop", {}).get("page", f"https://en.wikipedia.org/wiki/{encoded}")
                thumb = data.get("thumbnail", {}).get("source")

                return {
                    "success": True,
                    "title": title,
                    "description": desc,
                    "extract": extract,
                    "url": page_url,
                    "thumbnail": thumb,
                    "summary": f"**{title}** ({desc}):\n\n{extract}\n\n[Read more on Wikipedia]({page_url})"
                }
    except Exception as e:
        logger.error(f"Wikipedia REST API error: {e}")

    return {
        "success": False,
        "topic": clean_topic,
        "error": f"Could not find Wikipedia summary for '{clean_topic}'."
    }

def get_instant_answer(query: str) -> Dict[str, Any]:
    """
    Fetches instant factual answers, definitions, and calculations via DuckDuckGo Instant Answer API.
    """
    clean_q = query.strip()
    encoded = urllib.parse.quote(clean_q)
    url = f"https://api.duckduckgo.com/?q={encoded}&format=json&no_html=1&skip_disambig=1"

    try:
        with httpx.Client(timeout=4.0) as client:
            res = client.get(url, headers={"User-Agent": "JARVIS-Protocol/2.0"})
            if res.status_code == 200:
                data = res.json()
                answer = data.get("Answer")
                abstract = data.get("AbstractText")
                heading = data.get("Heading")
                definition = data.get("Definition")
                
                result_text = answer or abstract or definition
                if result_text:
                    return {
                        "success": True,
                        "query": clean_q,
                        "heading": heading,
                        "answer": result_text,
                        "source": data.get("AbstractSource", "DuckDuckGo Instant Answers"),
                        "url": data.get("AbstractURL")
                    }
    except Exception as e:
        logger.debug(f"DuckDuckGo API error: {e}")

    return {
        "success": False,
        "query": clean_q,
        "error": f"No instant answer found for '{clean_q}'."
    }

tool_registry.register_tool("query_wikipedia_knowledge", "Fetch structured encyclopedic facts from Wikipedia REST API", query_wikipedia_knowledge)
tool_registry.register_tool("get_instant_answer", "Fetch instant factual answer, definition, or calculation", get_instant_answer)
