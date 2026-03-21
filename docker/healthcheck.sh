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
npx prisma migrate deploy

# Run seed script on first startup (detected by absence of seed marker)
if [ ! -f /var/lib/postgresql/data/.seeded ]; then
  echo "Running database seed (first startup)..."
  npx tsx prisma/seed.ts && touch /var/lib/postgresql/data/.seeded && echo "Seed complete."
else
  echo "Database already seeded, skipping."
fi

# Start Next.js server
echo "Starting Next.js server..."
exec node /app/server.js
