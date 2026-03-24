/**
 * Unit tests for report conformity helpers (types/index.ts).
 *
 * Validates the SCOPE3_GHG_PROTOCOL_CATEGORY mapping that drives the
 * GHG Protocol category numbers shown in the GHG PDF report.
 */

import { describe, it, expect } from 'vitest';
import { SCOPE3_GHG_PROTOCOL_CATEGORY, CATEGORY_SCOPE } from '@/types';

describe('SCOPE3_GHG_PROTOCOL_CATEGORY', () => {
  it('maps waste categories to GHG Protocol Category 5', () => {
    expect(SCOPE3_GHG_PROTOCOL_CATEGORY['ABFALL_RESTMUELL']).toBe('Kat. 5');
    expect(SCOPE3_GHG_PROTOCOL_CATEGORY['ABFALL_BAUSCHUTT']).toBe('Kat. 5');
    expect(SCOPE3_GHG_PROTOCOL_CATEGORY['ABFALL_ALTMETALL']).toBe('Kat. 5');
    expect(SCOPE3_GHG_PROTOCOL_CATEGORY['ABFALL_SONSTIGES']).toBe('Kat. 5');
  });

  it('maps business travel categories to GHG Protocol Category 6', () => {
    expect(SCOPE3_GHG_PROTOCOL_CATEGORY['GESCHAEFTSREISEN_FLUG']).toBe('Kat. 6');
    expect(SCOPE3_GHG_PROTOCOL_CATEGORY['GESCHAEFTSREISEN_BAHN']).toBe('Kat. 6');
  });

  it('maps employee commuting to GHG Protocol Category 7', () => {
    expect(SCOPE3_GHG_PROTOCOL_CATEGORY['PENDLERVERKEHR']).toBe('Kat. 7');
  });

  it('does not contain Scope 1 or Scope 2 categories', () => {
    const scope1And2 = Object.keys(CATEGORY_SCOPE).filter(
      (cat) => CATEGORY_SCOPE[cat as keyof typeof CATEGORY_SCOPE] !== 'SCOPE3'
    );
    for (const cat of scope1And2) {
      expect(SCOPE3_GHG_PROTOCOL_CATEGORY[cat as keyof typeof SCOPE3_GHG_PROTOCOL_CATEGORY]).toBeUndefined();
    }
  });
});
