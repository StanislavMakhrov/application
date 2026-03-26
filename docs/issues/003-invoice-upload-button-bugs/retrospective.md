# Retrospective: Issue #003 — Invoice Upload Button Fixes

**Date:** 2026-03-26
**Participants:** Maintainer, Issue Analyst, Developer (×3 rounds), Technical Writer, UAT Tester, Code Reviewer, Release Manager, Retrospective Agent

---

## Summary

This retrospective covers the full bug-fix lifecycle for three UI bugs in the invoice upload section: button label rename, duplicate-button elimination, and button position fix. The workflow followed the standard agent sequence (Issue Analyst → Developer → Technical Writer → Developer (tests) → Code Reviewer → UAT Tester → Developer (CI fix) → Release Manager). The bugs were correctly identified and fixed, but an incorrect assertion in the E2E regression tests caused a CI failure that required an unplanned third Developer round.

---

## Scoring Rubric

- **Starting score:** 10
- **Deductions:**
  - −1: E2E test assertion was wrong on submission (`expected 3 buttons, found 7`), causing a CI failure and requiring an additional Developer iteration (unplanned rework round)
  - −0.5: Code Reviewer flagged that the `### Issue Analyst` heading in `work-protocol.md` was inadvertently overwritten by the Developer entry (minor protocol hygiene issue)
- **Final workflow rating:** **8.5/10**

---

## Session Overview

### Time Breakdown

| Metric | Value |
|--------|-------|
| **Date** | 2026-03-26 |
| **Total Requests** | Unavailable (no exported chat log) |
| **Files Changed** | ~16 (6 source + 8 docs + 1 E2E test + work-protocol variants) |
| **Tests Added** | 8 Playwright E2E regression tests |
| **Tests Passing** | 22/22 Vitest unit tests; 8/8 E2E tests registered |
| **CI Outcome** | ✅ PR Validation run #23579651484 — SUCCESS |

*Per-agent time splits and detailed request counts are **Unavailable** — no chat log was exported for this session.*

---

## Work Protocol Analysis

All required agents logged entries. Findings:

| Agent | Logged? | Notes |
|-------|---------|-------|
| Issue Analyst | ✅ | Entry present (heading mislabelled as `### Developer` — see below) |
| Developer (fixes) | ✅ | Two Developer entries present for fix and analysis phases |
| Developer (tests) | ✅ | Separate entry for regression tests |
| Technical Writer | ✅ | 9 documentation files updated |
| UAT Tester | ✅ | Live E2E deferred to CI; source-code verification performed |
| Code Reviewer | ✅ | Approved after rework; flagged heading issue |
| Release Manager | ✅ | Merged PR #75, CI green |
| Retrospective | ✅ (this entry) | Added at end of cycle |

**Protocol issue:** The Developer prepended their entry without preserving the `### Issue Analyst` heading, overwriting it with `### Developer`. The content and artifact (`analysis.md`) are correct; only the heading label is wrong. Flagged as Minor issue m-2 in code-review.md. This indicates a need for clearer guidance on how agents should prepend work-protocol entries without clobbering existing headings.

---

## Agent Analysis

*Per-agent model usage and request counts are **Unavailable** — no chat export was provided.*

### Agent Performance

| Agent | Rating | Strengths | Improvements Needed |
|-------|--------|-----------|---------------------|
| Issue Analyst | ⭐⭐⭐⭐⭐ | Clear `analysis.md` with root causes and affected files; no problems encountered | None |
| Developer (fixes) | ⭐⭐⭐⭐ | All 3 fixes applied correctly across 6 files; confirmed pre-existing Prisma build issue was unrelated | — |
| Developer (tests) | ⭐⭐⭐ | Good structure (4 describe blocks, mocking strategy); however incorrect button-count assertion (`3` on Screen 2 instead of `7`) caused CI failure requiring a 3rd round | Must account for all FieldDocumentZone instances on the target screen before writing count assertions |
| Developer (CI fix) | ⭐⭐⭐⭐ | Quickly identified and corrected the assertion (3→7); no further issues | — |
| Technical Writer | ⭐⭐⭐⭐⭐ | Updated 9 files comprehensively; correctly left historical analysis docs unchanged | None |
| Code Reviewer | ⭐⭐⭐⭐ | Caught heading protocol issue; approved after rework; reviewed 8 E2E tests | Could have caught the button-count assertion risk during first review of tests |
| UAT Tester | ⭐⭐⭐⭐ | Thorough source-code verification; clear manual UAT checklist; transparent about live-execution limitation | — |
| Release Manager | ⭐⭐⭐⭐⭐ | Verified all checklist items; confirmed CI green before merge; no issues | None |

