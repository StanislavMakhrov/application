# ADR-001: Conformity Check Architecture

## Status

Accepted

## Context

Feature 001 introduces a pre-report conformity check that validates stored emission data against GHG Protocol Corporate Standard requirements and CSRD supply-chain data-quality expectations. The check must:

1. Power a **ConformityBadge** on the Dashboard (🟢 / 🟡 / 🔴) per reporting year.
2. Drive a **ConformityPanel** (modal) that opens before report download.
3. Detect **double-counting** on Screen 3 (Fuhrpark) in the wizard.
4. Show **missing-category prompts** per wizard screen based on `branche`.
5. Enrich the **GHG PDF** with a `Datenvollständigkeit` table and a conformity footer.
6. Enrich the **CSRD PDF** with a Scope 3 completeness section.

Architectural decisions are needed on:
- Where the conformity logic lives (pure lib vs server-side vs client-side).
- Whether a new API endpoint is needed or if logic is bundled into `/api/report`.
- Whether `scope3Acknowledged` (for GHG-W01) lives in the DB or `localStorage`.
- How the dashboard integrates the badge without breaking its server-component model.

### Relevant Codebase Facts

- **Single-tenant app** — one company per installation, no auth.
- **Dashboard** (`src/app/page.tsx`) is a React Server Component that already fetches `ReportingYear`, `EmissionEntry`, `MaterialEntry`, and `CompanyProfile` at request time.
- **Report generation** (`src/app/api/report/route.ts`) is a `GET` route that fetches the same data, calculates totals via `getTotalCO2e()`, and passes everything into PDF components.
- **Emission engine** (`src/lib/emissions.ts`) is a pure async function library used by both the dashboard and the report API.
- **Wizard screens** are `'use client'` components that fetch their own data via `/api/entries` and call Server Actions (`src/lib/actions.ts`) to persist.
- **PlausibilityWarning** (`src/components/wizard/PlausibilityWarning.tsx`) is the existing amber-warning pattern; conformity warnings should reuse it.

---

## Options Considered

### Option A: Bundle conformity logic into `/api/report` pre-flight

**Description:** Extend the existing `GET /api/report` route to run all checks before rendering the PDF. Return a 422 (or redirect) if errors are found. The dashboard badge would require a separate lightweight API call or server-side computation.

**Pros:**
- Fewer new files.
- Conformity always runs before PDF generation.

**Cons:**
- Tight coupling: report generation and conformity validation become inseparable.
- The dashboard badge and ConformityPanel need their own data source anyway, leading to duplicate logic or an awkward pattern.
- Makes the report route harder to test in isolation.
- Does not satisfy the spec requirement that "Trotzdem herunterladen" bypasses the check.

### Option B: Dedicated `GET /api/conformity?yearId=N` route + pure-function engine

**Description:** Extract all check logic into a pure synchronous function `runConformityChecks(data)` in `src/lib/conformity.ts`. Create a thin `GET /api/conformity` route that loads data and calls this function. The dashboard Server Component calls the function directly (no extra HTTP round-trip). The ConformityPanel fetches the route client-side when opened. The report route optionally calls the function to get the `categoryStatus` array it passes into the PDF components.

**Pros:**
- Single source of truth for check rules — no duplication.
- Pure function is unit-testable without DB or HTTP.
- Dashboard avoids an extra network call (calls the function directly).
- Clean separation: report generation never blocks on conformity result.
- Satisfies "Trotzdem herunterladen" without hacks.

**Cons:**
- One additional API route and source file.

### Option C: Client-side only (compute in the browser)

**Description:** Download all emission entries to the browser and run checks in client JavaScript.

**Pros:**
- No server changes.

**Cons:**
- The dashboard is a Server Component; mixing SSR and client-side data loading is complex.
- Exposes raw emission data to the browser unnecessarily.
- PDF generation is server-side, so conformity data for the PDF must go through the server anyway.

---

## Decision

Use **Option B** — a pure-function conformity engine in `src/lib/conformity.ts`, plus a dedicated `GET /api/conformity?yearId=N` route.

---

## Rationale

- **Testability**: Pure functions with no I/O side effects are the easiest kind of logic to unit-test exhaustively. Every check ID (GHG-01 … CSRD-04) should have a test case; that is only practical with a pure function.
- **Separation of concerns**: Report generation should never be responsible for deciding whether the data is "good enough." That is the conformity engine's job.
- **Dashboard efficiency**: The dashboard Server Component already has all the data in memory. Calling `runConformityChecks()` directly avoids an extra HTTP round-trip, keeping dashboard load well under the 2-second budget.
- **Single source of truth**: Both the badge (SSR), the ConformityPanel (CSR via API), and the PDF (SSR via report route) consume the same function with the same logic.

