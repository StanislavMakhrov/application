# Work Protocol: Invoice OCR Stub & Annual Invoice Selection Bugs

**Work Item:** `docs/issues/002-invoice-ocr-and-annual/`
**Branch:** `copilot/improve-company-settings-management`
**Workflow Type:** Bug Fix
**Created:** 2026-03-26

## Agent Work Log

### Developer
- **Date:** 2026-03-26
- **Summary:** Implemented all three fixes described in `analysis.md`. Restored UploadOCR to wizard screens, fixed the showAddButton regression in FieldDocumentZone, and corrected calculateTotal to not require recognizedValue != null for annual docs.
- **Artifacts Produced:**
  - `src/components/wizard/FieldDocumentZone.tsx` — fixed `showAddButton = docs.length > 0`
  - `src/components/wizard/screens/Screen2Heizung.tsx` — re-added UploadOCR for ERDGAS/HEIZOEL/FLUESSIGGAS; fixed calculateTotal
  - `src/components/wizard/screens/Screen3Fuhrpark.tsx` — re-added UploadOCR for DIESEL_FUHRPARK/BENZIN_FUHRPARK; fixed calculateTotal
  - `src/components/wizard/screens/Screen4Strom.tsx` — re-added UploadOCR for STROM/FERNWAERME; fixed calculateTotal
  - `src/components/wizard/screens/Screen5Dienstreisen.tsx` — added UploadOCR for GESCHAEFTSREISEN_FLUG/GESCHAEFTSREISEN_BAHN; added calculateTotal
  - `src/lib/__tests__/calculateTotal.test.ts` — 9 unit tests for calculateTotal
- **Validation:** All 22 tests pass; ESLint clean; TypeScript type-check clean; build passes
- **Problems Encountered:** None. Prisma client generation required running from project root (pre-existing env constraint, not a regression).



### Technical Writer
- **Date:** 2026-03-26
- **Summary:** Updated `docs/architecture.md` to reflect the post-fix state of the invoice OCR and annual invoice features.
- **Artifacts Produced / Updated:**
  - `docs/architecture.md` — updated `FieldDocument` schema model (added `recognizedValue`, `billingMonth`, `isJahresabrechnung` fields; removed stale `@@unique` constraint and corrected comment); expanded section 8.2 with a new "`UploadOCR` + `FieldDocumentZone` Integration Pattern" subsection documenting how the two components work together, the `suppressInitialUpload`/`showAddButton` fix, and the `calculateTotal` pattern with a behaviour summary table.
- **Not Updated:** `README.md` (no user-facing change to setup or CLI usage); `docs/features.md` (this is a bug fix, not a new feature).
- **Problems Encountered:** None.

- **Date:** 2026-03-26
- **Summary:** Investigated two bugs: (1) OCR stub not filling form values on invoice upload, and (2) the "Jahresabrechnung" (annual invoice) flag having no effect. Root cause identified for both. Analysis document created at `docs/issues/002-invoice-ocr-and-annual/analysis.md`.
- **Artifacts Produced:** `docs/issues/002-invoice-ocr-and-annual/work-protocol.md`, `docs/issues/002-invoice-ocr-and-annual/analysis.md`
- **Problems Encountered:** `scripts/next-issue-number.sh` returned `001` despite `docs/features/001-company-settings-ui` already existing (script emits a `[: : integer expression expected` warning and miscomputes the next number). Used `002` manually.
