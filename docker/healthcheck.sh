#!/bin/sh
set -e

# Initialize PostgreSQL on first run.
# supervisord's postgres program waits for PG_VERSION before starting, so
# once initdb writes PG_VERSION the managed postgres will start automatically.
if [ ! -f /var/lib/postgresql/data/PG_VERSION ]; then
  echo "Initializing PostgreSQL database..."
  su postgres -c "initdb -D /var/lib/postgresql/data --username=postgres"
  echo "PostgreSQL data directory initialized."
fi

# Wait for the supervisord-managed postgres to become ready (TCP + socket)
echo "Waiting for PostgreSQL to be ready..."
until su postgres -c "pg_isready -h localhost -p 5432" 2>/dev/null; do
  echo "PostgreSQL not ready yet, retrying in 2s..."
  sleep 2
done
echo "PostgreSQL is ready."

# Create application user and database if they don't exist (idempotent)
su postgres -c "psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='gruenbilanz'\" | grep -q 1 \
  || psql -c \"CREATE USER gruenbilanz WITH PASSWORD 'gruenbilanz';\""
su postgres -c "psql -tc \"SELECT 1 FROM pg_database WHERE datname='gruenbilanz'\" | grep -q 1 \
  || psql -c \"CREATE DATABASE gruenbilanz OWNER gruenbilanz;\""

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
