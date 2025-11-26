#!/usr/bin/env sh
set -e

# Optional: run Prisma migrations if DATABASE_URL is provided
case "$PRISMA_MIGRATIONS" in
  skip)
    echo "[entrypoint] PRISMA_MIGRATIONS=skip => not running migrations"
    ;;
  *)
    if [ -n "$DATABASE_URL" ]; then
      echo "[entrypoint] Running Prisma migrations (deploy)..."
      npx prisma migrate deploy
    else
      echo "[entrypoint] DATABASE_URL not set, skipping Prisma migrations"
    fi
    ;;
esac

# Execute the provided command (from CMD)
exec "$@"
