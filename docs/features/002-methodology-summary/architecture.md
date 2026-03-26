# ADR-001: Architecture for Methodology Summary Feature

## Status

Accepted

## Context

The Methodology Summary feature (spec: `docs/features/002-methodology-summary/specification.md`)
requires every generated GHG Protocol PDF report to include a structured
**"Methodik & Datenqualität"** block. This block must state:

- The governing calculation standard (GHG Protocol Corporate Standard)
- Which scopes are included
- An emission factor table (key, value, unit, source, validYear) for every category that has a recorded entry
- A data quality table (inputMethod per category: `MANUAL`, `OCR`, `CSV`)
- The user's reporting boundary notes and exclusions (from `CompanyProfile`)

All required data already exists in the database:
- `EmissionFactor` — has `key`, `factorKg`, `unit`, `source`, `validYear`, `scope`
- `EmissionEntry.inputMethod` — records how each value was entered
- `CompanyProfile.reportingBoundaryNotes` / `.exclusions` — boundary text

The current "Methodik" section in `GHGReport.tsx` is a single static paragraph
on page 2 and must be substantially expanded.

---

## Options Considered

### Option 1: Inline Assembly in the API Route

Fetch emission factor details and `inputMethod` data directly inside the
existing `GET /api/report` handler in `src/app/api/report/route.ts` and pass
the assembled data to `GHGReport` as an additional prop.

**Pros:**
- No new file; all report-generation logic stays in one place.

**Cons:**
- The route handler already has significant fetching/construction logic.
  Adding more makes it harder to test and maintain.
- Methodology assembly cannot be unit-tested without invoking the full HTTP
  handler.
- Violates the existing precedent (e.g., `getTotalCO2e()` lives in `lib/`,
  not in the route handler).

---

### Option 2: Assembly Logic in the GHGReport Component

Pass raw entries (with `inputMethod`) and all emission factor records to the
component, and let `GHGReport` itself perform the assembly.

**Pros:**
- Simple interface — the component "owns" all its data.

**Cons:**
- PDF components must never perform async DB queries (React-PDF renders
  synchronously on the server — no async support inside the component tree).
- The component would need to receive too many raw records and perform
  potentially expensive lookups, violating separation of concerns.
- Harder to test the assembly logic in isolation.

---

### Option 3: New `assembleMethodologyData()` in `src/lib/methodology.ts` *(Recommended)*

Create a new server-side library function `assembleMethodologyData(yearId, year, entries, materials)`
in `src/lib/methodology.ts`, following the same pattern as `getTotalCO2e()`
in `src/lib/emissions.ts`. The API route calls this function and passes the
resulting typed `MethodologyData` object as a new prop to `GHGReport`.

**Pros:**
- Follows the established project pattern: DB query logic belongs in `lib/`,
  rendering logic belongs in `components/`.
- Methodology assembly is independently unit-testable (mock Prisma client,
  same as `emissions.test.ts`).
- API route stays lean (calls `assembleMethodologyData`, passes prop).
- The `GHGReport` component remains purely presentational.

**Cons:**
- Requires one new file (`src/lib/methodology.ts`) and minor additions to
  `src/types/index.ts` and `src/lib/factors.ts`.

---

## Decision

**Option 3** — new `assembleMethodologyData()` function in `src/lib/methodology.ts`.

---

## Rationale

This option best aligns with the existing architectural pattern:

| Concern | Location |
|---------|----------|
| DB query & assembly | `src/lib/methodology.ts` |
| Type definitions | `src/types/index.ts` |
| Factor record lookup | `src/lib/factors.ts` (new `getEmissionFactorRecord()`) |
| Orchestration | `src/app/api/report/route.ts` |
| PDF rendering | `src/components/reports/GHGReport.tsx` |

The assembly function can be unit-tested with the same mocking approach used
for `emissions.test.ts` and `factors.test.ts`. The API route and GHGReport
component are only minimally modified.

---

## Consequences

### Positive

- Clear separation: data assembly stays server-side in `lib/`, rendering stays
  in the component.
- `assembleMethodologyData` is independently unit-testable.
- The `GHGReport` component remains a pure, prop-driven React component.
- Graceful degradation: if a factor is missing, the row shows `–` without
  crashing report generation (errors are absorbed by the assembly function).

### Negative

- Adds N+1-style DB queries (one per category for factor lookup). Acceptable
  given the small number of categories (< 25) and the existing 3-second
  performance budget. If this becomes a concern, the function can be
  refactored to batch-fetch all factors in one query.

---

## Implementation Notes

The following describes the intended design for the Developer agent.

---

### 1. New Types in `src/types/index.ts`

Add three new exported interfaces:

