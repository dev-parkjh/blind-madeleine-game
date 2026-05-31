@echo off
setlocal

cd /d "%~dp0"

if "%~1"=="/?" goto usage
if "%~1"=="-h" goto usage
if "%~1"=="--help" goto usage

if "%COSYVOICE_BACKEND_URL%"=="" set "COSYVOICE_BACKEND_URL=http://localhost:50000"
if "%COSYVOICE_PROXY_PORT%"=="" set "COSYVOICE_PROXY_PORT=7860"
if "%COSYVOICE_IMAGE%"=="" set "COSYVOICE_IMAGE=blind-madeleine-cosyvoice:dev"

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

if "%COSYVOICE_FORCE_BUILD%"=="1" goto build_image
docker image inspect "%COSYVOICE_IMAGE%" >nul 2>nul
if errorlevel 1 goto build_image
echo [Blind Madeleine] Using existing Docker image: %COSYVOICE_IMAGE%
goto start_backend

:build_image
echo [Blind Madeleine] Building Docker image: %COSYVOICE_IMAGE%
%DOCKER_COMPOSE% -f docker-compose.cosyvoice.yml build
if errorlevel 1 (
  echo.
  echo Failed to build the CosyVoice Docker backend.
  pause
  exit /b 1
)

:start_backend
%DOCKER_COMPOSE% -f docker-compose.cosyvoice.yml up -d
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

echo Python was not found on PATH. Starting the TTS proxy in Docker...
set "DOCKER_PROXY_BACKEND_URL=%COSYVOICE_BACKEND_URL:localhost=host.docker.internal%"
set "DOCKER_PROXY_BACKEND_URL=%DOCKER_PROXY_BACKEND_URL:127.0.0.1=host.docker.internal%"
docker rm -f blind-madeleine-cosyvoice-proxy >nul 2>nul
docker run --rm --name blind-madeleine-cosyvoice-proxy -p "%COSYVOICE_PROXY_PORT%:%COSYVOICE_PROXY_PORT%" -v "%CD%:/workspace" "%COSYVOICE_IMAGE%" python /workspace/tools/cosyvoice_tts_proxy.py --host 0.0.0.0 --cosyvoice-url "%DOCKER_PROXY_BACKEND_URL%" --port %COSYVOICE_PROXY_PORT% --project-root /workspace
goto proxy_done

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
echo   COSYVOICE_IMAGE=blind-madeleine-cosyvoice:dev
echo   COSYVOICE_FORCE_BUILD=1
exit /b 0
