#!/bin/sh
set -e

PGDATA=/var/lib/postgresql/data

# Initialize PostgreSQL data directory on first run.
# supervisord's 'postgres' program also waits for PG_VERSION before starting,
# so writing PG_VERSION here triggers the managed postgres to start.
if [ ! -f "$PGDATA/PG_VERSION" ]; then
  echo "Initializing PostgreSQL data directory..."
  su postgres -c "initdb -D $PGDATA"
  echo "PostgreSQL data directory initialized."
fi

# Wait for the supervisord-managed postgres process to accept TCP connections.
# Use 'while true; do if ...; then break; fi; sleep 2; done' instead of 'until'
# to avoid busybox ash set-e edge cases with non-zero 'until' conditions.
echo "Waiting for PostgreSQL to accept connections..."
TRIES=0
while true; do
  TRIES=$((TRIES + 1))
  if pg_isready -h localhost -p 5432 -q 2>/dev/null; then
    echo "PostgreSQL is ready (after $TRIES tries)."
    break
  fi
  if [ "$TRIES" -ge 60 ]; then
    echo "ERROR: PostgreSQL did not become ready within 120 s"
    exit 1
  fi
  sleep 2
done

# Create application user/database if they don't exist yet.
# Use -h localhost to connect via TCP (avoids unix-socket path issues).
if ! su postgres -c "psql -h localhost -tAc \"SELECT 1 FROM pg_roles WHERE rolname='gruenbilanz'\"" 2>/dev/null | grep -q 1; then
  echo "Creating database user gruenbilanz..."
  su postgres -c "psql -h localhost -c \"CREATE USER gruenbilanz WITH PASSWORD 'gruenbilanz';\""
fi
if ! su postgres -c "psql -h localhost -tAc \"SELECT 1 FROM pg_database WHERE datname='gruenbilanz'\"" 2>/dev/null | grep -q 1; then
  echo "Creating database gruenbilanz..."
  su postgres -c "psql -h localhost -c \"CREATE DATABASE gruenbilanz OWNER gruenbilanz;\""
fi

# Run Prisma migrations (idempotent — safe to run on every startup)
cd /app
echo "Running Prisma migrations..."
npx prisma migrate deploy

# Run seed script on first startup (detected by absence of seed marker)
if [ ! -f "$PGDATA/.seeded" ]; then
  echo "Running database seed (first startup)..."
  npx tsx prisma/seed.ts && touch "$PGDATA/.seeded" && echo "Seed complete."
else
  echo "Database already seeded, skipping."
fi

# Start Next.js server
echo "Starting Next.js server..."
exec node /app/server.js
