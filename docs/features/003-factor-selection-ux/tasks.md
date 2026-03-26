# Tasks: Factor Selection & Display UX (Feature 003)

## Overview

Replaces hardcoded emission factor hint strings in all six wizard screens with
live values fetched from the `EmissionFactor` database table, and adds read-only
emission factor and industry benchmark reference tables to the Settings page.

Reference: `docs/features/003-factor-selection-ux/issue-analysis.md`  
Architecture: `docs/features/003-factor-selection-ux/architecture.md`  
Test plan: `docs/features/003-factor-selection-ux/test-plan.md`

No Prisma schema changes are required for this feature (AC-1 through AC-5).

---

## Tasks

### Task 1: Add `FactorRecord` Type

**Priority:** High

**Description:**
Add the `FactorRecord` interface to `src/types/index.ts`. This type is the shared
contract used by the new `getAllEmissionFactorRecords()` lib function, the
`/api/factors` API route, the `useFactors` hook, and the `FactorHint` component.
It must be defined before any consuming code is written.

**Acceptance Criteria:**
- [ ] `FactorRecord` interface exported from `src/types/index.ts` with fields:
  `factorKg: number`, `unit: string`, `source: string`, `validYear: number`
- [ ] The type does **not** replace or merge with the existing `MethodologyFactorRow`
      type (they are separate)
- [ ] TypeScript compilation passes with no errors after the change (`npm run build`
      or `tsc --noEmit`)

**Dependencies:** None

**Notes:**
See Architecture §2 for the exact type definition. Check whether `MethodologyFactorRow`
in `src/types/index.ts` already covers this shape before adding a duplicate — if it
does, reuse it; otherwise add `FactorRecord` as a new export.

---

### Task 2: Extend `src/lib/factors.ts` with `getAllEmissionFactorRecords()`

**Priority:** High

**Description:**
Add a new exported async function `getAllEmissionFactorRecords(year: number)`
to `src/lib/factors.ts`. It fetches all distinct factor keys from the DB
(like the existing `getAllFactorsForYear()`), calls `getEmissionFactorRecord(key, year)`
for each one, and returns `Record<string, FactorRecord>`.

**Acceptance Criteria:**
- [ ] Function signature: `export async function getAllEmissionFactorRecords(year: number): Promise<Record<string, FactorRecord>>`
- [ ] Iterates all distinct keys returned by `prisma.emissionFactor.findMany({ distinct: ['key'], select: { key: true } })`
- [ ] Calls `getEmissionFactorRecord(key, year)` for each key (reuses existing fallback chain)
- [ ] Returns a map of `{ [key]: { factorKg, unit, source, validYear } }`
- [ ] Does **not** modify the existing `getAllFactorsForYear()` function (used by CO₂e calculations)
- [ ] TypeScript compilation passes (`tsc --noEmit`)

**Dependencies:** Task 1 (`FactorRecord` type)

**Notes:**
See Architecture §1. The existing `getAllFactorsForYear()` can serve as a structural
reference. The new function differs in that it calls `getEmissionFactorRecord()` (returns
full record) rather than `getEmissionFactor()` (returns only the numeric factor).

---

### Task 3: Create `GET /api/factors` Route

**Priority:** High

**Description:**
Create `src/app/api/factors/route.ts` — a new Next.js App Router API route that
exposes `getAllEmissionFactorRecords(year)` as a JSON endpoint consumed by the
`useFactors` client hook.

**Acceptance Criteria:**
- [ ] Route file exists at `src/app/api/factors/route.ts`
- [ ] `GET /api/factors?year=2024` returns HTTP 200 with `Content-Type: application/json`
      and a `Record<string, FactorRecord>` body
- [ ] Missing `year` param returns `400 { error: "year ist erforderlich" }`
- [ ] Non-numeric or unparseable `year` param returns `400 { error: "year ist erforderlich" }`
- [ ] DB error returns `500 { error: "Faktoren konnten nicht geladen werden" }`
- [ ] Response includes `Cache-Control: no-store` header (factors change on seed update)
- [ ] TypeScript compilation passes

