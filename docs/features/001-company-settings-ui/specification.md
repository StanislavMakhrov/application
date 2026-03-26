# Feature: Improve Company Settings Management, UI Simplification, and Invoice Flexibility

## Overview

This feature addresses three related improvements to the GrünBilanz data-entry and settings experience:

1. **Company Settings Centralisation** — company-wide settings (Firmenname, Branche, and related profile fields) currently live inside the "Daten erfassen" wizard (Screen 1). They are stored as a single global record, yet users encounter them during year-specific data entry, which is confusing. These settings should be managed from the central "Einstellungen" (Settings) page.

2. **Duplicate Invoice Upload Button** — when a numeric input field supports OCR invoice scanning (`UploadOCR` component) *and* document attachment (`FieldDocumentZone` component), the user sees two separate "Rechnung hochladen" buttons for the same field. This is visually confusing and implies two separate actions where one should suffice.

3. **Multiple Invoices per Category** — the current data model enforces a strict one-document-per-(fieldKey, year) limit. Users who receive monthly utility bills need to attach all 12 monthly invoices *plus* a year-end settlement invoice (up to 13 documents) as evidence for a single emission category.

---

## User Goals

- **Company settings**: Change Firmenname, Branche, and other company-wide information from one predictable, permanent location without navigating through year-specific data entry.
- **Invoice upload**: Upload an invoice once and have it serve both purposes — OCR-based value extraction *and* document storage as audit evidence — without encountering a second redundant upload button.
- **Multiple invoices**: Attach all relevant invoices (e.g., 12 monthly electricity bills and one annual settlement) to a single emission category so that the full document trail is available for auditors.

---

## Scope

### In Scope

1. **Company profile section in Settings page**
   - The "Einstellungen" page gains a "Firmenprofil" section that lets the user view and update all global company profile fields: Firmenname, Branche, Mitarbeiter (Anzahl), Standort, Logo, Berichtsgrenzen & Ausschlüsse.
   - When the user saves changes here, they are reflected across all years (existing behaviour — the profile is already global; only the UI location changes).

2. **Screen 1 (Firmenprofil) in the wizard becomes read-only or is removed**
   - Screen 1 of the "Daten erfassen" wizard either shows company profile data in read-only mode (with a link to the Settings page to edit) or is removed entirely from the wizard step sequence.
   - The wizard's progress bar and navigation adjust accordingly if Screen 1 is removed.

3. **Single upload action per field (OCR + document storage unified)**
   - For fields that currently show both an `UploadOCR` button and a `FieldDocumentZone` upload button, the UI should show exactly **one** upload action.
   - Uploading a file triggers OCR (value extraction) *and* stores the document as the field's evidence attachment in a single user action.
   - The `FieldDocumentZone` dashed zone remains visible to show the currently attached document and allow replacement, but it should not expose a second, independent upload button when `UploadOCR` is already present.

4. **Multiple documents per emission category**
   - The `FieldDocumentZone` component is updated to support an ordered list of documents per (fieldKey, year) instead of a single document.
   - Users can add as many documents as needed (suggested UX: "Weitere Rechnung hinzufügen" button).
   - Each document in the list shows its filename, an "Ansehen" (view) link, and a delete/remove action.
   - There is no hard upper limit imposed by the UI, though a soft warning may be shown if more than ~20 documents are attached (to prevent accidental runaway uploads).

### Out of Scope

- Changing how emission values are stored, calculated, or reported.
- Adding new company profile fields beyond those already in the `CompanyProfile` model.
- Per-year overrides of company profile data (e.g., different Firmenname in 2023 vs 2024).
- OCR improvements or changes to the OCR stub/API.
- CSV import functionality.
- Authentication or multi-tenancy.
- Logo upload (may be addressed separately; existing field is in scope for display in Settings but logo upload UI is optional for this feature).

---

## User Experience

### 1. Company Settings in the "Einstellungen" Page

**Current flow:**
1. User opens "Daten erfassen" → navigates to Screen 1 (Firmenprofil).
2. Edits Firmenname / Branche / Mitarbeiter / Standort.
3. Saves → company name updates on the Dashboard for all years.

**New flow:**
1. User opens "Einstellungen" (Settings page, accessible from the Dashboard).
2. A new "Firmenprofil" section appears, containing all company-wide fields (Firmenname, Branche, Mitarbeiter, Standort, Berichtsgrenzen, Ausschlüsse).
3. User edits and saves — toast confirms save.
4. Dashboard Firmenname badge and PDF headers reflect the updated value.
5. Screen 1 of the wizard either redirects to Settings or shows a compact read-only summary with an "Einstellungen öffnen" link.

