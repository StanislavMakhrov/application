# Tasks: Methodology Summary

## Overview

This document breaks the **Methodology Summary** feature into ordered, independently
testable implementation tasks. The feature adds a structured "Methodik & Datenqualität"
section to every generated GHG Protocol PDF report, assembled automatically from existing
database records at report-generation time.

Reference documents:
- Specification: `docs/features/002-methodology-summary/specification.md`
- Architecture: `docs/features/002-methodology-summary/architecture.md`
- Test Plan: `docs/features/002-methodology-summary/test-plan.md`

---

## Tasks

### Task 1: Add Methodology Types to `src/types/index.ts`

**Priority:** High

**Description:**
Add three new exported TypeScript interfaces to `src/types/index.ts` to represent
the methodology data structures that will flow from the backend assembly function
through the API route to the GHGReport component.

The interfaces to add:

```typescript
export interface MethodologyFactorRow {
  categoryKey: string;
  categoryLabel: string;
  scope: Scope;
  factorKg: number | null;
  unit: string;
  source: string | null;
  validYear: number | null;
}

export interface MethodologyQualityRow {
  categoryKey: string;
  categoryLabel: string;
  inputMethod: InputMethod;
}

export interface MethodologyData {
  standard: string;
  scopesIncluded: Scope[];
  factorRows: MethodologyFactorRow[];
  qualityRows: MethodologyQualityRow[];
  boundaryNotes: string | null;
  exclusions: string | null;
}
```

**Acceptance Criteria:**
- [x] `MethodologyFactorRow` interface is exported from `src/types/index.ts` with all fields exactly matching the architecture spec (§1)
- [x] `MethodologyQualityRow` interface is exported from `src/types/index.ts` with all fields exactly matching the architecture spec (§1)
- [x] `MethodologyData` interface is exported from `src/types/index.ts` with all fields exactly matching the architecture spec (§1)
- [x] All fields use existing types (`Scope`, `InputMethod`) that are already defined in the same file — no new type imports required
- [x] `factorKg`, `source`, and `validYear` on `MethodologyFactorRow` are nullable (`| null`) to support graceful degradation when a factor is missing
- [x] TypeScript compilation succeeds with no new type errors (`npm run build` passes)

**Dependencies:** None

**Notes:**
These types are pure TypeScript with no runtime logic. They can be added as a new
section at the end of `src/types/index.ts` under a comment `// === Methodology ===`.

---

### Task 2: Add `getEmissionFactorRecord()` to `src/lib/factors.ts`

**Priority:** High

**Description:**
Add a new exported function `getEmissionFactorRecord(key, year)` to `src/lib/factors.ts`.
This function mirrors the fallback logic of the existing `getEmissionFactor()` function
but returns the **full factor record** (factorKg, unit, source, validYear) rather than
just the numeric value. This is needed by `assembleMethodologyData()` to populate the
factor table rows.

Signature:
```typescript
export async function getEmissionFactorRecord(
  key: string,
  year: number
): Promise<{ factorKg: number; unit: string; source: string; validYear: number } | null>
```

The implementation should follow the same three-step fallback chain as `getEmissionFactor()`:
1. Exact year match (`findUnique`)
2. Most recent at or before requested year (`findFirst`, `validYear lte year`, `orderBy validYear desc`)
3. Earliest year newer than requested year (`findFirst`, `validYear gt year`, `orderBy validYear asc`)
4. Return `null` if nothing found

**Acceptance Criteria:**
- [x] `getEmissionFactorRecord` is exported from `src/lib/factors.ts`
- [x] Returns `{ factorKg, unit, source, validYear }` when an exact year match exists (TC-14)
- [x] Returns the most-recent-year record when no exact match exists (TC-15)
- [x] Returns `null` when no factor exists for the key at any year (TC-16)
- [x] TC-14, TC-15, and TC-16 from the test plan are implemented in `src/lib/__tests__/factors.test.ts` and pass
- [x] The existing `getEmissionFactor` tests continue to pass (no regressions)
- [x] TypeScript compilation succeeds

**Dependencies:** Task 1 (for type imports in subsequent tasks, though this task itself does not import new types)

**Notes:**
The function can reuse the same Prisma query pattern as `getEmissionFactor()` — just
select all required fields instead of returning `factorKg` alone. The return type is
an inline object type (not a separate interface) to keep it close to the Prisma model.

---

### Task 3: Create `src/lib/methodology.ts` with `assembleMethodologyData()`

**Priority:** High

**Description:**
Create the new file `src/lib/methodology.ts` containing the `assembleMethodologyData()`
function. This is the core business logic of the feature. The function fetches emission
and material entries for a reporting year, looks up full factor records, and assembles
a `MethodologyData` object.

Function signature:
```typescript
export async function assembleMethodologyData(
  yearId: number,
  year: number,
  profile: { reportingBoundaryNotes?: string | null; exclusions?: string | null }
): Promise<MethodologyData>
```

Assembly logic (in order):
1. Fetch `EmissionEntry` records for `yearId` — apply `isFinalAnnual` logic identical
   to `getTotalCO2e()` (if a `isFinalAnnual: true` row exists for a category, skip all
   `isFinalAnnual: false` rows for that category).
