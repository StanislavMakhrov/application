# Tasks: Scope 2 Location-Based and Market-Based Calculations (Feature 002)

## Overview

Extend the GHG Protocol reporting engine to produce and display both the
location-based and the market-based Scope 2 totals as required by
GHG Protocol Corporate Standard § 6.3.

Reference: `docs/features/002-scope2-location-market-based-calculations/specification.md`

---

## Tasks

### Task 1: Extend `CO2eTotals` type

**Priority:** High

**Description:**
Add `scope2LocationBased: number` to the `CO2eTotals` interface and update
the `emptyTotals` literal in `src/app/page.tsx` that constructs it.

**Files to modify:**
- `src/types/index.ts` — add field with inline comment
- `src/app/page.tsx` — add `scope2LocationBased: 0` to `emptyTotals`

**Acceptance Criteria:**
- [x] `CO2eTotals.scope2LocationBased` exists and is typed `number`
- [x] TypeScript compilation reports no errors on affected files
- [x] `emptyTotals` in `src/app/page.tsx` includes the new field

**Dependencies:** None

---

### Task 2: Dual accumulation in `getTotalCO2e`

**Priority:** High

**Description:**
In `src/lib/emissions.ts`, introduce `scope2LocationKg` and accumulate it in
parallel with `scope2Kg`.  For STROM entries with `isOekostrom = true` a second
factor lookup is performed using `isOekostrom: false` (grid average); for all
other Scope 2 entries the location-based value equals the market-based value.

**Files to modify:**
- `src/lib/emissions.ts`

**Acceptance Criteria:**
- [x] `scope2LocationBased` is returned from `getTotalCO2e`
- [x] When `isOekostrom = false`, `scope2 === scope2LocationBased`
- [x] When `isOekostrom = true`, `scope2` uses STROM_OEKOSTROM factor; `scope2LocationBased` uses STROM factor
- [x] `total` continues to use market-based `scope2` as primary value

**Dependencies:** Task 1

---

### Task 3: PDF side-by-side comparison block

**Priority:** Medium

**Description:**
In `src/components/reports/GHGReport.tsx`, conditionally render a two-card
comparison block after the Scope 2 table when any STROM entry has
`isOekostrom = true`.  The block shows both totals, their difference in tonnes,
and a GHG Protocol § 6.3 attribution note.

**Files to modify:**
- `src/components/reports/GHGReport.tsx`

**Acceptance Criteria:**
- [x] Comparison block is rendered when `hasOekostrom = true`
- [x] Block is not rendered when no Ökostrom entry exists
- [x] Both values are shown to three decimal places in tonnes CO₂e
- [x] GHG Protocol § 6.3 is cited in the explanatory note
- [x] `scope2DifferenceTonnes` is computed as `scope2LocationBased - scope2`

**Dependencies:** Task 2

---

### Task 4: Update Ökostrom checkbox description

**Priority:** Low

**Description:**
Update the helper text under the Ökostrom checkbox in
`src/components/wizard/screens/Screen4Strom.tsx` to explain the
market-based/location-based distinction and that both values appear in the
report.

**Files to modify:**
- `src/components/wizard/screens/Screen4Strom.tsx`

**Acceptance Criteria:**
- [x] Description mentions "marktbasierten Ansatz"
- [x] Description mentions "locationbasierten Netzstrom-Durchschnitt"
- [x] Description references GHG Protocol § 6.3

**Dependencies:** None

---

### Task 5: Unit tests for dual-value logic

**Priority:** High

**Description:**
Add two new unit tests to `src/lib/__tests__/emissions.test.ts`:
1. When `isOekostrom = false` → `scope2 === scope2LocationBased`.
2. When `isOekostrom = true` → `scope2` uses Ökostrom factor; `scope2LocationBased` uses grid factor.

**Files to modify:**
- `src/lib/__tests__/emissions.test.ts`

**Acceptance Criteria:**
- [x] Test 1 passes with equal values
- [x] Test 2 passes with distinct values (0.030 t and 0.380 t for 1000 kWh)
- [x] All pre-existing tests continue to pass

**Dependencies:** Task 2
