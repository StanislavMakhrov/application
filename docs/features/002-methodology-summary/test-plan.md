# Test Plan: Methodology Summary Block & UBA Parameter Management

## Overview

This test plan covers feature `002-methodology-summary`, which adds two coordinated capabilities to GrünBilanz:

1. **Methodology Summary Block** — an automatically assembled "Methodik" section in every generated PDF report (GHG Protocol + CSRD), and a matching collapsible block in the web UI Dashboard.
2. **UBA Factor Management UI** — an "Emissionsfaktoren" section in Settings where users can view, edit, and one-click auto-fill official UBA emission factors per reporting year.

Reference documents: `specification.md`, `architecture.md`, `ux-design.md`, and `adr/ADR-001` through `ADR-004`.

---

## Test Coverage Matrix

| Acceptance Criterion (from specification) | Test Case(s) | Test Type |
|-------------------------------------------|--------------|-----------|
| Every GHG Protocol PDF includes a "Methodik" section with standard, factor source, scopes, input-method breakdown, and assumptions | TC-01, TC-02 | Unit (service), Integration (API) |
| Every CSRD Questionnaire PDF includes an equivalent methodology summary section | TC-02 | Integration (API) |
| Methodology block in PDF is assembled automatically from live DB data (no static text) | TC-01, TC-03 | Unit (service) |
| UI (Dashboard) shows methodology information in a collapsible section | TC-10, TC-11 | Unit (component) |
| Settings page includes an "Emissionsfaktoren" section | TC-15 | Unit (component) |
| User can trigger one-click "UBA-Werte übernehmen" action for selected year | TC-08, TC-09, TC-16 | Integration (API), Unit (component) |
| After auto-filling, factor values match official UBA values | TC-08 | Integration (API) |
| Factors for one year are independent of other years; updating year Y does not change year Z | TC-09 | Integration (API) |
| Individual factor values can be manually overridden; overrides are visually distinguished | TC-07, TC-14 | Integration (API), Unit (component) |
| Confirmation dialog is shown before auto-fill overwrites existing factors | TC-16 | Unit (component) |
| Methodology block's factor source label reflects whether official or custom factors were used | TC-04, TC-05 | Unit (service) |
| All UI text is in German, consistent with the existing application | TC-10, TC-15, TC-16 | Unit (component) |
| Feature does not require external network calls; all built-in UBA data is bundled | TC-20, TC-21 | Unit (data module) |
| "to fill everything manually by user will be overkill" — UI MUST provide automated UBA auto-fill | TC-08, TC-16 | Integration (API), Unit (component) |
| Year-specific UBA parameters — factors for one reporting year MUST NOT silently overwrite another year | TC-09 | Integration (API) |

---

## User Acceptance Scenarios

> **Purpose**: These scenarios guide the UAT Tester and Maintainer when running the app to verify user-visible behaviour. All scenarios use the running app (Docker or `npm run dev`).

### Scenario 1: View methodology block on Dashboard (collapsed and expanded)

**User Goal**: An auditor opens the Dashboard and can immediately see the methodology summary for the current reporting year without downloading the PDF.

**Test Steps**:
1. Run the app (`cd src && npm run dev` or pull and run Docker image).
2. Navigate to `/` (Dashboard).
3. Locate the "Methodik" collapsible block (below the KPI cards).
4. Read the collapsed headline. Verify it shows the standard, source label, and scope chips.
5. Click the block (or press Enter/Space) to expand it.
6. Verify the expanded content shows: Berechnungsstandard, Emissionsfaktoren source, Enthaltene Scopes, Dateneingabe-Methoden, Annahmen & Ausschlüsse, and the full Faktoren-Tabelle.
7. Click the "Faktoren verwalten →" link in the footer.

**Expected Output**:
- Collapsed headline: `"Methodik · GHG Protocol Corporate Standard · UBA {year} · S1 S2 S3"` (or only scopes with data).
- Expanded state shows all six content sections, with the factor table listing every factor key, German label, kg CO₂e value, unit, scope, and source badge.
- "Faktoren verwalten →" navigates to `/settings`.

**Success Criteria**:
- [ ] Collapsible block is visible on the Dashboard.
- [ ] Collapsed headline shows standard, source label, and scope chips.
- [ ] Expanded view shows all six content areas.
- [ ] Factors table contains rows for each category (Erdgas, Strom, Diesel, etc.).
- [ ] Source badges are green (UBA) or amber (Benutzerdefiniert) as appropriate.
- [ ] "Faktoren verwalten →" link navigates to `/settings`.
- [ ] All text is in German.

---

### Scenario 2: Manage UBA emission factors in Settings (view + override)

**User Goal**: A user views the emission factors for a reporting year and manually overrides one value to reflect a specific energy contract.

**Test Steps**:
1. Navigate to `/settings`.
2. Locate the "Emissionsfaktoren" section.
3. Select a reporting year from the year selector (e.g., 2024).
4. Verify the factor table loads and shows factors for 2024.
5. Click the value cell for "Strom" and change it to a custom value (e.g., `0.200`).
6. Observe that the row is highlighted (dirty state — amber left-border).
7. Click "Speichern".
8. Navigate away and return to `/settings` → verify the override value is persisted.
9. Return to the Dashboard and verify the Methodik block now shows `"Benutzerdefiniert {year}"` in amber.

