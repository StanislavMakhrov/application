# Architecture: Factor Selection & Display UX (Feature 003)

## Status

Approved

## Context

All wizard screens (Screen 2–7) currently display emission factor hints as
hardcoded static strings. These strings were copy-pasted from the seed data
during initial development and are completely disconnected from the
`EmissionFactor` database records that are actually used at CO₂e calculation
time. If UBA updates factor values or new years are seeded, the wizard hints
silently go stale.

The `EmissionFactor` table is populated at seed time and queried only by
`src/lib/factors.ts` → `src/lib/emissions.ts` during server-side calculation.
No client component reads from it at render time.

The Settings page (`/settings`) has no section for emission factors or
`IndustryBenchmark`.

See: `docs/features/003-factor-selection-ux/issue-analysis.md`

---

## Options Considered

### Option A — Per-screen fetch (no shared hook)

Each wizard screen independently calls `GET /api/factors?year=YYYY` in its
existing `useEffect` and stores factor data in local state.

**Pros:**
- Minimal structural change — just add a second fetch to the existing `useEffect`
- No new abstractions needed

**Cons:**
- Duplicates identical fetch logic across 6 screens
- No single place to tune caching, error handling, or loading state
- Harder to test (mocking must be repeated per screen)

---

### Option B — Shared `useFactors(year)` hook + `FactorHint` component ✅ Recommended

Extract factor fetching into a custom hook `useFactors(year)` used by all
wizard screens, combined with a presentational `FactorHint` component that
renders the hint text (or a `–` placeholder on missing data).

**Pros:**
- Single fetch implementation; DRY across all 6 screens
- Loading and error states handled in one place
- Easy to unit-test the hook in isolation
- `FactorHint` component gives consistent formatting across all screens
- Aligns with existing hook patterns in the codebase

**Cons:**
- Introduces a new file (`src/hooks/useFactors.ts`) and component
  (`src/components/wizard/FactorHint.tsx`)
- Slight indirection — developers must look in two files

---

## Decision

**Option B** — Shared `useFactors(year)` hook + `FactorHint` component.

This is the only approach consistent with the architecture quality goal
_"All CO₂e calculations must use versioned UBA emission factors from DB — never
hardcoded values"_ (section 2.1), now extended to include UI display as well.
It avoids six copies of identical fetch logic and provides a single place to
extend (e.g. caching, year-fallback labelling) in the future.

---

## Rationale

### Why a new API endpoint?

All wizard screens are `'use client'` components (they use `useEffect`,
`useState`, React Hook Form). Server-side factor lookup (`prisma.*`) cannot
run inside client components. A dedicated `GET /api/factors?year=YYYY`
endpoint is the standard Next.js App Router pattern for exposing server-only
data to client components without prop-drilling through Server Components.

The existing `POST /api/report` endpoint is for PDF generation and must not
be repurposed. No existing endpoint exposes factor metadata.

### Why extend `getAllFactorsForYear()` rather than reuse it directly?

`getAllFactorsForYear()` currently returns only `Record<string, number>`
(factorKg values). The UI needs the full record (`factorKg`, `unit`, `source`,
`validYear`) to display a meaningful hint (e.g.
_"Faktor: 2,000 kg CO₂e/m³ (UBA 2024)"_). A new
`getAllEmissionFactorRecords(year)` function that calls `getEmissionFactorRecord()`
for each key provides this richer shape without modifying the existing function
(which is used by calculations that only need the numeric value).

### Why is the Settings page handled differently from wizard screens?

`src/app/settings/page.tsx` is already a **Server Component** (it directly
calls `prisma.*`). Server Components can call `getAllEmissionFactorRecords()`
directly without going through an API route. Introducing an unnecessary
`fetch()` in a Server Component would add latency and complexity. The
`EmissionFactorsTable` component therefore receives pre-fetched data as props.

### IndustryBenchmark in scope

`IndustryBenchmark` is Priority 3 (nice to have) per the issue analysis.
It requires only a single additional `prisma.industryBenchmark.findMany()`
call on the Settings page — no new endpoint or hook — so it is included in
this design at negligible cost. It will appear as a read-only table below the
emission factors table.

---

## Consequences

### Positive
- Wizard hints are always in sync with the DB; UBA factor updates require only
  a DB seed update, not a code change
- Single source of truth: factor format and fallback logic live in one hook
- Settings page gives users full transparency into all active factors
- IndustryBenchmark values become visible without requiring a separate feature

### Negative
- Every wizard screen will make one additional HTTP request on mount
  (`GET /api/factors?year=...`). This is a small read-only query (30 rows),
  so performance impact is negligible.
- If the new `/api/factors` endpoint fails, factor hints degrade to `–`
  placeholders. The wizard remains fully functional (entries can still be saved;
  CO₂e calculation is unaffected).

---

## Implementation Notes

The Developer should implement the following components, in the order listed.
No schema changes are required for Priority 1–3.

---

### 1. Extend `src/lib/factors.ts`

Add a new exported function:

