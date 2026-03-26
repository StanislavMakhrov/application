# Test Plan: Factor Selection & Display UX (Feature 003)

## Overview

This test plan covers the dynamic emission factor display feature, which replaces
hardcoded factor hints in all six wizard screens with live values fetched from the
`EmissionFactor` database table, and adds read-only emission factor and industry
benchmark tables to the Settings page.

Reference: `docs/features/003-factor-selection-ux/issue-analysis.md`.
Architecture: `docs/features/003-factor-selection-ux/architecture.md`.

---

## Test Coverage Matrix

| Acceptance Criterion | Test Case(s) | Test Type |
|---|---|---|
| AC-1: Every wizard factor hint is loaded dynamically from DB | TC-01 – TC-04 | Unit (lib) |
| AC-1: All 30+ factor keys are returned by the new function | TC-02 | Unit (lib) |
| AC-2: Factor displayed matches factor used in CO₂e calculation | TC-01, TC-03 | Unit (lib) |
| AC-3: Settings page lists all factors as a read-only table | TC-12 – TC-14 | Unit (component) |
| AC-4: IndustryBenchmark values visible on Settings page | TC-15 | Unit (component) |
| AC-5: Factor display degrades gracefully when no factor found | TC-08, TC-10 | Unit (component) |
| `GET /api/factors` returns JSON factor map for valid year | TC-05 | Unit (route) |
| `GET /api/factors` returns 400 for missing year param | TC-06 | Unit (route) |
| `GET /api/factors` returns 400 for non-numeric year param | TC-07 | Unit (route) |
| `FactorHint` renders correct text with valid factor | TC-08 | Unit (component) |
| `FactorHint` renders placeholder when factor is missing | TC-09 | Unit (component) |
| `FactorHint` renders placeholder while loading | TC-10 | Unit (component) |
| `FactorHint` renders negative factor as Gutschrift | TC-11 | Unit (component) |
| `useFactors` hook fetches and returns factor map | TC-16 | Unit (hook) |
| `useFactors` hook handles fetch error gracefully | TC-17 | Unit (hook) |
| `useFactors` hook sets isLoading during fetch | TC-18 | Unit (hook) |

---

## User Acceptance Scenarios

> **Purpose**: For this user-facing feature (wizard screen hints, new Settings sections),
> the following scenarios guide manual Maintainer review of the running app.

### Scenario 1: Wizard Factor Hints Are Live

**User Goal**: Confirm that factor hints beneath input fields show real values from the
database, not static text.

**Test Steps**:
1. Run: `docker run --rm -p 3000:3000 ghcr.io/<owner>/<repo>:pr-<N>-<sha>`
2. Navigate to `/wizard/2` (Heizung & Gebäude).
3. Observe the hint text beneath the **Erdgas** input field.
4. Navigate to `/wizard/3` (Fuhrpark), `/wizard/4` (Strom), `/wizard/5`
   (Dienstreisen), `/wizard/6` (Materialien), `/wizard/7` (Abfall) and observe
   the hints on each screen.

**Expected Output**:
- Each hint reads e.g. `Faktor: 2,020 kg CO₂e/m³ (UBA Datenbericht 2024 2024)`.
- The numeric value matches the value stored in the `EmissionFactor` table for
  that key and reporting year (visible under Settings → Emissionsfaktoren).
- No hardcoded or mismatched values (e.g. old `2,000` vs DB `2,020`).

**Success Criteria**:
- [ ] Wizard screens display dynamic factor hints loaded from the database
- [ ] Hints are not blank or broken (no JavaScript errors in browser console)
- [ ] Values are formatted in `de-DE` locale (comma as decimal separator)
- [ ] Source and year are included in each hint

---

### Scenario 2: Settings Page Shows Emission Factors Table

**User Goal**: Verify that the Settings page lists all active emission factors as a
readable reference table.

**Test Steps**:
1. Navigate to `/settings`.
2. Scroll to the **Emissionsfaktoren** section.
3. Inspect the table rows.

