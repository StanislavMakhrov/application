# Work Protocol: Factor Selection & Entity Management UX

**Work Item:** `docs/features/003-factor-selection-ux/`
**Branch:** `copilot/add-methodology-summary-to-reports`
**Workflow Type:** Feature
**Created:** 2025-07-14

## Agent Work Log

<!-- Each agent appends their entry below when they complete their work. -->

### Issue Analyst
- **Date:** 2025-07-14
- **Summary:** Investigated the UX bug "it is not clear how to select/change factor and other new entities." Explored all wizard screens (Screen 2–7), the Settings page, the Prisma schema, seed data, and the factors/emissions library. Found that: (1) emission factor values are hardcoded as static hint text in all wizard screens, completely disconnected from the database values they purport to represent; (2) there is no UI to view, select, or override emission factors; (3) several entities introduced in the schema (`IndustryBenchmark`, `StagingEntry`) have no user-visible management interface; (4) Screen 6 (Materials) uses a Select dropdown for `MaterialCategory` but the associated emission factor is also hardcoded, not live from the DB. Documented root cause, UX gaps, and proposed fix approach.
- **Artifacts Produced:**
  - `docs/features/003-factor-selection-ux/issue-analysis.md`
  - `docs/features/003-factor-selection-ux/work-protocol.md`
- **Problems Encountered:** None. All code paths were traceable from the wizard components through to the `EmissionFactor` DB model. The disconnect between hardcoded hint text and live DB factors is the clearest root cause.
