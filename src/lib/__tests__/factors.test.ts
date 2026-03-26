/**
 * Unit tests for the emission factor lookup (lib/factors.ts).
 *
 * These tests mock the Prisma client to avoid a live database connection.
 * They verify the year-fallback behavior required by the architecture.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEmissionFactor, getEmissionFactorRecord } from '../factors';

// Mock the Prisma client singleton
vi.mock('../prisma', () => ({
  prisma: {
    emissionFactor: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '../prisma';

describe('getEmissionFactor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the exact year factor when available', async () => {
    vi.mocked(prisma.emissionFactor.findUnique).mockResolvedValueOnce({
      id: 1,
      key: 'ERDGAS',
      validYear: 2024,
      factorKg: 2.0,
      unit: 'm³',
      source: 'UBA 2024',
      scope: 'SCOPE1',
      createdAt: new Date(),
    });

    const result = await getEmissionFactor('ERDGAS', 2024);
    expect(result).toBe(2.0);
    expect(prisma.emissionFactor.findUnique).toHaveBeenCalledWith({
      where: { key_validYear: { key: 'ERDGAS', validYear: 2024 } },
    });
  });

  it('falls back to most recent factor when exact year not found', async () => {
    // No exact match for 2025
    vi.mocked(prisma.emissionFactor.findUnique).mockResolvedValueOnce(null);
    // Returns the 2024 factor as fallback
    vi.mocked(prisma.emissionFactor.findFirst).mockResolvedValueOnce({
      id: 1,
      key: 'ERDGAS',
      validYear: 2024,
      factorKg: 2.0,
      unit: 'm³',
      source: 'UBA 2024',
      scope: 'SCOPE1',
      createdAt: new Date(),
    });

    const result = await getEmissionFactor('ERDGAS', 2025);
    expect(result).toBe(2.0);
    expect(prisma.emissionFactor.findFirst).toHaveBeenCalledWith({
      where: { key: 'ERDGAS', validYear: { lte: 2025 } },
      orderBy: { validYear: 'desc' },
    });
  });

  it('returns null when no factor exists at all', async () => {
    vi.mocked(prisma.emissionFactor.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.emissionFactor.findFirst).mockResolvedValueOnce(null);

    const result = await getEmissionFactor('UNKNOWN_KEY', 2024);
    expect(result).toBeNull();
  });

  it('returns the Ökostrom-specific factor for STROM_OEKOSTROM key', async () => {
    vi.mocked(prisma.emissionFactor.findUnique).mockResolvedValueOnce({
      id: 11,
      key: 'STROM_OEKOSTROM',
      validYear: 2024,
      factorKg: 0.03,
      unit: 'kWh',
      source: 'UBA 2024',
      scope: 'SCOPE2',
      createdAt: new Date(),
    });

    const result = await getEmissionFactor('STROM_OEKOSTROM', 2024);
    expect(result).toBe(0.03);
  });
});

describe('getEmissionFactorRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-14: Returns full record when exact year match exists
  it('TC-14: returns full record when exact year match exists', async () => {
    vi.mocked(prisma.emissionFactor.findUnique).mockResolvedValueOnce({
      id: 1,
      key: 'ERDGAS',
      validYear: 2024,
      factorKg: 2.02,
      unit: 'm³',
      source: 'UBA Datenbericht 2024',
      scope: 'SCOPE1',
      createdAt: new Date(),
    });

    const result = await getEmissionFactorRecord('ERDGAS', 2024);
    expect(result).toEqual({
      factorKg: 2.02,
      unit: 'm³',
      source: 'UBA Datenbericht 2024',
      validYear: 2024,
    });
    expect(prisma.emissionFactor.findUnique).toHaveBeenCalledWith({
      where: { key_validYear: { key: 'ERDGAS', validYear: 2024 } },
    });
  });

  // TC-15: Falls back to most-recent year when no exact match
  it('TC-15: falls back to most recent record when no exact year match exists', async () => {
    // No exact match for 2025
    vi.mocked(prisma.emissionFactor.findUnique).mockResolvedValueOnce(null);
    // Returns the 2024 record as fallback
    vi.mocked(prisma.emissionFactor.findFirst).mockResolvedValueOnce({
      id: 2,
      key: 'STROM',
      validYear: 2024,
      factorKg: 0.434,
      unit: 'kWh',
      source: 'UBA Datenbericht 2024',
      scope: 'SCOPE2',
      createdAt: new Date(),
    });

    const result = await getEmissionFactorRecord('STROM', 2025);
    expect(result).toEqual({
      factorKg: 0.434,
      unit: 'kWh',
      source: 'UBA Datenbericht 2024',
      validYear: 2024,
    });
    expect(prisma.emissionFactor.findFirst).toHaveBeenCalledWith({
      where: { key: 'STROM', validYear: { lte: 2025 } },
      orderBy: { validYear: 'desc' },
    });
  });

  // TC-16: Returns null when no factor exists at any year
  it('TC-16: returns null when no factor exists for the key at any year', async () => {
    vi.mocked(prisma.emissionFactor.findUnique).mockResolvedValueOnce(null);
    vi.mocked(prisma.emissionFactor.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.emissionFactor.findFirst).mockResolvedValueOnce(null);

    const result = await getEmissionFactorRecord('NONEXISTENT', 2024);
    expect(result).toBeNull();
  });
});
