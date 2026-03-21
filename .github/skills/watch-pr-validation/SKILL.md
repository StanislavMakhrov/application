---
name: watch-pr-validation
description: After finishing work and pushing changes, automatically find and watch the PR Validation pipeline, then read errors and fix failures if the build is red. Use this after every report_progress call.
---

# Watch PR Validation

## Purpose

After an agent finishes work and pushes changes to a PR branch, the PR Validation
GitHub Actions workflow is triggered automatically. This skill defines the complete
loop that agents must follow to:

1. **Find** the triggered PR Validation run
2. **Watch** it until completion
3. **If it fails** — read the error logs, fix the issues, re-validate locally, push
   again, and repeat until the run passes
4. **Hand off** only after CI is green

## Who Uses This Skill

All agents that push code changes to a PR branch:

- **Developer** — after implementing features/fixes
- **Any coding agent** that calls `report_progress` to push changes

## When to Use This Skill

- **After every `report_progress` call** that pushes code changes to the PR
- After any rework (code review fixes, UAT fixes)
- Before handing off to the next agent in the workflow

## Hard Rules

### Must

- Complete this skill after every push — never hand off with a red build
- Read the actual failure logs before attempting any fix
- Re-run the `pre-push-validation` skill locally after fixing, before pushing again
- Repeat the watch-fix loop until CI is green
- Report the final green CI status when handing off

### Must Not

- Hand off to the next agent when CI is failing
- Guess at the failure cause without reading the logs
- Push speculative fixes without running local validation first
- Skip CI monitoring to save time

## Workflow

### Step 1 — Find the PR Validation Run

After `report_progress` pushes changes, GitHub automatically triggers the
`PR Validation` workflow. Wait up to **2 minutes** for the run to appear.

**Option A — GitHub MCP Tools (preferred):**

```typescript
// List runs for the current branch, filtering to PR Validation workflow
github-mcp-server-actions_list(
  method: "list_workflow_runs",
  owner: "<repo-owner>",
  repo: "<repo-name>",
  resource_id: "pr-validation.yml",
  workflow_runs_filter: { branch: "<current-branch>" }
)
```

If no run appears immediately, wait 15–30 seconds and retry (up to 8 times).

**Option B — Wrapper Script (fallback, single stable command):**

```bash
scripts/pr-validation-watch.sh
```

This script automatically polls until the run appears, watches it to completion,
prints failed logs if it fails, and exits with code 0 (pass) or 1 (fail).

### Step 2 — Watch the Run

**Option A — GitHub MCP Tools (preferred):**

Poll the run status every 30 seconds until `status == "completed"`:

```typescript
github-mcp-server-actions_get(
  method: "get_workflow_run",
  owner: "<repo-owner>",
  repo: "<repo-name>",
  resource_id: "<run-id>"
)
```

Check `.conclusion` when status is "completed":

- `"success"` → proceed to Step 5 (success)
- `"failure"` → proceed to Step 3 (fix failures)
- `"cancelled"` → investigate; re-run if appropriate

**Option B — Wrapper Script (fallback):**

```bash
# Watch a specific run (quiet, agent-friendly output)
scripts/check-workflow-status.sh --repo <owner/repo> watch <run-id> --quiet
```

Output: `WORKFLOW: SUCCESS` | `WORKFLOW: FAILURE` | `WORKFLOW: CANCELLED`

### Step 3 — Read Failure Logs (if failed)

Retrieve logs for all failed jobs before attempting any fix.

**Option A — GitHub MCP Tools (preferred):**

```typescript
github-mcp-server-get_job_logs(
  owner: "<repo-owner>",
  repo: "<repo-name>",
  run_id: <run-id>,
  failed_only: true,
  return_content: true
)
```

**Option B — Wrapper Script (fallback):**

```bash
# Get logs for all failed jobs in a run
scripts/check-workflow-status.sh --repo <owner/repo> logs <run-id>
```

**Analyze the logs** to identify the root cause:

- Lint errors → fix code style issues
- TypeScript type errors → fix type annotations
- Test failures → fix failing tests or update them
- Build errors (`next build`) → fix compile/import errors
- Markdown lint failures → fix markdown formatting

### Step 4 — Fix the Failures

1. Apply targeted fixes based on the log analysis
2. Run **`pre-push-validation`** skill locally to confirm the fix:

   ```bash
   cd src && npm run lint && npm run type-check && npm test && npm run build
   # If markdown files changed:
   npx markdownlint-cli2 "**/*.md" "#node_modules" "#CHANGELOG.md"
   ```

3. Once all local checks pass, push with `report_progress`
4. Return to **Step 1** to watch the new run

### Step 5 — Confirm Green CI (success path)

When the run concludes with `"success"`:

- ✅ CI is green — the PR is ready for the next step in the workflow
- Include CI status in your handoff summary: `"PR Validation: ✅ green (run <id>)"`

### Step 6 — Re-run Without New Commits (optional)

If a run fails due to a **transient issue** (network timeout, flaky external service)
and no code changes are needed, re-run the failed jobs directly.

**Identifying transient vs. genuine failures:**

Transient failures (safe to rerun without code changes):

- `Error: connect ETIMEDOUT` / `ECONNRESET` — network timeout
- `Error: Resource not accessible by integration` — GitHub API rate-limit spike
- `Exit code 137` — runner ran out of memory (OOM)
- Docker pull failures: `Error response from daemon: … i/o timeout`
- `Waiting for app to be ready … App failed to start within 90 s` when logs show
  no application error (just a slow runner)
- Any step that fails on retry with different output (non-deterministic)

Genuine failures (require code fix — go back to Step 3):

- Lint, type-check, or test failures with specific file/line references
- `next build` compile errors
- Markdown lint violations
- Test assertions: `AssertionError`, `expected … to equal …`
- Any failure that reproduces consistently when rerun

**Option A — GitHub MCP Tools (preferred):**

Use the GitHub UI or MCP rerun API if available.

**Option B — Wrapper Script (fallback):**

```bash
# Re-run only the failed jobs
scripts/check-workflow-status.sh --repo <owner/repo> rerun <run-id> --failed-only

# Re-run all jobs
scripts/check-workflow-status.sh --repo <owner/repo> rerun <run-id>
```

Then return to **Step 2** to watch the new run.

## Quick Reference

```bash
# One-command: find, watch, and print logs on failure (fallback script)
scripts/pr-validation-watch.sh

# Watch a known run (agent-friendly quiet output)
scripts/check-workflow-status.sh watch <run-id> --quiet

# Get failed job logs
scripts/check-workflow-status.sh logs <run-id>

# Re-run failed jobs
scripts/check-workflow-status.sh rerun <run-id> --failed-only
```

## Decision Tree

```text
After report_progress pushes changes
         │
         ▼
   Find PR Validation run (Step 1)
         │
         ▼
   Watch run until complete (Step 2)
         │
    ┌────┴────┐
    │         │
 success   failure
    │         │
    ▼         ▼
  ✅ Done  Read logs (Step 3)
              │
              ▼
          Fix issues (Step 4)
              │
              ▼
       Local pre-push validation
              │
              ▼
         report_progress
              │
              └──────► Find PR Validation run (Step 1)
```
