#!/bin/bash
set -e

# Create the database and user
docker exec -i av-postgres psql -U postgres <<-EOSQL
    CREATE USER avrentals WITH PASSWORD 'avrentals_pass';
    CREATE DATABASE avrentals_db;
    GRANT ALL PRIVILEGES ON DATABASE avrentals_db TO avrentals;
    \c avrentals_db;
    GRANT ALL ON SCHEMA public TO avrentals;
EOSQL

echo "Database and user created successfully"
