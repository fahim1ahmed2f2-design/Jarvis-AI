# ⚡ JARVIS v3.0 — Mark-III Sovereign AI & Autonomous Agent Town

<div align="center">

![JARVIS Banner](https://img.shields.io/badge/JARVIS-v3.0--Sovereign-00f0ff?style=for-the-badge&logo=probot&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.168-black?style=for-the-badge&logo=three.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

<p align="center">
  <b>The next-generation Iron Man-inspired AI Operating System combining a 3D Holographic Core, Autonomous Pixel Agent Town, Ambient Memory, Multi-Model Neural Routing, and Full Desktop OS Automation.</b>
</p>

</div>

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
  - [1. 3D Holographic Core & Audio-Reactive HUD](#1-3d-holographic-core--audio-reactive-hud)
  - [2. Pixel Agent Town Simulation](#2-pixel-agent-town-simulation)
  - [3. Hybrid Multi-Model Neural Router](#3-hybrid-multi-model-neural-router)
  - [4. Ambient Memory & Voice Subsystem](#4-ambient-memory--voice-subsystem)
  - [5. Autonomous OS Automation Engine](#5-autonomous-os-automation-engine)
  - [6. RAG Knowledge Base & Document Intelligence](#6-rag-knowledge-base--document-intelligence)
  - [7. Smart Home & IoT Automation](#7-smart-home--iot-automation)
  - [8. 24x7 Sovereign Daemon & Watchdog](#8-24x7-sovereign-daemon--watchdog)
- [System Architecture](#-system-architecture)
- [Repository Structure](#-repository-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Quick Start](#-installation--quick-start)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
  - [4. Configure Environment Variables](#4-configure-environment-variables)
  - [5. Launch JARVIS](#5-launch-jarvis)
- [Configuration Reference](#-configuration-reference)
- [API & WebSocket Protocols](#-api--websocket-protocols)
- [Automation Safety Modes](#-automation-safety-modes)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌌 Overview

**JARVIS v3.0 (Mark-III Sovereign)** is a full-stack, multimodal personal artificial intelligence operating system. Built with modern high-performance technologies, it bridges the gap between sci-fi interfaces and tangible, day-to-day desktop autonomy:

- **Sci-Fi Sci-Tech Visuals**: An interactive **Three.js WebGL Hologram Arc Reactor** with real-time audio FFT wave analysis and glassmorphism telemetry HUD.
- **Autonomous Multi-Agent Society**: A live, 2D isometric **Pixel Agent Town** where specialized sub-agents roam, converse, hold multi-hop conferences, and complete real-world tasks.
- **Deep Desktop Automation**: Direct computer vision, window management, mouse/keyboard control, and shell execution capabilities.
- **Continuous Ambient Memory**: Listens to speech, retains conversational state across sessions, and executes vector search through RAG knowledge bases.
- **Provider Agnostic**: Connects seamlessly with Google Gemini, Anthropic Claude, OpenAI, Groq, DeepSeek, and local offline Ollama instances.

---

## ✨ Key Features

### 1. 3D Holographic Core & Audio-Reactive HUD
- **WebGL Particle Sphere & Arc Reactor**: Dynamic Three.js particle sphere reacting to speech synthesis, microphone input, and thinking states.
- **Live FFT Audio Visualizer**: Real-time spectral bar and waveform displays.
- **Futuristic HUD Overlay**: Glassmorphic panels detailing CPU/RAM usage, active processes, disk health, network metrics, and notification center.

### 2. Pixel Agent Town Simulation
- **Virtual Living World**: Interactive 2D pixel-art town featuring rooms, workstations, conference spaces, and visual hubs.
- **Autonomous Sub-Agents**: Specialized roles including Researcher, Developer, Data Analyst, Security Auditor, and News Reporter.
- **Multi-Hop Consultation Engine**: Agents automatically convene, consult each other on complex queries, summarize conclusions, and report back to JARVIS.
- **Universal Task Delegation**: Dispatch tasks to individual agents or entire squads with live activity feeds and state machines.

### 3. Hybrid Multi-Model Neural Router
- **Universal Provider Tiering**:
  - **Google Gemini**: Default multimodal intelligence (`gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-pro`).
  - **Groq Cloud**: Blazing-fast inference (>500 tokens/sec with `llama-3.3-70b-versatile`, `deepseek-r1-distill-llama-70b`).
  - **DeepSeek AI**: Deep algorithmic reasoning (`deepseek-chat`, `deepseek-reasoner`).
  - **OpenAI**: Frontier capability models (`gpt-4o`, `gpt-4o-mini`, `o1`, `o3-mini`).
  - **Anthropic Claude**: Complex coding and synthesis (`claude-3-7-sonnet`, `claude-3-5-sonnet`).
  - **Ollama (Local / Offline)**: 100% private, local model inference without internet access.
- **Live In-App Credential Management**: Switch models, providers, and update API keys on the fly directly through the HUD settings modal.

### 4. Ambient Memory & Voice Subsystem
- **Passive & Active Voice**: Voice-activated interaction with speech-to-text (Whisper) and Edge-TTS voice generation (`en-GB-RyanNeural`).
- **Ambient Memory Stream**: Continuously monitors context and indexes conversations in a persistent SQLite database (`jarvis.db`).
- **Dynamic Emotion & Proactivity**: Sentiment detection adapts voice cadence, personality tone, and proactive suggestions.

### 5. Autonomous OS Automation Engine
- **Screen Reading & Vision**: High-speed desktop screen capture via `mss` with multimodal visual analysis.
- **Native GUI Control**: Mouse movement, clicks, window focus, typing, and hotkey execution via `pyautogui` and `pygetwindow`.
- **Shell Runner & File Ops**: Execute terminal commands, manage local files, parse directory structures, and inspect logs.
- **Bangladesh & Global News Intelligence**: Integrated local news scrapers and summaries for real-time localized updates.

### 6. RAG Knowledge Base & Document Intelligence
- **Vector Search Engine**: Semantic document lookup powered by `faiss-cpu` and `sentence-transformers`.
- **Multiformat Ingestion**: Ingest PDFs (`pypdf`), Word documents (`python-docx`), codebases, and Markdown files into long-term vector memory.

### 7. Smart Home & IoT Automation
- **Home Assistant**: Direct REST/WebSocket integration to control smart lights, thermostats, and switches.
- **MQTT Broker**: Publish/subscribe to custom IoT topics.
- **Virtual Smart Home Simulator**: Built-in mock device engine for testing automation routines offline.

### 8. 24x7 Sovereign Daemon & Watchdog
- **Crash Recovery & Watchdog**: `backend/watchdog.py` monitors system health and automatically restarts failed workers.
- **Silent Background Execution**: `.vbs` and `.bat` scripts allow JARVIS to run unobtrusively in the background on system boot.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        REACT + THREE.JS HUD FRONTEND                   │
│  ┌───────────────────────┐  ┌───────────────────┐  ┌────────────────┐  │
│  │ 3D Arc Reactor Hologram│  │ Pixel Agent Town  │  │ Telemetry HUD  │  │
│  │ (Three.js WebGL Core) │  │ (2D Canvas World) │  │ (Live Metrics) │  │
│  └───────────┬───────────┘  └─────────┬─────────┘  └────────┬───────┘  │
└──────────────┼────────────────────────┼─────────────────────┼──────────┘
               │ HTTP REST / Streaming  │ WebSocket Telemetry │
┌──────────────▼────────────────────────▼─────────────────────▼──────────┐
│                           FASTAPI CORE BACKEND                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Multi-Model Neural Router                     │  │
│  │    Gemini  │  Groq  │  DeepSeek  │  OpenAI  │  Claude  │ Ollama  │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌────────────────────────┐         │         ┌─────────────────────┐  │
│  │  Agent Town Engine     │◄────────┼────────►│  OS Automation Tool │  │
│  │  - Position Manager    │         │         │  - Screen (mss)     │  │
│  │  - Multi-Hop Consult   │         │         │  - PyAutoGUI / Shell│  │
│  │  - Squad Orchestrator  │         │         │  - System Metrics   │  │
│  └────────────────────────┘         │         └─────────────────────┘  │
│                                     │                                  │
│  ┌────────────────────────┐         │         ┌─────────────────────┐  │
│  │  Ambient Memory & RAG  │◄────────┘────────►│  Voice & Smart Home │  │
│  │  - FAISS Vector Store  │                   │  - Edge TTS/Whisper │  │
│  │  - SQLite Database     │                   │  - Home Assistant   │  │
│  │  - Document Ingestion  │                   │  - MQTT Simulator   │  │
│  └────────────────────────┘                   └─────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
.
├── backend/                        # FastAPI Backend Intelligence Core
│   ├── agent/                      # Autonomous agent reasoning and task workers
│   ├── ai/                         # Multi-provider LLM integrations (Gemini, Groq, etc.)
│   ├── ambient_memory/             # Ambient background listener & audio processing
│   ├── api/                        # REST & WebSocket route handlers
│   │   ├── agent_routes.py         # Agent task endpoints
│   │   ├── ambient_routes.py       # Ambient memory endpoints
│   │   ├── credentials.py          # Dynamic API keys & provider configuration
│   │   ├── knowledge_routes.py     # RAG document ingestion & vector search
│   │   ├── smart_home_routes.py    # IoT & Home Assistant endpoints
│   │   ├── system_routes.py        # Hardware telemetry & OS controls
│   │   └── voice_routes.py         # Edge-TTS voice generation & audio
│   ├── assistant/                  # Proactive notifications & recommendations
│   ├── intelligence/               # Sentiment, emotion & cognitive processors
│   ├── knowledge/                  # FAISS vector store & document parsing
│   ├── memory/                     # SQLite persistence & session logs
│   ├── smart_home/                 # Home Assistant, MQTT & simulated IoT
│   ├── system/                     # System resource metrics (CPU, RAM, GPU)
│   ├── tools/                      # Automation tools (PyAutoGUI, shell, search)
│   ├── voice/                      # TTS engine & speech recognition
│   ├── config.py                   # Central backend configuration & provider specs
│   ├── main.py                     # FastAPI application entry & WebSocket manager
│   └── watchdog.py                 # 24/7 background process watchdog
├── src/                            # React 18 + TypeScript Frontend
│   ├── animations/                 # Framer Motion & CSS keyframe presets
│   ├── components/
│   │   ├── 3d/                     # Three.js Arc Reactor & Holographic Core
│   │   ├── agent-town/             # Pixel Agent Town simulation & canvas world
│   │   │   ├── world/              # Canvas renderer, state machines, room layout
│   │   │   └── orchestrator/       # Task squad coordination & multi-hop engine
│   │   ├── common/                 # Reusable glassmorphic UI components
│   │   ├── dashboard/              # Analytics, telemetry panels, quick shortcuts
│   │   └── hud/                    # Iron Man HUD overlay, chat panel, voice settings
│   ├── services/                   # Frontend API clients & WebSocket managers
│   ├── state/                      # Global UI and audio state management
│   ├── styles/                     # Sci-fi typography & CSS design system
│   ├── types/                      # TypeScript definitions & interfaces
│   ├── App.tsx                     # Main layout & view coordinator
│   └── main.tsx                    # React DOM root entry
├── data/                           # Local runtime directory (DBs, vector index, cache)
├── public/                         # Static icons, models, sounds, and assets
├── index.html                      # HTML5 root shell
├── package.json                    # Frontend dependencies & Vite scripts
├── requirements.txt                # Python backend dependencies
├── run.bat                         # Unified one-click startup script (Windows)
├── start_jarvis_24x7.bat           # 24x7 background supervisor launcher
├── stop_jarvis.bat                 # Graceful termination script
├── install_autostart.bat           # Windows startup service registration
└── vite.config.ts                  # Vite build configuration
```

---

## 💻 Prerequisites

Ensure you have the following installed on your host machine:

- **Node.js**: `v18.0.0` or later (LTS recommended)
- **Python**: `3.10` to `3.12`
- **Git**: `2.30+`
- **Modern Browser**: Chrome, Edge, or Brave with WebGL enabled

---

## 🚀 Installation & Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/fahim1ahmed2f2-design/Jarvis-AI.git
cd Jarvis-AI
```

### 2. Backend Setup

Create and activate a Python virtual environment, then install required dependencies:

```bash
# Windows
python -m venv .venv
.\.venv\Scripts\activate

# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Frontend Setup

Install Node.js dependencies:

```bash
npm install
```

### 4. Configure Environment Variables

Copy the example environment template:

```bash
# Windows (cmd)
copy .env.example .env

# Windows (PowerShell) / Linux / macOS
cp .env.example .env
```

Open `.env` and configure your preferences:

```env
# Server Configuration
JARVIS_HOST=127.0.0.1
JARVIS_PORT=8000
JARVIS_DEBUG=false
JARVIS_ENV=production

# Active AI Configuration
ACTIVE_AI_PROVIDER=gemini
ACTIVE_AI_MODEL=gemini-3.5-flash-lite

# API Keys (or enter them directly in the UI Settings modal)
GEMINI_API_KEY=your_gemini_api_key_here
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Voice & Speech Synthesis
JARVIS_TTS_VOICE=en-GB-RyanNeural
JARVIS_TTS_SPEED=1.0

# Automation Safety Mode: STRICT | STANDARD | AUTONOMOUS
JARVIS_SAFETY_MODE=STANDARD
```

> **Note**: You can also add and switch API keys directly inside the application interface via the **Voice & AI Settings Modal** without editing `.env`!

### 5. Launch JARVIS

#### Method A: Unified One-Click Launcher (Windows)

Simply double-click or run:
```bat
run.bat
```
This automatically launches the FastAPI backend server on `http://127.0.0.1:8000` and the Vite React frontend on `http://localhost:5173`.

#### Method B: Manual Startup

**Terminal 1 — Backend:**
```bash
.\.venv\Scripts\activate
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

Open your browser and navigate to **`http://localhost:5173`**.

---

## ⚙️ Configuration Reference

| Environment Variable | Default | Description |
|---|---|---|
| `JARVIS_HOST` | `127.0.0.1` | Host address for FastAPI backend |
| `JARVIS_PORT` | `8000` | Port for the backend API & WebSockets |
| `JARVIS_DEBUG` | `false` | Enable verbose debug logging |
| `ACTIVE_AI_PROVIDER` | `gemini` | Default AI provider (`gemini`, `groq`, `openai`, `claude`, `deepseek`, `local`) |
| `ACTIVE_AI_MODEL` | `gemini-3.5-flash-lite` | Default AI model identifier |
| `JARVIS_TTS_VOICE` | `en-GB-RyanNeural` | Edge-TTS voice profile |
| `JARVIS_TTS_SPEED` | `1.0` | Voice playback speed multiplier |
| `JARVIS_SAFETY_MODE` | `STANDARD` | Automation safety level (`STRICT`, `STANDARD`, `AUTONOMOUS`) |
| `SMART_HOME_PROVIDER`| `virtual` | Smart home driver (`virtual`, `home_assistant`, `mqtt`) |
| `HOME_ASSISTANT_URL` | `""` | Home Assistant API base URL |
| `HOME_ASSISTANT_TOKEN`| `""` | Long-lived Home Assistant access token |

---

## 🔌 API & WebSocket Protocols

JARVIS exposes an asynchronous REST and WebSocket API:

- **Telemetry WebSocket**: `ws://127.0.0.1:8000/ws`
  - Broadcasts CPU, GPU, RAM, active windows, and notifications every 2 seconds.
- **AI Streaming Endpoint**: `POST /api/chat/stream`
  - Server-Sent Events (SSE) for low-latency token streaming.
- **Agent Town Dispatch**: `POST /api/agents/assign`
  - Dispatches tasks to specific agents in the simulation.
- **System Automation**: `POST /api/system/command`
  - Executes approved desktop automation routines.
- **Document Ingestion**: `POST /api/knowledge/ingest`
  - Ingests files into the FAISS vector database.

Interactive Swagger documentation is available at:
👉 **`http://127.0.0.1:8000/docs`**

---

## 🛡️ Automation Safety Modes

To balance capability and safety when executing OS commands:

1. **STRICT**: Requires explicit user confirmation in the HUD before executing shell commands, file modifications, or mouse clicks.
2. **STANDARD** *(Default)*: Automatically executes safe, non-destructive actions (browser searches, audio controls, reading metrics) but prompts for destructive operations.
3. **AUTONOMOUS**: Full hands-free execution mode for unattended tasks.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/FuturisticCapability`).
3. Commit your changes (`git commit -m 'Add futuristic capability'`).
4. Push to the branch (`git push origin feature/FuturisticCapability`).
5. Open a Pull Request.

---

## 📜 License

This project is open-source software licensed under the [MIT License](LICENSE).

---

<div align="center">
  <sub>Engineered with precision for autonomous intelligence and next-generation human-AI symbiosis.</sub>
</div>