**Dependencies:** Task 2 (`getAllEmissionFactorRecords()`)

**Notes:**
See Architecture §3 for full specification. Follow the pattern of other App Router
route files in `src/app/api/`. Use `NextResponse.json()` for responses.

---

### Task 4: Create `useFactors(year)` Custom Hook

**Priority:** High

**Description:**
Create `src/hooks/useFactors.ts` — a client-side React hook that fetches
`GET /api/factors?year={year}` once on mount and returns the factor map plus
a loading flag. All six wizard screens will import this hook.

**Acceptance Criteria:**
- [ ] Hook file exists at `src/hooks/useFactors.ts`
- [ ] Exports `useFactors(year: number): { factors: Record<string, FactorRecord>; isLoading: boolean }`
- [ ] Fetches `/api/factors?year={year}` on mount and when `year` changes
- [ ] Returns `isLoading: true` and `factors: {}` while the fetch is in flight
- [ ] On success: `isLoading: false` and `factors` populated with response body
- [ ] On network error or non-2xx response: `isLoading: false`, `factors: {}`,
      logs the error via `console.error` (does **not** throw or crash)
- [ ] TypeScript compilation passes

**Dependencies:** Task 3 (`/api/factors` endpoint)

**Notes:**
See Architecture §4. Hook should use `useEffect` + `useState`. Re-fetch if
`year` value changes (include `year` in the dependency array).

---

### Task 5: Create `FactorHint` Presentational Component

**Priority:** High

**Description:**
Create `src/components/wizard/FactorHint.tsx` — a pure presentational component
that renders a styled hint `<p>` tag from a pre-fetched factor map. This
component replaces all hardcoded factor hint `<p>` tags across the six wizard screens.

**Acceptance Criteria:**
- [ ] Component file exists at `src/components/wizard/FactorHint.tsx`
- [ ] Props interface: `factorKey: string`, `factors: Record<string, FactorRecord>`,
      `prefix?: string`, `negativeLabel?: string`
- [ ] When `factors[factorKey]` is found and `factorKg >= 0`:
      renders `<p className="text-xs text-gray-400">{prefix}Faktor: {value} kg CO₂e/{unit} ({source} {validYear})</p>`
- [ ] When `factors[factorKey]` is found and `factorKg < 0`:
      renders `<p className="text-xs text-gray-400">♻ Gutschrift: {|value|} kg CO₂e/{unit} — Recycling reduziert Ihre Bilanz! ({source} {validYear})</p>`
- [ ] When `factors[factorKey]` is **not** found (missing key or empty map):
      renders `<p className="text-xs text-gray-400">–</p>` without throwing
- [ ] Number formatted using `de-DE` locale with 3 decimal places (e.g. `2,020`)
- [ ] TypeScript compilation passes

**Dependencies:** Task 1 (`FactorRecord` type), Task 4 (`useFactors` for integration)

**Notes:**
See Architecture §5. The `–` placeholder must appear for both "loading" (empty map)
and "missing key" states — the component does not need to distinguish between them.

---

### Task 6: Update Wizard Screen 2 — Heizung & Gebäude

**Priority:** High

**Description:**
Replace all hardcoded factor hint strings in `src/components/wizard/screens/Screen2Heizung.tsx`
with the `useFactors` hook and `<FactorHint>` component.

**Acceptance Criteria:**
- [ ] `useFactors(year)` called at the top of the component (where `year` is the
      report year already available in the screen)
- [ ] All 7 hardcoded factor hint `<p>` elements replaced with `<FactorHint factorKey="..." factors={factors} />`
      (or with a `prefix` prop where a source label was previously shown)
- [ ] Factor keys used: `ERDGAS`, `HEIZOEL`, `FLUESSIGGAS`, `R410A_KAELTEMITTEL`,
      `R32_KAELTEMITTEL`, `R134A_KAELTEMITTEL`, `SONSTIGE_KAELTEMITTEL`
- [ ] No hardcoded factor value strings remain in the file
- [ ] Screen renders correctly (no TypeScript or runtime errors)

