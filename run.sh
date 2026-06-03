#!/usr/bin/env bash
#
# run.sh — start everything needed to run Polyshouk locally.
#
# Brings up a PostgreSQL container (via Docker), syncs + seeds the schema,
# then starts the Next.js dev server. Safe to re-run; reuses existing state.
#
set -euo pipefail

cd "$(dirname "$0")"

# --- config -----------------------------------------------------------------
DB_CONTAINER="polyshouk-db"
DB_IMAGE="postgres:16"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_NAME="polyshouk"
DB_PORT="5432"

# Pull DATABASE_URL from .env if present, else fall back to the default above.
if [ -f .env ] && grep -q '^DATABASE_URL=' .env; then
  export $(grep '^DATABASE_URL=' .env | sed 's/"//g')
fi
: "${DATABASE_URL:=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}}"

log() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }

# --- 1. ensure Docker is running --------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed. Install Docker Desktop and re-run." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  log "Docker daemon not running — starting Docker Desktop..."
  open -a Docker
  for _ in $(seq 1 90); do
    if docker info >/dev/null 2>&1; then break; fi
    sleep 2
  done
  if ! docker info >/dev/null 2>&1; then
    echo "Docker did not start within timeout." >&2
    exit 1
  fi
fi
log "Docker is running."

# --- 2. ensure the Postgres container is up ---------------------------------
if docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER"; then
  log "Postgres container already running."
elif docker ps -a --format '{{.Names}}' | grep -qx "$DB_CONTAINER"; then
  log "Starting existing Postgres container..."
  docker start "$DB_CONTAINER" >/dev/null
else
  log "Creating Postgres container..."
  docker run -d \
    --name "$DB_CONTAINER" \
    -e POSTGRES_USER="$DB_USER" \
    -e POSTGRES_PASSWORD="$DB_PASSWORD" \
    -e POSTGRES_DB="$DB_NAME" \
    -p "${DB_PORT}:5432" \
    "$DB_IMAGE" >/dev/null
fi

# --- 3. wait for Postgres to accept connections -----------------------------
log "Waiting for Postgres to be ready..."
for _ in $(seq 1 60); do
  if docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
if ! docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
  echo "Postgres did not become ready within timeout." >&2
  exit 1
fi
log "Postgres is ready."

# --- 4. install deps (only if missing) --------------------------------------
if [ ! -d node_modules ]; then
  log "Installing npm dependencies..."
  npm install
fi

# --- 5. generate client, sync schema, seed ----------------------------------
log "Generating Prisma client..."
npx prisma generate >/dev/null

log "Syncing database schema..."
npx prisma db push

log "Seeding database..."
npm run db:seed

# --- 6. start the app -------------------------------------------------------
log "Starting Next.js dev server on http://localhost:3000"
npm run dev
