# Work Protocol: Methodology Summary Block in Reports & UBA Parameter Management

**Work Item:** `docs/features/002-methodology-summary/`
**Branch:** `copilot/add-methodology-summary-report`
**Workflow Type:** Feature
**Created:** 2025-01-31

## Agent Work Log

<!-- Each agent appends their entry below when they complete their work. -->

### Requirements Engineer
- **Date:** 2025-01-31
- **Summary:** Gathered and documented requirements for (1) the automatic methodology summary block that appears in every generated PDF and in the UI, and (2) the UBA emission factor management UI with one-click auto-fill of official year-specific UBA values. Explored the existing codebase (Prisma schema, report API, GHGReport PDF component, factors/emissions libraries, settings page) to ensure the specification accurately reflects the current data model and architecture. Captured all negative constraints verbatim as required.
- **Artifacts Produced:**
  - `docs/features/002-methodology-summary/specification.md`
  - `docs/features/002-methodology-summary/work-protocol.md` (this file)
- **Problems Encountered:** None

### Architect
- **Date:** 2025-01-31
- **Summary:** Analyzed the existing codebase (Prisma schema, `factors.ts`, `emissions.ts`,
  report API route, `GHGReport.tsx`, `CSRDQuestionnaire.tsx`, Settings page, seed script)
  against the feature specification. Designed the technical approach across four focused
  ADRs and produced a comprehensive architecture document. Confirmed that the existing
  `EmissionFactor` model already supports year-specific versioning — only a `label` field
  migration is required. All other changes are additive (new service functions, new API
  routes, new UI components). No breaking changes to the calculation engine.
- **Artifacts Produced:**
  - `docs/features/002-methodology-summary/adr/ADR-001.md` — UBA reference data storage strategy (TypeScript module)
  - `docs/features/002-methodology-summary/adr/ADR-002.md` — Methodology block assembly (on-demand via `getMethodologyData`)
  - `docs/features/002-methodology-summary/adr/ADR-003.md` — Data model (add `label` to `EmissionFactor`)
  - `docs/features/002-methodology-summary/adr/ADR-004.md` — API design (RESTful routes + `uba-fill` action)
  - `docs/features/002-methodology-summary/architecture.md` — Full architecture with data model, API, components, integration points
- **Key Decisions:**
  - Official UBA values bundled as a TypeScript constant (`src/lib/uba-reference-data.ts`), shared between seed script and auto-fill API — no external network calls, type-safe, easy to extend for new years.
  - Methodology block assembled on-demand at report-generation time via `getMethodologyData(yearId)` — consistent with existing `getTotalCO2e` pattern, always reflects current DB state.
  - Minimal schema change: add nullable `label String?` to `EmissionFactor` only.
  - Custom/official distinction uses the existing `source` field convention (`"UBA {year}"` vs `"Benutzerdefiniert {year}"`).
  - Scope inclusion rule: scope included if any entry has `quantity ≠ 0`.
  - Factor source label rule: entire year set is labelled "Benutzerdefiniert" if any single factor is overridden (conservative for audit).
- **Problems Encountered:** None — existing architecture is well-suited; changes are incremental.

### UI/UX Designer
- **Date:** 2025-01-31
- **Summary:** Designed the complete UI/UX for all three surface areas: (1) the collapsible MethodologySummary block for the Dashboard, (2) the EmissionsfaktorenSettings section in Settings (including year selector, editable factor table, UBA auto-fill dialog), and (3) the Methodik PDF section (GHG Protocol and CSRD variants). Reviewed existing codebase patterns (settings page, dashboard, GHGReport, FirmenprofilSettings, YearManagement) and CSS tokens (globals.css, tailwind.config.ts) to ensure full design-language consistency. Created pixel-accurate HTML mockups for all states using the project's Tailwind config and brand tokens.
- **Artifacts Produced:**
  - `docs/features/002-methodology-summary/ux-design.md` — full UI/UX design specification (29 KB)
  - `docs/features/002-methodology-summary/mockups/index.html` — mockup navigation page
  - `docs/features/002-methodology-summary/mockups/methodology-summary-block.html` — dashboard block (collapsed, expanded, loading, empty, custom-factors, mobile states)
  - `docs/features/002-methodology-summary/mockups/emissionsfaktoren-settings.html` — settings section (default, dirty, UBA dialog, loading skeleton, no-data, save error, success toast)
  - `docs/features/002-methodology-summary/mockups/methodology-pdf.html` — PDF section simulation (GHG Protocol UBA, GHG Protocol custom, CSRD)
