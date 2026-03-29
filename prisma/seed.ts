/**
 * Prisma seed script — populates emission factors, industry benchmarks,
 * company profile, and demo data for 2023 and 2024.
 *
 * Emission factor values are imported from src/lib/uba-reference-data.ts,
 * which is the single source of truth for official UBA factor values.
 * This keeps the seed and the auto-fill API in sync.
 *
 * Run with: npx tsx prisma/seed.ts
 * or via: npm run db:seed
 */

import { PrismaClient, Scope, EmissionCategory, MaterialCategory, Branche } from '@prisma/client';
import { UBA_REFERENCE_DATA } from '../src/lib/uba-reference-data';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding emission factors from UBA reference data...');

  let totalFactorsSeeded = 0;
  for (const [yearStr, factors] of Object.entries(UBA_REFERENCE_DATA)) {
    const year = Number(yearStr);
    for (const factor of factors) {
      await prisma.emissionFactor.upsert({
        where: { key_validYear: { key: factor.key, validYear: year } },
        update: {
          factorKg: factor.factorKg,
          unit: factor.unit,
          source: factor.source,
          label: factor.label,
          scope: factor.scope as Scope,
        },
        create: {
          key: factor.key,
          validYear: year,
          factorKg: factor.factorKg,
          unit: factor.unit,
          source: factor.source,
          label: factor.label,
          scope: factor.scope as Scope,
        },
      });
    }
    totalFactorsSeeded += factors.length;
    console.log(`  Seeded ${factors.length} factors for year ${year}.`);
  }
  console.log(`Seeded ${totalFactorsSeeded} emission factors total.`);

  // Industry benchmarks (t CO₂e per employee per year)
  const benchmarks = [
    { branche: Branche.ELEKTROHANDWERK, co2ePerEmployeePerYear: 3.2 },
    { branche: Branche.SHK, co2ePerEmployeePerYear: 14.2 },
    { branche: Branche.BAUGEWERBE, co2ePerEmployeePerYear: 18.7 },
    { branche: Branche.TISCHLER, co2ePerEmployeePerYear: 10.3 },
    { branche: Branche.KFZ_WERKSTATT, co2ePerEmployeePerYear: 16.1 },
    { branche: Branche.MALER, co2ePerEmployeePerYear: 9.8 },
    { branche: Branche.SONSTIGES, co2ePerEmployeePerYear: 11.5 },
  ];

  for (const benchmark of benchmarks) {
    await prisma.industryBenchmark.upsert({
      where: { branche: benchmark.branche },
      update: benchmark,
      create: benchmark,
    });
  }
  console.log(`Seeded ${benchmarks.length} industry benchmarks.`);

  // Company profile (singleton, id=1)
  await prisma.companyProfile.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      firmenname: 'Mustermann Elektro GmbH',
      branche: Branche.ELEKTROHANDWERK,
      mitarbeiter: 12,
      standort: 'München, Bayern',
    },
  });
  console.log('Seeded company profile.');

  // Demo data: 2023
  const year2023 = await prisma.reportingYear.upsert({
    where: { year: 2023 },
    update: {},
    create: { year: 2023 },
  });

  const entries2023 = [
    { scope: Scope.SCOPE1, category: EmissionCategory.ERDGAS, quantity: 4000 },
    { scope: Scope.SCOPE1, category: EmissionCategory.HEIZOEL, quantity: 0 },
    { scope: Scope.SCOPE1, category: EmissionCategory.DIESEL_FUHRPARK, quantity: 3200 },
    { scope: Scope.SCOPE2, category: EmissionCategory.STROM, quantity: 45000, isOekostrom: false },
    { scope: Scope.SCOPE3, category: EmissionCategory.GESCHAEFTSREISEN_FLUG, quantity: 8500 },
    { scope: Scope.SCOPE3, category: EmissionCategory.GESCHAEFTSREISEN_BAHN, quantity: 3200 },
    { scope: Scope.SCOPE3, category: EmissionCategory.PENDLERVERKEHR, quantity: 28600 },
    { scope: Scope.SCOPE3, category: EmissionCategory.ABFALL_RESTMUELL, quantity: 800 },
  ];

  for (const entry of entries2023) {
    // Use findFirst+create/update because Prisma's compound-unique where
    // does not support null in the new (yearId, scope, category, billingMonth, providerName) key.
    const existing = await prisma.emissionEntry.findFirst({
      where: { reportingYearId: year2023.id, scope: entry.scope, category: entry.category, billingMonth: null, providerName: null },
    });
    if (existing) {
      await prisma.emissionEntry.update({ where: { id: existing.id }, data: { quantity: entry.quantity } });
    } else {
      await prisma.emissionEntry.create({ data: { reportingYearId: year2023.id, ...entry } });
    }
  }

  // Materials 2023
  await prisma.materialEntry.deleteMany({ where: { reportingYearId: year2023.id } });
  await prisma.materialEntry.createMany({
    data: [
      { reportingYearId: year2023.id, material: MaterialCategory.KUPFER, quantityKg: 480 },
      { reportingYearId: year2023.id, material: MaterialCategory.STAHL, quantityKg: 350 },
    ],
  });
  console.log('Seeded 2023 demo data.');

  // Demo data: 2024
  const year2024 = await prisma.reportingYear.upsert({
    where: { year: 2024 },
    update: {},
    create: { year: 2024 },
  });

  const entries2024 = [
    { scope: Scope.SCOPE1, category: EmissionCategory.ERDGAS, quantity: 3800 },
    { scope: Scope.SCOPE1, category: EmissionCategory.DIESEL_FUHRPARK, quantity: 2900 },
    { scope: Scope.SCOPE2, category: EmissionCategory.STROM, quantity: 42000, isOekostrom: false },
    { scope: Scope.SCOPE2, category: EmissionCategory.FERNWAERME, quantity: 5000 },
    { scope: Scope.SCOPE3, category: EmissionCategory.GESCHAEFTSREISEN_FLUG, quantity: 7200 },
    { scope: Scope.SCOPE3, category: EmissionCategory.GESCHAEFTSREISEN_BAHN, quantity: 4100 },
    { scope: Scope.SCOPE3, category: EmissionCategory.PENDLERVERKEHR, quantity: 25600 },
    { scope: Scope.SCOPE3, category: EmissionCategory.ABFALL_RESTMUELL, quantity: 750 },
    { scope: Scope.SCOPE3, category: EmissionCategory.ABFALL_ALTMETALL, quantity: 200 },
  ];

  for (const entry of entries2024) {
    // Use findFirst+create/update because Prisma's compound-unique where
    // does not support null in the new (yearId, scope, category, billingMonth, providerName) key.
    const existing = await prisma.emissionEntry.findFirst({
      where: { reportingYearId: year2024.id, scope: entry.scope, category: entry.category, billingMonth: null, providerName: null },
    });
    if (existing) {
      await prisma.emissionEntry.update({ where: { id: existing.id }, data: { quantity: entry.quantity } });
    } else {
      await prisma.emissionEntry.create({ data: { reportingYearId: year2024.id, ...entry } });
    }
  }

  // Materials 2024
  await prisma.materialEntry.deleteMany({ where: { reportingYearId: year2024.id } });
  await prisma.materialEntry.createMany({
    data: [
      { reportingYearId: year2024.id, material: MaterialCategory.KUPFER, quantityKg: 420 },
      { reportingYearId: year2024.id, material: MaterialCategory.STAHL, quantityKg: 380 },
      { reportingYearId: year2024.id, material: MaterialCategory.ALUMINIUM, quantityKg: 120 },
    ],
  });
  console.log('Seeded 2024 demo data.');

  console.log('✅ Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
