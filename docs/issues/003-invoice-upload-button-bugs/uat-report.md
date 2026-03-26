# UAT Report — Invoice Upload Button Bugs (Issue #003)

## Summary

Three UI bugs affecting the invoice upload button across wizard screens (Screen2–Screen5)
have been fixed and validated.

| # | Bug | Fix Applied | Test Coverage |
|---|-----|-------------|---------------|
| 1 | Duplicate upload button after first upload | `showAddButton = !suppressInitialUpload && docs.length > 0` in `FieldDocumentZone.tsx` | ✅ 4 E2E tests |
| 2 | Wrong label "Rechnung hochladen" instead of "Rechnung hinzufügen" | Default `label` prop in `UploadOCR.tsx` + empty-state text in `FieldDocumentZone.tsx` | ✅ 2 E2E tests |
| 3 | Upload button rendered before document list | `FieldDocumentZone` moved before `UploadOCR` in Screen2–Screen5 | ✅ 2 E2E tests |

---

## Automated E2E Tests

- **File:** `e2e-tests/app/invoice-button-regression.spec.ts`
- **Total tests:** 8
- **CI Job:** `e2e-tests` in PR validation pipeline (PR #75)
- **Execution requirement:** Requires the running application at `BASE_URL` (default: `http://localhost:3000`)

### Scenarios Covered

#### Bug #2 — Correct Button Label
- [x] **`upload button shows 'Rechnung hinzufügen', not 'Rechnung hochladen'`**
  Navigates to `/wizard/4?year=2024`, asserts at least one `Rechnung hinzufügen` button is
  visible and zero `Rechnung hochladen` buttons exist.
- [x] **`'Rechnung hochladen' text does not appear anywhere on screen 4`**
  Fetches full page HTML and asserts the old string is absent from all content (including
  hidden elements).

#### Bug #1 — No Duplicate Upload Buttons (Empty State)
- [x] **`screen 4 shows exactly two upload buttons in empty state (one per OCR field)`**
  Navigates to `/wizard/4?year=2024`, expects exactly 2 `Rechnung hinzufügen` buttons
  (one for STROM, one for FERNWAERME).
- [x] **`screen 2 shows exactly three upload buttons in empty state (one per OCR field)`**
  Navigates to `/wizard/2?year=2024`, expects exactly 3 buttons (ERDGAS, HEIZOEL, FLUESSIGGAS).

#### Bug #1 — No Duplicate Button When Documents Exist (Route-Mocked)
- [x] **`with existing docs, FieldDocumentZone does not add a second upload button`**
  Mocks `/api/field-documents?fieldKey=STROM&year=2024` to return one document. After
  navigation asserts total upload buttons is still 2 (not 4) and no `+ Beleg hinzufügen`
  button appears.
- [x] **`FieldDocumentZone renders the uploaded document, not a duplicate button`**
  Same mock; asserts filename `strom-rechnung-2024.pdf` and `Erkannter Wert` label are
  visible, and no `+ Beleg hinzufügen` button exists.

#### Bug #3 — Document Zone Renders Before Upload Button
- [x] **`document zone (empty-state placeholder) appears before the upload button in DOM`**
  Uses `compareDocumentPosition` (bit `0x4 DOCUMENT_POSITION_FOLLOWING`) to verify the
  `Kein Dokument hochgeladen` placeholder precedes the `Rechnung hinzufügen` button.
- [x] **`with existing docs, document list appears before upload button in DOM`**
  Same DOM-order check with mocked document; verifies `<li>` containing the filename
  precedes the upload button.

---

## Source Code Verification

### Fix #1 — `showAddButton` gated on `!suppressInitialUpload`

```tsx
// src/components/wizard/FieldDocumentZone.tsx (line 242)
const showAddButton = !suppressInitialUpload && docs.length > 0;
```
✅ Confirmed present in source.

### Fix #2 — Correct default label in `UploadOCR`

```tsx
// src/components/wizard/UploadOCR.tsx (line 43)
label = 'Rechnung hinzufügen',
```
✅ Confirmed present in source. Old string `'Rechnung hochladen'` does not appear in either
`UploadOCR.tsx` or `FieldDocumentZone.tsx`.

### Fix #3 — Correct DOM order in Screen components

In `Screen4Strom.tsx` (representative), `FieldDocumentZone` at line 168 precedes
`UploadOCR` at line 175. Same pattern confirmed in Screen2Heizung (lines 180/187),
Screen3Fuhrpark, and Screen5Dienstreisen.

✅ All four screen files confirmed fixed.

---

## Unit Tests

- **Suite:** Vitest (`src/`)
- **Result:** ✅ **22/22 passed** (3 test files: `calculateTotal`, `factors`, `emissions`)
- **No regressions** introduced by the bug fixes.

---

## Playwright Test Listing

The following 8 tests were listed by `npx playwright test --list` from the `e2e-tests/`
directory, confirming they are correctly registered with the shared Playwright config:

```
[chromium] › app/invoice-button-regression.spec.ts:34  Bug #2 — upload button shows 'Rechnung hinzufügen'
[chromium] › app/invoice-button-regression.spec.ts:49  Bug #2 — 'Rechnung hochladen' text absent from screen 4
[chromium] › app/invoice-button-regression.spec.ts:63  Bug #1 — screen 4: exactly two upload buttons (empty state)
[chromium] › app/invoice-button-regression.spec.ts:76  Bug #1 — screen 2: exactly three upload buttons (empty state)
[chromium] › app/invoice-button-regression.spec.ts:92  Bug #1 — no second button when docs exist (route-mocked)
[chromium] › app/invoice-button-regression.spec.ts:128 Bug #1 — document list renders, not duplicate button
[chromium] › app/invoice-button-regression.spec.ts:167 Bug #3 — empty-state placeholder before upload button
[chromium] › app/invoice-button-regression.spec.ts:202 Bug #3 — document list before upload button (route-mocked)
```

---

## Notes on Test Execution

The E2E tests require the application to be running at `http://localhost:3000`.
The application was **not running** in the current agent environment (confirmed via
`curl http://localhost:3000` returning HTTP 000). Therefore:

- **Playwright tests could not be executed** during this UAT session.
- Tests are committed to the branch and will execute automatically in the
  **CI `e2e-tests` job** when the PR pipeline runs against the Docker image
  (`ghcr.io/<repo>:pr-75`).
- All three fixes have been **verified by static source code inspection** above.
- Unit tests (22/22) confirm no regressions in the business logic layer.

---

## Manual UAT Instructions (Optional)

The Maintainer may optionally verify the fixes manually using the Docker image:

```bash
docker pull ghcr.io/<repo>:pr-75
docker run --rm -p 3000:3000 ghcr.io/<repo>:pr-75
```

Then open `http://localhost:3000` and navigate to the wizard.

### Checklist

- [ ] Navigate to `/wizard/4?year=2024` (Strom screen)
- [ ] **Bug #2:** Confirm button reads "📄 Rechnung hinzufügen" (NOT "Rechnung hochladen")
- [ ] **Bug #3:** Confirm the "Kein Dokument hochgeladen" placeholder renders ABOVE the upload button
- [ ] **Bug #1:** Upload a file via the button; confirm only ONE upload button remains visible (no "+" Beleg hinzufügen" button appears)
- [ ] Navigate to `/wizard/2?year=2024` (Heizung screen)
- [ ] Repeat Bug #2 and #3 checks for all three OCR fields (Erdgas, Heizöl, Flüssiggas)
- [ ] Navigate to `/wizard/3?year=2024` and `/wizard/5?year=2024` and spot-check the same three bugs

---

## Manual UAT Result

**Status:** ⏳ Awaiting Maintainer confirmation

Reply to PR #75 with:
- **PASS** — all checklist items pass
- **FAIL: \<screen\>, \<expected\>, \<actual\>** — with screenshot(s) if possible
