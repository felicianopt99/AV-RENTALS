#!/bin/bash
set -e

# Create a temporary file to hold the SQL commands
cat > /tmp/init.sql <<EOL
-- Create the database user if it doesn't exist
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'avrentals_user') THEN
    CREATE USER avrentals_user WITH PASSWORD 'CHANGE_ME_STRONG_PASSWORD';
  END IF;
END \$\$;

-- Create the database if it doesn't exist
SELECT 'CREATE DATABASE avrentals_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'avrentals_db')\gexec

-- Connect to the database and set up permissions
\c avrentals_db

-- Grant all privileges to the user
GRANT ALL PRIVILEGES ON DATABASE avrentals_db TO avrentals_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO avrentals_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO avrentals_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO avrentals_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO avrentals_user;

-- Make sure the user has permissions to create tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO avrentals_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO avrentals_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON FUNCTIONS TO avrentals_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TYPES TO avrentals_user;
EOL

echo "SQL script generated at /tmp/init.sql"
echo "To apply these changes, run:"
echo "docker cp /tmp/init.sql av-postgres:/tmp/init.sql"
echo "docker exec -it av-postgres psql -U postgres -f /tmp/init.sql"