**Expected Output**:
- Factor table loads factors for the selected year.
- Editing a cell puts the row into a dirty state (amber highlight, original value visible with strikethrough).
- Saving persists the change and removes dirty state.
- The methodology block on the Dashboard updates to reflect the custom source label.

**Success Criteria**:
- [ ] Year selector lists available reporting years.
- [ ] Factor table renders all factors with correct columns (Kategorie, Schlüssel, Faktor, Einheit, Scope, Quelle).
- [ ] Editing a value highlights the row in amber (dirty state).
- [ ] "Speichern" saves the change successfully.
- [ ] After save, overridden row shows "Benutzerdefiniert {year}" badge in amber.
- [ ] Dashboard Methodik block headline updates source label to "Benutzerdefiniert {year}".

---

### Scenario 3: UBA auto-fill — apply official values for a year

**User Goal**: A new reporting year has started; the user wants to populate all emission factors for 2024 with official UBA values in one click.

**Test Steps**:
1. Navigate to `/settings` → "Emissionsfaktoren".
2. Select year 2024 from the year selector.
3. Click the "UBA-Werte übernehmen" button.
4. Verify a confirmation dialog appears with the amber warning text.
5. Read the warning: *"Dies überschreibt alle bestehenden Faktoren für 2024 mit den offiziellen UBA-Werten. Bestehende Werte (auch manuell geänderte) werden ersetzt."*
6. Click "Bestätigen".
7. Verify a success toast appears: `"UBA 2024 Faktoren wurden erfolgreich übernommen."`.
8. Verify the factor table updates with the official UBA values and all source badges show green "UBA 2024".

**Expected Output**:
- Confirmation dialog is shown with the exact warning text.
- After confirmation, all factor values are replaced with UBA 2024 values.
- Any previously custom-overridden values are replaced (full replace, not merge).
- Success toast is visible.
- All source badges revert to green "UBA 2024".

**Success Criteria**:
- [ ] "UBA-Werte übernehmen" button is visible and enabled for years 2023 and 2024.
- [ ] Confirmation dialog appears before any data is changed.
- [ ] Warning text matches the specification verbatim.
- [ ] After confirmation, success toast is shown.
- [ ] Factor table reflects the official UBA values.
- [ ] No other year's factors are affected.

---

### Scenario 4: PDF report includes the Methodik section

**User Goal**: An auditor downloads the GHG Protocol PDF and finds the complete methodology block inside the document.

**Test Steps**:
1. Navigate to the Dashboard.
2. Click "PDF-Bericht erstellen" (or equivalent report download action).
3. Open the downloaded PDF.
4. Locate the "Methodik" section.
5. Verify all required fields are present.

**Expected Output**:
- PDF includes a "Methodik" section with:
  - Berechnungsstandard: "GHG Protocol Corporate Standard"
  - Emissionsfaktoren: source label + year (e.g., "UBA 2024 Emissionsfaktoren")
  - Enthaltene Scopes: lists only scopes with non-zero entries
  - Dateneingabe-Methoden: counts of manual, OCR, and CSV entries
  - Annahmen & Ausschlüsse: from company profile or fallback text
  - Faktoren-Tabelle: per-category table with factor values

**Success Criteria**:
- [ ] "Methodik" section is present in the GHG Protocol PDF.
- [ ] All six required fields are present.
- [ ] No static/hardcoded text — all values reflect current data.
- [ ] CSRD PDF also includes an equivalent "Methodik" section.

---

## UX Acceptance Criteria

<!-- These are product-level assertions about what the user sees and experiences.
     Derived from the specification's "Explicit Constraints" and "User Experience" sections.
     Validated by the Code Reviewer and UAT Tester — they are NOT functional tests. -->

- [ ] The "Methodik" block on the Dashboard is **collapsed by default** and shows a one-line summary headline in its collapsed state.
- [ ] The collapsed headline shows the format: `"Methodik · {standard} · {factorSourceLabel} · {scopeChips}"`.
- [ ] Scope chips use semantic colors: Scope 1 = green, Scope 2 = blue, Scope 3 = purple.
- [ ] When any factor is custom-overridden, the Dashboard block headline shows an amber icon and `"Benutzerdefiniert {year}"` instead of the green UBA label.
- [ ] The expanded block shows a 2×2 meta-info grid (Berechnungsstandard, Emissionsfaktoren, Enthaltene Scopes, Dateneingabe-Methoden).
- [ ] UBA factor source badges in the factor table are displayed with a green pill; custom/overridden source badges are displayed with an amber pill.
- [ ] When at least one factor is custom-overridden, a warning line below the table reads: `"⚠ Ein oder mehrere Faktoren wurden manuell angepasst (Benutzerdefiniert {year})."`.
- [ ] The "Faktoren verwalten →" footer link is visible in the expanded Dashboard block and navigates to `/settings`.
- [ ] The Settings "Emissionsfaktoren" section heading reads `"Emissionsfaktoren"` and the description reads `"Emissionsfaktoren pro Berichtsjahr verwalten und offizielle UBA-Werte übernehmen."`.
- [ ] If no UBA reference data exists for the selected year, the "UBA-Werte übernehmen" button is **disabled** with a tooltip: `"Keine offiziellen UBA-Werte für dieses Jahr verfügbar."`.
- [ ] The auto-fill confirmation dialog warning reads verbatim: `"Dies überschreibt alle bestehenden Faktoren für [Jahr] mit den offiziellen UBA-Werten. Bestehende Werte (auch manuell geänderte) werden ersetzt."`.
- [ ] The success toast after auto-fill reads: `"UBA [Jahr] Faktoren wurden erfolgreich übernommen."`.
- [ ] Dirty (unsaved) rows in the factor table are visually highlighted with an amber left-border.
- [ ] Saving fails gracefully — an inline error is shown without discarding the user's edits.
- [ ] All Explicit Constraints from the specification are satisfied:
  - [ ] Manual-only UBA data entry is NOT acceptable; the UI MUST provide an automated way to populate official UBA values ("to fill everything manually by user will be overkill").
  - [ ] Users must be able to automatically fill UBA official values (a one-click "UBA-Werte übernehmen" action per year that loads the official UBA factor set).
  - [ ] Every year has its own UBA values (year-specific UBA parameters); factors for one reporting year MUST NOT silently overwrite or be confused with factors for another year.

