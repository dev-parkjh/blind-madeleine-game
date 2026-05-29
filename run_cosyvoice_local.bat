@echo off
setlocal

cd /d "%~dp0"

if "%~1"=="/?" goto usage
if "%~1"=="-h" goto usage
if "%~1"=="--help" goto usage

if "%COSYVOICE_BACKEND_URL%"=="" set "COSYVOICE_BACKEND_URL=http://localhost:50000"
if "%COSYVOICE_PROXY_PORT%"=="" set "COSYVOICE_PROXY_PORT=7860"

echo [Blind Madeleine] Starting CosyVoice backend with Docker...
docker compose version >nul 2>nul
if errorlevel 1 (
  docker-compose version >nul 2>nul
  if errorlevel 1 (
    echo.
    echo Docker Compose was not found. Install Docker Desktop, then try again.
    pause
    exit /b 1
  )
  set "DOCKER_COMPOSE=docker-compose"
) else (
  set "DOCKER_COMPOSE=docker compose"
)

%DOCKER_COMPOSE% -f docker-compose.cosyvoice.yml up --build -d
if errorlevel 1 (
  echo.
  echo Failed to start the CosyVoice Docker backend.
  pause
  exit /b 1
)

echo.
echo [Blind Madeleine] Starting local TTS proxy...
echo Backend: %COSYVOICE_BACKEND_URL%
echo Editor URL: http://localhost:%COSYVOICE_PROXY_PORT%/tts
echo.
echo Keep this window open while generating voices.
echo Press Ctrl+C to stop the proxy. Run stop_cosyvoice_local.bat to stop Docker.
echo.

python --version >nul 2>nul
if not errorlevel 1 (
  python tools\cosyvoice_tts_proxy.py --cosyvoice-url "%COSYVOICE_BACKEND_URL%" --port %COSYVOICE_PROXY_PORT%
  goto proxy_done
)

py -3 --version >nul 2>nul
if not errorlevel 1 (
  py -3 tools\cosyvoice_tts_proxy.py --cosyvoice-url "%COSYVOICE_BACKEND_URL%" --port %COSYVOICE_PROXY_PORT%
  goto proxy_done
)

echo Python was not found. Install Python 3 or add it to PATH, then try again.
pause
exit /b 1

:proxy_done
echo.
echo CosyVoice proxy stopped.
pause
exit /b 0

:usage
echo Starts the CosyVoice Docker backend and local TTS proxy.
echo.
echo Usage:
echo   run_cosyvoice_local.bat
echo.
echo Optional environment variables:
echo   COSYVOICE_BACKEND_URL=http://localhost:50000
echo   COSYVOICE_PROXY_PORT=7860
echo   COSYVOICE_MODEL_DIR=iic/CosyVoice-300M-SFT
exit /b 0
