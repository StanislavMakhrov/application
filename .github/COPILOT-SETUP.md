# GitHub Copilot Coding Agent Configuration

This repository uses GitHub Copilot coding agents for automated development workflows. This document describes the required repository configuration.

## Prerequisites

- **GitHub Copilot Pro+** (or Enterprise) subscription
- Copilot coding agent enabled in repository settings

## How It Works

1. **Setup Workflow**: `.github/workflows/copilot-setup-steps.yml`
   - Runs before the coding agent starts working
   - Installs Node.js 20 and npm dependencies

2. **Agent Definitions**: `.github/agents/*.agent.md`
   - Define agent roles, tools, and instructions
   - Auto-discovered by GitHub Copilot from the repository

3. **Agent Skills**: `.github/skills/*/SKILL.md`
   - Reusable workflows for common tasks (PR creation, testing, releases)

## Repository Settings (One-Time Setup)

Before Copilot coding agent can push code and auto-create PRs, two repository
settings must be configured by the Maintainer once:

### 1. Enable GitHub Actions workflow permissions

Go to **Settings → Actions → General → Workflow permissions** and make two
changes:

1. Select **"Read and write permissions"**
   _(currently: "Read repository contents and packages permissions" is selected)_
2. Check **"Allow GitHub Actions to create and approve pull requests"**
   _(currently: unchecked)_
3. Click **Save**

This makes the default `GITHUB_TOKEN` read+write for all scopes and allows
Actions to open PRs — matching the green-ledger configuration.

**Current workaround (already in place):** This repo keeps restricted defaults
and instead grants permissions explicitly in
`.github/workflows/copilot-setup-steps.yml`:

```yaml
permissions:
  contents: write
  pull-requests: write
```

Both approaches work. The explicit-permissions approach is already active so the
Copilot agent can auto-create PRs today. The UI change above is optional but
makes all future workflows simpler by not requiring per-workflow grants.

### 2. Enable Copilot coding agent

Go to **Settings → Copilot → Coding agent** and turn it **ON**.

## Usage

1. Complete the one-time setup above
2. Create an issue and assign it to `@copilot`
3. The workflow orchestrator agent delegates work to specialized agents automatically

## UAT (User Acceptance Testing)

UAT is performed manually by the Maintainer using Docker:
1. The UAT Tester agent builds the Docker image (`docker build`)
2. The Maintainer runs `docker run` and verifies the feature at http://localhost:3000
3. The Maintainer replies PASS or FAIL

No special tokens, separate repositories, or environments are required for UAT.

## Troubleshooting

### Agent cannot push code

Ensure the repository has GitHub Actions enabled and the default `GITHUB_TOKEN` has `contents: write` permission.

### Agent cannot create pull requests automatically

This repository uses **restricted default GITHUB_TOKEN permissions** (read-only).
The `copilot-setup-steps.yml` workflow must explicitly grant `pull-requests: write`
so the Copilot agent's token can open PRs. Without this, Copilot pushes the branch
but never creates a PR.

The required permissions block in `.github/workflows/copilot-setup-steps.yml`:

```yaml
permissions:
  contents: write
  pull-requests: write
```

Do **not** remove these — the commit message "Remove unnecessary GITHUB_TOKEN
permissions" in the repo history was incorrect. These permissions are necessary
for auto-PR creation in repos with restricted default token permissions.