```ts
/**
 * Returns full factor records for all keys for a given year, using the same
 * fallback chain as getEmissionFactor(). Used by the /api/factors endpoint
 * and the Settings page.
 */
export async function getAllEmissionFactorRecords(
  year: number
): Promise<Record<string, { factorKg: number; unit: string; source: string; validYear: number }>>
```

Implementation: iterate over all distinct keys (like `getAllFactorsForYear`),
call `getEmissionFactorRecord(key, year)` for each, and build the result map.

---

### 2. Add shared `FactorRecord` type to `src/types/index.ts`

```ts
/** Full emission factor record returned by getAllEmissionFactorRecords() */
export interface FactorRecord {
  factorKg: number;
  unit: string;
  source: string;
  validYear: number;
}
```

This type is needed by the API route response, the hook, and the components.
It is a subset of the existing `MethodologyFactorRow` shape — do not
merge/replace that type.

---

### 3. New API route: `src/app/api/factors/route.ts`

```
GET /api/factors?year=2024
```

**Response:** `Record<string, FactorRecord>` — JSON object keyed by factor key.

**Behaviour:**
- Parse `year` query param (integer). If missing or invalid, return 400.
- Call `getAllEmissionFactorRecords(year)`.
- Return the result as JSON with cache headers `Cache-Control: no-store`
  (factors may change after a seed update without a deploy).

**Error handling:**
- `year` missing → `400 { error: "year ist erforderlich" }`
- DB error → `500 { error: "Faktoren konnten nicht geladen werden" }`

---

### 4. New hook: `src/hooks/useFactors.ts`

```ts
export function useFactors(year: number): {
  factors: Record<string, FactorRecord>;
  isLoading: boolean;
}
```

**Behaviour:**
- Fetches `GET /api/factors?year={year}` once on mount (when `year` changes).
- While fetching: `isLoading = true`, `factors = {}`.
- On success: `isLoading = false`, `factors = <response body>`.
- On error (network / non-2xx): `isLoading = false`, `factors = {}`.
  Log the error to `console.error` but do not throw.

---

### 5. New component: `src/components/wizard/FactorHint.tsx`

```tsx
interface FactorHintProps {
  factorKey: string;
  factors: Record<string, FactorRecord>;
  prefix?: string;          // optional prefix, e.g. "Quelle: Gas-Jahresabrechnung. "
  negativeLabel?: string;   // optional override label for negative factors (Gutschrift)
}
```

**Render:**
- If `factors[factorKey]` is found:
  - Positive factor: `<p className="text-xs text-gray-400">{prefix}Faktor: {value} kg CO₂e/{unit} ({source} {validYear})</p>`
  - Negative factor (factorKg < 0): render `♻ Gutschrift: {value} kg CO₂e/{unit} — Recycling reduziert Ihre Bilanz! ({source} {validYear})`
- If not found (or `isLoading`):
  - Show `<p className="text-xs text-gray-400">–</p>` (placeholder, never throws)

**Number formatting:** Use `de-DE` locale, 3 decimal places (matching existing
hint text style: `2,000`, `0,142`).

---

### 6. Update all wizard screens (Screens 2–7)

For each screen:

1. Import `useFactors` and `FactorHint`.
2. Add `const { factors } = useFactors(year);` near the top of the component.
3. Replace every hardcoded factor hint `<p>` with `<FactorHint factorKey="KEY" factors={factors} />`.
4. For **Screen4Strom** specifically, replace the `isOekostrom` ternary with
   two separate `<FactorHint>` calls — one for `STROM_OEKOSTROM` (when
   `isOekostrom` is true) and one for `STROM` (when false).
5. For **Screen6Materialien**, remove the `MATERIAL_FACTORS` constant entirely;
   use `<FactorHint factorKey={row.material} factors={factors} />` per row.

**Key mapping reference (factor key → screen field) — all 31 seeded keys covered:**

| Screen | Field | Factor key |
|--------|-------|------------|
| 2 | Erdgas | `ERDGAS` |
| 2 | Heizöl | `HEIZOEL` |
| 2 | Flüssiggas | `FLUESSIGGAS` |
| 2 | R410A | `R410A_KAELTEMITTEL` |
| 2 | R32 | `R32_KAELTEMITTEL` |
| 2 | R134A | `R134A_KAELTEMITTEL` |
| 2 | Sonstige Kältemittel | `SONSTIGE_KAELTEMITTEL` |
| 3 | Diesel | `DIESEL_FUHRPARK` |
| 3 | Benzin | `BENZIN_FUHRPARK` |
| 3 | PKW Benzin km | `PKW_BENZIN_KM` |
| 3 | PKW Diesel km | `PKW_DIESEL_KM` |
| 3 | Transporter km | `TRANSPORTER_KM` |
| 3 | LKW km | `LKW_KM` |
| 4 | Strom (non-Öko) | `STROM` |
| 4 | Strom (Ökostrom) | `STROM_OEKOSTROM` |
| 4 | Fernwärme | `FERNWAERME` |
| 5 | Geschäftsreisen Flug | `GESCHAEFTSREISEN_FLUG` |
| 5 | Geschäftsreisen Bahn | `GESCHAEFTSREISEN_BAHN` |
| 5 | Pendlerverkehr | `PENDLERVERKEHR` |
| 6 | Material rows (8 keys) | Use `row.material` as key: `KUPFER`, `STAHL`, `ALUMINIUM`, `HOLZ`, `KUNSTSTOFF_PVC`, `BETON`, `FARBEN_LACKE`, `SONSTIGE` |
| 7 | Restmüll | `ABFALL_RESTMUELL` |
| 7 | Bauschutt | `ABFALL_BAUSCHUTT` |
| 7 | Altmetall | `ABFALL_ALTMETALL` |
| 7 | Sonstiges | `ABFALL_SONSTIGES` |

