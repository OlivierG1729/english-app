"""
routes/lessons.py — Endpoints pour les leçons
===============================================
GET /api/lessons/curriculum       → liste de toutes les unités et leçons
GET /api/lessons/{lesson_id}      → contenu complet d'une leçon
"""

from fastapi import APIRouter, HTTPException
import json
import os

router = APIRouter()

# Chemin vers les données
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
LESSONS_DIR = os.path.join(DATA_DIR, "lessons")
CURRICULUM_PATH = os.path.join(DATA_DIR, "curriculum.json")


@router.get("/curriculum")
async def get_curriculum():
    """
    Retourne le curriculum complet (toutes les unités + métadonnées des leçons).
    Le frontend utilise cela pour afficher la page d'accueil.
    """
    if not os.path.exists(CURRICULUM_PATH):
        raise HTTPException(status_code=404, detail="Curriculum file not found")

    with open(CURRICULUM_PATH, "r", encoding="utf-8") as f:
        curriculum = json.load(f)

    return curriculum


@router.get("/{lesson_id}")
async def get_lesson(lesson_id: str):
    """
    Retourne le contenu complet d'une leçon par son ID (ex: "01", "02", "09").
    Cherche le fichier lesson_{lesson_id}.json dans le dossier data/lessons/.
    """
    lesson_path = os.path.join(LESSONS_DIR, f"lesson_{lesson_id}.json")

    if not os.path.exists(lesson_path):
        raise HTTPException(
            status_code=404,
            detail=f"Lesson '{lesson_id}' not found. File expected at: lesson_{lesson_id}.json"
        )

    with open(lesson_path, "r", encoding="utf-8") as f:
        lesson = json.load(f)

    return lesson


@router.get("/")
async def list_available_lessons():
    """
    Retourne la liste des IDs de leçons disponibles (fichiers JSON présents).
    """
    if not os.path.exists(LESSONS_DIR):
        return {"available": []}

    available = []
    for filename in os.listdir(LESSONS_DIR):
        if filename.startswith("lesson_") and filename.endswith(".json"):
            lesson_id = filename.replace("lesson_", "").replace(".json", "")
            available.append(lesson_id)

    return {"available": sorted(available)}