**Expected Output**:
- A table with columns: Kategorie, Faktor (kg CO₂e/Einheit), Quelle, Jahr.
- At least 30 rows, one per seeded factor key.
- Rows are grouped by Scope (Scope 1, Scope 2, Scope 3).
- Negative factors (e.g. ABFALL_ALTMETALL) are shown in green with a ♻ prefix.
- A **Branchenvergleich** table with benchmark CO₂e per employee per year appears
  below the emission factors table.

**Success Criteria**:
- [ ] Emissionsfaktoren section is visible on Settings page
- [ ] All seeded factor keys appear as rows
- [ ] Branchenvergleich section is visible with benchmark rows
- [ ] No UI regression in existing Settings sections (Berichtsjahre)

---

### Scenario 3: Graceful Degradation on Factor Load Failure

**User Goal**: Confirm that if the `/api/factors` endpoint is unavailable, wizard
screens degrade gracefully without crashing.

**Test Steps**:
1. Navigate directly to `/wizard/2`.
2. (This scenario is more practical to test via unit tests — see TC-10. For manual
   verification, one can temporarily disable the API route or block the network
   request in browser DevTools.)
3. Verify the hint shows `–` placeholder instead of throwing an error.

**Expected Output**:
- Wizard screen remains fully functional (inputs work, form can be submitted).
- Factor hints show `–` rather than crashing or showing undefined.

**Success Criteria**:
- [ ] Wizard is usable even when factor API fails
- [ ] No JavaScript exceptions thrown to the browser console

---

## Test Cases

### TC-01: `getAllEmissionFactorRecords_exactYearMatch_returnsFullRecordMap`

**Type:** Unit (lib)

**Description:**
Verifies that `getAllEmissionFactorRecords(year)` returns a `Record<string, FactorRecord>`
containing all factor keys when exact-year records are available.

**Preconditions:**
- `prisma.emissionFactor.findMany` mocked to return a list of distinct keys.
- `getEmissionFactorRecord` mocked to return a valid `FactorRecord` for each key.

**Test Steps:**
1. Mock `prisma.emissionFactor.findMany` to return `[{ key: 'ERDGAS' }, { key: 'STROM' }]`.
2. Mock `getEmissionFactorRecord('ERDGAS', 2024)` to return
   `{ factorKg: 2.02, unit: 'm³', source: 'UBA 2024', validYear: 2024 }`.
3. Mock `getEmissionFactorRecord('STROM', 2024)` to return
   `{ factorKg: 0.434, unit: 'kWh', source: 'UBA 2024', validYear: 2024 }`.
4. Call `getAllEmissionFactorRecords(2024)`.
5. Assert the result equals the expected map.

**Expected Result:**
```json
{
  "ERDGAS": { "factorKg": 2.02, "unit": "m³", "source": "UBA 2024", "validYear": 2024 },
  "STROM":  { "factorKg": 0.434, "unit": "kWh", "source": "UBA 2024", "validYear": 2024 }
}
```

**Test Data:** Inline mocked values.

---

### TC-02: `getAllEmissionFactorRecords_allSeedKeys_returnsAtLeast30Keys`

**Type:** Unit (lib)

**Description:**
Verifies that when all 30 seeded distinct factor keys exist, the result map contains
exactly 30 entries. Ensures no key is silently dropped.

**Preconditions:**
- `prisma.emissionFactor.findMany` mocked to return 30 distinct key objects.
- `getEmissionFactorRecord` mocked to return a valid record for each key.

**Test Steps:**
1. Mock `prisma.emissionFactor.findMany` to return an array of 30 `{ key }` objects.
2. Mock `getEmissionFactorRecord` to return a fixed factor record for any key.
3. Call `getAllEmissionFactorRecords(2024)`.
4. Assert `Object.keys(result).length === 30`.

**Expected Result:** The result map has exactly 30 keys.

**Test Data:** 30 synthetic key strings.

---

### TC-03: `getAllEmissionFactorRecords_yearFallback_usesLatestAvailableYear`

**Type:** Unit (lib)

**Description:**
Verifies that when no exact year match exists, `getAllEmissionFactorRecords` still
returns a record for a key using the year-fallback chain (delegates to
`getEmissionFactorRecord` which already handles fallbacks).

