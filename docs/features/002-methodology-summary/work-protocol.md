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
