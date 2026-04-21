#!/usr/bin/env python3
"""
generate_audio.py — Pré-génère les fichiers MP3 pour toutes les leçons disponibles
====================================================================================
À lancer UNE SEULE FOIS (ou quand une nouvelle leçon est ajoutée) depuis le dossier backend/ :

    python generate_audio.py

Nécessite edge-tts et une connexion internet.
Les fichiers MP3 sont stockés dans backend/audio/

Options :
    --voice  : nom de la voix edge-tts (défaut: en-GB-SoniaNeural)
    --rate   : vitesse de lecture (défaut: +0%)  ex: -10% pour plus lent
    --lesson : générer uniquement une leçon spécifique (ex: --lesson 01)
"""

import asyncio
import os
import json
import argparse
import edge_tts

LESSONS_DIR = os.path.join(os.path.dirname(__file__), "data", "lessons")
AUDIO_DIR   = os.path.join(os.path.dirname(__file__), "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

DEFAULT_VOICE = "en-GB-SoniaNeural"
DEFAULT_RATE  = "+0%"


def get_lesson_text(lesson_path: str) -> tuple[str, str]:
    """
    Retourne (lesson_id, full_text) depuis un fichier JSON de leçon.
    Concatène tous les paragraphes anglais avec une pause entre chaque.
    """
    with open(lesson_path, "r", encoding="utf-8") as f:
        lesson = json.load(f)

    lesson_id = lesson.get("id", "??")
    paragraphs = lesson.get("content", {}).get("paragraphs", [])
    parts = []

    for para in paragraphs:
        en = para.get("en", "")
        if "speaker" in para:
            speaker = para.get("speaker", "")
            en = f"{speaker}: {en}"
        parts.append(en)

    # Double espace = légère pause naturelle entre paragraphes
    full_text = "  ".join(parts)
    return lesson_id, full_text


async def generate_one(lesson_id: str, text: str, voice: str, rate: str, force: bool = False):
    """Génère le MP3 pour une leçon."""
    output = os.path.join(AUDIO_DIR, f"lesson_{lesson_id}.mp3")

    if os.path.exists(output) and not force:
        print(f"  ⏭  Leçon {lesson_id} : déjà générée ({output})")
        return

    print(f"  🎙  Leçon {lesson_id} : génération en cours...")
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    await communicate.save(output)
    size_kb = os.path.getsize(output) // 1024
    print(f"  ✅ Leçon {lesson_id} : {output} ({size_kb} KB)")


async def main(args):
    voice = args.voice
    rate  = args.rate
    force = args.force

    print(f"\n🎤 Voix : {voice}  |  Vitesse : {rate}")
    print(f"📁 Dossier audio : {AUDIO_DIR}\n")

    # Récupère les fichiers à traiter
    if args.lesson:
        filenames = [f"lesson_{args.lesson}.json"]
    else:
        filenames = sorted([f for f in os.listdir(LESSONS_DIR) if f.endswith(".json")])

    if not filenames:
        print("❌ Aucun fichier de leçon trouvé dans", LESSONS_DIR)
        return

    tasks = []
    for filename in filenames:
        path = os.path.join(LESSONS_DIR, filename)
        if not os.path.exists(path):
            print(f"  ⚠️  Fichier introuvable : {filename}")
            continue
        lesson_id, text = get_lesson_text(path)
        tasks.append(generate_one(lesson_id, text, voice, rate, force))

    # Génération séquentielle pour éviter de surcharger l'API TTS
    for task in tasks:
        await task

    print(f"\n✨ Terminé ! {len(tasks)} leçon(s) traitée(s).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Générateur audio pour English Learning App")
    parser.add_argument("--voice",  default=DEFAULT_VOICE, help="Voix edge-tts")
    parser.add_argument("--rate",   default=DEFAULT_RATE,  help="Vitesse (ex: -10%% pour plus lent)")
    parser.add_argument("--lesson", default=None,          help="Générer uniquement une leçon (ex: 01)")
    parser.add_argument("--force",  action="store_true",   help="Régénérer même si le fichier existe")
    args = parser.parse_args()

    asyncio.run(main(args))
