#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COLIMA_PROFILE="${COLIMA_PROFILE:-cashback-dev}"

log() {
  printf '\n[%s] %s\n' "local-dev" "$1"
}

fail() {
  printf '\n[%s] %s\n' "local-dev" "$1" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

cd "$ROOT_DIR"

require_cmd pnpm
require_cmd docker

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose -f docker/docker-compose.yml)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose -f docker/docker-compose.yml)
else
  fail "Docker Compose is not installed"
fi

if command -v colima >/dev/null 2>&1; then
  log "Ensuring Colima profile '$COLIMA_PROFILE' is running"

  if ! colima list 2>/dev/null | awk 'NR>1 {print $1, $2}' | grep -q "^${COLIMA_PROFILE} Running$"; then
    colima start --profile "$COLIMA_PROFILE"
  fi

  if [[ "$COLIMA_PROFILE" == "default" ]]; then
    DOCKER_CONTEXT_NAME="colima"
  else
    DOCKER_CONTEXT_NAME="colima-$COLIMA_PROFILE"
  fi

  docker context use "$DOCKER_CONTEXT_NAME" >/dev/null 2>&1 || true
fi

if [[ ! -f .env ]]; then
  log "Creating .env from .env.example"
  cp .env.example .env
fi

set -a
source ./.env
if [[ -f ./.env.development ]]; then
  source ./.env.development
fi
set +a

log "Starting local infrastructure"
"${COMPOSE_CMD[@]}" up -d

POSTGRES_CONTAINER_ID="$("${COMPOSE_CMD[@]}" ps -q postgres)"
if [[ -z "$POSTGRES_CONTAINER_ID" ]]; then
  fail "Postgres container was not created"
fi

log "Waiting for Postgres to become healthy"
until [[ "$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$POSTGRES_CONTAINER_ID" 2>/dev/null)" == "healthy" ]]; do
  sleep 2
done

log "Generating Prisma client"
pnpm db:generate

log "Applying Prisma migrations"
pnpm --filter @cashback/database migrate:deploy

log "Seeding base data"
pnpm db:seed

log "Seeding exchange data"
pnpm db:seed:exchange

log "Starting local dev servers"
exec pnpm dev
