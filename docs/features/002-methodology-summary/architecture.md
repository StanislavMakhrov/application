# Architecture: Methodology Summary Block & UBA Parameter Management

**Feature:** `002-methodology-summary`  
**Branch:** `copilot/add-methodology-summary-report`  
**Status:** Accepted

---

## Overview

This feature adds two coordinated capabilities to GrünBilanz:

1. **Methodology Summary Block** — an automatically assembled "Methodik" section in
   every generated PDF report (GHG Protocol + CSRD), and a matching collapsible block
   in the web UI.
2. **UBA Factor Management UI** — a "Emissionsfaktoren" section in Settings where users
   can view, edit, and one-click auto-fill official UBA emission factors per reporting year.

Architecture decisions are documented in four ADRs:

| ADR | Question | Decision |
|-----|----------|----------|
| [ADR-001](adr/ADR-001.md) | UBA reference data source | TypeScript module `src/lib/uba-reference-data.ts` |
| [ADR-002](adr/ADR-002.md) | Methodology block assembly | On-demand via `getMethodologyData(yearId)` |
| [ADR-003](adr/ADR-003.md) | Data model for year-specific factors | Extend `EmissionFactor` with `label` field |
| [ADR-004](adr/ADR-004.md) | API design for factor management | RESTful routes + `uba-fill` sub-resource |

---

## Analysis

The existing architecture handles the core of what is needed:

- `EmissionFactor` already supports year-specific versioning (`validYear` + `@@unique([key, validYear])`).
- The `source` field already stores origin labels (`"UBA 2024"`).
- `factors.ts` provides `getEmissionFactor` / `getAllFactorsForYear` for calculation.
- The settings page already has the section pattern (`FirmenprofilSettings`, `YearManagement`).
- The report API route already assembles all data at request time.

The required changes are incremental:

| Area | Change type |
|------|-------------|
| Prisma schema | Minor — add nullable `label` field to `EmissionFactor` |
| `prisma/seed.ts` | Refactor to use `uba-reference-data.ts` (import, not inline) |
| `src/lib/` | Add 3 new modules: `uba-reference-data.ts`, `methodology.ts`, `factor-labels.ts` |
| `src/app/api/` | Add 5 new route files |
| `src/components/reports/` | Add `MethodologySummary.tsx` (web); extend `GHGReport.tsx` and `CSRDQuestionnaire.tsx` |
| `src/components/settings/` | Add `EmissionsfaktorenSettings.tsx` and sub-components |
| `src/app/settings/page.tsx` | Add new section block |
| `src/app/page.tsx` (dashboard) | Pass methodology data to new `MethodologySummary` component |

---

## Data Model Changes

### 1. `EmissionFactor` — add `label` field

```prisma
model EmissionFactor {
  id        Int      @id @default(autoincrement())
  key       String
  validYear Int
  factorKg  Float
  unit      String
  source    String   // "UBA {year}" or "Benutzerdefiniert {year}"
  label     String?  // NEW: German display name, e.g. "Erdgas", "Strom (Ökostrom)"
  scope     Scope
  createdAt DateTime @default(now())

  @@unique([key, validYear])
}
```

**Migration**: `npx prisma migrate dev --name add_label_to_emission_factor`

The column is nullable for backward compatibility. All new writes (seed + uba-fill)
populate it; the API falls back to a static `FACTOR_LABELS` map for null values.

### 2. No other schema changes required

The `CompanyProfile` already has `reportingBoundaryNotes` and `exclusions`.  
The `EmissionEntry` already has `inputMethod` (`MANUAL` / `OCR` / `CSV`).  
Year-scoped isolation is guaranteed by the existing `@@unique([key, validYear])` constraint.

---

## UBA Reference Data Strategy

**New file:** `src/lib/uba-reference-data.ts`

A typed TypeScript constant (`UBA_REFERENCE_DATA: Record<number, UbaFactor[]>`) ships
the official UBA factor values for each supported year. At minimum: 2023 and 2024.

