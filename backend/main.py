"""
English Learning App — FastAPI Backend
========================================
Sert les lecons, le curriculum, la progression, l'audio TTS et la traduction.
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
    description="Backend for English learning application (A1 to C1)",
    version="1.0.0"
)

# ─── CORS ─────────────────────────────────────────────────────
# En production, autorise le frontend Vercel et toute origine
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Fichiers audio statiques ──────────────────────────────────
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
    init_db()
    port = os.getenv("PORT", "9000")
    print(f"[OK] Database initialized")
    print(f"[OK] English Learning App backend running on port {port}")

@app.get("/")
async def root():
    return {"status": "running", "app": "English Learning App", "version": "1.0.0"}
