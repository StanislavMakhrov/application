# Tasks: Methodology Summary Block & UBA Parameter Management

## Overview

This document breaks down feature `002-methodology-summary` into actionable implementation
tasks. The feature delivers two coordinated capabilities:

1. **Methodology Summary Block** — an automatically assembled "Methodik" section in every
   generated PDF report (GHG Protocol + CSRD), and a matching collapsible block in the
   web UI Dashboard.
2. **UBA Factor Management UI** — an "Emissionsfaktoren" section in Settings where users
   can view, edit, and one-click auto-fill official UBA emission factors per reporting year.

Reference documents: `specification.md`, `architecture.md`, `ux-design.md`,
`adr/ADR-001` through `ADR-004`, and `test-plan.md`.

---

## Tasks

### Task 1: Schema Migration — Add `label` Field to `EmissionFactor`

**Priority:** High

**Description:**
Add a nullable `label String?` field to the `EmissionFactor` model in
`prisma/schema.prisma` and create the corresponding Prisma migration. This field stores
the German display name for each factor (e.g., `"Erdgas"`, `"Strom (Ökostrom)"`), enabling
the methodology block to show human-readable labels rather than raw keys.

The column is nullable for backward compatibility; existing rows retain `null` until they
are updated by the seed script or the auto-fill API. The methodology service falls back to
a static `FACTOR_LABELS` map (added in Task 2) when `label` is `null`.

**Files to modify:**
- `prisma/schema.prisma` — add `label String?` to `EmissionFactor` model

**Files to create (auto-generated):**
- `prisma/migrations/<timestamp>_add_label_to_emission_factor/migration.sql`

**Acceptance Criteria:**
- [ ] `prisma/schema.prisma` includes `label String?` in the `EmissionFactor` model, placed
  between `source` and `scope` (consistent with architecture doc)
- [ ] Running `npx prisma migrate dev --name add_label_to_emission_factor` succeeds without errors
- [ ] The generated SQL adds a nullable `label` column and does **not** alter or drop any
  existing column or index
- [ ] `npx prisma generate` completes without errors after the migration
- [ ] Existing `EmissionFactor` rows are unaffected (non-destructive migration)
- [ ] The Prisma Client type for `EmissionFactor` includes `label: string | null`

**Dependencies:** None

**Notes:**
This is the only schema change in the entire feature. All other data model requirements
(year isolation via `@@unique([key, validYear])`, `source` field for label tracking) are
already present.

---

### Task 2: UBA Reference Data Module (`src/lib/uba-reference-data.ts`) + Static Label Fallback

**Priority:** High

**Description:**
Create two new library files:

1. **`src/lib/uba-reference-data.ts`** — a typed TypeScript constant
   `UBA_REFERENCE_DATA: Record<number, UbaFactor[]>` containing the official UBA emission
   factor values for years 2023 and 2024. This module is the single source of truth used
   by the seed script, the auto-fill API endpoint, and the years endpoint. No external
   network calls are made — all data is bundled in the application.

2. **`src/lib/factor-labels.ts`** — a `FACTOR_LABELS: Record<string, string>` constant
   mapping factor keys to German display names (e.g., `{ ERDGAS: "Erdgas", STROM: "Strom" }`).
   Used as a fallback when the `label` DB field is `null` (backward compatibility for rows
   pre-dating the migration).

Both modules are pure TypeScript with no runtime dependencies beyond existing types.
The seed script (`prisma/seed.ts`) must also be refactored to import and iterate over
`UBA_REFERENCE_DATA` rather than defining factor values inline, so the data stays in sync.

**Files to create:**
- `src/lib/uba-reference-data.ts`
- `src/lib/factor-labels.ts`

**Files to modify:**
- `prisma/seed.ts` — replace inline factor definitions with import from `uba-reference-data.ts`

**Acceptance Criteria:**
- [ ] `src/lib/uba-reference-data.ts` exports `UbaFactor` interface, `UBA_REFERENCE_DATA`
  constant, and `getUbaReferenceYears(): number[]` function
