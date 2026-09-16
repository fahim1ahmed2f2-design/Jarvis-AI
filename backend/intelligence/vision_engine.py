import os
import io
import time
import json
import base64
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path
from PIL import Image
import httpx

from backend.tools.vision_ops import capture_screen, inspect_active_window
from backend.config import CREDENTIALS_STATE_FILE

logger = logging.getLogger("jarvis.intelligence.vision")

GEMINI_VISION_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.6-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-3.5-flash"
]


class VisionIntelligenceEngine:
    """
    JARVIS Multimodal Cybernetic Vision & Optical Eye Core.
    Handles active screen perception, real-time camera eye streams, and continuous sentinel visual awareness.
    """

    def __init__(self):
        self.latest_camera_observation: Optional[Dict[str, Any]] = None
        self.camera_active = False

    def _get_api_keys(self) -> Dict[str, Optional[str]]:
        gemini_key = os.getenv("GEMINI_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")
        if CREDENTIALS_STATE_FILE.exists():
            try:
                with open(CREDENTIALS_STATE_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    keys = data.get("keys", {})
                    gemini_key = keys.get("gemini") or gemini_key
                    openai_key = keys.get("openai") or openai_key
            except Exception as e:
                logger.debug(f"Error loading credentials for vision: {e}")
        return {"gemini": gemini_key, "openai": openai_key}

    def _call_gemini_vision(self, prompt: str, image_b64: str, mime_type: str = "image/jpeg") -> Optional[str]:
        """Calls Gemini Multimodal API directly via REST with automatic model fallback."""
        keys = self._get_api_keys()
        gemini_key = keys.get("gemini")
        if not gemini_key:
            return None

        # Clean base64 string
        clean_b64 = image_b64
        if "," in clean_b64:
            clean_b64 = clean_b64.split(",")[1]

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": clean_b64
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 2048
            }
        }

        headers = {"Content-Type": "application/json"}

        for model in GEMINI_VISION_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
            try:
                with httpx.Client(timeout=15.0) as client:
                    resp = client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates and candidates[0].get("content", {}).get("parts"):
                            return candidates[0]["content"]["parts"][0]["text"]
                    else:
                        logger.warning(f"Gemini vision model {model} returned {resp.status_code}: {resp.text[:150]}")
            except Exception as e:
                logger.warning(f"Gemini vision model {model} error: {e}")

        return None

    def _call_openai_vision(self, prompt: str, image_b64: str) -> Optional[str]:
        """Calls OpenAI Multimodal API (GPT-4o) via REST."""
        keys = self._get_api_keys()
        openai_key = keys.get("openai")
        if not openai_key:
            return None

        clean_b64 = image_b64
        if "," in clean_b64:
            clean_b64 = clean_b64.split(",")[1]

        headers = {
            "Authorization": f"Bearer {openai_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{clean_b64}"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 1500
        }

        try:
            with httpx.Client(timeout=15.0) as client:
                resp = client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
                if resp.status_code == 200:
                    res_json = resp.json()
                    return res_json["choices"][0]["message"]["content"]
        except Exception as e:
            logger.warning(f"OpenAI vision error: {e}")

        return None

    def analyze_current_screen(self, user_query: str = "Analyze and summarize the contents of this display") -> Dict[str, Any]:
        """
        Captures the screen and performs multimodal vision intelligence
        to describe, explain, or extract data from what is on the user's screen.
        """
        # 1. Capture screen
        cap_res = capture_screen("vision_analysis")
        if not cap_res.get("success"):
            return {
                "status": "error",
                "message": f"Screen capture failed: {cap_res.get('error', 'Unknown')}",
                "analysis": "JARVIS was unable to capture the monitor display."
            }

        file_path = cap_res.get("file_path")
        if not file_path or not os.path.exists(file_path):
            return {
                "status": "error",
                "message": "Screen capture file could not be found or read.",
                "analysis": "JARVIS captured the screen but the resulting image file was unavailable."
            }

        window_info = inspect_active_window()
        active_title = window_info.get("title", "Active Desktop Window")

        # Encode image to Base64
        img_base64 = ""
        try:
            with open(file_path, "rb") as f:
                img_bytes = f.read()
                img_base64 = base64.b64encode(img_bytes).decode("utf-8")
        except Exception as e:
            logger.warning(f"Error reading capture file: {e}")

        is_bengali = any(ord(c) >= 0x0980 and ord(c) <= 0x09FF for c in user_query)
        if is_bengali:
            lang_instruction = (
                "বাংলায় উত্তর দিন এবং 'স্যার' সম্বোধন করুন। "
                "অপ্রয়োজনীয় ভূমিকা বা লম্বা সূচনা বাদ দিয়ে স্ক্রিনে প্রদর্শিত মূল উইন্ডো, কোড, এরর বা বিষয়ের সুনির্দিষ্ট ও সংক্ষিপ্ত বিবরণ দিন।"
            )
        else:
            lang_instruction = (
                "Reply in concise English, addressing the user as 'Sir'. "
                "Avoid unnecessary filler and focus directly on the active window, error, or key content displayed."
            )

        prompt = (
            f"You are JARVIS AI Vision Core. User query: '{user_query}'. Focused window: '{active_title}'.\n\n"
            f"{lang_instruction}\n\n"
            "State clearly, directly, and concisely what is currently visible on the screen and answer the user's question with laser focus."
        )

        # 2. Try Multimodal APIs
        analysis_text = self._call_gemini_vision(prompt, img_base64, mime_type="image/png")
        if not analysis_text:
            analysis_text = self._call_openai_vision(prompt, img_base64)

        # Fallback Synthesizer if no cloud key returned
        if not analysis_text:
            width = cap_res.get("width", 1920)
            height = cap_res.get("height", 1080)
            if is_bengali:
                analysis_text = f"স্যার, স্ক্রিনে বর্তমানে সক্রিয় উইন্ডো হলো **{active_title}** ({width}x{height} রেজোলিউশন)।"
            else:
                analysis_text = f"Sir, the active focused window on your display is **{active_title}** ({width}x{height} resolution)."

        return {
            "status": "success",
            "active_window": active_title,
            "resolution": f"{cap_res.get('width', 1920)}x{cap_res.get('height', 1080)}",
            "file_path": file_path,
            "image_data_url": f"data:image/png;base64,{img_base64}" if img_base64 else "",
            "query": user_query,
            "analysis": analysis_text,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }

    def analyze_camera_frame(
        self,
        image_base64: str,
        user_query: str = "Describe what you see in front of the camera",
        language: str = "auto",
        continuous: bool = False
    ) -> Dict[str, Any]:
        """
        Processes a real-time frame from the user's camera / optical sensor.
        Provides laser-focused, exact, and concise visual perception.
        """
        self.camera_active = True
        timestamp_str = time.strftime("%Y-%m-%d %H:%M:%S")
        is_bengali = language == "bengali" or any(ord(c) >= 0x0980 and ord(c) <= 0x09FF for c in user_query)

        # 1. Clean base64 data & inspect resolution
        clean_b64 = image_base64
        if "," in clean_b64:
            clean_b64 = clean_b64.split(",")[1]

        try:
            img_bytes = base64.b64decode(clean_b64)
            pil_img = Image.open(io.BytesIO(img_bytes))
            img_width, img_height = pil_img.size
        except Exception as e:
            logger.error(f"Failed to decode camera frame: {e}")
            return {
                "status": "error",
                "message": f"Invalid camera image data: {e}",
                "analysis": "JARVIS Optical Sensor received unreadable image data."
            }

        # 2. Build Laser-Focused Multimodal Vision Prompt
        if is_bengali:
            lang_instruction = (
                "বাংলায় উত্তর দিন এবং ব্যবহারকারীকে 'স্যার' সম্বোধন করুন। "
                "কোনো অপ্রয়োজনীয় ভূমিকা, সিস্টেম ডসিয়ার বা লম্বা বর্ণনা দেবেন না। "
                "ক্যামেরার মূল ফোকাসে (Main Focus) যে বস্তু, ব্যক্তি, অঙ্গভঙ্গি বা লেখা রয়েছে শুধুমাত্র সেটির সুনির্দিষ্ট, নিখুঁত ও স্পষ্ট মূল বিবরণ ১ থেকে ৩ বাক্যে দিন।"
            )
        else:
            lang_instruction = (
                "Reply concisely in English, addressing the user politely as 'Sir'. "
                "Do NOT provide boilerplate preamble, system status, or long multi-section dossiers. "
                "Focus strictly on the main subject/object in direct view and state exactly what it is in 1 to 3 crisp, accurate sentences."
            )

        prompt = (
            "You are JARVIS's Optical Cyber Eye. You are looking directly through the user's live camera feed.\n\n"
            f"User's Query / Command: '{user_query}'\n\n"
            f"{lang_instruction}\n\n"
            "RULES:\n"
            "- Directly name and describe the primary object in focus, person, item held in hand, or text visible.\n"
            "- Include exact details (color, brand/type, text on it) concisely without filler words.\n"
            "- Deliver a direct, natural, razor-sharp response."
        )

        # 3. Multimodal AI Calls
        analysis_text = self._call_gemini_vision(prompt, clean_b64, mime_type="image/jpeg")
        if not analysis_text:
            analysis_text = self._call_openai_vision(prompt, clean_b64)

        # Local Fallback
        if not analysis_text:
            if is_bengali:
                analysis_text = f"স্যার, লাইভ ক্যামেরা অপটিক্যাল ফিড সচল রয়েছে ({img_width}x{img_height} px)। আপনার সামনের বস্তু স্পষ্ট রয়েছে।"
            else:
                analysis_text = f"Sir, live optical camera sensor is active ({img_width}x{img_height} px)."

        # Store in neural memory observation
        self.latest_camera_observation = {
            "timestamp": timestamp_str,
            "query": user_query,
            "analysis": analysis_text,
            "resolution": f"{img_width}x{img_height}",
            "continuous": continuous
        }

        return {
            "status": "success",
            "optical_sensor": "ONLINE",
            "resolution": f"{img_width}x{img_height}",
            "query": user_query,
            "analysis": analysis_text,
            "timestamp": timestamp_str
        }

    def get_latest_optical_context(self) -> Optional[str]:
        """Returns the latest camera perception summary to inject into brain reasoning."""
        if not self.latest_camera_observation:
            return None
        obs = self.latest_camera_observation
        return f"Live Camera Optical Observation ({obs['timestamp']}):\n{obs['analysis']}"


vision_engine = VisionIntelligenceEngine()