---

## Test Cases

### TC-01: getMethodologyData — returns complete data for a year with factors and entries

**Type:** Unit (`src/lib/methodology.ts`)

**Description:**
Verifies that `getMethodologyData(yearId)` returns a correctly shaped `MethodologyData` object when the DB has emission factors, emission entries, and a company profile for the given year.

**Preconditions:**
- Prisma client is mocked.
- DB mock returns: 3 factors (SCOPE1, SCOPE2, SCOPE3), 5 entries (2 MANUAL, 2 OCR, 1 CSV with non-zero quantities), and a company profile with `reportingBoundaryNotes = "Leased car excluded"` and `exclusions = "Scope 3 partial"`.
- All factors have `source = "UBA 2024"`.

**Test Steps:**
1. Mock Prisma `emissionFactor.findMany`, `emissionEntry.findMany`, `companyProfile.findFirst`.
2. Call `await getMethodologyData(1)`.
3. Assert returned object fields.

**Expected Result:**
- `standard` = `"GHG Protocol Corporate Standard"`.
- `factorSourceLabel` = `"UBA 2024 Emissionsfaktoren"`.
- `factorYear` = `2024`.
- `includedScopes` contains `['SCOPE1', 'SCOPE2', 'SCOPE3']`.
- `inputMethodCounts` = `{ manual: 2, ocr: 2, csv: 1 }`.
- `assumptions` = `"Leased car excluded"`.
- `exclusions` = `"Scope 3 partial"`.
- `factors` array has 3 items with correct `key`, `factorKg`, `unit`, `scope`, `source`.

**Test File:** `src/lib/__tests__/methodology.test.ts`

**Naming convention:**
```
getMethodologyData_withFactorsAndEntries_returnsCompleteData
```

---

### TC-02: getMethodologyData — uses correct standard label for report type

**Type:** Unit (`src/lib/methodology.ts`)

**Description:**
Verifies that the `standard` field in the returned data is `"GHG Protocol Corporate Standard"` (the default, since the report type is not a parameter of `getMethodologyData`; the report API passes it through the component props).

**Preconditions:**
- Prisma mocked with minimal valid data (one factor, one entry).

**Test Steps:**
1. Call `await getMethodologyData(1)`.
2. Assert `result.standard`.

**Expected Result:**
- `result.standard` = `"GHG Protocol Corporate Standard"`.

**Test File:** `src/lib/__tests__/methodology.test.ts`

**Naming convention:**
```
getMethodologyData_always_returnsGHGProtocolStandard
```

---

### TC-03: getMethodologyData — handles year with no emission factors gracefully

**Type:** Unit (`src/lib/methodology.ts`)

**Description:**
Verifies that calling `getMethodologyData` for a year with no factors in the DB returns a result with an empty `factors` array and a safe default `factorSourceLabel`.

**Preconditions:**
- `emissionFactor.findMany` returns `[]`.
- `emissionEntry.findMany` returns `[]`.
- Company profile exists.

**Test Steps:**
1. Call `await getMethodologyData(99)`.
2. Assert the returned object fields.

**Expected Result:**
- `factors` = `[]`.
- `includedScopes` = `[]`.
- `inputMethodCounts` = `{ manual: 0, ocr: 0, csv: 0 }`.
- No error is thrown.

**Test File:** `src/lib/__tests__/methodology.test.ts`

**Naming convention:**
```
getMethodologyData_withNoFactors_returnsEmptyArraysGracefully
```

---

### TC-04: getMethodologyData — factorSourceLabel is "UBA {year} Emissionsfaktoren" when all factors are official

**Type:** Unit (`src/lib/methodology.ts`)

**Description:**
Verifies the "all UBA" source label rule: if every factor in the year has `source = "UBA {year}"`, the `factorSourceLabel` is `"UBA {year} Emissionsfaktoren"`.

**Preconditions:**
- Two factors, both with `source = "UBA 2024"`, `validYear = 2024`.

**Test Steps:**
1. Call `await getMethodologyData(1)`.
2. Assert `result.factorSourceLabel`.

