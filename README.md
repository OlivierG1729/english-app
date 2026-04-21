# English App — Application d'apprentissage de l'anglais

Application complète d'apprentissage de l'anglais, du niveau **A1 (debutant)** au niveau **C1 (avance)**.

**64 lecons** reparties en 2 parcours :
- **A1 Beginner** — 24 lecons pour partir de zero (3 unites)
- **B2 → C1 Advanced** — 40 lecons pour atteindre un niveau avance (5 unites)

---

## Fonctionnalites

- 5 etapes par lecon : Lecture, Points de langue, Ecoute audio, Expression orale, Exercices
- Clic sur un mot pour obtenir sa traduction instantanee
- Audio TTS (voix britannique naturelle) genere automatiquement
- Theme elegant (pastel) / sombre avec toggle
- Responsive : PC, tablette, smartphone
- Toutes les explications en francais

---

## Architecture

```
english_app/
├── backend/                        Python FastAPI (port 9000)
│   ├── main.py                     Point d'entree, CORS, audio statique
│   ├── database.py                 SQLite (progression, exercices)
│   ├── routes/
│   │   ├── lessons.py              GET curriculum, GET lecon
│   │   ├── progress.py             CRUD progression utilisateur
│   │   ├── audio.py                TTS edge-tts, generation
│   │   └── translate.py            Traduction de mots (MyMemory API)
│   ├── data/
│   │   ├── curriculum.json         2 niveaux (A1 + B2-C1), 8 unites, 64 lecons
│   │   └── lessons/
│   │       ├── lesson_a1_01.json   A1 - Hello! My Name Is...
│   │       ├── lesson_a1_24.json   A1 - A Letter to a Pen Pal
│   │       ├── lesson_01.json      B2 - The Digital Detox
│   │       └── lesson_40.json      C1+ - A World in Crisis
│   ├── audio/                      MP3 generes (cree automatiquement)
│   └── requirements.txt
│
├── frontend/                       React 18 + TypeScript + Vite (port 5173)
│   └── src/
│       ├── App.tsx                 Router + state niveau/theme
│       ├── index.css               Themes elegant + sombre (CSS variables)
│       ├── pages/
│       │   ├── Home.tsx            Dashboard : onglets A1/B2-C1, unites, stats
│       │   └── Lesson.tsx          Page lecon : orchestre les 5 etapes
│       └── components/lesson/
│           ├── ReadingStep.tsx      Texte EN + traduction FR + clic-to-translate
│           ├── LanguageStep.tsx     Vocab / Grammaire / Expressions
│           ├── ListenStep.tsx       Lecteur audio TTS
│           ├── SpeakStep.tsx        Lecture a voix haute + enregistrement
│           └── ExercisesStep.tsx    QCM + lacunes + traduction + score
│
├── start.bat                       Lancement Windows (double-clic)
└── start.sh                        Lancement Linux/Mac
```

---

## Installation et demarrage

### Windows (double-clic)
Double-cliquez sur **`start.bat`**. Le script cree le venv Python, installe les dependances, et lance les serveurs.

### Linux / Mac
```bash
bash start.sh
```

### Methode manuelle
```bash
# Terminal 1 — Backend
cd backend
python -m venv .venv_win          # ou python3 -m venv .venv
.venv_win/Scripts/activate        # ou source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 9000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

Puis ouvrir : **http://localhost:5173**

---

## Curriculum — 64 lecons

### A1 Beginner (24 lecons)

| Unite | Titre | Lecons |
|-------|-------|--------|
| 1 | First Steps | a1_01 – a1_08 |
| 2 | Everyday Life | a1_09 – a1_16 |
| 3 | Getting Confident | a1_17 – a1_24 |

### B2 → C1 Advanced (40 lecons)

| Unite | Niveau | Titre | Lecons |
|-------|--------|-------|--------|
| 1 | B2    | Modern Life & Society          | 01 – 08 |
| 2 | B2+   | Culture, Arts & Media           | 09 – 16 |
| 3 | C1    | Complex Issues & Nuanced Debates | 17 – 24 |
| 4 | C1    | Advanced Discourse              | 25 – 32 |
| 5 | C1+   | C1 Mastery & Consolidation      | 33 – 40 |

---

## Technologies

| Composant | Technologie |
|-----------|-------------|
| Backend   | FastAPI + Python |
| Base de donnees | SQLite |
| TTS | edge-tts (Microsoft, gratuit) |
| Traduction | MyMemory API (gratuit) |
| Frontend | React 18 + TypeScript + Vite |

---

## Ports

- Backend FastAPI : **9000**
- Frontend Vite   : **5173**
