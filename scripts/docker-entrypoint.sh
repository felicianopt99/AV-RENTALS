#!/bin/sh
set -eu

# Read secrets
if [ -f /run/secrets/db_user ]; then DB_USER=$(cat /run/secrets/db_user); fi
if [ -f /run/secrets/db_password ]; then DB_PASSWORD=$(cat /run/secrets/db_password); fi
if [ -f /run/secrets/db_name ]; then DB_NAME=$(cat /run/secrets/db_name); fi
if [ -f /run/secrets/jwt_secret ]; then export JWT_SECRET="$(cat /run/secrets/jwt_secret)"; fi
if [ -f /run/secrets/deepl_api_key ]; then export DEEPL_API_KEY="$(cat /run/secrets/deepl_api_key)"; fi

# Construct DATABASE_URL if not provided
if [ -z "${DATABASE_URL:-}" ] && [ -n "${DB_USER:-}" ] && [ -n "${DB_PASSWORD:-}" ] && [ -n "${DB_NAME:-}" ]; then
  export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}?schema=public"
fi

# Run Prisma migrations in production mode with retries
if [ "${PRISMA_MIGRATIONS:-}" = "deploy" ]; then
  echo "Running prisma migrate deploy with retries..."
  ATTEMPTS=0
  until npx prisma migrate deploy; do
    ATTEMPTS=$((ATTEMPTS+1))
    if [ $ATTEMPTS -ge 20 ]; then
      echo "Prisma migrate deploy failed after $ATTEMPTS attempts."
      exit 1
    fi
    echo "Database not ready yet. Retrying in 3s... (attempt $ATTEMPTS)"
    sleep 3
  done
fi

# Start the app
if [ -f ./start-prod.sh ]; then
  exec ./start-prod.sh
else
  exec npm run start
fi
