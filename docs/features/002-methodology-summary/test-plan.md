# Test Plan: Methodology Summary

## Overview

This test plan covers the automated testing for the **Methodology Summary** feature
(spec: `docs/features/002-methodology-summary/specification.md`). The feature adds a
structured "Methodik & Datenqualität" section to every generated GHG Protocol PDF report,
assembled automatically from existing database records at report-generation time.

The primary unit under test is `assembleMethodologyData()` in `src/lib/methodology.ts`,
plus the `getEmissionFactorRecord()` helper in `src/lib/factors.ts`. Tests follow the
established pattern in `src/lib/__tests__/emissions.test.ts` and
`src/lib/__tests__/factors.test.ts` — mock Prisma, assert behaviour.

---

## Test Coverage Matrix

| Acceptance Criterion | Test Case(s) | Test Type |
|---|---|---|
| Methodology block states GHG Protocol Corporate Standard | TC-01 | Unit |
| Factor table lists factor value, unit, source, validYear for recorded categories | TC-02 | Unit |
| Factor table omits categories with no recorded entry | TC-03 | Unit |
| Data quality table shows inputMethod per recorded category | TC-04, TC-05 | Unit |
| Boundary notes and exclusions from CompanyProfile are included | TC-06 | Unit |
| Placeholder text when no boundary notes entered | TC-07 | Unit |
| `scopesIncluded` reflects scopes with at least one entry | TC-08 | Unit |
| Missing factor → row renders `–` gracefully, no crash | TC-09 | Unit |
| `isFinalAnnual` logic: monthly rows skipped when final-annual row exists | TC-10 | Unit |
| InputMethod priority: `OCR > CSV > MANUAL` across multiple entries | TC-11 | Unit |
| Empty entries: returns empty arrays, `scopesIncluded: []` | TC-12 | Unit |
| MaterialEntries included in factor and quality rows | TC-13 | Unit |
| `getEmissionFactorRecord` returns full record (key, factorKg, unit, source, validYear) | TC-14 | Unit |
| `getEmissionFactorRecord` falls back to most-recent year | TC-15 | Unit |
| `getEmissionFactorRecord` returns null when no factor exists | TC-16 | Unit |
| CSRD Questionnaire report is unchanged | TC-17 | Unit (API route) |
| Report generation does not fail when methodology data is partially unavailable | TC-09 | Unit |

---

## Test Cases

### TC-01: `assembleMethodologyData_standard_returnsGHGProtocolStandard`

**Type:** Unit — `src/lib/methodology.ts`

**Description:**
Verifies that the returned `MethodologyData.standard` field is always set to
`"GHG Protocol Corporate Standard"` regardless of the input entries.

**Preconditions:**
- Prisma `emissionEntry.findMany` returns one entry.
- Prisma `materialEntry.findMany` returns an empty array.
- `getEmissionFactorRecord` returns a valid record.

**Test Steps:**
1. Mock Prisma and `getEmissionFactorRecord` with minimal data.
2. Call `assembleMethodologyData(yearId, 2024, profile)`.
3. Assert `result.standard === 'GHG Protocol Corporate Standard'`.

**Expected Result:**
`result.standard` equals `"GHG Protocol Corporate Standard"`.

---

### TC-02: `assembleMethodologyData_singleEntry_returnsCorrectFactorRow`

**Type:** Unit — `src/lib/methodology.ts`

**Description:**
When one `EmissionEntry` exists for `ERDGAS`, the returned `factorRows` contains
exactly one row with the correct `categoryKey`, `categoryLabel`, `scope`, `factorKg`,
`unit`, `source`, and `validYear` values from the mocked factor record.

**Preconditions:**
- One `EmissionEntry`: `{ category: 'ERDGAS', scope: 'SCOPE1', quantity: 1000, inputMethod: 'MANUAL', isFinalAnnual: false }`.
- `getEmissionFactorRecord('ERDGAS', 2024)` returns `{ factorKg: 2.02, unit: 'm³', source: 'UBA Datenbericht 2024', validYear: 2024 }`.

