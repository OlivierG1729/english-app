#!/usr/bin/env bash
# =============================================================
# start.sh — Lance l'application English B2→C1
# =============================================================
# Usage (depuis le dossier english_app/) :
#   bash start.sh
#
# Ce script :
#   1. Active le venv Python ou en crée un si nécessaire
#   2. Installe les dépendances Python (requirements.txt)
#   3. Installe les dépendances npm si node_modules absent
#   4. Lance le backend FastAPI sur le port 8000
#   5. Lance le frontend Vite sur le port 5173
#
# Prérequis : Python ≥ 3.11, Node.js ≥ 18, npm
# =============================================================

set -e  # Arrête le script à la première erreur

BACKEND_DIR="$(pwd)/backend"
FRONTEND_DIR="$(pwd)/frontend"
VENV_DIR="$BACKEND_DIR/.venv"

# ─── Couleurs terminal ──────────────────────────────────────
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   📘  English B2 → C1  |  Démarrage              ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# ─── Backend Python ─────────────────────────────────────────
echo -e "\n${YELLOW}[1/3] Backend Python...${NC}"

cd "$BACKEND_DIR"

# Crée le venv si absent
if [ ! -d "$VENV_DIR" ]; then
  echo "  → Création de l'environnement virtuel..."
  python3 -m venv .venv
fi

# Active le venv
source .venv/bin/activate

# Installe les dépendances
pip install -r requirements.txt --quiet

echo -e "${GREEN}  ✓ Backend prêt${NC}"

# ─── Frontend npm ───────────────────────────────────────────
echo -e "\n${YELLOW}[2/3] Frontend React...${NC}"

cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
  echo "  → Installation des packages npm..."
  npm install --silent
fi

echo -e "${GREEN}  ✓ Frontend prêt${NC}"

# ─── Lancement ──────────────────────────────────────────────
echo -e "\n${YELLOW}[3/3] Lancement des serveurs...${NC}"
echo -e "  Backend  → ${GREEN}http://localhost:9000${NC}"
echo -e "  Frontend → ${GREEN}http://localhost:5173${NC}"
echo -e "\n${BLUE}  Ctrl+C pour tout arrêter${NC}\n"

# Lance le backend en arrière-plan
cd "$BACKEND_DIR"
source .venv/bin/activate
uvicorn main:app --reload --port 9000 &
BACKEND_PID=$!

# Lance le frontend en avant-plan (pour voir les logs)
cd "$FRONTEND_DIR"
npm run dev

# Quand npm run dev s'arrête (Ctrl+C), on tue aussi le backend
kill $BACKEND_PID 2>/dev/null || true
echo -e "\n${YELLOW}Serveurs arrêtés.${NC}"
