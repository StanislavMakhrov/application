# Feature: Check Report Conformity

**Feature ID:** 001
**Status:** 🔲 Planned
**Issue:** [Feature]: Check report conformity

---

## Overview

GrünBilanz generates GHG Protocol reports and CSRD questionnaires for German
Handwerksbetriebe. Before a report is downloaded, the application must validate
that the data it contains satisfies the structural requirements of the
**GHG Protocol Corporate Standard** and the data-quality expectations of
**CSRD supply-chain questionnaires**. Where the data falls short, users are
shown clear, actionable guidance—and in some cases automatic corrections are
proposed.

This feature introduces:
1. A **pre-report conformity check** that runs on the stored emission data and
   produces a categorised list of issues (errors, warnings, and info notices).
2. A **ConformityPanel** UI element shown to the user before they download any
   PDF, summarising issues and indicating whether the report meets minimum
   GHG Protocol requirements.
3. **Wizard-level double-counting detection** that warns users when both
   fuel-quantity (litres) and distance-based (km) entries exist for the same
   vehicle category, since including both would overstate Scope 1 emissions.
4. **Missing-category prompts** in the wizard and on the report-trigger button,
   alerting the user to emission categories that are likely relevant for their
   Branche but have not yet been captured.

---

## User Goals

- The business owner wants to hand a GHG Protocol report to a Großkunde or bank
  and be confident it will not be rejected for missing mandatory sections or
  obvious data errors.
- The business owner wants to be told, *before* downloading, whether anything is
  wrong—so they can fix it in the same session rather than discovering the
  problem after the fact.
- The operator/auditor wants the PDF to carry a clear statement about which
  Scope 3 categories were assessed as relevant and which were omitted, in line
  with GHG Protocol disclosure requirements.

---

## Scope

### In Scope

#### GHG Protocol Structural Checks (Errors — block "Konform" status)

| Check ID | Description |
|----------|-------------|
| GHG-01 | **Scope 1 present**: At least one Scope 1 category (`ERDGAS`, `HEIZOEL`, `FLUESSIGGAS`, `DIESEL_FUHRPARK`, `BENZIN_FUHRPARK`, or any `*_KM` vehicle entry) has a confirmed entry with quantity > 0. |
| GHG-02 | **Scope 2 present**: At least one Scope 2 category (`STROM` or `FERNWAERME`) has a confirmed entry with quantity > 0. |
| GHG-03 | **Reporting year is complete**: The reporting year corresponds to a full 12-month calendar year (always true given the current data model; check is that the year value is a 4-digit integer ≥ 2020). |
| GHG-04 | **Company profile complete**: `firmenname`, `standort`, `branche`, and `mitarbeiter` (≥ 1) are all filled in. |
| GHG-05 | **No negative total**: The sum of all scope totals must be ≥ 0 t CO₂e (a net-negative total would indicate a data entry error, not a legitimate offset). |

#### GHG Protocol Disclosure Checks (Warnings — report is still downloadable)

| Check ID | Description |
|----------|-------------|
| GHG-W01 | **Scope 3 assessed**: At least one Scope 3 category is present *or* the user has explicitly acknowledged that Scope 3 is not yet captured (see UX section). |
| GHG-W02 | **Likely-missing categories**: Based on `branche`, certain categories are expected. If none of the expected categories have data, a warning is shown (see Branche → category mapping below). |
| GHG-W03 | **Low data coverage**: Fewer than 50 % of the non-zero-expected categories have data. |
| GHG-W04 | **Unusually low Scope 1** for businesses with vehicles: If `branche` is `KFZ_WERKSTATT`, `BAUGEWERBE`, `SHK`, or `ELEKTROHANDWERK`, and total Scope 1 < 0.5 t CO₂e, a warning is issued. |

#### Double-Counting Detection (Errors at wizard level)

