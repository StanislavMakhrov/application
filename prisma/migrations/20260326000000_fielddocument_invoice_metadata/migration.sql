-- Migration: add invoice metadata columns to FieldDocument
-- These columns support per-invoice OCR value storage, month tagging, and
-- annual-invoice marking used by the FieldDocumentZone UI.
ALTER TABLE "FieldDocument" ADD COLUMN "recognizedValue" DOUBLE PRECISION;
ALTER TABLE "FieldDocument" ADD COLUMN "billingMonth" INTEGER;
ALTER TABLE "FieldDocument" ADD COLUMN "isJahresabrechnung" BOOLEAN NOT NULL DEFAULT FALSE;
