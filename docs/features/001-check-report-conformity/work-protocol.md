# Work Protocol: Check Report Conformity

**Work Item:** `docs/features/001-check-report-conformity/`
**Branch:** `copilot/check-report-conformity-again`
**Workflow Type:** Feature
**Created:** 2025-01-28

## Required Agents

| Agent | Status |
|-------|--------|
| Requirements Engineer | ✅ Complete |
| Architect | ✅ Complete |
| Quality Engineer | ⬜ Pending |
| Task Planner | ⬜ Pending |
| Developer | ⬜ Pending |
| Technical Writer | ⬜ Pending |
| Code Reviewer | ⬜ Pending |
| UAT Tester | ⚠️ Required (user-facing feature) |
| Release Manager | ⬜ Pending |
| Retrospective | ⬜ Pending |

## Agent Work Log

<!-- Each agent appends their entry below when they complete their work. -->

### Requirements Engineer
- **Date:** 2025-01-28
- **Summary:** Analyzed the GHG Protocol Corporate Standard, CSRD supply-chain reporting requirements, and the existing GrünBilanz codebase (report generation API, wizard components, emission engine, PlausibilityWarning component). Defined specific conformity checks across three layers: GHG Protocol structural completeness, double-counting detection, and CSRD questionnaire data quality. Documented required wizard additions (double-counting warning, missing-category prompt before report generation) and a pre-report conformity summary panel. Produced the feature specification.
- **Artifacts Produced:** `docs/features/001-check-report-conformity/specification.md`, `docs/features/001-check-report-conformity/work-protocol.md`
- **Problems Encountered:** None

### Architect
- **Date:** 2025-01-28
- **Summary:** Explored the codebase (Prisma schema, dashboard Server Component, report API, wizard screens, emission engine, types). Designed the conformity check architecture around a pure-function engine in `src/lib/conformity.ts`, a dedicated `GET /api/conformity?yearId=N` API route, a `ConformityBadge` + `ConformityPanel` pair on the dashboard, wizard-level double-counting and missing-category detection, and PDF enrichment via props passed to existing report components. Resolved two open questions from the spec: `scope3Acknowledged` goes in the DB (not localStorage), and double-count resolution is navigation-only (no one-click entry removal).
- **Artifacts Produced:**
  - `docs/adr/001-conformity-check-architecture.md` — main ADR with all key decisions, component interfaces, data flow diagram, and file change manifest
  - `docs/features/001-check-report-conformity/architecture.md` — feature-level implementation guidance
- **Problems Encountered:** None