| Check ID | Description |
|----------|-------------|
| DC-01 | **PKW double-count**: Both `BENZIN_FUHRPARK` (litres) and `PKW_BENZIN_KM` (km) have entries for the same year → only one method should be used per vehicle type. Same logic applies to `DIESEL_FUHRPARK` + `PKW_DIESEL_KM` / `TRANSPORTER_KM` / `LKW_KM`. |
| DC-02 | **Truck km overlap**: Both `TRANSPORTER_KM` and `LKW_KM` should not both be populated unless the business actually operates both vehicle types—shown as a soft warning asking the user to confirm. |

#### CSRD Questionnaire Data-Quality Checks (Info notices in CSRD PDF only)

| Check ID | Description |
|----------|-------------|
| CSRD-01 | **Scope 3 Category 1 (materials)**: At least one material entry exists. |
| CSRD-02 | **Scope 3 Category 6 (business travel)**: `GESCHAEFTSREISEN_FLUG` or `GESCHAEFTSREISEN_BAHN` is present, *or* user has acknowledged it is not applicable. |
| CSRD-03 | **Scope 3 Category 7 (commuting)**: `PENDLERVERKEHR` is present, *or* user has acknowledged it is not applicable. |
| CSRD-04 | **Renewable electricity flag**: `STROM` entry exists and `isOekostrom` field is explicitly set (true or false). |

#### PDF Content Corrections (automatic, no user interaction)

| Correction | Description |
|------------|-------------|
| AUTO-01 | **Data-quality section in GHG PDF**: The report already includes a methodology section. This feature adds a machine-generated **"Datenvollständigkeit"** table listing each expected category, its status (✓ Erfasst / — Nicht erfasst / ⚠ Ausgelassen), and the input method (Manuell / OCR / CSV). |
| AUTO-02 | **Conformity statement in GHG PDF**: A footer line is added: "Dieser Bericht wurde gemäß GHG Protocol Corporate Standard erstellt. Alle Scope-1- und Scope-2-Emissionen sind enthalten." or the corresponding non-conformant variant. |
| AUTO-03 | **CSRD questionnaire Scope 3 completeness**: The CSRD PDF gains an explicit row for each of Categories 1, 6, 7, 11 stating whether data was captured. |

### Branche → Expected Categories Mapping (for GHG-W02)

| Branche | Expected Scope 1 categories | Expected Scope 3 categories |
|---------|-----------------------------|-----------------------------|
| ELEKTROHANDWERK | `DIESEL_FUHRPARK` or `TRANSPORTER_KM` | `PENDLERVERKEHR`, materials |
| SHK | `DIESEL_FUHRPARK` or `TRANSPORTER_KM` | `PENDLERVERKEHR`, materials |
| BAUGEWERBE | `DIESEL_FUHRPARK` or `LKW_KM` | `PENDLERVERKEHR`, materials, `ABFALL_BAUSCHUTT` |
| TISCHLER | `ERDGAS` or `HEIZOEL` | materials |
| KFZ_WERKSTATT | `DIESEL_FUHRPARK` | materials, `ABFALL_ALTMETALL` |
| MALER | `DIESEL_FUHRPARK` or `TRANSPORTER_KM` | `PENDLERVERKEHR`, materials |
| SONSTIGES | `STROM` | — |

### Out of Scope

- **Full CSRD compliance**: The Corporate Sustainability Reporting Directive in its
  full form applies to companies with > 250 employees. GrünBilanz targets
  10–100-employee businesses. This feature implements the *data-quality checks
  relevant to supply-chain CSRD questionnaires* only—not full CSRD assurance.
- **BEHG (national carbon pricing)** compliance checking: Out of scope; the
  application does not handle carbon price payments or allowance calculations.
- **External audit trail / third-party verification**: No integration with
  external audit services.
- **Automatic data correction**: The feature warns and suggests; it never silently
  modifies confirmed emission entries.
- **Historical year conformity backfill**: Conformity checks apply to the currently
  selected reporting year only.
- **EU Taxonomy checks**: Out of scope for this feature.

