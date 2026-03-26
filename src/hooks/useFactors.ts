'use client';

/**
 * useFactors — shared hook for loading live emission factor records.
 *
 * Fetches GET /api/factors?year={year} once on mount (and whenever year changes)
 * and exposes the factor map to wizard screens for use with FactorHint.
 *
 * On error (network failure, non-2xx), factors degrade gracefully to an empty
 * map — the wizard remains fully functional; hints show "–" placeholders.
 */

import { useState, useEffect } from 'react';
import type { FactorRecord } from '@/types';

export interface UseFactorsResult {
  factors: Record<string, FactorRecord>;
  isLoading: boolean;
}

/**
 * Fetches all emission factor records for the given reporting year.
 *
 * @param year - The reporting year (e.g. 2024)
 * @returns factors map and isLoading flag
 */
export function useFactors(year: number): UseFactorsResult {
  const [factors, setFactors] = useState<Record<string, FactorRecord>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset to loading on year change
    setIsLoading(true);
    setFactors({});

    let cancelled = false;

    fetch(`/api/factors?year=${year}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json() as Promise<Record<string, FactorRecord>>;
      })
      .then((data) => {
        if (!cancelled) {
          setFactors(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        // Degrade gracefully — wizard remains usable with "–" placeholders
        console.error('[useFactors] Failed to load emission factors:', err);
        if (!cancelled) {
          setFactors({});
          setIsLoading(false);
        }
      });

    // Prevent state updates on unmounted component
    return () => {
      cancelled = true;
    };
  }, [year]);

  return { factors, isLoading };
}