**Expected Result:**
- `result.factorSourceLabel` = `"UBA 2024 Emissionsfaktoren"`.

**Test File:** `src/lib/__tests__/methodology.test.ts`

**Naming convention:**
```
getMethodologyData_allFactorsUBA_returnsUBASourceLabel
```

---

### TC-05: getMethodologyData — factorSourceLabel is "Benutzerdefiniert {year}" when any factor is custom

**Type:** Unit (`src/lib/methodology.ts`)

**Description:**
Verifies the conservative "any custom" source label rule: if even one factor has `source` that does not match `"UBA {year}"`, the whole year's label becomes `"Benutzerdefiniert {year}"`.

**Preconditions:**
- Two factors: one with `source = "UBA 2024"`, one with `source = "Benutzerdefiniert 2024"`.

**Test Steps:**
1. Call `await getMethodologyData(1)`.
2. Assert `result.factorSourceLabel`.

**Expected Result:**
- `result.factorSourceLabel` = `"Benutzerdefiniert 2024"`.

**Test File:** `src/lib/__tests__/methodology.test.ts`

**Naming convention:**
```
getMethodologyData_anyCustomFactor_returnsBenutzerdefiniert
```

---

### TC-06: getMethodologyData — includedScopes excludes scopes with only zero-quantity entries

**Type:** Unit (`src/lib/methodology.ts`)

**Description:**
Verifies scope inclusion rule: a scope is included only if it has at least one entry with `quantity ≠ 0`. Scopes with only zero-quantity entries or no entries at all are omitted.

**Preconditions:**
- Entries: two SCOPE1 entries with `quantity = 100`, one SCOPE2 entry with `quantity = 0`, no SCOPE3 entries.

**Test Steps:**
1. Call `await getMethodologyData(1)`.
2. Assert `result.includedScopes`.

**Expected Result:**
- `includedScopes` = `['SCOPE1']` (SCOPE2 has only zero-quantity entry; SCOPE3 is absent).

**Test File:** `src/lib/__tests__/methodology.test.ts`

**Naming convention:**
```
getMethodologyData_zeroQuantityScope_excludedFromIncludedScopes
```

---

### TC-07: PUT /api/emission-factors/[id] — updates factor value and sets source to "Benutzerdefiniert"

**Type:** Integration (API route `src/app/api/emission-factors/[id]/route.ts`)

**Description:**
Verifies that a `PUT` request with `{ factorKg: 0.200 }` updates the factor value and changes the `source` field to `"Benutzerdefiniert {validYear}"`.

**Preconditions:**
- Prisma mock: `emissionFactor.findUnique` returns an existing factor with `id = 5`, `validYear = 2024`, `source = "UBA 2024"`.
- `emissionFactor.update` is mocked to return the updated record.

**Test Steps:**
1. Send `PUT /api/emission-factors/5` with body `{ "factorKg": 0.200 }`.
2. Assert the response status and body.
3. Assert that `prisma.emissionFactor.update` was called with `source: "Benutzerdefiniert 2024"`.

**Expected Result:**
- Response HTTP 200.
- `prisma.emissionFactor.update` called with `{ factorKg: 0.200, source: "Benutzerdefiniert 2024" }`.

**Test File:** `src/app/api/emission-factors/[id]/route.test.ts`

**Naming convention:**
```
PUT_emissionFactorId_withValidValue_updatesFactorAndSetsCustomSource
```

---

### TC-08: POST /api/emission-factors/uba-fill — replaces all factors for year with UBA reference values

**Type:** Integration (API route `src/app/api/emission-factors/uba-fill/route.ts`)

**Description:**
Verifies that `POST /api/emission-factors/uba-fill` with `{ "year": 2024 }` upserts all UBA reference factors for 2024 into the DB and returns the count of upserted records.

**Preconditions:**
- `UBA_REFERENCE_DATA[2024]` contains N factors (as defined in `uba-reference-data.ts`).
- Prisma `emissionFactor.upsert` is mocked to succeed.

**Test Steps:**
1. Send `POST /api/emission-factors/uba-fill` with body `{ "year": 2024 }`.
2. Assert the response status and `upsertedCount`.
3. Assert that `prisma.emissionFactor.upsert` was called exactly N times with the correct data.

**Expected Result:**
- Response HTTP 200 with `{ "upsertedCount": N }` where N equals `UBA_REFERENCE_DATA[2024].length`.
- Each upsert call sets `source = "UBA 2024"` and `label` from the reference data.

**Test File:** `src/app/api/emission-factors/uba-fill/route.test.ts`

**Naming convention:**
```
POST_ubaFill_withValidYear_upsertsAllReferenceFactors
```

---

### TC-09: POST /api/emission-factors/uba-fill — does not affect other years' factors

**Type:** Integration (API route)

**Description:**
Verifies that auto-filling year 2024 only calls upsert with `validYear = 2024` and never touches factors with a different `validYear`.

**Preconditions:**
- Same as TC-08.

**Test Steps:**
1. Send `POST /api/emission-factors/uba-fill` with body `{ "year": 2024 }`.
2. Collect all calls to `prisma.emissionFactor.upsert`.
3. Assert that every call uses `validYear: 2024` in the `where` clause.

