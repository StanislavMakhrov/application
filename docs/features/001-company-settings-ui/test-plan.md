# Test Plan: Company Settings Management, UI Simplification, and Invoice Flexibility

## Overview

This test plan covers the three improvements delivered by feature `001-company-settings-ui`:

1. **Company profile centralisation** — Firmenprofil editing moves from wizard Screen 1 to the Settings page; Screen 1 becomes read-only.
2. **Upload deduplication** — Fields that previously rendered both `UploadOCR` and `FieldDocumentZone` upload buttons now expose exactly one upload action.
3. **Multiple invoices per category** — The `FieldDocumentZone` component and backing API support an ordered list of documents per (fieldKey, year) instead of a single document.

Reference documents: `specification.md`, `architecture.md`, `adr/adr-001` through `adr-004`.

---

## Test Coverage Matrix

| Acceptance Criterion (from specification) | Test Case(s) | Test Type |
|-------------------------------------------|--------------|-----------|
| "Einstellungen" page contains a "Firmenprofil" section with all company-wide fields | TC-01, TC-02 | Unit (component), Integration |
| Saving Firmenprofil in Settings updates Dashboard company name | TC-03 | E2E |
| Screen 1 no longer allows editing company profile data | TC-04, TC-05 | Unit (component) |
| Screen 1 shows read-only values with a link to Settings | TC-05 | Unit (component) |
| No field shows two separate "Rechnung hochladen" upload triggers simultaneously | TC-06, TC-07 | Unit (component) |
| Single upload pre-fills numeric value via OCR **and** stores the document | TC-08, TC-09 | Integration (API) |
| A user can attach more than one invoice to a single category | TC-10, TC-11 | Integration (API), Unit (component) |
| Each attached document is listed individually with view and remove options | TC-12 | Unit (component) |
| Removing one document does not affect other attached documents | TC-13 | Integration (API) |
| Empty state still shows "Kein Dokument hochgeladen" placeholder | TC-14 | Unit (component) |
| All UI labels are in German | TC-04, TC-05, TC-06, TC-12, TC-14 | Unit (component) |

---

## User Acceptance Scenarios

> **Purpose**: These scenarios guide the UAT Tester and Maintainer when running the app to verify user-visible behaviour.

### Scenario 1: Edit company profile from Settings page

**User Goal**: Update the company name from the Settings page and see it reflected everywhere.

**Test Steps**:
1. Run the app (`cd src && npm run dev` or Docker).
2. Navigate to `/settings`.
3. Locate the "Firmenprofil" section.
4. Change "Firmenname" to a new value and click "Speichern".
5. Navigate to `/` (Dashboard).

**Expected Output**:
- A toast "Firmenprofil gespeichert" appears after saving.
- The company name badge on the Dashboard reflects the new value.

**Success Criteria**:
- [ ] "Firmenprofil" section is visible on `/settings`.
- [ ] All fields (Firmenname, Branche, Mitarbeiter, Standort, Berichtsgrenzen, Ausschlüsse) are present and editable.
- [ ] Saving shows a success toast.
- [ ] Dashboard company name updates immediately.

---

### Scenario 2: Screen 1 is read-only with Settings link

**User Goal**: Confirm that wizard Screen 1 no longer allows accidental edits to company data.

**Test Steps**:
1. Navigate to `/wizard/1`.
2. Observe all company profile fields on the screen.
3. Attempt to edit any field.

**Expected Output**:
- Fields are displayed as read-only labels (no `<input>` or `<select>` elements visible for Firmenname, Branche etc.).
- An amber callout reads something like *"Firmenprofil-Daten können in den Einstellungen geändert werden."*
- A link/button labelled "Einstellungen öffnen →" (or equivalent) is present and navigates to `/settings`.

**Success Criteria**:
- [ ] No editable form controls exist on Screen 1 for company profile fields.
- [ ] The Settings link is visible and functional.
- [ ] If no profile data exists yet, a prompt to create it in Settings appears.

---

### Scenario 3: Single upload button on an OCR-enabled field

**User Goal**: Upload one invoice and have it both fill in the field value and appear as attached evidence.

**Test Steps**:
1. Navigate to `/wizard/4` (Strom screen, which has an OCR-enabled STROM field).
2. Count the upload buttons for the STROM field.
3. Click the single "Rechnung hochladen" button and select a PDF.
4. Observe the OCR result and the document attachment zone below the input.