```typescript
/** One row in the methodology emission factor table */
export interface MethodologyFactorRow {
  categoryKey: string;        // e.g. "ERDGAS"
  categoryLabel: string;      // human-readable German label
  scope: Scope;               // "SCOPE1" | "SCOPE2" | "SCOPE3"
  factorKg: number | null;    // null if factor not found in DB
  unit: string;               // e.g. "m³", "kWh", "L"
  source: string | null;      // e.g. "UBA Datenbericht 2024"
  validYear: number | null;   // e.g. 2024
}

/** One row in the methodology data quality table */
export interface MethodologyQualityRow {
  categoryKey: string;
  categoryLabel: string;
  inputMethod: InputMethod;   // "MANUAL" | "OCR" | "CSV"
}

/** Complete methodology data block, assembled at report-generation time */
export interface MethodologyData {
  standard: string;                      // "GHG Protocol Corporate Standard"
  scopesIncluded: Scope[];               // scopes that have at least one entry
  factorRows: MethodologyFactorRow[];    // one row per recorded category
  qualityRows: MethodologyQualityRow[];  // one row per recorded category
  boundaryNotes: string | null;          // CompanyProfile.reportingBoundaryNotes
  exclusions: string | null;             // CompanyProfile.exclusions
}
```

---

### 2. New Factor Record Lookup in `src/lib/factors.ts`

Add a new exported function alongside the existing `getEmissionFactor()`:

```typescript
/**
 * Returns the full EmissionFactor record for a given key and year,
 * using the same fallback logic as getEmissionFactor().
 * Returns null if no factor record exists.
 */
export async function getEmissionFactorRecord(
  key: string,
  year: number
): Promise<{ factorKg: number; unit: string; source: string; validYear: number } | null>
```

This mirrors the fallback chain in `getEmissionFactor()` but returns the
complete record (factorKg, unit, source, validYear) rather than just the
numeric value.

---

### 3. New Assembly Function in `src/lib/methodology.ts`

```typescript
import { prisma } from './prisma';
import { getEmissionFactorRecord } from './factors';
import { CATEGORY_LABELS, CATEGORY_UNITS } from '@/types';
import type { MethodologyData, MethodologyFactorRow, MethodologyQualityRow, Scope } from '@/types';

/**
 * Assembles methodology data for the GHG Protocol PDF report.
 *
 * For each category that has a recorded EmissionEntry or MaterialEntry:
 * - Looks up the full EmissionFactor record (factorKg, unit, source, validYear)
 *   using the same year-fallback logic as getEmissionFactor()
 * - Collects the inputMethod (for categories with multiple entries, uses the
 *   most "specific" method: OCR > CSV > MANUAL)
 *
 * Graceful degradation: missing factors produce a row with null values
 * rather than throwing an error.
 *
 * @param yearId  - Database ID of the ReportingYear
 * @param year    - Calendar year (for factor lookup)
 * @param profile - CompanyProfile (provides boundary notes and exclusions)
 * @returns MethodologyData ready to pass to GHGReport as a prop
 */
export async function assembleMethodologyData(
  yearId: number,
  year: number,
  profile: { reportingBoundaryNotes?: string | null; exclusions?: string | null }
): Promise<MethodologyData>
```

**Assembly logic (pseudo-code)**:

1. Fetch all `EmissionEntry` records for `yearId` (applying `isFinalAnnual`
   logic identical to `getTotalCO2e()` to avoid double-counting categories).
2. Fetch all `MaterialEntry` records for `yearId`.
3. For each unique category key (from entries + materials):
   a. Call `getEmissionFactorRecord(categoryKey, year)`.
   b. If not found, create a row with `factorKg: null`, `source: null`,
      `validYear: null`, `unit: CATEGORY_UNITS[category] ?? '—'`.
   c. Determine `inputMethod` for that category:
      - If multiple entries exist (monthly billing), pick by priority
        `OCR > CSV > MANUAL`.
   d. Look up `CATEGORY_LABELS[category]` for the human-readable label.
   e. Determine `scope` from the entry's `.scope` field.
4. Derive `scopesIncluded` as the deduplicated set of scopes from entries.
5. Return a `MethodologyData` object.

**InputMethod priority**: When a category has multiple `EmissionEntry` rows
(e.g., monthly billing), the `inputMethod` for that category is the "most
specific" method across all its rows, using priority `OCR > CSV > MANUAL`.
This reflects that if any row was OCR-confirmed, the category is reported as
`OCR`; if all rows were manual, it is `MANUAL`.

---

### 4. API Route Change in `src/app/api/report/route.ts`

In the `GHG_PROTOCOL` branch of the route handler, after fetching `profile`
and `reportingYear`, call:

```typescript
import { assembleMethodologyData } from '@/lib/methodology';

// (inside GET handler, GHG_PROTOCOL branch only)
const methodology = await assembleMethodologyData(yearId, reportingYear.year, profile);

const doc = React.createElement(GHGReport, {
  profile,
  year: reportingYear.year,
  totals,
  entries: ...,
  materials: ...,
  benchmarkValue: ...,
  methodology,           // NEW prop
});
```