---

### 7. Settings page — `EmissionFactorsTable`

**New server component:** `src/components/settings/EmissionFactorsTable.tsx`

- Receives `factors: Record<string, FactorRecord>` as a prop (pre-fetched by
  the Settings page Server Component).
- Renders a `<table>` with columns: **Kategorie** (CATEGORY_LABELS lookup,
  fallback to raw key), **Faktor** (kg CO₂e/Einheit, de-DE formatted),
  **Quelle**, **Jahr**.
- Group rows by scope (Scope 1 / Scope 2 / Scope 3) using the
  `CATEGORY_SCOPE` map from `src/types/index.ts`. Material keys (e.g. `KUPFER`)
  can be grouped under Scope 3 (or a separate "Materialien" group).
- Sorted alphabetically within each group.
- Negative factors (Altmetall/recycling credits) shown in green with a ♻
  prefix.

**Settings page update (`src/app/settings/page.tsx`):**

```tsx
// Additional server-side fetch (no API call needed — direct lib call)
import { getAllEmissionFactorRecords } from '@/lib/factors';
import { EmissionFactorsTable } from '@/components/settings/EmissionFactorsTable';
import { IndustryBenchmarkTable } from '@/components/settings/IndustryBenchmarkTable';

// Inside SettingsPage():
const currentYear = years.length > 0 ? years[years.length - 1] : new Date().getFullYear();
const factorRecords = await getAllEmissionFactorRecords(currentYear);
const benchmarks = await prisma.industryBenchmark.findMany({ orderBy: { branche: 'asc' } });
```

Add two new `<section>` blocks below the existing Berichtsjahre section:

1. **Emissionsfaktoren** — wraps `<EmissionFactorsTable factors={factorRecords} year={currentYear} />`
2. **Branchenvergleich (Benchmarks)** — wraps `<IndustryBenchmarkTable benchmarks={benchmarks} />`

---

### 8. Settings page — `IndustryBenchmarkTable`

**New server component:** `src/components/settings/IndustryBenchmarkTable.tsx`

- Receives `benchmarks: Array<{ branche: Branche; co2ePerEmployeePerYear: number }>`.
- Renders a simple `<table>` with columns: **Branche** (BRANCHE_LABELS lookup),
  **CO₂e/MA/Jahr** (tonnes, de-DE formatted).
- Read-only reference — no edit affordance in this phase.

---

## Components Affected (Summary)

| File | Change |
|------|--------|
| `src/lib/factors.ts` | Add `getAllEmissionFactorRecords(year)` |
| `src/types/index.ts` | Add `FactorRecord` interface |
| `src/app/api/factors/route.ts` | **New** — GET endpoint |
| `src/hooks/useFactors.ts` | **New** — client hook |
| `src/components/wizard/FactorHint.tsx` | **New** — hint display component |
| `src/components/wizard/screens/Screen2Heizung.tsx` | Replace 7 hardcoded hints |
| `src/components/wizard/screens/Screen3Fuhrpark.tsx` | Replace 6 hardcoded hints in static array |
| `src/components/wizard/screens/Screen4Strom.tsx` | Replace ternary + static hint |
| `src/components/wizard/screens/Screen5Dienstreisen.tsx` | Replace 3 hardcoded hints |
| `src/components/wizard/screens/Screen6Materialien.tsx` | Remove `MATERIAL_FACTORS` constant; use `FactorHint` |
| `src/components/wizard/screens/Screen7Abfall.tsx` | Replace 4 hardcoded hints |
| `src/components/settings/EmissionFactorsTable.tsx` | **New** — server component |
| `src/components/settings/IndustryBenchmarkTable.tsx` | **New** — server component |
| `src/app/settings/page.tsx` | Add 2 new sections using new components |

**No Prisma schema changes required.** All required data is already in the DB.

---

## Out of Scope (Future Work)

- **AC-6** (per-entry factor override): Requires a `customFactorKg` field on
  `EmissionEntry` — schema migration needed. Deferred to a future feature.
- **AC-7** (StagingEntry review UI): Separate feature.
- Factor editing / CRUD in the Settings table: Deferred. Settings section is
  read-only in this phase.
