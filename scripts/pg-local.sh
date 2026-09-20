#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
DATA_DIR="$ROOT/.pgdata"
PORT="${PG_PORT:-5433}"
USER_NAME="${PG_USER:-confeitaria}"
DB_NAME="${PG_DATABASE:-confeitaria}"

if [[ ! -x "$PG_BIN/pg_ctl" ]]; then
  echo "PostgreSQL binaries not found at $PG_BIN"
  exit 1
fi

start() {
  if [[ ! -d "$DATA_DIR" ]]; then
    "$PG_BIN/initdb" -D "$DATA_DIR" -U "$USER_NAME" --auth-local=trust --auth-host=trust
  fi

  if "$PG_BIN/pg_ctl" -D "$DATA_DIR" status >/dev/null 2>&1; then
    echo "Postgres already running on port $PORT"
  else
    "$PG_BIN/pg_ctl" -D "$DATA_DIR" -l "$DATA_DIR/logfile" -o "-p $PORT -k '$DATA_DIR'" start
  fi

  "$PG_BIN/pg_isready" -h 127.0.0.1 -p "$PORT" >/dev/null
  if ! "$PG_BIN/psql" -h 127.0.0.1 -p "$PORT" -U "$USER_NAME" -d "$DB_NAME" -c 'SELECT 1' >/dev/null 2>&1; then
    "$PG_BIN/createdb" -h 127.0.0.1 -p "$PORT" -U "$USER_NAME" "$DB_NAME" || true
  fi

  echo "Ready on 127.0.0.1:$PORT (user/db: $USER_NAME)"
  echo "DATABASE_URL should use port $PORT — see .env.example"
}

stop() {
  if [[ -d "$DATA_DIR" ]]; then
    "$PG_BIN/pg_ctl" -D "$DATA_DIR" stop -m fast || true
  fi
}

case "${1:-start}" in
  start) start ;;
  stop) stop ;;
  *)
    echo "Usage: $0 {start|stop}"
    exit 1
    ;;
esac
