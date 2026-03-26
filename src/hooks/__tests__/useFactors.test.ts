/**
 * Unit tests for the useFactors custom hook (TC-16, TC-17, TC-18).
 *
 * Uses @testing-library/react renderHook with jsdom environment to test
 * the fetch lifecycle, loading states, and error handling.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFactors } from '../useFactors';
import type { FactorRecord } from '@/types';

const mockFactors: Record<string, FactorRecord> = {
  ERDGAS: { factorKg: 2.02, unit: 'm³', source: 'UBA 2024', validYear: 2024 },
  STROM: { factorKg: 0.434, unit: 'kWh', source: 'UBA 2024', validYear: 2024 },
};

describe('useFactors', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // TC-16: Returns factors on successful fetch
  it('TC-16: returns loaded factors and isLoading=false on successful fetch', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockFactors,
    } as Response);

    const { result } = renderHook(() => useFactors(2024));

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.factors).toEqual({});

    // After fetch resolves
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.factors).toEqual(mockFactors);
    expect(global.fetch).toHaveBeenCalledWith('/api/factors?year=2024');
  });

  // TC-17: Returns empty factors on fetch error (network failure)
  it('TC-17: returns empty factors and isLoading=false on network error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useFactors(2024));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.factors).toEqual({});
    expect(consoleSpy).toHaveBeenCalled();
  });

  // TC-18: isLoading starts true while fetch is in flight
  it('TC-18: isLoading is true while fetch is in flight, false after', async () => {
    let resolvePromise!: (value: Response) => void;
    const pendingPromise = new Promise<Response>((resolve) => {
      resolvePromise = resolve;
    });

    global.fetch = vi.fn().mockReturnValueOnce(pendingPromise);

    const { result } = renderHook(() => useFactors(2024));

    // Should be loading immediately
    expect(result.current.isLoading).toBe(true);

    // Resolve the fetch
    resolvePromise({
      ok: true,
      json: async () => mockFactors,
    } as Response);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.factors).toEqual(mockFactors);
  });

  // Additional: refetches when year changes
  it('refetches when year prop changes', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => mockFactors } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ STROM: mockFactors.STROM }),
      } as Response);

    const { result, rerender } = renderHook(({ year }) => useFactors(year), {
      initialProps: { year: 2024 },
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(global.fetch).toHaveBeenCalledWith('/api/factors?year=2024');

    rerender({ year: 2025 });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(global.fetch).toHaveBeenCalledWith('/api/factors?year=2025');
  });

  // Additional: returns empty factors on non-2xx response
  it('returns empty factors on non-2xx HTTP response', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useFactors(2024));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.factors).toEqual({});
    expect(consoleSpy).toHaveBeenCalled();
  });
});
