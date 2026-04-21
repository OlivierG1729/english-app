"""
routes/progress.py — Gestion de la progression utilisateur
============================================================
GET  /api/progress/             → progression sur toutes les leçons
GET  /api/progress/{lesson_id}  → progression sur une leçon
POST /api/progress/{lesson_id}  → mettre à jour la progression
POST /api/progress/{lesson_id}/exercise → enregistrer une tentative d'exercice
GET  /api/progress/stats        → statistiques globales
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from database import get_db, UserProgress, ExerciseAttempt

router = APIRouter()


# ─── Schémas Pydantic (validation des données entrantes) ──────

class ProgressUpdate(BaseModel):
    completed_step: int          # 0 à 5
    is_completed: Optional[bool] = False
    score_written: Optional[float] = None
    score_oral: Optional[int] = None
    notes: Optional[str] = None


class ExerciseAttemptCreate(BaseModel):
    exercise_id: str             # ex: "w1", "w2"
    exercise_type: str           # "multiple_choice", "fill_blank", "translation"
    is_correct: Optional[bool] = None
    user_answer: Optional[str] = None


# ─── Routes ───────────────────────────────────────────────────

@router.get("/stats")
async def get_global_stats(db: Session = Depends(get_db)):
    """Retourne des statistiques globales de progression."""
    all_progress = db.query(UserProgress).all()
    completed = [p for p in all_progress if p.is_completed]
    in_progress = [p for p in all_progress if not p.is_completed and p.completed_step > 0]

    avg_score = None
    scores = [p.score_written for p in completed if p.score_written is not None]
    if scores:
        avg_score = round(sum(scores) / len(scores), 1)

    return {
        "total_started": len(all_progress),
        "total_completed": len(completed),
        "in_progress": len(in_progress),
        "average_score": avg_score,
        "completed_lesson_ids": [p.lesson_id for p in completed]
    }


@router.get("/")
async def get_all_progress(db: Session = Depends(get_db)):
    """Retourne la progression sur toutes les leçons commencées."""
    all_progress = db.query(UserProgress).all()
    return [
        {
            "lesson_id": p.lesson_id,
            "completed_step": p.completed_step,
            "is_completed": p.is_completed,
            "score_written": p.score_written,
            "score_oral": p.score_oral,
            "started_at": p.started_at,
            "completed_at": p.completed_at
        }
        for p in all_progress
    ]


@router.get("/{lesson_id}")
async def get_lesson_progress(lesson_id: str, db: Session = Depends(get_db)):
    """Retourne la progression pour une leçon spécifique."""
    progress = db.query(UserProgress).filter(UserProgress.lesson_id == lesson_id).first()

    if not progress:
        # Retourne un état "non commencé" si aucune donnée n'existe encore
        return {
            "lesson_id": lesson_id,
            "completed_step": 0,
            "is_completed": False,
            "score_written": None,
            "score_oral": None
        }

    return {
        "lesson_id": progress.lesson_id,
        "completed_step": progress.completed_step,
        "is_completed": progress.is_completed,
        "score_written": progress.score_written,
        "score_oral": progress.score_oral,
        "started_at": progress.started_at,
        "completed_at": progress.completed_at,
        "notes": progress.notes
    }


@router.post("/{lesson_id}")
async def update_progress(lesson_id: str, update: ProgressUpdate, db: Session = Depends(get_db)):
    """
    Met à jour ou crée la progression pour une leçon.
    Appelé chaque fois que l'utilisateur franchit une nouvelle étape.
    """
    progress = db.query(UserProgress).filter(UserProgress.lesson_id == lesson_id).first()

    if not progress:
        # Première fois que l'utilisateur ouvre cette leçon
        progress = UserProgress(lesson_id=lesson_id)
        db.add(progress)

    # On ne rétrograde jamais l'étape (on garde toujours la plus avancée)
    if update.completed_step > progress.completed_step:
        progress.completed_step = update.completed_step

    if update.is_completed and not progress.is_completed:
        progress.is_completed = True
        progress.completed_at = datetime.utcnow()

    if update.score_written is not None:
        progress.score_written = update.score_written

    if update.score_oral is not None:
        progress.score_oral = update.score_oral

    if update.notes is not None:
        progress.notes = update.notes

    db.commit()
    db.refresh(progress)

    return {"status": "updated", "lesson_id": lesson_id, "completed_step": progress.completed_step}


@router.post("/{lesson_id}/exercise")
async def record_exercise_attempt(
    lesson_id: str,
    attempt: ExerciseAttemptCreate,
    db: Session = Depends(get_db)
):
    """Enregistre une tentative d'exercice écrit."""
    new_attempt = ExerciseAttempt(
        lesson_id=lesson_id,
        exercise_id=attempt.exercise_id,
        exercise_type=attempt.exercise_type,
        is_correct=attempt.is_correct,
        user_answer=attempt.user_answer
    )
    db.add(new_attempt)
    db.commit()

    return {"status": "recorded", "exercise_id": attempt.exercise_id}


@router.delete("/{lesson_id}/reset")
async def reset_lesson_progress(lesson_id: str, db: Session = Depends(get_db)):
    """Remet à zéro la progression d'une leçon (pour recommencer)."""
    progress = db.query(UserProgress).filter(UserProgress.lesson_id == lesson_id).first()
    if progress:
        db.delete(progress)
        db.commit()
    return {"status": "reset", "lesson_id": lesson_id}
