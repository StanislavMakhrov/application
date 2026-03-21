#!/usr/bin/env bash
set -euo pipefail

# Prevent interactive pagers from blocking automation
export GH_PAGER=cat
export GH_FORCE_TTY=false
export PAGER=cat

usage() {
  cat <<'USAGE'
Usage:
  scripts/pr-validation-watch.sh [options]

Options:
  --branch <branch>       Branch to watch (default: current git branch)
  --repo <owner/repo>     Target repository (overrides GH_REPO)
  --timeout <seconds>     Max seconds to wait for a run to appear (default: 120)
  --logs-on-fail          Print failed job logs on failure (default: true)
  --no-logs-on-fail       Skip printing logs on failure

Description:
  After pushing commits to a PR branch, this script finds the latest PR Validation
  workflow run for the given branch, waits for it to appear (up to --timeout seconds),
  then watches it until completion and reports the result.

  On failure, it automatically prints failed job logs so the agent can diagnose
  and fix the issue.

Exit codes:
  0  PR Validation passed (or no run found within timeout — agent should investigate)
  1  PR Validation failed (logs printed to stdout)
  2  Usage/configuration error

Examples:
  # Watch PR Validation for the current branch
  scripts/pr-validation-watch.sh

  # Watch a specific branch
  scripts/pr-validation-watch.sh --branch feature/123-my-feature

  # Watch without printing logs on failure
  scripts/pr-validation-watch.sh --no-logs-on-fail

Notes:
  - Designed for permanent approval in VS Code (single stable command)
  - Preferred: use GitHub MCP tools (github-mcp-server-actions_list, get_job_logs)
    for richer output in agent contexts
  - This script is the CLI fallback when MCP tools are unavailable
USAGE
}

BRANCH=""
REPO_FLAG=""
TIMEOUT=120
LOGS_ON_FAIL=true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch)
      BRANCH="$2"
      shift 2
      ;;
    --repo)
      REPO_FLAG="--repo $2"
      shift 2
      ;;
    --timeout)
      TIMEOUT="$2"
      shift 2
      ;;
    --logs-on-fail)
      LOGS_ON_FAIL=true
      shift
      ;;
    --no-logs-on-fail)
      LOGS_ON_FAIL=false
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Error: Unknown option '$1'" >&2
      usage
      exit 2
      ;;
  esac
done

gh_safe() {
  # shellcheck disable=SC2086
  GH_PAGER=cat GH_FORCE_TTY=false gh "$@" ${REPO_FLAG:-}
}

# Resolve branch
if [[ -z "$BRANCH" ]]; then
  BRANCH="$(git branch --show-current)"
  if [[ -z "$BRANCH" ]]; then
    echo "Error: Could not determine current branch. Use --branch to specify." >&2
    exit 2
  fi
fi

echo "Waiting for PR Validation run on branch '$BRANCH'..." >&2

# Poll until a run appears or timeout
RUN_ID=""
ELAPSED=0
POLL_INTERVAL=10

while [[ -z "$RUN_ID" && $ELAPSED -lt $TIMEOUT ]]; do
  RUN_ID=$(gh_safe run list \
    --branch "$BRANCH" \
    --workflow pr-validation.yml \
    --limit 1 \
    --json databaseId,status \
    --jq '.[0].databaseId // empty' 2>/dev/null || true)

  if [[ -n "$RUN_ID" ]]; then
    break
  fi

  echo "  No run found yet (${ELAPSED}s elapsed). Retrying in ${POLL_INTERVAL}s..." >&2
  sleep "$POLL_INTERVAL"
  ELAPSED=$((ELAPSED + POLL_INTERVAL))
done

if [[ -z "$RUN_ID" ]]; then
  echo "⚠️  No PR Validation run found for branch '$BRANCH' within ${TIMEOUT}s." >&2
  echo "   Verify the PR exists and changes were pushed." >&2
  exit 0
fi

echo "Found PR Validation run: $RUN_ID — watching..." >&2
echo ""

# Watch the run to completion (quiet mode for agent-friendly output)
gh_safe run watch "$RUN_ID" 2>&1 || true

# Check final conclusion
CONCLUSION=$(gh_safe run view "$RUN_ID" --json conclusion -q '.conclusion' 2>/dev/null || echo "unknown")

echo ""
if [[ "$CONCLUSION" == "success" ]]; then
  echo "✅ WORKFLOW: SUCCESS (run $RUN_ID)"
  exit 0
elif [[ "$CONCLUSION" == "cancelled" ]]; then
  echo "⚠️  WORKFLOW: CANCELLED (run $RUN_ID)"
  exit 0
else
  echo "❌ WORKFLOW: FAILURE (run $RUN_ID, conclusion: $CONCLUSION)"

  if [[ "$LOGS_ON_FAIL" == "true" ]]; then
    echo ""
    echo "--- Failed job logs ---"
    FAILED_JOBS=$(gh_safe run view "$RUN_ID" \
      --json jobs \
      --jq '.jobs[] | select(.conclusion == "failure") | .name' 2>/dev/null || true)

    if [[ -z "$FAILED_JOBS" ]]; then
      echo "  (Could not retrieve failed job list — view logs manually)"
      echo "  Run: scripts/check-workflow-status.sh logs $RUN_ID"
    else
      while IFS= read -r job; do
        [[ -z "$job" ]] && continue
        echo ""
        echo "[FAILED JOB: $job]"
        local job_log
        job_log=$(gh_safe run view "$RUN_ID" --job "$job" --log 2>/dev/null || true)
        if echo "$job_log" | grep -qiE "error|failed|exception|fatal|❌"; then
          echo "$job_log" | grep -iE "error|failed|exception|fatal|❌"
        else
          echo "$job_log" | tail -n 60
        fi
      done <<< "$FAILED_JOBS"
    fi
  fi

  exit 1
fi
