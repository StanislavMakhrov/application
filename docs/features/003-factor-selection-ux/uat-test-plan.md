# UAT Test Plan: Factor Selection & Display UX (Feature 003)

## Goal

Verify that emission factor hints in all six wizard screens are loaded dynamically
from the database, and that the Settings page displays a complete read-only emission
factor table and an industry benchmark table.

---

## Test Steps

### Step 1: Confirm Dynamic Factor Hints on Wizard Screen 2 (Heizung)

1. Pull and run the Docker image built by CI:
   `docker run --rm -p 3000:3000 ghcr.io/<owner>/<repo>:pr-<N>-<sha>`
   > **Note:** Replace `<owner>/<repo>`, `<N>` (PR number), and `<sha>` (short commit SHA)
   > with the actual values shown in the CI "Build & Push Docker image" step output,
   > or in the PR's Docker image comment posted by the CI workflow.
2. Navigate to `http://localhost:3000/wizard/2` (Heizung & Gebäude).
3. Locate the **Erdgas** input field.
4. Observe the hint text beneath the field.
5. Navigate to `http://localhost:3000/settings` → **Emissionsfaktoren** table.
6. Find the row for **ERDGAS** and note its `factorKg` value.
7. Return to wizard Screen 2 and confirm the hint text matches the Settings table value.

**Verify:**
- Hint contains a factor value in de-DE locale (e.g. `2,020`)
- Hint includes unit `kg CO₂e/m³`
- Hint includes source and year (e.g. `UBA Datenbericht 2024 2024`)
- The hint value matches the ERDGAS row in the Settings factor table

---

### Step 2: Confirm Dynamic Factor Hints Across All Wizard Screens

1. Navigate to `http://localhost:3000/wizard/3` (Fuhrpark).
   - Observe hints beneath Diesel, Benzin, and km-based fields.
2. Navigate to `http://localhost:3000/wizard/4` (Strom).
   - Toggle the Ökostrom option; verify the hint changes between STROM and STROM_OEKOSTROM values.
3. Navigate to `http://localhost:3000/wizard/5` (Dienstreisen).
   - Observe hints for Flug, Bahn, Pendler fields.
4. Navigate to `http://localhost:3000/wizard/6` (Materialien).
   - Observe hints for each material row (e.g. Kupfer, Stahl, Aluminium).
5. Navigate to `http://localhost:3000/wizard/7` (Abfall).
   - Observe hints including the Altmetall (recycling credit) row.

**Verify:**
- All hints show a numeric value, unit, source, and year
- No hint shows raw hardcoded text (e.g. `"2,000"` — the old static value)
- Altmetall hint on Screen 7 shows a ♻ Gutschrift format

---

### Step 3: Confirm Settings Page — Emissionsfaktoren Section

1. Navigate to `http://localhost:3000/settings`.
2. Scroll to the **Emissionsfaktoren** section.

**Verify:**
- A table is present with columns: Kategorie, Faktor, Quelle, Jahr
- At least 30 rows appear (one per seeded emission factor key)
- Rows are grouped by Scope (Scope 1, Scope 2, Scope 3)
- Recycling credit entries (Altmetall) appear in green with a ♻ prefix
- No existing Settings sections (Berichtsjahre) are broken or missing

---

### Step 4: Confirm Settings Page — Branchenvergleich Section

1. On `http://localhost:3000/settings`, scroll below the Emissionsfaktoren table.
2. Locate the **Branchenvergleich** section.

**Verify:**
- A table is present with columns: Branche, CO₂e/MA/Jahr
- Each row shows a branch name (e.g. Produktion, Dienstleistung) and a CO₂e value
- Values are formatted in de-DE locale (comma as decimal separator)

---

### Step 5: Verify No Browser Console Errors

1. Open browser DevTools → Console tab.
2. Navigate through all six wizard screens (`/wizard/2` through `/wizard/7`).
3. Navigate to `/settings`.

**Verify:**
- No JavaScript errors in the console
- No `undefined` or `NaN` values rendered in the UI
- No network errors on the `/api/factors?year=...` requests (check Network tab)

---

## Expected Results

- **Dynamic hints**: All wizard screens display factor hints sourced from the database
  (`/api/factors` endpoint), not hardcoded values.
- **Consistency**: Factor values displayed in hints match the values in the Settings
  factor table (same source of truth).
- **Settings transparency**: The Emissionsfaktoren table lists all 30+ seeded factors
  with correct values, units, sources, and years.
- **Benchmark visibility**: The Branchenvergleich table is visible and shows benchmark
  CO₂e per employee per year for each seeded industry.
- **Graceful degradation**: No UI crashes; `–` placeholders appear if a specific factor
  key is not found.

---

## Verification Checklist

- [ ] Wizard Screen 2 (Heizung) shows dynamic factor hints
- [ ] Wizard Screen 3 (Fuhrpark) shows dynamic factor hints
- [ ] Wizard Screen 4 (Strom) shows correct hint with Ökostrom toggle
- [ ] Wizard Screen 5 (Dienstreisen) shows dynamic factor hints
- [ ] Wizard Screen 6 (Materialien) shows per-row factor hints
- [ ] Wizard Screen 7 (Abfall) shows hints including ♻ Gutschrift for Altmetall
- [ ] Hint values match the Settings Emissionsfaktoren table
- [ ] Settings page shows Emissionsfaktoren section with 30+ rows
- [ ] Settings page shows Branchenvergleich section with benchmark rows
- [ ] No JavaScript errors in browser console
- [ ] No regressions in existing wizard functionality (entries can still be saved)
- [ ] No regressions in existing Settings sections