- [ ] `UbaFactor` interface has fields: `key`, `label`, `factorKg`, `unit`, `source`, `scope`
  (where `scope` is `'SCOPE1' | 'SCOPE2' | 'SCOPE3'`)
- [ ] `UBA_REFERENCE_DATA` contains entries for keys: `2023` and `2024`, each with a
  complete set of factors matching the official UBA values (electricity, gas, oil, district
  heating, diesel, and other categories already present in the existing seed data)
- [ ] Every `UbaFactor` entry includes a non-empty `label` (German display name) and the
  correct `source` string (`"UBA 2023"` or `"UBA 2024"`)
- [ ] `getUbaReferenceYears()` returns `[2023, 2024]` (sorted ascending)
- [ ] `src/lib/factor-labels.ts` exports `FACTOR_LABELS: Record<string, string>` covering
  all factor keys present in `UBA_REFERENCE_DATA`
- [ ] `prisma/seed.ts` imports `UBA_REFERENCE_DATA` and iterates over it using
  `prisma.emissionFactor.upsert` with `label` populated — no inline factor values remain
- [ ] Running `npx prisma db seed` after the Task 1 migration succeeds and persists factors
  with non-null `label` values for both 2023 and 2024
- [ ] The module contains no `fetch`, `import()`, `require()` calls referencing external
  URLs — all data is statically bundled

**Dependencies:** Task 1 (for the `label` field in upsert calls during seeding)

**Notes:**
The `source` value per UbaFactor is set at definition time (e.g., `"UBA 2024"`) — not
computed at runtime — so each factor entry is self-describing. The 2024 factor values must
match what is currently in the existing seed script to avoid breaking existing demo data.
Check `prisma/seed.ts` before writing the 2024 data to ensure exact key and value parity.

---

### Task 3: Methodology Service Function (`src/lib/methodology.ts`)

**Priority:** High

**Description:**
Create `src/lib/methodology.ts` with the `getMethodologyData(yearId: number)` async
function. This server-side function assembles a complete `MethodologyData` object from
three DB queries:

1. All `EmissionFactor` records for the year (via the year's `validYear` — joined through
   `ReportingYear` to resolve `yearId` → `validYear`).
2. All `EmissionEntry` records for the year, grouped by `scope` and `inputMethod` (to count
   non-zero entries per scope and count entries by input method).
3. The `CompanyProfile` record for `reportingBoundaryNotes` and `exclusions`.

The function also exports the `MethodologyData` and `MethodologyFactor` TypeScript
interfaces so they can be reused across API routes and components.

**Scope inclusion rule:** A scope (`SCOPE1`, `SCOPE2`, `SCOPE3`) is included in
`includedScopes` if at least one `EmissionEntry` for that year has `quantity ≠ 0`.

**Factor source label rule:** If all factors for the year have `source = "UBA {year}"`,
`factorSourceLabel = "UBA {year} Emissionsfaktoren"`. If any factor has a different
`source`, `factorSourceLabel = "Benutzerdefiniert {year}"` (conservative approach for
audit clarity).

**Label fallback:** When a factor's `label` DB field is `null`, fall back to
`FACTOR_LABELS[factor.key]` from `src/lib/factor-labels.ts`. If neither is available,
use the raw `key`.

**Files to create:**
- `src/lib/methodology.ts`

**Acceptance Criteria:**
- [ ] `getMethodologyData(yearId)` is exported as an `async` function returning
  `Promise<MethodologyData>`
- [ ] `MethodologyData` interface is exported and contains: `standard`, `factorSourceLabel`,
  `factorYear`, `includedScopes`, `inputMethodCounts`, `assumptions`, `exclusions`, `factors`
- [ ] `MethodologyFactor` interface is exported and contains: `key`, `label`, `factorKg`,
  `unit`, `scope`, `source`