---

## User Experience

### 1. Wizard — Double-Counting Warning (DC-01, DC-02)

**Where:** Screen 3 (Fuhrpark).

**Trigger:** When the user saves (or leaves focus on) a km-based field while a
corresponding fuel-quantity entry already exists for the same year (or vice
versa).

**Appearance:** Inline amber `PlausibilityWarning` (reuses existing component):

> ⚠ Sie haben sowohl Kraftstoffmengen (Liter) als auch Kilometer für Diesel-Fahrzeuge erfasst. Das würde zu einer Doppelzählung führen. Bitte verwenden Sie nur **eine** Methode pro Fahrzeugart.

The warning is non-blocking: the user can proceed, but the warning persists until
one of the conflicting entries is removed.

### 2. Wizard — Missing-Category Prompt (GHG-W02)

**Where:** Each relevant wizard screen, below the existing form fields.

**Trigger:** On first visit to the screen for a new reporting year, when the
branche-to-category mapping indicates a category is expected but not yet entered.

**Appearance:** Light-blue info box (new `InfoNotice` component, not amber):

> ℹ Für eine vollständige GHG-Protokoll-Bilanz werden für Elektrohandwerksbetriebe typischerweise **Transporter-Kilometer** erfasst. Falls zutreffend, tragen Sie die Jahreskilometer ein.

The notice is dismissible per screen per year (stored in `localStorage`).

### 3. Dashboard — Conformity Badge

**Where:** On the Dashboard, next to each reporting year's "Bericht erstellen"
button.

**States:**

| Badge | Meaning |
|-------|---------|
| 🟢 **GHG-konform** | All GHG-01 – GHG-05 checks pass, no warnings. |
| 🟡 **Hinweise vorhanden** | All error checks pass; one or more warnings exist. |
| 🔴 **Nicht konform** | One or more error checks fail. |

Clicking the badge opens the ConformityPanel (see below).

### 4. ConformityPanel — Pre-Download Summary

**Where:** Modal/drawer triggered by the conformity badge or by clicking
"Bericht erstellen" when the badge is 🟡 or 🔴.

**Content:**

- Heading: "Konformitätsprüfung für [Year]"
- Three collapsible sections: **Fehler** (red), **Warnungen** (amber),
  **Hinweise** (blue).
- Each issue shows:
  - Check ID (e.g. GHG-01)
  - Human-readable description in German
  - A direct link to the relevant wizard screen to fix it
- Footer: Primary button **"Trotzdem herunterladen"** (always available) +
  secondary button **"Zur Bearbeitung"** (navigates to first error's screen).
- If all checks pass: show a green confirmation message and offer only the
  download button.

**Behaviour on report generation:**
- If errors exist and user clicks "Bericht erstellen" (not via the panel), the
  ConformityPanel opens automatically instead of triggering the download.
- If only warnings/info exist, the download proceeds but the ConformityPanel is
  shown briefly (3-second dismissible toast with a "Details" link).

### 5. PDF Changes (AUTO-01 – AUTO-03)

**GHG Report — Datenvollständigkeit table** (new section after Methodology):

```
Datenvollständigkeit
──────────────────────────────────────────────────────────
Kategorie               Scope  Status          Eingabe
──────────────────────────────────────────────────────────
Erdgas                  1      ✓ Erfasst       OCR
Heizöl                  1      — Nicht erfasst —
Diesel Fuhrpark         1      ✓ Erfasst       CSV
Strom                   2      ✓ Erfasst       Manuell
Fernwärme               2      — Nicht erfasst —
Geschäftsreisen Flug    3      — Nicht erfasst —
Pendlerverkehr          3      ✓ Erfasst       Manuell
Materialien             3      ✓ Erfasst       Manuell
...
──────────────────────────────────────────────────────────
```

**GHG Report — Conformity footer statement** (page 1 footer area):

- Conformant: *"Dieser Bericht wurde gemäß GHG Protocol Corporate Standard erstellt (Scope 1 & 2 vollständig, Scope 3 teilweise)."*
- Non-conformant: *"Hinweis: Scope-2-Daten fehlen. Dieser Bericht erfüllt die Mindestanforderungen des GHG Protocol nicht vollständig."*

**CSRD Questionnaire — Scope 3 Completeness section** (section 2b):

```
Scope 3 – Erfassungsgrad
Kategorie 1  (eingekaufte Materialien):    ✓ Erfasst
Kategorie 6  (Geschäftsreisen):           — Nicht erfasst
Kategorie 7  (Pendlerverkehr):            ✓ Erfasst
Kategorie 11 (eingesetzte Produkte):      — Nicht relevant (Dienstleister)
```

---

## Success Criteria

- [ ] **SC-01** — When a report year has no Scope 1 entries, the dashboard badge
      shows 🔴 and the ConformityPanel lists check GHG-01 as an error.
- [ ] **SC-02** — When a report year has no Scope 2 entries, the dashboard badge
      shows 🔴 and the ConformityPanel lists check GHG-02 as an error.
- [ ] **SC-03** — Clicking "Bericht erstellen" when error checks fail opens the
      ConformityPanel instead of generating the PDF directly.
- [ ] **SC-04** — The user can still download the PDF by clicking "Trotzdem
      herunterladen" in the ConformityPanel (conformity check is advisory, never
      a hard block on download).