**Test Steps:**
1. Mock Prisma and `getEmissionFactorRecord`.
2. Call `assembleMethodologyData(1, 2024, {})`.
3. Assert `result.factorRows.length === 1`.
4. Assert `result.factorRows[0]` matches expected values.

**Expected Result:**
```json
{
  "categoryKey": "ERDGAS",
  "scope": "SCOPE1",
  "factorKg": 2.02,
  "unit": "m³",
  "source": "UBA Datenbericht 2024",
  "validYear": 2024
}
```

---

### TC-03: `assembleMethodologyData_multipleEntries_onlyRecordedCategoriesInFactorRows`

**Type:** Unit — `src/lib/methodology.ts`

**Description:**
Only categories with at least one recorded `EmissionEntry` or `MaterialEntry` appear in
`factorRows`. Categories that have no entry at all must not appear.

**Preconditions:**
- Two `EmissionEntry` rows for two distinct categories (`ERDGAS`, `STROM`).
- No `MaterialEntry` rows.

**Test Steps:**
1. Mock Prisma and `getEmissionFactorRecord` for the two categories.
2. Call `assembleMethodologyData`.
3. Assert `result.factorRows.length === 2`.
4. Assert no rows for any other category.

**Expected Result:**
`factorRows` contains exactly two entries — one for `ERDGAS` and one for `STROM`.

---

### TC-04: `assembleMethodologyData_singleManualEntry_returnsManualQualityRow`

**Type:** Unit — `src/lib/methodology.ts`

**Description:**
A single `EmissionEntry` with `inputMethod: 'MANUAL'` produces a `qualityRows` entry
with `inputMethod: 'MANUAL'`.

**Preconditions:**
- One `EmissionEntry`: `{ category: 'STROM', inputMethod: 'MANUAL' }`.

**Test Steps:**
1. Mock Prisma with one MANUAL entry.
2. Call `assembleMethodologyData`.
3. Assert `result.qualityRows[0].inputMethod === 'MANUAL'`.

**Expected Result:**
`qualityRows` contains one row with `inputMethod: 'MANUAL'`.

---

### TC-05: `assembleMethodologyData_singleOcrEntry_returnsOcrQualityRow`

**Type:** Unit — `src/lib/methodology.ts`

**Description:**
A single `EmissionEntry` with `inputMethod: 'OCR'` produces a `qualityRows` entry
with `inputMethod: 'OCR'`.

**Preconditions:**
- One `EmissionEntry`: `{ category: 'ERDGAS', inputMethod: 'OCR' }`.

**Test Steps:**
1. Mock Prisma with one OCR entry.
2. Call `assembleMethodologyData`.
3. Assert `result.qualityRows[0].inputMethod === 'OCR'`.

**Expected Result:**
`qualityRows` contains one row with `inputMethod: 'OCR'`.

---

### TC-06: `assembleMethodologyData_profileWithBoundaryNotes_includesBoundaryData`

**Type:** Unit — `src/lib/methodology.ts`

**Description:**
`MethodologyData.boundaryNotes` and `.exclusions` are taken directly from the
`profile` argument passed to `assembleMethodologyData`.

**Preconditions:**
- `profile = { reportingBoundaryNotes: 'Includes all DE sites', exclusions: 'Excludes foreign subsidiaries' }`.

**Test Steps:**
1. Call `assembleMethodologyData(1, 2024, profile)` with minimal entry mocks.
2. Assert `result.boundaryNotes === 'Includes all DE sites'`.
3. Assert `result.exclusions === 'Excludes foreign subsidiaries'`.

**Expected Result:**
Both fields are passed through unchanged.

---

### TC-07: `assembleMethodologyData_profileWithNullBoundaryNotes_returnsNull`

**Type:** Unit — `src/lib/methodology.ts`

**Description:**
When `profile.reportingBoundaryNotes` and `profile.exclusions` are both `null`,
`boundaryNotes` and `exclusions` are `null` in the result (the component renders
the placeholder text).

**Preconditions:**
- `profile = { reportingBoundaryNotes: null, exclusions: null }`.

