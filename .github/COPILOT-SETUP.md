# GitHub Copilot Coding Agent Configuration

This repository uses GitHub Copilot coding agents for automated development workflows. This document describes the required repository configuration.

## Prerequisites

- **GitHub Copilot Pro+** (or Enterprise) subscription
- Copilot coding agent enabled in repository settings
- **`RELEASE_TOKEN` secret** — a classic Personal Access Token (PAT) with `repo` scope,
  stored as a repository secret. This is required for the agent to create pull requests.
  Without it, PR creation will fail with a 403 error.

## How It Works

1. **Setup Workflow**: `.github/workflows/copilot-setup-steps.yml`
   - Runs before the coding agent starts working
   - Installs Node.js 20 and npm dependencies

2. **Agent Definitions**: `.github/agents/*.agent.md`
   - Define agent roles, tools, and instructions
   - Auto-discovered by GitHub Copilot from the repository

3. **Agent Skills**: `.github/skills/*/SKILL.md`
   - Reusable workflows for common tasks (PR creation, testing, releases)

## Usage

1. Push this repository to GitHub
2. Go to **Settings → Copilot → Coding agent → ON**
3. Create an issue and assign it to `@copilot`, or open a session from the Agents tab / Copilot chat
4. The workflow orchestrator agent delegates work to specialized agents automatically
5. When the session completes, either:
   - Click **Create Pull Request** in the GitHub UI to open a PR with the agent's changes, or
   - Include "create a pull request" in your prompt and the agent will create it automatically

## UAT (User Acceptance Testing)

UAT is performed manually by the Maintainer using Docker:
1. The UAT Tester agent builds the Docker image (`docker build`)
2. The Maintainer runs `docker run` and verifies the feature at http://localhost:3000
3. The Maintainer replies PASS or FAIL

No special tokens, separate repositories, or environments are required for UAT.

## Troubleshooting

### Agent cannot push code

Ensure the repository has GitHub Actions enabled and the default `GITHUB_TOKEN` has `contents: write` permission.

### Agent cannot create pull requests (403 error)

The Copilot agent's built-in OAuth token (`ghu_`) is blocked from creating PRs by GitHub's
integration policy. The fix:

1. Create a classic PAT with `repo` scope at **Settings → Developer settings → Personal access tokens**
2. Store it as a repository secret named `RELEASE_TOKEN` (**Settings → Secrets and variables → Actions**)
3. The `copilot-setup-steps.yml` workflow exposes it as `GH_TOKEN` so the agent's `gh` commands use the PAT
