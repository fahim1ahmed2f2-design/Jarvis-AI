import re
import unicodedata
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, Tuple

BN_DIGITS = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
}

def normalize_text(text: str) -> str:
    """Converts Bengali numerals to ASCII digits and standardizes decomposed Bengali characters."""
    t = "".join(BN_DIGITS.get(c, c) for c in text)
    t = t.replace('\u09af\u09bc', '\u09df') # য়
    t = t.replace('\u09a1\u09bc', '\u09dc') # ড়
    t = t.replace('\u09a2\u09bc', '\u09dd') # ঢ়
    return t

def normalize_bn_digits(text: str) -> str:
    """Alias for backwards compatibility."""
    return normalize_text(text)

class NaturalTimeParser:
    """
    Parser for natural language date and time expressions in English, Bengali, and Mixed speech.
    """

    def parse(self, text: str, ref_datetime: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Parses natural language text to extract date, start_time, end_time, and remaining topic.
        """
        now = ref_datetime or datetime.now().astimezone()
        raw = text.strip()
        norm = normalize_text(raw.lower())

        target_date: Optional[str] = None
        start_time: Optional[str] = None
        end_time: Optional[str] = None
        is_ambiguous = False
        ambiguity_reason: Optional[str] = None
        time_tokens_matched = []

        # 1. Date Detection
        if any(w in norm for w in ["আজ", "আজকে", "today", "this day"]):
            target_date = now.strftime("%Y-%m-%d")
            time_tokens_matched.extend(["আজ", "আজকে", "today", "this day"])
        elif any(w in norm for w in ["গতকাল", "yesterday"]):
            target_date = (now - timedelta(days=1)).strftime("%Y-%m-%d")
            time_tokens_matched.extend(["গতকাল", "yesterday"])
        elif any(w in norm for w in ["গত পরশু", "পরশু", "day before yesterday", "2 days ago"]):
            target_date = (now - timedelta(days=2)).strftime("%Y-%m-%d")
            time_tokens_matched.extend(["গত পরশু", "পরশু", "day before yesterday", "2 days ago"])
        else:
            date_match = re.search(r'\b(20\d\d)[-/.](\d{1,2})[-/.](\d{1,2})\b', norm)
            if date_match:
                y, m, d = date_match.groups()
                target_date = f"{int(y):04d}-{int(m):02d}-{int(d):02d}"
                time_tokens_matched.append(date_match.group(0))

        # 2. Relative Time Duration
        rel_hour_match = re.search(r'(?:last|past|শেষ|গত)\s+(\d+)\s*(?:hours?|ঘণ্টা|ঘন্টা)', norm)
        if rel_hour_match:
            hours = int(rel_hour_match.group(1))
            st = now - timedelta(hours=hours)
            target_date = target_date or st.strftime("%Y-%m-%d")
            start_time = st.strftime("%H:%M:%S")
            end_time = now.strftime("%H:%M:%S")
            time_tokens_matched.append(rel_hour_match.group(0))

        rel_min_match = re.search(r'(?:last|past|শেষ|গত)\s+(\d+)\s*(?:minutes?|mins?|মিনিট)', norm)
        if rel_min_match and not start_time:
            mins = int(rel_min_match.group(1))
            st = now - timedelta(minutes=mins)
            target_date = target_date or st.strftime("%Y-%m-%d")
            start_time = st.strftime("%H:%M:%S")
            end_time = now.strftime("%H:%M:%S")
            time_tokens_matched.append(rel_min_match.group(0))

        # 3. Explicit Hour Ranges
        if not start_time:
            # Pattern A: 24-hour range "14:00 to 15:00"
            range_24 = re.search(r'\b(\d{1,2}):(\d{2})(?::\d{2})?\s*(?:to|-|থেকে|পর্যন্ত)\s*(\d{1,2}):(\d{2})(?::\d{2})?\b', norm)
            if range_24:
                sh, sm, eh, em = map(int, range_24.groups())
                start_time = f"{sh:02d}:{sm:02d}:00"
                end_time = f"{eh:02d}:{em:02d}:00"
                time_tokens_matched.append(range_24.group(0))

            # Pattern B: English 12h range "between 8 and 9 PM" or "2 PM to 3 PM"
            range_en = re.search(r'\b(?:between\s+)?(\d{1,2})(?::(\d{2}))?\s*(?:am|pm)?\s*(?:to|and|-)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b', norm)
            if range_en and not start_time:
                sh, sm, eh, em, meridian = range_en.groups()
                sh = int(sh)
                eh = int(eh)
                sm = int(sm or 0)
                em = int(em or 0)
                if meridian == "pm":
                    if sh < 12: sh += 12
                    if eh < 12: eh += 12
                elif meridian == "am":
                    if sh == 12: sh = 0
                    if eh == 12: eh = 0
                start_time = f"{sh:02d}:{sm:02d}:00"
                end_time = f"{eh:02d}:{em:02d}:00"
                time_tokens_matched.append(range_en.group(0))

            # Pattern C: Bengali range "দুপুর ২টা থেকে ৩টা", "২টা থেকে ৩টা পর্যন্ত", "রাত ৮টা থেকে ৯টা"
            range_bn = re.search(r'(?:(সকাল|দুপুর|বিকাল|বিকেল|সন্ধ্যা|রাত)\s*)?(\d{1,2})(?::(\d{2}))?\s*টা?\s*(?:থেকে|-)\s*(\d{1,2})(?::(\d{2}))?\s*টা?(?:\s*পর্যন্ত)?', norm)
            if range_bn and not start_time:
                period, sh_s, sm_s, eh_s, em_s = range_bn.groups()
                sh = int(sh_s)
                eh = int(eh_s)
                sm = int(sm_s or 0)
                em = int(em_s or 0)
                
                if period in ["দুপুর", "বিকাল", "বিকেল", "সন্ধ্যা", "রাত"] or (period is None and any(p in norm for p in ["দুপুর", "বিকাল", "বিকেল", "সন্ধ্যা", "রাত"])):
                    if sh < 12 and sh != 12: sh += 12
                    if eh < 12 and eh != 12: eh += 12
                elif period == "সকাল" or (period is None and "সকাল" in norm):
                    if sh == 12: sh = 0
                    if eh == 12: eh = 0
                elif period is None:
                    if 1 <= sh <= 6: sh += 12
                    if 1 <= eh <= 6: eh += 12

                start_time = f"{sh:02d}:{sm:02d}:00"
                end_time = f"{eh:02d}:{em:02d}:00"
                time_tokens_matched.append(range_bn.group(0))

        # 4. Period of Day (Broad Ranges)
        if not start_time:
            if any(w in norm for w in ["সকালে", "সকাল", "morning", "this morning", "in the morning"]):
                start_time = "06:00:00"
                end_time = "12:00:00"
                time_tokens_matched.extend(["সকালে", "সকাল", "morning", "this morning", "in the morning"])
            elif any(w in norm for w in ["দুপুরে", "দুপুর", "noon", "afternoon", "this afternoon", "in the afternoon"]):
                start_time = "12:00:00"
                end_time = "17:00:00"
                time_tokens_matched.extend(["দুপুরে", "দুপুর", "noon", "afternoon", "this afternoon", "in the afternoon"])
            elif any(w in norm for w in ["সন্ধ্যায়", "সন্ধ্যা", "evening", "this evening", "in the evening"]):
                start_time = "17:00:00"
                end_time = "20:00:00"
                time_tokens_matched.extend(["সন্ধ্যায়", "সন্ধ্যা", "evening", "this evening", "in the evening"])
            elif any(w in norm for w in ["রাতে", "রাত", "night", "last night", "tonight", "at night"]):
                start_time = "20:00:00"
                end_time = "23:59:59"
                time_tokens_matched.extend(["রাতে", "রাত", "night", "last night", "tonight", "at night"])
                if "last night" in norm or "গত রাতে" in norm:
                    target_date = (now - timedelta(days=1)).strftime("%Y-%m-%d")

        # 5. Single Time Target
        if not start_time:
            single_en = re.search(r'\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b', norm)
            if single_en:
                h_str, m_str, meridian = single_en.groups()
                h = int(h_str)
                m = int(m_str or 0)
                if meridian == "pm" and h < 12: h += 12
                if meridian == "am" and h == 12: h = 0
                start_time = f"{h:02d}:{m:02d}:00"
                end_time = f"{min(23, h + 1):02d}:{m:02d}:00" if m == 0 else f"{h:02d}:59:59"
                time_tokens_matched.append(single_en.group(0))

            single_bn = re.search(r'(?:(সকাল|দুপুর|বিকাল|বিকেল|সন্ধ্যা|রাত)\s*)?(\d{1,2})(?::(\d{2}))?\s*টায়?', norm)
            if single_bn and not start_time:
                period, h_str, m_str = single_bn.groups()
                h = int(h_str)
                m = int(m_str or 0)
                if period in ["দুপুর", "বিকাল", "বিকেল", "সন্ধ্যা", "রাত"] and h < 12:
                    h += 12
                elif period is None and 1 <= h <= 6:
                    h += 12
                start_time = f"{h:02d}:{m:02d}:00"
                end_time = f"{min(23, h + 1):02d}:{m:02d}:00" if m == 0 else f"{h:02d}:59:59"
                time_tokens_matched.append(single_bn.group(0))

        # 6. Ambiguity Detection
        vague_triggers = ["তখন", "কোন এক সময়", "কিছুক্ষণ আগে", "some time ago", "then", "sometime", "earlier", "আগে"]
        has_vague = any(v in norm for v in vague_triggers)
        
        if has_vague and not target_date and not start_time:
            is_ambiguous = True
            ambiguity_reason = "Time reference is ambiguous. Please specify an exact date, period, or hour range."

        bare_num = re.search(r'\b(?:at|around|থেকে|এ)\s+(\d{1,2})\b', norm)
        if bare_num and not start_time and not is_ambiguous:
            is_ambiguous = True
            ambiguity_reason = f"Hour '{bare_num.group(1)}' lacks AM/PM or period of day (morning/afternoon/night)."

        if start_time and not target_date:
            target_date = now.strftime("%Y-%m-%d")

        # 7. Extract remaining topic query by removing matched temporal words & search wrappers
        topic_query = normalize_text(raw)
        for token in set(time_tokens_matched):
            topic_query = re.sub(re.escape(token), ' ', topic_query, flags=re.IGNORECASE)
            topic_query = re.sub(re.escape(normalize_text(token)), ' ', topic_query, flags=re.IGNORECASE)

        stop_patterns = [
            r'\b(?:what\s+did\s+(?:i|we|you|they)\s+(?:say|hear|listen|discuss|mention|tell))\b',
            r'\b(?:what\s+(?:was|were)\s+(?:said|discussed|heard|the\s+exact\s+words))\b',
            r'\b(?:what\s+happened|did\s+we\s+discuss)\b',
            r'\b(?:tell\s+me\s+(?:all\s+)?conversations?|tell\s+me|all\s+conversations?|conversations?)\b',
            r'\b(?:exact\s+wording|exact\s+quote|exact\s+transcript|word\s+for\s+word|verbatim)\b',
            r'\b(?:কী\s+কী\s+কথা|কী\s+কথা\s+হয়েছিল|কী\s+কথা\s+হয়েছে|কী\s+হয়েছিল|কী\s+হয়েছে)\b',
            r'\b(?:কী\s+বলেছিলাম|কী\s+বলা\s+হয়েছিল|কী\s+বলা\s+হয়েছে|কী\s+কথা\s+শুনেছ|কী\s+শুনেছো|কী\s+শুনেছ|কোন\s+কথা\s+শুনেছ)\b',
            r'\b(?:কী\s+আলোচনা\s+হয়েছিল|কী\s+আলোচনা\s+হয়েছে|কথা\s+হয়েছিল|কথা\s+হয়েছে|কথা\s+বলেছিলাম|কথা\s+শুনেছ|কী\s+কথা|কথোপকথন)\b',
            r'\b(?:হুবহু|সরাসরি\s+ট্রান্সক্রিপ্ট|এক্স্যাক্ট|দাও|বলো|জানাও|শোনাও)\b',
            r'\b(?:সার্চ\s+করো|খুঁজে\s+দাও|মনে\s+করো|বলো\s+তো|search|find|recall|show\s+me)\b',
            r'\b(?:about|সম্পর্কে|নিয়ে|বিষয়ক|ব্যাপারে)\b',
            r'\b(?:থেকে|পর্যন্ত|টার?\s*দিকে|সময়ে?|সময়|হলো|ছিল|আজ|আজকে|সব|গতকাল|পরশু|today|yesterday)\b',
            r'\b(?:সকাল|দুপুর|বিকাল|বিকেল|সন্ধ্যা|রাত|morning|afternoon|evening|night|noon)\b',
            r'\b\d{1,2}(?::\d{2})?\s*(?:am|pm|টা|টায়|টায়|টার)?\b'
        ]
        for sp in stop_patterns:
            topic_query = re.sub(sp, ' ', topic_query, flags=re.IGNORECASE)

        topic_query = re.sub(r'[^\w\s\u0980-\u09FF]', ' ', topic_query)
        topic_query = re.sub(r'\s+', ' ', topic_query).strip()

        generic_words = {
            "কী", "কি", "কথা", "হয়েছে", "হয়েছিল", "বলা", "শুনেছ", "বলেছিলাম", "হলো", "ছিল",
            "what", "did", "say", "said", "hear", "tell", "jarvis", "স্যার", "sir", "exact", "wording",
            "দাও", "বলো", "হুবহু"
        }
        cleaned_words = [w for w in topic_query.split() if len(w) > 1 and not w.isdigit() and w.lower() not in generic_words]
        final_topic = " ".join(cleaned_words) if cleaned_words else None

        return {
            "raw_input": raw,
            "date": target_date,
            "start_time": start_time,
            "end_time": end_time,
            "topic": final_topic,
            "is_ambiguous": is_ambiguous,
            "ambiguity_reason": ambiguity_reason
        }

natural_time_parser = NaturalTimeParser()