**Expected Result:**
- No upsert call has a `validYear` other than `2024`.

**Test File:** `src/app/api/emission-factors/uba-fill/route.test.ts`

**Naming convention:**
```
POST_ubaFill_forYear2024_neverWritesToOtherYears
```

---

### TC-10: POST /api/emission-factors/uba-fill — returns 400 for unknown year

**Type:** Integration (API route)

**Description:**
Verifies that requesting auto-fill for a year not present in `UBA_REFERENCE_DATA` returns HTTP 400 and no DB writes occur.

**Preconditions:**
- `UBA_REFERENCE_DATA` contains only 2023 and 2024.
- `prisma.emissionFactor.upsert` is mocked.

**Test Steps:**
1. Send `POST /api/emission-factors/uba-fill` with body `{ "year": 2099 }`.
2. Assert HTTP response status.
3. Assert no upsert calls were made.

**Expected Result:**
- Response HTTP 400.
- `prisma.emissionFactor.upsert` is never called.

**Test File:** `src/app/api/emission-factors/uba-fill/route.test.ts`

**Naming convention:**
```
POST_ubaFill_withUnknownYear_returns400WithoutWriting
```

---

### TC-11: GET /api/emission-factors — returns factors for specified year, sorted by scope then key

**Type:** Integration (API route `src/app/api/emission-factors/route.ts`)

**Description:**
Verifies that `GET /api/emission-factors?year=2024` returns only factors for `validYear = 2024`, sorted scope-first then by key.

**Preconditions:**
- Prisma `emissionFactor.findMany` mocked to return 3 factors for 2024 and (conceptually) 3 for 2023.

**Test Steps:**
1. Send `GET /api/emission-factors?year=2024`.
2. Assert response status.
3. Assert returned array contains only 2024 factors.
4. Assert sort order: SCOPE1 before SCOPE2 before SCOPE3, alphabetically within each scope.

**Expected Result:**
- HTTP 200.
- All returned factors have `validYear = 2024`.
- Factors are sorted by `scope` then `key`.

**Test File:** `src/app/api/emission-factors/route.test.ts`

**Naming convention:**
```
GET_emissionFactors_withYearParam_returnsOnlyThatYearSorted
```

---

### TC-12: GET /api/emission-factors/years — returns DB years and UBA reference years

**Type:** Integration (API route `src/app/api/emission-factors/years/route.ts`)

**Description:**
Verifies that the `/years` endpoint returns both years present in the DB and years available in `UBA_REFERENCE_DATA`.

**Preconditions:**
- Prisma `emissionFactor.findMany` returns factors with `validYear` values `[2023, 2024]`.
- `UBA_REFERENCE_DATA` contains 2023 and 2024.

**Test Steps:**
1. Send `GET /api/emission-factors/years`.
2. Assert the response body.

**Expected Result:**
- HTTP 200.
- `{ "dbYears": [2023, 2024], "ubaReferenceYears": [2023, 2024] }`.

**Test File:** `src/app/api/emission-factors/years/route.test.ts`

**Naming convention:**
```
GET_emissionFactorYears_returnsDbAndUbaReferenceYears
```

---

### TC-13: GET /api/methodology — returns MethodologyData for a valid yearId

**Type:** Integration (API route `src/app/api/methodology/route.ts`)

**Description:**
Verifies that `GET /api/methodology?yearId=1` returns a complete `MethodologyData` object with the correct structure.

**Preconditions:**
- Prisma mocked with factors, entries, and profile for yearId 1.

**Test Steps:**
1. Send `GET /api/methodology?yearId=1`.
2. Assert HTTP 200 and the response body shape.

**Expected Result:**
- HTTP 200.
- Response body contains all `MethodologyData` fields: `standard`, `factorSourceLabel`, `factorYear`, `includedScopes`, `inputMethodCounts`, `assumptions`, `exclusions`, `factors`.

**Test File:** `src/app/api/methodology/route.test.ts`

**Naming convention:**
```
GET_methodology_withValidYearId_returnsMethodologyData
```

---

### TC-14: GET /api/methodology — returns 400 when yearId is missing

**Type:** Integration (API route)

**Description:**
Verifies that a request to `/api/methodology` without the `yearId` query parameter returns HTTP 400.

**Test Steps:**
1. Send `GET /api/methodology` (no query param).
2. Assert HTTP 400.

**Expected Result:**
- HTTP 400 error response.

**Test File:** `src/app/api/methodology/route.test.ts`

**Naming convention:**
```
GET_methodology_withoutYearId_returns400
```

---

### TC-15: UBA reference data module — has data for years 2023 and 2024

**Type:** Unit (`src/lib/uba-reference-data.ts`)

**Description:**
Verifies that `UBA_REFERENCE_DATA` contains entries for at minimum 2023 and 2024, and that `getUbaReferenceYears()` returns a sorted array including both years.

**Test Steps:**
1. Import `UBA_REFERENCE_DATA` and `getUbaReferenceYears` from `src/lib/uba-reference-data.ts`.
2. Assert that `UBA_REFERENCE_DATA[2023]` and `UBA_REFERENCE_DATA[2024]` are non-empty arrays.
3. Assert that `getUbaReferenceYears()` returns an array containing `2023` and `2024`.
4. Assert the result is sorted in ascending order.

