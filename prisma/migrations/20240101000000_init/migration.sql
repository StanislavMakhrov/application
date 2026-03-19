-- CreateEnum
CREATE TYPE "Scope" AS ENUM ('SCOPE1', 'SCOPE2', 'SCOPE3');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('MANUAL', 'OCR');

-- CreateTable
CREATE TABLE "Company" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "employeeCount" INTEGER NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportingPeriod" (
    "id" SERIAL NOT NULL,
    "companyId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "quarter" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportingPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmissionEntry" (
    "id" SERIAL NOT NULL,
    "reportingPeriodId" INTEGER NOT NULL,
    "scope" "Scope" NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL,
    "co2e" DECIMAL(65,30) NOT NULL,
    "sourceType" "SourceType" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmissionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmissionFactor" (
    "id" SERIAL NOT NULL,
    "year" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "factorKgCo2ePerUnit" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'UBA_2024',
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmissionFactor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndustryBenchmark" (
    "id" SERIAL NOT NULL,
    "industry" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "avgScope1Co2e" DECIMAL(65,30) NOT NULL,
    "avgScope2Co2e" DECIMAL(65,30) NOT NULL,
    "avgScope3Co2e" DECIMAL(65,30) NOT NULL,
    "employeeCount" INTEGER NOT NULL,

    CONSTRAINT "IndustryBenchmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmissionFactor_year_category_subcategory_key" ON "EmissionFactor"("year", "category", "subcategory");

-- AddForeignKey
ALTER TABLE "ReportingPeriod" ADD CONSTRAINT "ReportingPeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmissionEntry" ADD CONSTRAINT "EmissionEntry_reportingPeriodId_fkey" FOREIGN KEY ("reportingPeriodId") REFERENCES "ReportingPeriod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
