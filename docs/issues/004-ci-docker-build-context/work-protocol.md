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

## Implementation Decisions

### What was NOT changed (and why)
- `src/Dockerfile` was left as-is — the COPY instructions are correct for a repo-root build context; the only bug was in the workflow configuration pointing to the wrong context directory.
- No other workflow files were touched — the issue was isolated to the `Build and push` step in `release.yml`.

### Explicit Constraints verified
- Minimal change only: exactly two lines changed in the workflow file (`context` value updated, `file` line added). No unrelated modifications were made.
