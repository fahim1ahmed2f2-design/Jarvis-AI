"""
JARVIS Intelligent Multi-Lingual & Bilingual Language Detector
Accurately detects Bengali (বাংলা), Phonetic Banglish, and English.
"""
import re

BANGLISH_PATTERNS = [
    r'\b(?:kemon|achi|acho|achen|tumi|apni|amar|amake|tomar|apnar|korcho|korchen|koro|korbo|bolo|bolte|paro|parbe|ki|kothay|kokhon|keno|bhalo|valo|shob|thik|kichu|ekhon|ekhono|onek|choto|boro|shuno|shono|jani|bolun|dekhao|kore|dibe|dao|khobor|obostha|weather|somoy|time|nam|kaj)\b'
]

def detect_language_mode(text: str) -> str:
    """
    Detects language mode: 'bengali', 'banglish', or 'english'.
    """
    if not text or not text.strip():
        return "english"

    # 1. Direct Bengali Unicode Block (\u0980 - \u09FF)
    if re.search(r'[\u0980-\u09FF]', text):
        return "bengali"

    # 2. Phonetic Banglish Detection
    low = text.lower().strip()
    for pat in BANGLISH_PATTERNS:
        if re.search(pat, low):
            return "banglish"

    # 3. Default to English
    return "english"

