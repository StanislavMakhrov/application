# Features

This document describes the features of GrünBilanz from a user perspective.

---

## Overview

GrünBilanz is a web application that helps German Handwerksbetriebe (craft businesses) calculate, manage, and report their greenhouse gas (GHG) emissions. It is designed for small-to-medium businesses (10–100 employees) who need to comply with GHG Protocol Corporate Standard requirements and supply CSRD questionnaire data to Großkunden or banks. The application is deployed as a self-hosted Docker image.

---

## Features

<!-- ──────────────────────────────────────────────
     FEATURE 001
     ────────────────────────────────────────────── -->

### Check Report Conformity

**Status:** ✅ Implemented
**Feature ID:** `001`
**Spec:** [`docs/features/001-check-report-conformity/specification.md`](features/001-check-report-conformity/specification.md)

#### Description

Before a PDF report is downloaded, GrünBilanz validates the stored emission data against the structural requirements of the **GHG Protocol Corporate Standard** and the data-quality expectations of **CSRD supply-chain questionnaires**. Where the data falls short, users are shown clear, actionable guidance directly on the dashboard and in the wizard.

#### Why

Business owners who hand GHG Protocol reports to Großkunden or banks need confidence that their reports will not be rejected for missing mandatory sections or obvious data errors. This feature surfaces issues *before* the download so they can be fixed in the same session.

#### User-Facing Behaviour

- **`Conformity Badge`**: A colored badge (🟢 / 🟡 / 🔴) is shown next to each reporting year's download button on the Dashboard, giving an at-a-glance view of compliance status.
- **`ConformityPanel`**: Clicking the badge (or triggering a download when errors exist) opens a modal that lists all errors, warnings, and info notices for the selected year. Each issue includes a direct link to the relevant wizard screen. The user can always download the report ("Trotzdem herunterladen"), as the check is advisory.
- **`Double-Counting Warning`**: On the Fuhrpark (vehicles) wizard screen, an amber warning appears when both fuel-quantity (litres) and distance-based (km) entries exist for the same vehicle category in the same year.
- **`Missing-Category Prompts`**: On relevant wizard screens, a blue info notice alerts the user to emission categories that are likely relevant for their Branche but have not yet been captured. The notice is dismissible per screen per year.
- **`PDF Enrichment`**: Generated GHG Protocol PDFs include a *Datenvollständigkeit* (data completeness) table and a conformity footer statement. CSRD questionnaire PDFs include a Scope 3 completeness section.

#### Usage

The feature is automatic — no configuration is required. It activates as soon as emission data exists for a reporting year. Badge states:

| Badge | Condition |
|-------|-----------|
| 🟢 GHG-konform | All GHG-01 – GHG-05 checks pass, no warnings |
| 🟡 Hinweise vorhanden | All error checks pass; one or more warnings |
| 🔴 Nicht konform | One or more error checks fail |

#### Example Output

Dashboard badge next to a reporting year:

```
2023  [🔴 Nicht konform]  [Bericht erstellen]
```

ConformityPanel (excerpt):

```
Konformitätsprüfung für 2023
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Fehler (1)
  GHG-01 – Keine Scope-1-Emissionen erfasst.
            → Zum Fuhrpark-Assistent

⚠ Warnungen (1)
  GHG-W01 – Scope 3 wurde noch nicht bewertet.
             [Scope 3 nicht relevant] ☐

[Trotzdem herunterladen]  [Zur Bearbeitung]
```

#### Edge Cases & Constraints

- Conformity checks are **advisory only** — they never block a PDF download.
- The feature operates on the **currently selected reporting year** only; no backfill of historical years.
- Double-counting warnings are non-blocking: the user can proceed without removing conflicting entries.
- Dismissed missing-category notices are stored in `localStorage` (per screen, per year) and are not synced across devices.
- Full CSRD compliance (for companies > 250 employees) and BEHG (national carbon pricing) checks are out of scope.

#### Related

- Issue: [`[Feature]: Check report conformity (#50)`](https://github.com/StanislavMakhrov/application/issues/50)
- ADR: [`docs/adr/001-conformity-check-architecture.md`](adr/001-conformity-check-architecture.md)
- Tests: `src/lib/__tests__/`

---

## Future Considerations

- Historical year conformity backfill (apply checks retroactively to all reporting years).
- EU Taxonomy checks.
- Full CSRD assurance reporting for larger organisations.
