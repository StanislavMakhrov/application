/**
 * Unit tests for emissionFactors.ts
 * Tests emission factor lookup functions with a mocked Prisma client.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Decimal } from '@prisma/client/runtime/library';

// Mock the prisma module before importing emissionFactors
vi.mock('../lib/prisma', () => ({
  prisma: {
    emissionFactor: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { getEmissionFactor, getAllEmissionFactors } from '../lib/emissionFactors';
import { prisma } from '../lib/prisma';

/** Shared date constants to avoid duplication in test data */
const VALID_FROM_2024 = new Date('2024-01-01');
const VALID_FROM_2023 = new Date('2023-01-01');

/** Sample emission factor records matching the UBA 2024 seed data */
const mockFactors = [
  { id: 1, year: 2024, category: 'Erdgas', subcategory: null, factorKgCo2ePerUnit: new Decimal(2.0), unit: 'm³', source: 'UBA_2024', validFrom: VALID_FROM_2024 },
  { id: 2, year: 2024, category: 'Strom', subcategory: null, factorKgCo2ePerUnit: new Decimal(0.38), unit: 'kWh', source: 'UBA_2024', validFrom: VALID_FROM_2024 },
  { id: 3, year: 2024, category: 'Pkw', subcategory: 'Diesel', factorKgCo2ePerUnit: new Decimal(0.171), unit: 'km', source: 'UBA_2024', validFrom: VALID_FROM_2024 },
  { id: 4, year: 2024, category: 'Pkw', subcategory: 'Benzin', factorKgCo2ePerUnit: new Decimal(0.192), unit: 'km', source: 'UBA_2024', validFrom: VALID_FROM_2024 },
  { id: 5, year: 2024, category: 'Flug', subcategory: 'Kurzstrecke', factorKgCo2ePerUnit: new Decimal(0.255), unit: 'km', source: 'UBA_2024', validFrom: VALID_FROM_2024 },
  { id: 6, year: 2023, category: 'Strom', subcategory: null, factorKgCo2ePerUnit: new Decimal(0.434), unit: 'kWh', source: 'UBA_2023', validFrom: VALID_FROM_2023 },
];

describe('getEmissionFactor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the emission factor for Erdgas 2024', async () => {
    const expected = mockFactors[0];
    vi.mocked(prisma.emissionFactor.findFirst).mockResolvedValue(expected);

    const result = await getEmissionFactor(2024, 'Erdgas');

    expect(result).toEqual(expected);
    expect(prisma.emissionFactor.findFirst).toHaveBeenCalledWith({
      where: { year: 2024, category: 'Erdgas', subcategory: null },
      orderBy: { validFrom: 'desc' },
    });
  });

  it('returns the emission factor for Strom 2024', async () => {
    const expected = mockFactors[1];
    vi.mocked(prisma.emissionFactor.findFirst).mockResolvedValue(expected);

    const result = await getEmissionFactor(2024, 'Strom');

    expect(result).not.toBeNull();
    expect(result?.factorKgCo2ePerUnit).toEqual(new Decimal(0.38));
  });

  it('returns emission factor for Pkw with subcategory Diesel', async () => {
    const expected = mockFactors[2];
    vi.mocked(prisma.emissionFactor.findFirst).mockResolvedValue(expected);

    const result = await getEmissionFactor(2024, 'Pkw', 'Diesel');

    expect(result).toEqual(expected);
    expect(prisma.emissionFactor.findFirst).toHaveBeenCalledWith({
      where: { year: 2024, category: 'Pkw', subcategory: 'Diesel' },
      orderBy: { validFrom: 'desc' },
    });
  });

  it('returns emission factor for Pkw with subcategory Benzin', async () => {
    const expected = mockFactors[3];
    vi.mocked(prisma.emissionFactor.findFirst).mockResolvedValue(expected);

    const result = await getEmissionFactor(2024, 'Pkw', 'Benzin');

    expect(result?.subcategory).toBe('Benzin');
    expect(result?.factorKgCo2ePerUnit).toEqual(new Decimal(0.192));
  });

  it('returns null when no factor is found for a category', async () => {
    vi.mocked(prisma.emissionFactor.findFirst).mockResolvedValue(null);

    const result = await getEmissionFactor(2024, 'UnbekannteKategorie');

    expect(result).toBeNull();
  });

  it('passes null subcategory when not provided', async () => {
    vi.mocked(prisma.emissionFactor.findFirst).mockResolvedValue(mockFactors[1]);

    await getEmissionFactor(2024, 'Strom');

    expect(prisma.emissionFactor.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ subcategory: null }) })
    );
  });

  it('passes null subcategory when explicitly null', async () => {
    vi.mocked(prisma.emissionFactor.findFirst).mockResolvedValue(mockFactors[0]);

    await getEmissionFactor(2024, 'Erdgas', null);

    expect(prisma.emissionFactor.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ subcategory: null }) })
    );
  });

  it('returns older year factor correctly', async () => {
    const expected = mockFactors[5]; // Strom 2023
    vi.mocked(prisma.emissionFactor.findFirst).mockResolvedValue(expected);

    const result = await getEmissionFactor(2023, 'Strom');

    expect(result?.year).toBe(2023);
    expect(result?.factorKgCo2ePerUnit).toEqual(new Decimal(0.434));
  });
});

describe('getAllEmissionFactors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all factors for a given year', async () => {
    const expected2024 = mockFactors.filter((f) => f.year === 2024);
    vi.mocked(prisma.emissionFactor.findMany).mockResolvedValue(expected2024);

    const result = await getAllEmissionFactors(2024);

    expect(result).toHaveLength(expected2024.length);
    expect(prisma.emissionFactor.findMany).toHaveBeenCalledWith({
      where: { year: 2024 },
      orderBy: [{ category: 'asc' }, { subcategory: 'asc' }],
    });
  });

  it('returns empty array when no factors exist for a year', async () => {
    vi.mocked(prisma.emissionFactor.findMany).mockResolvedValue([]);

    const result = await getAllEmissionFactors(2020);

    expect(result).toEqual([]);
  });

  it('orders results by category and subcategory', async () => {
    vi.mocked(prisma.emissionFactor.findMany).mockResolvedValue(mockFactors);

    await getAllEmissionFactors(2024);

    expect(prisma.emissionFactor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ category: 'asc' }, { subcategory: 'asc' }],
      })
    );
  });
});
