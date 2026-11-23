
@echo off
setlocal

REM ==========================================
REM DeepTrace - Windows 11 Startup Script
REM ==========================================

REM Get project directory (without trailing slash)
for %%I in ("%~dp0.") do set "PROJECT_DIR=%%~fI"

cd /d "%PROJECT_DIR%"

echo.
echo ==========================================
echo    DEEPTRACE / EFFICIENTNET-B3 STARTUP
echo ==========================================
echo.

REM ==========================================
REM 1. CHECK PYTHON VIRTUAL ENVIRONMENT
REM ==========================================

set "PY_BIN=%PROJECT_DIR%\.venv\Scripts\python.exe"

if not exist "%PY_BIN%" (
    echo [ERROR] Python virtual environment not found!
    echo Expected: %PY_BIN%
    echo.
    echo Create it using:
    echo python -m venv .venv
    pause
    exit /b 1
)

echo [Backend] Virtual environment found.

REM Check required Python dependencies
echo [Backend] Checking Python dependencies...

"%PY_BIN%" -c "import torch, torchvision, flask, flask_cors" >nul 2>&1

if errorlevel 1 (
    echo [ERROR] Some Python dependencies are missing.
    echo.
    echo Run:
    echo .venv\Scripts\python.exe -m pip install torch torchvision flask flask-cors
    pause
    exit /b 1
)

echo [Backend] Python dependencies verified.

REM ==========================================
REM 2. CHECK BACKEND FILE
REM ==========================================

if not exist "%PROJECT_DIR%\backend\app.py" (
    echo [ERROR] backend\app.py not found!
    pause
    exit /b 1
)

REM ==========================================
REM 3. START FLASK BACKEND
REM ==========================================

echo.
echo [Backend] Checking port 5000...

powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"

if errorlevel 1 (
    echo [Backend] Starting EfficientNet-B3 Flask server...

    start "DeepTrace Backend" /D "%PROJECT_DIR%" cmd /k ""%PY_BIN%" backend\app.py"

    echo [Backend] Startup command executed.
) else (
    echo [Backend] Port 5000 is already occupied.
)

REM Give backend time to initialize
timeout /t 3 /nobreak >nul

REM ==========================================
REM 4. CHECK NODE.JS
REM ==========================================

echo.
echo [Frontend] Checking Node.js...

where node >nul 2>&1

if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

echo [Frontend] Node.js found.
node --version

REM Check frontend server file
if not exist "%PROJECT_DIR%\backend\server.js" (
    echo [ERROR] backend\server.js not found!
    pause
    exit /b 1
)

REM ==========================================
REM 5. START EXPRESS + VITE SERVER
REM ==========================================

echo.
echo [Frontend] Checking port 3000...

powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"

if errorlevel 1 (
    echo [Frontend] Starting Express + Vite server...

    start "DeepTrace Frontend" /D "%PROJECT_DIR%" cmd /k "node backend\server.js"

    echo [Frontend] Startup command executed.
) else (
    echo [Frontend] Port 3000 is already occupied.
)

REM ==========================================
REM 6. COMPLETION
REM ==========================================

echo.
echo ==========================================
echo       DEEPTRACE STARTUP INITIATED
echo ==========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Check the separate terminal windows
echo for startup messages and errors.
echo ==========================================
echo.

pause
