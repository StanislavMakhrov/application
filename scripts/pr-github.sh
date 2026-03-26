#!/usr/bin/env bash
set -euo pipefail

# Prevent interactive pagers from blocking automation
export GH_PAGER=cat
export GH_FORCE_TTY=false
export PAGER=cat

usage() {
  cat <<'USAGE'
Usage:
  scripts/pr-github.sh create --title <title> --body-from-stdin

  scripts/pr-github.sh create-and-merge --title <title> --body-from-stdin

  scripts/pr-github.sh mark-ready [<pr-number>]

  scripts/pr-github.sh mark-draft [<pr-number>]

Options:
  --title <title>         PR title (use Conventional Commits style)
  --body-from-stdin       Read PR body from stdin

Notes:
  - Required: provide an explicit title + body via stdin (agent-authored description)
  - This script intentionally does not guess title/body
  - PRs are created as **drafts** by default. Call `mark-ready` when all work is
    complete — this converts the draft to ready-for-review and triggers PR Validation.
  - Call `mark-draft` to convert a ready PR back to draft when rework is needed
    (e.g., after code review feedback or UAT failure). This prevents PR Validation
    from running on intermediate rework commits.
  - **Agent guidance:** This script is the **authoritative** repo tool for creating and merging PRs. Use `scripts/pr-github.sh create` to create PRs (as draft) and `scripts/pr-github.sh mark-ready` to trigger PR Validation. Use `scripts/pr-github.sh mark-draft` to convert back to draft during rework. Use `scripts/pr-github.sh create-and-merge` to merge them (rebase + delete branch). Body must be piped via stdin.
  - **Fallback:** Use GitHub chat tools (`github/*`) only when the script does not support a necessary advanced operation or for quick inspection of checks.
  - Requires: git + GitHub CLI (gh) authenticated when used as a CLI fallback
  - Merge policy: uses rebase-and-merge for linear history (per CONTRIBUTING.md)
USAGE
}

require_non_empty() {
  local value="$1"
  local label="$2"
  if [[ -z "${value//[[:space:]]/}" ]]; then
    echo "Error: $label must not be empty." >&2
    exit 2
  fi
}

gh_safe() {
  GH_PAGER=cat GH_FORCE_TTY=false gh "$@"
}

require_clean_worktree() {
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "Error: working tree has uncommitted changes." >&2
    exit 2
  fi
}

require_not_main() {
  local branch
  branch="$(git branch --show-current)"
  if [[ "$branch" == "main" ]]; then
    echo "Error: refusing to run on 'main'." >&2
    exit 2
  fi
}

parse_args() {
  local -n _title="$1"

  shift 1

  _title=""
  BODY_TEXT=""
  USE_STDIN=false

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --title)
        _title="$2"
        shift 2
        ;;
      --body-from-stdin)
        USE_STDIN=true
        shift
        ;;
      -h|--help)
        usage
        exit 0
        ;;
      *)
        echo "Error: unknown arg: $1" >&2
        usage
        exit 2
        ;;
    esac
  done

  if [[ -z "$_title" ]]; then
    echo "Error: provide --title and --body-from-stdin." >&2
    usage
    exit 2
  fi

  if [[ "$USE_STDIN" != "true" ]]; then
    echo "Error: --body-from-stdin is required (pipe body via stdin)." >&2
    usage
    exit 2
  fi

  # Read from stdin
  BODY_TEXT="$(cat)"

  require_non_empty "$_title" "--title"
  require_non_empty "$BODY_TEXT" "PR body"
}

ensure_pr_exists() {
  local use_draft="${1:-true}"
  local branch
  branch="$(git branch --show-current)"

  # Only consider OPEN PRs for this branch.
  # `gh pr view` can resolve merged/closed PRs, which breaks workflows when a branch name is reused.
  local open_pr_number
  open_pr_number="$(gh_safe pr list --head "$branch" --state open --json number -q '.[0].number' 2>/dev/null || true)"
  if [[ -n "${open_pr_number//[[:space:]]/}" ]]; then
    return 0
  fi

  require_non_empty "$TITLE" "PR title"
  require_non_empty "$BODY_TEXT" "PR body"
  if [[ "$use_draft" == "true" ]]; then
    echo "No open PR found for branch '$branch'; creating draft PR..." >&2
    echo "$BODY_TEXT" | gh_safe pr create --base main --head "$branch" --title "$TITLE" --body-file - --draft
  else
    echo "No open PR found for branch '$branch'; creating PR..." >&2
    echo "$BODY_TEXT" | gh_safe pr create --base main --head "$branch" --title "$TITLE" --body-file -
  fi
}

