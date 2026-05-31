@echo off
setlocal

cd /d "%~dp0"

if "%~1"=="/?" goto usage
if "%~1"=="-h" goto usage
if "%~1"=="--help" goto usage

echo [Blind Madeleine] Stopping CosyVoice Docker backend...
docker rm -f blind-madeleine-cosyvoice-proxy >nul 2>nul

docker compose version >nul 2>nul
if errorlevel 1 (
  docker-compose version >nul 2>nul
  if errorlevel 1 (
    echo.
    echo Docker Compose was not found.
    pause
    exit /b 1
  )
  set "DOCKER_COMPOSE=docker-compose"
) else (
  set "DOCKER_COMPOSE=docker compose"
)

%DOCKER_COMPOSE% -f docker-compose.cosyvoice.yml down
if errorlevel 1 (
  echo.
  echo Failed to stop the CosyVoice Docker backend.
  pause
  exit /b 1
)

echo.
echo CosyVoice Docker backend stopped. Model cache volumes were kept.
pause
exit /b 0

:usage
echo Stops the CosyVoice Docker backend started by run_cosyvoice_local.bat.
echo Model cache volumes are kept.
echo.
echo Usage:
echo   stop_cosyvoice_local.bat
exit /b 0
