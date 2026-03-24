# GitHub Copilot Coding Agent Configuration

This repository uses GitHub Copilot coding agents for automated development workflows. This document describes the required repository configuration.

## Prerequisites

- **GitHub Copilot Pro+** (or Enterprise) subscription
- Copilot coding agent enabled in repository settings
- **`COPILOT_TOKEN` secret** — a classic Personal Access Token (PAT) with `repo` scope,
  stored as an **Environment secret** in the `copilot` environment
  (**Settings → Environments → copilot → Environment secrets → COPILOT_TOKEN**).
  This is required for the Release Manager agent (merge/release operations).
  > **Note:** This is separate from `RELEASE_TOKEN`, which is used by the release pipeline.

## How It Works

1. **Setup Workflow**: `.github/workflows/copilot-setup-steps.yml`
   - Runs before the coding agent starts working
   - Installs Node.js 20 and npm dependencies

2. **Agent Definitions**: `.github/agents/*.agent.md`
   - Define agent roles, tools, and instructions
   - Auto-discovered by GitHub Copilot from the repository

3. **Agent Skills**: `.github/skills/*/SKILL.md`
   - Reusable workflows for common tasks (testing, releases)

## Usage

1. Push this repository to GitHub
2. Go to **Settings → Copilot → Coding agent → ON**
3. Create an issue and assign it to `@copilot`, or open a session from the Agents tab / Copilot chat
4. The workflow orchestrator agent delegates work to specialized agents automatically
5. When all work is pushed and CI is green, click **"Create Pull Request"** in the GitHub Copilot session UI to create a session-linked PR

## How PRs are Created (Important)

PRs **must** be created from the GitHub Copilot session UI ("Create Pull Request" button), not by the agent using `gh pr create` / `scripts/pr-github.sh create`.

- **Session UI button** → PR is linked to the session → `@copilot` mentions continue the same session ✅
- **`gh pr create` / `scripts/pr-github.sh create`** → PR is unlinked → `@copilot` mentions start new sessions ❌

The `COPILOT_TOKEN` PAT and `scripts/pr-github.sh` are only used by the Release Manager agent for merge operations, not for regular PR creation.

## UAT (User Acceptance Testing)

UAT is performed manually by the Maintainer using Docker:
1. The UAT Tester agent builds the Docker image (`docker build`)
2. The Maintainer runs `docker run` and verifies the feature at http://localhost:3000
3. The Maintainer replies PASS or FAIL

No special tokens, separate repositories, or environments are required for UAT.

## Troubleshooting

### Agent cannot push code

Ensure the repository has GitHub Actions enabled and the default `GITHUB_TOKEN` has `contents: write` permission.

### Verifying the workflow works

To confirm the agent workflow is set up correctly, assign an issue to `@copilot` and check that:

1. The agent completes all work and pushes changes via `report_progress`
2. CI passes on the branch
3. You can click "Create Pull Request" in the GitHub Copilot session UI to create a linked PR
4. `@copilot` mentions in that PR continue the same session (no new session spin-up)