**Preconditions:**
- `prisma.emissionFactor.findMany` returns `[{ key: 'ERDGAS' }]`.
- `getEmissionFactorRecord('ERDGAS', 2025)` returns the 2024 fallback record.

**Test Steps:**
1. Mock `prisma.emissionFactor.findMany` to return `[{ key: 'ERDGAS' }]`.
2. Mock `getEmissionFactorRecord('ERDGAS', 2025)` to return
   `{ factorKg: 2.02, unit: 'm³', source: 'UBA 2024', validYear: 2024 }`.
3. Call `getAllEmissionFactorRecords(2025)`.
4. Assert result `ERDGAS.validYear === 2024` (confirming fallback was used).

**Expected Result:** `{ ERDGAS: { factorKg: 2.02, unit: 'm³', source: 'UBA 2024', validYear: 2024 } }`

**Test Data:** Inline mocked values.

---

### TC-04: `getAllEmissionFactorRecords_missingKey_omitsKeyFromResult`

**Type:** Unit (lib)

**Description:**
Verifies that keys for which `getEmissionFactorRecord` returns `null` are silently
omitted from the result map (no undefined entries, no crash).

**Preconditions:**
- `prisma.emissionFactor.findMany` returns `[{ key: 'ERDGAS' }, { key: 'UNKNOWN' }]`.
- `getEmissionFactorRecord('ERDGAS', 2024)` returns a valid record.
- `getEmissionFactorRecord('UNKNOWN', 2024)` returns `null`.

**Test Steps:**
1. Mock as described above.
2. Call `getAllEmissionFactorRecords(2024)`.
3. Assert `result` has only `ERDGAS` — `UNKNOWN` is absent.

**Expected Result:** `{ ERDGAS: { ... } }` — no `UNKNOWN` key.

**Test Data:** Inline mocked values.

---

### TC-05: `GET /api/factors_validYear_returns200WithFactorMap`

**Type:** Unit (route)

**Description:**
Verifies that `GET /api/factors?year=2024` returns HTTP 200 with a JSON body
containing a factor key map.

**Preconditions:**
- `getAllEmissionFactorRecords` is mocked (or the entire `lib/factors` module is mocked).
- Mock returns `{ ERDGAS: { factorKg: 2.02, unit: 'm³', source: 'UBA 2024', validYear: 2024 } }`.

**Test Steps:**
1. Construct a `NextRequest` with `?year=2024`.
2. Call the route handler `GET(request)`.
3. Assert response status is `200`.
4. Parse JSON body; assert it contains the expected factor record for `ERDGAS`.

**Expected Result:** `200 OK` with body `{ "ERDGAS": { "factorKg": 2.02, ... } }`.

**Test Data:** Inline mocked values.

---

### TC-06: `GET /api/factors_missingYearParam_returns400`

**Type:** Unit (route)

**Description:**
Verifies that `GET /api/factors` (no `year` param) returns HTTP 400 with a
German-language error message.

**Preconditions:** None (no DB mocking needed).

**Test Steps:**
1. Construct a `NextRequest` with no query params.
2. Call the route handler `GET(request)`.
3. Assert response status is `400`.
4. Parse JSON body; assert `error` field equals `"year ist erforderlich"`.

**Expected Result:** `400 Bad Request` with `{ "error": "year ist erforderlich" }`.

**Test Data:** N/A.

---

### TC-07: `GET /api/factors_nonNumericYear_returns400`

**Type:** Unit (route)

**Description:**
Verifies that `GET /api/factors?year=abc` (non-numeric `year`) returns HTTP 400.

**Preconditions:** None.

**Test Steps:**
1. Construct a `NextRequest` with `?year=abc`.
2. Call the route handler `GET(request)`.
3. Assert response status is `400`.

**Expected Result:** `400 Bad Request`.

**Test Data:** N/A.

---

### TC-08: `FactorHint_withValidFactor_rendersFormattedHintText`

**Type:** Unit (component)

**Description:**
Verifies that `<FactorHint>` renders the complete factor hint string when a valid
factor record is present in the `factors` map.

