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
