---
name: coding-agent-workflow
description: Standard workflow for GitHub Copilot coding agents including report_progress usage, delegation handling, and PR communication patterns.
---

# Coding Agent Workflow Skill

## Purpose
Provides the standard operational workflow that all GitHub Copilot coding agents must follow when executing tasks in pull requests.

## When to Use
This skill is automatically loaded by all coding agents. It defines the core workflow for:
- Handling questions (direct vs delegated contexts)
- Reporting progress with the `report_progress` tool
- Creating summary comments after work completion

## Workflow

**You are running as a GitHub Copilot coding agent.** Follow this workflow:

### CRITICAL: Branch and PR Management

**GitHub Copilot automatically creates a branch** - you do NOT create it:
- When an issue is assigned to `@copilot` or a session starts, GitHub automatically creates a `copilot/*` branch
- When you start working, you're already on the correct branch
- **NEVER run `git checkout`, `git switch`, or `git branch` commands** - you're already on the right branch
- Your job is to commit work to the existing branch using `report_progress` (which handles git push automatically)

**Why manual branch creation fails:**
- Manual `git checkout -b` commands will fail (permission denied)
- Branch creation is GitHub's responsibility, not yours

**Pull Request Creation:**
- GitHub no longer automatically creates a draft PR when a session starts
- The agent is responsible for creating the PR at the end of the session using the **`create-pr-github`** skill
- After all work is pushed with `report_progress` and CI is green, always invoke the `create-pr-github` skill to open the PR
- Never create a duplicate PR if one already exists for your branch

1. **For Direct Questions (When Running as Primary Agent)**: If you are the primary agent on a PR (not delegated via `task` tool), you can create PR comments to ask the Maintainer questions. Wait for a response before proceeding.

2. **For Delegated Execution (When Invoked via `task` Tool)**: If you were invoked by the Workflow Orchestrator via the `task` tool, you run in an isolated context. In this case:
   - **DO NOT attempt to create PR comments** - you cannot access the parent PR from your isolated context
   - **Include questions in your response** - return them as part of your output text
   - **The orchestrator will forward your questions** to the maintainer and resume you with answers
   - **Wait for the orchestrator to re-invoke you** with the maintainer's answer
   - **You MUST use `edit`/`create` tools to apply all file changes** - do not just describe changes; actually apply them
   - **You MUST use `git commit` to commit your changes** — `report_progress` is NOT available to subagents; use `git add <files> && git commit -m "type: message"` instead (see step 4 for details)

3. **Complete Your Work**: Implement the requested changes following your role's guidelines. **Use `edit`/`create` tools to apply all file modifications** — never just describe or list changes without applying them.

4. **Commit and Push Changes**:

   - **Primary agent** (running the top-level PR): Use the `report_progress` tool. It handles `git add`, `git commit`, and `git push` automatically with the GitHub Actions token. Manual `git push` fails (no personal credentials). Call it with:
     - `commitMessage`: Conventional commit message (e.g., "feat: add feature X")
     - `prDescription`: Markdown checklist showing completed and remaining work

     ```
     report_progress(
       commitMessage="feat: implement user authentication",
       prDescription="""
       - [x] Add authentication service
       - [ ] Add authorization middleware
       """
     )
     ```

   - **Delegated subagent** (spawned via `task` tool): **`report_progress` is NOT available** — it exists only in the primary agent's tool context. Use `git commit` instead:
     ```bash
     git add <changed files>
     git commit -m "type: description of changes"
     # Do NOT run git push — it will fail with HTTP 403
     ```
     Your commits accumulate in the local branch. When the parent agent calls `report_progress`, ALL local commits (including yours) are pushed to the remote PR branch.

4a. **Watch PR Validation and Fix Failures (primary agent only)**:

   PR Validation only runs on **non-draft** PRs. It is triggered when you call
   `scripts/pr-github.sh mark-ready` (step 4b) to convert the draft to ready-for-review.

   After calling `mark-ready`, load and follow the **`watch-pr-validation`** skill:

   - Find the automatically-triggered PR Validation run for your branch
   - Watch it until completion
   - If it **fails**: read the error logs, fix the issues, re-run `pre-push-validation`
     locally, call `report_progress` again (PR stays ready, new commit triggers validation again), and repeat
   - Only proceed to the next step once CI is **green**

   **Do not hand off to the next agent with a failing build.**

4b. **Create the Pull Request and Trigger Validation (primary agent only)**:

   Once all work is committed and pushed via `report_progress`, use the **`create-pr-github`** skill to open the PR. The agent is
   responsible for creating the PR — do not wait for the user to click "Create Pull Request"
   in the GitHub UI.

   - Check first that no open PR already exists for this branch
   - Use the standard PR body template (Problem / Change / Verification)
   - PRs are created as **drafts** — PR Validation does NOT run on draft PRs
   - After creating the draft PR, call `scripts/pr-github.sh mark-ready` to convert it to
     ready-for-review. This is the **single trigger** for PR Validation and ensures the
     pipeline only runs once the work is complete.

   ```bash
   # After report_progress has pushed all commits:
   echo "..." | scripts/pr-github.sh create --title "feat: ..." --body-from-stdin
   scripts/pr-github.sh mark-ready
   ```

5. **Create Summary Comment (After PR Created)**: Post a PR comment with:
   - **Summary**: Brief description of what you completed
   - **Changes**: List of key files/features modified
   - **Next Agent**: Recommend which agent should continue the workflow (see docs/agents.md for workflow sequence)
   - **Status**: Ready for next step, or Blocked (with reason)
   
   **Note**: If you're running in delegated mode (via `task` tool), include this summary in your response text instead of creating a PR comment.

**Example Summary Comment:**
```
✅ Implementation complete

**Summary:** Implemented feature X with tests and documentation

**Changes:**
- Added FeatureX.cs with core logic
- Added FeatureXTests.cs with 15 test cases
- Updated README.md

**Next Agent:** Technical Writer (to review documentation)
**Status:** Ready
```

## Key Principles

- **GitHub creates branches automatically** - never attempt to create or switch branches yourself
- **Agent creates draft PRs** - after pushing all work with `report_progress`, use the `create-pr-github` skill to create a **draft** PR; do NOT wait for the user to click "Create Pull Request" in the GitHub UI
- **Always call `mark-ready` after creating the PR** - run `scripts/pr-github.sh mark-ready` to convert the draft to ready-for-review; this is the single trigger for PR Validation
- **Never create a duplicate PR** - check if one already exists for your branch before creating
- **`report_progress` is only available to the primary agent** - subagents spawned via `task` tool must use `git commit` instead
- **Always use `report_progress`** for commits and pushes (primary agent) - never use manual `git push` commands
- **Subagents MUST `git commit` before completing** - uncommitted changes will be lost if only in memory; the parent's `report_progress` can pick up uncommitted files via `git add .` but this is a fallback, not the primary mechanism
- **Always use `edit`/`create` tools** to apply file changes - never just describe changes in your response without applying them
- **Respect execution context** - behave differently when delegated vs primary agent
- **Monitor CI after every push** - load the `watch-pr-validation` skill after each `report_progress` call; fix failures and re-push until green before handing off
- **Communicate clearly** - provide complete summaries with status and next steps
- **Track progress** - use markdown checklists in PR descriptions to show work completed and remaining