---

## Scope 3 Acknowledgement (GHG-W01) — Open Question Resolution

**Decision**: Store `scope3Acknowledged` as a boolean field on the `ReportingYear` model (DB), not in `localStorage`.

**Rationale**: The acknowledgement has business significance (the user has explicitly stated they are not yet capturing Scope 3 emissions). It should be durable, tied to a specific year, and reflected in the PDF. `localStorage` would be lost if the user clears the browser or switches devices. The schema already has the right place for it.

**UX**: A checkbox labelled *"Scope 3 noch nicht erfasst (explizit bestätigt)"* in the ConformityPanel warning for GHG-W01. Checking it calls a new Server Action `acknowledgeScope3(yearId)` which updates the DB flag.

---

## Double-Counting Resolution (DC-01, DC-02) — Open Question Resolution

**Decision**: Navigation only — no one-click "Remove entries" action.

**Rationale**: The specification states "the feature warns and suggests; it never silently modifies confirmed emission entries." One-click removal would add significant wizard-screen complexity with little benefit. The amber warning persists clearly, and the user manually removes the conflicting entry. This is consistent with the existing `PlausibilityWarning` pattern.

---

## Consequences

### Positive

- All check rules live in one file (`src/lib/conformity.ts`), making it straightforward to add new checks in future.
- Dashboard performance is not affected (no extra DB query; uses already-fetched data).
- PDF generation time stays well under 3 seconds because the conformity data is passed in as a pre-computed struct, not recalculated inside the PDF renderer.
- The "Trotzdem herunterladen" UX requirement is trivially satisfied — the download button in `ConformityPanel` always calls `/api/report` directly.

### Negative

- A schema migration is needed to add `scope3Acknowledged` to `ReportingYear`.
- Developers must ensure that when data passed to `runConformityChecks()` changes shape (e.g. new entry fields), the function signature is updated accordingly.

---

## Implementation Notes

### 1. New File: `src/lib/conformity.ts`

The conformity engine. Contains:

```typescript
// --- Types ---

export type ConformityIssueSeverity = 'error' | 'warning' | 'info';

export interface ConformityIssue {
  id: string;               // e.g. "GHG-01"
  severity: ConformityIssueSeverity;
  titleDe: string;          // short German title (≤ 60 chars)
  descriptionDe: string;    // human-readable German description
  wizardScreen?: number;    // 1–7, for navigation link in ConformityPanel
}

export type ConformityStatus = 'konform' | 'hinweise' | 'nicht-konform';

export interface CategoryStatus {
  categoryKey: string;      // EmissionCategory key or 'MATERIALIEN'
  labelDe: string;
  scope: Scope;
  status: 'captured' | 'not-captured';
  inputMethod?: InputMethod;
}

export interface ConformityCheckResult {
  status: ConformityStatus; // derived: errors → nicht-konform, warnings only → hinweise, clean → konform
  errors: ConformityIssue[];
  warnings: ConformityIssue[];
  infos: ConformityIssue[];
  categoryStatus: CategoryStatus[]; // for the Datenvollständigkeit PDF table
}

// --- Input shape ---

export interface ConformityCheckInput {
  year: number;
  entries: Array<{
    category: EmissionCategory;
    scope: Scope;
    quantity: number;
    isOekostrom: boolean;
    inputMethod: InputMethod;
  }>;
  materialEntries: Array<{ quantityKg: number; inputMethod: InputMethod }>;
  profile: {
    firmenname: string;
    branche: Branche;
    mitarbeiter: number;
    standort: string;
  } | null;
  totals: CO2eTotals;
  scope3Acknowledged: boolean; // from ReportingYear.scope3Acknowledged
}

// --- Entry point ---

export function runConformityChecks(input: ConformityCheckInput): ConformityCheckResult
```

The conformity engine (`src/lib/conformity.ts`) is intentionally **synchronous** — `runConformityChecks()` takes a pre-loaded data struct and returns a result with no I/O side effects. All database access happens in the caller (the API route or the dashboard Server Component) before the function is invoked. This is a deliberate design choice to make the logic unit-testable without mocking Prisma. The emission engine (`src/lib/emissions.ts`) is async because it queries the DB for emission factors; the conformity engine does not need to, since it operates on already-computed `CO2eTotals` and raw entry lists.

