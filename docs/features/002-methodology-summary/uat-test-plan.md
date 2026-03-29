# UAT Test Plan: Methodology Summary Block & UBA Parameter Management

## Goal

Verify that the methodology summary block appears correctly in the Dashboard and in generated PDF reports, and that the UBA emission factor management UI works end-to-end in the running app (year selection, inline editing, auto-fill, and confirmation dialog).

---

## Prerequisites

Pull and run the Docker image built by CI, or start the dev server locally:

```bash
# Option A — Docker (uses the CI-built image for this PR)
docker run --rm -p 3000:3000 ghcr.io/<owner>/<repo>:pr-<N>-<sha>

# Option B — Local dev server
cd src && npm run dev
```

Navigate to `http://localhost:3000` to begin.

---

## Test Steps

### Step 1: Dashboard — Methodology Block (Collapsed State)

1. Navigate to `http://localhost:3000` (Dashboard).
2. Locate the "Methodik" card/block below the KPI cards.
3. Verify the **collapsed** headline:
   - Shows the text `"Methodik"`.
   - Shows a one-line summary: standard name · factor source label · scope chips (e.g., `"GHG Protocol Corporate Standard · UBA 2024 Emissionsfaktoren · S1 S2 S3"`).
   - The block has a subtle shadow and white background, consistent with dashboard cards.
   - A chevron icon (›) is visible on the right.
4. **Do NOT click** — verify the factor table is NOT visible yet.

---

### Step 2: Dashboard — Methodology Block (Expanded State)

1. Click (or press Enter/Space on) the "Methodik" block header.
2. Verify the block expands and shows:
   - **2×2 info grid**: Berechnungsstandard, Emissionsfaktoren, Enthaltene Scopes, Dateneingabe-Methoden.
   - **Annahmen & Ausschlüsse** section (either with content from the company profile, or the fallback text `"Keine besonderen Annahmen dokumentiert."`).
   - **Faktoren-Tabelle** with columns: Kategorie, Schlüssel, Faktor (kg CO₂e), Einheit, Scope, Quelle.
   - At least one row in the table.
   - Source badges are green pills labelled `"UBA 2024"` (assuming no overrides).
3. Verify the **footer** shows:
   - A grey description text about automatic assembly.
   - A `"Faktoren verwalten →"` link (styled in brand green).
4. Click `"Faktoren verwalten →"` and verify navigation to `/settings`.
5. Press Back and click the Methodik block again to re-expand.

---

### Step 3: Settings — Emissionsfaktoren Section

1. Navigate to `http://localhost:3000/settings`.
2. Scroll to find the **"Emissionsfaktoren"** section (below "Berichtsjahre").
3. Verify:
   - Section heading reads `"Emissionsfaktoren"`.
   - Description reads `"Emissionsfaktoren pro Berichtsjahr verwalten und offizielle UBA-Werte übernehmen."`.
   - A **year selector** (dropdown or tab bar) is visible.
   - After selecting a year (e.g., 2024), a **factor table** loads.
   - The table shows columns: Kategorie, Schlüssel, Wert, Einheit, Scope, Quelle.
   - Source badges show green `"UBA 2024"` for unmodified factors.
   - A **"UBA-Werte übernehmen"** button is visible and enabled.

---

### Step 4: Settings — Inline Factor Override (Dirty State)

1. In the Emissionsfaktoren table (year 2024), locate the row for any factor (e.g., Erdgas/ERDGAS).
2. Click the **value cell** and change the value to a custom number (e.g., type `1.999`).
3. Verify the edited row is visually highlighted (amber left-border or amber background).
4. Verify the **"Speichern"** button is now active/enabled.
5. Click **"Speichern"**.
6. Verify:
   - A success indicator appears (toast or inline confirmation).
   - The row is no longer highlighted (dirty state cleared).
   - The source badge for that row changes to an amber `"Benutzerdefiniert 2024"` pill.
7. Reload the page and navigate back to `/settings` → Emissionsfaktoren. Verify the custom value persists.
8. Navigate to the Dashboard. Verify the Methodik block headline now shows an amber indicator and `"Benutzerdefiniert 2024"` instead of the green UBA label.

---

### Step 5: Settings — UBA Auto-Fill (Confirmation Dialog)

1. Return to `/settings` → Emissionsfaktoren, year 2024.
2. Click **"UBA-Werte übernehmen"**.
3. Verify a **confirmation dialog** appears with:
   - An amber warning box.
   - The warning text: `"Dies überschreibt alle bestehenden Faktoren für 2024 mit den offiziellen UBA-Werten. Bestehende Werte (auch manuell geänderte) werden ersetzt."`
   - A "Bestätigen" (confirm) button and a "Abbrechen" (cancel) button.