**Test Steps:**
1. Call `assembleMethodologyData` with `profile` as above.
2. Assert `result.boundaryNotes === null`.
3. Assert `result.exclusions === null`.

**Expected Result:**
Both fields are `null`.

---

### TC-08: `assembleMethodologyData_mixedScopes_scopesIncludedIsDeduped`

**Type:** Unit — `src/lib/methodology.ts`

**Description:**
`scopesIncluded` contains exactly the set of scopes that have at least one entry,
without duplicates, even when multiple entries share the same scope.

**Preconditions:**
- Three `EmissionEntry` rows: two `SCOPE1` entries and one `SCOPE2` entry.

**Test Steps:**
1. Mock Prisma with the three entries.
2. Call `assembleMethodologyData`.
3. Assert `result.scopesIncluded` contains exactly `['SCOPE1', 'SCOPE2']` (in any order).
4. Assert `result.scopesIncluded` does not contain `SCOPE3`.

**Expected Result:**
`scopesIncluded` is `['SCOPE1', 'SCOPE2']` (no duplicates, no missing scopes).

---

### TC-09: `assembleMethodologyData_missingFactor_rowHasNullValues`

**Type:** Unit — `src/lib/methodology.ts`

**Description:**
When `getEmissionFactorRecord` returns `null` for a category (factor not in DB),
the corresponding `factorRows` entry has `factorKg: null`, `source: null`, and
`validYear: null` — and `assembleMethodologyData` does NOT throw.

**Preconditions:**
- One `EmissionEntry` for `UNKNOWN_CATEGORY`.
- `getEmissionFactorRecord('UNKNOWN_CATEGORY', 2024)` returns `null`.

**Test Steps:**
1. Mock `getEmissionFactorRecord` to return `null`.
2. Call `assembleMethodologyData`. Expect no exception.
3. Assert `result.factorRows[0].factorKg === null`.
4. Assert `result.factorRows[0].source === null`.
5. Assert `result.factorRows[0].validYear === null`.

**Expected Result:**
Function completes successfully; factor row contains `null` placeholders.

---

### TC-10: `assembleMethodologyData_isFinalAnnual_monthlyRowsSkipped`

**Type:** Unit — `src/lib/methodology.ts`

**Description:**
When a category has both a `isFinalAnnual: true` entry and multiple
`isFinalAnnual: false` (monthly) entries, only the final-annual entry is used
for the quality row (one `qualityRows` row per category, not one per monthly entry).
The `factorRows` also contains only one row for that category.

**Preconditions:**
- `EmissionEntry` rows for `STROM`:
  - `{ isFinalAnnual: true, inputMethod: 'MANUAL', quantity: 12000 }`
  - `{ isFinalAnnual: false, inputMethod: 'OCR', billingMonth: '2024-01', quantity: 1000 }`
  - `{ isFinalAnnual: false, inputMethod: 'OCR', billingMonth: '2024-02', quantity: 1050 }`

**Test Steps:**
1. Mock Prisma with the three entries above.
2. Call `assembleMethodologyData`.
3. Assert `result.factorRows.length === 1` (only one row for STROM).
4. Assert `result.qualityRows.length === 1`.
5. Assert `result.qualityRows[0].inputMethod` equals the inputMethod of the final-annual row (`'MANUAL'`).

**Expected Result:**
Monthly rows are ignored; only the `isFinalAnnual: true` row contributes to the
methodology output for this category.

---

### TC-11: `assembleMethodologyData_inputMethodPriority_ocrWinsOverManual`

**Type:** Unit — `src/lib/methodology.ts`

**Description:**
When a category has multiple entries with different `inputMethod` values (e.g., both
`OCR` and `MANUAL`), the resulting `qualityRows` entry uses the highest-priority
method: `OCR > CSV > MANUAL`.

**Sub-cases:**

| Entries | Expected `inputMethod` |
|---|---|
| `['OCR', 'MANUAL']` | `'OCR'` |
| `['CSV', 'MANUAL']` | `'CSV'` |
| `['OCR', 'CSV', 'MANUAL']` | `'OCR'` |
| `['MANUAL', 'MANUAL']` | `'MANUAL'` |

