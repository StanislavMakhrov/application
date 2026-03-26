# Work Protocol: Improve Company Settings Management, UI Simplification, and Invoice Flexibility

**Work Item:** `docs/features/001-company-settings-ui/`
**Branch:** `copilot/improve-company-settings-management`
**Workflow Type:** Feature
**Created:** 2025-07-17

## Agent Work Log

<!-- Each agent appends their entry below when they complete their work. -->

### Requirements Engineer
- **Date:** 2025-07-17
- **Summary:** Gathered and documented requirements for three related UI/data improvements: (1) centralising company profile settings so Firmenname/Branche are managed from the Settings page rather than the per-year wizard; (2) removing the duplicate "Rechnung hochladen" button that appears when both UploadOCR and FieldDocumentZone are rendered for the same field; (3) allowing multiple invoice documents to be attached per emission category instead of the current one-document limit.
- **Artifacts Produced:** `docs/features/001-company-settings-ui/specification.md`, `docs/features/001-company-settings-ui/work-protocol.md`
- **Problems Encountered:** None. Requirements derived from the GitHub issue description combined with codebase exploration.

### Architect
- **Date:** 2025-07-17
- **Summary:** Analysed the feature specification and existing codebase (Prisma schema, wizard screens, FieldDocumentZone, UploadOCR, Settings page, OCR and field-documents API routes). Resolved all four open questions from the specification and produced architecture decision records and an implementation-guidance document.
- **Decisions Made:**
  1. **Screen 1** → Read-only summary with Settings link (ADR-001). Renumbering wizard URLs has no justification; preserving `/wizard/1` avoids bookmark breakage and keeps the UX pattern of reviewing company context before entering year data.
  2. **Upload unification** → Extend `/api/ocr` to accept optional `fieldKey`/`year` params and create a `FieldDocument` when they are present (ADR-002). Single network round-trip; atomic audit + evidence record creation; backward-compatible.
  3. **FieldDocument multi-document** → Drop `@@unique([fieldKey, year])`, switch to `create` (no upsert), add `DELETE /api/field-documents/[id]` route (ADR-003). Non-destructive migration; existing rows preserved as first document in each list.
  4. **Document count limit** → Soft UI warning at ≥ 20 documents, no hard cap (ADR-004). Appropriate for single-tenant deployment; avoids blocking legitimate high-volume workflows.
- **Artifacts Produced:**
  - `docs/features/001-company-settings-ui/architecture.md`
  - `docs/features/001-company-settings-ui/adr/adr-001-screen1-readonly-vs-removal.md`
  - `docs/features/001-company-settings-ui/adr/adr-002-upload-unification-strategy.md`
  - `docs/features/001-company-settings-ui/adr/adr-003-fielddocument-multi-document-model.md`
  - `docs/features/001-company-settings-ui/adr/adr-004-document-count-limit.md`
- **Problems Encountered:** None.

### Quality Engineer
- **Date:** 2025-07-17
- **Summary:** Reviewed the feature specification, architecture document, all four ADRs, and the existing test infrastructure (Vitest + React Testing Library unit tests, Playwright E2E). Created a comprehensive test plan mapping every acceptance criterion to at least one test case across three layers: unit (React components), integration (API routes), and E2E. Also produced a UAT test plan for the Maintainer and UAT Tester agent.
- **Artifacts Produced:**
  - `docs/features/001-company-settings-ui/test-plan.md` — 20 test cases covering all acceptance criteria, edge cases, security (path sanitisation), and regression scenarios.
  - `docs/features/001-company-settings-ui/uat-test-plan.md` — 5 UAT scenarios with step-by-step instructions and a verification checklist.
- **Test Coverage Summary:**
  - **Unit (component):** FirmenprofilSettings (TC-01–03), Screen1Firmenprofil (TC-04–05), FieldDocumentZone (TC-06–11, TC-19–20), UploadOCR (TC-12).
  - **Integration (API):** GET/POST /api/field-documents (TC-13–14), DELETE /api/field-documents/[id] (TC-15–16), POST /api/ocr extended (TC-17–18).
  - **E2E:** Settings→Dashboard Firmenprofil flow; Screen 1 read-only assertion (referenced in uat-test-plan.md, to be implemented in e2e-tests/app/e2e.spec.ts tagged @feature-001).
- **Problems Encountered:** None. Two open questions logged in the test plan (TC-09 and TC-15 edge cases pending Developer clarification).
