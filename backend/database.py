"""
database.py — SQLite setup via SQLAlchemy
=========================================
Tables :
  - user_progress : progression par leçon (étape atteinte, exercices)
  - lesson_scores : résultats des exercices par leçon
"""

from sqlalchemy import create_engine, Column, String, Integer, Float, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# ─── Connexion SQLite ─────────────────────────────────────────
# Le fichier .db est créé dans le répertoire du backend
DB_PATH = os.path.join(os.path.dirname(__file__), "english_app.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ─── Modèles ──────────────────────────────────────────────────

class UserProgress(Base):
    """
    Stocke la progression de l'utilisateur pour chaque leçon.
    completed_step : 0=non commencé, 1=lecture, 2=langue, 3=écoute, 4=oral, 5=exercices (terminé)
    """
    __tablename__ = "user_progress"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(String, unique=True, index=True)   # ex: "01", "02"
    completed_step = Column(Integer, default=0)            # étape atteinte (0-5)
    is_completed = Column(Boolean, default=False)          # leçon entièrement terminée
    score_written = Column(Float, nullable=True)           # score exercices écrits (0-100)
    score_oral = Column(Integer, nullable=True)            # nb exercices oraux complétés
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)                    # notes personnelles de l'utilisateur


class ExerciseAttempt(Base):
    """
    Enregistre chaque tentative d'exercice écrit.
    """
    __tablename__ = "exercise_attempts"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(String, index=True)
    exercise_id = Column(String)                           # ex: "w1", "w2"
    exercise_type = Column(String)                         # multiple_choice, fill_blank, translation
    is_correct = Column(Boolean, nullable=True)
    user_answer = Column(Text, nullable=True)
    attempted_at = Column(DateTime, default=datetime.utcnow)


# ─── Init ────────────────────────────────────────────────────

def init_db():
    """Crée toutes les tables si elles n'existent pas encore."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Générateur de session DB pour les dépendances FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