**Preconditions:**
- Multiple `EmissionEntry` rows for the same category, each with `isFinalAnnual: false`
  (no final-annual row, so all monthly rows are aggregated).

**Test Steps (per sub-case):**
1. Mock Prisma with the entries for that sub-case.
2. Call `assembleMethodologyData`.
3. Assert `result.qualityRows[0].inputMethod` matches the expected value.

**Expected Result:**
`OCR > CSV > MANUAL` priority is respected.

---

### TC-12: `assembleMethodologyData_noEntries_returnsEmptyArraysAndNoScopes`

**Type:** Unit — `src/lib/methodology.ts`

**Description:**
When both `emissionEntry.findMany` and `materialEntry.findMany` return empty arrays,
the result has empty `factorRows`, empty `qualityRows`, and an empty `scopesIncluded`.

**Preconditions:**
- `prisma.emissionEntry.findMany` returns `[]`.
- `prisma.materialEntry.findMany` returns `[]`.

**Test Steps:**
1. Call `assembleMethodologyData(1, 2024, {})`.
2. Assert `result.factorRows.length === 0`.
3. Assert `result.qualityRows.length === 0`.
4. Assert `result.scopesIncluded.length === 0`.
5. Assert `result.standard === 'GHG Protocol Corporate Standard'` (always set).

**Expected Result:**
All collection fields are empty; `standard` is still set.

---

### TC-13: `assembleMethodologyData_materialEntries_includedInFactorAndQualityRows`

**Type:** Unit — `src/lib/methodology.ts`

**Description:**
`MaterialEntry` rows (Scope 3, materials categories) also produce entries in
`factorRows` and `qualityRows`, just like `EmissionEntry` rows.

**Preconditions:**
- `prisma.emissionEntry.findMany` returns `[]`.
- `prisma.materialEntry.findMany` returns one entry:
  `{ material: 'KUPFER', quantityKg: 480, inputMethod: 'CSV' }`.
- `getEmissionFactorRecord('KUPFER', 2024)` returns a valid record.

**Test Steps:**
1. Mock Prisma and `getEmissionFactorRecord`.
2. Call `assembleMethodologyData`.
3. Assert `result.factorRows.length === 1` with `categoryKey: 'KUPFER'`.
4. Assert `result.qualityRows[0].inputMethod === 'CSV'`.
5. Assert `result.scopesIncluded` contains `'SCOPE3'`.

**Expected Result:**
`MaterialEntry` data appears in methodology output with `SCOPE3`.

---

### TC-14: `getEmissionFactorRecord_exactYear_returnsFullRecord`

**Type:** Unit — `src/lib/factors.ts`

**Description:**
`getEmissionFactorRecord` returns all fields (`factorKg`, `unit`, `source`,
`validYear`) when an exact year match exists in the database.

**Preconditions:**
- `prisma.emissionFactor.findUnique` returns a full record for `ERDGAS`/2024.

**Test Steps:**
1. Mock `prisma.emissionFactor.findUnique` to return
   `{ factorKg: 2.02, unit: 'm³', source: 'UBA Datenbericht 2024', validYear: 2024 }`.
2. Call `getEmissionFactorRecord('ERDGAS', 2024)`.
3. Assert all four fields match.

**Expected Result:**
`{ factorKg: 2.02, unit: 'm³', source: 'UBA Datenbericht 2024', validYear: 2024 }`.

---

### TC-15: `getEmissionFactorRecord_yearFallback_returnsMostRecentRecord`

**Type:** Unit — `src/lib/factors.ts`

**Description:**
When no exact year match exists, `getEmissionFactorRecord` falls back to the most
recent factor at or before the requested year, returning the full record.

**Preconditions:**
- `prisma.emissionFactor.findUnique` returns `null` for year 2025.
- `prisma.emissionFactor.findFirst` returns the 2024 record.

**Test Steps:**
1. Mock Prisma accordingly.
2. Call `getEmissionFactorRecord('STROM', 2025)`.
3. Assert the returned `validYear === 2024` (the fallback year).
4. Assert all other fields are from the 2024 record.

