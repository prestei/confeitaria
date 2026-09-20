#!/usr/bin/env bash
# Ensures Mongo is up, then starts Next.js.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${MONGO_PORT:-27017}"

if ! ss -ltn 2>/dev/null | grep -q ":${PORT} "; then
  echo "MongoDB not on :${PORT} — starting local mongod..."
  bash scripts/mongo-local.sh &
  MONGO_PID=$!
  for _ in $(seq 1 60); do
    if ss -ltn 2>/dev/null | grep -q ":${PORT} "; then
      echo "Mongo ready on :${PORT}"
      break
    fi
    # If mongod crashed immediately, stop waiting
    if ! kill -0 "$MONGO_PID" 2>/dev/null; then
      break
    fi
    sleep 0.25
  done
  if ! ss -ltn 2>/dev/null | grep -q ":${PORT} "; then
    echo "WARN: Mongo did not become ready. Login/API will fail until it is up." >&2
    echo "       Last mongod log: /tmp/confeitaria-mongod.log" >&2
    echo "       Try: pkill -9 -f 'mongod.*mongo-run'; npm run db:mongo-local" >&2
  fi
fi

exec npx next dev "$@"