**Dependencies:** Task 4 (`useFactors`), Task 5 (`FactorHint`)

**Notes:**
See Architecture §6 key-mapping table. Keep the existing `prefix` text for source
labels (e.g. "Quelle: Gas-Jahresabrechnung.") by passing it as the `prefix` prop.

---

### Task 7: Update Wizard Screen 3 — Fuhrpark

**Priority:** High

**Description:**
Replace all hardcoded factor hints in `src/components/wizard/screens/Screen3Fuhrpark.tsx`,
including any static `fields` array or inline hint text.

**Acceptance Criteria:**
- [ ] `useFactors(year)` called at the top of the component
- [ ] All 6 hardcoded factor hint strings replaced with `<FactorHint>` calls
- [ ] Factor keys used: `DIESEL_FUHRPARK`, `BENZIN_FUHRPARK`, `PKW_BENZIN_KM`,
      `PKW_DIESEL_KM`, `TRANSPORTER_KM`, `LKW_KM`
- [ ] No hardcoded factor value strings remain
- [ ] Screen renders correctly with no TypeScript or runtime errors

**Dependencies:** Task 4 (`useFactors`), Task 5 (`FactorHint`)

**Notes:**
The static `fields` array likely renders hints via a map; replace the hint-text
property with a rendered `<FactorHint>` element. Adjust the array type if needed.

---

### Task 8: Update Wizard Screen 4 — Strom

**Priority:** High

**Description:**
Replace the `isOekostrom` ternary inline factor string in
`src/components/wizard/screens/Screen4Strom.tsx` and any `Fernwärme` hint with
dynamic `<FactorHint>` components.

**Acceptance Criteria:**
- [ ] `useFactors(year)` called at the top of the component
- [ ] The `isOekostrom` ternary string replaced with two conditional `<FactorHint>` calls:
      `<FactorHint factorKey="STROM_OEKOSTROM" ... />` when `isOekostrom` is true,
      `<FactorHint factorKey="STROM" ... />` when false
- [ ] Fernwärme hint replaced: `<FactorHint factorKey="FERNWAERME" factors={factors} />`
- [ ] No hardcoded factor value strings remain
- [ ] Screen renders correctly with no TypeScript or runtime errors

**Dependencies:** Task 4 (`useFactors`), Task 5 (`FactorHint`)

---

### Task 9: Update Wizard Screen 5 — Dienstreisen

**Priority:** High

**Description:**
Replace all 3 hardcoded factor hints in
`src/components/wizard/screens/Screen5Dienstreisen.tsx`.

**Acceptance Criteria:**
- [ ] `useFactors(year)` called at the top of the component
- [ ] All 3 hardcoded hints replaced with `<FactorHint>` calls
- [ ] Factor keys used: `GESCHAEFTSREISEN_FLUG`, `GESCHAEFTSREISEN_BAHN`,
      `PENDLERVERKEHR`
- [ ] No hardcoded factor value strings remain
- [ ] Screen renders correctly with no TypeScript or runtime errors

**Dependencies:** Task 4 (`useFactors`), Task 5 (`FactorHint`)

---

### Task 10: Update Wizard Screen 6 — Materialien

**Priority:** High

**Description:**
Replace the `MATERIAL_FACTORS` constant and all hardcoded factor hints in
`src/components/wizard/screens/Screen6Materialien.tsx` with dynamic
`<FactorHint>` components.

**Acceptance Criteria:**
- [ ] `useFactors(year)` called at the top of the component
- [ ] The `MATERIAL_FACTORS` constant (and any related type) removed entirely
- [ ] Each material row's factor hint replaced with
      `<FactorHint factorKey={row.material} factors={factors} />`
- [ ] Factor keys used (8 keys): `KUPFER`, `STAHL`, `ALUMINIUM`, `HOLZ`,
      `KUNSTSTOFF_PVC`, `BETON`, `FARBEN_LACKE`, `SONSTIGES`
- [ ] No hardcoded factor value strings remain
- [ ] Screen renders correctly with no TypeScript or runtime errors

**Dependencies:** Task 4 (`useFactors`), Task 5 (`FactorHint`)