**Expected Result:**
Returns the 2024 record with `validYear: 2024`.

---

### TC-16: `getEmissionFactorRecord_noFactorExists_returnsNull`

**Type:** Unit — `src/lib/factors.ts`

**Description:**
When the database has no factor for the given key at any year,
`getEmissionFactorRecord` returns `null`.

**Preconditions:**
- `prisma.emissionFactor.findUnique` returns `null`.
- `prisma.emissionFactor.findFirst` returns `null` for both backward and forward
  fallback queries.

**Test Steps:**
1. Mock Prisma to return `null` for all queries.
2. Call `getEmissionFactorRecord('NONEXISTENT', 2024)`.
3. Assert the return value is `null`.

**Expected Result:**
`null` is returned.

---

### TC-17: `apiRoute_csrdReport_doesNotCallAssembleMethodologyData`

**Type:** Unit — `src/app/api/report/route.ts`

**Description:**
`assembleMethodologyData` must NOT be called when the report type is
`CSRD_QUESTIONNAIRE`. The CSRD report branch remains unchanged.

**Preconditions:**
- Mock `assembleMethodologyData` as a spy.
- Request parameters: `type=CSRD_QUESTIONNAIRE`.

**Test Steps:**
1. Call the report API route with `type=CSRD_QUESTIONNAIRE`.
2. Assert `assembleMethodologyData` was NOT called.

**Expected Result:**
`assembleMethodologyData` call count is 0 for CSRD requests.

---

## Test Data Requirements

No new test data files are needed. All test cases use inline mocked data via
`vi.fn()` following the pattern established in `emissions.test.ts` and
`factors.test.ts`.

---

## Edge Cases

| Scenario | Expected Behavior | Test Case |
|---|---|---|
| Factor not found for a category | Row renders `factorKg: null`, `source: null` — no crash | TC-09 |
| `isFinalAnnual: true` entry present | Monthly entries for same category are ignored | TC-10 |
| Multiple entries with mixed inputMethods | `OCR > CSV > MANUAL` priority applied | TC-11 |
| No entries at all | Empty arrays returned, `standard` still set | TC-12 |
| Only MaterialEntries (no EmissionEntries) | MaterialEntries appear in both rows, scope is `SCOPE3` | TC-13 |
| Both boundary notes fields null | `boundaryNotes: null`, `exclusions: null` | TC-07 |
| Same scope appears in many entries | `scopesIncluded` deduplicated | TC-08 |
| Factor lookup year has no exact match | Falls back to most recent year's record | TC-15 |
| Factor key unknown in DB at any year | `getEmissionFactorRecord` returns `null` | TC-16 |
| CSRD report type | `assembleMethodologyData` is never called | TC-17 |

---

## Non-Functional Tests

### Performance

Report generation must remain under 3 seconds (existing requirement). The
methodology assembly adds N factor lookups (one per unique category). Given the
maximum category count is < 25, no new performance test is required — the
existing end-to-end timing covered by CI is sufficient. If a performance
regression is detected, the Developer should convert the per-category
`getEmissionFactorRecord()` calls into a single batched query.

---

## Test File Location

All unit tests for `assembleMethodologyData` and `getEmissionFactorRecord` are in:

```
src/lib/__tests__/methodology.test.ts   ← new file (assembleMethodologyData)
src/lib/__tests__/factors.test.ts       ← extend with TC-14, TC-15, TC-16
```

Tests for the API route assertion (TC-17) may be added to an existing API route
test file if one exists, or deferred to the E2E UAT test plan.

---

## Open Questions

1. **TC-17 (API route)** — If no existing unit test file covers
   `src/app/api/report/route.ts`, TC-17 can be validated via the UAT test plan
   (manual inspection of the CSRD report PDF to confirm it is unchanged).
2. **MaterialEntry scope field** — `MaterialEntry` does not have a `scope` column
   in the schema (materials are always Scope 3). The assembly function should
   hard-code `SCOPE3` for all material rows. The test in TC-13 should assert this.
