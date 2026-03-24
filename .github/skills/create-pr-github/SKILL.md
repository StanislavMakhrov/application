---
name: create-pr-github
description: Create and (optionally) merge a GitHub pull request using wrapper scripts (preferred) or GitHub CLI (fallback), following the repo policy for rebase and merge.
compatibility: Preferred: scripts/pr-github.sh wrapper. Fallback: git + GitHub CLI (gh) authenticated, plus network access.
---

# Create PR (GitHub)

## ⚠️ NOT for Coding Agent Sessions

**Do NOT use this skill to create PRs in a normal coding agent session.**

In a coding agent session (started from an issue assigned to `@copilot` or from a PR comment), the PR is created automatically by GitHub's session infrastructure when `report_progress` first pushes commits. That PR is properly **linked to the session**, so `@copilot` mentions in the PR continue the same session.

Calling `scripts/pr-github.sh create` or `gh pr create` here uses a PAT — not the session token — which creates an **unlinked PR**. An unlinked PR causes every subsequent `@copilot` mention to start a new session instead of continuing the current one.

**This skill is only for:**
- The **Release Manager** agent (merge operations)
- Non-session contexts (e.g., automated scripts, manual workflows outside of a Copilot session)

## Purpose
Create a GitHub pull request in a consistent, policy-compliant way, and include the repo's preferred merge method guidance (rebase and merge).

**Priority order:**
1. **FIRST**: Use `scripts/pr-github.sh` wrapper script (designed for permanent approval)
2. **SECOND**: Use GitHub MCP tools (if available and wrapper doesn't fit)
3. **LAST**: Use `gh` CLI as final fallback

## Hard Rules
### Must
- Work on a non-`main` branch
- Ensure the working tree is clean before creating a PR
- Push the branch to `origin` before creating the PR
- Before creating the PR, post the **exact Title and Description** in chat
- Use the standard PR body template (Problem / Change / Verification / Screenshots)
- Use **Rebase and merge** for merging PRs to maintain a linear history (see `CONTRIBUTING.md`)

### Must Not
- Create PRs from `main`
- Use "Squash and merge" or "Create a merge commit"
- Use `--fill` or any heuristic that guesses title/body (not supported by the wrapper)

## Actions

### 0. Title + Description (Required)
Before running any PR creation command, provide in chat:

- **PR title** (exact)
- **PR description** (exact), using this template:

```markdown
## Problem
<why is this change needed?>

## Change
<what changed?>

## Verification
<how was it validated?>

## Screenshots
<!-- Optional: include if docs/features/NNN-.../screenshots/ exists.
     Use relative paths — GitHub renders them correctly in PR body from the branch.
     Omit this section entirely for non-visual changes. -->
```

### 1. Pre-flight Checks
```bash
git branch --show-current
scripts/git-status.sh --short
```

### 2. Push the Branch
```bash
git push -u origin HEAD
```

### 3. Create the PR

#### Preferred: Wrapper Script
Create a PR:
```bash
echo "## Summary\n\nPR description" | scripts/pr-github.sh create --title "<type(scope): summary>" --body-from-stdin
```

Create and merge (only when explicitly requested):
```bash
echo "## Summary\n\nPR description" | scripts/pr-github.sh create-and-merge --title "<type(scope): summary>" --body-from-stdin
```

#### Fallback: `gh` CLI (if wrapper unavailable)
```bash
echo "## Summary\n\nPR description" | PAGER=cat gh pr create \
  --base main \
  --head "$(git branch --show-current)" \
  --title "<type(scope): summary>" \
  --body-file -
```

### 4. Merge (Only When Explicitly Requested)
This repository requires **rebase and merge**.

#### Preferred: Wrapper Script
```bash
scripts/pr-github.sh merge <pr-number>
```

Or combined create-and-merge:
```bash
echo "## Summary\n\nPR description" | scripts/pr-github.sh create-and-merge --title "<type(scope): summary>" --body-from-stdin
```

#### Fallback: `gh` CLI (if wrapper unavailable)
```bash
PAGER=cat gh pr merge <pr-number> --rebase --delete-branch
```

### 5. If Rebase-Merge Is Blocked (Conflicts)
```bash
git pull --rebase origin main
# resolve conflicts

git push --force-with-lease
```

Then retry the merge.

## Why Prefer the Wrapper Script?

- Designed for permanent approval in VS Code (reduces friction)
- Enforces repo policies (rebase and merge, standard templates)
- Handles edge cases consistently
- Provides clear error messages
- Can be easily reproduced by Maintainers

## Note on GitHub MCP Tools

GitHub MCP tools may be available for PR creation in the future, but currently the wrapper script is the most reliable approach. If GitHub MCP tools add PR creation support, they would become the preferred option (with wrapper as fallback).
