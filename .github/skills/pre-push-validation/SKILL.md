---
name: pre-push-validation
description: Run all PR Validation checks locally before pushing to ensure the PR passes CI without maintainer intervention.
---

# Pre-Push Validation

## Purpose

Run the same checks that the `PR Validation` GitHub Actions workflow executes, **locally before pushing code**. This ensures PRs pass CI on the first attempt and the Maintainer only needs to review — not fix CI failures.

## Who Uses This Skill

**Only agents that produce or modify source code.** Primarily:

- **Developer** — after implementing features/fixes, before pushing
- **Any coding agent that edits source files** — before pushing

**This skill MUST NOT be used by the Workflow Orchestrator.** The orchestrator never writes code and must delegate all validation work to the Developer agent.

## When to Use This Skill

- **Before every `report_progress` call** (coding agent primary)
- **Before every `git commit` that will be pushed** (coding agent subagent — the parent will push)
- After completing implementation work and before handing off to the next agent
- After any rework (code review fixes, UAT fixes, build failure fixes)

## Hard Rules

### Must

- Run **all** validation steps in order before pushing
- Fix any failures before pushing — do not push code that fails validation
- Re-run validation after fixing failures to confirm the fix works
- Run all npm commands from the `src/` directory (where the source code lives)

### Must Not

- Skip validation steps to save time
- Push code that fails any validation step
- Modify test expectations or linter config to make validation pass — fix the code instead
- Assume previous validation results are still valid after making changes

## Validation Steps

Run these steps **in order**. Stop at the first failure, fix it, then restart from that step.

### 1. Install Dependencies (if needed)

```bash
cd src && npm ci
```

Only needed if `package-lock.json` changed or `node_modules/` is missing.

### 2. Lint

```bash
cd src && npm run lint
```

Checks ESLint rules. Fix any lint errors before proceeding.

### 3. Type Check

```bash
cd src && npm run type-check
```

Validates TypeScript types. Fix any type errors before proceeding.

### 4. Test

```bash
cd src && npm test
```

Runs the Vitest test suite. All tests must pass. Fix any test failures before proceeding.

### 5. Build

```bash
cd src && npm run build
```

Runs `next build` to validate the production build. Fix any build errors before proceeding.

### 6. Docker Build (if Dockerfile or docker/** changed)

```bash
scripts/docker-build-test.sh
```

Builds the Docker image locally (linux/amd64, no push) to catch Dockerfile and image-build
errors before they reach CI. This is the most common source of PR Validation failures.

**Always run this step when any of the following changed:**
- `Dockerfile`
- `docker/**`
- `prisma/**`
- `package.json` / `package-lock.json`

Gap vs. CI: CI also builds `linux/arm64`. The local build only validates `linux/amd64`.
This still catches the vast majority of failures (syntax errors, missing files, bad package
names, Prisma generation errors, `next build` errors inside Docker).

### 7. Markdown Lint (if markdown files changed)

```bash
npx markdownlint-cli2 "**/*.md" "#node_modules" "#CHANGELOG.md"
```

Run from the repository root. Checks all markdown files for style issues. Fix any markdown
lint errors before proceeding.

## Quick Reference (Copy-Paste)

Run all checks in sequence (from `src/`):

```bash
cd src && npm run lint && npm run type-check && npm test && npm run build
```

With Docker build validation (when Dockerfile or docker/ changed):

```bash
cd src && npm run lint && npm run type-check && npm test && npm run build && cd .. && scripts/docker-build-test.sh
```

With markdown lint (when .md files changed):

```bash
npx markdownlint-cli2 "**/*.md" "#node_modules" "#CHANGELOG.md"
```

## Determining If Validation Is Needed

The PR Validation workflow skips checks when only docs/agent-instruction files change. Apply the same logic:

- If **only** files under `docs/`, `.github/agents/`, `.github/skills/`, `.github/copilot-instructions.md`, `.github/gh-cli-instructions.md`, or `.github/pull_request_template.md` changed → skip steps 1–6, only run step 7 (markdown lint)
- If `Dockerfile`, `docker/**`, `prisma/**`, or `package*.json` changed → also run step 6 (Docker build)
- If **any** other files changed → run steps 1–5 at minimum

Check which files changed:

```bash
scripts/git-status.sh --short
```

## Troubleshooting

### Lint fails with unfixable errors

Run `cd src && npx eslint --fix .` to auto-fix what's possible, then manually fix the rest.

### Type check fails but tests pass

Type errors can exist without causing runtime failures. Run `cd src && npm run type-check` independently to see the full error list.

### Build fails with "Module not found"

Ensure all imports are correct and new dependencies are in `src/package.json`. Run `cd src && npm ci` to refresh.

### Docker build fails with Alpine package errors

The Dockerfile uses `node:20-alpine` (Alpine 3.20+). Use unversioned package names:
`postgresql` and `postgresql-client` (not `postgresql15` or `postgresql16`).

### Docker build fails with "not found" for a copied directory

Ensure the directory exists in the repo (add a `.gitkeep` if empty) and that the
`Dockerfile` builder stage creates it with `RUN mkdir -p /path` before copying.

### Markdown lint fails

Check the specific rule violation and fix the markdown formatting. Common issues: trailing
whitespace, missing blank lines, inconsistent heading levels.

