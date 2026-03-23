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

## Required Secrets

Two GitHub tokens are needed for the full CI/CD pipeline to work.

### 1. `GITHUB_TOKEN` (automatic — no setup needed)

This token is automatically injected by GitHub Actions into every workflow run. It does **not** need to be created or stored as a secret.

**What it is used for:**
- Pushing Docker images to GitHub Container Registry (GHCR) in PR Validation and Release workflows
- Writing PR check results

**What permissions it needs** (already configured in the workflow files):

| Workflow | Permissions required |
|----------|---------------------|
| `pr-validation.yml` | `contents: read`, `pull-requests: write`, `checks: write`, `packages: write` |
| `release.yml` | `contents: write`, `packages: write` |
| `copilot-setup-steps.yml` | `contents: write`, `pull-requests: write` |

> **Important:** This repository uses **restricted** default token permissions. Each workflow must explicitly declare `permissions:` — otherwise the token is read-only and workflows will fail silently.

---

### 2. `RELEASE_TOKEN` (must be created manually)

A **classic Personal Access Token (PAT)** with `repo` scope, stored as a repository secret named `RELEASE_TOKEN`.

**What it is used for:**

The `CI` workflow (`ci.yml`) runs after every merge to `main` and uses `commit-and-tag-version` to bump the version in `package.json`, commit the bump, and push a version tag (e.g. `v1.2.3`) back to `main`. The standard `GITHUB_TOKEN` cannot push commits that trigger subsequent GitHub Actions runs (GitHub prevents recursive workflow triggers from `GITHUB_TOKEN` pushes). A PAT authenticates as the token owner rather than the Actions bot, so pushes from it do trigger the downstream Release workflow.

**How to create it:**

1. Go to **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Click **Generate new token (classic)**
3. Set a descriptive note, e.g. `ci-version-bump-token`
4. Set expiration as desired (or "No expiration" for CI use)
5. Select the **`repo`** scope (includes `repo:status`, `public_repo`, `repo:write`)
6. Click **Generate token** and copy the value

**How to store it:**

1. Go to the repository → **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `RELEASE_TOKEN`
4. Value: paste the PAT you copied above
5. Click **Add secret**

> Without `RELEASE_TOKEN`, the CI workflow will fail at the checkout step and version bumps will not be pushed.

---

## Usage

1. Push this repository to GitHub
2. Go to **Settings → Copilot → Coding agent → ON**
3. Create `RELEASE_TOKEN` secret (see above)
4. Create an issue and assign it to `@copilot`
5. The workflow orchestrator agent delegates work to specialized agents automatically

## UAT (User Acceptance Testing)

UAT is performed manually by the Maintainer using Docker:
1. The UAT Tester agent builds the Docker image (`docker build`)
2. The Maintainer runs `docker run` and verifies the feature at http://localhost:3000
3. The Maintainer replies PASS or FAIL

No special tokens, separate repositories, or environments are required for UAT.

## Troubleshooting

### Agent cannot push code or create PRs

Ensure the repository has GitHub Actions enabled and `.github/workflows/copilot-setup-steps.yml` has the following permissions block at the workflow level:

```yaml
permissions:
  contents: write
  pull-requests: write
```

Without these explicit permissions, the `GITHUB_TOKEN` only has read access (when the repository's default token permissions are set to "restricted"), and the agent cannot push branches or have GitHub auto-create PRs on its behalf.
