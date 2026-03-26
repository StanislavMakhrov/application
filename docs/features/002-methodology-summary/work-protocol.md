# Work Protocol: Add Methodology Summary to Every Generated Report

**Work Item:** `docs/features/002-methodology-summary/`
**Branch:** `copilot/add-methodology-summary-to-reports`
**Workflow Type:** Feature
**Created:** 2025-07-14

## Agent Work Log

<!-- Each agent appends their entry below when they complete their work. -->

### Requirements Engineer
- **Date:** 2025-07-14
- **Summary:** Gathered requirements for the methodology summary feature based on the GitHub issue description and exploration of the existing codebase (GHGReport component, Prisma schema, report API route, and emissions library). Produced a Feature Specification covering the standard declaration, emission factor table, data quality indicators, assumptions/boundary notes, and backend assembly from existing records. Identified open questions around factor table scope and page layout.
- **Artifacts Produced:**
  - `docs/features/002-methodology-summary/specification.md`
  - `docs/features/002-methodology-summary/work-protocol.md`
- **Problems Encountered:** None. The existing codebase has all required data already available (EmissionFactor records, EmissionEntry.inputMethod, CompanyProfile boundary notes), making the backend assembly straightforward for the Architect and Developer to implement.

### Architect
- **Date:** 2025-07-14
- **Summary:** Analyzed the existing report generation architecture (API route → lib functions → GHGReport component) and designed the methodology data assembly approach. Evaluated three implementation options: inline assembly in the API route, assembly in the component, and a new `assembleMethodologyData()` function in `src/lib/methodology.ts`. Chose Option 3 (new lib function) as it best follows the established pattern (same as `getTotalCO2e()`), keeps the API route lean, and keeps `GHGReport` a purely presentational component.
- **Artifacts Produced:**
  - `docs/features/002-methodology-summary/architecture.md` — full ADR with data shape, component design, sequence diagram, and file-level change guidance
- **Problems Encountered:** None. No Prisma schema changes are needed. No new npm packages are needed. The `EmissionFactor` model already stores all required metadata (`unit`, `source`, `validYear`). The only DB-level gap is that `factors.ts` currently only exposes the numeric factor value — the architecture adds `getEmissionFactorRecord()` to return the full record object for methodology purposes.
