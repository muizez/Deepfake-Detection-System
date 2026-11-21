#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "=== Starting Veritas / DEKHTE HAIN AI Services ==="

# Check if Python ResNet-50 backend is running
if ss -tulpn 2>/dev/null | grep -q ':5000\b' || lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "[Backend] Port 5000 is already in use (ResNet-50 backend is running)."
else
    echo "[Backend] Launching ResNet-50 Flask backend on port 5000..."
    "$DIR/.venv/bin/python3" "$DIR/backend/app.py" > /tmp/backend.log 2>&1 &
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
