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
