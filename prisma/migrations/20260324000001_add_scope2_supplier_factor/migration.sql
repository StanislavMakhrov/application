-- Migration: add_scope2_supplier_factor
-- Adds an optional supplier-specific emission factor to EmissionEntry to support
-- Scope 2 market-based calculations alongside the location-based method.

ALTER TABLE "EmissionEntry" ADD COLUMN "supplierSpecificFactor" DOUBLE PRECISION;
