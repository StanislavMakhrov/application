# Issue Analysis: Factor Selection & Entity Management UX

**Feature:** `003-factor-selection-ux`
**Reported:** "it is not clear how to select/change factor and other new entities"
**Analyst:** Issue Analyst
**Date:** 2025-07-14

---

## Problem Description

Users (or the Maintainer during dogfooding) cannot see which emission factor is
actually being applied to their data entries, and there is no UI affordance to
select, change, or verify emission factors.  Additionally, several entities that
were added to the Prisma schema (e.g. `IndustryBenchmark`, `StagingEntry`) have
no management interface at all — they are invisible to users beyond their
indirect effects on dashboard numbers or report text.

---

## Steps to Reproduce

1. Open the wizard (e.g. `/wizard/2` — Heizung & Gebäude).
2. Enter a value in the **Erdgas** field.
3. Observe that the factor hint below reads:
   _"Quelle: Gas-Jahresabrechnung. Faktor: 2,000 kg CO₂e/m³ (UBA 2024)"_
4. Notice there is no way to:
   - Confirm that `2,000` is the value stored in the database for key `ERDGAS`.
   - Choose a different factor year (e.g. if 2023 and 2024 differ).
   - Override the factor with a supplier-specific value.
5. Navigate to `/settings` — no emission-factor section exists.
6. Navigate back to any wizard screen — no link to factor management.

---

## Expected Behavior

- Factor hints shown beneath each entry field should be **live values read from
  the `EmissionFactor` database records**, not hardcoded strings.
- Users should be able to **see, at a glance**, which factor (key, value, unit,
  source, year) will be used when their quantity is converted to CO₂e.
- Advanced users / the company owner should have a pathway (e.g. a section on
  the Settings page, or an info panel) to **understand and, if needed, manage**
  the emission factors in use.

---

## Actual Behavior

- **Hardcoded static text** in every wizard screen shows factor values that are
  not dynamically read from the database:
  - `Screen2Heizung`: `"Faktor: 2,000 kg CO₂e/m³ (UBA 2024)"` (line ~166)
  - `Screen3Fuhrpark`: factor values in a static `MATERIAL_FACTORS` record
  - `Screen4Strom`: inline ternary `{isOekostrom ? '0,030' : '0,380'} kg CO₂e/kWh`
  - `Screen5Dienstreisen`, `Screen6Materialien`, `Screen7Abfall`: all hardcoded
- The `EmissionFactor` table is populated at seed time and used only by
  `lib/factors.ts` → `lib/emissions.ts` at calculation time.  No UI component
  reads from `EmissionFactor` at render time.
- There is no Settings section, admin page, or wizard panel that surfaces the
  `EmissionFactor` table to users.
- The `IndustryBenchmark` entity is seeded but has no management UI — users
  cannot see or update the benchmark values used to compare their per-employee
  CO₂e on the dashboard.
- The `StagingEntry` entity (created by OCR and CSV imports) has no review or
  approval UI — staged entries silently expire.

---

## Root Cause Analysis

### Affected Components

| File | Issue |
|---|---|
| `src/components/wizard/screens/Screen2Heizung.tsx` | Factor hints hardcoded (≥6 places) |
| `src/components/wizard/screens/Screen3Fuhrpark.tsx` | Factor hints hardcoded via static `fields` array |
| `src/components/wizard/screens/Screen4Strom.tsx` | Factor hardcoded as inline ternary string |
| `src/components/wizard/screens/Screen5Dienstreisen.tsx` | Factor hints hardcoded |
| `src/components/wizard/screens/Screen6Materialien.tsx` | `MATERIAL_FACTORS` record hardcoded in component |
| `src/components/wizard/screens/Screen7Abfall.tsx` | Factor hints hardcoded |
| `src/lib/factors.ts` | Provides `getEmissionFactor()` but no component uses it for display |
| `src/app/settings/page.tsx` | No section for `EmissionFactor` or `IndustryBenchmark` |
| `prisma/schema.prisma` | `EmissionFactor`, `IndustryBenchmark`, `StagingEntry` have no corresponding UI |

### What's Broken

1. **Stale / incorrect hints** — Wizard screens show factor values that were
   copy-pasted from seed data.  If seed data is updated (e.g. UBA updates factors
   for 2025), the hint text in every screen must be manually updated separately.
   There is no single source of truth visible to the user.

2. **No factor transparency** — Users cannot verify what factor the system will
   actually use.  The system *does* look up the DB value at calculation time
   (via `getEmissionFactor()`), but there is no way for a user to confirm or
   audit this.

