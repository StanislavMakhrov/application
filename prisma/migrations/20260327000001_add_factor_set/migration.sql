-- Create FactorSet table
CREATE TABLE "FactorSet" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    CONSTRAINT "FactorSet_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FactorSet_name_key" ON "FactorSet"("name");

-- Add factorSetId to EmissionFactor (nullable — existing rows are unaffected)
ALTER TABLE "EmissionFactor" ADD COLUMN "factorSetId" INTEGER;
ALTER TABLE "EmissionFactor" ADD CONSTRAINT "EmissionFactor_factorSetId_fkey" FOREIGN KEY ("factorSetId") REFERENCES "FactorSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add factorSetId to ReportingYear (nullable — existing rows are unaffected)
ALTER TABLE "ReportingYear" ADD COLUMN "factorSetId" INTEGER;
ALTER TABLE "ReportingYear" ADD CONSTRAINT "ReportingYear_factorSetId_fkey" FOREIGN KEY ("factorSetId") REFERENCES "FactorSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
