# Work Protocol: Scope 2 Location-Based and Market-Based Calculations

**Work Item:** `docs/features/002-scope2-location-market-based-calculations/`
**Branch:** `copilot/support-location-market-based-calculations`
**Workflow Type:** Feature
**Issue:** #59
**PR:** #60
**Created:** 2026-03-24

## Required Agents

| Agent | Status |
|-------|--------|
| Requirements Engineer | ✅ Complete |
| Architect | ✅ Complete |
| Quality Engineer | ✅ Complete |
| Task Planner | ✅ Complete |
| Developer | ✅ Complete |
| Technical Writer | ✅ Complete |
| Code Reviewer | ✅ Complete |
| UAT Tester | ⚠️ Required (user-facing PDF change) |
| Release Manager | ⬜ Pending |
| Retrospective | ⬜ Pending |

## Agent Work Log

### Requirements Engineer
- **Date:** 2026-03-24
- **Summary:** Analysed GHG Protocol § 6.3 requirements and the existing GrünBilanz Scope 2 calculation (`isOekostrom` flag, single value). Defined the need for dual-method reporting (location-based + market-based), side-by-side PDF comparison, and wizard copy clarification. Produced the feature specification.
- **Artifacts Produced:** `docs/features/002-scope2-location-market-based-calculations/specification.md`, `docs/features/002-scope2-location-market-based-calculations/work-protocol.md`
- **Problems Encountered:** None

### Architect
- **Date:** 2026-03-24
- **Summary:** Reviewed `src/types/index.ts`, `src/lib/emissions.ts`, `src/components/reports/GHGReport.tsx`, and `src/components/wizard/screens/Screen4Strom.tsx`. Determined no schema migration is needed — `isOekostrom` on `EmissionEntry` is sufficient. Designed the `scope2LocationKg` accumulator pattern and the conditional PDF block. Confirmed `total` remains market-based per GHG Protocol hierarchy.
- **Artifacts Produced:** `docs/features/002-scope2-location-market-based-calculations/architecture.md`
- **Problems Encountered:** None

### Quality Engineer
- **Date:** 2026-03-24
- **Summary:** Defined two unit test cases covering the equal-values (no Ökostrom) and distinct-values (with Ökostrom) scenarios, plus an edge-case table. Confirmed all acceptance criteria are testable with pure unit tests using existing mock infrastructure.
- **Artifacts Produced:** `docs/features/002-scope2-location-market-based-calculations/test-plan.md`
- **Problems Encountered:** None

### Task Planner
- **Date:** 2026-03-24
- **Summary:** Decomposed the feature into five tasks: type extension, dual accumulation, PDF block, wizard copy, and unit tests. Assigned priorities and documented file-level dependencies.
- **Artifacts Produced:** `docs/features/002-scope2-location-market-based-calculations/tasks.md`
- **Problems Encountered:** None

### Developer
- **Date:** 2026-03-24
- **Summary:** Implemented all five tasks. Added `scope2LocationBased` to `CO2eTotals`, updated `getTotalCO2e` to accumulate both values, added the conditional PDF comparison block, updated the wizard checkbox description, and added two new unit tests. All pre-existing tests continue to pass.
- **Artifacts Produced:** Changes in `src/types/index.ts`, `src/lib/emissions.ts`, `src/app/page.tsx`, `src/components/reports/GHGReport.tsx`, `src/components/wizard/screens/Screen4Strom.tsx`, `src/lib/__tests__/emissions.test.ts`
- **Problems Encountered:** None

### Technical Writer
- **Date:** 2026-03-24
- **Summary:** Reviewed PR #60 changes for documentation completeness. Created the `docs/features/002-*` folder with all standard files (specification, architecture, tasks, test-plan, work-protocol). Confirmed no user-facing documentation pages needed updating.
- **Artifacts Produced:** All files in `docs/features/002-scope2-location-market-based-calculations/`
- **Problems Encountered:** The `docs/features/002-*` folder was missing from the original PR — this work-protocol documents that gap and its resolution.

### Code Reviewer
- **Date:** 2026-03-24
- **Summary:** Reviewed PR #60. Implementation is clean, no rework needed. Documentation gap (missing `docs/features/002-*`) flagged and resolved in follow-up branch `copilot/fix-docs-features-not-filling`.
- **Artifacts Produced:** None (review only)
- **Problems Encountered:** Missing docs/features folder — resolved by this branch.
