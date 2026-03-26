# Work Protocol: Add Methodology Summary to Every Generated Report

**Work Item:** `docs/features/002-methodology-summary/`
**Branch:** `copilot/add-methodology-summary-to-reports`
**Workflow Type:** Feature
**Created:** 2025-07-14

## Agent Work Log

<!-- Each agent appends their entry below when they complete their work. -->

### Requirements Engineer
- **Date:** 2025-07-14
- **Summary:** Gathered requirements for the methodology summary feature based on the GitHub issue description and exploration of the existing codebase (GHGReport component, Prisma schema, report API route, and emissions library). Produced a Feature Specification covering the standard declaration, emission factor table, data quality indicators, assumptions/boundary notes, and backend assembly from existing records. Identified open questions around factor table scope and page layout.
- **Artifacts Produced:**
  - `docs/features/002-methodology-summary/specification.md`
  - `docs/features/002-methodology-summary/work-protocol.md`
- **Problems Encountered:** None. The existing codebase has all required data already available (EmissionFactor records, EmissionEntry.inputMethod, CompanyProfile boundary notes), making the backend assembly straightforward for the Architect and Developer to implement.

### Architect
- **Date:** 2025-07-14
- **Summary:** Analyzed the existing report generation architecture (API route → lib functions → GHGReport component) and designed the methodology data assembly approach. Evaluated three implementation options: inline assembly in the API route, assembly in the component, and a new `assembleMethodologyData()` function in `src/lib/methodology.ts`. Chose Option 3 (new lib function) as it best follows the established pattern (same as `getTotalCO2e()`), keeps the API route lean, and keeps `GHGReport` a purely presentational component.
- **Artifacts Produced:**
  - `docs/features/002-methodology-summary/architecture.md` — full ADR with data shape, component design, sequence diagram, and file-level change guidance
- **Problems Encountered:** None. No Prisma schema changes are needed. No new npm packages are needed. The `EmissionFactor` model already stores all required metadata (`unit`, `source`, `validYear`). The only DB-level gap is that `factors.ts` currently only exposes the numeric factor value — the architecture adds `getEmissionFactorRecord()` to return the full record object for methodology purposes.

### Quality Engineer
- **Date:** 2025-07-14
- **Summary:** Reviewed specification and architecture documents and explored existing unit test patterns in `src/lib/__tests__/` (emissions, factors, calculateTotal). Produced a comprehensive test plan covering all acceptance criteria with 17 test cases across two files (`methodology.test.ts` and an extension of `factors.test.ts`). Also produced a UAT test plan covering manual PDF inspection steps for all user-facing acceptance criteria. Test cases follow the `methodName_scenario_expectedResult` naming convention and the Vitest/mock-Prisma pattern established by the existing test suite.
- **Artifacts Produced:**
  - `docs/features/002-methodology-summary/test-plan.md` — 17 unit test cases, coverage matrix, edge case table
  - `docs/features/002-methodology-summary/uat-test-plan.md` — 7-step UAT walkthrough for manual PDF verification
- **Problems Encountered:** None. All required data and test infrastructure already exist. The `MaterialEntry` model does not carry a `scope` field (materials are always Scope 3), which TC-13 explicitly asserts — flagged as an implementation note for the Developer.

### Task Planner
- **Date:** 2025-07-14
- **Summary:** Reviewed specification, architecture, test plan, and existing codebase (`src/types/index.ts`, `src/lib/factors.ts`, `src/lib/__tests__/factors.test.ts`) to understand the implementation context. Produced a 5-task implementation plan ordered by dependency, covering all aspects of the feature: type definitions, factor record lookup helper, methodology assembly function, API route wiring, and GHGReport component rendering.
- **Artifacts Produced:**
  - `docs/features/002-methodology-summary/tasks.md` — 5 ordered tasks with acceptance criteria, dependencies, and open questions
- **Problems Encountered:** No `MATERIAL_UNITS` map found in `src/types/index.ts` (only `CATEGORY_UNITS` for emission categories exists). Flagged as an open question for the Developer to handle inline within `assembleMethodologyData()`. No existing unit test file for the API route was found; TC-17 deferred to manual code inspection or UAT as recommended in the test plan.

### Developer
- **Date:** 2025-07-14
- **Summary:** Implemented all 5 tasks for the Methodology Summary feature. Added TypeScript interfaces, a new factor record lookup function, the `assembleMethodologyData()` core function, wired the API route, and updated the GHGReport component with a dedicated methodology page. Extracted the methodology page into a separate component to stay under the 300-line limit. Added `MATERIAL_UNITS` constant to `src/types/index.ts` (open question resolved). All 41 tests pass; lint and TypeScript compilation are clean.
- **Artifacts Produced:**
  - `src/types/index.ts` — Added `MATERIAL_UNITS`, `MethodologyFactorRow`, `MethodologyQualityRow`, `MethodologyData`
  - `src/lib/factors.ts` — Added `getEmissionFactorRecord()` with 3-step fallback chain
  - `src/lib/methodology.ts` — New file with `assembleMethodologyData()`
  - `src/app/api/report/route.ts` — Calls `assembleMethodologyData` in GHG_PROTOCOL branch only
  - `src/components/reports/GHGReport.tsx` — Accepts optional `methodology` prop, renders methodology page, removes static "Methodik" paragraph
  - `src/components/reports/GHGReportMethodologyPage.tsx` — New component for methodology page (4 sections)
  - `src/lib/__tests__/methodology.test.ts` — 16 unit tests (TC-01 through TC-13 + sub-cases)
  - `src/lib/__tests__/factors.test.ts` — Added TC-14, TC-15, TC-16
- **Problems Encountered:**
  - `as any[]` type assertions needed in `methodology.ts` because the Prisma client is generated as `any` in this environment — consistent with the same pattern in `emissions.ts`. Code reviewer flagged this as a concern but it's an established project convention.
  - Map iteration (`for...of map.entries()`) required wrapping with `Array.from()` due to TypeScript target configuration.
  - `npm run build` fails at the "collect page data" phase due to Prisma client not being initialized in the build environment (pre-existing issue, unrelated to this feature — confirmed by running the same build on the baseline).

### Technical Writer
- **Date:** 2025-07-14
- **Summary:** Reviewed specification, architecture, tasks, work-protocol, and implementation files for the Methodology Summary feature. Confirmed that `docs/architecture.md` (arc42) does not require updates — the feature follows the established `lib → API route → component` pattern already documented. Appended work-protocol entry as final documentation artifact.
- **Artifacts Produced:**
  - `docs/features/002-methodology-summary/work-protocol.md` — this entry
- **Problems Encountered:** None. The feature is scoped to GHG Protocol reports only; all implementation details match the specification. No new architectural patterns, CLI options, or installation steps were introduced, so README.md and docs/features.md do not require updates beyond what the Developer already covered.