**Expected Result:**
- `UBA_REFERENCE_DATA[2023].length > 0`.
- `UBA_REFERENCE_DATA[2024].length > 0`.
- `getUbaReferenceYears()` includes `[2023, 2024]` in sorted order.

**Test File:** `src/lib/__tests__/uba-reference-data.test.ts`

**Naming convention:**
```
UBA_REFERENCE_DATA_containsDataFor2023And2024
getUbaReferenceYears_returnsSortedYears
```

---

### TC-16: UBA reference data module — all factor values are realistic (positive floats, valid units)

**Type:** Unit (`src/lib/uba-reference-data.ts`)

**Description:**
Verifies that all factors in `UBA_REFERENCE_DATA` have `factorKg` values within a realistic range for CO₂ emission factors (between 0.001 and 100 kg CO₂e per unit), a non-empty `unit` string, a non-empty `key`, a non-empty `label`, and a valid `scope` (`SCOPE1`, `SCOPE2`, or `SCOPE3`).

**Preconditions:**
- None; this is a pure data validation test.

**Test Steps:**
1. Iterate all years and all factors in `UBA_REFERENCE_DATA`.
2. For each factor, assert: `factorKg` is a finite number > 0 and < 100, `unit` is non-empty, `key` is non-empty, `label` is non-empty, `scope` is one of `'SCOPE1' | 'SCOPE2' | 'SCOPE3'`.

**Expected Result:**
- All factor assertions pass for all entries across all years.

**Test File:** `src/lib/__tests__/uba-reference-data.test.ts`

**Naming convention:**
```
UBA_REFERENCE_DATA_allFactors_haveRealisticValues
```

---

### TC-17: UBA reference data module — 2023 and 2024 have matching factor keys

**Type:** Unit (`src/lib/uba-reference-data.ts`)

**Description:**
Verifies that the factor keys present in the 2023 dataset also exist in the 2024 dataset (year-to-year continuity check), ensuring that both year sets cover the same emission categories.

**Test Steps:**
1. Extract the set of keys from `UBA_REFERENCE_DATA[2023]`.
2. Extract the set of keys from `UBA_REFERENCE_DATA[2024]`.
3. Assert that every 2023 key is also present in 2024.

**Expected Result:**
- All 2023 keys are present in the 2024 dataset.

**Test File:** `src/lib/__tests__/uba-reference-data.test.ts`

**Naming convention:**
```
UBA_REFERENCE_DATA_2023And2024_haveMatchingFactorKeys
```

---

### TC-18: MethodologySummary component — renders collapsed state with correct headline

**Type:** Unit (React component `src/components/reports/MethodologySummary.tsx`)

**Description:**
Verifies that `<MethodologySummary>` renders in its default collapsed state, showing the one-line summary headline with standard, source label, and scope chips.

**Preconditions:**
- `data` prop provides a `MethodologyData` object with `standard = "GHG Protocol Corporate Standard"`, `factorSourceLabel = "UBA 2024 Emissionsfaktoren"`, `includedScopes = ['SCOPE1', 'SCOPE2', 'SCOPE3']`.

**Test Steps:**
1. Render `<MethodologySummary data={mockData} />` with React Testing Library.
2. Assert the summary headline is visible.
3. Assert expanded content is not visible.

**Expected Result:**
- Headline contains `"Methodik"`.
- Subline contains `"GHG Protocol Corporate Standard"`, `"UBA 2024 Emissionsfaktoren"`, and scope indicators.
- Factor table is not in the document (or is hidden).

**Test File:** `src/components/reports/MethodologySummary.test.tsx`

**Naming convention:**
```
MethodologySummary_defaultState_rendersCollapsedHeadline
```

---

### TC-19: MethodologySummary component — expands on click and shows all content sections

**Type:** Unit (React component)

**Description:**
Verifies that clicking the collapsed block expands it and reveals all six content areas.

**Preconditions:**
- Same `data` prop as TC-18, plus non-empty `assumptions`, `factors`, and `inputMethodCounts`.

**Test Steps:**
1. Render `<MethodologySummary data={mockData} />`.
2. Click the summary header.
3. Assert all six sections are now visible.

**Expected Result:**
- Berechnungsstandard, Emissionsfaktoren, Enthaltene Scopes, Dateneingabe-Methoden sections are visible.
- Annahmen & Ausschlüsse section is visible with the assumptions text.
- Factors table is visible with at least one row.
- "Faktoren verwalten →" link is visible.

**Test File:** `src/components/reports/MethodologySummary.test.tsx`

**Naming convention:**
```
MethodologySummary_onHeaderClick_expandsAndShowsAllSections
```

---

### TC-20: MethodologySummary component — renders amber warning when any factor is custom

**Type:** Unit (React component)

**Description:**
Verifies that when `factorSourceLabel` contains "Benutzerdefiniert", the collapsed headline shows an amber indicator instead of the green UBA indicator.

**Preconditions:**
- `data.factorSourceLabel = "Benutzerdefiniert 2024"`.

**Test Steps:**
1. Render `<MethodologySummary data={mockDataWithCustomFactors} />`.
2. Assert that the headline uses amber styling (check for amber CSS class or aria label).
3. Assert `"Benutzerdefiniert 2024"` text is present in the headline subline.

