@echo off
setlocal

set "SCRIPT_DIR=%~dp0"

where py >nul 2>nul
if %ERRORLEVEL% equ 0 (
  py -3 "%SCRIPT_DIR%serve_web_build.py" %*
  exit /b %ERRORLEVEL%
)

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
  python "%SCRIPT_DIR%serve_web_build.py" %*
  exit /b %ERRORLEVEL%
)

where python3 >nul 2>nul
if %ERRORLEVEL% equ 0 (
  python3 "%SCRIPT_DIR%serve_web_build.py" %*
  exit /b %ERRORLEVEL%
)

echo Python 3 is required to serve the Web build.
exit /b 1