- [ ] `standard` is always `"GHG Protocol Corporate Standard"`
- [ ] `factorSourceLabel` is `"UBA {year} Emissionsfaktoren"` when all factors share the
  same UBA source, or `"Benutzerdefiniert {year}"` when any factor differs
- [ ] `includedScopes` contains only scopes with at least one entry where `quantity ≠ 0`
  (scopes with no entries or all-zero entries are excluded)
- [ ] `inputMethodCounts` correctly counts `{ manual, ocr, csv }` across all entries for
  the year
- [ ] `assumptions` returns `CompanyProfile.reportingBoundaryNotes` (or `null` if unset)
- [ ] `exclusions` returns `CompanyProfile.exclusions` (or `null` if unset)
- [ ] `factors` array contains one item per `EmissionFactor` record, with `label` resolved
  via DB field → `FACTOR_LABELS` fallback → raw key
- [ ] When called for a year with no factors, `factors` is an empty array and
  `factorSourceLabel` falls back gracefully (no crash)
- [ ] When called for a year with no entries, `includedScopes` is `[]` and
  `inputMethodCounts` is `{ manual: 0, ocr: 0, csv: 0 }`
- [ ] Function uses Prisma directly (imported from `@/lib/prisma` or equivalent); no raw SQL

**Dependencies:** Task 1 (schema), Task 2 (factor labels fallback)

**Notes:**
The function follows the pattern established by `getTotalCO2e` in `src/lib/emissions.ts`.
The `yearId` parameter is the `ReportingYear.id` (primary key), not the calendar year
integer. A `prisma.reportingYear.findUnique` call is needed to resolve `validYear` for
factor lookup and for the `factorYear` field in the result.

---

### Task 4: API Endpoints for Emission Factor Management

**Priority:** High

**Description:**
Create five new API route files to support factor listing, editing, auto-fill, and
methodology retrieval. All routes operate on emission factor data only; no authentication
change is needed (single-tenant app per architecture constraints).

**Routes to implement:**

| Method | Path | File |
|--------|------|------|
| `GET` | `/api/emission-factors?year={year}` | `src/app/api/emission-factors/route.ts` |
| `GET` | `/api/emission-factors/years` | `src/app/api/emission-factors/years/route.ts` |
| `PUT` | `/api/emission-factors/[id]` | `src/app/api/emission-factors/[id]/route.ts` |
| `POST` | `/api/emission-factors/uba-fill` | `src/app/api/emission-factors/uba-fill/route.ts` |
| `GET` | `/api/methodology?yearId={yearId}` | `src/app/api/methodology/route.ts` |

**Route specifications:**

- **`GET /api/emission-factors?year={year}`**: Returns all `EmissionFactor` records for
  the given calendar year, sorted by scope then key. Each item includes: `id`, `key`,
  `label`, `factorKg`, `unit`, `scope`, `source`, `validYear`. Returns `400` if `year`
  param is missing or non-numeric. Returns `200 []` if no factors found.

- **`GET /api/emission-factors/years`**: Returns
  `{ dbYears: number[], ubaReferenceYears: number[] }`. `dbYears` are distinct
  `validYear` values from the DB; `ubaReferenceYears` come from `getUbaReferenceYears()`.
  Both arrays are sorted ascending.

- **`PUT /api/emission-factors/[id]`**: Accepts `{ factorKg: number }` in the request
  body. Validates that `factorKg` is a finite number (positive or negative allowed per
  existing model; zero is valid). Sets `source` to `"Benutzerdefiniert {validYear}"` as
  a side-effect. Returns the updated record. Returns `400` for invalid `factorKg`,
  `404` if the factor id does not exist.

- **`POST /api/emission-factors/uba-fill`**: Accepts `{ year: number }`. Validates the
  year against `getUbaReferenceYears()`; returns `400` if no reference data exists for
  the year. On success: upserts all factors for the year from `UBA_REFERENCE_DATA` (full
  replace — not a merge). Returns `{ upsertedCount: number }`. Each upsert sets `label`
  and `source` from the reference data, overwriting any previously customised values.