**Expected Output**:
- Exactly **one** "Rechnung hochladen" button is visible for the STROM field.
- After upload the numeric input is pre-filled with the OCR-extracted value.
- The `FieldDocumentZone` below the input shows the uploaded filename with "Ansehen" and "Entfernen" actions.
- No second upload button is present anywhere for that field.

**Success Criteria**:
- [ ] Only one upload trigger exists per OCR-enabled field.
- [ ] OCR result populates the field value.
- [ ] Uploaded file appears in the document list.

---

### Scenario 4: Multiple invoices per category

**User Goal**: Attach 3 monthly electricity bills to the STROM field.

**Test Steps**:
1. Navigate to `/wizard/4`.
2. Upload a first invoice via the "Rechnung hochladen" button.
3. In the document zone, click "Weitere Rechnung hinzufügen".
4. Upload a second invoice.
5. Repeat for a third invoice.
6. Delete the second invoice using its "Entfernen" button.

**Expected Output**:
- After each upload the list grows by one item.
- Each list item shows: filename, upload date, "Ansehen" link, "Entfernen" button.
- After deleting the second invoice, only the first and third remain.

**Success Criteria**:
- [ ] Three invoices can be attached without replacing each other.
- [ ] Delete removes only the targeted document.
- [ ] "Weitere Rechnung hinzufügen" button appears after at least one document is attached.
- [ ] At 20+ documents a soft warning is displayed.

---

## Test Cases

### TC-01: FirmenprofilSettings — renders all required fields

**Type:** Unit (React component — `src/components/settings/FirmenprofilSettings.tsx`)

**Description:**
Verify that the new `FirmenprofilSettings` component renders form inputs for every company-wide field defined in the Prisma `CompanyProfile` model.

**Preconditions:**
- `fetch('/api/entries?type=profile')` is mocked to return a populated profile object.

**Test Steps:**
1. Render `<FirmenprofilSettings />` inside a test wrapper that mocks `fetch`.
2. Assert each labelled input is in the document.

**Expected Result:**
- Inputs for Firmenname, Branche (select), Mitarbeiter (number), Standort, Berichtsgrenzen, and Ausschlüsse are all present.
- A "Speichern" submit button is present.

**Test File:** `src/components/settings/FirmenprofilSettings.test.tsx`

**Naming convention:**
```
FirmenprofilSettings_withExistingProfile_rendersAllFields
FirmenprofilSettings_withEmptyProfile_rendersAllFieldsEmpty
```

---

### TC-02: FirmenprofilSettings — submits updated values via server action

**Type:** Unit (component + server action mock)

**Description:**
Verify that submitting the form calls `saveCompanyProfile` with the correct field values and shows a success toast on resolution.

**Preconditions:**
- `saveCompanyProfile` server action is mocked to return successfully.
- `toast.success` is spied on.

**Test Steps:**
1. Render `<FirmenprofilSettings />` with mocked profile loaded.
2. Update Firmenname field value to "Neue GmbH".
3. Click "Speichern".
4. Await async submission.

**Expected Result:**
- `saveCompanyProfile` is called with `{ firmenname: 'Neue GmbH', ... }`.
- Success toast fires once.

**Test File:** `src/components/settings/FirmenprofilSettings.test.tsx`

**Naming convention:**
```
FirmenprofilSettings_onValidSubmit_callsSaveAndShowsToast
```

---

### TC-03: FirmenprofilSettings — shows validation errors for missing required fields

**Type:** Unit (component)

**Description:**
Verify that submitting with an empty Firmenname shows a German validation error and does not call the server action.

**Preconditions:**
- `saveCompanyProfile` is mocked but should NOT be called.

**Test Steps:**
1. Render `<FirmenprofilSettings />` with Firmenname cleared.
2. Click "Speichern".

**Expected Result:**
- German validation message (e.g., "Firmenname ist erforderlich") appears.
- `saveCompanyProfile` is NOT called.

**Test File:** `src/components/settings/FirmenprofilSettings.test.tsx`

**Naming convention:**
```
FirmenprofilSettings_onSubmitWithEmptyFirmenname_showsValidationError
```

---

### TC-04: Screen1Firmenprofil — no editable form controls rendered

**Type:** Unit (React component — `src/components/wizard/screens/Screen1Firmenprofil.tsx`)

