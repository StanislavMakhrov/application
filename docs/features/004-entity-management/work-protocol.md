# Work Protocol — Feature 004: Entity Management UI

**Workflow Type:** Bug Fix (UX Gap)
**Feature Folder:** `docs/features/004-entity-management/`
**Branch:** `copilot/add-methodology-summary-to-reports`

---

## Summary

Users cannot manage `EmissionFactor` or `IndustryBenchmark` records through
the UI. Both entities are currently read-only in Settings. The only way to
add or update them is by re-running the seed script or using direct database
access. This blocks the ability to update emission factors when UBA releases
new values and to keep benchmark comparisons accurate.

---

## Agents

| Agent | Status | Notes |
|---|---|---|
| Issue Analyst | ✅ Done | Created analysis, identified root cause |
| Developer | ⬜ Pending | Implement CRUD UI + API routes |
| Code Reviewer | ⬜ Pending | Review implementation |
| QA / UAT Tester | ⬜ Pending | End-to-end test of management flows |

---

## Agent Work Log

### Issue Analyst — 2025-07-14

**Summary:** Investigated the UX gap around managing `EmissionFactor` and
`IndustryBenchmark` entities. Confirmed that:

- The Settings page has read-only tables for both entities (added in Feature 003).
- No write API routes exist for either entity (`/api/factors` is GET-only;
  no `/api/benchmarks` endpoint exists at all).
- `IndustryBenchmark` has no `validYear` field — benchmark values cannot be
  versioned by year.
- The only update path today is `npm run db:seed` or direct psql access.

**Artifacts produced:**
- `docs/features/004-entity-management/analysis.md`
- `docs/features/004-entity-management/work-protocol.md`

**Problems encountered:** None. All needed information was discoverable from
source files, Prisma schema, and the API route directory.

**Handoff:** Ready for Developer agent to implement CRUD API routes and
inline-editing UI in the Settings page.