- **`GET /api/methodology?yearId={yearId}`**: Calls `getMethodologyData(Number(yearId))`.
  Returns `400` if `yearId` is missing or non-numeric, `404` if the year does not exist.
  Returns the full `MethodologyData` object on success.

**Files to create:**
- `src/app/api/emission-factors/route.ts`
- `src/app/api/emission-factors/years/route.ts`
- `src/app/api/emission-factors/[id]/route.ts`
- `src/app/api/emission-factors/uba-fill/route.ts`
- `src/app/api/methodology/route.ts`

**Acceptance Criteria:**
- [ ] `GET /api/emission-factors?year=2024` returns a JSON array of factors sorted by
  scope then key, each including `id`, `key`, `label`, `factorKg`, `unit`, `scope`,
  `source`, `validYear`
- [ ] `GET /api/emission-factors?year=9999` (no data) returns `200 []`
- [ ] `GET /api/emission-factors` (missing `year`) returns `400`
- [ ] `GET /api/emission-factors/years` returns both `dbYears` and `ubaReferenceYears`
  as sorted number arrays
- [ ] `PUT /api/emission-factors/[id]` with `{ "factorKg": 1.5 }` updates the record and
  sets `source` to `"Benutzerdefiniert {validYear}"`
- [ ] `PUT /api/emission-factors/[id]` with `{ "factorKg": "abc" }` returns `400`
- [ ] `PUT /api/emission-factors/99999` (non-existent) returns `404`
- [ ] `POST /api/emission-factors/uba-fill` with `{ "year": 2024 }` upserts all reference
  factors for 2024, returns `{ "upsertedCount": N }` where N matches the number of entries
  in `UBA_REFERENCE_DATA[2024]`
- [ ] `POST /api/emission-factors/uba-fill` with `{ "year": 1999 }` (no reference data)
  returns `400` with no DB writes
- [ ] `GET /api/methodology?yearId=1` returns a valid `MethodologyData` JSON object
- [ ] `GET /api/methodology` (missing `yearId`) returns `400`
- [ ] `GET /api/methodology?yearId=abc` returns `400`

**Dependencies:** Task 1 (schema), Task 2 (reference data + label fallback), Task 3
(methodology service)

**Notes:**
The `/api/emission-factors/years` route must return `dbYears` **and** `ubaReferenceYears`
separately — the UI uses `ubaReferenceYears` to decide whether the auto-fill button is
enabled for a given year.

---

### Task 5: Settings UI — Emission Factor Management Section

**Priority:** High

**Description:**
Add an "Emissionsfaktoren" section to the Settings page, implemented as three new client
components:

1. **`EmissionsfaktorenSettings.tsx`** — top-level section wrapper. Fetches
   `GET /api/emission-factors/years` on mount, renders a year selector dropdown, and
   embeds `EmissionsfaktorenTable` and `UbaFillButton` for the selected year.

2. **`EmissionsfaktorenTable.tsx`** — editable factor table for the selected year. Fetches
   `GET /api/emission-factors?year={year}` when the year changes. Shows columns: Kategorie
   (German label), Schlüssel (key), Faktor (editable `<input>`), Einheit, Scope, Quelle
   (source badge). Tracks dirty state (rows changed but not yet saved). Amber left-border
   on dirty rows. "Speichern" button calls `PUT /api/emission-factors/[id]` for each
   changed row. Save errors are shown inline without discarding edits.

3. **`UbaFillButton.tsx`** — auto-fill trigger. Disabled (with tooltip) if the selected
   year is not in `ubaReferenceYears`. On click: shows a confirmation dialog. On confirm:
   `POST /api/emission-factors/uba-fill` → success toast → triggers table refresh. On
   error: inline error.

The Settings page (`src/app/settings/page.tsx`) is updated to include the new section
below the "Berichtsjahre" section.

**Files to create:**
- `src/components/settings/EmissionsfaktorenSettings.tsx`
- `src/components/settings/EmissionsfaktorenTable.tsx`
- `src/components/settings/UbaFillButton.tsx`