3. **No factor selection / override** — The `EmissionEntry` model has no
   `emissionFactorId` or `customFactorKg` field.  All entries bind to a factor
   only at calculation time by `(category, year)` key.  Users have no way to
   choose a different factor even if one exists in the DB for a different year,
   or to supply a supplier-specific factor.

4. **Invisible entities** — `IndustryBenchmark` drives the benchmark card on the
   dashboard but cannot be viewed or edited through the UI.
   `StagingEntry` is created by OCR/CSV but has no review UI.

### Why It Happened

The wizard screens were built for rapid data entry.  Emission factor values were
copied directly from the seed file into JSX hint text as static strings — a
practical shortcut during initial development that avoided adding async data
fetching to every wizard screen.  The `EmissionFactor` table was designed as a
back-end lookup table (for calculation only), and no UI layer was built on top
of it.  As the schema grew (adding `IndustryBenchmark`, `StagingEntry`) the same
pattern continued — data structures were built without corresponding management UIs.

---

## Suggested Fix Approach

### Priority 1 — Dynamic Factor Display in Wizard Screens (highest UX impact)

Replace every hardcoded factor hint string with a **live value fetched from the
database via a new API endpoint** (e.g. `GET /api/factors?year=2024`).

- Create `GET /api/factors` route that returns all factors for a given year
  using the existing `getAllFactorsForYear()` function.
- In each wizard screen, fetch this once on mount and store in state, then
  display `factor[key]` instead of the hardcoded string.
- Benefit: hints automatically update if seed data changes; eliminates risk of
  stale hint text.

### Priority 2 — Emission Factor Reference Table in Settings

Add a read-only **Emission Factors** accordion or table section to
`/settings`, showing all factors currently in the database for the selected
reporting year.  For each factor: key (human label), value, unit, source, year.

- Provides full transparency without requiring DB admin access.
- Uses `getAllFactorsForYear()` server-side (Settings page is a Server Component).
- Optional: add an "Edit" affordance for power users (defer to later feature).

### Priority 3 — Industry Benchmark Visibility

Show the `IndustryBenchmark` values per industry in the Settings page (read-only),
so users understand the basis of the benchmark comparison on the dashboard.

### Priority 4 — Staging Entry Review UI (deferred)

Add a collapsible "Pending Imports" panel on the relevant wizard screens or a
dedicated staging review page that shows `StagingEntry` records awaiting
confirmation.  Given expiry logic already exists, this is a UX polish item.

---

## Acceptance Criteria

### Must Have
- [ ] **AC-1**: Every factor hint in the wizard (Screens 2–7) is loaded
      dynamically from the database, not hardcoded.  If the DB value for a key
      changes, the hint updates without any code change.
- [ ] **AC-2**: The factor displayed to the user matches the factor that will be
      used in CO₂e calculation for that entry (same year, same key).
- [ ] **AC-3**: A "Emissionsfaktoren" section on the Settings page lists all
      factors currently in use (key label, value, unit, source, year) as a
      read-only reference table.

### Should Have
- [ ] **AC-4**: `IndustryBenchmark` values for the current industry are visible
      somewhere in the UI (dashboard tooltip or Settings) so users understand
      how the benchmark figure is derived.
- [ ] **AC-5**: The factor display degrades gracefully when no factor is found for
      a key+year (shows a "–" placeholder, does not crash).

### Could Have (future)
- [ ] **AC-6**: A user can override the default emission factor on a per-entry
      basis (requires schema change: `EmissionEntry.customFactorKg Float?`).
- [ ] **AC-7**: A staging entry review panel lets users confirm or reject
      OCR/CSV-imported values before they are committed to `EmissionEntry`.

---

## Related Tests That Should Pass After the Fix

- [ ] `GET /api/factors?year=2024` returns a JSON object with at least 20 factor
      keys matching the seeded values.
- [ ] Wizard screen renders show the factor value from the API, not a hardcoded
      string (check via Playwright or React Testing Library snapshot).
- [ ] Settings page renders the emission factor table with all seeded keys.
- [ ] If factor key is missing from DB, wizard screen shows a `–` placeholder
      without throwing.

---

## Additional Context

- **Related feature:** `docs/features/002-methodology-summary/` — the methodology
  PDF page already fetches full factor records (`getEmissionFactorRecord()`) for
  PDF generation.  Priority 2 (Settings factor table) can reuse the same data
  shape (`MethodologyFactorRow`) and API patterns already established there.
- **Architecture doc:** `docs/architecture.md` section 8 (Concepts) describes the
  factor lookup fallback chain (exact year → most recent year below → earliest
  year above).  The UI should communicate which year's factor is actually being
  used when a fallback occurs.
- **Seed data:** `prisma/seed.ts` — all 30 factors currently seeded for 2024 only.
  Future: seed 2023 data to exercise the fallback chain.
