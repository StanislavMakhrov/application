# Issue Analysis: Entity Management UI

**Feature:** `004-entity-management`
**Original Report:** "it is not clear how to manage Emissionsfaktoren and how to get
actual Branchenvergleich (Benchmarks)"
**Analyst:** Issue Analyst
**Date:** 2025-07-14

---

## Problem Description

The Settings page (`/settings`) renders two **read-only** tables —
`EmissionFactorsTable` and `IndustryBenchmarkTable` — that were introduced in
Feature 003. Users can *see* the current values but have **no way to add, edit,
or delete** records in either table through the application UI.

This means:

1. When UBA releases updated emission factors (e.g. for reporting year 2025),
   the operator must SSH into the container and re-run `npm run db:seed` or edit
   the database directly.
2. When the operator wants to refine an industry benchmark value (e.g. because
   their specific trade association publishes more accurate figures), there is no
   self-service path to do so.
3. The `IndustryBenchmark` table has **no year field**, so there is no way to
   store separate benchmark values for 2023, 2024, 2025 — the single row per
   `branche` is overwritten each time the seed script runs.
4. There is no `GET /api/benchmarks` endpoint and no write endpoint for either
   entity, so even a technically capable operator cannot use the API to manage
   these values without direct database access.

---

## Steps to Reproduce

1. Navigate to `/settings`.
2. Scroll to the **Emissionsfaktoren** section — note the read-only table with
   no edit, add, or delete controls.
3. Scroll to the **Branchenvergleich (Benchmarks)** section — same: read-only
   table, no controls.
4. Observe that there is no button or link anywhere in the app to modify these
   values.
5. Check `src/app/api/factors/route.ts` — only `GET` is exported; no `POST`,
   `PUT`, or `DELETE`.
6. Confirm that no `/api/benchmarks` route exists at all.

---

## Expected Behavior

- Operators should be able to **add new emission factor rows** (e.g. a full set
  of UBA 2025 factors) via the Settings page without touching the database or
  re-running seed scripts.
- Operators should be able to **edit the numeric value** of an existing factor
  (correcting a data entry error, applying a supplier-specific value) and see
  the updated value reflected immediately in wizard hints and CO₂e calculations.
- Operators should be able to **edit benchmark values** for each industry (e.g.
  update the `co2ePerEmployeePerYear` figure for `BAUGEWERBE` from 18.7 to 21.3
  when a new trade-association study is published).
- Ideally, benchmark values should be **year-versioned** so the dashboard shows
  the benchmark appropriate for the selected reporting year.

---

## Actual Behavior

- Both `EmissionFactor` and `IndustryBenchmark` tables are read-only in the UI.
- The only write path is `npm run db:seed` (overwrites all values with hardcoded
  defaults) or direct PostgreSQL access (requires container shell access).
- The `IndustryBenchmark` model stores a single row per `branche` with no year
  context — there is no way to version benchmark data.
- The `GET /api/factors?year=YYYY` endpoint is the only factor API route; no
  mutation methods exist.

---

## Root Cause Analysis

### Affected Components

| File / Entity | Gap |
|---|---|
| `src/app/api/factors/route.ts` | Only implements `GET`; no `POST`, `PUT`, `DELETE` |
| `src/app/api/benchmarks/` | Does not exist — no API route at all for benchmarks |
| `src/components/settings/EmissionFactorsTable.tsx` | Read-only display, no edit affordance |
| `src/components/settings/IndustryBenchmarkTable.tsx` | Read-only display, no edit affordance |
| `src/app/settings/page.tsx` | Sections for both entities are informational only |
| `prisma/schema.prisma` — `IndustryBenchmark` | No `validYear` field; one row per branche, not versioned |
| `prisma/seed.ts` | Only write path for both entities; must be re-run to update |

### What's Broken

#### 1. No write API for `EmissionFactor`

`GET /api/factors?year=YYYY` was added in Feature 003 for the wizard's
`useFactors` hook. No `POST /api/factors` (create), `PUT /api/factors/:id`
(update), or `DELETE /api/factors/:id` (delete) route was ever implemented.

#### 2. No API at all for `IndustryBenchmark`

