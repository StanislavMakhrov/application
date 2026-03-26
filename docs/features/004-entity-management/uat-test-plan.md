# UAT Test Plan: Entity Management (Feature 004)

## Goal

Verify that operators can create, edit, and delete `EmissionFactor` records
and edit `IndustryBenchmark` records through the Settings page in the running
application, without any database or seed-script access.

---

## Test Steps

### Step 1: Boot the Application

```bash
# Option A — local dev server
cd src && npm run dev

# Option B — Docker image built by CI
docker run --rm -p 3000:3000 ghcr.io/<owner>/<repo>:pr-<N>-<sha>
```

Navigate to `http://localhost:3000/settings`.

---

### Step 2: Verify Read Mode for Both Tables

1. Scroll to the **Emissionsfaktoren** section.
2. Verify that the table renders all emission factor rows with columns:
   Kategorie, Jahr, Faktor (kg CO₂e), Einheit, Quelle, Bereich, and action icons.
3. Verify each row has a **pencil (edit) icon** and a **trash (delete) icon**.
4. Scroll to the **Branchenvergleich** section.
5. Verify each benchmark row has a **pencil (edit) icon**.
6. Verify no row is in edit mode by default.

**Expected**: Both tables show data. No inputs are visible in the initial state.

---

### Step 3: Inline-Edit an Emission Factor

1. In the **Emissionsfaktoren** table, click the pencil icon on the *Erdgas*
   row.
2. Verify that the `factorKg` cell becomes an `<input type="number">` containing
   the current value (e.g. `2.02`).
3. Verify that **Speichern** and **Abbrechen** buttons appear in the row.
4. Verify no other row is in edit mode.
5. Change the value to `2.10` and click **Speichern**.
6. Verify a `'Gespeichert.'` success toast appears.
7. Verify the row immediately shows `2,100` (de-DE formatted) without a full
   page reload.

---

### Step 4: Cancel Mid-Edit (No Save)

1. Click the pencil icon on another factor row.
2. Change the value to `999`.
3. Click **Abbrechen**.
4. Verify the row reverts to the original value.
5. Verify no toast appears.

---

### Step 5: Add a New Emission Factor

1. In the **Emissionsfaktoren** section, click **+ Neuer Faktor**.
2. A new blank row (or form section) should appear at the bottom of the table.
3. Fill in:
   - **Schlüssel** (Key): `TESTFAKTOR`
   - **Jahr**: `2025`
   - **Faktor (kg CO₂e)**: `1.23`
   - **Einheit**: `kg`
   - **Quelle**: `UAT Test`
   - **Bereich**: `SCOPE3`
4. Click **Hinzufügen**.
5. Verify the row `TESTFAKTOR` appears in the table.
6. Verify a `'Faktor hinzugefügt.'` toast appears.

---

### Step 6: Duplicate Factor Returns Conflict Toast

1. Click **+ Neuer Faktor** again.
2. Fill in the same key (`TESTFAKTOR`) and year (`2025`) used in Step 5.
3. Click **Hinzufügen**.
4. Verify a `'Dieser Faktor existiert bereits für dieses Jahr.'` error toast
   appears.
5. Verify the duplicate row was NOT added to the table.

---

### Step 7: Delete an Emission Factor

1. Find the `TESTFAKTOR` row added in Step 5.
2. Click the trash icon.
3. Verify a confirmation prompt or inline confirm (toast/dialog) appears.
4. Confirm deletion.
5. Verify a `'Faktor gelöscht.'` toast appears.
6. Verify the `TESTFAKTOR` row no longer appears in the table.

---

### Step 8: Inline-Edit a Benchmark

1. Scroll to the **Branchenvergleich** section.
2. Click the pencil icon on the *Baugewerbe* row.
3. Verify the `co2ePerEmployeePerYear` cell becomes an `<input type="number">`.
4. Change the value to `21.3`.
5. Click **Speichern**.
6. Verify a `'Gespeichert.'` toast appears.
7. Verify the row shows `21,3` (de-DE formatted).

---

### Step 9: Validate that Dashboard Reflects Updated Benchmark

1. Return to the dashboard (`/`).
2. Select the reporting year matching the benchmark row updated in Step 8.
3. Locate the **Branchenvergleich** card for the company's configured branche.
4. If the company profile is set to *Baugewerbe*, verify the card shows the
   updated benchmark value `21,3 t CO₂e/MA/Jahr`.

---

### Step 10: Regression — Existing Wizard Unaffected

1. Navigate to the CO₂e wizard (e.g. `/wizard` or `/eintraege/neu`).
2. Locate any wizard screen that shows a `FactorHint` for *Erdgas*.
3. Verify the hint now shows the edited value `2,100 kg CO₂e/m³` (from Step 3).
4. Complete at least one wizard step to verify no regression in calculations.

---

## Expected Results

- **Edit mode**: Pencil icon on every row opens an inline number input for
  that row only.
- **Save**: `PUT /api/factors/:id` or `PUT /api/benchmarks/:id` called;
  `'Gespeichert.'` toast shown; row updates without page reload.
- **Cancel**: No API call; original value restored.
- **Add**: `POST /api/factors` called; new row appears; `'Faktor hinzugefügt.'`
  toast shown.
- **Conflict**: Duplicate `(key, year)` shows
  `'Dieser Faktor existiert bereits für dieses Jahr.'` toast; no duplicate row.
- **Delete**: `DELETE /api/factors/:id` called; `'Faktor gelöscht.'` toast shown;
  row removed.
- **Dashboard**: Updated benchmark value reflected on next navigation to `/`.
- **Wizard hints**: Updated `factorKg` reflected in `FactorHint` components.

---

## Verification Checklist

- [ ] Emission factor table shows edit + delete icons on all rows
- [ ] Only one row is editable at a time
- [ ] Saving a factor update shows `'Gespeichert.'` toast
- [ ] Cancelling edit restores original value with no API call
- [ ] Adding a new factor row works end-to-end
- [ ] Duplicate `(key, year)` creates conflict toast, not a duplicate row
- [ ] Deleting a factor row removes it from the table
- [ ] Benchmark table shows edit icons on all rows
- [ ] Saving a benchmark update shows `'Gespeichert.'` toast
- [ ] Dashboard `BranchenvergleichCard` reflects updated benchmark value
- [ ] Wizard `FactorHint` reflects updated `factorKg` on next load
- [ ] No regressions in wizard calculations or existing settings sections
- [ ] Negative `factorKg` values (recycling credits) display ♻ indicator
- [ ] Client-side validation prevents saving `co2ePerEmployeePerYear ≤ 0`
