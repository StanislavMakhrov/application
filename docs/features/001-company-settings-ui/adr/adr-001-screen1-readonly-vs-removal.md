# ADR-001: Screen 1 (Firmenprofil) — Read-Only Summary vs. Full Removal

## Status

Accepted

## Context

The "Daten erfassen" wizard starts at Screen 1 ("Firmenprofil & Berichtsgrenzen"), which is
the only place users can currently edit company-wide profile data (Firmenname, Branche,
Mitarbeiter, Standort, Berichtsgrenzen, Ausschlüsse). The feature moves this editing
capability to the central "Einstellungen" page.

After the migration the wizard Screen 1 would be a duplicate edit surface. The spec leaves
two options open:

- **Remove** Screen 1 from the wizard entirely.
- **Keep** Screen 1 as a read-only summary with a link to Settings.

The wizard uses URL-based routing (`/wizard/[screen]?year=...`). Screen numbers are
hardcoded: `WizardNav` uses `totalScreens = 7`, and `WizardScreenPage` switches on
`screen` values 1–7. User session narrative in `docs/architecture.md` step 3 reads
"navigates to Screen 1 (Firmenprofil) → confirms or updates company data → clicks Weiter".

## Options Considered

### Option 1: Remove Screen 1 entirely (renumber screens 2–7 → 1–6)

- The wizard would have 6 screens instead of 7.
- `WizardNav.totalScreens` drops to 6; the `switch` in `WizardScreenPage` would handle
  screens 1–6.
- Existing deep-links to `/wizard/2?year=2024` (Heizung) would break and require redirects.
- The user session narrative in `architecture.md` must be updated.
- Pros: Cleaner flow; one fewer screen; wizard is purely about data entry.
- Cons: URL renumbering breaks bookmarks; renaming case 2→1, 3→2, … across 6 screen
  files is mechanical but error-prone; no visual confirmation that company data is set
  before data entry begins.

### Option 2: Keep Screen 1 as a read-only summary (chosen)

- `Screen1Firmenprofil` is refactored into a read-only display of the current profile
  values loaded from the API.
- A prominent info box (e.g., amber callout) reads:
  *"Firmenprofil-Daten können in den Einstellungen geändert werden."*
  with an "Einstellungen öffnen →" link to `/settings`.
- Wizard navigation (`WizardNav`) and URL scheme are unchanged — `/wizard/1` still exists.
- Screens 2–7, WizardNav, WizardScreenPage, and all other wizard files require no changes
  for this decision.
- Pros: Zero URL-scheme churn; preserves the UX pattern of "review company context
  before entering year data"; easy to implement (delete the form, add a read-only layout);
  bookmarks remain valid.
- Cons: One extra screen-click for users already confident in their profile; a "dead"
  screen in the wizard that cannot be acted on directly.

## Decision

**Option 2 — Keep Screen 1 as a read-only summary.**

## Rationale

Renumbering the wizard URLs (Option 1) is a breaking change with no user-facing benefit
that justifies the migration cost. Existing bookmarks, the user session narrative in
`architecture.md`, and the switch statement in `WizardScreenPage` all assume screen 1
exists; changing them introduces mechanical churn that spreads across six files.

Keeping Screen 1 as a read-only review pane aligns with the established UX pattern of
"confirm your company before entering annual data". It makes the read-only state explicit
and directs users to the correct editing location without any refactoring of navigation
or URL routing.

## Consequences

### Positive

- No changes to `WizardNav`, `WizardScreenPage`, or screen URL routing.
- No broken bookmarks or redirects needed.
- First-time users still see a clear summary of their company profile before starting
  data entry, which improves data-quality confidence.
- Screen 1 can be enhanced later (e.g., show a completeness indicator for the profile).

### Negative

- Users who navigate the wizard linearly must click "Weiter" on a read-only screen;
  experienced users may find this unnecessary.
- If the profile has never been filled in (first-run), Screen 1 must still show a
  meaningful empty state that guides the user to Settings.

## Implementation Notes

For the Developer:

- Replace the `<form>` in `Screen1Firmenprofil.tsx` with a read-only field display.
  Use `fetch('/api/entries?type=profile')` on mount (same as today) to populate values.
- If the profile is empty (no record yet), show an amber prompt:
  *"Firmendaten noch nicht hinterlegt — bitte in den Einstellungen erfassen."*
  with a button/link to `/settings`.
- If the profile is populated, show each field as a labeled read-only row, followed by
  the amber info callout linking to Settings.
- Remove the `react-hook-form` / Zod schema / `saveCompanyProfile` imports from Screen 1;
  they move to the new `FirmenprofilSettings` component on the Settings page.
- `WizardNav currentScreen={1}` stays unchanged.