---

### Task 11: Update Wizard Screen 7 — Abfall

**Priority:** High

**Description:**
Replace all 4 hardcoded factor hints in
`src/components/wizard/screens/Screen7Abfall.tsx`.

**Acceptance Criteria:**
- [ ] `useFactors(year)` called at the top of the component
- [ ] All 4 hardcoded hints replaced with `<FactorHint>` calls
- [ ] Factor keys used: `ABFALL_RESTMUELL`, `ABFALL_BAUSCHUTT`,
      `ABFALL_ALTMETALL`, `ABFALL_SONSTIGES`
- [ ] Negative factor (`ABFALL_ALTMETALL`) renders the ♻ Gutschrift variant
      (handled automatically by `FactorHint` when `factorKg < 0`)
- [ ] No hardcoded factor value strings remain
- [ ] Screen renders correctly with no TypeScript or runtime errors

**Dependencies:** Task 4 (`useFactors`), Task 5 (`FactorHint`)

---

### Task 12: Create `EmissionFactorsTable` Server Component

**Priority:** Medium

**Description:**
Create `src/components/settings/EmissionFactorsTable.tsx` — a server component
that renders a grouped, read-only reference table of all active emission factors
for display on the Settings page.

**Acceptance Criteria:**
- [ ] File exists at `src/components/settings/EmissionFactorsTable.tsx`
- [ ] Props: `factors: Record<string, FactorRecord>`, `year: number`
- [ ] Renders a `<table>` with columns: **Kategorie** (human label), **Faktor**
      (value + unit, de-DE formatted), **Quelle**, **Jahr**
- [ ] Rows grouped by scope: Scope 1, Scope 2, Scope 3 (using `CATEGORY_SCOPE`
      map or equivalent from `src/types/index.ts`)
- [ ] Within each group, rows sorted alphabetically by label
- [ ] Negative factors (e.g. `ABFALL_ALTMETALL`) shown in green text with a ♻ prefix
- [ ] Falls back to the raw key string for any key not found in `CATEGORY_LABELS`
- [ ] TypeScript compilation passes

**Dependencies:** Task 1 (`FactorRecord` type)

**Notes:**
See Architecture §7. This is a server component (no `'use client'` directive).
It receives pre-fetched data as props from the Settings page — no fetching inside
the component itself.

---

### Task 13: Create `IndustryBenchmarkTable` Server Component

**Priority:** Medium

**Description:**
Create `src/components/settings/IndustryBenchmarkTable.tsx` — a server component
that renders the industry benchmark reference table on the Settings page.

**Acceptance Criteria:**
- [ ] File exists at `src/components/settings/IndustryBenchmarkTable.tsx`
- [ ] Props: `benchmarks: Array<{ branche: Branche; co2ePerEmployeePerYear: number }>`
- [ ] Renders a `<table>` with columns: **Branche** (BRANCHE_LABELS lookup),
      **CO₂e/MA/Jahr** (tonnes, de-DE formatted)
- [ ] Read-only — no edit/delete affordances
- [ ] TypeScript compilation passes

**Dependencies:** None (no new types required; uses existing `Branche` enum)

**Notes:**
See Architecture §8. If `BRANCHE_LABELS` does not already exist in `src/types/index.ts`,
add a small inline label map in the component. Keep the component focused and simple.

---

### Task 14: Update Settings Page

**Priority:** Medium

**Description:**
Update `src/app/settings/page.tsx` to fetch emission factor records and industry
benchmarks server-side, and render the two new table sections.

**Acceptance Criteria:**
- [ ] `getAllEmissionFactorRecords(currentYear)` called inside the Server Component
      (direct lib call — no HTTP fetch required)
- [ ] `prisma.industryBenchmark.findMany({ orderBy: { branche: 'asc' } })` called
      to load benchmark data
- [ ] `currentYear` derived from the existing `years` array (last element, or
      `new Date().getFullYear()` as fallback)
- [ ] A new **Emissionsfaktoren** `<section>` added below the Berichtsjahre section,
      wrapping `<EmissionFactorsTable factors={factorRecords} year={currentYear} />`
