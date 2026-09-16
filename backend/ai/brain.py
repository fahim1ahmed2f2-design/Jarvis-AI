import os
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from backend.config import (
    AI_PROVIDERS_CONFIG, CREDENTIALS_STATE_FILE,
    DEFAULT_PROVIDER, DEFAULT_MODEL
)
from backend.ai.prompts import get_system_prompt
from backend.ai.intent_classifier import intent_classifier
from backend.ai.reasoning_engine import reasoning_engine
from backend.ai.dynamic_intelligence import dynamic_knowledge_engine
from backend.ai.providers import (
    BaseLLMProvider, OpenAIProvider, GeminiProvider,
    ClaudeProvider, GroqProvider, DeepSeekProvider, LocalOllamaProvider
)
from backend.memory.memory_engine import memory_engine
from backend.memory.conversation_store import conversation_store

logger = logging.getLogger("jarvis.brain")

class JarvisBrain:
    def __init__(self):
        self.active_provider_name = DEFAULT_PROVIDER
        self.active_model_name = DEFAULT_MODEL
        self.providers: Dict[str, Dict[str, Any]] = {}
        self.load_credentials()

    def load_credentials(self):
        """Loads API keys from environment and local state file"""
        saved_state = {}
        if CREDENTIALS_STATE_FILE.exists():
            try:
                with open(CREDENTIALS_STATE_FILE, "r", encoding="utf-8") as f:
                    saved_state = json.load(f)
            except Exception as e:
                logger.error(f"Error loading credentials file: {e}")

        self.active_provider_name = saved_state.get("active_provider", os.getenv("ACTIVE_AI_PROVIDER", "gemini"))
        self.active_model_name = saved_state.get("active_model", os.getenv("ACTIVE_AI_MODEL", "gemini-3.5-flash"))

        for p_id, cfg in AI_PROVIDERS_CONFIG.items():
            env_val = os.getenv(cfg["env_key"], "")
            saved_val = saved_state.get("keys", {}).get(p_id, "")
            key = saved_val or env_val or None

            self.providers[p_id] = {
                "name": cfg["name"],
                "api_key": key,
                "default_model": cfg["default_model"],
                "available_models": cfg["models"],
                "free_info": cfg.get("free_info")
            }

    def save_credentials_state(self):
        keys_to_save = {}
        for p_id, p_data in self.providers.items():
            if p_data.get("api_key"):
                keys_to_save[p_id] = p_data["api_key"]

        state = {
            "active_provider": self.active_provider_name,
            "active_model": self.active_model_name,
            "keys": keys_to_save
        }
        try:
            with open(CREDENTIALS_STATE_FILE, "w", encoding="utf-8") as f:
                json.dump(state, f, indent=2)
        except Exception as e:
            logger.error(f"Error writing credentials file: {e}")

    def set_provider_key(self, provider_id: str, raw_key: str):
        if provider_id not in self.providers:
            raise ValueError(f"Unknown provider '{provider_id}'")
        self.providers[provider_id]["api_key"] = raw_key.strip()
        self.save_credentials_state()

    def remove_provider_key(self, provider_id: str):
        if provider_id in self.providers:
            self.providers[provider_id]["api_key"] = None
            self.save_credentials_state()

    def set_active_provider(self, provider_id: str, model_name: Optional[str] = None):
        if provider_id not in self.providers:
            raise ValueError(f"Unknown provider '{provider_id}'")
        self.active_provider_name = provider_id
        if model_name:
            self.active_model_name = model_name
        else:
            self.active_model_name = self.providers[provider_id]["default_model"]
        self.save_credentials_state()

    def get_provider_instance(self, provider_id: Optional[str] = None, model_name: Optional[str] = None) -> Optional[BaseLLMProvider]:
        p_id = provider_id or self.active_provider_name
        p_info = self.providers.get(p_id)
        if not p_info:
            return None

        key = p_info.get("api_key")
        model = model_name or (self.active_model_name if p_id == self.active_provider_name else p_info.get("default_model"))

        if p_id == "openai":
            return OpenAIProvider(api_key=key, model=model or "gpt-4o")
        elif p_id == "gemini":
            return GeminiProvider(api_key=key, model=model or "gemini-3.5-flash")
        elif p_id == "claude":
            return ClaudeProvider(api_key=key, model=model or "claude-3-7-sonnet-20250219")
        elif p_id == "groq":
            return GroqProvider(api_key=key, model=model or "llama-3.3-70b-versatile")
        elif p_id == "deepseek":
            return DeepSeekProvider(api_key=key, model=model or "deepseek-chat")
        elif p_id == "local":
            return LocalOllamaProvider(host=key or "http://localhost:11434", model=model or "llama3:latest")
        return None

    def get_all_providers_status(self) -> Dict[str, Any]:
        result = {}
        configured_count = 0
        for p_id, p_info in self.providers.items():
            key = p_info.get("api_key")
            is_conf = bool(key and len(key.strip()) > 3)
            if is_conf:
                configured_count += 1
            masked = f"{key[:4]}...{key[-4:]}" if (key and len(key) >= 8) else None
            prefix = key[:6] if key else None

            result[p_id] = {
                "provider": p_id,
                "name": p_info["name"],
                "configured": is_conf,
                "masked_key": masked,
                "key_prefix": prefix,
                "default_model": p_info["default_model"],
                "available_models": p_info["available_models"],
                "free_info": p_info.get("free_info")
            }

        return {
            "active_provider": self.active_provider_name,
            "active_model": self.active_model_name,
            "configured_count": configured_count,
            "providers": result
        }

    def evaluate_query_complexity(
        self,
        user_message: str,
        mode: str = "auto",
        model_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluates query complexity to automatically route between Fast, Thinking, Web Search, and Deep Research.
        Respects user explicit mode and model_override if provided.
        """
        raw = user_message.strip()
        low = raw.lower()

        # 1. Explicit user mode overrides
        if mode == "thinking":
            target = model_override or "gemini-3.5-flash-lite"
            return {
                "target_model": target,
                "route_type": "THINKING",
                "route_reason": f"🧠 Thinking Mode: Deep Chain-of-Thought reasoning with {target}",
                "needs_thinking": True,
                "needs_web_search": False,
                "needs_deep_research": False
            }
        elif mode == "deep_research":
            target = model_override or "gemini-3.5-flash-lite"
            return {
                "target_model": target,
                "route_type": "DEEP_RESEARCH",
                "route_reason": f"🔬 Deep Research Mode: Comprehensive multi-source synthesis with {target}",
                "needs_thinking": True,
                "needs_web_search": False,
                "needs_deep_research": True
            }
        elif mode == "web_search":
            target = model_override or "gemini-3.5-flash-lite"
            return {
                "target_model": target,
                "route_type": "WEB_SEARCH",
                "route_reason": f"🌐 Web Search Mode: Live web intelligence with {target}",
                "needs_thinking": False,
                "needs_web_search": True,
                "needs_deep_research": False
            }
        elif mode == "fast":
            target = model_override or "gemini-3.5-flash-lite"
            return {
                "target_model": target,
                "route_type": "FAST",
                "route_reason": f"⚡ Fast Mode: Rapid low-latency execution with {target}",
                "needs_thinking": False,
                "needs_web_search": False,
                "needs_deep_research": False
            }

        # 2. If model_override is passed in AUTO mode
        if model_override and model_override != "auto":
            return {
                "target_model": model_override,
                "route_type": "MANUAL",
                "route_reason": f"🎯 User Selected Model: {model_override}",
                "needs_thinking": "thinking" in model_override or "pro" in model_override or "3.7" in model_override,
                "needs_web_search": False,
                "needs_deep_research": False
            }

        # 3. AUTO Complexity Detection Heuristics
        # Check for deep research intent
        research_keywords = [
            "deep research", "research paper", "comprehensive analysis",
            "in-depth comparison", "literature review", "state of the art",
            "exhaustive study", "pros and cons in detail", "গবেষণা করো",
            "বিস্তারিত স্টাডি", "গভীর বিশ্লেষণ", "তুলনামূলক পর্যালোচনা"
        ]
        if any(kw in raw for kw in research_keywords):
            return {
                "target_model": "gemini-3.5-flash-lite",
                "route_type": "DEEP_RESEARCH",
                "route_reason": "🔬 Auto-Detected: Complex research query — routed to Deep Research & Gemini 3.5 Flash Lite",
                "needs_thinking": True,
                "needs_web_search": False,
                "needs_deep_research": True
            }

        # Check for real-time web search intent
        web_keywords = [
            "weather", "temperature", "forecast", "latest news", "today's news",
            "current price", "stock price", "who won", "score of", "released date",
            "latest version of", "current president", "breaking news", "bitcoin price",
            "gold price", "exchange rate", "dollar rate", "আজকের খবর", "আবহাওয়া",
            "বর্তমান বাজারদর", "তাজা খবর", "রিসেন্ট ঘটনা", "সর্বশেষ আপডেট", "ডলার রেট"
        ]
        if any(kw in raw for kw in web_keywords):
            return {
                "target_model": "gemini-3.5-flash-lite",
                "route_type": "WEB_SEARCH",
                "route_reason": "🌐 Auto-Detected: Live / real-time event query — routed to Live Web Search & Gemini 3.5 Flash Lite",
                "needs_thinking": False,
                "needs_web_search": True,
                "needs_deep_research": False
            }

        # Check for deep narrative, storytelling, history, or detailed explanation intent
        detail_keywords = [
            "in detail", "in-depth", "tell me the story", "tell a story", "full story",
            "explain thoroughly", "explain in detail", "detailed explanation", "history of",
            "complete history", "step by step guide", "how does it work in detail",
            "tell me about", "breakdown of", "background of",
            "বিস্তারিত", "পুরো গল্প", "গল্প বলো", "ইতিহাস বলো", "বিস্তারিত বুঝিয়ে বলো",
            "ডিটেইলস", "গভীরভাবে ব্যাখ্যা", "সম্পূর্ণ ঘটনা", "বিস্তারিত জানতে চাই",
            "বিস্তারিত বর্ণনা", "কেন হয়েছিল", "কীভাবে কাজ করে বিস্তারিত", "গল্প শোনাও"
        ]
        if any(kw in low for kw in detail_keywords):
            return {
                "target_model": "gemini-3.5-flash-lite",
                "route_type": "THINKING",
                "route_reason": "🧠 Auto-Detected: In-Depth / Storytelling request — routed to Deep Cognitive Reasoning on Gemini 3.5 Flash Lite",
                "needs_thinking": True,
                "needs_web_search": False,
                "needs_deep_research": False,
                "is_deep_detail": True
            }

        # Check for complex technical / programming / math reasoning
        code_math_triggers = [
            "```", "def ", "class ", "function ", "import ", "async ", "const ", "let ",
            "algorithm", "leetcode", "refactor", "bug", "error trace", "stack trace",
            "write a python", "write a script", "create a react", "build a component",
            "dockerfile", "sql query", "database schema", "regex pattern", "formula",
            "calculate the", "integral", "derivative", "solve equation", "prove that",
            "time complexity", "space complexity", "system design", "architecture",
            "machine learning", "deep learning", "neural network", "transformer", "self-attention",
            "কোড লিখে দাও", "বাগ ফিক্স", "অ্যালগরিদম", "লজিক বুঝিয়ে বলো", "ম্যাথ সমাধান", "গণিত"
        ]
        is_long = len(user_message.split()) > 75 or "\n" in user_message.strip()
        has_code_trigger = any(t in low for t in code_math_triggers)

        if has_code_trigger or is_long:
            return {
                "target_model": "gemini-3.5-flash-lite",
                "route_type": "THINKING",
                "route_reason": "🧠 Auto-Detected: High-complexity problem — auto-escalated to Gemini 3.5 Flash Lite Thinking Engine",
                "needs_thinking": True,
                "needs_web_search": False,
                "needs_deep_research": False
            }

        # Default: Normal / Simple / Casual query -> Fast Gemini 3.5 Flash Lite
        return {
            "target_model": "gemini-3.5-flash-lite",
            "route_type": "FAST",
            "route_reason": "⚡ Auto-Detected: Standard query — routed to ultra-fast Gemini 3.5 Flash Lite",
            "needs_thinking": False,
            "needs_web_search": False,
            "needs_deep_research": False
        }

    def execute_live_web_search(self, query: str) -> Dict[str, Any]:
        """Runs live search on DuckDuckGo and formats context for prompt"""
        low_q = query.lower()
        if any(k in low_q for k in ["bangladesh", "dhaka", "bd news", "বাংলাদেশ", "আজকের খবর", "ব্রেকিং", "breaking news"]):
            try:
                from backend.tools.bangladesh_news import get_bangladesh_breaking_news
                bd_news = get_bangladesh_breaking_news(limit=6)
                if bd_news.get("stories"):
                    lines = ["[LIVE BANGLADESH BREAKING NEWS FEED]"]
                    sources = []
                    for idx, s in enumerate(bd_news["stories"], 1):
                        lines.append(f"[{idx}] Headline: {s['title']}\nCategory: {s['category']} | Source: {s['source']}\nPublished: {s.get('published_at', 'Recent')}\nURL: {s['url']}")
                        sources.append({"title": s['title'], "url": s['url'], "snippet": f"{s['category']} - {s['source']}"})
                    return {
                        "context": "\n\n".join(lines),
                        "sources": sources
                    }
            except Exception as e:
                logger.debug(f"BD news direct injection notice: {e}")

        try:
            results = dynamic_knowledge_engine.search_duckduckgo(query, max_results=4)
            if not results:
                return {"context": "No live web results returned for this query.", "sources": []}
            
            lines = []
            sources = []
            for idx, r in enumerate(results, 1):
                title = r.get("title", f"Source {idx}")
                snippet = r.get("snippet", "")
                url = r.get("url", "")
                lines.append(f"[{idx}] Title: {title}\nSummary: {snippet}\nURL: {url}")
                sources.append({"title": title, "url": url, "snippet": snippet})
            
            return {
                "context": "\n\n".join(lines),
                "sources": sources
            }
        except Exception as e:
            logger.warning(f"Web search error: {e}")
            return {"context": f"Web search could not be completed: {e}", "sources": []}

    def execute_deep_research(self, query: str) -> Dict[str, Any]:
        """Runs multi-hop search queries to aggregate deep multi-source research"""
        try:
            facets = [
                query,
                f"{query} overview facts"
            ]
            all_sources = []
            seen_urls = set()
            dossier_lines = []

            for f_q in facets:
                res = dynamic_knowledge_engine.search_duckduckgo(f_q, max_results=3)
                for r in res:
                    u = r.get("url", "")
                    if u and u not in seen_urls:
                        seen_urls.add(u)
                        all_sources.append(r)
                        dossier_lines.append(f"- **{r.get('title')}**\n  {r.get('snippet')}\n  Source: {u}")
                if len(all_sources) >= 5:
                    break

            wiki = dynamic_knowledge_engine.search_wikipedia(query)
            if wiki:
                dossier_lines.append(f"- **Wikipedia: {wiki.get('title')}**\n  {wiki.get('summary')}\n  Source: {wiki.get('url')}")
                all_sources.append({"title": f"Wikipedia: {wiki.get('title')}", "url": wiki.get('url', ''), "snippet": wiki.get('summary', '')})

            return {
                "context": "\n\n".join(dossier_lines) if dossier_lines else "No research data found.",
                "sources": all_sources
            }
        except Exception as e:
            logger.warning(f"Deep research error: {e}")
            return {"context": f"Deep research could not be completed: {e}", "sources": []}

    def process_chat(
        self,
        user_message: str,
        session_id: str = "default",
        mode: str = "auto",
        model_override: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Master chat processor:
        1. Evaluates complexity & routes between Fast, Thinking, Web, Deep Research
        2. Classifies intent
        3. Recalls memory
        4. Handles PC Automation & Tools if applicable
        5. Executes Web Search / Deep Research if needed
        6. Injects reasoning instructions and calls LLM provider
        """
        raw_msg = user_message.strip()
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Complexity & Route Evaluation
        eval_result = self.evaluate_query_complexity(raw_msg, mode=mode, model_override=model_override)
        target_model = eval_result["target_model"]

        # 2. Intent Classification
        intent_info = intent_classifier.classify(raw_msg)
        intent = intent_info.get("intent", "CHAT")

        # 3. Memory Context
        memory_ctx = memory_engine.get_memory_context_string(raw_msg)

        # 4. Chain-of-Thought Reasoning Steps initialization
        steps = reasoning_engine.generate_reasoning_steps(raw_msg, intent_info)
        steps.insert(0, {
            "step_index": 0,
            "title": "Smart Complexity Evaluator",
            "tool": "smart_model_router",
            "status": "completed",
            "message": eval_result["route_reason"]
        })

        # Save user message to conversation store
        conversation_store.add_message(
            conv_id=session_id,
            sender="USER",
            content=raw_msg,
            intent=intent
        )

        reply_text = ""
        is_configured = False
        sources = []
        mode_instructions = ""
        web_context = ""
        final_model_used = target_model

        # 5. Check for Ambient Auditory Memory Recall
        from backend.ambient_memory.reasoning import ambient_reasoning_bridge
        from backend.agent.orchestrator import agent_orchestrator

        if intent == "AMBIENT_MEMORY_QUERY" or ambient_reasoning_bridge.is_ambient_query(raw_msg):
            ambient_res = ambient_reasoning_bridge.process_ambient_query(raw_msg, brain_instance=self)
            reply_text = ambient_res.get("reply", "")
            final_model_used = "JARVIS Ambient Memory Cognition Engine"
            steps.append({
                "step_index": len(steps) + 1,
                "title": "Ambient Memory Retrieval & Accuracy Verifier",
                "tool": "ambient_memory_engine",
                "status": "completed",
                "message": f"Retrieved {ambient_res.get('total_memories', 0)} timestamped conversation records."
            })
        # 6. Check for PC Automation / Agent Tools
        elif agent_orchestrator.should_handle(intent, raw_msg):
            agent_result = agent_orchestrator.execute_request(raw_msg, intent_info, session_id)
            reply_text = agent_result.get("reply", "")
            final_model_used = "JARVIS Autonomous Computer Agent"
            if agent_result.get("steps"):
                steps = agent_result["steps"]
        else:
            # Fast-path for conversational greetings, social inquiries, and status queries
            if intent == "CHAT" and mode in ["auto", "fast"] and not model_override:
                fast_conv = dynamic_knowledge_engine.handle_conversational_query(raw_msg)
                if fast_conv:
                    reply_text = fast_conv
                    final_model_used = "JARVIS Cognitive Core (Zero-Latency Turbo)"

            # Fast-path for direct mathematical calculations
            if not reply_text and mode in ["auto", "fast"] and not model_override:
                math_ans = dynamic_knowledge_engine.solve_math(raw_msg)
                if math_ans:
                    reply_text = f"Calculated result:\n\n{math_ans}, Sir."
                    final_model_used = "JARVIS High-Precision Math Engine (Zero-Latency)"

            # If not answered by fast-path, check Deep Research or Web Search or LLM
            if not reply_text:
                if eval_result.get("needs_deep_research"):
                    research_res = self.execute_deep_research(raw_msg)
                    web_context = research_res.get("context", "")
                    sources = research_res.get("sources", [])
                    mode_instructions = (
                        "You are in DEEP RESEARCH MODE. Synthesize the provided multi-source research dossier "
                        "into an exhaustive, highly structured report with an executive summary, comparative breakdown, "
                        "core analytical findings, and seamlessly embedded source citations."
                    )
                    steps.append({
                        "step_index": len(steps) + 1,
                        "title": "Deep Research Engine",
                        "tool": "web_researcher",
                        "status": "completed",
                        "message": f"Synthesized research dossier across {len(sources)} verified sources."
                    })
                elif eval_result.get("needs_web_search"):
                    search_res = self.execute_live_web_search(raw_msg)
                    web_context = search_res.get("context", "")
                    sources = search_res.get("sources", [])
                    mode_instructions = (
                        "You are in LIVE WEB SEARCH MODE. Integrate real-time internet information directly into your answer, "
                        "ensuring all facts, prices, and events are fresh and accurately cited."
                    )
                    steps.append({
                        "step_index": len(steps) + 1,
                        "title": "Real-Time Web Intelligence",
                        "tool": "duckduckgo_search",
                        "status": "completed",
                        "message": f"Retrieved {len(sources)} live web sources."
                    })
                elif eval_result.get("is_deep_detail"):
                    mode_instructions = (
                        "You are in IN-DEPTH STORYTELLING & COMPREHENSIVE DETAIL MODE. "
                        "The user has explicitly requested an articulate, richly detailed, comprehensive explanation, full story, or deep topic breakdown. "
                        "Do NOT give a short or truncated answer. Provide an elaborate, multi-paragraph, captivating response with rich narrative flow, "
                        "background context, step-by-step clarity, and insightful takeaways."
                    )
                    steps.append({
                        "step_index": len(steps) + 1,
                        "title": "In-Depth Storytelling & Narrative Synthesizer",
                        "tool": "narrative_engine",
                        "status": "completed",
                        "message": f"Engaged high-depth narrative pipeline on {target_model}."
                    })
                elif eval_result.get("needs_thinking"):
                    mode_instructions = (
                        "You are in DEEP THINKING & REASONING MODE. Conduct exhaustive step-by-step reasoning, "
                        "self-reflection, and mathematical / algorithmic analysis before producing the final polished answer."
                    )
                    steps.append({
                        "step_index": len(steps) + 1,
                        "title": "Cognitive Reasoning Core",
                        "tool": "thinking_engine",
                        "status": "completed",
                        "message": f"Engaged high-depth reasoning pipeline on {target_model}."
                    })

                # Build Full System Prompt
                system_prompt = get_system_prompt(
                    memory_context=memory_ctx,
                    mode_instructions=mode_instructions,
                    web_context=web_context
                )

                # 7. Try routed LLM Provider & Model
                provider = self.get_provider_instance(self.active_provider_name, model_name=target_model)
                final_model_used = target_model
                history = conversation_store.get_recent_history_for_prompt(session_id, limit=6)

                if provider and provider.api_key:
                    is_configured = True
                    try:
                        reply_text = provider.generate_chat(history, system_prompt=system_prompt)
                    except Exception as llm_err:
                        logger.warning(f"Target model ({target_model}) failed: {llm_err}. Using instant synthesizer fallback.")
                        reply_text = ""

                # 8. Instant Fallback: Dynamic Knowledge Synthesizer (ChatGPT-5 Zero-Key Intelligence Engine)
                if not reply_text:
                    reply_text = dynamic_knowledge_engine.synthesize_answer(raw_msg)
                    final_model_used = "JARVIS Cognitive Synthesizer (Zero-Latency)"

        # 9. Save Assistant Message
        conversation_store.add_message(
            conv_id=session_id,
            sender="JARVIS",
            content=reply_text,
            intent=intent,
            steps=steps
        )

        return {
            "reply": reply_text,
            "status": "success",
            "intent": intent,
            "steps": steps,
            "is_configured": is_configured,
            "model_used": final_model_used,
            "mode_used": eval_result["route_type"],
            "route_reason": eval_result["route_reason"],
            "sources": sources,
            "timestamp": now_iso
        }

jarvis_brain = JarvisBrain()