**Files to modify:**
- `src/app/settings/page.tsx` — add new `<section>` block for "Emissionsfaktoren"

**Acceptance Criteria:**
- [ ] Navigating to `/settings` shows a new "Emissionsfaktoren" section with heading
  `"Emissionsfaktoren"` and description `"Emissionsfaktoren pro Berichtsjahr verwalten
  und offizielle UBA-Werte übernehmen."`
- [ ] Year selector dropdown lists all years from `dbYears`
- [ ] Selecting a year loads the factor table for that year
- [ ] Factor table renders columns: Kategorie, Schlüssel, Faktor, Einheit, Scope, Quelle
- [ ] Source badges: green pill for `"UBA {year}"`, amber pill for `"Benutzerdefiniert {year}"`
- [ ] Editing a factor value highlights the row with an amber left-border (dirty state)
- [ ] Clicking "Speichern" calls `PUT` for each dirty row and clears dirty state on success
- [ ] Save failure shows an inline error without discarding edits
- [ ] "UBA-Werte übernehmen" button is **enabled** for years 2023 and 2024
- [ ] "UBA-Werte übernehmen" button is **disabled** with tooltip
  `"Keine offiziellen UBA-Werte für dieses Jahr verfügbar."` for years not in
  `ubaReferenceYears`
- [ ] Clicking "UBA-Werte übernehmen" opens a confirmation dialog with amber warning:
  `"Dies überschreibt alle bestehenden Faktoren für [Jahr] mit den offiziellen UBA-Werten.
  Bestehende Werte (auch manuell geänderte) werden ersetzt."`
- [ ] Confirming auto-fill triggers `POST /api/emission-factors/uba-fill`, shows success
  toast `"UBA [Jahr] Faktoren wurden erfolgreich übernommen."`, and refreshes the table
- [ ] Cancelling the dialog makes no changes
- [ ] All text is in German
- [ ] Components are marked `'use client'`
- [ ] Existing Settings page sections (Berichtsjahre, Firmenprofil if present) are unchanged

**Dependencies:** Task 4 (API endpoints)

**Notes:**
Use `shadcn/ui` primitives (Dialog, Button, Badge, Toast) consistent with the existing
Settings page. The UX design mockup at
`docs/features/002-methodology-summary/mockups/emissionsfaktoren-settings.html` contains
pixel-accurate HTML showing dirty state, dialog, loading skeleton, and error states — use
it as the visual specification.

---

### Task 6: Methodology Summary Component (`MethodologySummary.tsx`) + Dashboard Integration

**Priority:** High

**Description:**
Create the `MethodologySummary.tsx` client component that renders a collapsible methodology
block using `MethodologyData` as its sole prop. Integrate it into the Dashboard
(`src/app/page.tsx`) by calling `getMethodologyData` server-side and passing the result
to the component.

**Component behaviour:**
- **Collapsed (default):** Shows headline
  `"Methodik · {standard} · {factorSourceLabel} · {scopeChips}"`.
  Scope chips: green for Scope 1, blue for Scope 2, purple for Scope 3.
  When any factor is customised: amber indicator on the source label.
- **Expanded:** Shows the full breakdown: 2×2 meta-info grid
  (Berechnungsstandard, Emissionsfaktoren, Enthaltene Scopes, Dateneingabe-Methoden),
  Annahmen & Ausschlüsse text (or `"Keine besonderen Annahmen dokumentiert."` if null),
  and the Faktoren-Tabelle (key, German label, factorKg, unit, scope, source badge per row).
  Warning line when any factor is custom-overridden:
  `"⚠ Ein oder mehrere Faktoren wurden manuell angepasst (Benutzerdefiniert {year})."`.
  Footer link `"Faktoren verwalten →"` navigating to `/settings`.

**Dashboard integration:**
- `src/app/page.tsx` calls `getMethodologyData(currentYearRecord.id)` alongside
  `getTotalCO2e` (both are server-side calls in the existing Server Component).