- [ ] A new **Branchenvergleich (Benchmarks)** `<section>` added below that,
      wrapping `<IndustryBenchmarkTable benchmarks={benchmarks} />`
- [ ] Existing Berichtsjahre section unchanged (no regressions)
- [ ] TypeScript compilation passes

**Dependencies:** Task 2 (`getAllEmissionFactorRecords`), Task 12 (`EmissionFactorsTable`),
Task 13 (`IndustryBenchmarkTable`)

---

### Task 15: Write Unit Tests

**Priority:** High

**Description:**
Implement the 18 unit test cases defined in `docs/features/003-factor-selection-ux/test-plan.md`
across the following test files:

| Test file | Test cases |
|-----------|-----------|
| `src/lib/__tests__/factors.test.ts` | TC-01, TC-02, TC-03, TC-04 |
| `src/app/api/factors/__tests__/route.test.ts` | TC-05, TC-06, TC-07 |
| `src/components/wizard/__tests__/FactorHint.test.tsx` | TC-08, TC-09, TC-10, TC-11 |
| `src/components/settings/__tests__/EmissionFactorsTable.test.tsx` | TC-12, TC-13, TC-14 |
| `src/components/settings/__tests__/IndustryBenchmarkTable.test.tsx` | TC-15 |
| `src/hooks/__tests__/useFactors.test.ts` | TC-16, TC-17, TC-18 |

**Acceptance Criteria:**
- [ ] All 18 test cases from the test plan are implemented
- [ ] Tests follow existing patterns: Vitest, `vi.mock` for Prisma, `describe`/`it`/`expect`
- [ ] `getAllEmissionFactorRecords` tests mock `prisma.emissionFactor.findMany` and
      `getEmissionFactorRecord` (TC-01 through TC-04)
- [ ] `/api/factors` route tests mock `getAllEmissionFactorRecords` (TC-05 through TC-07)
- [ ] `FactorHint` component tests cover positive factor, missing key, loading state
      (`factors = {}`), and negative factor (TC-08 through TC-11)
- [ ] `EmissionFactorsTable` tests verify grouping by scope, negative-factor green
      styling, and key-label fallback (TC-12 through TC-14)
- [ ] `IndustryBenchmarkTable` test verifies BRANCHE_LABELS mapping (TC-15)
- [ ] `useFactors` hook tests cover success, error, and loading-state transitions
      (TC-16 through TC-18)
- [ ] `npm test` passes with all new tests green

**Dependencies:** Tasks 1–14 (all implementation tasks)

**Notes:**
`src/lib/__tests__/factors.test.ts` may already exist — add the new test cases to it
rather than creating a duplicate file. Follow the existing mock setup in that file.
For React component tests, use `@testing-library/react` if already present; otherwise
consult `docs/conventions.md`.

---

## Implementation Order

Recommended sequence based on dependencies:

1. **Task 1** — `FactorRecord` type: foundational; unblocks everything else
2. **Task 2** — `getAllEmissionFactorRecords()`: unblocks the API route and Settings page
3. **Task 3** — `/api/factors` route: unblocks the `useFactors` hook
4. **Task 4** — `useFactors` hook: unblocks all wizard screen updates
5. **Task 5** — `FactorHint` component: unblocks all wizard screen updates
6. **Tasks 6–11** — Wizard screens 2–7 (can be done in parallel; no cross-dependencies):
   - Task 6 (Screen2), Task 7 (Screen3), Task 8 (Screen4), Task 9 (Screen5),
     Task 10 (Screen6), Task 11 (Screen7)
7. **Task 12** — `EmissionFactorsTable`: requires `FactorRecord` type only
8. **Task 13** — `IndustryBenchmarkTable`: no new dependencies; can be done in parallel with Task 12
9. **Task 14** — Settings page update: requires Tasks 2, 12, 13
10. **Task 15** — Unit tests: can be written alongside implementation (TDD) or after

---

## Open Questions

None. All design decisions are resolved in `architecture.md`. No schema changes
are required. All factor keys are already seeded in the database.
