@echo off
chcp 65001 >nul 2>&1
set PYTHONIOENCODING=utf-8
set "PATH=C:\Program Files\nodejs;%PATH%"
title English App

echo ==================================================
echo    English App  -  Demarrage
echo ==================================================

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"
set "VENV=%BACKEND%\.venv_win"
set "PY=%VENV%\Scripts\python.exe"

:: ─── Backend Python ─────────────────────────────────────────
echo.
echo [1/3] Backend Python...

cd /d "%BACKEND%"

if not exist "%PY%" (
    echo   - Creation de l'environnement virtuel Windows...
    python -m venv "%VENV%"
    echo   - Installation des dependances Python...
    "%VENV%\Scripts\pip.exe" install -r requirements.txt --quiet
)

echo   [OK] Backend pret

:: ─── Frontend npm ───────────────────────────────────────────
echo.
echo [2/3] Frontend React...

cd /d "%FRONTEND%"

if not exist "node_modules" (
    echo   - Installation des packages npm...
    call npm install
)

echo   [OK] Frontend pret

:: ─── Lancement ──────────────────────────────────────────────
echo.
echo [3/3] Lancement des serveurs...
echo   Backend  : http://localhost:9000
echo   Frontend : http://localhost:5173
echo.
echo   Fermez cette fenetre pour tout arreter.
echo.

:: Lance le backend en arriere-plan
cd /d "%BACKEND%"
start "English App - Backend" /min cmd /c "set PYTHONIOENCODING=utf-8 && "%PY%" -m uvicorn main:app --reload --port 9000"

:: Attend 4s que le backend demarre
timeout /t 4 /nobreak >nul

:: Ouvre le navigateur
start "" http://localhost:5173

:: Lance le frontend (bloquant - garde la fenetre ouverte)
cd /d "%FRONTEND%"
call npm run dev

:: Quand on ferme, on tue le backend
echo.
echo Arret du backend...
taskkill /fi "WINDOWTITLE eq English App - Backend" /f >nul 2>&1
echo Serveurs arretes.
pause