- `<MethodologySummary data={methodologyData} />` is rendered near the report action
  buttons in the year card area.
- If the Dashboard currently has no selected year (empty state), the methodology block is
  not rendered.

**Files to create:**
- `src/components/reports/MethodologySummary.tsx`

**Files to modify:**
- `src/app/page.tsx` — call `getMethodologyData`, render `<MethodologySummary>`

**Acceptance Criteria:**
- [ ] `MethodologySummary` accepts `data: MethodologyData` as its only required prop
- [ ] Default render state is **collapsed** showing the one-line headline
- [ ] Clicking the headline (or chevron button) toggles the expanded state
- [ ] Collapsed headline shows format: `"Methodik · {standard} · {factorSourceLabel} · S1 S2 S3"`
  (only scopes in `includedScopes` are shown)
- [ ] Scope chips use semantic colours: Scope 1 = green, Scope 2 = blue, Scope 3 = purple
- [ ] Expanded state shows all six content areas: Berechnungsstandard, Emissionsfaktoren,
  Enthaltene Scopes, Dateneingabe-Methoden, Annahmen & Ausschlüsse, and Faktoren-Tabelle
- [ ] `factorSourceLabel` and its badge are amber when `"Benutzerdefiniert"`, green when `"UBA"`
- [ ] Custom-factor warning line is shown when `factorSourceLabel` includes `"Benutzerdefiniert"`
- [ ] `"Faktoren verwalten →"` link is present in expanded state and navigates to `/settings`
- [ ] Dashboard renders the `MethodologySummary` component for the current year
- [ ] If no methodology data is available (empty year), the Dashboard handles it gracefully
  (component is not rendered or shows an appropriate empty state)
- [ ] All text is in German
- [ ] Component is marked `'use client'`
- [ ] Styling uses Tailwind CSS classes consistent with existing dashboard cards

**Dependencies:** Task 3 (methodology service for server-side call in `page.tsx`),
Task 4 (`/api/methodology` if component fetches client-side — however, preferred approach
is server-side data passing per architecture)

**Notes:**
The UX design mockup at
`docs/features/002-methodology-summary/mockups/methodology-summary-block.html` contains
all visual states (collapsed, expanded, loading, empty, custom-factors, mobile). Follow it
closely for class names and visual hierarchy.

---

### Task 7: PDF Integration — Methodology Section in GHGReport and CSRDQuestionnaire

**Priority:** High

**Description:**
Update the PDF generation pipeline to include a dynamic "Methodik" section in both report
types. This involves:

1. **`src/app/api/report/route.ts`** — call `getMethodologyData(yearId)` after resolving
   the reporting year, then pass the result to both PDF components.

2. **`src/components/reports/GHGReport.tsx`** — add `methodologyData: MethodologyData`
   prop, replace the existing static methodology `<Text>` block with a `<MethodologySection
   data={methodologyData} />` local sub-component built with `@react-pdf/renderer`
   primitives (`<View>`, `<Text>`, `<StyleSheet.create>`).

3. **`src/components/reports/CSRDQuestionnaire.tsx`** — add `methodologyData: MethodologyData`
   prop, add a dedicated numbered "Methodik" section within the questionnaire body (not an
   appendix).

**PDF "Methodik" section content (both report types):**
- Berechnungsstandard: value from `methodologyData.standard`
- Emissionsfaktoren: value from `methodologyData.factorSourceLabel`
- Enthaltene Scopes: comma-joined `methodologyData.includedScopes`
- Dateneingabe-Methoden: formatted string from `inputMethodCounts`
  (e.g., `"12 manuelle Einträge, 3 per OCR-Beleg, 0 per CSV"`)
- Annahmen & Ausschlüsse: `assumptions` + `exclusions` or
  `"Keine besonderen Annahmen dokumentiert."` if both are null/empty
- Faktoren-Tabelle: one row per factor in `methodologyData.factors`
  (columns: Kategorie, Schlüssel, Faktor kg CO₂e, Einheit, Scope, Quelle)