**Description:**
Verify that the transformed Screen 1 component does not render any `<input>`, `<select>`, `<textarea>`, or submit `<button>` for company profile data.

**Preconditions:**
- `fetch('/api/entries?type=profile')` is mocked to return a full profile.

**Test Steps:**
1. Render `<Screen1Firmenprofil />` with mocked fetch.
2. Query for all `input`, `select`, and `textarea` elements.

**Expected Result:**
- Zero writable `<input>` elements (type≠hidden) for profile fields.
- Zero `<select>` for Branche.
- No submit `<button>` labelled "Speichern" / "Weiter" for profile edits.

**Test File:** `src/components/wizard/screens/Screen1Firmenprofil.test.tsx`

**Naming convention:**
```
Screen1Firmenprofil_rendered_hasNoEditableInputs
```

---

### TC-05: Screen1Firmenprofil — displays read-only data and Settings link

**Type:** Unit (React component)

**Description:**
Verify that profile values are shown as text, an amber info callout is present, and a link pointing to `/settings` is rendered.

**Preconditions:**
- Fetch mock returns `{ firmenname: 'Test AG', branche: 'ELEKTROHANDWERK', mitarbeiter: 10, standort: 'Berlin' }`.

**Test Steps:**
1. Render `<Screen1Firmenprofil />`.
2. Assert the company name "Test AG" appears as visible text.
3. Assert a link with href `/settings` exists.
4. Assert an amber/info callout referencing "Einstellungen" is visible.

**Expected Result:**
- Company name is displayed as static text.
- A navigation link to `/settings` exists.
- Informational callout is visible.

**Test File:** `src/components/wizard/screens/Screen1Firmenprofil.test.tsx`

**Naming convention:**
```
Screen1Firmenprofil_withProfile_displaysCompanyNameAsReadOnly
Screen1Firmenprofil_rendered_containsLinkToSettings
Screen1Firmenprofil_withEmptyProfile_showsPromptToVisitSettings
```

---

### TC-06: FieldDocumentZone — hides initial upload button when suppressInitialUpload is true

**Type:** Unit (React component — `src/components/wizard/FieldDocumentZone.tsx`)

**Description:**
Verify that when `suppressInitialUpload={true}` the primary "Rechnung hochladen" button in the empty-state dashed zone is NOT rendered, preventing a duplicate upload trigger alongside `UploadOCR`.

**Preconditions:**
- Fetch mock returns `[]` (no existing documents).

**Test Steps:**
1. Render `<FieldDocumentZone fieldKey="STROM" year={2024} suppressInitialUpload={true} />`.
2. Query for button with name "Rechnung hochladen".

**Expected Result:**
- No button with text "Rechnung hochladen" is present in the empty state.
- The "Kein Dokument hochgeladen" placeholder text IS present (empty state dashed zone is still shown).

**Test File:** `src/components/wizard/FieldDocumentZone.test.tsx`

**Naming convention:**
```
FieldDocumentZone_withSuppressInitialUploadTrue_hidesUploadButton
FieldDocumentZone_withSuppressInitialUploadFalse_showsUploadButton
```

---

### TC-07: FieldDocumentZone — shows upload button when suppressInitialUpload is false (default)

**Type:** Unit (React component)

**Description:**
Verify that the default `FieldDocumentZone` (no `suppressInitialUpload` prop, or `false`) renders the upload button in the empty state — preserving existing behaviour for fields without OCR.

**Preconditions:**
- Fetch mock returns `[]`.

**Test Steps:**
1. Render `<FieldDocumentZone fieldKey="KAELTEMITTEL" year={2024} />` without `suppressInitialUpload`.
2. Assert the "Rechnung hochladen" button is present.

**Expected Result:**
- "Rechnung hochladen" button is visible.

**Test File:** `src/components/wizard/FieldDocumentZone.test.tsx`

**Naming convention:**
```
FieldDocumentZone_defaultProps_showsUploadButtonInEmptyState
```

---

### TC-08: FieldDocumentZone — renders document list when multiple docs are returned

**Type:** Unit (React component)

**Description:**
Verify that `FieldDocumentZone` renders one list entry per document returned by the API, each showing the filename, an "Ansehen" link, and an "Entfernen" button.

**Preconditions:**
- Fetch mock returns an array of three `FieldDocument` objects.

