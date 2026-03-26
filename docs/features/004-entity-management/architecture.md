# Architecture: Entity Management UI (Feature 004)

## Status

Approved — no new project-wide ADR required. This feature extends existing
patterns (API route splitting, Server Component + Client Component composition,
`sonner` toast feedback) without introducing new cross-cutting decisions.

---

## Analysis

The Settings page currently renders two read-only tables. The missing pieces are:

1. **Write API routes** for `EmissionFactor` and `IndustryBenchmark`.
2. **Editable Client Components** to replace the read-only Server Components.
3. **Year-versioning** for `IndustryBenchmark` (schema migration).

All three gaps can be closed by following existing codebase patterns. The
choices below are constrained by the architecture constraint in §2.1:
_"All emission factors in DB (versioned by `valid_year`) — never hardcoded."_

---

## Decision 1 — `validYear` on `IndustryBenchmark` (Schema Migration)

### Options considered

**Option A — Add `validYear` now (recommended)**

Add `validYear Int` to `IndustryBenchmark` with a default of `2024`. Change
the unique constraint from `@unique branche` to `@@unique([branche, validYear])`.
Update the seed script, dashboard benchmark lookup, and PDF report to filter
by the selected reporting year.

- ✅ Year-accurate benchmark comparisons on the dashboard
- ✅ Aligns with the existing `EmissionFactor` versioning pattern (`@@unique([key, validYear])`)
- ✅ Enables operators to enter 2025 benchmarks alongside 2024 data
- ⚠ Requires a Prisma migration and seed script update
- ⚠ Dashboard and report query must be updated to pass year to benchmark lookup

**Option B — Defer `validYear`, edit in place**

Keep `branche @unique`, allow `PUT /api/benchmarks/:id` to overwrite the single
value.

- ✅ No schema migration
- ❌ No year-accurate benchmarks — the card always shows the single stored value
- ❌ Editing 2025 benchmarks would permanently overwrite 2024 values
- ❌ Contradicts the existing `EmissionFactor` versioning convention

**Decision:** Option A. The `validYear` field is necessary for correctness and
consistency with how `EmissionFactor` is already versioned. The migration
complexity is low (one field + one constraint change + two query updates).

---

## Decision 2 — API Route Structure

### Pattern established in codebase

- Collection operations (GET all, POST new) → `src/app/api/<resource>/route.ts`
- Item operations (PUT, DELETE) → `src/app/api/<resource>/[id]/route.ts`

This split is already used by `entries/route.ts` (collection) and
`field-documents/[id]/route.ts` (item).

### Routes to implement

#### A. Emission Factors

| Method | Route | Body | Notes |
|--------|-------|------|-------|
| `GET` | `/api/factors?year=YYYY` | — | **Already exists** — no change |
| `POST` | `/api/factors` | `{ key, validYear, factorKg, unit, source, scope }` | Returns 409 if `(key, validYear)` already exists |
| `PUT` | `/api/factors/[id]` | `{ factorKg, unit, source }` | `key` and `validYear` are immutable after creation |
| `DELETE` | `/api/factors/[id]` | — | Returns 204 No Content |

Implementation location:
- `src/app/api/factors/route.ts` — add `POST` handler to existing file
- `src/app/api/factors/[id]/route.ts` — new file for `PUT` + `DELETE`

Validation rules:
- `POST`: `factorKg` must be a finite number (negative values allowed for
  recycling credits — consistent with existing seed data). `unit` must be
  non-empty. `scope` must be a valid `Scope` enum value.
- `PUT`: same numeric validation. Returns 400 with German error message if
  invalid. Returns 404 if `id` not found.

#### B. Industry Benchmarks

| Method | Route | Body | Notes |
|--------|-------|------|-------|
| `GET` | `/api/benchmarks?year=YYYY` | — | Returns all rows for given year |
| `POST` | `/api/benchmarks` | `{ branche, validYear, co2ePerEmployeePerYear }` | Returns 409 if `(branche, validYear)` already exists |
| `PUT` | `/api/benchmarks/[id]` | `{ co2ePerEmployeePerYear }` | Returns 404 if `id` not found |

Implementation location:
- `src/app/api/benchmarks/route.ts` — new file for `GET` + `POST`
- `src/app/api/benchmarks/[id]/route.ts` — new file for `PUT`

Note: `DELETE /api/benchmarks/[id]` is intentionally omitted from the
must-have scope. The set of `Branche` enum values is fixed by Prisma — deleting
a benchmark row does not remove the branche and would leave a gap in the
comparison card. Operators can correct values via `PUT`.

Validation rules:
- `co2ePerEmployeePerYear` must be a finite number > 0.
- `branche` must be a valid `Branche` enum value (for `POST`).
- All errors return 400 with German-language `{ error: "..." }` payloads.