**Expected Result:**
- Amber icon/color indicator is present in the collapsed headline.
- Text shows `"Benutzerdefiniert 2024"`.

**Test File:** `src/components/reports/MethodologySummary.test.tsx`

**Naming convention:**
```
MethodologySummary_withCustomFactors_showsAmberWarningInHeadline
```

---

### TC-21: MethodologySummary component — shows empty state when data is null

**Type:** Unit (React component)

**Description:**
Verifies the empty/no-data state: when no `methodologyData` is available (null), the block shows a non-clickable "Methodik nicht verfügbar" placeholder.

**Preconditions:**
- `data` prop is `null` or component renders with a null/empty data condition.

**Test Steps:**
1. Render `<MethodologySummary data={null} />` (or however the empty state is triggered).
2. Assert "Methodik nicht verfügbar" text is present.
3. Assert no expand chevron is present (block is not interactive).

**Expected Result:**
- `"Methodik nicht verfügbar"` text is visible.
- Block is not interactive (no cursor-pointer, no toggle).

**Test File:** `src/components/reports/MethodologySummary.test.tsx`

**Naming convention:**
```
MethodologySummary_withNullData_showsEmptyState
```

---

### TC-22: EmissionsfaktorenSettings component — renders year selector and loads factor table

**Type:** Unit (React component `src/components/settings/EmissionsfaktorenSettings.tsx`)

**Description:**
Verifies that the settings section renders a year selector dropdown and, upon selecting a year, fetches and renders the factor table for that year.

**Preconditions:**
- `fetch('/api/emission-factors/years')` mocked to return `{ dbYears: [2024], ubaReferenceYears: [2023, 2024] }`.
- `fetch('/api/emission-factors?year=2024')` mocked to return an array of factors.

**Test Steps:**
1. Render `<EmissionsfaktorenSettings />`.
2. Assert year selector is present.
3. Assert factor table renders after initial year selection.

**Expected Result:**
- Year selector contains `2024` as an option.
- Factor table is populated with the mocked factors.

**Test File:** `src/components/settings/EmissionsfaktorenSettings.test.tsx`

**Naming convention:**
```
EmissionsfaktorenSettings_onLoad_rendersYearSelectorAndFactorTable
```

---

### TC-23: UbaFillButton component — shows confirmation dialog on click

**Type:** Unit (React component `src/components/settings/UbaFillButton.tsx`)

**Description:**
Verifies that clicking "UBA-Werte übernehmen" opens a confirmation dialog and does NOT immediately call the API.

**Preconditions:**
- `selectedYear = 2024`, `isUbaYearAvailable = true`.
- `fetch` is mocked.

**Test Steps:**
1. Render `<UbaFillButton selectedYear={2024} isUbaYearAvailable={true} onSuccess={vi.fn()} />`.
2. Click the "UBA-Werte übernehmen" button.
3. Assert confirmation dialog is visible.
4. Assert `fetch` has NOT been called yet.

**Expected Result:**
- Confirmation dialog appears with the German warning text.
- No API call has been made.

**Test File:** `src/components/settings/UbaFillButton.test.tsx`

**Naming convention:**
```
UbaFillButton_onInitialClick_showsConfirmationDialogWithoutCallingAPI
```

---

### TC-24: UbaFillButton component — calls API and fires onSuccess callback on confirmation

**Type:** Unit (React component)

**Description:**
Verifies that confirming the dialog calls `POST /api/emission-factors/uba-fill` and triggers the `onSuccess` callback.

**Preconditions:**
- `fetch` is mocked to resolve successfully with `{ upsertedCount: 10 }`.
- `onSuccess` spy is provided.

**Test Steps:**
1. Render `<UbaFillButton selectedYear={2024} isUbaYearAvailable={true} onSuccess={onSuccessMock} />`.
2. Click the button.
3. Click "Bestätigen" in the dialog.
4. Await async call.

**Expected Result:**
- `fetch` called once with `POST /api/emission-factors/uba-fill` and body `{ "year": 2024 }`.
- `onSuccess` spy called once after successful response.

**Test File:** `src/components/settings/UbaFillButton.test.tsx`

**Naming convention:**
```
UbaFillButton_onConfirm_callsApiAndFiresOnSuccess
```

---

### TC-25: UbaFillButton component — is disabled when year has no UBA reference data

**Type:** Unit (React component)

**Description:**
Verifies that the button is rendered as `disabled` and has a tooltip when `isUbaYearAvailable = false`.

**Preconditions:**
- `selectedYear = 2025`, `isUbaYearAvailable = false`.

**Test Steps:**
1. Render `<UbaFillButton selectedYear={2025} isUbaYearAvailable={false} onSuccess={vi.fn()} />`.
2. Assert the button element has `disabled` attribute.
3. Assert tooltip text contains `"Keine offiziellen UBA-Werte"`.

**Expected Result:**
- Button is disabled.
- Tooltip indicates no UBA data available for that year.

**Test File:** `src/components/settings/UbaFillButton.test.tsx`

**Naming convention:**
```
UbaFillButton_whenYearNotInUbaReference_isDisabledWithTooltip
```

---

### TC-26: EmissionsfaktorenTable component — marks row as dirty on value change

