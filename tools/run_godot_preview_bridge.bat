@echo off
setlocal

cd /d "%~dp0\.."

if "%~1"=="/?" goto usage
if "%~1"=="-h" goto usage
if "%~1"=="--help" goto usage

if "%GODOT_PREVIEW_PORT%"=="" set "GODOT_PREVIEW_PORT=51234"
if not "%~1"=="" if "%GODOT_BIN%"=="" set "GODOT_BIN=%~1"

echo [Blind Madeleine] Starting Godot preview bridge...
echo Endpoint: http://127.0.0.1:%GODOT_PREVIEW_PORT%
if not "%GODOT_BIN%"=="" echo Godot: %GODOT_BIN%
echo.
echo Keep this window open while using "Godot preview" in the dialogue editor.
echo Press Ctrl+C to stop the bridge.
echo.

set "PYTHON_CMD="
set "PYTHON_ARGS="

python -c "import sys" >nul 2>nul
if not errorlevel 1 (
  set "PYTHON_CMD=python"
  goto run_bridge
)

py -3 -c "import sys" >nul 2>nul
if not errorlevel 1 (
  set "PYTHON_CMD=py"
  set "PYTHON_ARGS=-3"
  goto run_bridge
)

if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe" (
  set "PYTHON_CMD=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
  goto run_bridge
)

echo Python was not found on PATH.
echo Install Python, then run this file again.
echo.
echo If Godot is not on PATH, pass its executable path:
echo   tools\run_godot_preview_bridge.bat "C:\path\to\Godot.exe"
pause
exit /b 1

:run_bridge
if "%GODOT_BIN%"=="" (
  "%PYTHON_CMD%" %PYTHON_ARGS% tools\godot_preview_bridge.py --port %GODOT_PREVIEW_PORT%
) else (
  "%PYTHON_CMD%" %PYTHON_ARGS% tools\godot_preview_bridge.py --port %GODOT_PREVIEW_PORT% --godot "%GODOT_BIN%"
)
goto bridge_done

:bridge_done
echo.
echo Godot preview bridge stopped.
pause
exit /b 0

:usage
echo Starts the local bridge used by tools\dialogue_editor.html to launch Godot previews.
echo.
echo Usage:
echo   tools\run_godot_preview_bridge.bat
echo   tools\run_godot_preview_bridge.bat "C:\path\to\Godot.exe"
echo.
echo Optional environment variables:
echo   GODOT_PREVIEW_PORT=51234
echo   GODOT_BIN=C:\path\to\Godot.exe
exit /b 0
