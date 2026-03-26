# UAT Test Plan: Methodology Summary

## Goal

Verify that the generated GHG Protocol PDF report includes a complete
"Methodik & Datenqualität" section that lists the governing standard, emission
factor table, data quality indicators, and reporting boundary assumptions.

---

## Prerequisites

- A running instance of the application with at least one `ReportingYear` containing
  emission entries across multiple categories and scopes.
- Emission factors must be seeded in the database (standard seed data is sufficient).
- At least one company profile with `reportingBoundaryNotes` or `exclusions` populated
  (or empty, to test the placeholder path).

---

## Test Steps

### Step 1: Download and Inspect GHG Protocol PDF

1. Pull and run the Docker image built by CI:
   ```
   docker run --rm -p 3000:3000 ghcr.io/<owner>/<repo>:pr-<N>-<sha>
   ```
2. Log in and navigate to the report generation page.
3. Select **GHG Protocol** as the report type and choose a reporting year that has
   emission entries.
4. Click **Bericht generieren** / **Download PDF**.
5. Open the downloaded PDF.
6. Verify that a **"Methodik & Datenqualität"** section exists (on page 2 or a
   dedicated final page).

**Expected Output:**
- PDF contains a clearly headed "Methodik & Datenqualität" section.
- The section mentions **"GHG Protocol Corporate Standard"** as the governing standard.

---

### Step 2: Verify Emission Factor Table

1. In the "Methodik & Datenqualität" section of the PDF, locate the **emission
   factor table**.
2. Verify that the table contains one row for each emission category that has a
   recorded entry in the selected reporting year (e.g., Erdgas, Strom, Diesel).
3. For each row, verify:
   - **Kategorie** — human-readable German label (e.g., "Erdgas", "Strom")
   - **Scope** — correct scope (e.g., Scope 1, Scope 2)
   - **Emissionsfaktor** — numeric kg CO₂e value (e.g., 2.020 kg CO₂e / m³)
   - **Einheit** — correct unit (e.g., m³, kWh, L)
   - **Quelle** — source name (e.g., "UBA Datenbericht 2024")
   - **Jahr** — valid year (e.g., 2024)
4. Verify that categories **not** present in the reporting year are **not** shown
   in the table.

**Expected Output:**
- Factor table is present and populated for all recorded categories.
- No rows for unrecorded categories.
- All six columns contain non-empty values.

---

### Step 3: Verify Data Quality Table

1. In the "Methodik & Datenqualität" section, locate the **data quality table**.
2. Verify that the table shows one row per recorded category.
3. For each row, verify the **Eingabemethode** column displays one of:
   - `Manuell` (for MANUAL entries)
   - `OCR (Rechnung)` (for OCR entries)
   - `CSV-Import` (for CSV entries)
4. Confirm the German labels are rendered correctly (not raw enum values like
   `MANUAL` or `OCR`).

**Expected Output:**
- Data quality table is present with one row per recorded category.
- Input method labels are in German.

---

### Step 4: Verify Boundary Notes and Exclusions

**Case A — Profile has boundary notes:**
1. Ensure the company profile has non-empty `reportingBoundaryNotes` and/or
   `exclusions` text.
2. Generate the PDF.
3. In the "Methodik & Datenqualität" section, verify the boundary/assumption text
   from the profile appears in the **Annahmen & Berichtsgrenzen** subsection.

**Case B — Profile has no boundary notes:**
1. Clear the `reportingBoundaryNotes` and `exclusions` fields in the company profile.
2. Generate the PDF.
3. Verify the placeholder text
   **"Keine benutzerdefinierten Annahmen eingetragen."** is shown instead.

**Expected Output:**
- Case A: Boundary text from profile appears verbatim.
- Case B: Placeholder text appears; no empty section or crash.

---

### Step 5: Verify Missing Factor Graceful Degradation

1. If possible, generate a report for a reporting year that contains an entry for
   a category whose emission factor is not seeded in the database.
2. Download the PDF.
3. Verify that the PDF is generated without an error.
4. Verify that the factor row for the missing category shows `–` for the factor
   value and `Faktor nicht gefunden` (or equivalent placeholder) for the source.

**Expected Output:**
- PDF generates successfully.
- Missing-factor row displays `–` instead of crashing.

---

### Step 6: Verify CSRD Report Is Unchanged

1. Generate a **CSRD Questionnaire** report (select the CSRD type).
2. Download and open the PDF.
3. Verify that the CSRD report does **not** contain a "Methodik & Datenqualität"
   section.
4. Verify the CSRD report content is identical to the pre-feature baseline.

**Expected Output:**
- CSRD PDF has no methodology block.
- All existing CSRD content is present and unmodified.

---

### Step 7: Verify Static Methodik Paragraph Removed from Materials Page

1. Open the GHG Protocol PDF generated in Step 1.
2. Navigate to the materials page (previously page 2).
3. Verify that the old static one-paragraph "Methodik" text citing only UBA 2024
   is **no longer present** on the materials page.
4. Confirm it has been replaced by the new dedicated methodology section.

**Expected Output:**
- Old static paragraph is absent from the materials page.
- New "Methodik & Datenqualität" section appears on its own page.

---

## Expected Results

- **Standard declaration**: "GHG Protocol Corporate Standard" appears in the methodology section.
- **Factor table**: Populated for all recorded categories with value, unit, source, and year.
- **Data quality table**: Shows German input method labels for each category.
- **Boundary notes**: Shown from profile or placeholder if none entered.
- **Graceful degradation**: Missing factors render `–` without crashing.
- **CSRD unchanged**: No methodology block in CSRD reports.
- **Old static paragraph removed**: Materials page no longer shows the minimal legacy text.

---

## Verification Checklist

- [ ] PDF contains a "Methodik & Datenqualität" section
- [ ] Section states "GHG Protocol Corporate Standard" as the governing standard
- [ ] Emission factor table shows factor value, unit, source, and year per category
- [ ] Only categories with recorded entries appear in the factor table
- [ ] Data quality table shows German input method labels (Manuell / OCR (Rechnung) / CSV-Import)
- [ ] Boundary notes from company profile appear (or placeholder if none)
- [ ] PDF generates successfully even when a factor is missing from the DB
- [ ] CSRD Questionnaire report is unchanged (no methodology block)
- [ ] Old static "Methodik" paragraph is removed from the materials page
- [ ] No visual regressions on other pages of the GHG Protocol report