- [ ] **SC-05** — When both `DIESEL_FUHRPARK` (litres) and `PKW_DIESEL_KM` (km)
      entries exist for the same year, the Fuhrpark wizard screen shows the
      double-counting amber warning.
- [ ] **SC-06** — The generated GHG Protocol PDF includes a "Datenvollständigkeit"
      table listing every emission category with its status (Erfasst / Nicht
      erfasst) and input method.
- [ ] **SC-07** — The generated GHG Protocol PDF includes a conformity footer
      statement indicating whether Scope 1 and Scope 2 are complete.
- [ ] **SC-08** — The generated CSRD questionnaire PDF includes a Scope 3
      completeness section listing Categories 1, 6, 7, and 11.
- [ ] **SC-09** — A report year with all GHG-01 – GHG-05 checks passing and no
      warnings shows badge 🟢 without opening any panel on download.
- [ ] **SC-10** — The branche-specific missing-category info notice appears on the
      relevant wizard screen on first visit and is dismissible.
- [ ] **SC-11** — All UI text is in German.
- [ ] **SC-12** — PDF generation time remains < 3 seconds after adding the new
      sections (matching existing performance requirement).

---

## Open Questions

1. ✅ **Scope 3 acknowledgement UX** *(Resolved by Architect — ADR-001)*: `scope3Acknowledged`
   is stored as a boolean field on `ReportingYear` in the database. The UX is a
   checkbox in the ConformityPanel warning for GHG-W01, not a dismiss-only action.
   A new `acknowledgeScope3(yearId)` Server Action writes the flag to the DB.

2. ✅ **Double-count resolution** *(Resolved by Architect — ADR-001)*: Navigation only —
   no one-click entry removal. The amber `PlausibilityWarning` persists on Screen 3
   until the user manually removes the conflicting entry. This is consistent with
   the principle "the feature warns and suggests; it never silently modifies confirmed
   emission entries."

3. ✅ **Conformity check API** *(Resolved by Architect — ADR-001)*: A dedicated
   `GET /api/conformity?yearId=N` route is used. The conformity engine
   (`src/lib/conformity.ts`) is a pure synchronous function; both the API route and
   the Dashboard Server Component call it directly. Report generation is not
   gated by conformity results.

4. ✅ **Persistence of dismissed notices** *(Confirmed acceptable)*: `localStorage`
   is used for per-screen per-year dismissal of `InfoNotice` prompts, keyed as
   `${dismissKey}-${year}`. This is acceptable for the current single-tenant
   architecture. Migration to DB is deferred.
