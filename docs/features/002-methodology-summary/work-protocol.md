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
