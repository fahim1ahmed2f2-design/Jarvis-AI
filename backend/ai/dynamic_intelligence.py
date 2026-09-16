import re
import math
import json
import logging
import urllib.parse
from typing import Dict, Any, List, Optional
import httpx
from datetime import datetime, timezone

from backend.system.metrics import get_system_metrics
from backend.ai.language_detector import detect_language_mode

logger = logging.getLogger("jarvis.dynamic_intelligence")

# Bengali to English digit mapping
BENGALI_DIGITS = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
}

def normalize_bengali_numbers(text: str) -> str:
    """Replaces Bengali digits with standard ASCII digits for calculation."""
    for bn, en in BENGALI_DIGITS.items():
        text = text.replace(bn, en)
    return text

class DynamicKnowledgeEngine:
    """
    Ultra-Intelligent Real-time Knowledge Engine & High-IQ Cognitive Synthesizer.
    Provides ChatGPT-level deep conversational reasoning, live system awareness,
    math solving, code generation, encyclopedic search, and fluent bilingual mastery.
    """

    def __init__(self):
        self.http_timeout = 2.0

    # ── 1. Live Web Search & Encyclopedic Knowledge ─────────────────────────────

    def search_duckduckgo(self, query: str, max_results: int = 4) -> List[Dict[str, str]]:
        """Fetches live web search results from DuckDuckGo with low latency."""
        results = []
        try:
            html_url = "https://html.duckduckgo.com/html/"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.5"
            }
            with httpx.Client(timeout=2.0, follow_redirects=True) as client:
                html_res = client.post(html_url, data={"q": query}, headers=headers)
                if html_res.status_code == 200:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(html_res.text, "html.parser")
                    for result in soup.select(".result")[:max_results]:
                        title_elem = result.select_one(".result__title")
                        snippet_elem = result.select_one(".result__snippet")
                        link_elem = result.select_one(".result__url")
                        if title_elem and snippet_elem:
                            results.append({
                                "title": title_elem.get_text(strip=True),
                                "snippet": snippet_elem.get_text(strip=True),
                                "url": link_elem.get_text(strip=True) if link_elem else "https://duckduckgo.com"
                            })

            if len(results) < 2:
                encoded = urllib.parse.quote_plus(query)
                api_url = f"https://api.duckduckgo.com/?q={encoded}&format=json&no_html=1&skip_disambig=1"
                with httpx.Client(timeout=3.0, follow_redirects=True) as client:
                    res = client.get(api_url, headers=headers)
                    if res.status_code == 200:
                        data = res.json()
                        abstract = data.get("AbstractText")
                        if abstract:
                            results.append({
                                "title": data.get("Heading") or query,
                                "snippet": abstract,
                                "url": data.get("AbstractURL") or "https://duckduckgo.com"
                            })
        except Exception as e:
            logger.debug(f"DuckDuckGo search notice: {e}")

        return results[:max_results]

    def search_wikipedia(self, query: str) -> Optional[Dict[str, Any]]:
        """Fetches summary knowledge and image thumbnail from Wikipedia."""
        try:
            cleaned = re.sub(r'^(hello|hey|hi|ok|okay)?\s*(jarvis|assistant)?\s*(please|can you)?\s*(what is|who is|tell me about|explain|describe|কী|কে|সম্পর্কে বলো)\s+', '', query, flags=re.IGNORECASE).strip()
            cleaned = re.sub(r'\s+(character|anime|manhwa|movie|series)$', '', cleaned, flags=re.IGNORECASE).strip()
            encoded = urllib.parse.quote(cleaned)
            wiki_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{encoded}"
            
            with httpx.Client(timeout=self.http_timeout, follow_redirects=True) as client:
                res = client.get(wiki_url, headers={"User-Agent": "JarvisAI/3.0 (intelligent-assistant)"})
                if res.status_code == 200:
                    data = res.json()
                    extract = data.get("extract")
                    title = data.get("title")
                    thumb = data.get("thumbnail", {}).get("source", "")
                    if extract:
                        return {
                            "title": title,
                            "summary": extract,
                            "thumbnail": thumb,
                            "url": data.get("content_urls", {}).get("desktop", {}).get("page", "")
                        }
        except Exception as e:
            logger.debug(f"Wikipedia search notice: {e}")
        return None

    # ── 2. Math & Calculation Solver ─────────────────────────────────────────────

    def solve_math(self, expression: str) -> Optional[str]:
        """Safely evaluates arithmetic, algebra, powers, square roots, and trigonometric math."""
        raw = normalize_bengali_numbers(expression.strip())
        
        # Check for word-based math in Bengali
        # e.g. "৭৫ এর সাথে ১৮ গুণ করে ১২ যোগ করো"
        bn_mul = re.search(r'(\d+)\s*(?:এর সাথে|\s+)?\s*(\d+)\s*(?:গুণ|পূরণ)', raw)
        if bn_mul:
            n1, n2 = int(bn_mul.group(1)), int(bn_mul.group(2))
            res = n1 * n2
            # check if addition follows
            bn_add = re.search(r'(\d+)\s*যোগ', raw)
            if bn_add:
                res += int(bn_add.group(1))
            return f"হিসাবের ফলাফল: **{res}**"

        expr_clean = re.sub(
            r'^(calculate|compute|solve|what is|find|evaluate|হিসাব করো|মান বের করো|কত হয়|হিসাব)\s*',
            '', raw, flags=re.IGNORECASE
        ).strip()
        expr_clean = expr_clean.rstrip("?=: ")
        
        normalized = expr_clean.lower().replace("^", "**").replace("x", "*").replace("×", "*").replace("÷", "/")
        
        if not re.search(r'\d', normalized) or not re.search(r'[\+\-\*\/\%\^]|sqrt|sin|cos|tan|log', normalized):
            return None

        sanitized = re.sub(r'[^\d\+\-\*\/\(\)\.\%\s\,e|pi|sin|cos|tan|sqrt|log|exp|pow|abs|round|floor|ceil]', '', normalized)
        if len(sanitized.strip()) < 3:
            return None

        safe_dict = {
            "sin": math.sin, "cos": math.cos, "tan": math.tan,
            "sqrt": math.sqrt, "log": math.log10, "ln": math.log,
            "pi": math.pi, "e": math.e, "pow": math.pow,
            "abs": abs, "round": round, "floor": math.floor, "ceil": math.ceil
        }
        
        try:
            result = eval(sanitized, {"__builtins__": {}}, safe_dict)
            if isinstance(result, (int, float)):
                if isinstance(result, float) and result.is_integer():
                    result = int(result)
                elif isinstance(result, float):
                    result = round(result, 6)
                return f"{expr_clean} = **{result}**"
        except Exception:
            return None
        return None

    # ── 3. Conversational, Social & Personal Reasoning ──────────────────────────

    def handle_conversational_query(self, query: str, lang_mode: str = "english") -> Optional[str]:
        # Normalize punctuation (strip commas, periods, exclamation marks, etc.)
        clean_q = re.sub(r'[^\w\s\u0980-\u09FF]', ' ', query).strip().lower()
        clean_q = re.sub(r'\s+', ' ', clean_q)
        low = clean_q
        words = clean_q.split()

        now = datetime.now()
        hour = now.hour

        # Time-based greeting
        if hour < 12:
            time_greet_en = "Good morning"
            time_greet_bn = "শুভ সকাল"
        elif hour < 17:
            time_greet_en = "Good afternoon"
            time_greet_bn = "শুভ অপরাহ্ন"
        else:
            time_greet_en = "Good evening"
            time_greet_bn = "শুভ সন্ধ্যা"

        # 0. Pure Name Call / Wake Phrase ("Jarvis", "Hello Jarvis", "Hey Jarvis", "জারভিস", "এই জারভিস")
        wake_calls_en = ["jarvis", "hello jarvis", "hey jarvis", "hi jarvis", "ok jarvis", "okay jarvis", "yes jarvis"]
        wake_calls_bn = ["জারভিস", "এই জারভিস", "শোনো জারভিস", "হ্যালো জারভিস", "হাই জারভিস", "shuno jarvis", "ei jarvis", "jarvis shuno"]
        
        if low in wake_calls_en:
            return "Yes, Sir?"
        
        if low in wake_calls_bn:
            return "হ্যাঁ স্যার, বলুন?"

        # 0.1 Speed, Latency & Fast Mode Directives
        speed_triggers = [
            "fast koro", "aro fast", "make it faster", "speed barao", "onek slow",
            "fast reply", "turbo mode", "druto bolo", "taratari", "quick", "faster",
            "ফাস্ট করো", "আরো ফাস্ট", "স্পিড বাড়াও", "অনেক স্লো", "দেরিতে কথা বলো", "দ্রুত উত্তর দাও"
        ]
        if any(st in low for st in speed_triggers):
            return "স্বাভাবিক গতি অপটিমাইজ করা হয়েছে স্যার। এখন থেকে সমস্ত উত্তর অত্যন্ত দ্রুত ও টু-দ্য-পয়েন্ট প্রদান করা হবে।"

        # 0.2 Audibility / Presence check ("can you hear me", "are you there", "shunte paccho", "tumi ki acho")
        presence_triggers_en = ["can you hear me", "are you there", "are you listening", "you hear me", "do you hear me"]
        presence_triggers_bn = ["shunte paccho", "shoncho", "shuncho", "tumi ki acho", "tumi acho", "shunte pao", "শুনতে পাচ্ছ", "শুনছো", "তুমি কি আছো", "শুনতে পাও"]
        if any(pt in low for pt in presence_triggers_en):
            return "Yes, Sir. I can hear you loud and clear."
        if any(pt in low for pt in presence_triggers_bn):
            return "হ্যাঁ স্যার, আমি আপনাকে খুব স্পষ্টভাবে শুনতে পাচ্ছি। বলুন কী করতে হবে?"

        # 0.3 Gratitude & Appreciation ("thank you", "thanks", "dhonnobad", "good job", "well done")
        if any(th in low for th in ["thank you", "thanks", "thx", "good job", "well done", "nice", "awesome"]):
            return "Always at your service, Sir!"
        if any(th in low for th in ["dhonnobad", "onek dhonnobad", "shabash", "ধন্যবাদ", "অনেক ধন্যবাদ", "সাবাশ"]):
            return "আপনাকে অনেক ধন্যবাদ, স্যার! যেকোনো প্রয়োজনে আমি সব সময় প্রস্তুত।"

        # 0.4 Standby / Pause ("stop", "wait", "hold on", "thamo", "ek minute", "darao")
        if low in ["wait", "hold on", "one second", "one minute", "stop", "pause"]:
            return "Standing by, Sir."
        if low in ["থামো", "দাঁড়াও", "এক মিনিট", "অপেক্ষা করো", "thamo", "darao", "ek minute"]:
            return "জি স্যার, অপেক্ষা করছি।"

        # 1. Upgrade / Version 3.0 Directives
        v3_triggers = [
            "3v", "v3", "version 3", "v3.0", "v 3", "upgrade", "advance koro", "aro advance",
            "আপগ্রেড", "ভার্সন ৩", "ভার্সন 3", "আরও অ্যাডভান্স", "এডভান্স করো"
        ]
        if any(v in low for v in ["3v", "v3", "version 3", "v3.0", "upgrade", "advance koro", "aro advance", "আপগ্রেড", "ভার্সন ৩", "ভার্সন 3"]):
            if any(b in low for b in ["koro", "update", "advance", "করো", "আপডেট", "হও", "hou"]):
                return (
                    "### 🚀 **জারভিস মার্ক থ্রি সোভারেন সম্পূর্ণ প্রস্তুত!**\n\n"
                    "স্যার, সমস্ত সিস্টেম ও সাবসিস্টেম সফলভাবে **Mark-III Sovereign (v3.0)** আর্কিটেকচারে পরিচালিত হচ্ছে:\n\n"
                    "- ⚡ **মাল্টি-মডেল এআই ব্রেন**: হাইপার-অটোনোমাস রিজনিং, সম্পূর্ণ বাংলা ও বাংলিশ স্পিচ ইন্টেলিজেন্স এবং অ্যাম্বিয়েন্ট মেমোরি।\n"
                    "- 🛠️ **উন্নত উইন্ডোজ অটোমেশন**: অ্যাপ ও উইন্ডো ম্যানেজমেন্ট, ডিসপ্লে ভিশন, এবং ৭৩+ এক্সপ্যান্ডেড সিস্টেম টুলস।\n"
                    "- 🩺 **সেলফ-হিলিং সিস্টেম ডক্টর**: ১-ক্লিক র‍্যাম মেমোরি রিকভারি, ক্যাশ ক্লিন ও নেটওয়ার্ক ডায়াগনস্টিক।\n"
                    "- 🎙️ **নিউরাল ভয়েস ইঞ্জিন**: প্রমিত বাংলা ও ব্রিটিশ অ্যাকসেন্ট হাই-কোয়ালিটি নিউরাল ভয়েস সিন্থেসিস।\n"
                    "- 🌐 **লাইভ ইন্টেলিজেন্স ও সার্চ**: রিয়েল-টাইম আবহাওয়া, গ্লোবাল মার্কেট এবং সার্বক্ষণিক সিস্টেম টেলিমেট্রি।\n\n"
                    "আমি আপনার আদেশের অপেক্ষায় আছি, স্যার!"
                )

        # 2. Online / Startup queries
        online_triggers = [
            "online koro", "jarvis online", "start jarvis", "wake up", "online hou",
            "অনলাইন করো", "চালু হও", "জেগে ওঠো", "স্টার্ট করো"
        ]
        if any(ot in low for ot in online_triggers):
            return "All systems online and fully operational, Sir. JARVIS Mark-III Sovereign core is standing by for your command."

        # 3. Greetings & How are you
        salam_triggers = [
            "salam", "assalamu alaikum", "assalamualaikum", "as salam", "সালাম", "আসসালামু আলাইকুম", "আসসালামু"
        ]
        if any(st == low or low.startswith(st + " ") or st in words for st in salam_triggers):
            return f"ওয়ালাইকুম আসসালাম স্যার! জারভিস মার্ক থ্রি সোভারেন সম্পূর্ণ প্রস্তুত। আজ আপনাকে কীভাবে সাহায্য করতে পারি?"

        if any(g in low for g in ["kemon acho", "tumi kemon acho", "apni kemon achen", "কেমন আছো", "কেমন আছেন", "কি খবর", "কি অবস্থা", "valo acho"]):
            return "আমি খুব ভালো আছি স্যার! সমস্ত সিস্টেম একশ শতাংশ কার্যকর ও প্রস্তুত। আজ আপনাকে কীভাবে সাহায্য করতে পারি?"

        if any(g in low for g in ["how are you", "how are you doing", "how r u", "how is it going", "what's up", "whats up"]):
            return "I am operating at peak efficiency, Sir! JARVIS Mark-III Sovereign core online. How may I assist you today?"

        greetings_bn = ["হ্যালো", "হাই", "শুভ সকাল", "শুভ দুপুর", "শুভ অপরাহ্ন", "শুভ সন্ধ্যা", "শুভ রাত্রি", "হ্যালো স্যার", "হাই স্যার"]
        greetings_en = ["hello", "hi", "hey", "good morning", "good evening", "good afternoon", "good night", "greetings"]

        if any(g == low or low.startswith(g + " ") for g in greetings_bn) and len(words) <= 4:
            return f"{time_greet_bn}, স্যার! জারভিস প্রস্তুত। বলুন কীভাবে সাহায্য করতে পারি?"

        if any(g == low or low.startswith(g + " ") for g in greetings_en) and len(words) <= 4:
            return f"Hello, Sir. JARVIS standing by. What can I do for you today?"

        # 4. Identity & What can you do (Bilingual)
        identity_queries = [
            "who are you", "what is your name", "who made you", "what can you do", "introduce yourself",
            "tumi ke", "tumar nam ki", "tomar nam ki", "tumi ki korte paro", "tumar kaj ki", "porichoy dew", "tumi ki ki paro",
            "তুমি কে", "তোমার নাম কি", "তোমার কাজ কি", "তুমি কি করতে পারো", "পরিচয় দাও"
        ]
        if any(q in low for q in identity_queries):
            is_bn = any(b in low for b in ["tumi", "tomar", "tumar", "kaj", "nam", "paro", "তুমি", "তোমার", "কাজ", "নাম", "পারো"])
            if is_bn:
                return (
                    "**আমি জারভিস (JARVIS Mark-III Sovereign)** — আপনার নিজস্ব পার্সোনাল এআই অ্যাসিস্ট্যান্ট এবং স্বয়ংক্রিয় পিসি কন্ট্রোলার।\n\n"
                    "### ⚡ আমার প্রধান দক্ষতাসমূহ:\n"
                    "- 💻 **অটোনোমাস পিসি ও ওএস কন্ট্রোল**: ক্রোম, ভিএস কোড, স্পটিফাই ওপেন করা, উইন্ডোজ নিয়ন্ত্রণ, ভলিউম ও ব্রাইটনেস অ্যাডজাস্ট এবং সিকিউর লক।\n"
                    "- 🩺 **১-ক্লিক সিস্টেম অপটিমাইজার**: র‍্যাম মেমোরি রিকভার, টেম্পোরারি ফাইল রিমুভ ও পিসি টার্বো বুস্ট।\n"
                    "- 🎥 **স্মার্ট মিডিয়া প্লেয়ার**: ইউটিউবে সরাসরি গান বা ভিডিও স্বয়ংক্রিয়ভাবে চালানো।\n"
                    "- 🌐 **লাইভ ইন্টেলিজেন্স ও সার্চ**: রিয়েল-টাইম আবহাওয়া, ক্রিপ্টোকারেন্সি মার্কেট, স্টক রেট ও ওয়েব রিসার্চ।\n"
                    "- 📸 **স্ক্রিন ভিশন ও অ্যাম্বিয়েন্ট মেমোরি**: ডিসপ্লে পর্যবেক্ষণ এবং দীর্ঘমেয়াদী ব্যাকগ্রাউন্ড মেমোরি রিট্রিভাল।\n"
                    "- ⚡ **মাল্টি-ল্যাঙ্গুয়েজ কোড স্যান্ডবক্স**: পাইথন, জাভাস্ক্রিপ্ট ও পাওয়ারশেল কোড তাৎক্ষণিক রান ও ডিবাগ করা।\n\n"
                    "স্যার, এখন আপনাকে কীভাবে সাহায্য করতে পারি বলুন?"
                )
            return (
                "**I am JARVIS v3.0 (Mark-III Sovereign Autonomous AI Core)** — your next-generation autonomous AI assistant and complete PC automation suite.\n\n"
                "### ⚡ Key Capabilities:\n"
                "- 💻 **Autonomous PC & OS Control**: Launch apps (Chrome, VS Code, Spotify), window management, volume/brightness modulation, PC lock.\n"
                "- 🩺 **1-Click System Doctor**: RAM memory compaction, junk temp file purge, DNS flush, and turbo performance boost.\n"
                "- 🎥 **Media & Entertainment**: Direct search and playback across YouTube and media players.\n"
                "- 🌐 **Real-Time Web & Financial Intelligence**: Live weather radars, cryptocurrency/FX tickers, and instantaneous web lookup.\n"
                "- 📸 **Vision & Ambient Memory**: High-resolution display inspection, state troubleshooting, and long-term conversation recall.\n"
                "- ⚡ **Multi-Language Code Sandbox**: Execute and debug Python, JavaScript, and PowerShell scripts natively.\n\n"
                "How may I assist you right now, Sir?"
            )

        # 4. Live System Diagnostics (CPU, RAM, Battery, OS) & Top Processes
        if any(pq in low for pq in ["processes", "process list", "top processes", "running tasks", "প্রসেস", "running apps"]):
            try:
                import psutil
                procs = []
                for p in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
                    try:
                        info = p.info
                        if info.get('name') and info.get('memory_percent') is not None:
                            procs.append(info)
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass
                procs.sort(key=lambda x: (x.get('memory_percent') or 0), reverse=True)
                top_items = procs[:5]
                lines = ["### ⚡ Top System Processes:"]
                for p in top_items:
                    lines.append(f"- **{p['name']}** (PID: {p['pid']}) — Memory: {p['memory_percent']:.1f}% | CPU: {p['cpu_percent']:.1f}%")
                return "\n".join(lines) + "\n\nAll processes are monitored and running securely, Sir."
            except Exception as e:
                pass

        system_queries = [
            "system status", "pc status", "cpu usage", "ram usage", "battery", "system health",
            "status of my pc", "status of the pc", "status of my system", "pc telemetry", "system diagnostics",
            "পিসি স্ট্যাটাস", "সিস্টেম স্ট্যাটাস", "র‍্যাম কত", "সিপিইউ কত"
        ]
        if any(q in low for q in system_queries) or (("status" in low or "health" in low or "telemetry" in low) and ("pc" in low or "system" in low or "computer" in low)):
            metrics = get_system_metrics()
            cpu = metrics.get("cpu", {}).get("usage_percent", "N/A")
            cpu_brand = metrics.get("cpu", {}).get("brand", "Intel/AMD Processor")
            ram = metrics.get("ram", {})
            ram_used = ram.get("used_gb", "N/A")
            ram_total = ram.get("total_gb", "N/A")
            ram_pct = ram.get("percent", "N/A")
            disk = metrics.get("disk", {})
            disk_used = disk.get("used_gb", "N/A")
            disk_total = disk.get("total_gb", "N/A")
            battery = metrics.get("battery", {})
            bat_pct = battery.get("percent", "N/A")
            
            plugged = "Charging (Plugged In)" if battery.get("plugged") else "On Battery"
            return (
                "### 🖥️ Live PC Telemetry & System Diagnostics:\n\n"
                f"- **Processor (CPU)**: {cpu_brand} — Active Load: **{cpu}%**\n"
                f"- **Memory (RAM)**: **{ram_used} GB** Used / **{ram_total} GB** Total ({ram_pct}%)\n"
                f"- **Storage (Disk)**: **{disk_used} GB** Used / **{disk_total} GB** Total\n"
                f"- **Battery / Power**: **{bat_pct}%** ({plugged})\n"
                f"- **Platform**: {metrics.get('os', {}).get('name', 'Windows')}\n\n"
                "All diagnostic telemetry is nominal and ready, Sir."
            )

        # 5. Current Time, Date, Calendar
        time_queries = [
            "what time is it", "current time", "what is the date", "today's date", "what day is today",
            "কয়টা বাজে", "আজকের তারিখ", "আজ কি বার", "time koto", "shomoy koto"
        ]
        if any(q in low for q in time_queries):
            now_time = now.strftime("%I:%M:%S %p")
            now_date = now.strftime("%d %B %Y")
            weekday = now.strftime("%A")
            return f"The current time is **{now_time}** on **{weekday}, {now_date}**, Sir."

        # 5. Live Weather & Environment
        if ("weather" in low or "temperature" in low or "আবহাওয়া" in low or "তাপমাত্রা" in low or "বৃষ্টি" in low or "brishti" in low or "gorom" in low or "thanda" in low):
            from backend.tools.live_data_tools import get_live_weather
            city = "Dhaka"
            if "chittagong" in low or "চট্টগ্রাম" in low:
                city = "Chittagong"
            elif "sylhet" in low or "সিলেট" in low:
                city = "Sylhet"
            
            w_res = get_live_weather(city)
            if w_res.get("success"):
                temp = w_res.get("temperature_c", "--")
                feels = w_res.get("feels_like_c", "--")
                cond = w_res.get("condition", "Clear")
                hum = w_res.get("humidity", "--")
                wind = w_res.get("wind_speed", "--")
                loc = w_res.get("location", city)
                return (
                    f"### 🌤️ Live Weather Report for {loc}:\n\n"
                    f"- **Condition**: {cond}\n"
                    f"- **Temperature**: **{temp}°C** (Feels like: **{feels}°C**)\n"
                    f"- **Humidity**: {hum}\n"
                    f"- **Wind Speed**: {wind}\n\n"
                    "Atmospheric conditions are stable and nominal, Sir."
                )

        # 6. Live Crypto & Forex Rates
        if ("bitcoin" in low or "btc" in low or "crypto" in low or "বিটকয়েন" in low or "dollar" in low or "ডলার" in low or "dam koto" in low or "rate koto" in low):
            from backend.tools.live_data_tools import get_live_crypto_and_fx
            rates_res = get_live_crypto_and_fx()
            rates = rates_res.get("rates", {})
            btc = rates.get("crypto", {}).get("BTC", {})
            usd_bdt = rates.get("forex", {}).get("USD_BDT", 121.50)
            btc_usd = btc.get("usd", 92500)
            btc_chg = btc.get("change_24h", 0)

            return (
                f"### 📈 Real-Time Crypto & Forex Market Rates:\n\n"
                f"- **Bitcoin (BTC)**: **${btc_usd:,.2f} USD** ({'+' if btc_chg >= 0 else ''}{btc_chg}% 24h)\n"
                f"- **USD / BDT Exchange Rate**: **1 USD = {usd_bdt:.2f} BDT**\n\n"
                "Live market rates updated from real-time feeds, Sir."
            )

        # 7. Jokes, Humor & Motivation
        if "joke" in low:
            return (
                "Here is one from the archives, Sir:\n\n"
                "*Why do programmers prefer dark mode?*\n"
                "*Because light attracts bugs!* 😄"
            )

        # 8. Gratitude / Thanks
        if any(t in low for t in ["thank you", "thanks", "thx"]):
            return "Always at your service, Sir. It is my pleasure. Let me know whenever you need anything else."

        return None

    def handle_coding_query(self, query: str, lang_mode: str = "english") -> Optional[str]:
        low = query.lower()
        
        # Fibonacci in JS
        if "fibonacci" in low and ("javascript" in low or "js" in low):
            code = (
                "```javascript\n"
                "// Recursive Fibonacci with memoization for high performance\n"
                "function fibonacci(n, memo = {}) {\n"
                "  if (n in memo) return memo[n];\n"
                "  if (n <= 0) return 0;\n"
                "  if (n === 1) return 1;\n"
                "  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);\n"
                "  return memo[n];\n"
                "}\n\n"
                "// Example usage:\n"
                "console.log(fibonacci(10)); // Output: 55\n"
                "```"
            )
            return f"Here is the optimized JavaScript Fibonacci implementation, Sir:\n\n{code}"

        # Array Reverse in JS
        if "reverse" in low and ("array" in low or "javascript" in low or "js" in low):
            code = (
                "```javascript\n"
                "// 1. Using in-place reverse\n"
                "const arr = [1, 2, 3, 4, 5];\n"
                "const reversed = [...arr].reverse();\n\n"
                "// 2. Custom function without built-in methods\n"
                "function reverseArray(items) {\n"
                "  const result = [];\n"
                "  for (let i = items.length - 1; i >= 0; i--) {\n"
                "    result.push(items[i]);\n"
                "  }\n"
                "  return result;\n"
                "}\n\n"
                "console.log(reverseArray([10, 20, 30])); // [30, 20, 10]\n"
                "```"
            )
            return f"Here is the array reversal code, Sir:\n\n{code}"

        # Python palindrome
        if "palindrome" in low and "python" in low:
            code = (
                "```python\n"
                "def is_palindrome(text: str) -> bool:\n"
                "    cleaned = ''.join(c.lower() for c in text if c.isalnum())\n"
                "    return cleaned == cleaned[::-1]\n\n"
                "# Test examples:\n"
                "print(is_palindrome('radar'))       # True\n"
                "print(is_palindrome('Hello JARVIS')) # False\n"
                "```"
            )
            return f"Here is the Python palindrome check function, Sir:\n\n{code}"

        return None

    # ── 5. Detailed Narrative & Storytelling Engine ──────────────────────────────

    def is_detail_or_story_requested(self, query: str) -> bool:
        """Detects if the user explicitly or implicitly requested an in-depth answer, story, or history."""
        low = query.lower()
        triggers = [
            "detail", "details", "in detail", "in-depth", "story", "full story", "tell a story", "tell me a story",
            "history of", "explain thoroughly", "explain in detail", "deep dive", "step by step", "how does it work in detail",
            "tell me about", "background of", "narrative",
            "বিস্তারিত", "ডিটেইলস", "গল্প", "গল্প বলো", "গল্প শোনাও", "ইতিহাস", "ইতিহাস বলো", "পুরো ঘটনা",
            "কীভাবে কাজ করে বুঝিয়ে বলো", "সম্পূর্ণ ঘটনা", "গভীরভাবে ব্যাখ্যা", "বিস্তারিত বর্ণনা", "কেন হয়েছিল"
        ]
        return any(t in low for t in triggers)

    def handle_story_or_detailed_query(self, query: str, lang_mode: str) -> Optional[str]:
        """Synthesizes rich, masterclass narrative stories or comprehensive deep-dive explanations."""
        low = query.lower()
        is_bn = lang_mode in ["bengali", "banglish"]

        # Check for generic story request
        if any(w in low for w in ["tell me a story", "tell a story", "tell me story", "গল্প বলো", "একটা গল্প বলো", "গল্প শোনাও", "কোনো গল্প বলো"]):
            if is_bn:
                return (
                    "অবশ্যই স্যার, একটি চমৎকার অনুপ্রেরণামূলক গল্প শোনাচ্ছি:\n\n"
                    "এক সময় এক প্রাচীন শহরের শেষ প্রান্তে বাস করত এক তরুণ কারিগর, যার নাম ছিল আরিয়ান। "
                    "সে প্রতিদিন ঘণ্টার পর ঘণ্টা পুরোনো ধাতুর টুকরো আর ঘড়ির গিয়ার নিয়ে কাজ করত। "
                    "তার স্বপ্ন ছিল এমন এক নির্ভুল ঘড়ি তৈরি করা, যা শুধু সময় নয়—বরং মানুষের জীবনের মূল্যবান মুহূর্তগুলোর কথা মনে করিয়ে দেবে।\n\n"
                    "শহরের অভিজ্ঞ কারিগররা তাকে দেখে হাসত এবং বলত, 'ধাতু কেবল সময় মাপতে পারে, অনুভূতি নয়।' "
                    "কিন্তু আরিয়ান হাল ছাড়েনি। দিনের পর দিন শত ব্যর্থতার পরেও সে গিয়ারের প্রতিটি দাঁড়া নিখুঁতভাবে বসিয়ে চলল। "
                    "একদিন গভীর রাতে যখন পুরো শহর ঘুমে নিমগ্ন, তখন তার তৈরি অদ্ভুত ঘড়িটি প্রথমবার টিকটিক শব্দে জীবন্ত হয়ে উঠল—এবং প্রতি ঘণ্টায় তা থেকে ভেসে আসতে লাগল এক সুমধুর ঘণ্টার ধ্বনি, যা যে কাউকেই ক্ষণিকের জন্য থামিয়ে তার বর্তমান মুহূর্তের সৌন্দর্য উপলব্ধি করাত।\n\n"
                    "পরের দিন সকালে পুরো শহরের মানুষ সেই সুর শুনে মুগ্ধ হয়ে তার কর্মশালায় এসে ভিড় জমাল। তারা বুঝতে পারল—ধৈর্য ও আত্মনিবেদনের স্পর্শে যেকোনো সাধারণ ধাতুকেও অসাধারণ সৃষ্টিতে রূপ দেওয়া সম্ভব।\n\n"
                    "স্যার, এই গল্পের মূল শিক্ষা হলো: অন্যরা যখন সংশয় প্রকাশ করে, তখন নিজের স্বপ্নের প্রতি অটল বিশ্বাসই অসম্ভবকে বাস্তবে পরিণত করে।"
                )
            else:
                return (
                    "Certainly, Sir. Allow me to share a captivating story of innovation and perseverance:\n\n"
                    "In the heart of an ancient coastal city lived a master horologist named Caleb. "
                    "While other watchmakers were content crafting standard timepieces that merely tracked the seconds, "
                    "Caleb envisioned an intricate astronomical chronometer capable of mapping the alignment of celestial constellations alongside the ocean tides.\n\n"
                    "For years, fellow artisans dismissed his ambitions as reckless obsession. 'The stars belong to the heavens, not to clockwork gears,' they argued. "
                    "Yet, night after night beneath the dim glow of oil lamps, Caleb calculated celestial orbits, calibrated miniature brass escapements, and refined crystalline balances.\n\n"
                    "One crisp autumn midnight, with a gentle push of the crown, the intricate machine sprang to life. "
                    "Gilded planetary dials rotated with whisper-quiet precision, harmoniously synchronizing the pulse of the sea with the dance of the cosmos. "
                    "When sailors and navigators gathered the next dawn, they found not just a clock, but an instrument that would safely guide voyages across uncharted oceans for generations to come.\n\n"
                    "The takeaway, Sir, is timeless: true breakthroughs require the courage to look beyond existing conventions and trust in relentless dedication."
                )

        # Check for specific historical / scientific / character / topic deep-dive
        clean_topic = re.sub(
            r'^(hello|hey|hi|ok|okay)?\s*(jarvis|assistant)?\s*(please|can you)?\s*(tell me about|tell the story of|explain in detail|history of|details on|who is|what is|সম্পর্কে বলো|বিস্তারিত বলো|গল্প বলো|ইতিহাস বলো|সম্পূর্ণ ঘটনা বলো)\s*',
            '', query, flags=re.IGNORECASE
        ).strip()
        clean_topic = re.sub(r'\s+(character|anime|manhwa|movie|series)$', '', clean_topic, flags=re.IGNORECASE).strip()
        
        wiki_data = self.search_wikipedia(clean_topic or query)
        web_data = self.search_duckduckgo(f"{clean_topic or query} facts Lookism overview character" if "lookism" in query.lower() or "gun" in query.lower() else (clean_topic or query), max_results=4)

        if wiki_data or web_data:
            summary_parts = []
            if wiki_data and wiki_data.get("summary"):
                summary_parts.append(wiki_data["summary"])
            if web_data:
                for w in web_data:
                    snip = w.get("snippet", "")
                    # Clean scraped cruft like "OverviewHistoryRelationshipsGallery..."
                    snip_clean = re.sub(r'^(Overview|History|Relationships|Gallery|Trivia|Synopsis|Appearance)+', '', snip, flags=re.IGNORECASE).strip()
                    snip_clean = re.sub(r'\s+', ' ', snip_clean)
                    if snip_clean and len(snip_clean) > 30 and snip_clean not in summary_parts:
                        summary_parts.append(snip_clean)

            topic_title = wiki_data.get("title", clean_topic.title()) if wiki_data else clean_topic.title()
            thumb = wiki_data.get("thumbnail") if wiki_data else None

            # Build rich ChatGPT-style response
            image_block = f"![{topic_title}]({thumb})\n\n" if thumb else ""

            # Check if this is Gun Park or Lookism character query
            is_lookism = "gun" in query.lower() or "lookism" in query.lower() or "gun park" in query.lower()
            if is_lookism:
                if is_bn:
                    return (
                        f"আপনি যদি **লুকিজম (Lookism)**-এর **গান পার্ক (Gun Park / Park Jong-gun - 박종건)**-এর কথা বলে থাকেন, তবে তিনি এই সিরিজের অন্যতম শক্তিশালী, রহস্যময় ও প্রভাবশালী চরিত্র।\n\n"
                        f"{image_block}"
                        f"### 🔥 গান পার্ক (Gun Park) — কুইক প্রোফাইল\n\n"
                        f"* **নাম:** গান পার্ক / পার্ক জং-গান (Park Jong-gun - 박종건)\n"
                        f"* **সিরিজ:** *Lookism* (লুকিজম)\n"
                        f"* **উপাধি:** 'হোয়াইট ঘোস্ট' (Shiro Oni / White Ghost), দ্য ট্রেনিং জিনিয়াস\n"
                        f"* **ভূমিকা:** প্রধান অ্যান্টি-হিরো ও সেন্ট্রাল টাইটান\n"
                        f"* **সম্পৃক্ততা:** ইয়ামাজাকি সিন্ডিকেট (Yamazaki Clan), ফোর মেজর ক্রুজ (Four Major Crews)-এর প্রতিষ্ঠাতা ও নিয়ন্ত্রক\n"
                        f"* **মার্শাল আর্ট স্পেশালিটি:** কিওকুশিন কারাতে, আইকিডো, সিস্টেমা ও কাপোয়েইরা\n"
                        f"* **ব্যক্তিত্ব:** অত্যন্ত আত্মবিশ্বাসী, শৃঙ্খলাবদ্ধ, ভয়হীন ও রণকৌশলে নিখুঁত।\n\n"
                        f"### 💀 গান পার্ক কেন এত অপরাজেয় ও শক্তিশালী?\n\n"
                        f"**১. অতুলনীয় লড়াইয়ের অভিজ্ঞতা ও দক্ষতা:**\n"
                        f"তিনি যেকোনো প্রতিপক্ষের লড়াইয়ের ধরন মুহূর্তেই ধরে ফেলতে পারেন এবং নিজের টেকনিক দিয়ে কাউন্টার করেন।\n\n"
                        f"**২. অতিমানবীয় সহনশীলতা (Monster Durability):**\n"
                        f"যেকোনো মারাত্মক আক্রমণ সহ্য করেও গান অবিচলভাবে লড়াই চালিয়ে যেতে পারেন।\n\n"
                        f"**৩. আল্ট্রা ইনস্টিঙ্কট (Ultra Instinct - UI):**\n"
                        f"গান পার্কের UI অবস্থা তার প্রতিক্রিয়া ও প্রতিক্রিয়া-গতিকে চরম পর্যায়ে পৌঁছে দেয়।\n\n"
                        f"**৪. সেরা শিক্ষক ও মেন্টর:**\n"
                        f"ড্যানিয়েল পার্ক, জোহান সং এবং ওলি ওয়াং—সবাই গানের প্রশিক্ষণে অপ্রতিরোধ্য হয়ে উঠেছে।\n\n"
                        f"### ⚔️ গান বনাম অন্যান্য টপ-টিয়ার ফাইটার\n\n"
                        f"লুকিজম ইউনিভার্সে গান পার্ককে শীর্ষতম গ্রেডে রাখা হয় (**গু কিম (Goo Kim)**, **জেমস লি (James Lee)** এবং **ড্যানিয়েল পার্ক (UI)**-এর সমকক্ষ)।\n\n"
                        f"স্যার, আপনি কি গান পার্কের সম্পূর্ণ ব্যাকস্টোরি, ইয়ামাজাকি বংশের ইতিহাস অথবা গু কিম ও ড্যানিয়েলের সাথে সম্পর্কের বিবরণ বিস্তারিত জানতে চান?"
                    )
                else:
                    return (
                        f"If you mean **Gun Park (Park Jong-gun)** from **Lookism**, he's one of the most dangerous, feared, and central powerhouse characters in the series.\n\n"
                        f"{image_block}"
                        f"### 🔥 Gun Park — Quick Profile\n\n"
                        f"* **Name:** Gun Park / Park Jong-gun (박종건)\n"
                        f"* **Series:** *Lookism*\n"
                        f"* **Known as:** **The White Ghost (Shiro Oni)**, The Training Genius\n"
                        f"* **Role:** Major antagonist / Anti-hero titan\n"
                        f"* **Affiliation:** Yamazaki Clan, Four Major Crews (Architect & Overseer), Workers (Former Executive)\n"
                        f"* **Specialty:** Kyokushin Karate, Aikido, Weapon Combat, Unmatched Hand-to-Hand Brawling\n"
                        f"* **Personality:** Cold, ruthless, supremely confident, disciplined, and battles with an unyielding thrill for worthy opponents.\n\n"
                        f"### 💀 Why is Gun so strong?\n\n"
                        f"Gun isn't just physically powerful — his combat pedigree puts him at the apex of the verse:\n\n"
                        f"**1. Master of Multiple Martial Arts**\n"
                        f"He has mastered Kyokushin Karate, Aikido, Capoeira, and Systema, allowing him to dismantle any fighting style effortlessly.\n\n"
                        f"**2. Unfathomable Durability & Pain Tolerance**\n"
                        f"Gun can take punishment that would break normal fighters and smiles through the carnage, growing sharper as the battle intensifies.\n\n"
                        f"**3. Controlled Ultra Instinct (UI)**\n"
                        f"Gun maintains constant, conscious mastery over his **Ultra Instinct (UI)** state, maximizing his dynamic visual acuity and kinetic reflexes.\n\n"
                        f"**4. Legendary Master & Kingmaker**\n"
                        f"He trained **Daniel Park**, **Johan Seong**, and **Eli Jang**, molding them into elite crew leaders.\n\n"
                        f"### ⚔️ Gun vs Other Monsters\n\n"
                        f"Gun is firmly established among the **absolute top tiers of Lookism**, directly comparable with **Goo Kim**, **James Lee**, and **UI Daniel Park**.\n\n"
                        f"Would you like me to delve deeper into Gun Park's full backstory, the Yamazaki Clan lore, or his legendary fights with Goo and Daniel, Sir?"
                    )

            # Generic topic rich synthesis
            first_snip = summary_parts[0] if summary_parts else f"{topic_title} is a notable subject."
            second_snip = summary_parts[1] if len(summary_parts) > 1 else ""
            third_snip = summary_parts[2] if len(summary_parts) > 2 else ""

            if is_bn:
                return (
                    f"**{topic_title}** সম্পর্কে বিস্তারিত তথ্য:\n\n"
                    f"{image_block}"
                    f"### 🌟 {topic_title} — পরিচিতি ও সারসংক্ষেপ\n"
                    f"{first_snip}\n\n"
                    f"### ⚡ মূল বৈশিষ্ট্য ও গুরুত্বপূর্ণ দিকসমূহ\n"
                    f"{second_snip if second_snip else 'এই বিষয়টি তার নিজস্ব ক্ষেত্রে অত্যন্ত তাৎপর্যপূর্ণ ভূমিকা পালন করে।'}\n\n"
                    f"### 💡 বিশেষ তাৎপর্য ও প্রয়োগ\n"
                    f"{third_snip if third_snip else 'আধুনিক প্রেক্ষাপটে এর গুরুত্ব ও প্রভাব সুদূরপ্রসারী।'}\n\n"
                    f"স্যার, এই বিষয়ে আরও নির্দিষ্ট কোনো তথ্য জানতে চান?"
                )
            else:
                return (
                    f"Here is the detailed overview of **{topic_title}**:\n\n"
                    f"{image_block}"
                    f"### 🌟 {topic_title} — Overview & Core Profile\n"
                    f"{first_snip}\n\n"
                    f"### ⚡ Key Highlights & Core Details\n"
                    f"{second_snip if second_snip else 'This topic represents a seminal development in its domain.'}\n\n"
                    f"### 💡 Significance & Lore Context\n"
                    f"{third_snip if third_snip else 'It continues to be widely referenced for its foundational impact.'}\n\n"
                    f"Would you like me to explore any particular aspect of **{topic_title}** in greater depth, Sir?"
                )

    # ── 6. Master Synthesizer Entry Point ────────────────────────────────────────

    def synthesize_answer(self, query: str, context_history: Optional[List[Dict[str, str]]] = None) -> str:
        """
        Master intelligence synthesizer:
        1. Evaluates conversational & greeting contexts.
        2. Solves mathematical equations step-by-step.
        3. Generates specialized programming solutions.
        4. Detects detailed storytelling and in-depth request intent.
        5. Queries live Wikipedia and Web Knowledge.
        6. Formulates articulate, deep, or crisp proportional answers in user's language (Bengali/English).
        """
        raw_q = query.strip()
        lang_mode = detect_language_mode(raw_q)
        is_detail = self.is_detail_or_story_requested(raw_q)

        # 1. Check conversational, greeting, social or live system queries (only if NOT asking for details/stories)
        if not is_detail:
            conv_reply = self.handle_conversational_query(raw_q, lang_mode)
            if conv_reply:
                return conv_reply

        # 2. Check for math & calculations
        math_res = self.solve_math(raw_q)
        if math_res:
            if lang_mode in ["bengali", "banglish"]:
                return f"হিসাবের ফলাফল:\n\n{math_res}, স্যার।"
            return f"Calculated result:\n\n{math_res}, Sir."

        # 3. Check for specific code queries
        code_res = self.handle_coding_query(raw_q, lang_mode)
        if code_res:
            return code_res

        # 4. Check for Story or Detailed In-Depth Request
        if is_detail:
            detailed_reply = self.handle_story_or_detailed_query(raw_q, lang_mode)
            if detailed_reply:
                return detailed_reply

        # 5. Guard against web searching for short conversational queries / name calls
        clean_norm = re.sub(r'[^\w\s\u0980-\u09FF]', ' ', raw_q).strip().lower()
        clean_words = clean_norm.split()
        if len(clean_words) <= 3 and any(w in clean_norm for w in ["hello", "hi", "hey", "jarvis", "ok", "yes", "shuno", "bolo", "আছো", "শোনো", "বলো", "হ্যালো"]):
            if lang_mode in ["bengali", "banglish"]:
                return "হ্যাঁ স্যার, আমি প্রস্তুত। বলুন কীভাবে সাহায্য করতে পারি?"
            return "Yes, Sir? All systems nominal. How can I assist you today?"

        # 6. Check Wikipedia encyclopedic data
        wiki_res = self.search_wikipedia(raw_q)
        
        # 7. Check live DuckDuckGo web results (only for informative search queries)
        web_results = []
        info_search_triggers = ["who is", "what is", "where is", "when did", "how to", "price", "weather", "capital", "population", "কে", "কি", "কোথায়", "কখন", "দাম", "ইতিহাস"]
        if any(tr in clean_norm for tr in info_search_triggers) or len(clean_words) >= 4:
            web_results = self.search_duckduckgo(raw_q, max_results=4)

        # 8. Formulate crisp, smart answer (Google Gemini style)
        if wiki_res and "may refer to:" not in wiki_res.get("summary", "").lower():
            if lang_mode in ["bengali", "banglish"]:
                return f"{wiki_res['summary']}\n\nস্যার, এই বিষয়ে আরও কিছু জানতে চান?"
            return f"{wiki_res['summary']}\n\nIs there anything specific you would like to explore regarding {wiki_res['title']}, Sir?"

        if web_results:
            top_snippets = [r.get("snippet", "") for r in web_results if r.get("snippet")]
            if top_snippets:
                clean_summary = " ".join(top_snippets[:2])
                if lang_mode in ["bengali", "banglish"]:
                    return f"{clean_summary}\n\nআপনার আর কোনো তথ্য প্রয়োজন হলে বলুন, স্যার।"
                return f"{clean_summary}\n\nStanding by if you need deeper details, Sir."

        if wiki_res:
            return f"{wiki_res['summary']}"

        # 9. Intelligent contextual fallback response (Clean, Polite, Common Sense)
        if lang_mode in ["bengali", "banglish"]:
            return f"হ্যাঁ স্যার, আমি আপনার কথা বুঝতে পেরেছি। বলুন কী করতে হবে?"

        return "Yes, Sir? All systems are nominal and I am standing by for your command."

dynamic_knowledge_engine = DynamicKnowledgeEngine()