Also exports:
- `detectDoubleCounting(entries): ConformityIssue[]` — used client-side in Screen3Fuhrpark
- `getMissingCategoryNotices(branche, entries): ConformityIssue[]` — used client-side in wizard screens
- `BRANCHE_EXPECTED_CATEGORIES: Record<Branche, { scope1: EmissionCategory[], scope3: (EmissionCategory | 'MATERIALIEN')[] }>` — the mapping table from the specification

### 2. New File: `src/app/api/conformity/route.ts`

```typescript
// GET /api/conformity?yearId=N
// Returns ConformityCheckResult as JSON.
// Fetches data from DB; calls runConformityChecks().
export async function GET(req: NextRequest): Promise<NextResponse>
```

Pattern mirrors `src/app/api/report/route.ts`. Must run on Node.js runtime (Prisma).

### 3. Schema Migration

Add to `ReportingYear` in `prisma/schema.prisma`:

```prisma
scope3Acknowledged Boolean @default(false)
```

Requires a new migration: `npx prisma migrate dev --name add-scope3-acknowledged`.

### 4. New Server Action: `acknowledgeScope3(yearId: number)`

Add to `src/lib/actions.ts`. Updates `ReportingYear.scope3Acknowledged = true` and calls `revalidatePath('/')`.

### 5. Dashboard Integration (`src/app/page.tsx`)

- After fetching `currentYearRecord`, call `runConformityChecks()` with the already-loaded data.
- Pass `conformityResult` to a new `ConformityBadge` client component rendered next to the "Bericht erstellen" button.
- `ConformityBadge` accepts the initial result as a prop (no client-side fetch needed on first render).
- The `ConformityPanel` is a modal rendered by `ConformityBadge`; it receives `yearId` and refetches via `/api/conformity` if the user has made changes before opening it.

### 6. New Components

| Component | Location | Type |
|-----------|----------|------|
| `ConformityBadge` | `src/components/dashboard/ConformityBadge.tsx` | `'use client'` |
| `ConformityPanel` | `src/components/dashboard/ConformityPanel.tsx` | `'use client'` |
| `InfoNotice` | `src/components/wizard/InfoNotice.tsx` | `'use client'` (reusable light-blue info box) |

**`ConformityBadge` props:**
```typescript
interface ConformityBadgeProps {
  initialResult: ConformityCheckResult;
  yearId: number;
  reportUrl: string; // pre-computed /api/report URL
}
```

**`ConformityPanel` props:**
```typescript
interface ConformityPanelProps {
  result: ConformityCheckResult;
  year: number;
  yearId: number;
  isOpen: boolean;
  onClose: () => void;
  reportUrl: string;
}
```

**`InfoNotice` props:**
```typescript
interface InfoNoticeProps {
  message: string;
  dismissKey: string; // unique key for localStorage dismissal
}
```

### 7. Wizard Screen Changes

**Screen3Fuhrpark** (`src/components/wizard/screens/Screen3Fuhrpark.tsx`):
- After fetching existing entries, call `detectDoubleCounting(entries)` and store results in state.
- Render `PlausibilityWarning` for DC-01 / DC-02 below the relevant fields.
- Re-run detection on every `onBlur` for the diesel/km fields (already the pattern for plausibility warnings).

**All wizard screens (1–7)**:
- On mount, check `getMissingCategoryNotices(branche, entries)` for relevant categories.
- Render `InfoNotice` for each notice (dismissible via `localStorage`).
- `branche` must be fetched (or passed down) — can be loaded via `/api/entries` or a new lightweight `/api/profile` endpoint. Prefer fetching from an existing endpoint to avoid a new route.

**Implementation note on branche in wizard**: The wizard pages (`src/app/wizard/[screen]/page.tsx`) are Server Components. They can pass `branche` as a prop to the screen client components. Check if the wizard layout already loads company profile.

### 8. PDF Changes

**`GHGReport.tsx`** — two new sections:

1. **Datenvollständigkeit table** (after Methodology section): Rendered from `categoryStatus[]` array passed as a new `conformityResult` prop.
2. **Conformity footer statement** (page 1, below existing footer): Two static strings (conformant / non-conformant), chosen based on `conformityResult.status`.

**`CSRDQuestionnaire.tsx`** — one new section:

1. **Scope 3 – Erfassungsgrad** (section 2b): Four rows for Categories 1, 6, 7, 11; status from `conformityResult.infos` filtered by CSRD check IDs.

