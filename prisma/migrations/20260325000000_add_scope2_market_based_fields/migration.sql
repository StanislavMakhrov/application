-- GHG Protocol Scope 2 Guidance: market-based method fields for STROM entries
-- supplierEmissionFactor: kg CO₂e per kWh from supplier contract/tariff
-- renewableCertificateNote: description of green tariff or renewable energy certificate
ALTER TABLE "EmissionEntry" ADD COLUMN "supplierEmissionFactor" DOUBLE PRECISION;
ALTER TABLE "EmissionEntry" ADD COLUMN "renewableCertificateNote" TEXT;
