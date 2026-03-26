# Feature: Add Methodology Summary to Every Generated Report

## Overview

Every generated GHG Protocol PDF report should include a comprehensive, structured **methodology summary** block that makes explicit which standard, emission factors, scopes, data quality indicators, and assumptions were used in the calculations. Currently the report contains only a minimal static paragraph citing UBA 2024, which is insufficient for auditors, banks, and Großkunden who need to verify the calculation basis without access to the underlying application.

The methodology block must be generated automatically by the backend at report-generation time and rendered in both the PDF output and — where visible — the UI.

---

## User Goals

- **Betriebsinhaber (Business Owner)**: Wants to hand a PDF to a bank or Großkunde that is fully self-explanatory, without the recipient needing to log in or ask follow-up questions about how the numbers were computed.
- **Großkunde / Bank / Auditor (Report Recipient)**: Needs to verify, in the PDF alone, which standard governs the report, which emission factors were applied, what the data sources were, and whether any values were estimated or derived from uploaded documents.
- **Betriebsinhaber (auditability)**: Wants to look back at any generated report and understand exactly which factor version was in use at the time, because factors may change between reporting years.

---

## Scope

### In Scope

1. **Calculation standard declaration**
   - The methodology block states the governing standard used (GHG Protocol Corporate Standard).

2. **Emission factor table**
   - For each emission category present in the report, the methodology block lists:
     - Category / Scope
     - Factor key (e.g. `ERDGAS`, `STROM`)
     - Factor value (kg CO₂e per unit)
     - Unit (e.g. `kWh`, `m³`, `kg`, `km`)
     - Factor source (e.g. `UBA Datenbericht 2024`)
     - Factor valid year

3. **Scopes included**
   - An explicit statement of which scopes (Scope 1, Scope 2, Scope 3) are included in the report, and which (if any) are absent with a reason.

4. **Data quality indicators**
   - Each emission category in the methodology block is annotated with how its input value was obtained:
     - `Manuell` — value entered by hand
     - `OCR (Rechnung)` — value extracted from an uploaded invoice via OCR and confirmed by user
     - `CSV-Import` — value imported from a DATEV / CSV file
   - If a category has no entry (not recorded), it is marked as `Nicht erfasst`.

5. **Assumptions used in calculation**
   - The user-entered reporting boundary notes and exclusion/assumption text (currently stored in `CompanyProfile.reportingBoundaryNotes` and `CompanyProfile.exclusions`) are prominently included in the methodology block.
   - Any system-level default assumptions (e.g. "Pendlerverkehr: 220 working days assumed") that apply to specific categories are listed.

6. **Backend assembly of methodology data**
   - The backend assembles methodology data automatically at report-generation time from:
     - Existing `EmissionFactor` records in the database (keyed by category and `validYear`)
     - `EmissionEntry.inputMethod` for each recorded entry
     - `CompanyProfile.reportingBoundaryNotes` and `CompanyProfile.exclusions`
   - No additional manual data entry is required from the user.

7. **PDF rendering**
   - The methodology block is rendered as a dedicated section in the GHG Protocol PDF report (page 2 or a new final page), replacing or substantially expanding the current minimal "Methodik" paragraph.

8. **Scope of application**
   - This feature applies to the **GHG Protocol** report type only.
   - The CSRD Questionnaire report type is out of scope for this feature.

### Out of Scope

- UI screen or modal showing the methodology summary (the PDF is the primary deliverable; a UI preview is optional and deferred).
- Changes to the CSRD Questionnaire report.
- Allowing users to manually override or edit which emission factors are cited in the methodology block.
- Storing a snapshot of the methodology block as a separate database record.
- Support for multiple factor sources or factor databases beyond UBA 2024.
- Any changes to how emission factors are calculated or stored.

---

## User Experience

### PDF Report — Methodology Section

The GHG Protocol PDF gains an expanded **"Methodik & Datenqualität"** section. It contains:

#### 1. Standard & Scope Coverage
A short header paragraph:
> *Diese CO₂-Bilanz wurde nach dem **GHG Protocol Corporate Standard** erstellt und umfasst **Scope 1**, **Scope 2** und **Scope 3** (Kategorie 1: Eingekaufte Materialien, Pendlerverkehr, Dienstreisen, Abfall). Fehlende Kategorien sind als „Nicht erfasst" gekennzeichnet.*

#### 2. Emission Factor Table
A table listing every factor that was applied in the calculations:

| Kategorie | Scope | Emissionsfaktor | Einheit | Quelle | Jahr |
|-----------|-------|----------------|---------|--------|------|
| Erdgas | Scope 1 | 2.020 kg CO₂e | / m³ | UBA 2024 | 2024 |
| Diesel Fuhrpark | Scope 1 | 2.650 kg CO₂e | / L | UBA 2024 | 2024 |
| Strom | Scope 2 | 0.434 kg CO₂e | / kWh | UBA 2024 | 2024 |
| … | … | … | … | … | … |

Only factors for categories that have a recorded entry in the report are shown (categories with `Nicht erfasst` are omitted from the factor table).

#### 3. Data Quality Indicators
A compact table showing how each recorded value was entered:

| Kategorie | Eingabemethode |
|-----------|---------------|
| Erdgas | OCR (Rechnung) |
| Diesel Fuhrpark | CSV-Import |
| Strom | Manuell |
| … | … |

#### 4. Assumptions & Reporting Boundaries
The user-entered boundary notes and exclusions from the company profile are displayed here (identical content to the existing "Berichtsgrenzen" section, but also repeated in/near the Methodology section for completeness). If no notes have been entered, a placeholder text is shown: *"Keine benutzerdefinierten Annahmen eingetragen."*

### Error Handling

- If an emission factor cannot be found for a given category and year, the factor table row shows `–` for the factor value and `Faktor nicht gefunden` as source, rather than silently omitting the row.
- Report generation must not fail if methodology data is partially unavailable; the methodology block degrades gracefully with `–` placeholders.

---

## Success Criteria

- [ ] The generated GHG Protocol PDF contains a "Methodik & Datenqualität" section on page 2 (or a dedicated final page).
- [ ] The methodology section states the GHG Protocol Corporate Standard as the governing standard.
- [ ] The methodology section includes an emission factor table listing factor value, unit, source name, and valid year for every category that has a recorded emission entry.
- [ ] The methodology section includes a data quality table showing the input method (`MANUAL`, `OCR`, `CSV`) for every recorded category.
- [ ] The methodology section displays the user's reporting boundary notes and exclusion/assumption text from the company profile.
- [ ] The methodology data is assembled automatically by the backend at report-generation time — no additional user input is required.
- [ ] The CSRD Questionnaire report is unchanged.
- [ ] Report generation time remains below 3 seconds (existing performance requirement).
- [ ] If an emission factor is not found in the database, the PDF renders gracefully with a `–` placeholder rather than failing.

---

## Open Questions

1. **Factor table scope**: Should the methodology factor table include categories with `Nicht erfasst` (no entry) to give auditors full visibility, or only categories with actual entries? (Current recommendation: only categories with entries — keeps the table concise and relevant.)
2. **Page layout**: Should the expanded methodology section replace the current page 2 content, or be added as a new page 3? This depends on the volume of entries and will require layout testing.
3. **UI summary panel**: Should a read-only methodology summary panel also appear in the application UI (e.g., on the dashboard or report generation screen) before the user downloads the PDF? This is deferred but could be a follow-on feature.
