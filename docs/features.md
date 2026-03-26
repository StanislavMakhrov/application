# Features

This file is the global feature index for the project. The **Technical Writer** agent appends a new row for every feature implemented, and the **Code Reviewer** verifies it was updated during review (see [Global Documentation Checks](agents.md#global-documentation-checks)).

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 001 | [Company Settings UI](features/001-company-settings-ui/specification.md) | Centralise company profile (Firmenname/Branche) in Settings; remove duplicate upload button; allow multiple invoices per emission category. | Implemented |
| 003 | [Factor Selection & Display UX](features/003-factor-selection-ux/issue-analysis.md) | Replace hardcoded emission factor hints in wizard screens (2–7) with live DB-driven values via `useFactors` hook and `FactorHint` component; add read-only Emissionsfaktoren and Branchenvergleich tables to Settings page. | Implemented |
<!-- Append new features above this line. Use the NNN from docs/features/NNN-<slug>/. -->
