#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=== Starting Veritas / DEKHTE HAIN AI Services ==="

# Locate Python environment with PyTorch and dependencies
PY_BIN=""
if [ -x "$DIR/.venv/bin/python3" ]; then
    PY_BIN="$DIR/.venv/bin/python3"
elif [ -x "$DIR/.venv/bin/python" ]; then
    PY_BIN="$DIR/.venv/bin/python"
elif [ -x "/home/makintosh/anaconda3/bin/python" ]; then
    PY_BIN="/home/makintosh/anaconda3/bin/python"
elif command -v python3 >/dev/null 2>&1; then
    PY_BIN="$(command -v python3)"
else
    echo "ERROR: No suitable Python binary found." >&2
    exit 1
fi

echo "[Backend] Using Python binary: $PY_BIN"

# Check if Python ResNet-50 backend is running
if ss -tulpn 2>/dev/null | grep -q ':5000\b' || lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[Backend] Port 5000 is already in use (ResNet-50 backend is running)."
else
    echo "[Backend] Launching ResNet-50 Flask backend on port 5000..."
    "$PY_BIN" "$DIR/backend/app.py" > /tmp/backend.log 2>&1 &
    echo "[Backend] Started in background (logs at /tmp/backend.log)."
fi

# Wait briefly for backend to initialize
sleep 2

# Check if Node server is running
if ss -tulpn 2>/dev/null | grep -q ':3000\b' || lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[Frontend/API] Port 3000 is already in use."
else
    echo "[Frontend/API] Launching Express + Vite server on http://localhost:3000..."
    node "$DIR/server.js"
fi