`assembleMethodologyData` is **not** called for the CSRD_QUESTIONNAIRE branch
(that report type is out of scope).

---

### 5. GHGReport Component Changes in `src/components/reports/GHGReport.tsx`

#### Props Change

Add `methodology?: MethodologyData` to `GHGReportProps`. The prop is optional
(`?`) to maintain backward compatibility (e.g., in tests that pre-date this
feature).

#### New Page

Add a new `<Page>` at the end of the `<Document>`, rendered only when
`methodology` is provided. This page replaces the current static "Methodik"
paragraph on the materials page.

The "Methodik" page renders four sub-sections:

1. **Standard & Scope Coverage** — Short introductory paragraph citing the
   GHG Protocol Corporate Standard and listing `methodology.scopesIncluded`.

2. **Emission Factor Table** — One row per `methodology.factorRows` entry:
   `Kategorie | Scope | Faktor (kg CO₂e/unit) | Einheit | Quelle | Jahr`
   Rows with `factorKg: null` render `–` for value and `Faktor nicht gefunden`
   for source.

3. **Data Quality Table** — One row per `methodology.qualityRows` entry:
   `Kategorie | Eingabemethode`
   InputMethod values are rendered as German labels:
   - `MANUAL` → `Manuell`
   - `OCR` → `OCR (Rechnung)`
   - `CSV` → `CSV-Import`

4. **Assumptions & Reporting Boundaries** — Renders
   `methodology.boundaryNotes` and `methodology.exclusions` (identical content
   to the existing `ReportingBoundaries` component on page 1, but repeated
   here as per spec for completeness). If both are null, renders placeholder
   text `"Keine benutzerdefinierten Annahmen eingetragen."`.

The existing static "Methodik" paragraph currently shown on the materials page
should be **removed** from the materials page (its content is superseded by
this dedicated page).

#### Style additions

Reuse existing `styles` from the component (same `tableHeader`, `tableRow`,
`tableRowAlt`, `tableHeaderCell`, `tableCell`, `sectionTitle`, `boundaryBox`
styles). If additional styles are needed for the methodology page, add them
to the existing `StyleSheet.create({...})` call.

---

### 6. File Size Guidance

`GHGReport.tsx` is already around 200 lines. After adding the methodology
page, it will approach the 300-line limit defined in `docs/conventions.md`.
The Developer should extract the methodology page into a separate file
`src/components/reports/GHGReportMethodologyPage.tsx` if the file exceeds
300 lines.

---

### 7. Components Affected

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `MethodologyFactorRow`, `MethodologyQualityRow`, `MethodologyData` interfaces |
| `src/lib/factors.ts` | Add `getEmissionFactorRecord()` function |
| `src/lib/methodology.ts` | **New file** — `assembleMethodologyData()` |
| `src/app/api/report/route.ts` | Call `assembleMethodologyData()`, pass `methodology` prop to `GHGReport` |
| `src/components/reports/GHGReport.tsx` | Accept `methodology?` prop, add methodology `<Page>`, remove static "Methodik" paragraph |
| `src/lib/__tests__/methodology.test.ts` | **New file** — unit tests for `assembleMethodologyData()` |

No Prisma schema changes are required. No new npm packages are needed.

---

### 8. Testing Guidance

Unit tests for `assembleMethodologyData()` (in `src/lib/__tests__/methodology.test.ts`)
should follow the pattern in `src/lib/__tests__/emissions.test.ts`:

- Mock `prisma.emissionEntry.findMany`, `prisma.materialEntry.findMany`
- Mock `getEmissionFactorRecord` (from `src/lib/factors.ts`)
- Test cases:
  - Standard case: returns correct `factorRows` and `qualityRows`
  - Missing factor: row has `factorKg: null`, `source: null`
  - OCR-priority: when entries include OCR and MANUAL rows, `inputMethod` is `OCR`
  - `isFinalAnnual` logic: monthly rows are skipped when a final-annual row exists
  - Empty entries: returns empty arrays, `scopesIncluded: []`

---

## Sequence Diagram

```
GET /api/report?yearId=X&type=GHG_PROTOCOL
       │
       ├─ prisma.reportingYear.findUnique(yearId)   ← existing
       ├─ prisma.companyProfile.findUnique()         ← existing
       ├─ getTotalCO2e(yearId)                       ← existing
       ├─ assembleMethodologyData(yearId, year, profile)  ← NEW
       │     ├─ prisma.emissionEntry.findMany(yearId)
       │     ├─ prisma.materialEntry.findMany(yearId)
       │     └─ getEmissionFactorRecord(key, year)   ← NEW (×N categories)
       └─ React.createElement(GHGReport, { ..., methodology })
             └─ <Document>
                   <Page 1>  Company + Scope tables + Boundaries
                   <Page 2>  Materials (optional, existing)
                   <Page 3>  Methodik & Datenqualität  ← NEW
```
