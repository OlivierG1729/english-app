"""
English Learning App — FastAPI Backend
========================================
Sert :
  - les leçons (JSON statiques)
  - le curriculum (liste des leçons)
  - la progression de l'utilisateur (SQLite)
  - la génération/service des fichiers audio TTS

Port : 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import init_db
from routes.lessons import router as lessons_router
from routes.progress import router as progress_router
from routes.audio import router as audio_router
from routes.translate import router as translate_router

# ─── Application ──────────────────────────────────────────────
app = FastAPI(
    title="English Learning App API",
    description="Backend for B2→C1 English learning application",
    version="1.0.0"
)

# ─── CORS ─────────────────────────────────────────────────────
# Autorise les requêtes depuis le frontend React (port 5173 par défaut Vite)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Fichiers audio statiques ──────────────────────────────────
# Les MP3 générés par edge-tts sont servis directement depuis /audio/
AUDIO_DIR = os.path.join(os.path.dirname(__file__), "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)
app.mount("/audio", StaticFiles(directory=AUDIO_DIR), name="audio")

# ─── Routes ───────────────────────────────────────────────────
app.include_router(lessons_router, prefix="/api/lessons", tags=["Lessons"])
app.include_router(progress_router, prefix="/api/progress", tags=["Progress"])
app.include_router(audio_router, prefix="/api/audio", tags=["Audio"])
app.include_router(translate_router, prefix="/api/translate", tags=["Translate"])

# ─── Startup ──────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Initialise la base de données SQLite au démarrage."""
    init_db()
    print("[OK] Database initialized")
    print("[OK] English Learning App backend running on http://localhost:9000")

@app.get("/")
async def root():
    return {"status": "running", "app": "English Learning App", "version": "1.0.0"}
