#!/bin/sh
set -e

# Read database credentials from secrets
DB_USER=$(cat /run/secrets/db_user)
DB_PASSWORD=$(cat /run/secrets/db_password)
DB_NAME=$(cat /run/secrets/db_name)

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until PGPASSWORD=$DB_PASSWORD psql -h "postgres" -U "$DB_USER" -d "$DB_NAME" -c '\q' >/dev/null 2>&1; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "Creating default admin user if not exists..."
PGPASSWORD=$DB_PASSWORD psql -h postgres -U "$DB_USER" -d "$DB_NAME" <<-EOSQL
  INSERT INTO "User" (id, name, username, password, role, "isActive", "createdAt", "updatedAt")
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Admin User',
    'admin',
    '\$2b\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: 'password'
    'Admin',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (username) DO NOTHING;
EOSQL

echo "Database initialization complete!"
# Default password: 'password' (bcrypt hashed)