**Preconditions:**
- `factors` prop contains `ERDGAS: { factorKg: 2.02, unit: 'm³', source: 'UBA 2024', validYear: 2024 }`.
- `factorKey` prop is `"ERDGAS"`.

**Test Steps:**
1. Render `<FactorHint factorKey="ERDGAS" factors={factors} />` using React Testing Library.
2. Assert the rendered text contains `"2,020"` (de-DE 3dp formatting of 2.02).
3. Assert the rendered text contains `"kg CO₂e/m³"`.
4. Assert the rendered text contains `"UBA Datenbericht"` and `"2024"`.

**Expected Result:** Component renders hint text with de-DE locale formatting, unit,
source, and year. No error is thrown.

**Test Data:**
```ts
const factors = { ERDGAS: { factorKg: 2.02, unit: 'm³', source: 'UBA Datenbericht', validYear: 2024 } };
```

---

### TC-09: `FactorHint_withMissingKey_rendersDashPlaceholder`

**Type:** Unit (component)

**Description:**
Verifies that `<FactorHint>` renders a `–` placeholder when the requested
`factorKey` is not present in the `factors` map.

**Preconditions:**
- `factors` prop is an empty object `{}`.
- `factorKey` prop is `"ERDGAS"`.

**Test Steps:**
1. Render `<FactorHint factorKey="ERDGAS" factors={{}} />`.
2. Assert the rendered text is `"–"`.
3. Assert no error is thrown.

**Expected Result:** Component renders `–` without crashing.

**Test Data:** `factors = {}`.

---

### TC-10: `FactorHint_whileLoading_rendersDashPlaceholder`

**Type:** Unit (component)

**Description:**
Verifies that `<FactorHint>` renders a `–` placeholder when `factors` is an empty
object (as returned by `useFactors` while `isLoading` is `true`).

**Preconditions:**
- `factors` prop is `{}` (simulating the initial loading state from `useFactors`).

**Test Steps:**
1. Render `<FactorHint factorKey="STROM" factors={{}} />`.
2. Assert the rendered text is `"–"`.

**Expected Result:** Component renders `–` placeholder during the loading state.

**Test Data:** `factors = {}`.

---

### TC-11: `FactorHint_withNegativeFactor_rendersGutschriftText`

**Type:** Unit (component)

**Description:**
Verifies that `<FactorHint>` renders the recycling credit (Gutschrift) format for
negative factor values.

**Preconditions:**
- `factors` prop contains `ABFALL_ALTMETALL` with a negative `factorKg`.

**Test Steps:**
1. Render `<FactorHint factorKey="ABFALL_ALTMETALL" factors={factors} />`.
2. Assert the rendered text contains `"Gutschrift"` (or `"♻"` prefix).
3. Assert the rendered text contains the absolute value formatted in de-DE locale.

**Expected Result:** Component renders the Gutschrift format with ♻ prefix.

**Test Data:**
```ts
const factors = {
  ABFALL_ALTMETALL: { factorKg: -0.142, unit: 'kg', source: 'UBA 2024', validYear: 2024 }
};
```

---

### TC-12: `FactorHint_withPrefix_rendersPrefixBeforeFactorText`

**Type:** Unit (component)

**Description:**
Verifies that the optional `prefix` prop is prepended to the hint text.

**Preconditions:**
- `factors` prop contains `ERDGAS`.
- `prefix` prop is `"Quelle: Gas-Jahresabrechnung. "`.

**Test Steps:**
1. Render `<FactorHint factorKey="ERDGAS" factors={factors} prefix="Quelle: Gas-Jahresabrechnung. " />`.
2. Assert the rendered text starts with `"Quelle: Gas-Jahresabrechnung."`.
3. Assert the factor string follows the prefix.

**Expected Result:** Prefix appears before the factor hint text.

**Test Data:**
```ts
const factors = { ERDGAS: { factorKg: 2.02, unit: 'm³', source: 'UBA 2024', validYear: 2024 } };
```

---

### TC-13: `EmissionFactorsTable_withFactorMap_rendersAllRows`

**Type:** Unit (component)

