# Test Plan: Scope 2 Location-Based and Market-Based Calculations (Feature 002)

## Overview

Tests for the dual-method Scope 2 accumulation logic in
`src/lib/emissions.ts`.  The calculation engine is async but all dependencies
are mocked via Vitest, so tests run quickly without a real database or factor
catalogue.

## Test Coverage Matrix

| Acceptance Criterion | Test Case(s) | Test Type |
|---------------------|--------------|-----------|
| SC-01 — `scope2LocationBased` always populated | TC-01, TC-02 | Unit |
| SC-02 — Equal values when `isOekostrom = false` | TC-01 | Unit |
| SC-03 — Distinct values when `isOekostrom = true` | TC-02 | Unit |
| SC-07 — `total` uses market-based scope2 | TC-02 | Unit |
| SC-08 — Existing tests unaffected | all pre-existing | Unit |

## Test Cases

### TC-01: getTotalCO2e_noOekostrom_scope2EqualsLocationBased
**Type:** Unit
**File:** `src/lib/__tests__/emissions.test.ts`
**Input:**
- One SCOPE2 / STROM entry; quantity = 1000 kWh; `isOekostrom = false`
- Mock `getEmissionFactor` → 0.380 (STROM grid factor)

**Expected:**
- `result.scope2` ≈ 0.380 t
- `result.scope2LocationBased` ≈ 0.380 t
- Both values are equal

---

### TC-02: getTotalCO2e_withOekostrom_scope2LocationBasedUsesGridFactor
**Type:** Unit
**File:** `src/lib/__tests__/emissions.test.ts`
**Input:**
- One SCOPE2 / STROM entry; quantity = 1000 kWh; `isOekostrom = true`
- Mock `getEmissionFactor` → 0.030 (STROM_OEKOSTROM, market-based), then 0.380 (STROM, location-based)

**Expected:**
- `result.scope2` ≈ 0.030 t  (market-based)
- `result.scope2LocationBased` ≈ 0.380 t  (location-based)
- `result.total` ≈ 0.030 t  (market-based used as primary)

---

## Test Data Requirements

No external test-data files needed — all inputs are constructed inline as plain
objects, consistent with the existing test suite conventions.

## Edge Cases

| Scenario | Expected Behaviour |
|----------|--------------------|
| No STROM entries at all | `scope2 = 0`, `scope2LocationBased = 0` |
| STROM entry with `isOekostrom = false` | Single factor call; both totals equal |
| STROM entry with `isOekostrom = true` | Two factor calls; market ≠ location |
| Non-STROM Scope 2 entry (e.g. FERNWAERME) | Location total = market total (no extra lookup) |

## Non-Functional Tests

None required — the logic is a simple arithmetic accumulation with at most one
extra async factor lookup per Ökostrom entry.  Performance at this scale is
not a concern.
