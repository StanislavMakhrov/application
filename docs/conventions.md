# Coding Conventions

## Coding Standards

### Web Design
- Implement WCAG 2.1 AA accessibility best practices
- Use semantic HTML5 structure
- Ensure responsive design (mobile, tablet, desktop)
- Keep implementation simple and agent-maintainable (direct HTML/CSS preferred over complex frameworks)
- NEVER Create inaccessible designs (missing alt text, poor contrast, keyboard navigation issues)
- NEVER - Add marketing fluff or generic copy
- NEVER **Duplicate content across pages** - each page has a distinct purpose 

### TypeScript / Next.js Conventions

- Use TypeScript strict mode
- Prefer functional components with hooks
- Use Next.js App Router conventions (layout.tsx, page.tsx, route.ts)
- Use server components by default; mark client components with `"use client"` only when needed
- Prefer `const` over `let`; never use `var`
- Use named exports over default exports (except for Next.js page/layout conventions)
- Prefer async/await over raw Promises
- Use Prisma for all database access (no raw SQL)
- **Next.js request interception:** Use `proxy.ts` (not the deprecated `middleware.ts`) — see [Next.js middleware-to-proxy migration](https://nextjs.org/docs/messages/middleware-to-proxy)

### Code Quality

- **Lint:** ESLint with Next.js recommended config + Prettier
- **Pre-commit Hooks:** Husky (npm) runs lint + type check before commit
- **Dependency Updates:** Dependabot configured for npm and GitHub Actions
- **File Length:** Keep files under 200–300 lines; refactor at that point
- **No build warnings:** Resolve all deprecation warnings before marking work complete; do not leave deprecation (`⚠`) warnings in `next build` output

### Deprecated Packages to Avoid

When adding or updating npm dependencies, **never introduce** the following deprecated packages (use the replacements instead):

| Deprecated | Replacement | Reason |
|------------|-------------|--------|
| `rimraf@<4` | `rimraf@^4` | Versions prior to v4 are no longer supported |
| `@humanwhocodes/object-schema` | `@eslint/object-schema` | Package renamed under the ESLint org |
| `@humanwhocodes/config-array` | `@eslint/config-array` | Package renamed under the ESLint org |

If these appear as **transitive dependencies** (pulled in by another package), upgrade the direct dependency that brings them in, or pin overrides in `package.json` using the `overrides` field.

## CI/CD and Versioning

### Versioning Strategy

- Use [Semantic Versioning](https://semver.org/) (SemVer)
- Automate versioning with [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) based on [Conventional Commits](https://www.conventionalcommits.org/)
- Version tags use `v` prefix (e.g., `v1.0.0`)
- Docker images are tagged with full version; stable releases also include `latest`

### Commit Message Format

- Follow [Conventional Commits](https://www.conventionalcommits.org/) specification
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Breaking changes: Use `BREAKING CHANGE:` footer or `!` after type
- Pre-commit hooks enforce commit message format

### GitHub Actions Workflows

| Workflow | File | Trigger | Purpose |
|----------|------|---------|---------|
| PR Validation | `pr-validation.yml` | Non-draft PRs to `main` (ready for review, synchronize, reopened) | Lint, type check, test, `next build`, markdown lint |
| CI | `ci.yml` | Push to `main` | Run `commit-and-tag-version` to bump version and create tag |
| Release | `release.yml` | Version tags (`v*`) | Create GitHub Release, build and push Docker image to GHCR |

**Test Optimization:** Tests only run in PR Validation workflow to eliminate redundancy. CI workflow focuses solely on versioning after merge.

**Draft PR Workflow:** Coding agents create PRs as **drafts** so that PR Validation does not run on intermediate commits. PR Validation is triggered exactly once per work session by calling `scripts/pr-github.sh mark-ready` (which converts the draft to ready-for-review) only after all work is complete.

**Commit Guardrails:** Pull requests that only change workflow/internal tooling (e.g., `.github/`, `scripts/`, `docs/`) must not use version-bumping Conventional Commit types such as `feat:` or `fix:`. Use `chore:`, `docs:`, `ci:` instead.

### Branch Strategy

- `main` branch is always in a releasable state
- Feature branches created from `main` for new features or fixes
- Pull requests require passing validation checks before merge

**Branch Protection Limitation (Private Repos):**

- GitHub branch protection rules require GitHub Pro for private repositories
- Until the repository is made public, PRs CAN be merged before PR Validation completes
- **CRITICAL**: Agents and maintainers must manually verify PR Validation shows ✅ before merging
- The Release Manager agent enforces this requirement