The `IndustryBenchmarkTable` component reads data passed from the Settings page
Server Component (direct `prisma.industryBenchmark.findMany()`). There is no
`/api/benchmarks` route — not even a read route.

#### 3. `IndustryBenchmark` has no year dimension

The Prisma model is:
```prisma
model IndustryBenchmark {
  id                    Int     @id @default(autoincrement())
  branche               Branche @unique
  co2ePerEmployeePerYear Float
}
```
`branche` is `@unique` — only one benchmark value per industry is possible. The
dashboard benchmark card (`BranchenvergleichCard`) and the PDF report both use
the same single value regardless of which reporting year is selected. There is no
way to show "the 2023 benchmark was 14.2 t/MA; the 2024 benchmark is 15.1 t/MA".

#### 4. Seed script is the only update mechanism

`prisma/seed.ts` uses `upsert` (on the `branche` key for benchmarks, on
`key_validYear` for factors). Running `npm run db:seed` completely resets both
tables to the hardcoded defaults. A human operator with container access can run
this, but there is no self-service UI.

### Why It Happened

Feature 003 was scoped to **read transparency** — showing factor values in the
wizard and a reference table in Settings. The issue analysis for 003 explicitly
deferred "an 'Edit' affordance for power users" to a later feature. Feature 004
is that later feature.

The `IndustryBenchmark` model was designed as a static lookup table (one value
per industry) seeded from aggregate Handwerk sector statistics. Year-versioning
was not considered because the initial benchmark source (informal estimates) does
not change annually. However, operators want to update figures as better data
becomes available.

---

## Suggested Fix Approach

### API Layer

#### A. Extend `GET /api/factors` — add `POST`, `PUT`, `DELETE`

```
POST   /api/factors          body: { key, validYear, factorKg, unit, source, scope }
PUT    /api/factors/:id      body: { factorKg, unit, source }   (key/year not editable)
DELETE /api/factors/:id
```

- `POST` validates uniqueness of `(key, validYear)` before insert.
- `PUT` only allows editing the numeric value, unit, and source — not the key or
  year (to prevent accidental recalculation across existing entries).
- All mutations return the updated record for optimistic UI update.

#### B. New `/api/benchmarks` route

```
GET    /api/benchmarks
PUT    /api/benchmarks/:id   body: { co2ePerEmployeePerYear }
```

Only `GET` and `PUT` are needed initially; `POST` and `DELETE` are deferred
because the set of `Branche` enum values is fixed (changing it requires a Prisma
migration). Editing the numeric value is the core need.

#### C. Optional: Add `validYear` to `IndustryBenchmark` (schema migration)

This is a **should-have** for year-accurate benchmarks. The change requires:
1. Add `validYear Int` to `IndustryBenchmark` with a default of `2024`.
2. Change the unique constraint from `@unique branche` to `@@unique([branche, validYear])`.
3. Update `prisma/seed.ts` to seed benchmarks with `validYear: 2024`.
4. Update `src/app/page.tsx` to pass the selected reporting year to the benchmark
   query: `prisma.industryBenchmark.findFirst({ where: { branche, validYear: selectedYear } })`.
5. Update `src/app/api/report/route.ts` similarly.
6. Update `IndustryBenchmarkTable` to show the year column.

If the migration is deferred, the `PUT /api/benchmarks/:id` endpoint must be
accompanied by a clear UI note that the benchmark value applies to all years.

### UI Layer (Settings Page)

#### Emission Factors table — inline editing

Replace the read-only `EmissionFactorsTable` with an interactive version:
- Each row gets an **Edit (pencil) icon** button.
- Clicking opens an inline edit mode for that row (the `factorKg` field becomes
  an `<input type="number">`; `unit` and `source` remain editable).
- **Save** calls `PUT /api/factors/:id`; **Cancel** reverts the row.
- An **"+ Neuer Faktor"** button at the bottom of the section opens a form row
  to `POST /api/factors` (requires key, year, value, unit, source, scope).
- Rows can be deleted with a trash icon (with a confirmation toast).

#### Industry Benchmarks table — inline editing