**Files to modify:**
- `src/app/api/report/route.ts`
- `src/components/reports/GHGReport.tsx`
- `src/components/reports/CSRDQuestionnaire.tsx`

**Acceptance Criteria:**
- [ ] `GET /api/report?type=GHG_PROTOCOL&yearId=X` generates a PDF containing a "Methodik"
  section with all six required fields populated from live DB data
- [ ] `GET /api/report?type=CSRD_QUESTIONNAIRE&yearId=X` generates a PDF containing an
  equivalent "Methodik" section
- [ ] No static/hardcoded methodology text remains in either PDF component
- [ ] The Faktoren-Tabelle in the PDF lists each factor with Kategorie (German label),
  Schlüssel (key), Faktor value, Einheit, Scope, and Quelle (source)
- [ ] The PDF "Methodik" section uses `@react-pdf/renderer` primitives only (no HTML/DOM)
- [ ] PDF generation time remains within the existing ~3 second SLA (verified by generating
  a report with the full factor set and checking response time)
- [ ] `GHGReport.tsx` accepts the new `methodologyData` prop without breaking existing
  callers (TypeScript should enforce this at compile time)
- [ ] `CSRDQuestionnaire.tsx` accepts the new `methodologyData` prop without breaking
  existing callers
- [ ] The report API route imports `getMethodologyData` from `@/lib/methodology` and awaits
  its result before passing to components
- [ ] Empty `assumptions`/`exclusions` falls back to the
  `"Keine besonderen Annahmen dokumentiert."` string in the PDF

**Dependencies:** Task 3 (methodology service), Task 1 (schema for `label` field on factors
returned by service)

**Notes:**
The existing `GHGReport.tsx` already contains a static `<Text>` block with methodology-like
content. Identify and replace it entirely — do not append alongside the static text.
The PDF mockup at `docs/features/002-methodology-summary/mockups/methodology-pdf.html`
shows the expected layout for both GHG Protocol (UBA and custom) and CSRD variants.

---

### Task 8: Unit and Integration Tests

**Priority:** High

**Description:**
Write automated tests for the new library modules and API routes, following the patterns
established in `src/lib/__tests__/factors.test.ts`, `src/lib/__tests__/emissions.test.ts`,
and any existing route test files. All tests use Vitest + Prisma mocks; no new test
infrastructure is required.

**Test files to create:**

**Unit tests — `src/lib/methodology.ts`** (`src/lib/__tests__/methodology.test.ts`):
- `getMethodologyData_withFactorsAndEntries_returnsCompleteData` (TC-01)
- `getMethodologyData_always_returnsGHGProtocolStandard` (TC-02)
- `getMethodologyData_withNoFactors_returnsEmptyFactorsAndFallbackLabel` (TC-03)
- `getMethodologyData_allUbaSources_returnsUbaFactorSourceLabel` (TC-04)
- `getMethodologyData_anyCustomSource_returnsBenutzerdefinirtLabel` (TC-05)
- `getMethodologyData_scopeInclusionRule_excludesZeroQuantityScopes` (TC-06)
- `getMethodologyData_withNoEntries_returnsEmptyScopesAndZeroCounts` (covering TC-06 edge)

**Unit tests — `src/lib/uba-reference-data.ts`** (`src/lib/__tests__/uba-reference-data.test.ts`):
- `getUbaReferenceYears_returnsSortedYears` (TC-20)
- `UBA_REFERENCE_DATA_2023_hasRequiredKeys` (TC-21 — validates all expected keys present)
- `UBA_REFERENCE_DATA_2024_hasRequiredKeys` (TC-21)
- `UBA_REFERENCE_DATA_allEntries_haveLabelAndCorrectSource` (TC-21 — no empty labels or wrong source)
- `UBA_REFERENCE_DATA_allFactorKg_areFiniteNumbers` (TC-21 — data integrity)

