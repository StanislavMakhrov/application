-- CreateEnum
CREATE TYPE "Branche" AS ENUM ('ELEKTROHANDWERK', 'SHK', 'BAUGEWERBE', 'TISCHLER', 'KFZ_WERKSTATT', 'MALER', 'SONSTIGES');

-- CreateEnum
CREATE TYPE "Scope" AS ENUM ('SCOPE1', 'SCOPE2', 'SCOPE3');

-- CreateEnum
CREATE TYPE "EmissionCategory" AS ENUM ('ERDGAS', 'HEIZOEL', 'FLUESSIGGAS', 'DIESEL_FUHRPARK', 'BENZIN_FUHRPARK', 'PKW_BENZIN_KM', 'PKW_DIESEL_KM', 'TRANSPORTER_KM', 'LKW_KM', 'STROM', 'FERNWAERME', 'GESCHAEFTSREISEN_FLUG', 'GESCHAEFTSREISEN_BAHN', 'PENDLERVERKEHR', 'ABFALL_RESTMUELL', 'ABFALL_BAUSCHUTT', 'ABFALL_ALTMETALL', 'ABFALL_SONSTIGES');

-- CreateEnum
CREATE TYPE "InputMethod" AS ENUM ('MANUAL', 'OCR', 'CSV');

-- CreateEnum
CREATE TYPE "MaterialCategory" AS ENUM ('KUPFER', 'STAHL', 'ALUMINIUM', 'HOLZ', 'KUNSTSTOFF_PVC', 'BETON', 'FARBEN_LACKE', 'SONSTIGE');

-- CreateEnum
CREATE TYPE "StagingSource" AS ENUM ('OCR', 'CSV');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('GHG_PROTOCOL', 'CSRD_QUESTIONNAIRE');

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "firmenname" TEXT NOT NULL,
    "branche" "Branche" NOT NULL,
    "mitarbeiter" INTEGER NOT NULL,
    "standort" TEXT NOT NULL,
    "logoPath" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportingYear" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportingYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmissionEntry" (
    "id" SERIAL NOT NULL,
    "reportingYearId" INTEGER NOT NULL,
    "scope" "Scope" NOT NULL,
    "category" "EmissionCategory" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "memo" TEXT,
    "isOekostrom" BOOLEAN NOT NULL DEFAULT false,
    "inputMethod" "InputMethod" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmissionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaterialEntry" (
    "id" SERIAL NOT NULL,
    "reportingYearId" INTEGER NOT NULL,
    "material" "MaterialCategory" NOT NULL,
    "quantityKg" DOUBLE PRECISION NOT NULL,
    "supplierName" TEXT,
    "inputMethod" "InputMethod" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmissionFactor" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "validYear" INTEGER NOT NULL,
    "factorKg" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "scope" "Scope" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmissionFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StagingEntry" (
    "id" SERIAL NOT NULL,
    "reportingYearId" INTEGER NOT NULL,
    "scope" "Scope" NOT NULL,
    "category" "EmissionCategory" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION,
    "rawText" TEXT,
    "source" "StagingSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StagingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "reportingYearId" INTEGER NOT NULL,
    "type" "ReportType" NOT NULL,
    "filePath" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustryBenchmark" (
    "id" SERIAL NOT NULL,
    "branche" "Branche" NOT NULL,
    "co2ePerEmployeePerYear" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "IndustryBenchmark_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "ReportingYear_year_key" ON "ReportingYear"("year");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "EmissionEntry_reportingYearId_scope_category_key" ON "EmissionEntry"("reportingYearId", "scope", "category");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "EmissionFactor_key_validYear_key" ON "EmissionFactor"("key", "validYear");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "StagingEntry_reportingYearId_scope_category_key" ON "StagingEntry"("reportingYearId", "scope", "category");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "IndustryBenchmark_branche_key" ON "IndustryBenchmark"("branche");

-- AddForeignKey
ALTER TABLE "EmissionEntry" ADD CONSTRAINT "EmissionEntry_reportingYearId_fkey" FOREIGN KEY ("reportingYearId") REFERENCES "ReportingYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialEntry" ADD CONSTRAINT "MaterialEntry_reportingYearId_fkey" FOREIGN KEY ("reportingYearId") REFERENCES "ReportingYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StagingEntry" ADD CONSTRAINT "StagingEntry_reportingYearId_fkey" FOREIGN KEY ("reportingYearId") REFERENCES "ReportingYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportingYearId_fkey" FOREIGN KEY ("reportingYearId") REFERENCES "ReportingYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
