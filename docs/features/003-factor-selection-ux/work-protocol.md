# Work Protocol: Factor Selection & Entity Management UX

**Work Item:** `docs/features/003-factor-selection-ux/`
**Branch:** `copilot/add-methodology-summary-to-reports`
**Workflow Type:** Feature
**Created:** 2025-07-14

## Agent Work Log

<!-- Each agent appends their entry below when they complete their work. -->

### Architect
- **Date:** 2025-07-14
- **Summary:** Designed the technical approach for dynamic factor display in wizard screens and a read-only Emissionsfaktoren reference table in Settings. Explored all six wizard screens (confirmed all are `'use client'`), the existing `src/lib/factors.ts` functions, the Settings Server Component, the `prisma/seed.ts` to verify all 30 factor keys, and the `src/types/index.ts` type definitions. Evaluated two options (per-screen fetch vs. shared hook + component) and chose Option B (shared hook) for DRY consistency with architecture quality goal "All CO₂e calculations must use versioned UBA emission factors from DB — never hardcoded values".
- **Artifacts Produced:**
  - `docs/features/003-factor-selection-ux/architecture.md`
- **Problems Encountered:** None. All required factor keys are already in the DB as `EmissionFactor` records. No schema changes are needed for Priority 1–3 scope. The `getAllEmissionFactorRecords()` function is a simple extension of existing `getAllFactorsForYear()` logic.

### Issue Analyst
- **Date:** 2025-07-14
- **Summary:** Investigated the UX bug "it is not clear how to select/change factor and other new entities." Explored all wizard screens (Screen 2–7), the Settings page, the Prisma schema, seed data, and the factors/emissions library. Found that: (1) emission factor values are hardcoded as static hint text in all wizard screens, completely disconnected from the database values they purport to represent; (2) there is no UI to view, select, or override emission factors; (3) several entities introduced in the schema (`IndustryBenchmark`, `StagingEntry`) have no user-visible management interface; (4) Screen 6 (Materials) uses a Select dropdown for `MaterialCategory` but the associated emission factor is also hardcoded, not live from the DB. Documented root cause, UX gaps, and proposed fix approach.
- **Artifacts Produced:**
  - `docs/features/003-factor-selection-ux/issue-analysis.md`
  - `docs/features/003-factor-selection-ux/work-protocol.md`
- **Problems Encountered:** None. All code paths were traceable from the wizard components through to the `EmissionFactor` DB model. The disconnect between hardcoded hint text and live DB factors is the clearest root cause.

### Task Planner
- **Date:** 2025-07-14
- **Summary:** Created actionable implementation task plan for the Factor Selection & Display UX feature. Read all three prior agent artifacts (issue analysis, architecture, test plan) and produced 15 ordered tasks covering: the `FactorRecord` type addition, the new `getAllEmissionFactorRecords()` lib function, the `/api/factors` API route, the `useFactors` hook, the `FactorHint` component, all six wizard screen updates (Screens 2–7), the two new Settings server components (`EmissionFactorsTable`, `IndustryBenchmarkTable`), the Settings page integration, and the full unit test suite (18 test cases). Each task has clear, measurable acceptance criteria and explicit dependency tracking.
- **Artifacts Produced:**
  - `docs/features/003-factor-selection-ux/tasks.md` — 15 tasks in implementation order
- **Problems Encountered:** None. Architecture doc was thorough and unambiguous. All design decisions were pre-resolved; no open questions remain.

### Quality Engineer
- **Date:** 2025-07-14
- **Summary:** Defined comprehensive test plan for the Factor Selection & Display UX feature (18 test cases across 6 test files). Explored all existing test patterns in `src/lib/__tests__/` (Vitest, vi.mock Prisma, describe/it/expect conventions). Mapped all 5 acceptance criteria (AC-1 through AC-5) to specific test cases. Created both an automated test plan and a UAT test plan for Maintainer review of the running app.
- **Artifacts Produced:**
  - `docs/features/003-factor-selection-ux/test-plan.md` — 18 test cases covering `getAllEmissionFactorRecords`, `/api/factors` route, `FactorHint` component, `EmissionFactorsTable`, `IndustryBenchmarkTable`, and `useFactors` hook
  - `docs/features/003-factor-selection-ux/uat-test-plan.md` — 5 manual verification steps for the running app (wizard screens, Settings page, browser console)