**Test Steps:**
1. Render `<FieldDocumentZone fieldKey="STROM" year={2024} />`.
2. Wait for the async fetch to resolve.
3. Assert three document rows are rendered.
4. For each row assert: filename text visible, "Ansehen" link present, "Entfernen" button present.

**Expected Result:**
- Three rows rendered, each with correct filename, link, and remove button.

**Test File:** `src/components/wizard/FieldDocumentZone.test.tsx`

**Naming convention:**
```
FieldDocumentZone_withMultipleDocs_rendersListWithViewAndRemovePerDoc
```

---

### TC-09: FieldDocumentZone — shows "Weitere Rechnung hinzufügen" button when docs exist

**Type:** Unit (React component)

**Description:**
When at least one document is attached, a "Weitere Rechnung hinzufügen" (or similar) button appears to allow appending additional documents.

**Preconditions:**
- Fetch mock returns one `FieldDocument` object.

**Test Steps:**
1. Render `<FieldDocumentZone fieldKey="STROM" year={2024} suppressInitialUpload={true} />`.
2. Wait for fetch to resolve.
3. Assert a button with name matching /weitere/i or /hinzufügen/i is present.

**Expected Result:**
- "Weitere Rechnung hinzufügen" button is visible.

**Test File:** `src/components/wizard/FieldDocumentZone.test.tsx`

**Naming convention:**
```
FieldDocumentZone_withOneExistingDoc_showsAddMoreButton
```

---

### TC-10: FieldDocumentZone — shows soft warning at or above 20 documents

**Type:** Unit (React component)

**Description:**
Verify that when the document count reaches 20, a soft warning message (not an error blocking further uploads) is displayed.

**Preconditions:**
- Fetch mock returns an array of exactly 20 `FieldDocument` objects.

**Test Steps:**
1. Render `<FieldDocumentZone fieldKey="STROM" year={2024} />`.
2. Wait for fetch.
3. Assert a warning element mentioning the document count or an advisory message is visible.
4. Assert no hard block — "Weitere Rechnung hinzufügen" button is still present (ADR-004 decision: soft limit only).

**Expected Result:**
- A soft-limit warning is displayed.
- The "Weitere Rechnung hinzufügen" button remains visible/enabled.

**Test File:** `src/components/wizard/FieldDocumentZone.test.tsx`

**Naming convention:**
```
FieldDocumentZone_with20Documents_showsSoftLimitWarning
FieldDocumentZone_with20Documents_doesNotBlockFurtherUploads
```

---

### TC-11: FieldDocumentZone — re-fetches documents when refreshKey changes

**Type:** Unit (React component)

**Description:**
Verify that incrementing the `refreshKey` prop triggers a new `fetch` call, allowing the parent `UploadOCR` to signal that a new document has been stored via OCR.

**Preconditions:**
- Fetch mock initially returns `[]`, then returns one document on the second call.

**Test Steps:**
1. Render `<FieldDocumentZone fieldKey="STROM" year={2024} refreshKey={0} />`.
2. Confirm empty state.
3. Re-render with `refreshKey={1}`.
4. Wait for fetch to be called again and state to update.

**Expected Result:**
- `fetch` is called exactly twice (once per `refreshKey` value).
- After the second render, the document row appears.

**Test File:** `src/components/wizard/FieldDocumentZone.test.tsx`

**Naming convention:**
```
FieldDocumentZone_onRefreshKeyIncrement_reFetchesDocuments
```

---

### TC-12: UploadOCR — appends fieldKey and year to FormData when props provided

**Type:** Unit (React component — `src/components/wizard/UploadOCR.tsx`)

**Description:**
Verify that when `fieldKey` and `year` props are passed, the component includes them in the `FormData` sent to `/api/ocr`, and calls `onDocumentStored` when the API response includes `fieldDocumentId`.

**Preconditions:**
- `fetch` is mocked to return `{ value: 1500, unit: 'kWh', confidence: 0.9, documentId: 5, fieldDocumentId: 42 }`.
- `onResult` and `onDocumentStored` callbacks are mocked.

**Test Steps:**
1. Render `<UploadOCR category="STROM" fieldKey="STROM" year={2024} onResult={onResult} onDocumentStored={onDocumentStored} />`.
2. Simulate a file selection.
3. Assert the `FormData` sent contains `fieldKey=STROM` and `year=2024`.
4. Assert `onDocumentStored` is called once with the returned document metadata.

