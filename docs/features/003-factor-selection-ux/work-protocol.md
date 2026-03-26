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