---

## Decision 3 — Settings Page: Server + Client Component Mix

### Current pattern

The Settings page (`src/app/settings/page.tsx`) is an `async` Server Component
(marked `export const dynamic = 'force-dynamic'`). It fetches data server-side
and passes it as props to child components. Interactive child components (e.g.
`YearManagement`, `FirmenprofilSettings`) are `'use client'` and receive their
initial data as props.

### Options considered

**Option A — Replace Server Component tables with Client Components (recommended)**

Replace `EmissionFactorsTable` and `IndustryBenchmarkTable` (currently pure
Server Components) with new Client Components:
- `EmissionFactorsTableEditable` (`'use client'`)
- `IndustryBenchmarkTableEditable` (`'use client'`)

The Settings page Server Component continues to fetch full records (including
`id`, `key`, `scope`) server-side and passes them as props. The new Client
Components manage local edit state and call the API for mutations, then call
`router.refresh()` to re-sync server data — identical to how `YearManagement`
and `FirmenprofilSettings` work.

- ✅ Consistent with existing `YearManagement` / `FirmenprofilSettings` pattern
- ✅ No SWR or React Query dependency needed (data set is small)
- ✅ Initial render is still server-rendered (no flash of empty state)
- ⚠ Components are slightly larger (manage both display and edit modes)

**Option B — Keep Server Component shells, open a modal dialog per row**

Intercept edit clicks, open a `<Dialog>` Client Component with a form.

- ✅ Clean separation of read / write concerns
- ❌ More complex component tree (portal, focus management)
- ❌ Modals are heavier UX than inline editing for a simple number field
- ❌ Introduces a new UI pattern not used elsewhere in the Settings page

**Decision:** Option A. Inline editing within the table row is the lightest
UX for a single numeric field edit. The pattern mirrors `FirmenprofilSettings`
and `YearManagement`.

### Component structure

```
src/app/settings/page.tsx              (Server Component — no change to structure)
  ├── FirmenprofilSettings             ('use client' — existing)
  ├── YearManagement                   ('use client' — existing)
  ├── EmissionFactorsTableEditable     ('use client' — replaces EmissionFactorsTable)
  └── IndustryBenchmarkTableEditable   ('use client' — replaces IndustryBenchmarkTable)
```

The Settings page will need to pass full records (with `id` and `key`) instead
of the current `Record<string, FactorRecord>` shape. See Decision 4 for the
new types.

---

## Decision 4 — Type Extensions

### Current limitation

`FactorRecord` (in `src/types/index.ts`) stores only `{ factorKg, unit, source,
validYear }`. It does not include `id`, `key`, or `scope` — the fields needed
to render editable rows and call `PUT /api/factors/:id`.

`IndustryBenchmark` has no matching TypeScript type at all; the Settings page
casts the result inline.

### Changes required

Add two new types to `src/types/index.ts`:

```ts
/** Full EmissionFactor DB row for the editable Settings table. */
export interface EmissionFactorRow {
  id: number;
  key: string;
  validYear: number;
  factorKg: number;
  unit: string;
  source: string;
  scope: Scope;
}

/** Full IndustryBenchmark DB row for the editable Settings table. */
export interface IndustryBenchmarkRow {
  id: number;
  branche: Branche;
  validYear: number;           // added by the schema migration
  co2ePerEmployeePerYear: number;
}
```

`FactorRecord` remains unchanged — it is still used by `useFactors` and
`getAllEmissionFactorRecords()`.

The Settings page will use `prisma.emissionFactor.findMany(...)` directly
(instead of `getAllEmissionFactorRecords()`) to get full rows with `id` and
`scope` for the editable table.

---

## Decision 5 — State Management in Editable Tables

### Approach

Use React `useState` for local edit state. No external state library or data-
fetching library (SWR, React Query) is needed — consistent with all other
interactive settings components.

```
useState<number | null>(editingId)     — which row is currently being edited
useState<string>(editValue)            — controlled input value for the edit field
useState<boolean>(isSaving)            — disable Save button during fetch
```

After a successful `PUT` or `DELETE`, call `router.refresh()` to re-request
the Server Component's data — the same approach used by `YearManagement`. This
avoids stale local state and keeps the Server Component as the single source of
truth.

For `POST` (new factor row), a separate "add row" form at the bottom of the
table is toggled by an `isAdding` state flag.

---

## Decision 6 — Toast / Feedback Pattern

The codebase uses `sonner` (`import { toast } from 'sonner'`). Toast messages
are in German.

Standard messages for this feature:

| Event | Toast type | German message |
|-------|-----------|---------------|
| Successful update | `toast.success` | `'Gespeichert.'` |
| Successful creation | `toast.success` | `'Faktor hinzugefügt.'` / `'Benchmark hinzugefügt.'` |
| Successful deletion | `toast.success` | `'Faktor gelöscht.'` |
| Network / server error | `toast.error` | `'Fehler beim Speichern. Bitte erneut versuchen.'` |
| Validation error (client) | Inline field error (red text below input) | e.g. `'Wert muss größer als 0 sein'` |
| Conflict (409 from POST) | `toast.error` | `'Dieser Faktor existiert bereits für dieses Jahr.'` |

Client-side validation runs before the `fetch()` call. Server-side validation
errors (400 responses) are surfaced via `toast.error` using the `error` field
from the JSON response body.

---

## Components Affected

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `validYear Int` + change unique constraint on `IndustryBenchmark` |
| `prisma/seed.ts` | Add `validYear: 2024` to all benchmark upserts; change unique key to `branche_validYear` |
| `src/types/index.ts` | Add `EmissionFactorRow` and `IndustryBenchmarkRow` interfaces |
| `src/app/api/factors/route.ts` | Add `POST` handler |
| `src/app/api/factors/[id]/route.ts` | New file — `PUT` + `DELETE` handlers |
| `src/app/api/benchmarks/route.ts` | New file — `GET` + `POST` handlers |
| `src/app/api/benchmarks/[id]/route.ts` | New file — `PUT` handler |
| `src/components/settings/EmissionFactorsTable.tsx` | Replace with `EmissionFactorsTableEditable` (Client Component) |
| `src/components/settings/IndustryBenchmarkTable.tsx` | Replace with `IndustryBenchmarkTableEditable` (Client Component) |
| `src/app/settings/page.tsx` | Pass full `EmissionFactorRow[]` and `IndustryBenchmarkRow[]` to new components; use direct `prisma.emissionFactor.findMany()` for full rows |
| `src/app/page.tsx` (dashboard) | Update benchmark lookup to filter by `validYear` |
| `src/app/api/report/route.ts` | Update benchmark lookup to filter by `validYear` |

---

## Implementation Notes for Developer

1. **Prisma migration**: Run `npx prisma migrate dev --name add-valid-year-to-industry-benchmark`
   after updating `schema.prisma`. The migration will add a nullable `validYear`
   column and then a `NOT NULL DEFAULT 2024` constraint can be applied in the
   migration SQL, or alternatively add the column as `Int @default(2024)` in
   Prisma and let prisma migrate handle the backfill.

2. **Settings page data fetch**: The `getAllEmissionFactorRecords()` helper
   returns `Record<string, FactorRecord>` keyed by factor key — convenient for
   the wizard but not suitable for the editable table (no `id`). The Settings
   page should add a second query: `prisma.emissionFactor.findMany({ orderBy: [{ scope: 'asc' }, { key: 'asc' }] })` returning `EmissionFactorRow[]`, and pass that to the new editable component.

3. **Inline edit UX**: Only one row editable at a time. Clicking "Edit" on a
   second row while another is open should auto-cancel the first (set `editingId`
   to the new row). Use a controlled `<input type="number" step="0.001">` with
   `de-DE` placeholder formatting.

4. **Negative factors**: `factorKg` can be negative for recycling credits (e.g.
   `ABFALL_ALTMETALL`). The API must NOT reject negative values. The UI should
   label these with the ♻ indicator already used in the read-only table.

5. **`PUT` immutability**: `PUT /api/factors/:id` must not accept `key`,
   `validYear`, or `scope` — those fields define what the factor measures and
   must not be changed retroactively (existing entries already reference them).

6. **Dashboard benchmark query**: `src/app/page.tsx` currently calls
   `prisma.industryBenchmark.findFirst({ where: { branche } })`. After the
   migration, update to `findFirst({ where: { branche, validYear: selectedYear },
   orderBy: { validYear: 'desc' } })` with a fallback to the most recent year
   if the exact year is not found (mirrors the factor fallback chain).

7. **Seed script**: Update `prisma/seed.ts` benchmark upserts:
   ```ts
   // Before
   await prisma.industryBenchmark.upsert({
     where: { branche: 'ELEKTROHANDWERK' },
     ...
   });
   // After
   await prisma.industryBenchmark.upsert({
     where: { branche_validYear: { branche: 'ELEKTROHANDWERK', validYear: 2024 } },
     ...
   });
   ```

8. **Error format**: All API error responses must use `{ error: "<German message>" }`
   — consistent with the existing `factors/route.ts` pattern.

9. **`GET /api/benchmarks?year=YYYY`**: Accept `year` query param; if omitted,
   return the most recent year available (mirrors factor endpoint behaviour).
   Returns `IndustryBenchmarkRow[]` (array, not map).