```typescript
export interface UbaFactor {
  key: string;
  label: string;       // German display name
  factorKg: number;
  unit: string;
  source: string;      // "UBA {year}" — set at definition time
  scope: 'SCOPE1' | 'SCOPE2' | 'SCOPE3';
}

export const UBA_REFERENCE_DATA: Record<number, UbaFactor[]> = {
  2023: [ /* UBA 2023 official values */ ],
  2024: [ /* UBA 2024 official values — same keys as seed.ts, now with labels */ ],
};

export function getUbaReferenceYears(): number[] {
  return Object.keys(UBA_REFERENCE_DATA).map(Number).sort();
}
```

Adding a new year's data requires:
1. Appending one entry to `UBA_REFERENCE_DATA` in this file.
2. Re-running the seed (for fresh deployments) or using the auto-fill UI action.

---

## Methodology Block Assembly

**New file:** `src/lib/methodology.ts`

```typescript
export interface MethodologyData {
  standard: string;                        // "GHG Protocol Corporate Standard"
  factorSourceLabel: string;               // "UBA 2024 Emissionsfaktoren" or "Benutzerdefiniert 2024"
  factorYear: number;
  includedScopes: ('SCOPE1' | 'SCOPE2' | 'SCOPE3')[];  // scopes with ≥1 non-zero entry
  inputMethodCounts: { manual: number; ocr: number; csv: number };
  assumptions: string | null;              // CompanyProfile.reportingBoundaryNotes
  exclusions: string | null;               // CompanyProfile.exclusions
  factors: MethodologyFactor[];
}

export interface MethodologyFactor {
  key: string;
  label: string;     // from DB label field; falls back to FACTOR_LABELS map
  factorKg: number;
  unit: string;
  scope: string;
  source: string;    // "UBA 2024" or "Benutzerdefiniert 2024"
}

export async function getMethodologyData(yearId: number): Promise<MethodologyData>;
```

**Scope inclusion rule**: A scope is included if it has at least one `EmissionEntry`
with `quantity ≠ 0` (including negative values — recycling credits count as participation).

**Factor source label rule**: 
- All factors have `source = "UBA {year}"` → label is `"UBA {year} Emissionsfaktoren"`.
- Any factor has `source ≠ "UBA {year}"` → label is `"Benutzerdefiniert {year}"`.
  (Entire set is flagged; conservative approach for audit clarity.)

**Static fallback:** `src/lib/factor-labels.ts` — a `FACTOR_LABELS: Record<string, string>`
constant for deriving German labels from factor keys when the `label` DB field is null
(migration safety net).

---

## API Endpoints