- **Key Design Decisions:**
  - Collapsible block uses `<details>`/`<summary>` (or shadcn/ui Accordion) — accessible, no JS overhead. Collapsed state shows the critical audit info at a glance (standard · source · scopes) without requiring expansion.
  - Scope chips use semantic colors (green=1, blue=2, purple=3) — consistent with existing dashboard color language.
  - Custom/UBA factor distinction: green badge for UBA, amber badge for Benutzerdefiniert — visible at both row level and block headline level.
  - Dirty-state rows use amber left-border + background (FFFBEB) + strikethrough original value — clear visual diff without a modal.
  - UBA auto-fill uses a full modal dialog with explicit amber warning box (irreversible action, full-replace semantics).
  - PDF design reuses existing StyleSheet.create() styles from GHGReport.tsx — no new PDF styles needed.
  - All empty/null states have graceful fallbacks (never blank content areas).
- **Problems Encountered:** None — design follows established patterns cleanly.

### Quality Engineer
- **Date:** 2025-01-31
- **Summary:** Created a comprehensive test plan (27 test cases, TC-01 through TC-27) and a UAT test plan for the methodology summary and UBA parameter management feature. Mapped every acceptance criterion from the specification to at least one test case. Covered the new `getMethodologyData` service, `uba-reference-data` module, five new API routes, and four new/modified React components. Included edge cases (empty year, custom factor label rule, scope inclusion rule, year isolation, unknown year auto-fill).
- **Artifacts Produced:**
  - `docs/features/002-methodology-summary/test-plan.md` — 27 test cases spanning unit, integration, and component types; test coverage matrix; edge case table; UX acceptance criteria with all explicit constraints verbatim; non-functional tests
  - `docs/features/002-methodology-summary/uat-test-plan.md` — 7 UAT steps covering Dashboard block, Settings factor management, inline override dirty state, UBA auto-fill dialog, year isolation, and PDF verification; complete verification checklist
- **Key Decisions:**
  - Test file locations follow the existing co-location pattern: `src/lib/__tests__/` for lib modules, `src/app/api/.../route.test.ts` for API routes, co-located `.test.tsx` for components.
  - All tests use Vitest + Prisma mocks consistent with `factors.test.ts` and `emissions.test.ts` patterns. No new test infrastructure required.
  - TC-16/TC-17 (UBA reference data validation) are pure data-validation tests with no DB dependency — fast and reliable.
  - Naming convention follows `methodName_scenario_expectedResult` as established in the project.
- **Problems Encountered:** None — specification, architecture, and UX design are thorough and unambiguous.

### Task Planner
- **Date:** 2025-01-31
- **Summary:** Read specification, architecture (including all four ADRs), UX design, test plan, and the Feature 001 tasks.md as format reference. Produced a comprehensive `tasks.md` with 8 prioritised tasks covering all aspects of the feature: schema migration, UBA reference data module, methodology service, API endpoints, Settings UI, Dashboard component, PDF integration, and automated tests. Each task has explicit acceptance criteria mapped to the specification's success criteria and the test plan's test cases. All open questions from the specification are resolved (confirmed in architecture.md). Implementation order section documents the dependency chain and parallel opportunities.
- **Artifacts Produced:**
  - `docs/features/002-methodology-summary/tasks.md` — 8 tasks with acceptance criteria, file-level scope, dependency mapping, and implementation order
- **Problems Encountered:** None — specification, architecture, UX design, and test plan are consistent and unambiguous; no clarifications were required.

### Technical Writer
- **Date:** 2025-07-14
- **Summary:** Reviewed the implementation of Feature #002 (methodology summary) and updated global documentation to reflect the new feature, API endpoints, data model changes, and UI additions.
- **Artifacts Produced:**
  - `docs/features.md` — added row for Feature #002 (Methodology Summary)
  - `docs/architecture.md` — added `label String?` field to `EmissionFactor` model; added 5 new API routes (`GET /api/emission-factors?year=X`, `GET /api/emission-factors/years`, `PUT /api/emission-factors/[id]`, `POST /api/emission-factors/uba-fill`, `GET /api/methodology?year=X`) to the file tree and API section
