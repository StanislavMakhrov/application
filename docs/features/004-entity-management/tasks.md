# Tasks: Entity Management UI (Feature 004)

## Overview

This document breaks down Feature 004 (CRUD management for `EmissionFactor` and
`IndustryBenchmark`) into independently implementable tasks. The feature adds
inline-editing to the Settings page, write API routes for both entities, a Prisma
schema migration to version `IndustryBenchmark` by year, and updates the dashboard
and report to use year-accurate benchmarks.

Reference documents:
- Specification: `docs/features/004-entity-management/analysis.md`
- Architecture: `docs/features/004-entity-management/architecture.md`
- Test Plan: `docs/features/004-entity-management/test-plan.md`

---

## Tasks

### Task 1: Prisma Schema Migration — Add `validYear` to `IndustryBenchmark`

**Priority:** High

**Description:**
Add a `validYear Int @default(2024)` field to the `IndustryBenchmark` model and
change the unique constraint from `@@unique([branche])` to
`@@unique([branche, validYear])`. Run a Prisma migration to apply the change.

**Acceptance Criteria:**
- [ ] `prisma/schema.prisma` has `validYear Int @default(2024)` on `IndustryBenchmark`
- [ ] The unique constraint is `@@unique([branche, validYear])` (not `@unique` on `branche`)
- [ ] `npx prisma migrate dev --name add-valid-year-to-industry-benchmark` succeeds
- [ ] The generated migration SQL file exists under `prisma/migrations/`
- [ ] `npx prisma generate` completes without errors (updated Prisma client types)
- [ ] `npm run build` passes after the schema change

**Dependencies:** None

**Notes:**
Architecture Decision 1. The backfill strategy is to declare `Int @default(2024)` in
Prisma so the migration sets `DEFAULT 2024` on the column; existing rows receive 2024
automatically. No custom migration SQL is required.

---

### Task 2: Update Seed Script for `IndustryBenchmark`

**Priority:** High

**Description:**
Update `prisma/seed.ts` so all `industryBenchmark.upsert` calls use the new composite
unique key `{ branche_validYear: { branche, validYear: 2024 } }` and include
`validYear: 2024` in the `create` block.

**Acceptance Criteria:**
- [ ] Every `prisma.industryBenchmark.upsert` in `prisma/seed.ts` uses
  `where: { branche_validYear: { branche: '...', validYear: 2024 } }`
- [ ] Every upsert `create` block includes `validYear: 2024`
- [ ] `npm run db:seed` (or `npx prisma db seed`) completes without errors against
  a development database that has the migration from Task 1 applied
- [ ] Re-running the seed script is idempotent (no duplicate-key errors)

**Dependencies:** Task 1

**Notes:**
Architecture Note 7 provides the before/after pattern for the upsert call. All 7
benchmark rows in the seed script must be updated.

---

### Task 3: Add TypeScript Types for Editable Table Rows

**Priority:** High

**Description:**
Add two new exported interfaces to `src/types/index.ts`:
- `EmissionFactorRow` — full DB row including `id`, `key`, `validYear`, `factorKg`,
  `unit`, `source`, `scope`
- `IndustryBenchmarkRow` — full DB row including `id`, `branche`, `validYear`,
  `co2ePerEmployeePerYear`

**Acceptance Criteria:**
- [ ] `EmissionFactorRow` interface exported from `src/types/index.ts` with fields:
  `id: number`, `key: string`, `validYear: number`, `factorKg: number`,
  `unit: string`, `source: string`, `scope: Scope`
- [ ] `IndustryBenchmarkRow` interface exported from `src/types/index.ts` with fields:
  `id: number`, `branche: Branche`, `validYear: number`,
  `co2ePerEmployeePerYear: number`
- [ ] Existing `FactorRecord` interface is unchanged
- [ ] `npm run build` (TypeScript compilation) passes with the new types

**Dependencies:** Task 1 (for `Branche` enum to include the `validYear` type)

**Notes:**
Architecture Decision 4. `FactorRecord` remains untouched — it is used by
`useFactors` and `getAllEmissionFactorRecords()` throughout the wizard flow.

---

### Task 4: API — `POST /api/factors` (Create Emission Factor)

**Priority:** High

**Description:**
Add a `POST` handler to the existing `src/app/api/factors/route.ts` that creates a
new `EmissionFactor` row. Validates the request body and returns `409` if the
`(key, validYear)` combination already exists.