4. Click **"Abbrechen"** first. Verify the dialog closes and no changes are made (the custom value from Step 4 is still present).
5. Click **"UBA-Werte übernehmen"** again, then click **"Bestätigen"**.
6. Verify:
   - A **success toast** appears: `"UBA 2024 Faktoren wurden erfolgreich übernommen."`.
   - The factor table refreshes and all rows show the official UBA 2024 values.
   - All source badges revert to green `"UBA 2024"` (no amber badges remain).
   - The value previously set to `1.999` is now replaced with the official UBA value.
7. Navigate to the Dashboard. Verify the Methodik block headline is back to the green UBA label.

---

### Step 6: Settings — Year Isolation (Two Years)

1. In `/settings` → Emissionsfaktoren, select **year 2023** from the year selector.
2. Edit one factor value in 2023 (e.g., change Erdgas to `2.123`).
3. Save.
4. Switch the year selector to **2024**.
5. Verify the 2024 table is unaffected (Erdgas still shows UBA 2024 value, not `2.123`).
6. Switch back to **2023** and confirm the `2.123` value persists.

---

### Step 7: PDF Report — Methodik Section Present

1. Navigate to `http://localhost:3000` (Dashboard).
2. Click the PDF report generation button (e.g., "GHG-Bericht erstellen" or equivalent).
3. Download and open the generated PDF.
4. Locate the **"Methodik"** section in the PDF.
5. Verify it contains:
   - Berechnungsstandard: `"GHG Protocol Corporate Standard"`
   - Emissionsfaktoren: the source label (e.g., `"UBA 2024 Emissionsfaktoren"` or `"Benutzerdefiniert 2024"`)
   - Enthaltene Scopes: the scopes with data
   - Dateneingabe-Methoden: counts for manual, OCR, CSV
   - Annahmen & Ausschlüsse text (or fallback)
   - A table of emission factors

---

## Expected Results

- **Dashboard Methodik block**: Visible in collapsed state with one-line summary; expands to full breakdown on click.
- **Scope chips**: Color-coded (green for Scope 1, blue for Scope 2, purple for Scope 3); only scopes with data are shown.
- **Settings Emissionsfaktoren section**: Fully functional year selector, editable table, working save, and auto-fill.
- **Dirty-state highlighting**: Amber row highlight for unsaved edits; cleared after save.
- **Auto-fill**: Replaces all factors (including previously customized ones) with official UBA values for the selected year.
- **Year isolation**: Auto-filling or editing year 2024 has no effect on year 2023 factors.
- **PDF Methodik section**: Present in GHG Protocol PDF with all required fields.
- **No regressions**: Other Dashboard cards, wizard flow, and Settings sections are unaffected.

---

## Verification Checklist

- [ ] "Methodik" collapsible block appears on the Dashboard in collapsed state by default.
- [ ] Collapsed headline shows standard, source label, and scope chips in the correct format.
- [ ] Clicking the block expands it and shows all six content sections.
- [ ] Scope chips are colored correctly (green/blue/purple) for each scope.
- [ ] When factors are all official UBA, source badges are green and headline is green.
- [ ] When any factor is custom, the Dashboard headline shows amber indicator and "Benutzerdefiniert {year}".
- [ ] "Faktoren verwalten →" link in the block footer navigates to `/settings`.
- [ ] Settings "Emissionsfaktoren" section is visible below "Berichtsjahre".
- [ ] Year selector loads available reporting years.
- [ ] Selecting a year loads the factor table for that year.
- [ ] Factor table shows all required columns with correct data.
- [ ] Editing a factor value highlights the row in amber (dirty state).
- [ ] "Speichern" saves the override; source badge changes to amber "Benutzerdefiniert {year}".
- [ ] Overridden value persists after page reload.
- [ ] "UBA-Werte übernehmen" button is enabled for years 2023 and 2024.
- [ ] Clicking the button opens a confirmation dialog (does NOT immediately write).
- [ ] Confirmation dialog shows the exact German warning text.
- [ ] "Abbrechen" closes the dialog without any changes.
- [ ] "Bestätigen" performs the auto-fill; success toast appears.
- [ ] After auto-fill, all factor values match the official UBA values; all badges are green.
- [ ] Editing/auto-filling year 2024 does not affect year 2023 factors (year isolation).
- [ ] Generated GHG Protocol PDF contains a "Methodik" section with all required fields.
- [ ] All UI text is in German.
- [ ] No regressions in other Dashboard cards, Settings sections, or wizard flow.