### New Route Files

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/emission-factors?year={year}` | List all factors for a year |
| `GET` | `/api/emission-factors/years` | List DB years + UBA reference years |
| `PUT` | `/api/emission-factors/[id]` | Update a single factor value (inline edit) |
| `POST` | `/api/emission-factors/uba-fill` | Auto-fill UBA official values for a year |
| `GET` | `/api/methodology?yearId={yearId}` | Return `MethodologyData` (for UI use) |

### `GET /api/emission-factors?year={year}`

Returns factors sorted by scope then key. Example response item:
```json
{
  "id": 1, "key": "ERDGAS", "label": "Erdgas",
  "factorKg": 2.0, "unit": "m³", "scope": "SCOPE1",
  "source": "UBA 2024", "validYear": 2024
}
```

### `GET /api/emission-factors/years`

```json
{ "dbYears": [2023, 2024], "ubaReferenceYears": [2023, 2024] }
```

The UI uses `ubaReferenceYears` to enable/disable the auto-fill button.

### `PUT /api/emission-factors/[id]`

**Body**: `{ "factorKg": number }`  
**Side-effect**: Sets `source` to `"Benutzerdefiniert {validYear}"`.

### `POST /api/emission-factors/uba-fill`

**Body**: `{ "year": number }`  
**Behaviour**: Full replace — upserts all factors for the year from `UBA_REFERENCE_DATA`.  
**Response**: `{ "upsertedCount": 30 }`  
**Error**: 400 if no UBA reference data exists for the year.

### `GET /api/methodology?yearId={yearId}`

Returns a full `MethodologyData` object. Used by the dashboard's `MethodologySummary`
client component and for any future standalone methodology view.

---

## Component Architecture

### New and Modified Components

#### PDF Layer (`src/components/reports/`)

**Modified: `GHGReport.tsx`**
- Add `methodologyData: MethodologyData` prop.
- Replace the static methodology `<Text>` block with a `<MethodologySection data={methodologyData} />` local PDF sub-component.
- `MethodologySection` renders using `@react-pdf/renderer` primitives: a table row per factor, the input-method summary, and the assumptions text.

**Modified: `CSRDQuestionnaire.tsx`**
- Add `methodologyData: MethodologyData` prop.
- Add a dedicated "Methodik" section (as a numbered section within the document body, not an appendix). The CSRD questionnaire format naturally accommodates an additional section.

#### Web Layer (`src/components/reports/`)

**New: `MethodologySummary.tsx`** (`'use client'`)
- Props: `data: MethodologyData`
- Renders a collapsible block using the existing `shadcn/ui` card + button patterns.
- **Collapsed state**: headline `"Methodik: {standard} · {factorSourceLabel} · {scopes}"`
- **Expanded state**: full table of factors, input-method counts, and assumptions text.
- Uses Tailwind CSS for styling, consistent with the existing dashboard cards.

#### Settings Layer (`src/components/settings/`)

**New: `EmissionsfaktorenSettings.tsx`** (`'use client'`)
- Top-level settings section component.
- Year selector (dropdown listing `dbYears`).
- Embeds `EmissionsfaktorenTable` and `UbaFillButton`.

**New: `EmissionsfaktorenTable.tsx`** (`'use client'`)
- Fetches `GET /api/emission-factors?year={year}` on year change.
- Displays an editable table: key, German label, value (inline `<input>`), unit, scope, source badge.
- Rows with `source = "Benutzerdefiniert {year}"` show a distinct visual indicator (e.g., amber dot or "Geändert" badge).
- Dirty-state tracking: changed rows are highlighted; a "Speichern" button triggers `PUT /api/emission-factors/[id]` for each changed row.

**New: `UbaFillButton.tsx`** (`'use client'`)
- Disabled if the selected year is not in `ubaReferenceYears`.
- On click: shows a confirmation dialog with the warning text from the specification.
- On confirm: `POST /api/emission-factors/uba-fill` → success toast → triggers table refresh.
- On error: inline error message.

#### Settings Page (`src/app/settings/page.tsx`)

Add a new `<section>` block after "Berichtsjahre":

```tsx
<section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
  <h2 className="text-base font-semibold text-gray-800 mb-1">Emissionsfaktoren</h2>
  <p className="text-sm text-gray-500 mb-5">
    Emissionsfaktoren pro Berichtsjahr verwalten und offizielle UBA-Werte übernehmen.
  </p>
  <EmissionsfaktorenSettings />
</section>
```

#### Dashboard (`src/app/page.tsx`)

- Call `getMethodologyData(currentYearRecord.id)` in the server component (alongside
  `getTotalCO2e`).
- Pass result to `<MethodologySummary data={methodologyData} />` near the report action buttons.
- No additional client-side fetch required — data arrives via server-side props.

---

## Integration Points with Existing PDF Generation

### Modified: `src/app/api/report/route.ts`

```typescript
import { getMethodologyData } from '@/lib/methodology';

// Inside GET handler, after loading year and profile:
const methodologyData = await getMethodologyData(yearId);

// Pass to both report types:
if (type === 'CSRD_QUESTIONNAIRE') {
  const doc = React.createElement(CSRDQuestionnaire, {
    profile, year: reportingYear.year, totals, methodologyData,
  });
} else {
  const doc = React.createElement(GHGReport, {
    profile, year: reportingYear.year, totals, entries, materials,
    benchmarkValue: benchmark?.co2ePerEmployeePerYear, methodologyData,
  });
}
```

`getMethodologyData` adds ~3 DB queries (factors for year, entry counts grouped by scope
and inputMethod, company profile). With < 30 factors and < 100 entries, this is
negligible against the 3-second PDF SLA.

### Modified: `prisma/seed.ts`

Refactored to import `UBA_REFERENCE_DATA` and iterate:
```typescript
import { UBA_REFERENCE_DATA } from '../src/lib/uba-reference-data';

