-- Migration: add validYear to IndustryBenchmark and update unique constraint
-- Required by the entity management feature (commit 8020c67) which changed
-- IndustryBenchmark from a single @unique(branche) to @@unique([branche, validYear])
-- so that benchmarks can be versioned per reporting year.

-- Step 1: add validYear column with a sensible default so existing rows are valid
ALTER TABLE "IndustryBenchmark" ADD COLUMN "validYear" INTEGER NOT NULL DEFAULT 2024;

-- Step 2: drop the old single-column unique index
DROP INDEX "IndustryBenchmark_branche_key";

-- Step 3: create the new compound unique index expected by Prisma schema
CREATE UNIQUE INDEX "IndustryBenchmark_branche_validYear_key" ON "IndustryBenchmark"("branche", "validYear");