**`src/app/api/report/route.ts`** — call `runConformityChecks()` with the already-fetched data and pass `conformityResult` to both PDF components.

### 9. Type Changes (`src/types/index.ts`)

Add and export `ConformityCheckResult`, `ConformityIssue`, `ConformityIssueSeverity`, `ConformityStatus`, `CategoryStatus`, `ConformityCheckInput` from `src/lib/conformity.ts` (re-export for consumer convenience, or keep them in the lib file and import directly — either is acceptable; prefer the lib file as the canonical source).

---

## Component and Data Flow Diagram

```
                    ┌─────────────────────────────────────────────────────┐
                    │  Dashboard Server Component (src/app/page.tsx)      │
                    │  - Fetches: ReportingYear, entries, profile          │
                    │  - Calls: runConformityChecks(data) ──────────────── │──► ConformityCheckResult
                    │  - Renders: <ConformityBadge initialResult={...} />  │
                    └──────────────┬──────────────────────────────────────┘
                                   │ SSR prop
                                   ▼
                    ┌─────────────────────────────┐
                    │  ConformityBadge (client)    │
                    │  Shows: 🟢 / 🟡 / 🔴 badge   │
                    │  onClick → opens Panel       │
                    └──────────┬──────────────────┘
                               │ opens
                               ▼
                    ┌─────────────────────────────────────────┐
                    │  ConformityPanel (client modal)          │
                    │  - Fetches: GET /api/conformity?yearId=N │
                    │  - Shows: Fehler / Warnungen / Hinweise  │
                    │  - "Trotzdem herunterladen" → /api/report│
                    └─────────────────────────────────────────┘

                    ┌─────────────────────────────────────────┐
                    │  GET /api/conformity?yearId=N            │
                    │  - Fetches DB data                       │
                    │  - Calls: runConformityChecks(data)      │
                    │  - Returns: ConformityCheckResult JSON   │
                    └─────────────────────────────────────────┘

                    ┌─────────────────────────────────────────┐
                    │  GET /api/report?yearId=N                │
                    │  - Fetches DB data                       │
                    │  - Calls: runConformityChecks(data)      │
                    │  - Passes conformityResult to:           │
                    │    ├── GHGReport (Datenvollständigkeit   │
                    │    │             + footer statement)     │
                    │    └── CSRDQuestionnaire (Scope 3 table) │
                    └─────────────────────────────────────────┘

                    ┌────────────────────────────────────────────────────────┐
                    │  src/lib/conformity.ts                                  │
                    │  runConformityChecks(input) → ConformityCheckResult     │
                    │  detectDoubleCounting(entries) → ConformityIssue[]      │
                    │  getMissingCategoryNotices(branche, entries) → ...      │
                    └────────────────────────────────────────────────────────┘
                                ▲             ▲              ▲
                                │             │              │
                    Dashboard   │   API route │   Wizard     │
                    (SSR)       │   (SSR)     │   screens    │
                                              │   (CSR)      │
```

---

## Files To Create

| File | Purpose |
|------|---------|
| `src/lib/conformity.ts` | Pure conformity engine (check logic + types) |
| `src/app/api/conformity/route.ts` | `GET /api/conformity?yearId=N` |
| `src/components/dashboard/ConformityBadge.tsx` | Dashboard badge (client component) |
| `src/components/dashboard/ConformityPanel.tsx` | Pre-download modal (client component) |
| `src/components/wizard/InfoNotice.tsx` | Dismissible info notice (client component) |

## Files To Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `scope3Acknowledged Boolean @default(false)` to `ReportingYear` |
| `src/lib/actions.ts` | Add `acknowledgeScope3(yearId)` server action |
| `src/app/page.tsx` | Call `runConformityChecks()` + render `ConformityBadge` |
| `src/app/api/report/route.ts` | Call `runConformityChecks()` + pass result to PDF components |
| `src/components/reports/GHGReport.tsx` | Add `Datenvollständigkeit` table + conformity footer |
| `src/components/reports/CSRDQuestionnaire.tsx` | Add Scope 3 completeness section |
| `src/components/wizard/screens/Screen3Fuhrpark.tsx` | Add DC-01/DC-02 double-counting detection |
| `src/components/wizard/screens/Screen*.tsx` | Add missing-category `InfoNotice` per screen |
| `src/types/index.ts` | No changes required — types live in `src/lib/conformity.ts` |
