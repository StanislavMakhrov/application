# Work Protocol: Invoice OCR Stub & Annual Invoice Selection Bugs

**Work Item:** `docs/issues/002-invoice-ocr-and-annual/`
**Branch:** `copilot/improve-company-settings-management`
**Workflow Type:** Bug Fix
**Created:** 2026-03-26

## Agent Work Log

<!-- Each agent appends their entry below when they complete their work. -->

### Issue Analyst
- **Date:** 2026-03-26
- **Summary:** Investigated two bugs: (1) OCR stub not filling form values on invoice upload, and (2) the "Jahresabrechnung" (annual invoice) flag having no effect. Root cause identified for both. Analysis document created at `docs/issues/002-invoice-ocr-and-annual/analysis.md`.
- **Artifacts Produced:** `docs/issues/002-invoice-ocr-and-annual/work-protocol.md`, `docs/issues/002-invoice-ocr-and-annual/analysis.md`
- **Problems Encountered:** `scripts/next-issue-number.sh` returned `001` despite `docs/features/001-company-settings-ui` already existing (script emits a `[: : integer expression expected` warning and miscomputes the next number). Used `002` manually.