**Acceptance Criteria:**
- [ ] `POST /api/factors` with a valid body `{ key, validYear, factorKg, unit, source, scope }` returns HTTP 201 with the created record
- [ ] `scope` must be a valid `Scope` enum value; invalid scope returns HTTP 400 with German `{ error: "..." }`
- [ ] `factorKg` must be a finite number (negative values are allowed for recycling credits); non-finite value returns 400
- [ ] `unit` must be non-empty; missing `unit` returns 400
- [ ] Duplicate `(key, validYear)` returns HTTP 409 with German error message `'Dieser Faktor existiert bereits für dieses Jahr.'`
- [ ] Error responses use `{ error: "<German message>" }` format (consistent with existing GET handler)
- [ ] Unit tests cover: valid creation (TC-05), field validation (TC-07), and duplicate detection (TC-06, TC-08) from the test plan

**Dependencies:** Task 3

**Notes:**
Extend the existing file rather than creating a new one. The `GET` handler in this
file should remain unchanged.

---

### Task 5: API — `PUT` and `DELETE /api/factors/[id]` (Update & Delete Emission Factor)

**Priority:** High

**Description:**
Create a new file `src/app/api/factors/[id]/route.ts` exporting `PUT` and `DELETE`
handlers.

**Acceptance Criteria:**
- [ ] `PUT /api/factors/[id]` with `{ factorKg, unit, source }` updates the record and returns HTTP 200 with the updated row
- [ ] `PUT` does **not** allow updating `key`, `validYear`, or `scope` — those fields are silently ignored even if present in the body (immutability rule)
- [ ] `PUT` with a non-finite `factorKg` returns HTTP 400 with a German error message
- [ ] `PUT` for an unknown `id` returns HTTP 404
- [ ] `DELETE /api/factors/[id]` removes the row and returns HTTP 204 No Content
- [ ] `DELETE` for an unknown `id` returns HTTP 404
- [ ] Prisma `P2025` error is mapped to 404 for both handlers
- [ ] Unit tests cover: valid update (TC-01), immutable fields (TC-02), validation error (TC-03), 404 (TC-04), valid delete (TC-17), delete 404 (TC-18)

**Dependencies:** Task 3

**Notes:**
Architecture Decision 2, implementation note 5. The `[id]` param is extracted from
the Next.js route context and parsed as an integer with `parseInt`. Return 400 if
it is not a valid integer.

---

### Task 6: API — `GET` and `POST /api/benchmarks` (List & Create Benchmark)

**Priority:** High

**Description:**
Create `src/app/api/benchmarks/route.ts` exporting `GET` and `POST` handlers.

**Acceptance Criteria:**
- [ ] `GET /api/benchmarks?year=YYYY` returns HTTP 200 with an array of `IndustryBenchmarkRow` objects for the given year
- [ ] `GET /api/benchmarks` with no `year` param returns rows for the most recent year available in the database (fallback — mirrors factor endpoint behaviour)
- [ ] `POST /api/benchmarks` with `{ branche, validYear, co2ePerEmployeePerYear }` creates a new row and returns HTTP 201
- [ ] `co2ePerEmployeePerYear` must be a finite number greater than 0; invalid value returns 400
- [ ] `branche` must be a valid `Branche` enum value; invalid value returns 400
- [ ] Duplicate `(branche, validYear)` returns HTTP 409 with German error message `'Dieser Benchmark existiert bereits für dieses Jahr.'`
- [ ] Unit tests cover: list with year param (TC-09), list with no year param (TC-10), valid create (TC-14), duplicate (TC-15), validation error (TC-16)

**Dependencies:** Task 1, Task 3

**Notes:**
Architecture Decision 2 — `GET /api/benchmarks` is a new endpoint; the Settings
page Server Component previously queried Prisma directly. The response is an array
(not a map) to match `IndustryBenchmarkRow[]`.

---

### Task 7: API — `PUT /api/benchmarks/[id]` (Update Benchmark)

**Priority:** High

**Description:**
Create `src/app/api/benchmarks/[id]/route.ts` exporting a `PUT` handler.

**Acceptance Criteria:**
- [ ] `PUT /api/benchmarks/[id]` with `{ co2ePerEmployeePerYear }` updates the record and returns HTTP 200 with the updated row
- [ ] `co2ePerEmployeePerYear` must be a finite number > 0; invalid value returns 400
- [ ] Unknown `id` returns HTTP 404 (Prisma `P2025` mapped to 404)
- [ ] `branche` and `validYear` are immutable — silently ignored if sent in body
- [ ] Unit tests cover: valid update (TC-11), validation error (TC-12), 404 (TC-13)

**Dependencies:** Task 1, Task 3

**Notes:**
Architecture Decision 2. No `DELETE` for benchmarks — the set of `Branche` enum
values is fixed; deleting a row would leave a gap in the comparison card.

---

### Task 8: Update Settings Page Data Fetching

**Priority:** High

**Description:**
Update `src/app/settings/page.tsx` to fetch full `EmissionFactorRow[]` and
`IndustryBenchmarkRow[]` (including `id` fields) and pass them to the new editable
components introduced in Tasks 9 and 10.