**API route tests** (co-located with route files, e.g., `src/app/api/emission-factors/route.test.ts`):
- `GET /api/emission-factors` — returns sorted factors for year, returns 400 for missing year (TC-22)
- `GET /api/emission-factors/years` — returns db and reference years (TC-23)
- `PUT /api/emission-factors/[id]` — updates factor and sets custom source (TC-07), returns 400 for invalid factorKg, returns 404 for unknown id
- `POST /api/emission-factors/uba-fill` — upserts all factors for known year (TC-08), year-isolation (TC-09), returns 400 for unknown year
- `GET /api/methodology` — returns MethodologyData, returns 400 for missing yearId (TC-24)

**Acceptance Criteria:**
- [ ] All test files are created at the locations listed above
- [ ] Tests follow the `methodName_scenario_expectedResult` naming convention
- [ ] Tests use Vitest (`describe`, `it`/`test`, `expect`, `vi.mock`) — no Jest globals
- [ ] Prisma client is mocked using `vi.mock` consistent with the existing test patterns
  in `factors.test.ts` and `emissions.test.ts`
- [ ] TC-01 through TC-09 (from `test-plan.md`) have corresponding test implementations
- [ ] TC-20 and TC-21 (UBA data validation) pass as pure data assertion tests with no
  DB dependency
- [ ] All tests in `src/lib/__tests__/methodology.test.ts` pass with mocked Prisma
- [ ] All route tests mock the Prisma client and/or the methodology service as appropriate
- [ ] Running `npm test` (Vitest) produces no new failing tests
- [ ] Each test file has at least one negative / error-path test case

**Dependencies:** Task 2 (uba-reference-data module under test), Task 3 (methodology
service under test), Task 4 (API routes under test)

**Notes:**
Test files for API routes may be co-located next to the route file or placed under
`src/app/api/.../` — follow the pattern already established in the repository. Check
existing test files before creating new ones to confirm the convention. The test plan's
TC-16 through TC-19 (component-level tests) are out of scope for this task — component
tests are listed as separate test cases in the test plan but are considered optional
given the library and API coverage already provided.

---

## Implementation Order

Recommended sequence based on dependencies and risk:

1. **Task 1** (Schema Migration) — foundational; all other tasks depend on the `label`
   field being in the DB.
2. **Task 2** (UBA Reference Data + Seed Refactor) — foundational; provides the data
   constants used by multiple downstream tasks.
3. **Task 3** (Methodology Service) — core logic; required by both the API and UI layers.
4. **Task 4** (API Endpoints) — exposes the service and reference data to the UI; required
   by Settings UI and Dashboard.
5. **Task 5** (Settings UI) — can begin once Task 4 is complete; independent of Tasks 6–7.
6. **Task 6** (MethodologySummary + Dashboard) — can be developed in parallel with Task 5
   once Tasks 3–4 are ready.
7. **Task 7** (PDF Integration) — depends only on Task 3; can be developed in parallel
   with Tasks 5–6.
8. **Task 8** (Tests) — write incrementally as each module/route is completed; the test
   file for a module should be delivered alongside the module in the same commit where
   practical.

**Parallel opportunities:**
- Tasks 5, 6, and 7 can proceed in parallel once Tasks 1–4 are merged.
- Task 8 tests can be written alongside each task rather than all at the end.

---

## Open Questions

All open questions from the specification have been resolved in the architecture document.
No unresolved questions remain for the developer at this time:

1. ✅ **UBA reference years**: 2023 and 2024 (resolved in `architecture.md`).
2. ✅ **CSRD methodology placement**: Numbered section within the questionnaire body
   (resolved in `architecture.md`).
3. ✅ **Factor-level input-method tracking**: Not in scope; entry-level counts per scope
   are sufficient (resolved in `architecture.md`).
4. ✅ **Scope inclusion edge case**: Scope included iff at least one entry has `quantity ≠ 0`
   (resolved in `architecture.md`).
5. ✅ **Custom factor label convention**: Entire year set labelled `"Benutzerdefiniert"`
   if any single factor is overridden — conservative for audit clarity (resolved in
   `architecture.md`).
