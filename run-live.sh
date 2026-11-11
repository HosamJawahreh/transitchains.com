#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p data logs
export HOST="${HOST:-127.0.0.1}"
export PORT="${PORT:-8765}"
nohup python3 server.py >> logs/server.log 2>&1 &
echo $! > logs/server.pid
echo "TransitChains started on ${HOST}:${PORT} (pid $(cat logs/server.pid))"
echo "Check: curl -I http://127.0.0.1:${PORT}/api/site"
