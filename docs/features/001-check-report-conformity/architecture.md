# Architecture: Check Report Conformity (Feature 001)

## Status

Accepted — see [docs/adr/001-conformity-check-architecture.md](../../adr/001-conformity-check-architecture.md) for full ADR.

## Analysis

The existing architecture is well-suited for this feature. The conformity check logic slots cleanly into `src/lib/` as a pure function module — the same pattern used by `src/lib/emissions.ts`. No new database models are needed beyond a single boolean field on `ReportingYear`.

The feature touches four layers:
1. **Business logic** (`src/lib/conformity.ts`) — pure, testable check engine
2. **API** (`src/app/api/conformity/route.ts`) — thin data-fetching wrapper
3. **UI** — new Dashboard components + wizard additions
4. **PDF** — two new sections in existing report components

## Implementation Guidance

### Core Engine

Create `src/lib/conformity.ts` as a pure synchronous module. No async I/O — all data is passed in. This mirrors the pattern in `src/lib/factors.ts` and keeps the logic unit-testable.

```
runConformityChecks(input: ConformityCheckInput): ConformityCheckResult
detectDoubleCounting(entries): ConformityIssue[]
getMissingCategoryNotices(branche, entries): ConformityIssue[]
```

### API Route

`GET /api/conformity?yearId=N` — mirrors `src/app/api/report/route.ts`. Fetches the same data (reportingYear + entries + materialEntries + profile), calls `runConformityChecks()`, returns JSON.

### Dashboard

The Dashboard Server Component (`src/app/page.tsx`) already loads all required data. Call `runConformityChecks()` server-side and pass `ConformityCheckResult` as a prop to the new `ConformityBadge` client component. No extra DB round-trip.

The `ConformityBadge` client component:
- Renders 🟢 / 🟡 / 🔴 next to the existing "Bericht erstellen" button.
- Opens `ConformityPanel` (modal) on click.
- The `ConformityPanel` re-fetches `GET /api/conformity` when opened (to pick up any changes since page load).

When errors exist and the user clicks "Bericht erstellen" (not via the panel), the button should open `ConformityPanel` instead of navigating to `/api/report`. This requires converting the current `<a>` tag in `page.tsx` into a controlled button inside `ConformityBadge`.

### Wizard Additions

**Screen 3 (Fuhrpark) — Double-counting detection:**
- Call `detectDoubleCounting(entries)` after entries are fetched and on every `onBlur`.
- Render `PlausibilityWarning` (existing component) for DC-01 / DC-02.
- No new components needed.

**All screens — Missing-category prompts:**
- Add a new `InfoNotice` component (`src/components/wizard/InfoNotice.tsx`).
- Light-blue info box with dismiss button; dismissal stored in `localStorage` keyed by `${dismissKey}-${year}`.
- Each wizard screen fetches `branche` from a server prop (the wizard layout loads company profile — verify in `src/app/wizard/` layout).
- Call `getMissingCategoryNotices(branche, entries)` client-side and render one `InfoNotice` per relevant result.

### Schema Change

Add to `ReportingYear` in `prisma/schema.prisma`:

```prisma
scope3Acknowledged Boolean @default(false)
```

Migration name: `add-scope3-acknowledged`.

### Server Action

Add `acknowledgeScope3(yearId: number): Promise<ActionResult>` to `src/lib/actions.ts`. Updates the DB flag and calls `revalidatePath('/')`.

### PDF Changes

Pass `conformityResult: ConformityCheckResult` as a new prop to both `GHGReport` and `CSRDQuestionnaire`.

- `GHGReport`: Add `Datenvollständigkeit` table section (using `conformityResult.categoryStatus`) and a conformity footer statement.
- `CSRDQuestionnaire`: Add Scope 3 completeness section listing Categories 1, 6, 7, 11 from `conformityResult.infos`.

## Components Affected

| File | Change Type |
|------|-------------|
| `prisma/schema.prisma` | Add `scope3Acknowledged` field to `ReportingYear` |
| `src/lib/conformity.ts` | **New** — conformity engine |
| `src/lib/actions.ts` | Add `acknowledgeScope3` server action |
| `src/app/api/conformity/route.ts` | **New** — conformity API route |
| `src/app/page.tsx` | Call conformity engine; render badge |
| `src/components/dashboard/ConformityBadge.tsx` | **New** — badge + report button wrapper |
| `src/components/dashboard/ConformityPanel.tsx` | **New** — pre-download modal |
| `src/components/wizard/InfoNotice.tsx` | **New** — dismissible info notice |
| `src/components/wizard/screens/Screen2Heizung.tsx` | Add missing-category InfoNotice |
| `src/components/wizard/screens/Screen3Fuhrpark.tsx` | Add DC-01/DC-02 double-counting warnings **and** missing-category InfoNotice |
| `src/components/wizard/screens/Screen4Strom.tsx` | Add missing-category InfoNotice |
| `src/components/wizard/screens/Screen5Dienstreisen.tsx` | Add missing-category InfoNotice |
| `src/components/wizard/screens/Screen6Materialien.tsx` | Add missing-category InfoNotice |
| `src/components/wizard/screens/Screen7Abfall.tsx` | Add missing-category InfoNotice |
| `src/components/reports/GHGReport.tsx` | Add Datenvollständigkeit table + footer |
| `src/components/reports/CSRDQuestionnaire.tsx` | Add Scope 3 completeness section |
| `src/app/api/report/route.ts` | Pass conformity result to PDF components |