**Description:**
Verifies that `<EmissionFactorsTable>` renders one table row per entry in the
`factors` map.

**Preconditions:**
- `factors` prop contains 3 factor entries with different scope groups.
- `year` prop is `2024`.

**Test Steps:**
1. Render `<EmissionFactorsTable factors={factors} year={2024} />`.
2. Assert the table contains 3 data rows (one per factor).
3. Assert each row contains the factor key label, formatted `factorKg`, unit,
   source, and `validYear`.

**Expected Result:** Table with 3 rows, each with correct data.

**Test Data:**
```ts
const factors = {
  ERDGAS:  { factorKg: 2.02,  unit: 'm³',  source: 'UBA 2024', validYear: 2024 },
  STROM:   { factorKg: 0.434, unit: 'kWh', source: 'UBA 2024', validYear: 2024 },
  ABFALL_ALTMETALL: { factorKg: -0.142, unit: 'kg', source: 'UBA 2024', validYear: 2024 },
};
```

---

### TC-14: `EmissionFactorsTable_emptyFactorMap_rendersNoRows`

**Type:** Unit (component)

**Description:**
Verifies that `<EmissionFactorsTable>` renders an empty table (no data rows) and
does not crash when given an empty `factors` map.

**Preconditions:**
- `factors` prop is `{}`.
- `year` prop is `2024`.

**Test Steps:**
1. Render `<EmissionFactorsTable factors={{}} year={2024} />`.
2. Assert no data rows are rendered.
3. Assert no error is thrown.

**Expected Result:** Component renders without crashing; table body is empty.

**Test Data:** `factors = {}`.

---

### TC-15: `IndustryBenchmarkTable_withBenchmarks_rendersAllRows`

**Type:** Unit (component)

**Description:**
Verifies that `<IndustryBenchmarkTable>` renders one row per benchmark entry.

**Preconditions:**
- `benchmarks` prop contains 2 `IndustryBenchmark` objects.

**Test Steps:**
1. Render `<IndustryBenchmarkTable benchmarks={benchmarks} />`.
2. Assert 2 data rows are rendered.
3. Assert each row contains the `branche` label and the formatted
   `co2ePerEmployeePerYear` value.

**Expected Result:** Table with 2 rows, each correctly labelled.

**Test Data:**
```ts
const benchmarks = [
  { branche: 'PRODUKTION', co2ePerEmployeePerYear: 12.5 },
  { branche: 'DIENSTLEISTUNG', co2ePerEmployeePerYear: 4.2 },
];
```

---

### TC-16: `useFactors_onMount_fetchesAndReturnsFlatFactorMap`

**Type:** Unit (hook)

**Description:**
Verifies that `useFactors(year)` calls `GET /api/factors?year=<year>` on mount and
sets `factors` to the parsed JSON response when the fetch succeeds.

**Preconditions:**
- `global.fetch` is mocked to return `{ ok: true, json: () => Promise.resolve({ ERDGAS: { ... } }) }`.

**Test Steps:**
1. Mock `fetch` to return a successful response with one factor entry.
2. Render a test component that calls `useFactors(2024)` and displays the result.
3. Wait for the hook to settle.
4. Assert `factors.ERDGAS` equals the mocked value.
5. Assert `isLoading` is `false` after settling.

**Expected Result:** `factors` contains the mocked data; `isLoading` is `false`.

**Test Data:** Inline mocked fetch response.

---

### TC-17: `useFactors_onFetchError_returnsEmptyFactorsAndDoesNotThrow`

**Type:** Unit (hook)

**Description:**
Verifies that `useFactors` returns `{}` for `factors` and `false` for `isLoading`
when the fetch returns a non-2xx response, without throwing.

**Preconditions:**
- `global.fetch` is mocked to return `{ ok: false, status: 500 }`.

**Test Steps:**
1. Mock `fetch` to return `{ ok: false, status: 500 }`.
2. Render a test component using `useFactors(2024)`.
3. Wait for the hook to settle.
4. Assert `factors` equals `{}`.
5. Assert `isLoading` equals `false`.
6. Assert no uncaught exception was thrown.