---

## Rejection Analysis

*Unavailable — no chat export provided.*

---

## What Went Well

- **All three bugs correctly identified and fixed** in a single Developer pass with localized, minimal changes across 6 files.
- **Comprehensive documentation updates** — Technical Writer updated 9 files covering architecture, specifications, test plans, UAT scripts, and tasks without missing any reference.
- **Good E2E test structure** — 4 describe blocks, API mocking with `page.route()`, DOM-order assertion via `compareDocumentPosition` are solid patterns to reuse.
- **CI gating worked** — the incorrect assertion was caught by CI before merge, preventing a regression from shipping.
- **Clean release** — PR #75 merged via rebase, PR Validation run #23579651484 succeeded.
- **Pre-existing Prisma build issue** was correctly identified as unrelated and not allowed to block the fix.

---

## What Didn't Go Well

1. **Incorrect button-count assertion in E2E tests** — The Developer wrote `expect(buttons).toHaveCount(3)` for Screen 2 without counting all `FieldDocumentZone` instances (those without `suppressInitialUpload`). The actual count was 7, causing a CI failure and requiring an unplanned 3rd Developer round.

2. **Work-protocol heading overwritten** — When the Developer prepended their entry, the `### Issue Analyst` heading was replaced with `### Developer`. Minor, but indicates the work-protocol prepend pattern needs clearer guidance.

---

## Improvement Opportunities

| Issue | Proposed Solution | Action Item |
|-------|-------------------|-------------|
| E2E button-count assertions are fragile — author must manually count all instances on a screen | Before writing count assertions, instruct Developer to grep/count all relevant component instances on the target screen | Update Developer agent prompt (`docs/agents.md` or `.github/agents/developer.agent.md`) to require a component audit before writing count-based assertions |
| Work-protocol `### Heading` gets overwritten when agents prepend entries | Add explicit instruction: "when prepending, preserve all existing headings; use a new `###` heading for your agent role" | Update `docs/agents.md` § Work Protocol with a note and example showing correct prepend behavior |
| UAT Tester could not run live E2E tests in agent environment | Document the known limitation and provide a fallback instruction to defer to CI explicitly | Add a note to UAT Tester agent prompt that live execution is optional if Docker is not available; CI is the authoritative gate |

---

## User Feedback (verbatim)

> "The E2E tests written by the Developer had an incorrect assertion (expected 3 buttons, screen actually had 7) causing a CI failure that required an extra Developer iteration"
> — Maintainer issue summary

**Mapped to improvement opportunity:** Developer agent prompt update requiring a component audit before count assertions.

> "Root cause of CI failure: The regression test author didn't account for all FieldDocumentZone instances without `suppressInitialUpload` on Screen 2"
> — Maintainer issue summary

**Mapped to improvement opportunity:** Same as above — explicit instruction to count component instances before asserting.

---

## CI / Status Checks Summary

| Run | Outcome | Notes |
|-----|---------|-------|
| PR Validation run #23579651484 | ✅ SUCCESS | Final run after 3rd Developer round (CI fix) |
| Earlier run (post-test submission) | ❌ FAILED | `expect(buttons).toHaveCount(3)` — actual was 7; fixed in 3rd Developer round |

---

## Automation Opportunities

| Opportunity | Proposed Skill/Script | Evidence | Verification |
|------------|----------------------|----------|--------------|
| Pre-test component count check | `.github/skills/count-component-instances/` or inline grep pattern | Repeated manual error counting instances | Zero button-count CI failures on next similar test |
| Work-protocol heading validation | Lint step or pre-commit hook checking `###` headings match agent roles | m-2 finding in code-review.md | No heading overwrites in future protocols |

---

## Model Effectiveness Assessment

*Model usage data is **Unavailable** — no chat export was provided. Cannot assess model selection or performance.*

---

## Retrospective DoD Checklist

- [x] Evidence sources enumerated (work-protocol.md, issue summary, code-review.md, CI run #23579651484)
- [x] Evidence timeline normalized across lifecycle phases
- [x] Findings clustered by theme (test authoring quality, protocol hygiene)
- [x] No unsupported claims — all findings backed by work-protocol entries or issue summary
- [x] Action items include where + verification
- [x] Required sections present (summary, scoring rubric, agent analysis, CI summary, improvement opportunities)
- [x] All retro-related user feedback captured verbatim
- [x] No guessed agent attribution — per-agent metrics explicitly marked Unavailable where chat log absent
- [x] No unsupported claims — assumptions labeled or omitted