**Type:** Unit (React component `src/components/settings/EmissionsfaktorenTable.tsx`)

**Description:**
Verifies that editing a factor value inline puts that row into a dirty state (visual highlight), while other rows remain unchanged.

**Preconditions:**
- Two factors loaded. `fetch('/api/emission-factors?year=2024')` mocked to return 2 factors.

**Test Steps:**
1. Render `<EmissionsfaktorenTable year={2024} />`.
2. Find the input for the first factor's `factorKg` value and change it.
3. Assert the first row has the dirty-state visual class.
4. Assert the second row does NOT have the dirty-state class.

**Expected Result:**
- First row receives amber dirty-state styling.
- Second row is unchanged.

**Test File:** `src/components/settings/EmissionsfaktorenTable.test.tsx`

**Naming convention:**
```
EmissionsfaktorenTable_onValueChange_marksRowAsDirty
```

---

### TC-27: EmissionsfaktorenTable component — save calls PUT for each dirty row

**Type:** Unit (React component)

**Description:**
Verifies that clicking "Speichern" sends a `PUT` request for each dirty row and clears dirty state on success.

**Preconditions:**
- Two factors loaded; one has been changed.
- `fetch` mocked to succeed on `PUT /api/emission-factors/1`.

**Test Steps:**
1. Render the component, change one factor value.
2. Click "Speichern".
3. Await.

**Expected Result:**
- `fetch` called once for the changed factor (`PUT /api/emission-factors/{id}`).
- `fetch` NOT called for the unchanged factor.
- Dirty state is cleared after successful save.

**Test File:** `src/components/settings/EmissionsfaktorenTable.test.tsx`

**Naming convention:**
```
EmissionsfaktorenTable_onSave_callsPutOnlyForDirtyRows
EmissionsfaktorenTable_afterSuccessfulSave_clearsDirtyState
```

---

## Test Data Requirements

No new test data files are required. All tests use inline mock data or Prisma mocks consistent with the patterns established in `src/lib/__tests__/factors.test.ts` and `src/lib/__tests__/emissions.test.ts`.

Test fixtures (inline, in test files):
- `mockMethodologyData` — a `MethodologyData` object with UBA factors, 3 scopes, mixed input methods, and assumptions text.
- `mockMethodologyDataCustomFactors` — same as above but with `factorSourceLabel = "Benutzerdefiniert 2024"` and at least one factor with `source = "Benutzerdefiniert 2024"`.
- `mockEmissionFactors2024` — an array of 3–5 `EmissionFactor` records for 2024 covering SCOPE1, SCOPE2, SCOPE3.

---

## Edge Cases

| Scenario | Expected Behavior | Test Case |
|----------|-------------------|-----------|
| Year has no emission factors | `getMethodologyData` returns empty arrays; no error thrown | TC-03 |
| Year has no emission entries | `includedScopes = []`; `inputMethodCounts = {0,0,0}` | TC-03 |
| Single factor is custom-overridden | Entire year's label is "Benutzerdefiniert {year}" | TC-05 |
| Scope has only zero-quantity entries | Scope excluded from `includedScopes` | TC-06 |
| Auto-fill requested for unsupported year | API returns 400; no DB writes | TC-10 |
| UBA-Werte button clicked for year without reference data | Button is disabled with tooltip | TC-25 |
| User edits factor value then navigates away without saving | Unsaved changes are lost (no persistence without explicit save) | TC-26 |
| Company profile has no `reportingBoundaryNotes` | Methodology block shows fallback: "Keine besonderen Annahmen dokumentiert." | TC-01 (assertions on null assumptions) |
| `factorKg` payload with a non-numeric value in PUT | API returns 400 validation error | TC-07 variant |
| Factor label DB field is null | Falls back to `FACTOR_LABELS` static map for German display label | TC-01 |

---

## Non-Functional Tests

### Data integrity
- `UBA_REFERENCE_DATA` must be a compile-time TypeScript constant — type-checking via `tsc --noEmit` verifies the shape without a test.
- All API endpoints validate inputs using standard Next.js request parsing; invalid input types caught by TypeScript at build time.

### Performance
- `getMethodologyData` adds ~3 DB queries to the report generation path. Given < 30 factors and < 100 entries, no performance regression is expected. No explicit performance test is required; the existing 3-second PDF SLA is tracked via the integration test in TC-02.

### Bundle
- `uba-reference-data.ts` is a server-only module (`import` only in API routes and server components). It must not be imported in any client component to avoid bundle bloat. This is enforced by the existing Next.js `"use client"` boundary convention, validated at build time (`next build`).

---

## Open Questions

1. **`PUT /api/emission-factors/[id]` validation**: Should negative `factorKg` values be accepted? The architecture states "positive or negative integers allowed — negative factors are valid." The test cases assume non-zero finite numbers are valid. Confirm with the Architect/Developer before finalizing the API validation test.

2. **Report API integration test scope**: TC-02 references the report API including `methodologyData` in the PDF render call. A full integration test for PDF generation (with `@react-pdf/renderer`) would require either a test environment that supports the renderer or a mock. The Developer should decide whether to use a shallow mock (asserting `GHGReport` receives the correct `methodologyData` prop) or a full render test.