**Expected Result:**
- Both `fieldKey` and `year` are included in FormData.
- `onDocumentStored` is called with `{ id: 42, ... }`.
- `onResult` is called with `(1500, 0.9, 5)`.

**Test File:** `src/components/wizard/UploadOCR.test.tsx`

**Naming convention:**
```
UploadOCR_withFieldKeyAndYear_appendsThemToFormData
UploadOCR_withFieldDocumentIdInResponse_callsOnDocumentStored
UploadOCR_withoutFieldKey_doesNotCallOnDocumentStored
```

---

### TC-13: GET /api/field-documents — returns array of documents ordered by uploadedAt

**Type:** Integration (API route — `src/app/api/field-documents/route.ts`)

**Description:**
Verify that after the migration the GET endpoint returns an array (`FieldDocument[]`) sorted ascending by `uploadedAt`, not a single object.

**Preconditions:**
- Prisma is mocked (`vi.mock`) to return an ordered array of two `FieldDocument` rows.

**Test Steps:**
1. Call `GET('/api/field-documents?fieldKey=STROM&year=2024')`.
2. Assert response status is 200.
3. Assert response body is an array.
4. Assert the array contains both documents in `uploadedAt` ascending order.

**Expected Result:**
- `[{ id: 1, ... }, { id: 2, ... }]` returned.
- `prisma.fieldDocument.findMany` called with `{ where: { fieldKey, year }, orderBy: { uploadedAt: 'asc' } }`.

**Test File:** `src/app/api/field-documents/route.test.ts`

**Naming convention:**
```
GET_fieldDocuments_withExistingDocs_returnsOrderedArray
GET_fieldDocuments_withNoDocs_returnsEmptyArray
GET_fieldDocuments_missingParams_returns400
```

---

### TC-14: POST /api/field-documents — creates new record with timestamp prefix (no upsert)

**Type:** Integration (API route)

**Description:**
Verify that uploading a second file for the same (fieldKey, year) creates a second DB record instead of replacing the first.

**Preconditions:**
- Prisma `fieldDocument.create` is mocked to return a new document with `id: 2`.
- Prisma `fieldDocument.upsert` should NOT be called.

**Test Steps:**
1. POST a file with `fieldKey=STROM` and `year=2024`.
2. Assert `prisma.fieldDocument.create` is called (not `upsert`).
3. Assert the `filePath` in the created record contains a numeric timestamp prefix.
4. Assert response status 200 and the new document object.

**Expected Result:**
- `create` is called; `upsert` is never called.
- `filePath` matches pattern `/uploads/2024/STROM/<timestamp>_<basename>.<ext>`.

**Test File:** `src/app/api/field-documents/route.test.ts`

**Naming convention:**
```
POST_fieldDocuments_validUpload_createsNewRecordWithTimestampPrefix
POST_fieldDocuments_secondUploadSameKey_createsSecondRecord
POST_fieldDocuments_missingFile_returns400
```

---

### TC-15: DELETE /api/field-documents/[id] — deletes record and file

**Type:** Integration (API route — `src/app/api/field-documents/[id]/route.ts`)

**Description:**
Verify the new DELETE endpoint: looks up the document by ID, removes the file from the filesystem, and deletes the DB record, returning 204.

**Preconditions:**
- `prisma.fieldDocument.findUniqueOrThrow` is mocked to return `{ id: 7, filePath: '/uploads/2024/STROM/123_bill.pdf', ... }`.
- `prisma.fieldDocument.delete` is mocked.
- `fs.unlink` is mocked (no actual FS access in test).

**Test Steps:**
1. Call `DELETE('/api/field-documents/7')`.
2. Assert `prisma.fieldDocument.findUniqueOrThrow` is called with `{ where: { id: 7 } }`.
3. Assert `unlink` is called with the absolute filesystem path.
4. Assert `prisma.fieldDocument.delete` is called with `{ where: { id: 7 } }`.
5. Assert response status 204.

**Expected Result:**
- 204 No Content response.
- Both file and DB record are removed.

**Test File:** `src/app/api/field-documents/[id]/route.test.ts`

**Naming convention:**
```
DELETE_fieldDocumentsById_existingDoc_deletesFileAndRecord
DELETE_fieldDocumentsById_missingFile_stillDeletesRecord
DELETE_fieldDocumentsById_nonexistentId_returns404OrThrows
```