Same pattern:
- Each row gets a pencil icon; clicking makes the `co2ePerEmployeePerYear` field
  editable.
- **Save** calls `PUT /api/benchmarks/:id`.
- No add/delete (set of branches is fixed by enum).

#### Client state

Both tables will switch from server-only to client-rendered (add `'use client'`).
Use `useState` for the editable row + `fetch` for mutations. No SWR / React Query
needed — the data set is small and the Settings page is low-traffic.

---

## Acceptance Criteria

### Must Have

- [ ] **AC-1** `PUT /api/factors/:id` allows updating `factorKg`, `unit`, and
      `source`. Returns the updated record. Reflects immediately in the wizard's
      `useFactors` hook on next page load.
- [ ] **AC-2** `POST /api/factors` allows adding a new factor row (new key+year
      combination). Returns 409 if `(key, validYear)` already exists.
- [ ] **AC-3** `GET /api/benchmarks` returns all `IndustryBenchmark` rows.
- [ ] **AC-4** `PUT /api/benchmarks/:id` allows updating `co2ePerEmployeePerYear`.
      The dashboard's `BranchenvergleichCard` reflects the updated value on next load.
- [ ] **AC-5** The Settings page shows an **inline edit** affordance for the
      `factorKg` field on each emission factor row (pencil icon → input → save/cancel).
- [ ] **AC-6** The Settings page shows an **inline edit** affordance for
      `co2ePerEmployeePerYear` on each benchmark row.
- [ ] **AC-7** All edit inputs have German-locale validation feedback (e.g. "Wert
      muss größer als 0 sein") and show a success toast ("Gespeichert") on update.

### Should Have

- [ ] **AC-8** Add `validYear` to `IndustryBenchmark` with Prisma migration.
      Dashboard and report use the benchmark for the selected reporting year.
- [ ] **AC-9** `DELETE /api/factors/:id` allows removing a factor row. Settings
      page shows trash icon per row with an "Are you sure?" toast confirmation.

### Could Have (future)

- [ ] **AC-10** Bulk import: `POST /api/factors/import` accepts a JSON array of
      factor rows for batch seeding a new year (e.g. UBA 2025).
- [ ] **AC-11** Add `Branche` management: a settings section to add custom branch
      categories beyond the Prisma enum (would require replacing enum with a string
      column + separate `Branche` table).

---

## Related Tests That Should Pass After the Fix

- [ ] `PUT /api/factors/:id` with valid payload updates the DB row and returns 200.
- [ ] `PUT /api/factors/:id` with `factorKg <= 0` when the factor is not a
      recycling credit returns 400.
- [ ] `POST /api/factors` with duplicate `(key, validYear)` returns 409.
- [ ] `GET /api/benchmarks` returns all 7 industry rows.
- [ ] `PUT /api/benchmarks/:id` updates `co2ePerEmployeePerYear` and returns 200.
- [ ] Settings page renders with edit buttons; clicking one shows the input; saving
      it calls the API and shows a success toast (Playwright / React Testing Library).

---

## Additional Context

- **Schema file:** `prisma/schema.prisma` — `EmissionFactor` (line ~90) and
  `IndustryBenchmark` (line ~105).
- **Seed script:** `prisma/seed.ts` — reference for all seeded keys and benchmark
  values. Factor keys and scopes must match the enum in `src/types/index.ts`.
- **Factors API (read):** `src/app/api/factors/route.ts` — extend this file with
  mutation methods, or split into `route.ts` (collection) and `[id]/route.ts`
  (item).
- **Settings page:** `src/app/settings/page.tsx` — sections for both entities are
  already present; just need to replace the display-only components.
- **Feature 003 analysis:** `docs/features/003-factor-selection-ux/issue-analysis.md`
  — describes the read-only display added in 003; this feature builds on it.
- **Architecture constraint:** "All emission factors in DB (versioned by
  `valid_year`) — never hardcoded" (`docs/architecture.md` §2.1). The management
  UI directly supports this constraint by enabling in-app factor updates.
- **No auth:** The application has no login system (single-tenant, see §1.1).
  There is no need to add role checks to the new API routes; all management
  operations are implicitly trusted.
