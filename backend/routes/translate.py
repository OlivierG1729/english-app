"""
routes/translate.py — Traduction de mots individuels
=====================================================
GET /api/translate?word=<mot>  → traduction FR via MyMemory API (gratuit, sans clé)

Cache mémoire pour éviter les appels répétés au sein d'une même session serveur.
"""

from fastapi import APIRouter, HTTPException, Query
import urllib.request
import urllib.parse
import json
import re

router = APIRouter()

# Cache mémoire : { "hello": "bonjour", ... }
_cache: dict[str, str] = {}


def _clean_word(word: str) -> str:
    """Nettoie un mot : minuscule, retire la ponctuation en début/fin."""
    return re.sub(r'^[^a-zA-Z\']+|[^a-zA-Z\']+$', '', word).lower()


async def _translate_mymemory(word: str) -> str:
    """Appelle l'API MyMemory pour traduire un mot EN→FR."""
    encoded = urllib.parse.quote(word)
    url = f"https://api.mymemory.translated.net/get?q={encoded}&langpair=en|fr"

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "EnglishLearningApp/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        translation = data.get("responseData", {}).get("translatedText", "")

        if not translation or translation.upper() == word.upper():
            # Fallback : parfois MyMemory retourne le mot tel quel
            return ""

        return translation.lower()

    except Exception as e:
        print(f"[WARN] Erreur traduction MyMemory pour '{word}': {e}")
        return ""


@router.get("")
async def translate_word(word: str = Query(..., min_length=1, max_length=100)):
    """
    Traduit un mot anglais en français.
    Utilise un cache mémoire pour les mots déjà traduits.
    """
    cleaned = _clean_word(word)
    if len(cleaned) < 2:
        raise HTTPException(status_code=400, detail="Mot trop court")

    # Vérifie le cache
    if cleaned in _cache:
        return {"word": cleaned, "translation": _cache[cleaned]}

    # Appelle MyMemory
    translation = await _translate_mymemory(cleaned)

    if not translation:
        raise HTTPException(status_code=404, detail=f"Traduction introuvable pour '{cleaned}'")

    # Met en cache
    _cache[cleaned] = translation

    return {"word": cleaned, "translation": translation}