---

### TC-16: DELETE /api/field-documents/[id] — tolerates already-deleted file

**Type:** Integration (API route)

**Description:**
If the file has already been removed from the filesystem (e.g., manual cleanup), the DELETE endpoint should log and continue rather than throwing.

**Preconditions:**
- `fs.unlink` mock throws `ENOENT`.

**Test Steps:**
1. Call `DELETE('/api/field-documents/7')`.

**Expected Result:**
- `prisma.fieldDocument.delete` is still called.
- Response is 204 (not 500).

**Test File:** `src/app/api/field-documents/[id]/route.test.ts`

**Naming convention:**
```
DELETE_fieldDocumentsById_fileAlreadyMissing_stillReturns204
```

---

### TC-17: POST /api/ocr — creates FieldDocument when fieldKey and year are provided

**Type:** Integration (API route — `src/app/api/ocr/route.ts`)

**Description:**
Verify the extended OCR route: when optional `fieldKey` and `year` fields are present in the FormData, the route writes the file and creates a `FieldDocument` record, returning `fieldDocumentId` in the response.

**Preconditions:**
- `prisma.uploadedDocument.create` is mocked.
- `prisma.fieldDocument.create` is mocked to return `{ id: 42, ... }`.
- `extractFromFile` is mocked to return `{ value: 1500, unit: 'kWh', confidence: 0.95 }`.
- `fs.writeFile` and `fs.mkdir` are mocked.

**Test Steps:**
1. POST `FormData` with `file`, `category=STROM`, `fieldKey=STROM`, `year=2024`.
2. Assert `prisma.fieldDocument.create` is called with correct year and fieldKey.
3. Assert response JSON contains `fieldDocumentId: 42`.

**Expected Result:**
- Response: `{ value: 1500, unit: 'kWh', confidence: 0.95, documentId: <n>, fieldDocumentId: 42 }`.

**Test File:** `src/app/api/ocr/route.test.ts`

**Naming convention:**
```
POST_ocr_withFieldKeyAndYear_createsFieldDocumentAndReturnsId
POST_ocr_withoutFieldKey_doesNotCreateFieldDocument
POST_ocr_missingFile_returns400
POST_ocr_missingCategory_returns400
```

---

### TC-18: POST /api/ocr — file path sanitisation for FieldDocument storage

**Type:** Integration (API route)

**Description:**
Verify that filenames with path-traversal characters, double extensions, or unicode characters are sanitised before writing to disk, consistent with the existing sanitisation logic in `/api/field-documents`.

**Preconditions:**
- Mocked FS layer.

**Test Steps:**
1. POST with filename `"../../evil.pdf"` and `fieldKey=STROM`, `year=2024`.
2. Assert the `filePath` written to disk does NOT contain `..` segments.
3. Repeat with `"invoice.pdf.exe"` — assert only a single safe extension remains.

**Expected Result:**
- Sanitised filenames are safe paths; path traversal is prevented.

**Test File:** `src/app/api/ocr/route.test.ts`

**Naming convention:**
```
POST_ocr_withPathTraversalFilename_sanitisesPath
POST_ocr_withDoubleExtension_keepsOnlySafeExtension
```

---

### TC-19: FieldDocumentZone — inline error on failed upload does not remove existing documents

**Type:** Unit (React component)

**Description:**
Verify that when an upload attempt fails (API returns non-OK), an inline German error message is shown and the existing document list is unchanged.

**Preconditions:**
- Initial fetch mock returns one existing document.
- Upload `fetch` mock returns `{ status: 500 }`.

**Test Steps:**
1. Render `<FieldDocumentZone fieldKey="STROM" year={2024} />` with one existing doc.
2. Trigger a file upload.
3. Assert error message is shown.
4. Assert existing document is still in the list.

**Expected Result:**
- Error text visible (e.g., "Upload fehlgeschlagen. Bitte erneut versuchen.").
- Previously attached document entry still present.

**Test File:** `src/components/wizard/FieldDocumentZone.test.tsx`

**Naming convention:**
```
FieldDocumentZone_onUploadFailure_showsErrorAndPreservesExistingDocs
```

---

### TC-20: FieldDocumentZone — removes correct document on "Entfernen" click

**Type:** Unit (React component)

