# Work Protocol: CI Docker Build Context Mismatch

**Work Item:** `docs/issues/004-ci-docker-build-context/`
**Branch:** `copilot/fix-ci-build-errors`
**Workflow Type:** Bug Fix
**Created:** 2025-04-01

## Agent Work Log

<!-- Each agent appends their entry below when they complete their work. -->

### Issue Analyst
- **Date:** 2025-04-01
- **Summary:** Investigated CI release pipeline Docker build failure. Identified root cause as a mismatch between the Docker build context set in `release.yml` (`context: ./src`) and the COPY paths in `src/Dockerfile` which expect a repo-root build context. All failing COPY instructions reference paths (`src/`, `prisma/`, `public/`, `docker/`) that exist at the repo root but not inside `./src/`. Produced full analysis document at `docs/issues/004-ci-docker-build-context/analysis.md`. Note: `scripts/next-issue-number.sh` has a bug — when no remote `feature/*`, `fix/*`, or `workflow/*` branches exist it returns empty for `remote_max`, causing an integer-comparison error and falling back to "001" instead of the correct "004". Number was manually verified by inspecting existing docs folders (highest found: `docs/issues/003-*`).
- **Artifacts:** `docs/issues/004-ci-docker-build-context/analysis.md`, `docs/issues/004-ci-docker-build-context/work-protocol.md`
- **Problems:** `scripts/next-issue-number.sh` script has a bug when no remote branches match `feature/*`, `fix/*`, or `workflow/*` patterns — `find_remote_max` subshell returns empty string instead of "0", causing the integer comparison to fail. Issue number was manually verified as 004.

### Developer
- **Date:** 2025-04-01
- **Summary:** Applied minimal fix to `.github/workflows/release.yml`: changed `context: ./src` to `context: .` (repo root) and added `file: ./src/Dockerfile` so Docker Buildx can locate the Dockerfile after the context change. This aligns the build context with the COPY instructions in `src/Dockerfile`, which reference repo-root-relative paths (`src/`, `prisma/`, `public/`, `docker/`).
- **Artifacts:** `.github/workflows/release.yml` (modified)
- **Problems:** None.

### Code Reviewer
- **Date:** 2025-04-01
- **Summary:** Reviewed the two-line fix to `.github/workflows/release.yml`. Verified the fix is technically correct: `context: .` aligns with all COPY paths in `src/Dockerfile`; `file: ./src/Dockerfile` correctly locates the Dockerfile after the context change. Confirmed all 7 COPY source paths exist at repo root. Confirmed no other workflow files have the same bug (`pr-validation.yml` and `scripts/docker-build-test.sh` already used correct patterns). Identified one blocker: Technical Writer has not logged a work protocol entry (required for bug fix workflow). Minor: `file: ./src/Dockerfile` in `release.yml` uses a `./` prefix inconsistent with the `src/Dockerfile` form used in the other two locations.
- **Artifacts:** Code Review Report (returned in response)
- **Problems:** Missing Technical Writer work log entry — blocked approval pending their entry.

### Technical Writer
- **Date:** 2025-04-01
- **Summary:** Reviewed all user-facing and developer documentation for references to the old Docker build context. Found three stale references using the incorrect `docker build -t app:local ./src` command pattern and one cosmetic path inconsistency. Updated the following:
  - `.github/workflows/release.yml`: changed `file: ./src/Dockerfile` → `file: src/Dockerfile` to match the style used in `pr-validation.yml` and `scripts/docker-build-test.sh` (cosmetic fix flagged by Code Reviewer).
  - `docs/agents.md`: updated Developer Definition of Done from `docker build -t app:local ./src` → `docker build -t app:local -f src/Dockerfile .` to reflect the correct repo-root build context.
  - `docs/release-notes-template.md`: updated the local build example from `docker build -t app:local ./src` → `docker build -t app:local -f src/Dockerfile .` for the same reason.
  - No changes needed to `README.md` (Docker section uses `docker compose up --build` which is unaffected) or `docs/architecture.md` (Dockerfile reference there is a compose config path, not a build command).
- **Artifacts:** `.github/workflows/release.yml` (cosmetic fix), `docs/agents.md` (Docker command updated), `docs/release-notes-template.md` (Docker command updated), `docs/issues/004-ci-docker-build-context/work-protocol.md` (this entry).
- **Problems:** None.

## Implementation Decisions

### What was NOT changed (and why)
- `src/Dockerfile` was left as-is — the COPY instructions are correct for a repo-root build context; the only bug was in the workflow configuration pointing to the wrong context directory.
- No other workflow files were touched — the issue was isolated to the `Build and push` step in `release.yml`.

### Explicit Constraints verified
- Minimal change only: exactly two lines changed in the workflow file (`context` value updated, `file` line added). No unrelated modifications were made.
