import re
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from backend.ambient_memory.models import AmbientMemoryItem
from backend.ambient_memory.time_parser import natural_time_parser, NaturalTimeParser
from backend.ambient_memory.retrieval import ambient_retrieval, AmbientRetrievalEngine

logger = logging.getLogger("jarvis.ambient_memory.reasoning")

class AmbientReasoningBridge:
    """
    Cognitive bridge connecting Ambient Memory retrieval with JARVIS AI Reasoning.
    
    Adheres strictly to the Non-Hallucination & Accuracy Rules:
    1. Never invent or hallucinate conversation details.
    2. Never assume anything not present in the retrieved transcripts.
    3. Never claim words were spoken if not in the stored memory.
    4. Provide only retrieved Ambient Memory as evidence.
    5. Preserve uncertainty tags for low-confidence or unclear speech.
    6. If no relevant memory exists, explicitly state no records were found.
    7. If exact wording is requested, output the exact stored transcript.
    8. Distinguish clearly between exact quotes and AI summaries.
    9. Chunk large time ranges to prevent context overflow.
    """

    def __init__(
        self,
        retrieval_engine: Optional[AmbientRetrievalEngine] = None,
        time_parser: Optional[NaturalTimeParser] = None
    ):
        self.retrieval = retrieval_engine or ambient_retrieval
        self.time_parser = time_parser or natural_time_parser

    def is_ambient_query(self, text: str) -> bool:
        """
        Detects whether a user prompt is asking about previously heard/recorded conversations.
        """
        raw = text.strip().lower()
        if not raw:
            return False

        # English patterns
        en_patterns = [
            r"\b(what\s+did\s+(i|we|they|you)\s+(say|hear|discuss|talk\s+about))\b",
            r"\b(what\s+was\s+said|what\s+was\s+discussed|what\s+did\s+i\s+tell\s+you)\b",
            r"\b(what\s+conversations?\s+did\s+you\s+hear|what\s+did\s+you\s+listen)\b",
            r"\b(recall\s+(the\s+)?conversation|recall\s+ambient|ambient\s+memory)\b",
            r"\b(what\s+did\s+we\s+talk\s+about\s+(at|around|between|yesterday|today|this\s+morning))\b",
            r"\b(what\s+was\s+said\s+(at|around|between|during|earlier))\b",
            r"\b(exact\s+wording|exact\s+quote|word\s+for\s+word|what\s+were\s+the\s+exact\s+words)\b",
            r"\b(what\s+did\s+i\s+say\s+earlier|did\s+i\s+mention|did\s+we\s+discuss)\b"
        ]

        # Bengali & Banglish patterns
        bn_patterns = [
            r"(কী\s+কী\s+কথা|কী\s+কথা\s+হয়েছিল|কী\s+বলেছিলাম|কী\s+কথা\s+শুনেছ|কী\s+শুনেছো|কী\s+শুনেছ|কোন\s+কথা\s+শুনেছ)",
            r"(কী\s+আলোচনা\s+হয়েছিল|কোন\s+কথা\s+রেকর্ড|কথা\s+মনে\s+আছে|আগে\s+কী\s+বলেছিলাম)",
            r"(\d+টা\s*থেকে\s*\d+টা\s*পর্যন্ত\s*কী|\d+:\d+\s*(এ|তে)\s*কী\s*বলা|\b\d+\s*pm\s*থেকে\s*\d+\s*pm\b)",
            r"(ওই\s*সময়\s*আমি\s*কী\s*বলেছিলাম|তখন\s*কী\s*কথা\s*হয়েছিল|ওই\s*সময়ে\s*কী\s*বলা\s*হয়েছিল)",
            r"(আজ\s*সকালে\s*কী\s*কথা|আজ\s*দুপুরে\s*কী\s*কথা|গতকাল\s*কী\s*কথা|গত\s*রাতে\s*কী\s*কথা)",
            r"(হুবহু\s*কী\s*বলেছিলাম|এক্স্যাক্ট\s*ওয়ার্ডিং|সরাসরি\s*ট্রান্সক্রিপ্ট|হুবহু\s*রেকর্ড|হুবহু\s*কী\s*বলা\s*হয়েছিল)",
            r"\b(ki\s*kotha\s*shunech|ki\s*kotha\s*hoisilo|ki\s*bolsilam|oi\s*shomoy\s*ki\s*bolsilam|ki\s*kotha\s*shunecho)\b"
        ]

        if any(re.search(p, raw, re.IGNORECASE) for p in en_patterns):
            return True
        if any(re.search(p, raw, re.IGNORECASE) for p in bn_patterns):
            return True

        return False

    def is_exact_transcript_request(self, text: str) -> bool:
        """Detects if user is asking for literal verbatim/exact wording."""
        raw = text.strip().lower()
        exact_triggers = [
            "exact wording", "exact quote", "word for word", "exact transcript",
            "verbatim", "precisely what was said", "quote exactly",
            "হুবহু", "সরাসরি ট্রান্সক্রিপ্ট", "এক্স্যাক্ট", "হুবহু কী বলা", "হুবহু শব্দ"
        ]
        return any(t in raw for t in exact_triggers)

    def detect_query_language(self, text: str) -> str:
        """Detects whether prompt is in Bengali or English."""
        has_bengali_chars = any('\u0980' <= c <= '\u09FF' for c in text)
        if has_bengali_chars:
            return "bn"
        return "en"

    def process_ambient_query(
        self,
        user_message: str,
        brain_instance: Any = None,
        ref_datetime: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Executes end-to-end Ambient Memory Reasoning:
        1. Parse natural time & topic filters
        2. Query retrieval layer
        3. Apply accuracy rules
        4. Synthesize summary or exact transcript
        """
        raw_msg = user_message.strip()
        lang = self.detect_query_language(raw_msg)
        is_exact = self.is_exact_transcript_request(raw_msg)

        # 1. Retrieve Memories
        search_res = self.retrieval.search_memory(
            natural_query=raw_msg,
            ref_datetime=ref_datetime,
            limit=100
        )

        # 2. Handle Ambiguity
        if search_res.get("is_ambiguous") and not search_res.get("memories"):
            reason = search_res.get("ambiguity_reason", "")
            if lang == "bn":
                reply = f"স্যার, আপনার উল্লেখিত সময়টি নির্দিষ্ট নয়। অনুগ্রহ করে একটি নির্দিষ্ট সময় বা সময়সীমা উল্লেখ করুন (যেমন: আজ দুপুর ২টা থেকে ৩টা, অথবা গতকাল সন্ধ্যায়)।"
            else:
                reply = f"Sir, the requested time reference is ambiguous ({reason}). Please specify a clear time window (e.g., today between 2 PM and 3 PM, or yesterday evening)."
            return {
                "reply": reply,
                "total_memories": 0,
                "memories": [],
                "is_ambiguous": True,
                "filters_applied": search_res.get("filters_applied", {})
            }

        memories = search_res.get("memories", [])

        # 3. Handle Empty Memories (No Match Found)
        if not memories:
            filters = search_res.get("filters_applied", {})
            time_desc = ""
            if filters.get("date") and filters.get("start_time") and filters.get("end_time"):
                time_desc = f" ({filters['date']} {filters['start_time']} - {filters['end_time']})"
            elif filters.get("date"):
                time_desc = f" ({filters['date']})"

            if lang == "bn":
                reply = f"এই সময়ের{time_desc} জন্য কোনো সংরক্ষিত conversation বা কথোপকথন পাওয়া যায়নি, স্যার।"
            else:
                reply = f"No ambient conversation records were found for that specified time period{time_desc}, Sir."

            return {
                "reply": reply,
                "total_memories": 0,
                "memories": [],
                "is_ambiguous": False,
                "filters_applied": filters
            }

        # 4. Handle Exact Transcript Request (Verbatim output)
        if is_exact:
            formatted_quotes = []
            for m in memories:
                t_str = f"[{m.get('start_time')} - {m.get('end_time')}]"
                transcript_text = m.get("transcript", "")
                if m.get("status") == "uncertain" or m.get("metadata", {}).get("is_uncertain"):
                    formatted_quotes.append(f"{t_str} (অস্পষ্ট অডিও / Unclear Audio):\n\"{transcript_text}\"")
                else:
                    formatted_quotes.append(f"{t_str}:\n\"{transcript_text}\"")

            if lang == "bn":
                header = f"সংরক্ষিত হুবহু ট্রান্সক্রিপ্ট ({len(memories)}টি রেকর্ড):\n\n"
            else:
                header = f"Stored Exact Transcripts ({len(memories)} record(s)):\n\n"

            reply = header + "\n\n".join(formatted_quotes)
            return {
                "reply": reply,
                "total_memories": len(memories),
                "memories": memories,
                "is_exact": True,
                "filters_applied": search_res.get("filters_applied", {})
            }

        # 5. Large Result Set Chunking (if > 12 records, break into chronological chunks)
        if len(memories) > 12:
            return self._synthesize_large_range_summary(raw_msg, memories, lang, brain_instance)

        # 6. Standard Chronological Summarization & Synthesis
        return self._synthesize_direct_summary(raw_msg, memories, lang, brain_instance)

    def _synthesize_direct_summary(
        self,
        user_message: str,
        memories: List[Dict[str, Any]],
        lang: str,
        brain_instance: Any = None
    ) -> Dict[str, Any]:
        """Synthesizes an accurate factual summary adhering to non-hallucination rules."""
        # Check if all memories are unclear speech
        all_unclear = all(
            m.get("transcript") == "[unclear speech]" or m.get("status") == "uncertain"
            for m in memories
        )
        if all_unclear:
            if lang == "bn":
                reply = "এই অংশের কিছু কথা পরিষ্কারভাবে শনাক্ত করা যায়নি ([unclear speech]), স্যার।"
            else:
                reply = "Some speech in this segment could not be clearly identified due to ambient noise ([unclear speech]), Sir."
            return {
                "reply": reply,
                "total_memories": len(memories),
                "memories": memories
            }

        # Build transcript evidence block
        evidence_lines = []
        for idx, m in enumerate(memories, 1):
            st = m.get("start_time", "")
            et = m.get("end_time", "")
            tx = m.get("transcript", "")
            status = m.get("status", "processed")
            conf = m.get("confidence", 1.0)
            if status == "uncertain":
                evidence_lines.append(f"[{idx}] Time: {st} -> {et} | Status: UNCLEAR | Transcript: \"{tx}\" (Confidence: {conf:.2f})")
            else:
                evidence_lines.append(f"[{idx}] Time: {st} -> {et} | Transcript: \"{tx}\"")

        evidence_block = "\n".join(evidence_lines)

        # System instructions with strict accuracy constraints
        prompt = (
            "You are JARVIS, speaking the answer aloud to the user about actual recorded ambient conversations.\n\n"
            "STRICT ACCURACY RULES:\n"
            "1. You must ONLY state what is explicitly written in the RETRIEVED TRANSCRIPTS below.\n"
            "2. NEVER invent, extrapolate, guess, or add any facts not present in the transcripts.\n"
            "3. If a transcript says '[unclear speech]' or is marked UNCLEAR, clearly state: 'এই অংশের কিছু কথা পরিষ্কারভাবে শনাক্ত করা যায়নি' (Bengali) or 'some speech could not be clearly identified' (English).\n"
            "4. If multiple conversations are found, give a natural chronological spoken summary first, and offer to give further details.\n"
            "5. Respond in the same language as the user question (" + ("Bengali" if lang == "bn" else "English") + ").\n"
            "6. Maintain an articulate, respectful, natural JARVIS spoken persona.\n\n"
            f"USER QUESTION: {user_message}\n\n"
            f"RETRIEVED TRANSCRIPT EVIDENCE:\n{evidence_block}\n\n"
            "ACCURATE SPOKEN ANSWER:"
        )

        reply_text = ""
        if brain_instance:
            try:
                provider = brain_instance.get_provider_instance(brain_instance.active_provider_name)
                if provider and provider.api_key:
                    history = [{"role": "user", "content": prompt}]
                    reply_text = provider.generate_chat(history, system_prompt="You are JARVIS Ambient Memory Reasoning Core.")
            except Exception as e:
                logger.warning(f"LLM synthesis failed: {e}. Using deterministic synthesizer.")

        if not reply_text:
            # Deterministic, zero-hallucination fallback synthesis
            formatted_points = []
            for m in memories:
                st = m.get("start_time", "")
                tx = m.get("transcript", "")
                if m.get("status") == "uncertain" or tx == "[unclear speech]":
                    if lang == "bn":
                        formatted_points.append(f"• {st} সময়ে: এই অংশের কিছু কথা পরিষ্কারভাবে শনাক্ত করা যায়নি ({tx})")
                    else:
                        formatted_points.append(f"• At {st}: some speech could not be clearly identified ({tx})")
                else:
                    if lang == "bn":
                        formatted_points.append(f"• {st} মিনিটে: \"{tx}\"")
                    else:
                        formatted_points.append(f"• At {st}: \"{tx}\"")

            if len(memories) == 1:
                single_tx = memories[0].get("transcript", "")
                single_time = memories[0].get("start_time", "")
                if memories[0].get("status") == "uncertain" or single_tx == "[unclear speech]":
                    if lang == "bn":
                        reply_text = f"{single_time} সময়ে রেকর্ড পাওয়া গেছে, তবে এই অংশের কিছু কথা পরিষ্কারভাবে শনাক্ত করা যায়নি।"
                    else:
                        reply_text = f"Record found at {single_time}, but some speech could not be clearly identified."
                else:
                    if lang == "bn":
                        reply_text = f"{single_time} মিনিটে সংরক্ষিত কথোপকথন: \"{single_tx}\""
                    else:
                        reply_text = f"Recorded conversation at {single_time}: \"{single_tx}\""
            else:
                if lang == "bn":
                    reply_text = f"উক্ত সময়ে সর্বমোট {len(memories)}টি conversation পাওয়া গেছে, স্যার:\n" + "\n".join(formatted_points) + "\n\nচাইলে আমি নির্দিষ্ট conversation-টা বিস্তারিত বলতে পারি।"
                else:
                    reply_text = f"Found {len(memories)} recorded conversations during that period, Sir:\n" + "\n".join(formatted_points) + "\n\nI can provide exact details for any specific conversation if you wish."

        return {
            "reply": reply_text,
            "total_memories": len(memories),
            "memories": memories
        }

    def _synthesize_large_range_summary(
        self,
        user_message: str,
        memories: List[Dict[str, Any]],
        lang: str,
        brain_instance: Any = None
    ) -> Dict[str, Any]:
        """Processes large memory spans in chronological chunks and combines summaries."""
        chunk_size = 8
        chunks = [memories[i:i + chunk_size] for i in range(0, len(memories), chunk_size)]
        chunk_summaries = []

        for idx, chunk in enumerate(chunks, 1):
            c_start = chunk[0].get("start_time", "")
            c_end = chunk[-1].get("end_time", "")
            items_text = []
            for m in chunk:
                items_text.append(f"- {m.get('start_time')}: {m.get('transcript')}")
            
            chunk_summary = f"Period {c_start} to {c_end} ({len(chunk)} episodes):\n" + "\n".join(items_text)
            chunk_summaries.append(chunk_summary)

        combined_evidence = "\n\n".join(chunk_summaries)

        if lang == "bn":
            reply = (
                f"উক্ত দীর্ঘ সময়ে সর্বমোট {len(memories)}টি কথোপকথন রেকর্ড করা হয়েছে ({len(chunks)}টি ভাগে সংক্ষেপিত):\n\n"
                + combined_evidence
            )
        else:
            reply = (
                f"Found {len(memories)} ambient memory records across that time span (summarized in {len(chunks)} chronological sections):\n\n"
                + combined_evidence
            )

        return {
            "reply": reply,
            "total_memories": len(memories),
            "memories": memories,
            "is_chunked": True
        }

ambient_reasoning_bridge = AmbientReasoningBridge()