**Description:**
Verify that clicking "Entfernen" on a specific document calls `DELETE /api/field-documents/{id}` with the correct ID, and removes only that document from the list.

**Preconditions:**
- Fetch mock returns two documents (`id: 1`, `id: 2`).
- DELETE mock returns 204.

**Test Steps:**
1. Render `<FieldDocumentZone fieldKey="STROM" year={2024} />` with two docs loaded.
2. Click "Entfernen" on the document with `id: 2`.
3. Assert DELETE is called with `/api/field-documents/2`.
4. Assert document `id: 2` is removed from the list; document `id: 1` remains.

**Expected Result:**
- Only document `id: 2` is removed; document `id: 1` is unaffected.

**Test File:** `src/components/wizard/FieldDocumentZone.test.tsx`

**Naming convention:**
```
FieldDocumentZone_onRemoveClick_deletesTargetDocOnly
```

---

## Test Data Requirements

| File | Description |
|------|-------------|
| No new files required | Prisma is mocked inline in integration tests; component tests use mock `fetch`. Component tests build fixture objects inline (small payloads). |

If reusable fixtures grow large, extract to `src/test/fixtures/fieldDocument.fixtures.ts`.

---

## Edge Cases

| Scenario | Expected Behaviour | Test Case |
|----------|-------------------|-----------|
| GET without `fieldKey` or `year` params | Returns 400 with German error message | TC-13 |
| POST with missing file | Returns 400 | TC-14 |
| POST with non-PDF/image MIME type | Should be rejected (file validation); error message in German | TC-14 (extension) |
| DELETE with non-existent ID | Returns 404 or Prisma `NotFoundError` propagates as 500 | TC-15 |
| DELETE with already-removed file | 204; DB record still deleted | TC-16 |
| UploadOCR without `fieldKey`/`year` props | `onDocumentStored` is never called; existing behaviour preserved | TC-12 |
| Screen 1 loaded with no profile in DB | Shows "Firmendaten noch nicht hinterlegt" prompt with Settings link | TC-05 |
| FieldDocumentZone with exactly 0 documents | Dashed empty-state shown | TC-06, TC-07 |
| FieldDocumentZone with exactly 1 document | "Weitere Rechnung hinzufügen" button appears | TC-09 |
| FieldDocumentZone with 19 documents | No soft-limit warning | TC-10 (boundary) |
| FieldDocumentZone with 20 documents | Soft-limit warning displayed | TC-10 |
| FieldDocumentZone refreshKey unchanged | No additional fetch is triggered | TC-11 |
| Filename with path-traversal characters | Sanitised to safe path; `..` not present | TC-18 |
| Filename with double extension (`.pdf.exe`) | Only safe single extension retained | TC-18 |
| FirmenprofilSettings fetch fails | Component shows an error state or empty fields gracefully | TC-01 |

---

## Non-Functional Tests

### Security — path sanitisation (TC-18)
The OCR route gains new file-writing logic. The test plan mandates explicit path-sanitisation tests (`TC-18`) to prevent directory traversal attacks. This mirrors the existing field-documents route sanitisation tests.

### Data integrity — no upsert regression (TC-14)
The removal of the `upsert` call must be confirmed; any regression re-introducing `upsert` would silently delete a user's previous document.

### Backward compatibility — GET response shape change (TC-13)
The GET endpoint changes from returning `FieldDocument | null` to `FieldDocument[]`. Any consumer still expecting a singular object must be caught by integration tests.

---

## Open Questions

| # | Question | Impact on Tests |
|---|----------|-----------------|
| 1 | Will `FieldDocumentZone` show a "Weitere Rechnung hinzufügen" button when `suppressInitialUpload={true}` and docs are empty, or only after the first document is present? | Affects TC-09 preconditions — test should be updated once architecture is confirmed. |
| 2 | Does the DELETE endpoint use `prisma.fieldDocument.findUniqueOrThrow` (throws on missing) or `findUnique` (returns null, responds 404 manually)? | Affects TC-15 and TC-16 error-path assertions. |

---

## E2E Test

**File:** `e2e-tests/app/e2e.spec.ts` (add to existing file, tagged `@feature-001`)

**Primary use case covered:** User opens Settings, updates Firmenprofil, navigates back to Dashboard and confirms the updated company name is shown. Also covers wizard Screen 1 read-only assertion.

See `uat-test-plan.md` for full Playwright scenario details.
