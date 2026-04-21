"""
routes/audio.py — Génération et service audio TTS
===================================================
GET  /api/audio/{lesson_id}/status  → vérifie si l'audio existe déjà
POST /api/audio/{lesson_id}/generate → génère l'audio d'une leçon via edge-tts
GET  /audio/{filename}              → servi directement par StaticFiles dans main.py

Voix utilisée : en-GB-SoniaNeural (voix britannique naturelle, parfaite pour B2/C1)
Alternative américaine : en-US-JennyNeural
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
import os
import json
import asyncio

router = APIRouter()

AUDIO_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "audio")
LESSONS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "lessons")

# Voix edge-tts — choisir selon la préférence :
# Britannique : en-GB-SoniaNeural, en-GB-RyanNeural
# Américain   : en-US-JennyNeural, en-US-GuyNeural
TTS_VOICE = "en-GB-SoniaNeural"
TTS_RATE = "+0%"    # Vitesse normale — peut être ajustée par l'utilisateur
TTS_PITCH = "+0Hz"


def _get_lesson_text(lesson_id: str) -> str:
    """
    Extrait tout le texte anglais d'une leçon pour la synthèse vocale.
    Concatène tous les paragraphes en anglais avec des pauses naturelles.
    """
    lesson_path = os.path.join(LESSONS_DIR, f"lesson_{lesson_id}.json")
    if not os.path.exists(lesson_path):
        raise FileNotFoundError(f"Lesson {lesson_id} not found")

    with open(lesson_path, "r", encoding="utf-8") as f:
        lesson = json.load(f)

    paragraphs = lesson.get("content", {}).get("paragraphs", [])
    text_parts = []

    for para in paragraphs:
        en_text = para.get("en", "")
        # Pour les dialogues, on préfixe avec le nom du locuteur
        if "speaker" in para:
            speaker = para.get("speaker", "")
            en_text = f"{speaker}: {en_text}"
        text_parts.append(en_text)

    # Joint les paragraphes avec une double espace pour créer des pauses naturelles
    full_text = "  ".join(text_parts)
    return full_text


async def _generate_audio_file(lesson_id: str, voice: str = TTS_VOICE, rate: str = TTS_RATE):
    """
    Génère le fichier MP3 pour une leçon via edge-tts.
    Cette fonction tourne en arrière-plan (BackgroundTask).
    """
    try:
        import edge_tts
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="edge-tts n'est pas installé. Lancez : pip install edge-tts"
        )

    output_path = os.path.join(AUDIO_DIR, f"lesson_{lesson_id}.mp3")

    try:
        text = _get_lesson_text(lesson_id)
        communicate = edge_tts.Communicate(text, voice, rate=rate)
        await communicate.save(output_path)
        print(f"[OK] Audio genere : lesson_{lesson_id}.mp3")
    except Exception as e:
        print(f"[ERR] Erreur generation audio lecon {lesson_id}: {e}")
        raise


@router.get("/{lesson_id}/status")
async def get_audio_status(lesson_id: str):
    """
    Vérifie si le fichier audio d'une leçon a déjà été généré.
    Le frontend utilise cela pour savoir s'il peut proposer la lecture audio.
    """
    audio_path = os.path.join(AUDIO_DIR, f"lesson_{lesson_id}.mp3")
    exists = os.path.exists(audio_path)

    return {
        "lesson_id": lesson_id,
        "audio_available": exists,
        "audio_url": f"/audio/lesson_{lesson_id}.mp3" if exists else None
    }


@router.post("/{lesson_id}/generate")
async def generate_audio(
    lesson_id: str,
    background_tasks: BackgroundTasks,
    voice: str = TTS_VOICE,
    rate: str = TTS_RATE
):
    """
    Lance la génération audio en arrière-plan.
    Retourne immédiatement — le frontend peut polling le status.
    """
    audio_path = os.path.join(AUDIO_DIR, f"lesson_{lesson_id}.mp3")

    # Si déjà généré, on retourne directement l'URL
    if os.path.exists(audio_path):
        return {
            "status": "already_exists",
            "audio_url": f"/audio/lesson_{lesson_id}.mp3"
        }

    # Lance la génération en arrière-plan
    background_tasks.add_task(_generate_audio_file, lesson_id, voice, rate)

    return {
        "status": "generating",
        "message": f"Génération audio en cours pour la leçon {lesson_id}. Vérifiez le status dans quelques secondes."
    }


@router.get("/voices")
async def get_available_voices():
    """Retourne les voix recommandées pour l'app."""
    return {
        "recommended": [
            {"id": "en-GB-SoniaNeural", "label": "Sonia (British, Female) — Recommended", "accent": "British"},
            {"id": "en-GB-RyanNeural", "label": "Ryan (British, Male)", "accent": "British"},
            {"id": "en-US-JennyNeural", "label": "Jenny (American, Female)", "accent": "American"},
            {"id": "en-US-GuyNeural", "label": "Guy (American, Male)", "accent": "American"},
            {"id": "en-AU-NatashaNeural", "label": "Natasha (Australian, Female)", "accent": "Australian"},
        ]
    }
