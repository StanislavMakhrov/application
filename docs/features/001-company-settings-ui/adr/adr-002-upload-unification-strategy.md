# ADR-002: Upload Unification — OCR + FieldDocument Persistence Strategy

## Status

Accepted

## Context

Two independent upload UI elements currently exist for OCR-enabled fields (e.g., STROM,
ERDGAS, HEIZOEL):

1. **`UploadOCR` button** — uploads the file to `/api/ocr`, which persists the file content
   in the `UploadedDocument` table (PostgreSQL `Bytes` column) for the audit trail, runs
   OCR, and returns `{ value, unit, confidence, documentId }`. The `documentId` is the
   `UploadedDocument.id` and is passed to `saveEntry()` for audit log linkage.

2. **`FieldDocumentZone` upload button** — uploads the file to `/api/field-documents`,
   which stores the file on the filesystem at
   `public/uploads/{year}/{fieldKey}/{filename}` and persists a `FieldDocument` record
   (path + metadata in PostgreSQL, file bytes on disk). This provides a directly-servable
   URL for the "Ansehen" (view) link.

The two mechanisms serve different purposes:
- `UploadedDocument` (DB bytes): immutable audit trail, linked to `AuditLog`.
- `FieldDocument` (filesystem + path): user-accessible document evidence, served via
  Next.js static file serving from `/public/uploads/`.

The spec requires a single upload action that does both.

## Options Considered

### Option A: Extend `/api/ocr` to optionally accept `fieldKey` + `year` (chosen)

Add two optional form-data parameters (`fieldKey`, `year`) to the existing
`POST /api/ocr` endpoint.

When both are present, after OCR completes the handler also:
1. Writes the file to the filesystem path (`public/uploads/{year}/{fieldKey}/`).
2. Creates a `FieldDocument` DB record.
3. Returns `fieldDocumentId` alongside the existing response fields.

Client-side, `UploadOCR` gains optional props `fieldKey?: string` and `year?: number`.
When provided, those are appended to the `FormData` sent to `/api/ocr`. On success,
the component calls a new optional `onDocumentStored?: (doc: FieldDocument) => void`
callback (or signals the `FieldDocumentZone` to refresh via a `refreshKey` counter
prop pattern).

`FieldDocumentZone` gains a boolean prop `suppressInitialUpload?: boolean` (default
`false`). When `true` (set by the parent screen when an `UploadOCR` is also present),
the zone hides the initial "Rechnung hinzufügen" button in its empty state, but still
shows existing documents and the "Weitere Rechnung hinzufügen" action.

- **Pros:**
  - Single network round-trip from the browser.
  - The file is never transmitted twice.
  - Minimal surface-area change: one endpoint, two new optional parameters.
  - `UploadedDocument` audit record and `FieldDocument` evidence record are created
    atomically in the same request.
  - Existing callers of `/api/ocr` that do not pass `fieldKey`/`year` continue to
    work unchanged.

- **Cons:**
  - The OCR route gains a secondary responsibility (file storage). However, this is
    consistent with the existing behaviour — the route already creates an
    `UploadedDocument` for the audit trail; adding `FieldDocument` creation is an
    incremental extension of the same "persist this upload" concern.

### Option B: Client-side two-step upload

`UploadOCR` fires first; on success, it uses the same `File` reference to trigger a
second `fetch` to `/api/field-documents`.

- **Pros:** Separation of concerns; each endpoint stays focused.
- **Cons:** Two round-trips; the `File` object must be kept in memory until the second
  upload completes; `UploadOCR` must know about field-document storage, coupling it to
  a concern it currently ignores; if the second upload fails, the OCR result has already
  been applied to the form but no `FieldDocument` was stored.

### Option C: New unified endpoint `POST /api/upload-invoice`

A new endpoint handles both concerns: runs OCR, writes `UploadedDocument` and
`FieldDocument`. `/api/ocr` and `/api/field-documents` remain unchanged.

- **Pros:** Clean isolation; existing endpoints untouched.
- **Cons:** Duplicates most of `/api/ocr`; introduces an additional route for developers
  to understand; the existing `UploadOCR` component must be pointed at the new route,
  making it conditionally route-aware.

## Decision

**Option A — Extend `/api/ocr` with optional `fieldKey` + `year` parameters.**

## Rationale

Option A minimises code duplication and keeps the number of network round-trips at one.
The OCR route already persists the uploaded file as `UploadedDocument`; adding conditional
`FieldDocument` creation is a natural extension, not a new concern. Option B would require
keeping the `File` reference alive across two awaited fetches and has a partial-failure
mode (OCR succeeds, document storage fails). Option C introduces a new endpoint that
largely duplicates the OCR route.

The `suppressInitialUpload` prop on `FieldDocumentZone` ensures that once the primary
OCR button is present for a field, no second standalone "Rechnung hinzufügen" trigger
appears in the empty state — satisfying the spec's "no duplicate upload buttons" requirement.

## Consequences

### Positive

- Single file transmission per upload action.
- Atomic creation of audit record (`UploadedDocument`) and evidence record (`FieldDocument`).
- Backward-compatible: existing callers of `/api/ocr` without `fieldKey`/`year` work as-is.
- `FieldDocumentZone` with `suppressInitialUpload={true}` still shows all attached
  documents and allows adding more invoices via "Weitere Rechnung hinzufügen".

### Negative

- `/api/ocr` route now has two distinct jobs (OCR extraction + optional file storage);
  this should be documented clearly in the route's JSDoc to avoid future confusion.
- The `UploadOCR` component props interface expands; callers that want OCR-only (no
  field document) continue to omit `fieldKey`/`year` and are unaffected.

## Implementation Notes

For the Developer:

**`/api/ocr` (route.ts):**
- Add optional `fieldKey = formData.get('fieldKey')` and `year = formData.get('year')`.
- After `uploadedDoc` creation and `extractFromFile`, if both `fieldKey` and `year` are
  present:
  1. Compute the filesystem path and write the file (same logic as `/api/field-documents`).
  2. Call `prisma.fieldDocument.create(...)` (no upsert — see ADR-003).
  3. Include `fieldDocumentId: doc.id` in the JSON response.

**`UploadOCR` component:**
- Add optional props: `fieldKey?: string`, `year?: number`, `onDocumentStored?: (doc: FieldDocument) => void`.
- If `fieldKey` and `year` are provided, append them to `FormData` before the `fetch`.
- On success, if `data.fieldDocumentId` is present, call `onDocumentStored` (if provided).

**`FieldDocumentZone` component:**
- Add prop `suppressInitialUpload?: boolean` (default `false`).
- Add prop `refreshKey?: number` — when this value changes (parent increments it after
  OCR upload completes), the zone re-fetches its document list.
- When `suppressInitialUpload` is `true`, the empty-state "Rechnung hinzufügen" button is
  hidden; instead show only the "Weitere Rechnung hinzufügen" button (which is always
  visible when `suppressInitialUpload` is `true`, regardless of document count).

**Screen components (Screen2, Screen3, Screen4, Screen5, Screen7):**
- For fields that have both `UploadOCR` and `FieldDocumentZone`:
  - Pass `fieldKey` and `year` props to `UploadOCR`.
  - Pass `suppressInitialUpload={true}` and `refreshKey={refreshCounter}` to
    `FieldDocumentZone`.
  - Maintain a `refreshCounter` state variable and increment it inside the
    `onDocumentStored` / `onResult` callbacks to trigger zone refresh.
- For fields that have only `FieldDocumentZone` (e.g., Kältemittel fields), no change.