- **Problems Encountered:** None — implementation was consistent with specification and architecture documents.

### Code Reviewer
- **Date:** 2025-07-14
- **Summary:** Conducted a thorough line-by-line review of the full Feature #002 implementation: all 5 new API routes, 3 new settings components, `MethodologySummary`, `methodology.ts`, `uba-reference-data.ts`, `factor-labels.ts`, `prisma/schema.prisma`, and integration with `GHGReport.tsx`, `CSRDQuestionnaire.tsx`, and `page.tsx`. All tests pass. Explicit Constraints from the specification (year isolation, automated UBA fill) are correctly implemented. Applied inline fixes for the issues found.
- **Artifacts Produced:**
  - `docs/features/002-methodology-summary/code-review.md` — full code review report
  - `src/app/api/emission-factors/uba-fill/route.test.ts` — 7 new API route tests (TC-08, TC-09 year-isolation, TC-10)
  - `src/app/api/emission-factors/[id]/route.test.ts` — 6 new API route tests (TC-07)
  - `src/app/api/emission-factors/route.test.ts` — 4 new API route tests (TC-11)
  - `src/app/api/emission-factors/years/route.test.ts` — 3 new API route tests (TC-12)
  - `src/app/api/methodology/route.test.ts` — 4 new API route tests (TC-13, TC-14)
- **Issues Fixed Inline:**
  - M-1 (Major): Added 24 missing API route tests covering all planned TC-07 through TC-14 test cases
  - m-1 (Minor): Added "Faktoren verwalten →" link to `MethodologySummary.tsx` expanded view
  - m-2 (Minor): Added custom-override warning banner to `MethodologySummary.tsx`
  - m-3 (Minor): Fixed `?year=X` → `?yearId=X` parameter name in `docs/architecture.md`
  - m-4 (Minor): Removed redundant `setIsSaving(false)` call in `EmissionsfaktorenTable.tsx`
- **Remaining Items:**
  - Component tests (TC-18 through TC-22) require `@testing-library/react` to be installed — not blocking
  - Scope color-coding chips in `MethodologySummary` (cosmetic UX improvement) — Suggestion only
- **Decision:** Approved — all core criteria satisfied, all planned API tests added, explicit constraints verified
- **Problems Encountered:** None — implementation was clean; issues found were quality/completeness gaps, not functional bugs

### UAT Tester
- **Date:** 2025-07-14
- **Summary:** Explored existing e2e test patterns (`e2e-tests/app/e2e.spec.ts`, `e2e-tests/app/invoice-button-regression.spec.ts`) and the full feature implementation (all 5 new React components + 5 API routes). Authored a comprehensive Playwright e2e test suite covering every user-facing scenario from the UAT test plan. Tests are independent, navigate from scratch, and use resilient selectors (aria-expanded, role, text, data-testid fallbacks). API tests validate the new `/api/methodology` and `/api/emission-factors` endpoints directly.
- **Artifacts Produced:**
  - `e2e-tests/methodology-summary/e2e.spec.ts` — 22 Playwright e2e tests in 6 describe blocks
- **Scenarios Covered:**
  - Settings Emissionsfaktoren section heading, description, year selector, factor table columns, source badges, year switching
  - UBA auto-fill dialog: opens on click, shows warning text, Abbrechen closes without changes, Bestätigen shows success toast
  - Inline factor override: amber dirty-state row highlight, Speichern button appears
  - Dashboard Methodik block: visible, collapsed by default, no details table in collapsed state
  - Methodik expand/collapse toggle (aria-expanded attribute)
  - Faktoren verwalten link: visible when expanded, navigates to /settings
  - API: /api/methodology required fields, /api/emission-factors/years response shape, year isolation after uba-fill
- **Note:** Tests require a running server (no mock server available in the repo). They are designed to run against the CI Docker image via the `e2e-tests` CI job with `BASE_URL` set to the running container.
- **Problems Encountered:** None — implementation was clean and selectors were predictable from the component code.
