#!/usr/bin/env bash
set -euo pipefail

# Simple Docker redeploy for AV Rentals
# - Detects docker compose vs docker-compose
# - Pulls base images, builds app, brings stack up
# - Runs Prisma migrate deploy, and if P3005 (baseline) occurs, baselines first migration then retries
# Usage:
#   bash scripts/docker-redeploy.sh [--baseline MIGRATION_FOLDER]
# Examples:
#   bash scripts/docker-redeploy.sh
#   bash scripts/docker-redeploy.sh --baseline 20251110233929_init_postgres

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Colors
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info(){ echo -e "${GREEN}[deploy]${NC} $*"; }
warn(){ echo -e "${YELLOW}[warn]${NC} $*"; }
err(){ echo -e "${RED}[error]${NC} $*"; }

# Parse args
BASELINE_MIGRATION=""
if [[ "${1:-}" == "--baseline" && -n "${2:-}" ]]; then
  BASELINE_MIGRATION="$2"
fi

# Compose alias
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  err "Neither 'docker compose' nor 'docker-compose' found. Install Docker Compose."
  exit 1
fi

# Pull infra images (optional)
info "Pulling base images (postgres, nginx, certbot, duckdns)..."
"${COMPOSE[@]}" pull postgres nginx certbot duckdns || true

# Build app image
info "Building app image..."
"${COMPOSE[@]}" build app

# Bring stack up
info "Starting stack..."
"${COMPOSE[@]}" up -d

# Run migrate deploy
run_migrate(){
  info "Applying Prisma migrations..."
  set +e
  OUT=$("${COMPOSE[@]}" exec -T app npx prisma migrate deploy 2>&1)
  CODE=$?
  set -e
  echo "$OUT"
  return $CODE
}

if ! run_migrate; then
  if echo "$OUT" | grep -q "P3005"; then
    warn "Prisma P3005: database schema not empty (baseline required)."
    if [[ -z "$BASELINE_MIGRATION" ]]; then
      # Try to auto-detect the first migration folder
      FIRST_MIG=$(ls -1 prisma/migrations | sort | head -n1 || true)
      if [[ -n "$FIRST_MIG" ]]; then
        BASELINE_MIGRATION="$FIRST_MIG"
        warn "Auto-detected baseline migration: $BASELINE_MIGRATION"
      else
        err "Could not detect migrations folder. Provide --baseline <folder>."
        exit 1
      fi
    fi
    info "Baselining migration: $BASELINE_MIGRATION"
    "${COMPOSE[@]}" exec -T app npx prisma migrate resolve --applied "$BASELINE_MIGRATION"
    run_migrate
  else
    err "Migration failed. See output above."
    exit 1
  fi
fi

info "Stack status:"
"${COMPOSE[@]}" ps
info "Redeploy complete."