**Acceptance Criteria:**
- [ ] The Settings page adds a `prisma.emissionFactor.findMany({ orderBy: [{ scope: 'asc' }, { key: 'asc' }] })` query that returns `EmissionFactorRow[]`
- [ ] The Settings page adds a `prisma.industryBenchmark.findMany({ orderBy: [{ branche: 'asc' }] })` query that returns `IndustryBenchmarkRow[]`
- [ ] `EmissionFactorsTableEditable` receives `EmissionFactorRow[]` as a prop (replacing the old `EmissionFactorsTable`)
- [ ] `IndustryBenchmarkTableEditable` receives `IndustryBenchmarkRow[]` as a prop (replacing the old `IndustryBenchmarkTable`)
- [ ] The existing `getAllEmissionFactorRecords()` call (used for other parts of the page) is **not** removed — it still serves other components on the page
- [ ] The Settings page still renders successfully server-side (`npm run build` passes)

**Dependencies:** Task 3, Task 9, Task 10

**Notes:**
Architecture Decision 3 and Note 2. The Settings page is an `async` Server Component
with `export const dynamic = 'force-dynamic'`. Keep that pattern unchanged. The new
queries should be added alongside the existing queries (parallel `Promise.all` or
sequential), not replacing them.

---

### Task 9: Client Component — `EmissionFactorsTableEditable`

**Priority:** High

**Description:**
Create `src/components/settings/EmissionFactorsTableEditable.tsx` as a `'use client'`
component that renders the emission factors table with inline edit, add, and delete
affordances.

**Acceptance Criteria:**
- [ ] Component accepts `initialRows: EmissionFactorRow[]` prop
- [ ] Each row displays all columns from the read-only table plus:
  - A **pencil icon** button that activates inline edit mode for `factorKg`, `unit`, and `source`
  - A **trash icon** button that calls `DELETE /api/factors/[id]` (with an inline confirmation step before deleting)
- [ ] Only **one row** is editable at a time; clicking edit on a second row cancels the first (sets `editingId` to the new row)
- [ ] The edit input for `factorKg` is `<input type="number" step="0.001">` with `de-DE` placeholder
- [ ] Rows with negative `factorKg` display the ♻ recycling indicator (consistent with the existing read-only table)
- [ ] Clicking **Speichern** calls `PUT /api/factors/[id]` and shows `toast.success('Gespeichert.')` on success
- [ ] Clicking **Abbrechen** reverts the row without API call
- [ ] Network/server errors show `toast.error('Fehler beim Speichern. Bitte erneut versuchen.')`
- [ ] A **"+ Neuer Faktor"** button at the bottom toggles an add-row form; submitting calls `POST /api/factors` and shows `toast.success('Faktor hinzugefügt.')`
- [ ] A 409 conflict on POST shows `toast.error('Dieser Faktor existiert bereits für dieses Jahr.')`
- [ ] After any successful mutation, `router.refresh()` is called to re-sync server data
- [ ] Client-side validation shows inline German error text (e.g. `'Wert muss eine Zahl sein'`) before making API calls
- [ ] Component tests cover: table renders (TC-19), edit mode toggle (TC-20), save calls PUT (TC-21), cancel reverts (TC-22), add form (TC-23), delete flow (TC-24)

**Dependencies:** Task 3, Task 4, Task 5

**Notes:**
Architecture Decisions 3, 5, 6. Follow the `YearManagement` and `FirmenprofilSettings`
patterns for state management and `router.refresh()` usage. The `isSaving` flag should
disable the Save button during the fetch to prevent double-submission.

---

### Task 10: Client Component — `IndustryBenchmarkTableEditable`

**Priority:** High

**Description:**
Create `src/components/settings/IndustryBenchmarkTableEditable.tsx` as a `'use client'`
component that renders the industry benchmark table with inline edit affordance.

**Acceptance Criteria:**
- [ ] Component accepts `initialRows: IndustryBenchmarkRow[]` prop
- [ ] Each row displays `branche`, `validYear`, and `co2ePerEmployeePerYear` columns plus a **pencil icon** button
- [ ] Clicking the pencil icon activates inline edit mode for `co2ePerEmployeePerYear` only; `branche` and `validYear` remain read-only
- [ ] The edit input is `<input type="number" step="0.01">` with `de-DE` placeholder
- [ ] Only one row editable at a time (same single-edit-at-a-time rule as Task 9)
- [ ] Clicking **Speichern** calls `PUT /api/benchmarks/[id]` and shows `toast.success('Gespeichert.')` on success
- [ ] Clicking **Abbrechen** reverts the row without API call
- [ ] Network/server errors show `toast.error('Fehler beim Speichern. Bitte erneut versuchen.')`
- [ ] Client-side validation: `co2ePerEmployeePerYear` must be > 0; shows German inline error text before API call
- [ ] After successful save, `router.refresh()` is called
- [ ] No add or delete buttons (set of branches is fixed by the Prisma enum)
- [ ] Component tests cover: table renders (TC-25), edit mode toggle (TC-26), save calls PUT (TC-27), cancel reverts (TC-28)