### 2. Single Upload Button per Field

**Current behaviour (broken):**
- Field "Strom (kWh/Jahr)" shows:
  - Top-right: `[📄 Rechnung hochladen]` (UploadOCR button — triggers OCR)
  - Below input: dashed zone with `[Rechnung hochladen]` (FieldDocumentZone — stores document)
- Two separate upload triggers exist; uploading via UploadOCR does **not** automatically populate the FieldDocumentZone, so the user must upload twice to get both OCR pre-fill and stored evidence.

**New behaviour:**
- One upload action: a single "📄 Rechnung hochladen" button (in the position currently occupied by UploadOCR).
- Uploading a file:
  1. Sends to OCR API → pre-fills numeric value (existing UploadOCR behaviour).
  2. Also stores the file as the field's document attachment (existing FieldDocumentZone behaviour).
- The `FieldDocumentZone` area remains below the input to show attached documents and allow adding more; it does **not** show a separate upload button when a top-level UploadOCR button is already present for that field.
- For fields that have **only** `FieldDocumentZone` (no OCR, e.g., Erdgas, Kältemittel fields), the existing upload behaviour in `FieldDocumentZone` is unchanged.

### 3. Multiple Invoices per Category

**Current behaviour:**
- Each field allows exactly one attached document.
- Uploading a second document replaces the first.

**New behaviour:**
- The `FieldDocumentZone` shows a list of all attached documents for the field.
- Each list item displays: filename, upload date, "Ansehen" link, "Entfernen" (remove) button.
- A "➕ Weitere Rechnung hinzufügen" button allows adding more documents.
- Existing upload-replaces behaviour is replaced by upload-appends behaviour.
- Individual documents can be deleted without affecting others.
- An empty state still shows the dashed "Kein Dokument hochgeladen" placeholder with a single "Rechnung hochladen" prompt.

**Error states:**
- If an upload fails, an inline error message is shown without removing previously attached documents.
- Unsupported file types (other than PDF/images) are rejected with a clear German error message.

---

## Success Criteria

- [ ] The "Einstellungen" page contains a "Firmenprofil" section with all company-wide fields (Firmenname, Branche, Mitarbeiter, Standort, Berichtsgrenzen, Ausschlüsse).
- [ ] Saving the Firmenprofil in "Einstellungen" updates the company name displayed on the Dashboard and in PDF reports.
- [ ] Screen 1 of the wizard no longer allows editing company profile data (either shows read-only view with a Settings link, or is removed from the wizard).
- [ ] No field in "Daten erfassen" shows two separate "Rechnung hochladen" upload triggers simultaneously.
- [ ] Uploading a file via the single invoice upload button on an OCR-enabled field both pre-fills the numeric value (via OCR) and stores the document as field evidence.
- [ ] A user can attach more than one invoice document to a single emission category (e.g., 13 invoices for Strom).
- [ ] Each attached document is listed individually with view and remove options.
- [ ] Removing one document does not affect other attached documents.
- [ ] The empty state of `FieldDocumentZone` still shows a "Kein Dokument hochgeladen" placeholder.
- [ ] All UI labels and messages are in German, consistent with the existing application language.

---

## Open Questions

1. **Screen 1 removal vs. read-only**: Should Screen 1 ("Firmenprofil & Berichtsgrenzen") be fully removed from the wizard, or kept as a read-only summary that links to Settings? Removing simplifies the flow but may break existing bookmarks/navigation; keeping it adds a redirect step. The Architect should decide.

2. **Unified upload and OCR storage**: Currently `UploadOCR` stores the file as an `UploadedDocument` (in the database, for audit trail) while `FieldDocumentZone` stores the file on the filesystem as a `FieldDocument`. When unified, should the single upload create both records, or should one storage mechanism be chosen? The Architect should determine the preferred persistence strategy.

3. **FieldDocument data model change**: Supporting multiple documents per (fieldKey, year) requires removing or relaxing the `@@unique([fieldKey, year])` constraint in the Prisma schema and adding a migration. The Architect should confirm the migration strategy and whether old single-document records need to be preserved.

4. **Maximum document count**: Should the application enforce a hard maximum number of documents per field (e.g., 50), or rely solely on a soft UI warning? To be decided with input from the Maintainer.