get_pr_number() {
  local branch
  branch="$(git branch --show-current)"

  # Prefer the open PR for this branch.
  local open_pr_number
  open_pr_number="$(gh_safe pr list --head "$branch" --state open --json number -q '.[0].number' 2>/dev/null || true)"
  if [[ -n "${open_pr_number//[[:space:]]/}" ]]; then
    echo "$open_pr_number"
    return 0
  fi

  # Fall back to gh's branch inference (may resolve closed PRs). Keep this as a last resort.
  gh_safe pr view --json number -q '.number'
}

# Same as get_pr_number but exits with an error if no open PR is found (used by mark-ready).
get_pr_number_for_branch() {
  local branch
  branch="$(git branch --show-current)"

  local open_pr_number
  open_pr_number="$(gh_safe pr list --head "$branch" --state open --json number -q '.[0].number' 2>/dev/null || true)"
  if [[ -z "${open_pr_number//[[:space:]]/}" ]]; then
    echo "Error: no open PR found for branch '$branch'. Create one first with 'scripts/pr-github.sh create'." >&2
    exit 2
  fi
  echo "$open_pr_number"
}

main() {
  if [[ $# -lt 1 ]]; then
    usage
    exit 2
  fi

  local cmd
  cmd="$1"
  shift

  case "$cmd" in
    create|create-and-merge)
      ;;
    mark-ready)
      require_not_main
      if ! command -v gh >/dev/null 2>&1; then
        echo "Error: gh is not installed." >&2
        exit 2
      fi
      if ! gh auth status >/dev/null 2>&1; then
        echo "Error: gh is not authenticated. Run: gh auth login" >&2
        exit 2
      fi
      local pr_arg="${1:-}"
      if [[ -z "$pr_arg" ]]; then
        pr_arg="$(get_pr_number_for_branch)"
      fi
      require_non_empty "$pr_arg" "PR number"
      echo "Converting PR #${pr_arg} from draft to ready for review..." >&2
      gh_safe pr ready "$pr_arg"
      echo "✓ PR #${pr_arg} is now ready for review — PR Validation will trigger." >&2
      return 0
      ;;
    mark-draft)
      require_not_main
      if ! command -v gh >/dev/null 2>&1; then
        echo "Error: gh is not installed." >&2
        exit 2
      fi
      if ! gh auth status >/dev/null 2>&1; then
        echo "Error: gh is not authenticated. Run: gh auth login" >&2
        exit 2
      fi
      local pr_arg="${1:-}"
      if [[ -z "$pr_arg" ]]; then
        pr_arg="$(get_pr_number_for_branch)"
      fi
      require_non_empty "$pr_arg" "PR number"
      echo "Converting PR #${pr_arg} back to draft..." >&2
      gh_safe pr ready "$pr_arg" --undo
      echo "✓ PR #${pr_arg} is now a draft — PR Validation will skip subsequent pushes." >&2
      return 0
      ;;
    *)
      echo "Error: unknown command: $cmd" >&2
      usage
      exit 2
      ;;
  esac

  require_not_main

  TITLE=""
  parse_args TITLE "$@"

  require_clean_worktree

  if ! command -v gh >/dev/null 2>&1; then
    echo "Error: gh is not installed." >&2
    exit 2
  fi

  if ! gh auth status >/dev/null 2>&1; then
    echo "Error: gh is not authenticated. Run: gh auth login" >&2
    exit 2
  fi

  # Push only if the remote doesn't already have this exact commit.
  # (report_progress already pushes via GitHub Actions credentials; the
  #  ghu_ OAuth token used in agent sessions cannot push directly.)
  local branch
  branch="$(git branch --show-current)"
  local remote_sha
  remote_sha="$(git ls-remote origin "refs/heads/${branch}" 2>/dev/null | cut -f1 || true)"
  if [[ -z "$remote_sha" ]] || [[ "$(git rev-parse HEAD)" != "$remote_sha" ]]; then
    git push -u origin HEAD
  fi

  local use_draft="true"
  if [[ "$cmd" == "create-and-merge" ]]; then
    use_draft="false"
  fi
  ensure_pr_exists "$use_draft"

  local pr
  pr="$(get_pr_number)"
  echo "PR: #$pr" >&2

  if [[ "$cmd" == "create-and-merge" ]]; then
    gh_safe pr merge "$pr" --rebase --delete-branch
  fi
}

main "$@"
