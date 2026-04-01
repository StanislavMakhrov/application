-- AlterTable: add nullable label column to EmissionFactor
-- This column stores the German display name for each emission factor.
-- Nullable for backward compatibility; existing rows retain NULL until
-- updated by seed or the uba-fill API.
ALTER TABLE "EmissionFactor" ADD COLUMN "label" TEXT;
