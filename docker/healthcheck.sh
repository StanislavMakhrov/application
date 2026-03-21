#!/bin/sh
set -e

# Initialize PostgreSQL on first run
if [ ! -f /var/lib/postgresql/data/PG_VERSION ]; then
  echo "Initializing PostgreSQL database..."
  su postgres -c "initdb -D /var/lib/postgresql/data --username=postgres"

  # Start postgres temporarily for setup
  su postgres -c "pg_ctl start -D /var/lib/postgresql/data -l /var/log/postgres-init.log -o '-k /run/postgresql'"
  sleep 3

  # Create application user and database
  su postgres -c "psql -c \"CREATE USER gruenbilanz WITH PASSWORD 'gruenbilanz';\""
  su postgres -c "psql -c \"CREATE DATABASE gruenbilanz OWNER gruenbilanz;\""

  # Run init.sql (minimal, tables come from Prisma migrations)
  su postgres -c "psql -d gruenbilanz -f /docker-entrypoint-initdb.d/init.sql"

  su postgres -c "pg_ctl stop -D /var/lib/postgresql/data"
  echo "PostgreSQL initialized."
fi

# Wait for PostgreSQL to become ready (started by supervisord program:postgres)
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h localhost -p 5432 -U gruenbilanz -d gruenbilanz 2>/dev/null; do
  echo "PostgreSQL not ready yet, retrying in 2s..."
  sleep 2
done
echo "PostgreSQL is ready."

# Run Prisma migrations (idempotent — safe to run on every startup)
cd /app
echo "Running Prisma migrations..."
npx prisma migrate deploy 2>/dev/null || echo "Migration skipped (may already be up to date)"

# Start Next.js server
echo "Starting Next.js server..."
exec node /app/server.js