2. Fetch `MaterialEntry` records for `yearId`. Materials are always `SCOPE3`.
3. For each unique category key from emission entries and material entries:
   - Call `getEmissionFactorRecord(key, year)` to get the full factor record.
   - If `null`, create the row with `factorKg: null`, `source: null`, `validYear: null`,
     `unit: CATEGORY_UNITS[key] ?? MATERIAL_UNITS[key] ?? '—'`.
   - Set `categoryLabel` from `CATEGORY_LABELS[key]` (emission) or `MATERIAL_LABELS[key]`
     (material).
   - Determine `scope`: from entry's `.scope` field for emission entries, hardcode `SCOPE3`
     for material entries.
   - Determine `inputMethod` for the quality row. If multiple entries exist for a category
     (after `isFinalAnnual` filtering), use priority `OCR > CSV > MANUAL`.
4. Deduplicate scopes from all entries into `scopesIncluded`.
5. Return the complete `MethodologyData` object with `standard: 'GHG Protocol Corporate Standard'`.

**Acceptance Criteria:**
- [x] New file `src/lib/methodology.ts` exists with `assembleMethodologyData` exported
- [x] `result.standard` is always `'GHG Protocol Corporate Standard'` (TC-01)
- [x] Single entry returns a correct `factorRows` entry with all fields populated (TC-02)
- [x] Only categories with recorded entries appear in `factorRows` — no phantom rows (TC-03)
- [x] `qualityRows` entries reflect `inputMethod` from entries (TC-04, TC-05)
- [x] `boundaryNotes` and `exclusions` are passed through from the `profile` argument (TC-06, TC-07)
- [x] `scopesIncluded` is deduplicated across all entries (TC-08)
- [x] Missing factor (`getEmissionFactorRecord` returns `null`) produces null-value row without throwing (TC-09)
- [x] `isFinalAnnual: true` row suppresses all `isFinalAnnual: false` rows for the same category (TC-10)
- [x] `OCR > CSV > MANUAL` input method priority is applied when a category has multiple entries (TC-11)
- [x] Empty entries return empty `factorRows`, `qualityRows`, `scopesIncluded`; `standard` is still set (TC-12)
- [x] `MaterialEntry` rows appear in `factorRows` and `qualityRows` with `scope: 'SCOPE3'` (TC-13)
- [x] All 13 TC-01–TC-13 unit tests in `src/lib/__tests__/methodology.test.ts` are implemented and pass
- [x] TypeScript compilation succeeds

**Dependencies:** Task 1 (types), Task 2 (`getEmissionFactorRecord`)

**Notes:**
- Follow the exact same mocking pattern as `src/lib/__tests__/emissions.test.ts` for the
  test file (mock `../prisma` and `../factors`).
- `MaterialEntry` does not have a `scope` column in the Prisma schema — always use
  `'SCOPE3'` for material rows (see architecture §3, TC-13).
- For material units, use a `MATERIAL_UNITS` lookup map if one exists in `src/types/index.ts`;
  otherwise define an inline map within the function. Check the existing types file first.
- Refer to `src/lib/emissions.ts` for the `isFinalAnnual` filtering pattern to replicate.

---

### Task 4: Update API Route to Call `assembleMethodologyData()`

**Priority:** High

**Description:**
Update `src/app/api/report/route.ts` to call `assembleMethodologyData()` in the
`GHG_PROTOCOL` branch and pass the result as a new `methodology` prop to `GHGReport`.

Changes required:
1. Import `assembleMethodologyData` from `@/lib/methodology`.
2. Inside the `GHG_PROTOCOL` branch, after fetching `profile` and `reportingYear`,
   call:
   ```typescript
   const methodology = await assembleMethodologyData(yearId, reportingYear.year, profile);
   ```
3. Pass `methodology` to `React.createElement(GHGReport, { ..., methodology })`.
4. Do **not** call `assembleMethodologyData` in the `CSRD_QUESTIONNAIRE` branch.

**Acceptance Criteria:**
- [x] `assembleMethodologyData` is imported and called in the `GHG_PROTOCOL` branch
- [x] The `methodology` value is passed as a prop to `GHGReport`
- [x] `assembleMethodologyData` is NOT called in the `CSRD_QUESTIONNAIRE` branch (TC-17)
- [x] The API route still compiles and returns a valid PDF for GHG Protocol reports
- [x] The API route still compiles and returns a valid PDF for CSRD Questionnaire reports
- [x] TypeScript compilation succeeds with no type errors

**Dependencies:** Task 1 (types), Task 3 (`assembleMethodologyData`)

**Notes:**
- TC-17 (asserting `assembleMethodologyData` is not called for CSRD reports) can be
  validated manually by confirming the CSRD branch of the route handler does not contain
  the call, or by a unit test if a route test file exists. If no route unit test file
  exists, this criterion is verified via manual code inspection and UAT.

---

### Task 5: Add Methodology Page to `GHGReport` Component

**Priority:** High

