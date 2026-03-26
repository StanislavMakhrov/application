# UAT Test Plan: Company Settings Management, UI Simplification, and Invoice Flexibility

## Goal

Verify that the three user-facing improvements work correctly in the running app:
1. Firmenprofil is editable from the Settings page and Screen 1 is read-only.
2. Each OCR-enabled field shows exactly one upload button.
3. Multiple invoice documents can be attached to a single emission category.

---

## Test Steps

### Step 1: Edit Company Profile from Settings Page

1. Pull and run the Docker image built by CI:
   ```bash
   docker run --rm -p 3000:3000 ghcr.io/<owner>/<repo>:pr-<N>-<sha>
   ```
   *(Alternatively: `cd src && npm run dev` locally.)*
2. Navigate to `http://localhost:3000/settings`.
3. Locate the **"Firmenprofil"** section (expected above the "Berichtsjahre" section).
4. Verify all fields are present: Firmenname, Branche (dropdown), Mitarbeiter, Standort, Berichtsgrenzen & Ausschlüsse.
5. Change **Firmenname** to `"UAT Test GmbH"` and click **"Speichern"**.
6. Verify a green success toast appears (e.g., *"Firmenprofil gespeichert"*).
7. Navigate to `http://localhost:3000/` (Dashboard).
8. Verify the company name badge/heading now reads `"UAT Test GmbH"`.

### Step 2: Screen 1 is Read-Only with Settings Link

1. Navigate to `http://localhost:3000/wizard/1`.
2. Verify the page shows company profile data (Firmenname, Branche, etc.) as **plain text**, not as editable inputs.
3. Verify there is **no "Speichern" button** for company profile data on this screen.
4. Verify an amber info callout is displayed, referencing the Settings page (e.g., *"Firmenprofil-Daten können in den Einstellungen geändert werden."*).
5. Click the **"Einstellungen öffnen →"** (or equivalent) link in the callout.
6. Verify the browser navigates to `/settings`.
7. Return to `/wizard/1`. If no company profile has been set yet, verify a message prompts the user to visit Settings first.

### Step 3: Single Upload Button on OCR-Enabled Fields

1. Navigate to `http://localhost:3000/wizard/4` (Strom & Fernwärme screen).
2. Locate the **"Strom (kWh/Jahr)"** field.
3. Count the upload buttons associated with that field — there must be **exactly one** "📄 Rechnung hinzufügen" button.
4. Click the button and select a sample PDF.
5. Verify:
   - The OCR toast appears and resolves with an extracted value.
   - The numeric input is pre-filled with the OCR result.
   - The `FieldDocumentZone` below the input shows the uploaded filename with "Ansehen" and "Entfernen" actions.
6. Confirm there is **no second independent upload button** in the FieldDocumentZone dashed area for the same field.

### Step 4: Multiple Invoice Documents per Category

1. Still on `/wizard/4`, scroll to the **"Strom (kWh/Jahr)"** field.
2. Verify the first invoice uploaded in Step 3 is listed in the document zone.
3. Click **"Weitere Rechnung hinzufügen"** and upload a second PDF.
4. Verify the second document is **appended** to the list (both documents visible).
5. Click **"Weitere Rechnung hinzufügen"** again and upload a third PDF.
6. Verify three documents are listed, each showing:
   - Filename
   - "Ansehen" link (opens the file)
   - "Entfernen" button
7. Click **"Entfernen"** on the **second** document.
8. Verify:
   - The second document is removed.
   - The first and third documents remain listed.
   - A confirmation or the list updates immediately.
9. Click **"Ansehen"** on a remaining document and verify the file opens in a new tab.

### Step 5: Soft Limit Warning (optional — requires 20+ uploads)

1. In a test environment with scripted uploads, attach 20 documents to a single field.
2. Verify a soft warning message appears (e.g., *"Achtung: Sehr viele Dokumente angehängt"* or similar).
3. Verify the **"Weitere Rechnung hinzufügen"** button is still visible/enabled (no hard block).

---

## Expected Results

- **Settings page Firmenprofil section**: Visible, editable, saves successfully with toast feedback.
- **Dashboard update**: Company name reflects the new value immediately after navigating from Settings.
- **Wizard Screen 1**: Shows read-only company data; no editable inputs; Settings link present.
- **Upload button count**: Exactly one "Rechnung hinzufügen" trigger per OCR-enabled field.
- **Combined upload action**: A single upload pre-fills OCR value **and** stores the document.
- **Multi-document list**: Multiple invoices can be attached; each is listed with view/remove options.
- **Individual removal**: Removing one document leaves others untouched.
- **Soft limit**: A non-blocking warning appears at 20+ documents.
- **Language**: All labels, buttons, error messages, and toasts are in German.

---

## Verification Checklist

- [ ] "Firmenprofil" section is visible on `/settings` with all required fields
- [ ] Saving Firmenprofil shows a success toast and updates the Dashboard company name
- [ ] Screen 1 (`/wizard/1`) shows read-only profile data — no editable form controls
- [ ] Screen 1 displays an amber callout with a link to `/settings`
- [ ] Exactly one upload button per OCR-enabled field on wizard screens
- [ ] Single upload pre-fills the numeric field value (OCR) **and** stores the document in the list
- [ ] Multiple documents can be attached to one field (append, not replace)
- [ ] Each document entry shows filename, "Ansehen" link, and "Entfernen" button
- [ ] Deleting one document does not affect other attached documents
- [ ] "Weitere Rechnung hinzufügen" button appears when at least one document is attached
- [ ] Empty state shows "Kein Dokument hochgeladen" placeholder
- [ ] Soft warning appears at ≥ 20 documents; upload is still possible
- [ ] No regressions: year management on Settings page still works
- [ ] No regressions: non-OCR fields (e.g., Kältemittel) still show their upload button normally
- [ ] All UI text is in German
