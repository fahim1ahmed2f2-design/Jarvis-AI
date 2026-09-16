import logging
import urllib.parse
from typing import List, Dict, Any, Optional
import httpx
from bs4 import BeautifulSoup
from backend.tools.registry import tool_registry

logger = logging.getLogger("jarvis.tools.web_search")

def web_search(query: str, max_results: int = 5) -> str:
    """Searches the live web and returns formatted results."""
    from backend.ai.dynamic_intelligence import dynamic_knowledge_engine
    results = dynamic_knowledge_engine.search_duckduckgo(query, max_results=max_results)
    if not results:
        return f"No web search results found for query: '{query}'."

    formatted = []
    for i, r in enumerate(results, 1):
        formatted.append(f"{i}. **{r.get('title')}**\n   {r.get('snippet')}\n   URL: {r.get('url')}")
    return "\n\n".join(formatted)

def fetch_webpage(url: str, max_chars: int = 4000) -> str:
    """Fetches text content from a web page URL."""
    try:
        with httpx.Client(timeout=10.0, follow_redirects=True) as client:
            res = client.get(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            if res.status_code != 200:
                return f"Failed to fetch webpage: HTTP {res.status_code}"
            soup = BeautifulSoup(res.text, "html.parser")
            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()
            text = soup.get_text(separator="\n", strip=True)
            if len(text) > max_chars:
                return text[:max_chars] + f"\n... [Truncated {len(text) - max_chars} characters]"
            return text
    except Exception as e:
        return f"Error fetching webpage: {e}"

def wikipedia_lookup(query: str) -> str:
    """Looks up encyclopedic summary on Wikipedia."""
    from backend.ai.dynamic_intelligence import dynamic_knowledge_engine
    data = dynamic_knowledge_engine.search_wikipedia(query)
    if data:
        return f"**{data['title']}**\n\n{data['summary']}\n\nRead more: {data.get('url')}"
    return f"No Wikipedia entry found for '{query}'."

def compile_research_dossier(topic: str, max_sources: int = 5) -> Dict[str, Any]:
    """
    Compiles an autonomous multi-source research dossier on any topic.
    Combines Wikipedia encyclopedia data with live web search results.
    """
    from backend.ai.dynamic_intelligence import dynamic_knowledge_engine
    
    clean_topic = topic.strip()
    wiki = dynamic_knowledge_engine.search_wikipedia(clean_topic)
    web_results = dynamic_knowledge_engine.search_duckduckgo(clean_topic, max_results=max_sources)
    
    sources = []
    if wiki:
        sources.append({"title": wiki["title"], "url": wiki.get("url", ""), "type": "Encyclopedia"})
    for r in web_results:
        sources.append({"title": r.get("title", ""), "url": r.get("url", ""), "type": "Live Web"})

    summary_paragraphs = []
    if wiki:
        summary_paragraphs.append(f"### 📚 Encyclopedic Foundation ({wiki['title']})\n{wiki['summary']}")
    
    if web_results:
        summary_paragraphs.append("### 🌐 Real-Time Intelligence & Key Citations")
        for i, item in enumerate(web_results[:4], 1):
            summary_paragraphs.append(f"{i}. **{item.get('title')}**\n   {item.get('snippet')}\n   [Link]({item.get('url')})")
            
    full_report = f"## 📑 Tactical Research Dossier: {clean_topic.title()}\n\n" + "\n\n".join(summary_paragraphs)
    
    return {
        "success": True,
        "topic": clean_topic,
        "dossier": full_report,
        "source_count": len(sources),
        "sources": sources
    }

tool_registry.register_tool("web_search", "Search the live web for information, news, and queries", web_search)
tool_registry.register_tool("fetch_webpage", "Fetch and extract text content from a URL", fetch_webpage)
tool_registry.register_tool("wikipedia_lookup", "Look up facts and encyclopedic definitions on Wikipedia", wikipedia_lookup)
tool_registry.register_tool("compile_research_dossier", "Compile multi-source intelligence dossier with web & wiki sources", compile_research_dossier)

