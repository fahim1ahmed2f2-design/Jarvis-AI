import os
import sys
import time
import subprocess
import logging
import httpx
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [WATCHDOG] %(message)s"
)
logger = logging.getLogger("jarvis.watchdog")

HEALTH_URL = "http://127.0.0.1:8000/api/health"
PROJECT_ROOT = Path(__file__).resolve().parent.parent
PYTHON_EXE = PROJECT_ROOT / ".venv" / "Scripts" / "python.exe"
if not PYTHON_EXE.exists():
    PYTHON_EXE = sys.executable

def start_backend_process():
    logger.info(f"Starting JARVIS backend process using {PYTHON_EXE}...")
    proc = subprocess.Popen(
        [str(PYTHON_EXE), "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=str(PROJECT_ROOT)
    )
    return proc

def monitor_loop():
    logger.info("JARVIS 24/7 Watchdog Supervisor running.")
    proc = start_backend_process()
    consecutive_failures = 0

    while True:
        time.sleep(5)
        # Check if process is still running
        if proc.poll() is not None:
            logger.warning(f"Backend process terminated unexpectedly (code {proc.returncode}). Restarting...")
            proc = start_backend_process()
            consecutive_failures = 0
            continue

        # Check HTTP health
        try:
            with httpx.Client(timeout=3.0) as client:
                res = client.get(HEALTH_URL)
                if res.status_code == 200:
                    consecutive_failures = 0
                else:
                    consecutive_failures += 1
        except Exception:
            consecutive_failures += 1

        if consecutive_failures >= 4:
            logger.error("Backend unresponsive for 20+ seconds. Forcing restart...")
            try:
                proc.terminate()
                proc.wait(timeout=3)
            except Exception:
                proc.kill()
            proc = start_backend_process()
            consecutive_failures = 0

if __name__ == "__main__":
    monitor_loop()
