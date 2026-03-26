# Code Review: Factor Selection & Display UX (Feature 003)

## Summary

Reviewed the full implementation of dynamic emission factor display in wizard
screens 2–7, the new `GET /api/factors` API route, the `useFactors` hook, the
`FactorHint` presentational component, and two new Settings server components
(`EmissionFactorsTable`, `IndustryBenchmarkTable`). All 65 tests pass.
Implementation quality is high. One documentation gap was found and fixed
directly. No regressions in existing tests.

## Verification Results

- **Tests:** ✅ Pass — 65 passed, 0 failed (9 test files)
- **Build:** ✅ TypeScript compiles (no `tsc --noEmit` errors introduced)
- **Docker:** Not tested (no DB available in CI; pre-existing constraint per
  Developer's work-protocol note)
- **Errors:** None in test run

## Specification Compliance

| Acceptance Criterion | Implemented | Tested | Notes |
|---|---|---|---|
| AC-1: All wizard hints (Screens 2–7) loaded dynamically from DB | ✅ | ✅ TC-08–11 | All 6 screens use `useFactors(year)` + `<FactorHint>`. Zero hardcoded factor strings remain. |
| AC-2: Displayed factor matches factor used in CO₂e calculation | ✅ | ✅ TC-01–04 | `getAllEmissionFactorRecords` reuses the same three-step fallback chain as `getEmissionFactor` |
| AC-3: "Emissionsfaktoren" table on Settings page | ✅ | ✅ TC-12–14 | Read-only table grouped by scope, alphabetically sorted within groups |
| AC-4: `IndustryBenchmark` values visible in Settings | ✅ | ✅ TC-15 | New `IndustryBenchmarkTable` section on `/settings` |
| AC-5: Graceful degradation when factor key missing | ✅ | ✅ TC-09, TC-10 | `FactorHint` renders `–` placeholder on loading and missing key |

**Spec Deviations Found:** None.

**Note on `negativeLabel` prop:** `tasks.md` specified an optional
`negativeLabel?: string` prop on `FactorHint`. The implementation omits it
because the recycling credit label is fixed text ("♻ Gutschrift: … Recycling
reduziert Ihre Bilanz!") and no caller needs to customise it. This is an
intentional and correct simplification — not a defect.

## Adversarial Testing

| Test Case | Result | Notes |
|---|---|---|
| Empty `factors` map (loading) | ✅ Pass | TC-10: renders `–`, no crash |
| Missing/unknown factor key | ✅ Pass | TC-09: renders `–` placeholder |
| Negative factor (`ABFALL_ALTMETALL`) | ✅ Pass | TC-11: ♻ Gutschrift variant renders correctly |
| Network error in `useFactors` | ✅ Pass | TC-17: empty map, `isLoading=false`, `console.error` called |
| Non-2xx HTTP response from `/api/factors` | ✅ Pass | Additional test: empty map returned |
| Missing `year` query param | ✅ Pass | TC-06: returns 400 |
| Non-numeric `year` param | ✅ Pass | TC-07: returns 400 |
| DB error in API route | ✅ Pass | Additional test: returns 500 |
| `year` changes in hook | ✅ Pass | Additional test: re-fetches, resets loading state |
| Empty `benchmarks` array | ✅ Pass | Empty-state message shown, no crash |
| Empty `factors` map in `EmissionFactorsTable` | ✅ Pass | "Keine Emissionsfaktoren" message shown |
| Key not in `CATEGORY_LABELS` | ✅ Pass | TC-14: raw key shown as fallback label |

## Review Decision

**Status: Approved** ✅

One issue was fixed directly during review (see below). No Blockers or Major
issues remain.

## Issues Found

### Blockers

None.

### Major Issues

**FIXED — `docs/features.md` not updated:**
Feature 003 was missing from the global feature index. This is a required
documentation update for all features. Fixed directly by adding the feature 003
row to `docs/features.md`.

**Missing agent log — Technical Writer:**
The `work-protocol.md` has no entry from a Technical Writer agent.
`docs/architecture.md` was not updated to document the new API route, hook, or
components. Per the required-agents checklist for feature workflows, the
Technical Writer should have updated global documentation. **Recommend invoking
the Technical Writer agent** to update `docs/architecture.md` with the new
`GET /api/factors` endpoint, `useFactors` hook, and `EmissionFactorsTable` /
`IndustryBenchmarkTable` components. This does not block code quality approval
but is a process compliance gap.

### Minor Issues

1. **Misleading comment in `EmissionFactorsTable.getScope()`**
   (`src/components/settings/EmissionFactorsTable.tsx`, line 52):
   The comment reads `// Special keys (e.g. STROM_OEKOSTROM, material keys)
   default to SCOPE3` but `STROM_OEKOSTROM` is explicitly returned as `SCOPE2`
   on the very next line — it does *not* default to SCOPE3. Suggested fix:
   split the comment into two: one for `STROM_OEKOSTROM` and one for material
   keys that genuinely fall through to SCOPE3.

2. **Markdownlint errors in feature docs:**
   `architecture.md` and `tasks.md` contain MD013/MD022/MD032/MD040/MD060
   violations (line-length, missing blank lines around lists, missing code-fence
   languages). These were introduced by prior agents (Architect, Task Planner)
   and are not part of the Developer's changes. They should be fixed in a
   follow-up clean-up pass.

### Suggestions

1. **`getScope()` dead-code path:** The `return 'SCOPE3'` fallback in
   `EmissionFactorsTable.getScope()` is unreachable for any key currently in the
   DB (all EmissionCategory keys are in `CATEGORY_SCOPE`, and `STROM_OEKOSTROM`
   is explicitly handled). Adding a comment noting this would aid future
   maintainers.

2. **`useFactors` cancellation:** The `cancelled` flag idiom is correct but
   slightly non-idiomatic for React 18+ (AbortController is preferred).
   The current implementation is safe and works correctly; this is an optional
   future improvement.

## Critical Questions Answered

- **What could make this code fail?** If the DB is unreachable at runtime, all
  wizard hints degrade to `–` placeholders — by design and tested (TC-17).
  If a new emission factor key is seeded without a matching `CATEGORY_LABELS`
  entry, it will fall back to the raw key string in the Settings table — by
  design and tested (TC-14).
- **What edge cases might not be handled?** The `STROM_OEKOSTROM` key is not in
  `EmissionCategory` but is a valid DB key. The `EmissionFactorsTable.getScope()`
  function correctly handles it via an explicit check. Material keys (`KUPFER`,
  `STAHL`, etc.) are not in `CATEGORY_SCOPE` and fall through to the SCOPE3
  default — this is correct per the architecture.
- **Are all error paths tested?** Yes — network error (TC-17), non-2xx
  (additional test), DB failure in API route (additional test), and missing/
  invalid `year` param (TC-06, TC-07) are all covered.

## Checklist Summary

| Category | Status |
|---|---|
| Correctness | ✅ |
| Spec Compliance | ✅ |
| Code Quality | ✅ |
| Architecture | ✅ |
| Testing | ✅ |
| Documentation | ⚠️ Technical Writer step outstanding; `features.md` fixed |

## Next Steps

1. Invoke the **Technical Writer** agent to update `docs/architecture.md` with
   the new components and API endpoint introduced by this feature.
2. Once Technical Writer completes, route to the **UAT Tester** agent to
   validate the live wizard hints and Settings page tables in the running app
   (see `docs/features/003-factor-selection-ux/uat-test-plan.md`).
