# 📘 English B2 → C1 — Application d'apprentissage

Application complète d'apprentissage de l'anglais pour passer d'un niveau B2 à C1 confirmé.

---

## Architecture

```
english_app/
├── backend/                        Python FastAPI
│   ├── main.py                     Point d'entrée, CORS, serve audio statique
│   ├── database.py                 SQLite (progression, exercices)
│   ├── routes/
│   │   ├── lessons.py              GET curriculum, GET leçon
│   │   ├── progress.py             CRUD progression utilisateur
│   │   └── audio.py                TTS edge-tts, statut, génération
│   ├── data/
│   │   ├── curriculum.json         Métadonnées des 40 leçons
│   │   └── lessons/
│   │       ├── lesson_01.json      ✅ The Digital Detox (B2, story)
│   │       ├── lesson_02.json      ✅ The Perfect Candidate (B2, dialogue)
│   │       ├── lesson_09.json      ✅ The Algorithm and the Muse (C1, story)
│   │       └── ...                 Ajouter de nouvelles leçons ici
│   ├── audio/                      MP3 générés par edge-tts (créé automatiquement)
│   ├── generate_audio.py           Script de pré-génération des MP3
│   └── requirements.txt
│
├── frontend/                       React 18 + TypeScript + Vite
│   └── src/
│       ├── App.tsx                 Router (Home / Lesson)
│       ├── index.css               Thème dark académique (CSS variables)
│       ├── types/index.ts          Toutes les interfaces TypeScript
│       ├── api/client.ts           Appels HTTP vers le backend
│       ├── hooks/useRecorder.ts    Enregistrement micro (MediaRecorder API)
│       ├── pages/
│       │   ├── Home.tsx            Dashboard : unités + leçons + stats
│       │   └── Lesson.tsx          Page leçon : orchestre les 5 étapes
│       └── components/lesson/
│           ├── StepNav.tsx         Barre de navigation des 5 étapes
│           ├── ReadingStep.tsx     Étape 1 : Texte EN + traduction FR toggle
│           ├── LanguageStep.tsx    Étape 2 : Vocab / Grammaire / Expressions (onglets)
│           ├── ListenStep.tsx      Étape 3 : Lecteur audio TTS + vitesse
│           ├── SpeakStep.tsx       Étape 4 : Lecture à voix haute + enregistrement
│           └── ExercisesStep.tsx   Étape 5 : QCM + lacunes + traduction + score
│
└── start.sh                        Lance backend + frontend en une commande
```

---

## Installation et démarrage

### Méthode rapide (recommandée)
```bash
# Depuis le dossier english_app/
bash start.sh
```
Le script crée automatiquement le venv Python, installe toutes les dépendances, et lance les deux serveurs.

### Méthode manuelle
```bash
# Terminal 1 — Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows WSL : source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

Puis ouvrir : **http://localhost:5173**

---

## Génération des fichiers audio

Les fichiers MP3 sont générés via **edge-tts** (voix Microsoft, gratuite, très naturelle).
Nécessite internet lors de la génération uniquement. Ensuite, tout est local.

```bash
cd backend
source .venv/bin/activate

# Générer toutes les leçons disponibles
python generate_audio.py

# Générer une leçon spécifique
python generate_audio.py --lesson 01

# Choisir la voix et la vitesse
python generate_audio.py --voice en-US-JennyNeural --rate -10%

# Régénérer même si le fichier existe déjà
python generate_audio.py --force
```

### Voix disponibles
| ID | Description |
|----|-------------|
| `en-GB-SoniaNeural` | Sonia, britannique, féminine (recommandée) |
| `en-GB-RyanNeural`  | Ryan, britannique, masculin |
| `en-US-JennyNeural` | Jenny, américaine, féminine |
| `en-US-GuyNeural`   | Guy, américain, masculin |
| `en-AU-NatashaNeural` | Natasha, australienne |

---

## Structure d'une leçon JSON

Chaque leçon est un fichier `lesson_XX.json` dans `backend/data/lessons/`. Voici les champs :

```json
{
  "id": "03",
  "unit": 1,
  "unit_title": "Modern Life & Society",
  "title": "Titre de la leçon",
  "level": "B2",              // B2 | B2+ | C1 | C1+
  "type": "story",            // story | dialogue
  "theme": "Thème",
  "reading_time": "5 min",
  "content": {
    "paragraphs": [
      { "en": "...", "fr": "..." },              // story
      { "speaker": "Alice", "en": "...", "fr": "..." }  // dialogue
    ],
    "vocabulary":     [ ... ],   // 8-12 items
    "grammar_points": [ ... ],   // 2-3 points
    "expressions":    [ ... ]    // 4-6 expressions
  },
  "exercises": {
    "written": [ ... ],   // 6-8 exercices (mcq, fill_blank, translation)
    "oral":    [ ... ]    // 2-3 exercices (read_aloud, answer_question)
  }
}
```

Pour ajouter une leçon : créer le JSON + mettre `"available": true` dans `curriculum.json`.

---

## Curriculum — 40 leçons

| Unité | Niveau | Titre | Leçons |
|-------|--------|-------|--------|
| 1 | B2    | Modern Life & Society          | 01–08 |
| 2 | B2+   | Culture, Arts & Media           | 09–16 |
| 3 | C1    | Complex Issues & Nuanced Debates | 17–24 |
| 4 | C1    | Advanced Discourse              | 25–32 |
| 5 | C1+   | C1 Mastery & Consolidation      | 33–40 |

---

## Technologies utilisées

| Composant | Technologie | Gratuit | Local |
|-----------|-------------|---------|-------|
| Backend   | FastAPI + Python | ✅ | ✅ |
| Base de données | SQLite | ✅ | ✅ |
| TTS (synthèse vocale) | edge-tts (Microsoft) | ✅ | après génération |
| Enregistrement voix | MediaRecorder API (navigateur) | ✅ | ✅ |
| Frontend | React 18 + TypeScript + Vite | ✅ | ✅ |

Aucune donnée utilisateur ne quitte la machine. L'audio TTS utilise l'API Microsoft lors de la **génération uniquement** (texte de la leçon, non sensible).

---

## Ports utilisés

- Backend FastAPI : **8000**
- Frontend Vite   : **5173**

Si conflit avec d'autres projets (Vidocq sur 8080, Finance Tracker sur 8000), modifier dans `backend/main.py` et `frontend/vite.config.ts`.
