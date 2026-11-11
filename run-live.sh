#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p data logs

export HOST="${HOST:-127.0.0.1}"
export PORT="${PORT:-8765}"

echo "Python: $(python3 --version 2>&1)"

if ! python3 - <<'PY'
import server
print("server import ok")
PY
then
  echo "server.py failed to import. Fix the error above first."
  exit 1
fi

if [ -f logs/server.pid ]; then
  old="$(cat logs/server.pid || true)"
  if [ -n "${old}" ]; then
    kill "${old}" 2>/dev/null || true
  fi
fi
pkill -f "python3 server.py" 2>/dev/null || true
sleep 0.4

: > logs/server.log
nohup python3 server.py >> logs/server.log 2>&1 &
echo $! > logs/server.pid
sleep 0.8

if ! kill -0 "$(cat logs/server.pid)" 2>/dev/null; then
  echo "Process died. Log:"
  cat logs/server.log
  exit 1
fi

if curl -fsS "http://${HOST}:${PORT}/api/site" >/dev/null; then
  echo "TransitChains is running on ${HOST}:${PORT} (pid $(cat logs/server.pid))"
else
  echo "Process is up but API did not respond. Log:"
  cat logs/server.log
  exit 1
fi
