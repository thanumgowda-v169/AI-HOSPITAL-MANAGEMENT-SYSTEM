@echo off
echo ==============================================================================
echo Launching CODE RED - SUSTAINIQ Full-Stack Application
echo ==============================================================================
start "CODE RED Backend (FastAPI)" cmd /c "%~dp0start-backend.bat"
start "CODE RED Frontend (React)" cmd /c "%~dp0start-frontend.bat"
echo.
echo Backend running on: http://127.0.0.1:8000 (API Docs: http://127.0.0.1:8000/docs)
echo Frontend running on: http://localhost:3000
echo.
pause
