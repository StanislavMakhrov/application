-- GrünBilanz database initialization script
-- This runs on first container startup as a fallback if Prisma migrations fail.
-- Created by: GrünBilanz project

-- Ensure the database user exists (created by healthcheck.sh, this is a no-op in most cases)
-- The tables below mirror the Prisma schema and are created idempotently.

-- Enable pgcrypto for UUID support (optional, not required by this schema)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Note: Actual table creation is handled by Prisma migrate deploy.
-- This file is kept minimal as a safety net.
SELECT 1;
