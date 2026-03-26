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
| Architect | ✅ Done | Created architecture.md with 6 decisions |
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

---

### Architect — 2025-07-14

**Summary:** Designed the technical approach for the entity management feature.
Reviewed the Prisma schema, existing API route patterns, Settings page structure,
Client Component conventions, and toast/feedback usage throughout the codebase.

**Key decisions made:**

1. **Schema migration (Decision 1):** Add `validYear Int` to `IndustryBenchmark`
   (default `2024`); change unique constraint to `@@unique([branche, validYear])`.
   Required for year-accurate benchmark comparisons and consistency with the
   existing `EmissionFactor` versioning pattern.
2. **API routes (Decision 2):** Extend `POST /api/factors`, new
   `PUT/DELETE /api/factors/[id]`, new `GET+POST /api/benchmarks`, new
   `PUT /api/benchmarks/[id]`. Follows the existing collection/item route split.
3. **UI mix (Decision 3):** Replace the two read-only Server Component tables
   with new Client Components (`EmissionFactorsTableEditable`,
   `IndustryBenchmarkTableEditable`). Server Component passes full DB rows (with
   `id`) as props; components use `router.refresh()` after mutations — identical
   to the `YearManagement` pattern.
4. **Type additions (Decision 4):** New `EmissionFactorRow` and
   `IndustryBenchmarkRow` interfaces in `src/types/index.ts`. Existing
   `FactorRecord` unchanged.
5. **State management (Decision 5):** `useState` for edit row + value;
   `router.refresh()` for re-sync. No SWR/React Query needed.
6. **Toast pattern (Decision 6):** `sonner` with German messages, consistent
   with existing wizard screens.

**Artifacts produced:**
- `docs/features/004-entity-management/architecture.md`

**Problems encountered:** None. All needed patterns were clearly established in
the codebase (YearManagement, FirmenprofilSettings, field-documents API).

**Handoff:** Ready for Developer agent (or Task Planner to break into tasks first).

---

### Quality Engineer — 2025-07-14

**Summary:** Created a full test plan and UAT test plan for Feature 004 (Entity
Management). Reviewed the architecture document, analysis, and all existing test
files to match project conventions.

**Key decisions made:**

- Mapped all 9 acceptance criteria (AC-1 through AC-9) to 28 numbered test cases.
- API integration tests (TC-01 – TC-18) follow the existing
  `vi.mock('@/lib/prisma', ...)` + `NextRequest` pattern from
  `src/app/api/factors/__tests__/route.test.ts`.
- Component tests (TC-19 – TC-28) use React Testing Library with
  `@vitest-environment jsdom` because the new editable tables are Client
  Components with `useState` and `fetch`; the existing `renderToStaticMarkup`
  approach only works for pure Server Components.
- Identified two open questions in the test plan:
  (1) Whether `GET /api/benchmarks` with no `year` param should return 400 or
  fall back to most-recent year; (2) whether `POST /api/factors` restricts `key`
  to existing enum values.

**Artifacts produced:**
- `docs/features/004-entity-management/test-plan.md`
- `docs/features/004-entity-management/uat-test-plan.md`

**Problems encountered:** None. All patterns were clear from existing tests and
architecture decisions.

**Handoff:** Ready for Developer agent to implement API routes, schema migration,
and editable table components. Task Planner may break implementation into tasks first.
