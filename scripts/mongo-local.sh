#!/usr/bin/env bash
# Starts a local mongod via mongodb-memory-server when Docker is not available.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${MONGO_PORT:-27017}"

if ss -ltn 2>/dev/null | grep -q ":${PORT} "; then
  echo "Already listening on :${PORT}"
  exit 0
fi

if ! node -e "require('mongodb-memory-server')" 2>/dev/null; then
  echo "Installing mongodb-memory-server (dev helper)..."
  npm install --no-save mongodb-memory-server
fi

exec node <<NODE
const { MongoMemoryServer } = require("mongodb-memory-server");
const port = Number(process.env.MONGO_PORT || 27017);
(async () => {
  const mongod = await MongoMemoryServer.create({
    instance: { port, dbName: "confeitaria" },
  });
  console.log("Mongo ready:", mongod.getUri());
  setInterval(() => {}, 1 << 30);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
NODE
