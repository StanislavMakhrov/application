# GitHub Copilot Coding Agent Configuration

This repository uses GitHub Copilot coding agents for automated development workflows. This document describes the required repository configuration.

## Prerequisites

- **GitHub Copilot Pro+** (or Enterprise) subscription
- Copilot coding agent enabled in repository settings
- **`RELEASE_TOKEN` secret** *(recommended)* — a classic PAT with `repo` scope added to repository secrets. Required for the Copilot agent to create pull requests unless you enable the "Allow GitHub Actions to create and approve pull requests" repository policy instead. See Troubleshooting below.

## How It Works

1. **Setup Workflow**: `.github/workflows/copilot-setup-steps.yml`
   - Runs before the coding agent starts working
   - Installs Node.js 20 and npm dependencies
   - Exposes `RELEASE_TOKEN` as `GH_TOKEN` so the agent can create pull requests

2. **Agent Definitions**: `.github/agents/*.agent.md`
   - Define agent roles, tools, and instructions
   - Auto-discovered by GitHub Copilot from the repository

3. **Agent Skills**: `.github/skills/*/SKILL.md`
   - Reusable workflows for common tasks (PR creation, testing, releases)

## Usage

1. Push this repository to GitHub
2. Go to **Settings → Copilot → Coding agent → ON**
3. Add `RELEASE_TOKEN` secret to repository secrets (Settings → Secrets and variables → Actions)
4. Create an issue and assign it to `@copilot`
5. The workflow orchestrator agent delegates work to specialized agents automatically

## UAT (User Acceptance Testing)

UAT is performed manually by the Maintainer using Docker:
1. The UAT Tester agent builds the Docker image (`docker build`)
2. The Maintainer runs `docker run` and verifies the feature at http://localhost:3000
3. The Maintainer replies PASS or FAIL

No special tokens, separate repositories, or environments are required for UAT.

## Troubleshooting

### Agent cannot push code

Ensure the repository has GitHub Actions enabled and the default `GITHUB_TOKEN` has `contents: write` permission (Settings → Actions → General → Workflow permissions → "Read and write permissions").

### Agent gets 403 when creating a pull request

The Copilot coding agent uses a `ghu_` OAuth token (user-to-server token) for its operations. GitHub's infrastructure auto-creates the PR at the end of a successful agent session using this token. If PR creation fails, check both of the following settings.

The `permissions` block in `.github/workflows/copilot-setup-steps.yml` controls the `GITHUB_TOKEN` scopes for the setup steps job, **not** the agent's OAuth token. Setting `pull-requests: write` in the workflow permissions does **not** bypass this restriction.

**Required: Enable the repository policy that allows GitHub Apps to open PRs.**

1. Go to **Settings → Actions → General**
2. Under "Workflow permissions", set **"Read and write permissions"**
3. Check **"Allow GitHub Actions to create and approve pull requests"**
4. Click **Save**

**Optional but recommended: Add a classic PAT as `RELEASE_TOKEN` repository secret** (allows agents to create PRs manually via `scripts/pr-github.sh`, independent of the policy above).

1. Create a classic PAT at <https://github.com/settings/tokens> with `repo` scope
   - Set an expiration date (90 days recommended) and rotate it before it expires
2. Go to **Settings → Secrets and variables → Actions → New repository secret**
3. Name: `RELEASE_TOKEN`, Value: the PAT you created
4. The `copilot-setup-steps.yml` workflow automatically exposes this as `GH_TOKEN`
