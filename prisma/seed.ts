/**
 * Database seed script for GrünBilanz.
 * Populates UBA 2024 emission factors, sample company, reporting periods,
 * emission entries, and industry benchmarks for demonstration and development.
 */

import { PrismaClient, Scope, SourceType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding GrünBilanz database...');

  // -------------------------------------------------------------------------
  // Emission factors from UBA (Umweltbundesamt) 2024
  // -------------------------------------------------------------------------
  const emissionFactors = [
    // Scope 1 - Direct emissions from combustion
    { year: 2024, category: 'Erdgas', subcategory: null, factorKgCo2ePerUnit: 2.0, unit: 'm³', source: 'UBA_2024' },
    { year: 2024, category: 'Dieselkraftstoff', subcategory: null, factorKgCo2ePerUnit: 2.65, unit: 'L', source: 'UBA_2024' },
    { year: 2024, category: 'Heizöl', subcategory: null, factorKgCo2ePerUnit: 2.68, unit: 'L', source: 'UBA_2024' },
    // Scope 2 - Indirect emissions from purchased energy
    { year: 2024, category: 'Strom', subcategory: null, factorKgCo2ePerUnit: 0.380, unit: 'kWh', source: 'UBA_2024' },
    { year: 2024, category: 'Fernwärme', subcategory: null, factorKgCo2ePerUnit: 0.175, unit: 'kWh', source: 'UBA_2024' },
    // Scope 3 - Value chain emissions
    { year: 2024, category: 'Flug', subcategory: 'Kurzstrecke', factorKgCo2ePerUnit: 0.255, unit: 'km', source: 'UBA_2024' },
    { year: 2024, category: 'Flug', subcategory: 'Mittelstrecke', factorKgCo2ePerUnit: 0.195, unit: 'km', source: 'UBA_2024' },
    { year: 2024, category: 'Pkw', subcategory: 'Diesel', factorKgCo2ePerUnit: 0.171, unit: 'km', source: 'UBA_2024' },
    { year: 2024, category: 'Pkw', subcategory: 'Benzin', factorKgCo2ePerUnit: 0.192, unit: 'km', source: 'UBA_2024' },
    { year: 2024, category: 'Bahn', subcategory: null, factorKgCo2ePerUnit: 0.006, unit: 'km', source: 'UBA_2024' },
    { year: 2024, category: 'Abfall', subcategory: 'gemischt', factorKgCo2ePerUnit: 0.467, unit: 'kg', source: 'UBA_2024' },
    // 2023 factors (same as 2024 for seed purposes)
    { year: 2023, category: 'Erdgas', subcategory: null, factorKgCo2ePerUnit: 2.0, unit: 'm³', source: 'UBA_2023' },
    { year: 2023, category: 'Dieselkraftstoff', subcategory: null, factorKgCo2ePerUnit: 2.65, unit: 'L', source: 'UBA_2023' },
    { year: 2023, category: 'Heizöl', subcategory: null, factorKgCo2ePerUnit: 2.68, unit: 'L', source: 'UBA_2023' },
    { year: 2023, category: 'Strom', subcategory: null, factorKgCo2ePerUnit: 0.434, unit: 'kWh', source: 'UBA_2023' },
    { year: 2023, category: 'Fernwärme', subcategory: null, factorKgCo2ePerUnit: 0.180, unit: 'kWh', source: 'UBA_2023' },
    { year: 2023, category: 'Flug', subcategory: 'Kurzstrecke', factorKgCo2ePerUnit: 0.255, unit: 'km', source: 'UBA_2023' },
    { year: 2023, category: 'Flug', subcategory: 'Mittelstrecke', factorKgCo2ePerUnit: 0.195, unit: 'km', source: 'UBA_2023' },
    { year: 2023, category: 'Pkw', subcategory: 'Diesel', factorKgCo2ePerUnit: 0.171, unit: 'km', source: 'UBA_2023' },
    { year: 2023, category: 'Pkw', subcategory: 'Benzin', factorKgCo2ePerUnit: 0.192, unit: 'km', source: 'UBA_2023' },
    { year: 2023, category: 'Bahn', subcategory: null, factorKgCo2ePerUnit: 0.006, unit: 'km', source: 'UBA_2023' },
    { year: 2023, category: 'Abfall', subcategory: 'gemischt', factorKgCo2ePerUnit: 0.467, unit: 'kg', source: 'UBA_2023' },
  ];

  // Delete all existing factors and re-create (idempotent seed)
  await prisma.emissionFactor.deleteMany({});
  await prisma.emissionFactor.createMany({ data: emissionFactors });
  console.log(`✅ ${emissionFactors.length} Emissionsfaktoren gespeichert`);

  // -------------------------------------------------------------------------
  // Sample company: Musterbetrieb GmbH
  // -------------------------------------------------------------------------
  const company = await prisma.company.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Musterbetrieb GmbH',
      industry: 'Elektrotechnik',
      location: 'München',
      employeeCount: 25,
    },
  });
  console.log(`✅ Unternehmen: ${company.name}`);

  // -------------------------------------------------------------------------
  // Reporting periods for 2023 and 2024
  // -------------------------------------------------------------------------
  const period2023 = await prisma.reportingPeriod.upsert({
    where: { id: 1 },
    update: {},
    create: { companyId: company.id, year: 2023, quarter: 'ANNUAL' },
  });
  const period2024 = await prisma.reportingPeriod.upsert({
    where: { id: 2 },
    update: {},
    create: { companyId: company.id, year: 2024, quarter: 'ANNUAL' },
  });
  console.log('✅ Berichtszeiträume 2023 und 2024 erstellt');

  // -------------------------------------------------------------------------
  // Sample emission entries for 2023
  // -------------------------------------------------------------------------
  const entries2023 = [
    // Scope 1
    { reportingPeriodId: period2023.id, scope: Scope.SCOPE1, category: 'Erdgas', subcategory: null, quantity: 15000, unit: 'm³', co2e: 30000, sourceType: SourceType.MANUAL },
    { reportingPeriodId: period2023.id, scope: Scope.SCOPE1, category: 'Dieselkraftstoff', subcategory: null, quantity: 3000, unit: 'L', co2e: 7950, sourceType: SourceType.MANUAL },
    // Scope 2
    { reportingPeriodId: period2023.id, scope: Scope.SCOPE2, category: 'Strom', subcategory: null, quantity: 85000, unit: 'kWh', co2e: 36890, sourceType: SourceType.MANUAL },
    { reportingPeriodId: period2023.id, scope: Scope.SCOPE2, category: 'Fernwärme', subcategory: null, quantity: 20000, unit: 'kWh', co2e: 3600, sourceType: SourceType.MANUAL },
    // Scope 3
    { reportingPeriodId: period2023.id, scope: Scope.SCOPE3, category: 'Pkw', subcategory: 'Diesel', quantity: 45000, unit: 'km', co2e: 7695, sourceType: SourceType.MANUAL },
    { reportingPeriodId: period2023.id, scope: Scope.SCOPE3, category: 'Flug', subcategory: 'Kurzstrecke', quantity: 8000, unit: 'km', co2e: 2040, sourceType: SourceType.MANUAL },
    { reportingPeriodId: period2023.id, scope: Scope.SCOPE3, category: 'Bahn', subcategory: null, quantity: 12000, unit: 'km', co2e: 72, sourceType: SourceType.MANUAL },
    { reportingPeriodId: period2023.id, scope: Scope.SCOPE3, category: 'Abfall', subcategory: 'gemischt', quantity: 2500, unit: 'kg', co2e: 1167.5, sourceType: SourceType.MANUAL },
  ];

  // Sample emission entries for 2024 (slight improvement over 2023)
  const entries2024 = [
    // Scope 1
    { reportingPeriodId: period2024.id, scope: Scope.SCOPE1, category: 'Erdgas', subcategory: null, quantity: 13000, unit: 'm³', co2e: 26000, sourceType: SourceType.MANUAL },
    { reportingPeriodId: period2024.id, scope: Scope.SCOPE1, category: 'Dieselkraftstoff', subcategory: null, quantity: 2500, unit: 'L', co2e: 6625, sourceType: SourceType.MANUAL },
    // Scope 2
    { reportingPeriodId: period2024.id, scope: Scope.SCOPE2, category: 'Strom', subcategory: null, quantity: 80000, unit: 'kWh', co2e: 30400, sourceType: SourceType.MANUAL },
    { reportingPeriodId: period2024.id, scope: Scope.SCOPE2, category: 'Fernwärme', subcategory: null, quantity: 18000, unit: 'kWh', co2e: 3150, sourceType: SourceType.MANUAL },
    // Scope 3
    { reportingPeriodId: period2024.id, scope: Scope.SCOPE3, category: 'Pkw', subcategory: 'Diesel', quantity: 40000, unit: 'km', co2e: 6840, sourceType: SourceType.MANUAL },
    { reportingPeriodId: period2024.id, scope: Scope.SCOPE3, category: 'Flug', subcategory: 'Kurzstrecke', quantity: 5000, unit: 'km', co2e: 1275, sourceType: SourceType.MANUAL },
    { reportingPeriodId: period2024.id, scope: Scope.SCOPE3, category: 'Bahn', subcategory: null, quantity: 18000, unit: 'km', co2e: 108, sourceType: SourceType.MANUAL },
    { reportingPeriodId: period2024.id, scope: Scope.SCOPE3, category: 'Abfall', subcategory: 'gemischt', quantity: 2200, unit: 'kg', co2e: 1027.4, sourceType: SourceType.MANUAL },
  ];

  // Delete existing entries and recreate for idempotent seeding
  await prisma.emissionEntry.deleteMany({ where: { reportingPeriodId: { in: [period2023.id, period2024.id] } } });
  await prisma.emissionEntry.createMany({ data: entries2023 });
  await prisma.emissionEntry.createMany({ data: entries2024 });
  console.log('✅ Emissionseinträge für 2023 und 2024 erstellt');

  // -------------------------------------------------------------------------
  // Industry benchmarks for Elektrotechnik
  // -------------------------------------------------------------------------
  await prisma.industryBenchmark.deleteMany({ where: { industry: 'Elektrotechnik' } });
  await prisma.industryBenchmark.createMany({
    data: [
      { industry: 'Elektrotechnik', year: 2023, avgScope1Co2e: 42000, avgScope2Co2e: 45000, avgScope3Co2e: 15000, employeeCount: 25 },
      { industry: 'Elektrotechnik', year: 2024, avgScope1Co2e: 38000, avgScope2Co2e: 40000, avgScope3Co2e: 13000, employeeCount: 25 },
    ],
  });
  console.log('✅ Branchenvergleichswerte für Elektrotechnik erstellt');

  console.log('🎉 Datenbankinitialisierung abgeschlossen!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
