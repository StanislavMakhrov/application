# GitHub Copilot Coding Agent Configuration

This repository uses GitHub Copilot coding agents for automated development workflows. This document describes the required repository configuration.

## Prerequisites

- **GitHub Copilot Pro+** (or Enterprise) subscription
- Copilot coding agent enabled in repository settings
- **Repository setting**: Go to **Settings → Actions → General → Workflow permissions** and check **"Allow GitHub Actions to create and approve pull requests"** — this is required for the Copilot agent to open pull requests automatically

## How It Works

1. **Setup Workflow**: `.github/workflows/copilot-setup-steps.yml`
   - Runs before the coding agent starts working
   - Installs Node.js 20 and npm dependencies
   - The `permissions` block in this file applies to the setup steps only — **it does not affect the Copilot agent's own token**

2. **Agent Definitions**: `.github/agents/*.agent.md`
   - Define agent roles, tools, and instructions
   - Auto-discovered by GitHub Copilot from the repository

3. **Agent Skills**: `.github/skills/*/SKILL.md`
   - Reusable workflows for common tasks (PR creation, testing, releases)

## Usage

1. Push this repository to GitHub
2. Go to **Settings → Copilot → Coding agent → ON**
3. Go to **Settings → Actions → General** and check **"Allow GitHub Actions to create and approve pull requests"**
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

The Copilot coding agent uses its own GitHub App token (`GITHUB_COPILOT_API_TOKEN`) for all operations including PR creation. This token is **separate** from the `GITHUB_TOKEN` used by workflow steps.

The `permissions` block in `.github/workflows/copilot-setup-steps.yml` only applies to the **setup job** that runs before the agent starts — it has no effect on the agent's ability to create pull requests.

**Fix**: Enable the repository setting that allows GitHub Apps to open PRs:

1. Go to **Settings → Actions → General**
2. Under "Workflow permissions", check **"Allow GitHub Actions to create and approve pull requests"**
3. Click **Save**

Without this setting, the Copilot agent's token will receive a 403 "Resource not accessible by integration" error when trying to open pull requests, regardless of what permissions are listed in `copilot-setup-steps.yml`.
