# Feature: Methodology Summary Block in Reports & UBA Parameter Management

## Overview

Every GrünBilanz report (PDF and UI) must include a clearly visible **Methodology Summary** block that states which calculation standard was applied, which emission factors were used, their source and version, which scopes were included, whether values are exact, estimated, or OCR-derived, and any assumptions embedded in the calculation. This block must be assembled automatically from existing data at report-generation time.

Additionally, the application must provide a way for users to **manage UBA (Umweltbundesamt) emission factors** per reporting year — including the ability to auto-fill official UBA values for a given year — because manually entering all factor values by hand is not an acceptable workflow for users.

---

## User Goals

- **Traceability without extra work**: A user or external auditor can open a generated report and immediately see the complete methodology — which standard, which factors, which scopes, and which assumptions were used — without needing to look anything up elsewhere.
- **Audit-ready reporting**: The methodology block makes each report self-contained and defensible for internal or external audits (e.g., CSRD, GHG Protocol reviews).
- **Up-to-date factors without manual effort**: When a new reporting year starts, the user can apply the current official UBA emission factors in a single action rather than entering dozens of factor values by hand.
- **Year-specific factor sets**: Each reporting year can have its own set of UBA factors, reflecting the official annual UBA updates. Changes to one year's factors do not affect other years.
- **Transparency for estimated and OCR-derived values**: The report makes it explicit when a value was extracted from an uploaded invoice (OCR) or entered manually, so the reliability of each data point is clear.

---

## Scope

### In Scope

1. **Methodology block in PDF reports**
   - Appears in every generated PDF (GHG Protocol and CSRD Questionnaire report types).
   - Contains: applied standard, emission factor source + version/year, scopes included, input-method breakdown (manual / OCR / CSV), any user-entered assumptions (from `reportingBoundaryNotes` and `exclusions` fields).

2. **Methodology block in the UI (report preview / dashboard)**
   - The same methodology information is visible in the web UI before or after generating the PDF, so users can review it without downloading the PDF.

3. **UBA parameter management page / section**
   - A dedicated area in the Settings page (or a linked admin page accessible from Settings) where the user can view, edit, and manage emission factors by reporting year.
   - The factor table shows: factor key (category name in German), value (kg CO₂e per unit), unit, scope, and the source label (e.g. "UBA 2024").

4. **Auto-fill UBA official values**
   - For each known reporting year, the application ships the official UBA factor values as built-in reference data.
   - The user can trigger an **"UBA-Werte übernehmen"** action for a selected year, which populates (or updates) the factor table with the official values for that year in a single click.
   - The user may override individual factor values after auto-filling; custom overrides are stored alongside the source label so auditors can see which factors were modified.

5. **Year-specific factor versioning**
   - Factors are associated with a `validYear` (already supported in the `EmissionFactor` model via the `key + validYear` unique constraint).
   - The UI makes it clear which year each factor set belongs to.
   - Adding or updating factors for year Y does not affect factor sets for other years.

6. **Factor source label in methodology block**
   - The methodology block in both PDF and UI shows the exact source label and year of each factor set used (e.g., "UBA 2024 Emissionsfaktoren", "UBA 2023 Emissionsfaktoren", or "Benutzerdefiniert 2024" if any factors were manually overridden).

### Out of Scope

- Automatic download or API integration with UBA's online publications (the built-in reference data is bundled in the application, not fetched from an external service).
- Multi-language support — all UI labels and the methodology block text remain in German.
- Methodology summaries for individual emission categories (only a report-level summary is in scope).
- Audit-log changes to the factor values themselves (nice-to-have, deferred).
- PDF digital signatures or certified document stamps.
- Changes to the core calculation engine (`src/lib/emissions.ts`, `src/lib/factors.ts`) — only data management and display are in scope.

---

## Explicit Constraints

<!-- Things that MUST NOT happen. These pass through the pipeline unchanged to all downstream agents.
     Every downstream agent (Architect, QE, Task Planner, Developer, Code Reviewer) MUST propagate
     this section verbatim — do NOT summarize, abstract, or reword these constraints. -->

- "to fill everything manually by user will be overkill" — manual-only UBA data entry is NOT acceptable; the UI MUST provide an automated way to populate official UBA values.
- Users must be able to automatically fill UBA official values (i.e., a one-click "auto-fill" action per year that loads the official UBA factor set).
- Every year has its own UBA values (year-specific UBA parameters); factors for one reporting year MUST NOT silently overwrite or be confused with factors for another year.

---

## User Experience

### Methodology Block in the PDF

The PDF report gains a dedicated **"Methodik"** section (already partially present as plain text in the current `GHGReport.tsx`). The enriched block replaces the current static text and includes:

