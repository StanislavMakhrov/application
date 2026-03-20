#!/bin/sh
set -e

PGDATA="/var/lib/postgresql/data"
DB_NAME="gruenbilanz"
DB_USER="gruenbilanz"
DB_PASS="gruenbilanz"

# If no external DATABASE_URL is provided, start the embedded PostgreSQL
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
  # Default to seeding the database on first run
  export SEED_DB="${SEED_DB:-true}"

  echo "==> Starting embedded PostgreSQL..."

  # Ensure data directory exists with correct ownership
  mkdir -p "$PGDATA"
  chown -R postgres:postgres "$PGDATA"

  # Initialize the database cluster if it has not been done yet
  if [ ! -f "$PGDATA/PG_VERSION" ]; then
    echo "  Initializing PostgreSQL data directory..."
    su-exec postgres initdb -D "$PGDATA"
  fi

  # Start PostgreSQL in the background and wait until it is ready
  su-exec postgres pg_ctl -D "$PGDATA" -w start

  # Create the application role if it does not exist
  su-exec postgres psql -c "DO \$\$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
      CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASS}';
    END IF;
  END \$\$;"

  # Create the application database if it does not exist
  su-exec postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" \
    | grep -q 1 \
    || su-exec postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
fi

echo "==> Running Prisma migrations..."
prisma migrate deploy

if [ "${SEED_DB:-false}" = "true" ]; then
  echo "==> Seeding database..."
  prisma db seed
fi

echo "==> Starting Next.js server..."
exec node server.js