**Description:**
Update `src/components/reports/GHGReport.tsx` to:
1. Accept the new `methodology?: MethodologyData` optional prop.
2. Add a new `<Page>` at the end of the `<Document>` that renders the
   "Methodik & Datenqualität" section — only when `methodology` is provided.
3. Remove the existing static "Methodik" paragraph from the materials page (its
   content is superseded by the new dedicated page).

The new methodology `<Page>` renders four sub-sections (in order):

**Sub-section 1 — Standard & Scope Coverage:**
A short introductory paragraph citing `'GHG Protocol Corporate Standard'` and listing
`methodology.scopesIncluded` in human-readable German (Scope 1, Scope 2, Scope 3).

**Sub-section 2 — Emission Factor Table:**
A table with columns: `Kategorie | Scope | Faktor (kg CO₂e/Einheit) | Einheit | Quelle | Jahr`.
One row per entry in `methodology.factorRows`. Rows with `factorKg: null` render `–`
for the factor value and `Faktor nicht gefunden` for the source. Rows with `validYear: null`
render `–` for the year.

**Sub-section 3 — Data Quality Table:**
A table with columns: `Kategorie | Eingabemethode`.
One row per entry in `methodology.qualityRows`. InputMethod values are rendered as:
- `MANUAL` → `Manuell`
- `OCR` → `OCR (Rechnung)`
- `CSV` → `CSV-Import`

**Sub-section 4 — Assumptions & Reporting Boundaries:**
Displays `methodology.boundaryNotes` and `methodology.exclusions`. If both are `null`
or empty, renders the placeholder text: `"Keine benutzerdefinierten Annahmen eingetragen."`.

**Acceptance Criteria:**
- [x] `GHGReportProps` includes `methodology?: MethodologyData` (optional prop, backward compatible)
- [x] A new `<Page>` is rendered at the end of the `<Document>` when `methodology` is provided
- [x] New page is NOT rendered when `methodology` prop is absent
- [x] Sub-section 1 (Standard & Scope) is present on the methodology page
- [x] Sub-section 2 (Factor Table) displays all rows from `methodology.factorRows`, with `–` / `Faktor nicht gefunden` for null-value rows
- [x] Sub-section 3 (Data Quality Table) displays all rows from `methodology.qualityRows` with correct German labels for each `InputMethod`
- [x] Sub-section 4 (Assumptions) displays boundary notes and exclusions, or the placeholder if both are null
- [x] The existing static "Methodik" paragraph is removed from the materials page
- [x] The component uses existing `styles` from the `StyleSheet.create({...})` call for layout consistency; new styles are added to the same `StyleSheet.create` block if needed
- [x] If adding the methodology page causes `GHGReport.tsx` to exceed 300 lines (per `docs/conventions.md`), the methodology page is extracted to `src/components/reports/GHGReportMethodologyPage.tsx`
- [x] TypeScript compilation succeeds with no type errors
- [x] The existing GHG Protocol PDF layout (page 1, materials page) is not visually broken

**Dependencies:** Task 1 (types), Task 4 (API route passes the prop)

**Notes:**
- The `methodology` prop is optional (`?`) to maintain backward compatibility with any
  existing tests or rendering paths that do not yet provide this prop.
- Scope label mapping: `SCOPE1` → `Scope 1`, `SCOPE2` → `Scope 2`, `SCOPE3` → `Scope 3`.
- Reuse `tableHeader`, `tableRow`, `tableRowAlt`, `tableHeaderCell`, `tableCell`,
  `sectionTitle`, and `boundaryBox` styles that are already present in the component.
- The 300-line limit check should be done after all changes are applied.

---

## Implementation Order

Recommended sequence based on dependencies:

1. **Task 1** — Add types to `src/types/index.ts`
   _Foundational; all other tasks depend on these interfaces. No runtime risk._

2. **Task 2** — Add `getEmissionFactorRecord()` to `src/lib/factors.ts`
   _Self-contained helper with independent tests. Unblocks Task 3._

3. **Task 3** — Create `src/lib/methodology.ts`
   _Core business logic. Depends on Task 1 and Task 2. Write and verify tests before proceeding._

4. **Task 4** — Update API route
   _Wire the new function into the request handler. Depends on Task 3._

5. **Task 5** — Update `GHGReport` component
   _Pure rendering change. Depends on Task 1 (prop type) and Task 4 (prop flows from API)._

---

## Open Questions

1. **Material units** — `src/types/index.ts` has `CATEGORY_UNITS` for emission categories
   but no equivalent `MATERIAL_UNITS` map. The developer should check whether one exists
   elsewhere or define an inline map in `assembleMethodologyData()` for material categories
   (e.g., `KUPFER`, `STAHL` → `'kg'`).

2. **TC-17 test location** — No existing unit test file for `src/app/api/report/route.ts`
   was found. TC-17 (asserting CSRD branch does not call `assembleMethodologyData`) can
   be validated via manual code inspection or deferred to the UAT test plan as noted in
   the test plan open questions.

3. **Page placement** — The specification notes the methodology section should appear on
   "page 2 or a new final page". The architecture recommends a new final page (after the
   materials page). The developer should confirm with a layout test and use the final-page
   approach unless content volume makes page 2 preferable.
