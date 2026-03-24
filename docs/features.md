# Features

This document describes the features of GrünBilanz from a user perspective.

---

## Overview

GrünBilanz is a B2B web application for CO₂ accounting and ESG reporting for German Handwerksbetriebe (10–100 employees). The app follows the GHG Protocol Corporate Standard and uses official UBA 2024 emission factors. Users enter emission data via a guided wizard and generate GHG Protocol reports and CSRD questionnaires as PDF downloads.

---

## Features

<!-- ──────────────────────────────────────────────
     FEATURE 001
     ────────────────────────────────────────────── -->

### Check Report Conformity

**Status:** 🔲 Planned
**Feature ID:** 001
**Spec:** [docs/features/001-check-report-conformity/specification.md](features/001-check-report-conformity/specification.md)

#### Description

Before a report is downloaded, the application validates that the data satisfies the structural requirements of the GHG Protocol Corporate Standard and the data-quality expectations of CSRD supply-chain questionnaires. Where the data falls short, users are shown clear, actionable guidance.

#### Why

Business owners need confidence that their GHG Protocol report will not be rejected for missing mandatory sections or obvious data errors. The conformity check catches problems before the report is generated, so users can fix issues in the same session.

#### User-Facing Behaviour

- **Pre-report conformity check**: Runs on stored emission data and produces a categorised list of issues (errors, warnings, info notices).
- **ConformityPanel**: Shown before PDF download, summarising issues and indicating whether the report meets minimum GHG Protocol requirements.
- **Double-counting detection**: Warns users in the wizard when both fuel-quantity and distance-based entries exist for the same vehicle category.
- **Missing-category prompts**: Alerts users to emission categories that are likely relevant for their Branche but have not yet been captured.
- **PDF enhancements**: Adds a Datenvollständigkeit table, conformity footer statement, and CSRD Scope 3 completeness section.

#### Related

- Issue: #50 — [Feature]: Check report conformity
- ADR: [docs/adr/001-conformity-check-architecture.md](adr/001-conformity-check-architecture.md)
- Architecture: [docs/features/001-check-report-conformity/architecture.md](features/001-check-report-conformity/architecture.md)

---

## Future Considerations

- _No items yet._