| Field | Content |
|-------|---------|
| Berechnungsstandard | "GHG Protocol Corporate Standard" (or "CSRD-Fragebogen") |
| Emissionsfaktoren | Source label + year, e.g. "UBA 2024 Emissionsfaktoren" |
| Enthaltene Scopes | "Scope 1, Scope 2, Scope 3" (lists only the scopes that have at least one entry with a non-zero value) |
| Dateneingabe-Methoden | Summary of input methods used, e.g. "12 manuelle Einträge, 3 per OCR-Beleg, 0 per CSV" |
| Annahmen & Ausschlüsse | Content of `reportingBoundaryNotes` and `exclusions` from the company profile; or "Keine besonderen Annahmen dokumentiert." if empty |
| Faktoren-Tabelle | Per-category table showing: category name, factor key, factor value (kg CO₂e/unit), unit, scope |

### Methodology Block in the UI

On the Dashboard (year card) or on a report detail view, a collapsible **"Methodik anzeigen"** section shows the same information as in the PDF. The user can expand it to review the methodology before downloading the PDF.

**States:**
- **Collapsed** (default): shows headline "Methodik: GHG Protocol · UBA 2024 · Scope 1/2/3"
- **Expanded**: shows the full breakdown table and assumptions text

### UBA Parameter Management

In the **Settings page**, a new **"Emissionsfaktoren"** section provides:

1. **Year selector** — a dropdown or tab bar listing all reporting years that have factor data, plus a prompt to add a new year.
2. **Factor table** — for the selected year, shows all factors with editable value cells (factor key, German label, factor value, unit, scope, source).
3. **"UBA-Werte übernehmen" button** — triggers the auto-fill action for the selected year:
   - A confirmation dialog warns: "Dies überschreibt alle bestehenden Faktoren für [Jahr] mit den offiziellen UBA-Werten. Manuelle Änderungen gehen verloren."
   - On confirmation, the official factor values for the selected year are applied.
   - On success, a toast notification confirms: "UBA [Jahr] Faktoren wurden erfolgreich übernommen."
4. **Manual override** — individual factor values can be edited inline. When a value differs from the official UBA default, its source label changes from "UBA [Jahr]" to "Benutzerdefiniert [Jahr]" so the deviation is visible.
5. **Save button** — saves all pending edits. Unsaved changes are indicated visually (e.g., dirty-state row highlight).

**Error states:**
- If no built-in UBA data exists for the selected year, the auto-fill button is disabled with a tooltip: "Keine offiziellen UBA-Werte für dieses Jahr verfügbar."
- If saving fails, an inline error is shown without discarding the user's edits.

---

## Success Criteria

- [ ] Every generated GHG Protocol PDF report includes a "Methodik" section that names the calculation standard, the emission factor source + year, the included scopes, a breakdown of input methods (manual / OCR / CSV count), and the reporting boundary assumptions.
- [ ] Every generated CSRD Questionnaire PDF report includes an equivalent methodology summary.
- [ ] The methodology block in the PDF is assembled automatically at report-generation time from live database data (factor records, entry input methods, company profile) — no static hardcoded text.
- [ ] The UI (Dashboard or report detail) shows the same methodology information in a collapsible section without requiring the user to download the PDF.
- [ ] The Settings page includes an "Emissionsfaktoren" section where the user can view emission factors grouped by reporting year.
- [ ] The user can trigger a one-click "UBA-Werte übernehmen" action for a selected year that populates the factor table with the official UBA values for that year.
- [ ] After auto-filling, the factor values displayed in the table match the official UBA values for the selected year.
- [ ] Factors for one reporting year are independent of factors for other years; updating year Y's factors does not change year Z's factors.
- [ ] Individual factor values can be manually overridden after auto-filling; overridden values are visually distinguished from official UBA values (e.g., different source label).
- [ ] A confirmation dialog is shown before the auto-fill action overwrites existing factors.
- [ ] The methodology block's factor source label reflects whether official or custom (overridden) factor values were used.
- [ ] All UI text is in German, consistent with the existing application.
- [ ] The feature does not require external network calls to UBA's website; all built-in reference data is bundled in the application.

---

## Open Questions

1. **Built-in UBA reference data coverage**: For which years should the application ship built-in UBA factor sets? At minimum 2023 and 2024 are needed to cover current demo data. The Architect should define how future year data is added (e.g., a seed script update, a JSON config file, or a migration).

2. **Methodology block placement in CSRD PDF**: The current `CSRDQuestionnaire` component is a separate document type. Should the methodology block appear as a dedicated section in the CSRD PDF, or as an appendix page? To be confirmed with the Maintainer or Architect.

3. **Factor-level input-method tracking**: The current `EmissionEntry` model has an `inputMethod` field (MANUAL / OCR / CSV) per entry. The methodology block's "input methods" summary counts entries by method. This is sufficient for the report summary. If per-factor traceability (which factor was used for which OCR-extracted entry) is needed, that would require a schema change — deferred unless explicitly requested.

4. **Scope inclusion logic**: The "Enthaltene Scopes" field should list only scopes with at least one non-zero entry. If a user has no Scope 3 data at all, Scope 3 should be omitted from the methodology. The Architect should confirm this edge-case rule.

5. **Custom factor label convention**: When a user overrides a factor value, should the source become "Benutzerdefiniert [Jahr]" for that single factor, or should the entire factor set be labelled as "Benutzerdefiniert" once any single factor is changed? This affects the methodology block's source label in the PDF.