**Expected Result:** `factors = {}`, `isLoading = false`. No crash.

**Test Data:** Inline mocked fetch failure.

---

### TC-18: `useFactors_initialState_isLoadingTrueAndFactorsEmpty`

**Type:** Unit (hook)

**Description:**
Verifies that `useFactors` has `isLoading = true` and `factors = {}` during the
initial render before the fetch resolves.

**Preconditions:**
- `global.fetch` is mocked with a `Promise` that never resolves (pending).

**Test Steps:**
1. Mock `fetch` with a never-resolving Promise.
2. Render a test component using `useFactors(2024)`.
3. Synchronously inspect state immediately after first render.
4. Assert `isLoading` is `true`.
5. Assert `factors` equals `{}`.

**Expected Result:** Initial state has `isLoading = true`, `factors = {}`.

**Test Data:** `fetch` mock: `() => new Promise(() => {})`.

---

## Test Data Requirements

No new test data files are required. All tests use inline mocked values via Vitest's
`vi.mock()` / `vi.fn()` and React Testing Library.

The following mock shapes are reused across multiple tests:

```ts
// Standard valid factor record
const MOCK_ERDGAS_FACTOR = {
  factorKg: 2.02, unit: 'm³', source: 'UBA Datenbericht 2024', validYear: 2024
};

// Negative / credit factor
const MOCK_ALTMETALL_FACTOR = {
  factorKg: -0.142, unit: 'kg', source: 'UBA Datenbericht 2024', validYear: 2024
};
```

---

## Edge Cases

| Scenario | Expected Behaviour | Test Case |
|---|---|---|
| `getAllEmissionFactorRecords` with year before any seeded data | Uses forward-fallback; keys still present | TC-03 |
| Key not in DB for any year (`getEmissionFactorRecord` → null) | Key is omitted from result map | TC-04 |
| `GET /api/factors` with no `year` query param | Returns 400 with German error | TC-06 |
| `GET /api/factors` with `year=abc` (non-numeric) | Returns 400 | TC-07 |
| `<FactorHint>` with empty `factors` map | Renders `–` placeholder | TC-09 |
| `<FactorHint>` before fetch completes (`isLoading = true`) | Renders `–` placeholder | TC-10 |
| `<FactorHint>` for a negative credit factor | Renders Gutschrift format with ♻ | TC-11 |
| `<EmissionFactorsTable>` with empty factors | Renders without crash | TC-14 |
| `useFactors` fetch returns 500 | `factors = {}`, no crash | TC-17 |
| `useFactors` network failure (fetch throws) | `factors = {}`, no crash | TC-17 |

---

## Non-Functional Tests

### Number Formatting

- All factor values must be formatted using the `de-DE` locale with 3 decimal
  places (e.g. `2,020` for `2.02`, `0,434` for `0.434`). This is verified
  implicitly in TC-08 and TC-13 by asserting the exact string `"2,020"` is present.

### Cache Headers

- `GET /api/factors` must respond with `Cache-Control: no-store` so that factor
  updates after a DB seed refresh are immediately visible. This can be asserted in
  TC-05 by checking `response.headers.get('Cache-Control') === 'no-store'`.

---

## Test File Locations

Following existing project conventions (tests co-located in `src/lib/__tests__/`
and alongside source files):

| Test File | Test Cases |
|---|---|
| `src/lib/__tests__/factors.test.ts` | TC-01 – TC-04 (append to existing file) |
| `src/app/api/factors/__tests__/route.test.ts` | TC-05 – TC-07 |
| `src/components/wizard/__tests__/FactorHint.test.tsx` | TC-08 – TC-12 |
| `src/components/settings/__tests__/EmissionFactorsTable.test.tsx` | TC-13 – TC-14 |
| `src/components/settings/__tests__/IndustryBenchmarkTable.test.tsx` | TC-15 |
| `src/hooks/__tests__/useFactors.test.ts` | TC-16 – TC-18 |

---

## Open Questions

None. All acceptance criteria are well-defined in the issue analysis, and the
architecture document specifies exact API contracts, hook behaviour, and
component render rules.