for (const [yearStr, factors] of Object.entries(UBA_REFERENCE_DATA)) {
  const year = Number(yearStr);
  for (const factor of factors) {
    await prisma.emissionFactor.upsert({
      where: { key_validYear: { key: factor.key, validYear: year } },
      update: { factorKg: factor.factorKg, source: factor.source, label: factor.label },
      create: { ...factor, validYear: year },
    });
  }
}
```

---

## Components Affected Summary

| File | Change | Summary |
|------|--------|---------|
| `prisma/schema.prisma` | Modify | Add `label String?` to `EmissionFactor` |
| `prisma/migrations/<ts>_add_label_to_emission_factor/` | New | Auto-generated migration |
| `prisma/seed.ts` | Modify | Import `UBA_REFERENCE_DATA`; add 2023 factor set |
| `src/lib/uba-reference-data.ts` | New | Typed UBA reference constant for 2023 + 2024 |
| `src/lib/factor-labels.ts` | New | Static German label fallback map |
| `src/lib/methodology.ts` | New | `getMethodologyData(yearId)` service function |
| `src/app/api/emission-factors/route.ts` | New | GET list, year filter |
| `src/app/api/emission-factors/years/route.ts` | New | GET available years |
| `src/app/api/emission-factors/[id]/route.ts` | New | PUT inline update |
| `src/app/api/emission-factors/uba-fill/route.ts` | New | POST auto-fill |
| `src/app/api/methodology/route.ts` | New | GET methodology data |
| `src/app/api/report/route.ts` | Modify | Fetch `methodologyData`; pass to components |
| `src/components/reports/GHGReport.tsx` | Modify | Accept `methodologyData` prop; dynamic Methodik section |
| `src/components/reports/CSRDQuestionnaire.tsx` | Modify | Accept `methodologyData` prop; add Methodik section |
| `src/components/reports/MethodologySummary.tsx` | New | Collapsible web UI for methodology block |
| `src/components/settings/EmissionsfaktorenSettings.tsx` | New | Settings section wrapper |
| `src/components/settings/EmissionsfaktorenTable.tsx` | New | Editable factor table with dirty state |
| `src/components/settings/UbaFillButton.tsx` | New | Auto-fill trigger with confirmation dialog |
| `src/app/settings/page.tsx` | Modify | Add Emissionsfaktoren section |
| `src/app/page.tsx` | Modify | Fetch `methodologyData`; render `<MethodologySummary>` |

---

## Open Questions Resolved

1. **UBA reference years**: Ship 2023 and 2024 at minimum. Future years added by appending
   to `UBA_REFERENCE_DATA` in `src/lib/uba-reference-data.ts` — requires a code deploy.

2. **CSRD methodology placement**: As a dedicated numbered section within the CSRD
   questionnaire body (not an appendix). The structured questionnaire format
   naturally accommodates the additional section without formatting complications.

3. **Factor-level input-method tracking**: Not in scope. Entry-level `inputMethod` counts
   per scope are sufficient for the methodology block summary.

4. **Scope inclusion edge case**: A scope is included if it has at least one entry with
   `quantity ≠ 0`. If all entries for a scope are zero (or the scope has no entries),
   it is omitted from the methodology block's "Enthaltene Scopes" list.

5. **Custom factor label convention**: When **any** factor for a year is manually
   overridden, the entire year's factor set is labelled `"Benutzerdefiniert {year}"` in
   the methodology block. Per-row, the individual `source` badge shows which specific
   factors were changed. This is the conservative approach for audit defensibility.

---

## Security Considerations

- All new API routes operate on emission factor data only — no authentication change
  needed (single-tenant app with no login per the architecture constraints).
- `PUT /api/emission-factors/[id]` validates `factorKg` as a finite number (positive or
  negative integers allowed — negative factors are valid per the existing model).
- `POST /api/emission-factors/uba-fill` validates the year against `getUbaReferenceYears()`
  before writing; unknown years return 400 and no DB writes occur.
- No user-controlled file paths or command injection vectors in any new endpoint.
