#!/usr/bin/env bash
set -euo pipefail

CMD=${1:-}
BACKUP_BASE="/mnt/backup_drive/av-rentals/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TARGET_DIR="$BACKUP_BASE/backup_${TIMESTAMP}"

# Ensure backup base exists
mkdir -p "$BACKUP_BASE"

log() { echo "[backup-helper] $*"; }
err() { echo "[backup-helper][error] $*" >&2; }

rotate_backups() {
  # Keep the latest 3 backup_* directories, delete older
  shopt -s nullglob
  mapfile -t DIRS < <(ls -1dt "$BACKUP_BASE"/backup_* 2>/dev/null || true)
  if (( ${#DIRS[@]} > 3 )); then
    for ((i=3; i<${#DIRS[@]}; i++)); do
      log "Removing old backup: ${DIRS[$i]}"
      rm -rf "${DIRS[$i]}" || true
    done
  fi
}

create_backup() {
  log "Starting backup to $TARGET_DIR"
  mkdir -p "$TARGET_DIR"

  # If DATABASE_URL is not set, try to construct it from Docker secrets
  : "${DATABASE_URL:=}"
  if [[ -z "$DATABASE_URL" ]]; then
    if [[ -f "/run/secrets/db_user" && -f "/run/secrets/db_password" && -f "/run/secrets/db_name" ]]; then
      log "Secrets detected in /run/secrets. Attempting to build DATABASE_URL..."
      local S_USER S_PASS S_NAME
      S_USER=$(cat /run/secrets/db_user || true)
      S_PASS=$(cat /run/secrets/db_password || true)
      S_NAME=$(cat /run/secrets/db_name || true)
      log "secret lengths user=${#S_USER} pass=${#S_PASS} name=${#S_NAME}"
      if [[ -n "$S_USER" && -n "$S_PASS" && -n "$S_NAME" ]]; then
        export DATABASE_URL="postgresql://${S_USER}:${S_PASS}@postgres:5432/${S_NAME}"
        log "DATABASE_URL constructed from secrets."
      fi
    fi
  fi

  # Database dump using DATABASE_URL if available; otherwise try discrete vars
  : "${DATABASE_URL:=}"
  if [[ -n "$DATABASE_URL" ]]; then
    log "Dumping database via DATABASE_URL"
    # Strip any query parameters (e.g., ?schema=public) which pg_dump/libpq may reject
    local DUMP_URL="$DATABASE_URL"
    DUMP_URL="${DUMP_URL%%\?*}"
    log "Using connection URL (redacted) for pg_dump"
    pg_dump --no-owner --no-privileges --file "$TARGET_DIR/db.sql" "$DUMP_URL"
  else
    : "${POSTGRES_USER:=}"
    : "${POSTGRES_PASSWORD:=}"
    : "${POSTGRES_DB:=}"
    : "${POSTGRES_HOST:=localhost}"
    : "${POSTGRES_PORT:=5432}"
    if [[ -z "$POSTGRES_USER" || -z "$POSTGRES_DB" ]]; then
      err "No DATABASE_URL and insufficient discrete Postgres env vars"
      exit 1
    fi
    export PGPASSWORD="$POSTGRES_PASSWORD"
    log "Dumping database via discrete variables"
    pg_dump --no-owner --no-privileges -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$TARGET_DIR/db.sql"
    unset PGPASSWORD
  fi

  # Optional: include some app assets (uncompressed, no encryption)
  if [[ -d "/app/public" ]]; then
    mkdir -p "$TARGET_DIR/public"
    cp -a /app/public "$TARGET_DIR/public/.." || true
  fi

  # Write metadata
  {
    echo "timestamp=$TIMESTAMP"
    echo "host=$(hostname)"
    echo "app=av-rentals"
    echo "type=uncompressed"
  } > "$TARGET_DIR/backup.meta"

  # Rotate to keep only last 3
  rotate_backups

  log "Backup completed: $TARGET_DIR"
}

case "$CMD" in
  create)
    create_backup
    ;;
  rotate)
    rotate_backups
    ;;
  *)
    echo "Usage: $0 {create|rotate}" >&2
    exit 2
    ;;
 esac
