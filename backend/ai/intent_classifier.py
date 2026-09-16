import re
from typing import Dict, Any, List

class IntentClassifier:
    def classify(self, text: str) -> Dict[str, Any]:
        """
        Multi-tier intent classification combining fast regex pattern matching
        and keyword analysis across English.
        """
        raw = text.strip().lower()
        if not raw:
            return {"intent": "CHAT", "confidence": 1.0, "category": "conversation"}

        # 0. Instant Fast Pass for Conversational Greetings, Status & Social Queries
        conversational_phrases = [
            r"^(hello|hi|hey|good\s+(morning|evening|afternoon|night)|sup|yo|greetings)\b",
            r"\b(how\s+are\s+you|who\s+are\s+you|what('s|\s+is)\s+your\s+name|what\s+can\s+you\s+do|thank\s+you|thanks|make\s+it\s+fast|faster\s+reply)\b",
            r"\b(status\s+of\s+my\s+pc|status\s+of\s+the\s+pc|pc\s+status|system\s+status|system\s+health|cpu\s+usage|ram\s+usage)\b",
            r"(কেমন\s+আছো|কেমন\s+আছেন|কি\s+খবর|কি\s+অবস্থা|হ্যালো|হাই|শোনো|তুমি\s+কে|তোমার\s+নাম\s+কি|ধন্যবাদ|কাজে\s+সাহায্য|ফাস্ট\s+হও|দ্রুত\s+বলো|পিসি\s+স্ট্যাটাস|সিস্টেম\s+স্ট্যাটাস)",
            r"\b(kemon\s+acho|ki\s+obostha|tumi\s+ke|tomar\s+nam\s+ki|valo\s+acho|valo\s+achi|tumi\s+kemon\s+acho|shuno|shoncho|shunchi|fast\s+koro|speed\s+barao)\b"
        ]
        if any(re.search(p, raw) for p in conversational_phrases) and not any(w in raw for w in ["open ", "launch ", "screenshot", "volume ", "clean ", "boost ", "lock pc", "কথা শুনেছ", "কী বলেছিলাম"]):
            return {"intent": "CHAT", "confidence": 0.99, "category": "conversation"}

        # 0.5 Ambient Auditory Memory Inquiries
        try:
            from backend.ambient_memory.reasoning import ambient_reasoning_bridge
            if ambient_reasoning_bridge.is_ambient_query(raw):
                return {"intent": "AMBIENT_MEMORY_QUERY", "confidence": 0.98, "category": "ambient_memory"}
        except Exception:
            pass

        # 1. Tactical Intelligence Briefing & Sitrep
        briefing_patterns = [
            r"\b(brief me|morning briefing|daily briefing|tactical briefing|sitrep|status report|daily report)\b",
            r"(ব্রিফিং|রিপোর্ট দাও|স্ট্যাটাস রিপোর্ট|সিটরেপ|সিস্টেম স্ট্যাটাস)"
        ]
        if any(re.search(p, raw) for p in briefing_patterns):
            return {"intent": "TACTICAL_BRIEFING", "confidence": 0.98, "category": "intelligence"}

        # 2. Autonomous Macro Workflows & Turbo Boost
        macro_patterns = [
            r"\b(focus mode|deep clean|system clean|clean pc|clean memory|clean ram|cyber shield|network audit|night mode|night standby|turbo boost|boost pc)\b",
            r"(পিসি ক্লিন|সিস্টেম ক্লিন|মেমোরি ক্লিন|র‍্যাম ক্লিন|ফোকাস মোড|সাইবার শিল্ড|টার্বো বুস্ট|পিসি ফাস্ট করো|অপটিমাইজ করো)"
        ]
        if any(re.search(p, raw) for p in macro_patterns):
            return {"intent": "MACRO_WORKFLOW", "confidence": 0.96, "category": "system"}

        # 3. Vision / Optical Eye & Screen Perception
        vision_patterns = [
            r"what('?s| is) on (my )?screen", r"look at (the )?screen", r"screenshot", r"screen\s*shots?",
            r"take\s*(a\s*)?screen\s*shots?", r"capture\s*screen",
            r"read (the )?error on screen", r"inspect (the )?display",
            r"look at me", r"what do you see", r"what am i holding", r"through (the )?camera",
            r"see me", r"camera eye", r"optical eye",
            r"(স্ক্রিনশট|স্ক্রিন দেখো|ডিসপ্লে দেখো|স্ক্রিনে কি আছে|পর্দা দেখো|ছবি তোলো)",
            r"(ক্যামেরায় কি|ক্যামেরা দিয়ে দেখো|ক্যামেরায় কি দেখতে|আমার দিকে তাকাও|আমার দিকে দেখো|আমার হাতে কি|চোখ দিয়ে দেখো|ক্যামেরার চোখ|ক্যামেরা অন|ক্যামেরা চালু|ক্যামেরা ওপেন)"
        ]
        if any(re.search(p, raw, re.IGNORECASE) for p in vision_patterns):
            return {"intent": "VISION_OP", "confidence": 0.99, "category": "vision"}

        # 4. Network Operations & Diagnostics
        net_patterns = [
            r"\b(speed test|test speed|ping\s+[a-zA-Z0-9\.\-]+|dns lookup|ip address|my ip|network status|network audit)\b",
            r"(স্পিড টেস্ট|পিং টেস্ট|নেটওয়ার্ক স্ট্যাটাস|আইপি এড্রেস|নেট স্পিড)"
        ]
        if any(re.search(p, raw) for p in net_patterns):
            return {"intent": "NET_OP", "confidence": 0.95, "category": "network"}

        # 5. Deep Research Dossier
        research_patterns = [
            r"\b(deep research|compile dossier|research dossier|dossier on|deep dive into)\b",
            r"(গবেষণা করো|ডোসিয়ার তৈরি করো|বিস্তারিত রিসার্চ করো|ডিপ রিসার্চ)"
        ]
        if any(re.search(p, raw) for p in research_patterns):
            return {"intent": "DEEP_RESEARCH", "confidence": 0.96, "category": "research"}

        # 6. PC Automation & Control (Opening apps, sound, power, locking, windows, folders, files, recycle bin, shell)
        pc_control_patterns = [
            r"\b(open|launch|start|run|close|kill|terminate|exit)\b.*(calculator|notepad|chrome|youtube|spotify|paint|explorer|vs code|vscode|terminal|cmd|powershell|word|excel|browser|downloads|desktop|documents|pictures|folder|app)",
            r"^(play)\s+([a-zA-Z0-9_\-\.\s]+)\s*(on\s+youtube|on\s+spotify|youtube|spotify)?",
            r"\b(volume|sound)\b.*(up|down|increase|decrease|mute|unmute|max|set|raise|lower|\d+%)|\b(increase|decrease|raise|lower|mute|unmute|turn up|turn down|set)\b.*(volume|sound|\d+%)",
            r"(click|double click|right click|move mouse|scroll (up|down))",
            r"(press|hit|type|hotkey|paste|copy|cut)\s+",
            r"(shutdown|restart|lock|sleep|cancel shutdown)\s*(pc|computer|system|windows)?",
            r"brightness\s*(up|down|set to \d+|\d+%)?",
            r"(set brightness|change brightness)",
            r"(clipboard|copy to clipboard)",
            r"(empty recycle bin|clean recycle bin|recycle bin|clear bin|trash)",
            r"(open folder|open directory|open downloads|open desktop|open documents|open c drive|open pictures)",
            r"(create folder|make folder|new folder|create file|make file|new file)",
            r"(run command|powershell|cmd|terminal|exec|shell)",
            r"(processes list|task manager|top processes)",
            r"(current weather|weather in\s+[a-zA-Z]+|temperature in\s+[a-zA-Z]+)",
            r"(bitcoin price|crypto rates|btc price)",
            # Bengali PC Automation
            r"(ইউটিউব|ফেসবুক|গুগল|ক্যালকুলেটর|নোটপ্যাড|ব্রাউজার|টার্মিনাল|ক্রোম|ডাউনলোড|ডেস্কটপ|ফোল্ডার|ফাইল).*(খোলো|চালু করো|ওপেন করো|চালাও|তৈরি করো|বানাও|মুছে ফেলো|বন্ধ করো)",
            r"(খোলো|চালু করো|ওপেন করো|চালাও|তৈরি করো|বানাও|মুছে ফেলো|বন্ধ করো).*(ইউটিউব|ফেসবুক|গুগল|ক্যালকুলেটর|নোটপ্যাড|ব্রাউজার|টার্মিনাল|ক্রোম|ডাউনলোড|ডেস্কটপ|ফোল্ডার|ফাইল)",
            r"(ভলিউম|সাউন্ড|শব্দ|ব্রাইটনেস).*(বাড়াও|কমাও|মিউট|আনমিউট|ফুল করো|বেশি করো|কম করো|\d+%)",
            r"(গান|মিউজিক|ভিডিও).*(বাজাও|চালাও|প্লে করো|পজ করো|বন্ধ করো|পরের গান)",
            r"(পিসি|কম্পিউটার).*(লক করো|রিস্টার্ট দাও|বন্ধ করো|স্লিপ করো|শাটডাউন দাও|ক্লিন করো)",
            r"(লক করো|শাটডাউন দাও|রিস্টার্ট করো|স্লিপ করো|শাটডাউন বাতিল করো)",
            r"(রিসাইকেল বিন|ট্র্যাশ বিন).*(খালি করো|মুছে ফেলো|ক্লিন করো)",
            r"(কমান্ড চালাও|রান করো|টাইপ করো|এন্টার প্রেস করো)",
            r"(আবহাওয়া কেমন|তাপমাত্রা কত)",
            r"(বিটকয়েনের দাম|ডলার রেট কত)"
        ]
        if any(re.search(p, raw) for p in pc_control_patterns):
            return {"intent": "PC_AUTOMATION", "confidence": 0.96, "category": "automation"}

        # 7. Reminder & Timer
        reminder_patterns = [
            r"\b(remind me|set a reminder|create reminder|alarm)\b",
            r"\b(set a timer|start a timer|countdown)\b",
            r"\bin \d+ (minutes|seconds|hours)\b",
            r"(মনে করিয়ে দাও|রিমাইন্ডার দাও|অ্যালার্ম দাও|টাইমার দাও)"
        ]
        if any(re.search(p, raw) for p in reminder_patterns):
            return {"intent": "REMINDER_OP", "confidence": 0.92, "category": "assistant"}

        # 8. User Tasks (Kanban / To-Do)
        task_patterns = [
            r"\b(add task|create task|new task|todo|to-do|my tasks|list tasks|complete task|mark task)\b",
            r"(টাস্ক যোগ করো|কাজ সেভ করো|নতুন টাস্ক|টাস্ক লিস্ট|টাস্ক কমপ্লিট)"
        ]
        if any(re.search(p, raw) for p in task_patterns):
            return {"intent": "TASK_OP", "confidence": 0.90, "category": "tasks"}

        # 9. Long-Term Memory
        memory_patterns = [
            r"\b(remember that|save to memory|store this in memory|what is my (name|favorite|password|email|phone|car|preference)|who is my|do you remember)\b",
            r"(মনে রাখো|মেমোরিতে সেভ করো|আমার প্রিয়|আমার নাম কি|মনে আছে)"
        ]
        if any(re.search(p, raw) for p in memory_patterns):
            return {"intent": "MEMORY_OP", "confidence": 0.88, "category": "memory"}

        # 10. Smart Home / IoT
        smart_home_patterns = [
            r"\b(turn (on|off)|switch (on|off)|light|fan|ac|thermostat|living room|bedroom)\b",
            r"(লাইট|ফ্যান|এসি|হিটার).*(অন করো|অফ করো|চালাও|বন্ধ করো)"
        ]
        if any(re.search(p, raw) for p in smart_home_patterns):
            return {"intent": "SMART_HOME_OP", "confidence": 0.85, "category": "smart_home"}

        # 11. Communication (Email / Contacts)
        comm_patterns = [
            r"\b(draft (an )?email|send email|compose mail|contacts|unread emails)\b",
            r"(ইমেইল পাঠাও|মেইল লেখো|কন্টাক্ট লিস্ট)"
        ]
        if any(re.search(p, raw) for p in comm_patterns):
            return {"intent": "COMMUNICATION_OP", "confidence": 0.88, "category": "communication"}

        # 12. Web Search & Live Facts
        search_patterns = [
            r"^(search|google|lookup|find out|browse)\s+(for|the web for)?",
            r"\b(latest news|current weather|live score|stock price of|todays date|who won)\b",
            r"(সার্চ করো|গুগল করো|খুঁজে দেখো|আজকের খবর|তাজা খবর)"
        ]
        if any(re.search(p, raw) for p in search_patterns):
            return {"intent": "WEB_SEARCH", "confidence": 0.90, "category": "search"}

        # 13. General Question / Knowledge / Code / Math
        question_indicators = [
            r"^(how|what|why|who|when|where|can you|explain|write|code|solve|calculate|translate|tell me|is it)",
            r"(কিভাবে|কেন|কি|কেমন|বলো|লিখো|কোড করো|সমাধান করো|হিসাব করো)",
            r"\?"
        ]
        if any(re.search(p, raw) for p in question_indicators) or len(raw.split()) > 4:
            return {"intent": "GENERAL_QUESTION", "confidence": 0.85, "category": "knowledge"}

        return {"intent": "CHAT", "confidence": 0.80, "category": "conversation"}

intent_classifier = IntentClassifier()