- **Problems Encountered:** None. All new components have clear contracts defined in the architecture doc; mocking strategy follows the same pattern as `factors.test.ts` and `methodology.test.ts`. No new test infrastructure is required.

### Developer
- **Date:** 2025-07-14
- **Summary:** Implemented all 15 tasks for the Factor Selection & Display UX feature. Replaced all hardcoded emission factor hint strings in the 6 wizard screens with live DB-driven values via a shared `useFactors` hook and `FactorHint` component. Added read-only emission factor and benchmark tables to the Settings page. Implemented all 18 test cases from the test plan (65 total tests, all passing). Installed `jsdom` and `@testing-library/react` as devDependencies to support React hook tests. Configured vitest with esbuild automatic JSX transform for component rendering tests.
- **Artifacts Produced:**
  - `src/types/index.ts` — added `FactorRecord` interface
  - `src/lib/factors.ts` — added `getAllEmissionFactorRecords(year)` function
  - `src/app/api/factors/route.ts` — new GET /api/factors?year=YYYY endpoint
  - `src/app/api/factors/__tests__/route.test.ts` — API route tests (TC-05–07)
  - `src/hooks/useFactors.ts` — new client hook
  - `src/hooks/__tests__/useFactors.test.ts` — hook tests (TC-16–18)
  - `src/components/wizard/FactorHint.tsx` — presentational hint component
  - `src/components/wizard/__tests__/FactorHint.test.tsx` — component tests (TC-08–11)
  - `src/components/wizard/screens/Screen2–7.tsx` — replaced all hardcoded hints
  - `src/components/settings/EmissionFactorsTable.tsx` — new server component
  - `src/components/settings/__tests__/EmissionFactorsTable.test.tsx` — tests (TC-12–14)
  - `src/components/settings/IndustryBenchmarkTable.tsx` — new server component
  - `src/components/settings/__tests__/IndustryBenchmarkTable.test.tsx` — test (TC-15)
  - `src/app/settings/page.tsx` — added two new reference table sections
  - `src/lib/__tests__/factors.test.ts` — added TC-01–04 for `getAllEmissionFactorRecords`
  - `src/vitest.config.ts` — added esbuild automatic JSX transform
- **Problems Encountered:**
  - `@testing-library/react` and `jsdom` were not pre-installed; installed as devDependencies since 11/18 test cases required React rendering infrastructure. Noted this as a new dependency addition.
  - `@vitejs/plugin-react` not available; used `esbuild.jsx: 'automatic'` in vitest config instead.
  - Pre-existing `calculateTotal.test.ts` TypeScript error (FieldDocument type) not introduced by this work.
  - Pre-existing Next.js build failure on `@prisma/client` initialization (no DATABASE_URL in CI); TypeScript compilation and lint both pass.

### Code Reviewer
- **Date:** 2025-07-14
- **Summary:** Reviewed all 25 changed files. All 65 tests pass. All 5 acceptance criteria (AC-1 through AC-5) are fully implemented and tested. No Blockers found in the implementation. Fixed `docs/features.md` directly (feature 003 row was missing — Major documentation gap). Identified one Minor code issue (misleading comment in `EmissionFactorsTable.getScope()`) and noted pre-existing markdownlint errors in `architecture.md` and `tasks.md` from prior agents. Technical Writer agent has not logged work; `docs/architecture.md` should be updated with the new API route and components. Decision: **Approved** pending Technical Writer step.
- **Artifacts Produced:**
  - `docs/features/003-factor-selection-ux/code-review.md`
  - `docs/features.md` — added feature 003 entry (fixed directly)
- **Problems Encountered:** `docs/features.md` was not updated by any prior agent; fixed directly as per reviewer mandate.

### Technical Writer
- **Date:** 2025-07-14
- **Summary:** Updated `docs/architecture.md` to document the new `GET /api/factors?year=YYYY` endpoint (added to API routes tree), the `useFactors` hook (`src/hooks/useFactors.ts`), and the two new Settings server components (`EmissionFactorsTable`, `IndustryBenchmarkTable`). Also added the `hooks/` directory to the file-tree section of the architecture document. No new documentation files were required; `docs/features.md` was already updated by the Code Reviewer.
- **Artifacts Produced:**
  - `docs/architecture.md` — added `/api/factors` route, `hooks/useFactors.ts`, `EmissionFactorsTable`, `IndustryBenchmarkTable`
  - `docs/features/003-factor-selection-ux/work-protocol.md` — this entry
- **Problems Encountered:** None.
