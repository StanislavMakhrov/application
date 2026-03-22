-- Migration: add_audit_monthly_provider
-- Adds monthly billing support, provider tracking, and a full audit trail
-- with original document storage to EmissionEntry and MaterialEntry.

-- ─── EmissionEntry: new columns ──────────────────────────────────────────────

-- Monthly billing: 1–12 for a specific month, NULL means an annual entry
ALTER TABLE "EmissionEntry" ADD COLUMN "billingMonth" INTEGER;

-- When true, this annual entry overrides monthly entries for the same category
ALTER TABLE "EmissionEntry" ADD COLUMN "isFinalAnnual" BOOLEAN NOT NULL DEFAULT false;

-- Provider name for mid-year provider-change tracking
ALTER TABLE "EmissionEntry" ADD COLUMN "providerName" TEXT;

-- ─── EmissionEntry: constraint replacement ───────────────────────────────────

-- Drop the old single-entry-per-category constraint
ALTER TABLE "EmissionEntry" DROP CONSTRAINT "EmissionEntry_reportingYearId_scope_category_key";

-- New composite constraint: one entry per (year, scope, category, month, provider)
-- NULL values participate in uniqueness so (…, NULL, NULL) is a valid annual entry
ALTER TABLE "EmissionEntry" ADD CONSTRAINT "EmissionEntry_reportingYearId_scope_category_billingMonth_providerName_key"
    UNIQUE ("reportingYearId", "scope", "category", "billingMonth", "providerName");

-- ─── UploadedDocument table ───────────────────────────────────────────────────

CREATE TABLE "UploadedDocument" (
    "id"         SERIAL       NOT NULL,
    "filename"   TEXT         NOT NULL,
    "mimeType"   TEXT         NOT NULL,
    "sizeBytes"  INTEGER      NOT NULL,
    "content"    BYTEA        NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadedDocument_pkey" PRIMARY KEY ("id")
);

-- ─── AuditLog table ───────────────────────────────────────────────────────────

CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

CREATE TABLE "AuditLog" (
    "id"              SERIAL       NOT NULL,
    "entityType"      TEXT         NOT NULL,
    "entityId"        INTEGER,
    "action"          "AuditAction" NOT NULL,
    "fieldName"       TEXT,
    "oldValue"        TEXT,
    "newValue"        TEXT,
    "inputMethod"     "InputMethod" NOT NULL DEFAULT 'MANUAL',
    "documentId"      INTEGER,
    "metadata"        TEXT,
    "emissionEntryId" INTEGER,
    "materialEntryId" INTEGER,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- ─── Foreign keys ─────────────────────────────────────────────────────────────

ALTER TABLE "AuditLog"
    ADD CONSTRAINT "AuditLog_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "UploadedDocument"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
    ADD CONSTRAINT "AuditLog_emissionEntryId_fkey"
    FOREIGN KEY ("emissionEntryId") REFERENCES "EmissionEntry"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog"
    ADD CONSTRAINT "AuditLog_materialEntryId_fkey"
    FOREIGN KEY ("materialEntryId") REFERENCES "MaterialEntry"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
