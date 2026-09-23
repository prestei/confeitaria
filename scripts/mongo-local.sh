#!/usr/bin/env bash
# Starts a local mongod (persistent) when Docker is not available.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${MONGO_PORT:-27017}"
DBPATH="${MONGO_DBPATH:-.data/mongo-run}"
ABS_DBPATH="$(pwd)/${DBPATH}"
LOG="${MONGO_LOG:-/tmp/confeitaria-mongod.log}"

if ss -ltn 2>/dev/null | grep -q ":${PORT} "; then
  echo "Already listening on :${PORT}"
  exit 0
fi

# Orphan mongods (often from sandboxed agent runs) can hold WiredTiger.lock
# without publishing :27017 on the host. Kill only those using this dbpath.
if pgrep -f "mongod.*--dbpath ${ABS_DBPATH}" >/dev/null 2>&1; then
  echo "Stopping orphan mongod for ${DBPATH}..."
  pkill -9 -f "mongod.*--dbpath ${ABS_DBPATH}" 2>/dev/null || true
  sleep 0.5
fi
rm -f "${DBPATH}/mongod.lock" "${DBPATH}/WiredTiger.lock" 2>/dev/null || true

CACHE_DIR="node_modules/.cache/mongodb-memory-server"
MONGOD="$(find "$CACHE_DIR" -maxdepth 1 -type f -name 'mongod-*' 2>/dev/null | head -1 || true)"

if [ -z "${MONGOD}" ] || [ ! -x "${MONGOD}" ]; then
  if ! node -e "require('mongodb-memory-server')" 2>/dev/null; then
    echo "Installing mongodb-memory-server (dev helper)..."
    npm install --no-save mongodb-memory-server
  fi
  echo "Downloading mongod binary (first run)..."
  MONGOD="$(node <<'NODE'
const { MongoMemoryServer } = require("mongodb-memory-server");
(async () => {
  const mongod = await MongoMemoryServer.create({ instance: { port: 0 } });
  const info = mongod.instanceInfo || mongod._instanceInfo || {};
  const bin = info.binary;
  const path = typeof bin === "string" ? bin : bin?.path || bin?.binaryPath || "";
  console.log(path);
  await mongod.stop();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
NODE
)"
  if [ -z "${MONGOD}" ] || [ ! -x "${MONGOD}" ]; then
    MONGOD="$(find "$CACHE_DIR" -maxdepth 1 -type f -name 'mongod-*' 2>/dev/null | head -1 || true)"
  fi
fi

if [ -z "${MONGOD}" ] || [ ! -x "${MONGOD}" ]; then
  echo "Could not find mongod binary. Install Docker and run: npm run db:up" >&2
  exit 1
fi

mkdir -p "$DBPATH"

echo "Mongo starting on :${PORT} (dbpath=${DBPATH})"
# Fork so the process survives when the launching terminal/agent shell exits.
"$MONGOD" --port "$PORT" --dbpath "$ABS_DBPATH" --storageEngine wiredTiger \
  --bind_ip 127.0.0.1 --noauth --fork --logpath "$LOG"