**Dependencies:** Task 3, Task 7

**Notes:**
Architecture Decisions 3, 5, 6. Same `useState` + `router.refresh()` pattern as Task 9.

---

### Task 11: Update Dashboard Benchmark Lookup to Filter by Year

**Priority:** Medium

**Description:**
Update `src/app/page.tsx` so the benchmark lookup filters by `validYear` matching
the selected reporting year (with a fallback to the most recent year if no exact
match exists).

**Acceptance Criteria:**
- [ ] `prisma.industryBenchmark.findFirst` in `src/app/page.tsx` uses
  `where: { branche, validYear: selectedYear }` (where `selectedYear` is the
  currently selected reporting year passed to the dashboard)
- [ ] A fallback query runs if the exact year is not found: re-query with
  `orderBy: { validYear: 'desc' }` and no `validYear` filter, returning the most
  recent benchmark row
- [ ] The `BranchenvergleichCard` on the dashboard displays the benchmark value for
  the selected reporting year (or the most recent available if not found)
- [ ] The dashboard still renders without errors when no benchmark row exists at all
  (e.g. handle `null` result gracefully)
- [ ] `npm run build` passes after the change

**Dependencies:** Task 1

**Notes:**
Architecture Note 6. The existing `findFirst({ where: { branche } })` call does not
filter by year. This task makes the benchmark comparison year-accurate.

---

### Task 12: Update Report Benchmark Lookup to Filter by Year

**Priority:** Medium

**Description:**
Update `src/app/api/report/route.ts` so the benchmark lookup used in PDF generation
filters by `validYear` matching the report's year, with the same fallback strategy
as Task 11.

**Acceptance Criteria:**
- [ ] `prisma.industryBenchmark.findFirst` in `src/app/api/report/route.ts` uses
  `where: { branche, validYear: reportYear }` (where `reportYear` is derived from
  the report's date range)
- [ ] The same fallback strategy (most recent year) is applied if no exact match
- [ ] Generated PDF reports show the benchmark value for the correct year
- [ ] `npm run build` passes after the change

**Dependencies:** Task 1

**Notes:**
Architecture component table row for `src/app/api/report/route.ts`. The fallback
ensures PDF generation does not break for older reports that pre-date the new
benchmarks.

---

## Implementation Order

Recommended sequence for implementation:

1. **Task 1** — Schema migration first; everything else depends on the new `validYear`
   field existing in the database and Prisma client
2. **Task 2** — Seed script immediately after migration so the development database
   can be re-seeded with valid data for all subsequent tasks
3. **Task 3** — TypeScript types needed by all API handlers and components
4. **Task 4** — `POST /api/factors` (simpler — extends existing file; no new route params)
5. **Task 5** — `PUT/DELETE /api/factors/[id]` (new file; slightly more complex)
6. **Task 6** — `GET/POST /api/benchmarks` (new file)
7. **Task 7** — `PUT /api/benchmarks/[id]` (new file, simplest benchmark mutation)
8. **Task 9** — `EmissionFactorsTableEditable` (can be developed in parallel with Task 10
   once Tasks 4 & 5 are done)
9. **Task 10** — `IndustryBenchmarkTableEditable` (can be developed in parallel with Task 9
   once Tasks 6 & 7 are done)
10. **Task 8** — Settings page wiring (depends on both new components being ready)
11. **Task 11** — Dashboard benchmark year-filter (independent once Task 1 is done;
    can be done any time after the migration)
12. **Task 12** — Report benchmark year-filter (same independence as Task 11)

Tasks 11 and 12 can be worked alongside Tasks 4–7 since they only require the
schema migration (Task 1) to be complete.

---

## Open Questions

1. **`GET /api/benchmarks` with no `year` param** — The architecture says "return
   the most recent year available". Should this return 400 instead if no year is
   provided? The test plan (TC-10) expects a fallback, but the QA team flagged this
   as an open question. Current decision: fall back to most-recent year (consistent
   with factor endpoint behaviour).

2. **`POST /api/factors` key validation** — Should `key` be validated against existing
   `EmissionFactor` keys (i.e. restricted to keys already present in the DB) or can
   operators introduce completely new keys? The QA team flagged this as open. Current
   decision: allow any non-empty string key (operators may legitimately add custom
   factors not in the original seed set).

3. **Negative `factorKg` in add form** — The architecture explicitly allows negative
   `factorKg` for recycling credits. The add form should not show an error for negative
   values. The client-side validation rule should be `isFinite(value)` only (not `> 0`).
   This differs from the benchmark rule (`> 0`). Developer must implement accordingly.
