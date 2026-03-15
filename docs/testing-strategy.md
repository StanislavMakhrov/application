# Testing Strategy

## Overview

This document defines the testing strategy for `<project-name>` — a Next.js / TypeScript application. The strategy follows the **Testing Trophy** model: a pragmatic balance of static analysis, unit tests, integration tests, and end-to-end tests that maximises confidence while keeping the feedback loop fast.

```
        ▲
        │   E2E Tests              ← few, high-value, per-feature use cases
        │   Integration Tests      ← API routes, DB queries, server actions
        │   Unit Tests             ← pure functions, hooks, components
        │   Static Analysis        ← TypeScript, ESLint, type checks (widest base)
        ▼
```

**Guiding principles:**

- **Test behaviour, not implementation.** Tests should survive refactoring. Assert what the user sees or what the API returns — not internal state.
- **Fast feedback first.** Unit and integration tests must complete in seconds locally.
- **E2E tests guard real user journeys.** One E2E test per feature's primary use case.
- **Tests are first-class code.** Reviewed, maintained, and refactored like production code.
- **CI blocks on any failure.** All test types run on every PR.

---

## Test Stack

| Layer | Tool | Config file |
|-------|------|-------------|
| Static analysis | TypeScript (`tsc --noEmit`) + ESLint | `tsconfig.json`, `eslint.config.ts` |
| Unit & integration | [Vitest](https://vitest.dev/) | `vitest.config.ts` |
| Component (UI unit) | [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) + Vitest | — |
| API / server | Vitest + `node` environment | — |
| E2E | [Playwright](https://playwright.dev/) | `playwright.config.ts` |
| Coverage | Vitest built-in (V8) | `vitest.config.ts` |

---

## Test Types

### 1. Static Analysis

Static analysis is the cheapest safety net and runs on every file save in the IDE and in CI.

**What it covers:**
- Type correctness across the entire codebase
- ESLint rule violations (import order, no unused vars, React hooks rules, etc.)
- Unused exports, missing `await`, and other silent bugs

**Commands:**
```bash
# Type check
pnpm tsc --noEmit

# Lint
pnpm lint
```

**CI:** Runs before any tests. A type error or lint error blocks the pipeline immediately.

---

### 2. Unit Tests

Unit tests verify individual, isolated pieces of logic — pure functions, custom hooks, utility modules, and individual UI components.

**What belongs here:**
- Pure utility and helper functions (`lib/`, `utils/`)
- Custom React hooks (using `renderHook` from RTL)
- Individual UI components — rendering, interactions, conditional display
- Data-transformation functions (formatters, parsers, validators)
- State-machine or reducer logic

**What does NOT belong here:**
- Tests that require a real database, network, or file system
- Tests that render entire pages with router/session context
- Tests asserting implementation details (internal state, private methods)

**File convention:**

```
src/
  lib/
    format-date.ts
    format-date.test.ts       ← co-located unit test
  components/
    PlanCard/
      PlanCard.tsx
      PlanCard.test.tsx        ← co-located component test
  hooks/
    useDebounce.ts
    useDebounce.test.ts
```

**Example — pure function:**

```typescript
// lib/truncate.test.ts
import { describe, it, expect } from "vitest";
import { truncate } from "./truncate";

describe("truncate", () => {
  it("returns the original string when shorter than maxLength", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates and appends ellipsis when over maxLength", () => {
    expect(truncate("hello world", 8)).toBe("hello w…");
  });
});
```

**Example — React component:**

```typescript
// components/PlanCard/PlanCard.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlanCard } from "./PlanCard";

describe("PlanCard", () => {
  it("renders the plan name", () => {
    render(<PlanCard name="infra-prod" status="complete" />);
    expect(screen.getByText("infra-prod")).toBeInTheDocument();
  });

  it("calls onDelete when delete button is clicked", async () => {
    const onDelete = vi.fn();
    render(<PlanCard name="infra-prod" status="complete" onDelete={onDelete} />);
    await userEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
```

**Run:**
```bash
pnpm test:unit              # run once
pnpm test:unit --watch      # watch mode during development
```

---

### 3. Integration Tests

Integration tests verify that multiple units work correctly together — typically an API route end-to-end, a server action, or a component that relies on real context providers.

**What belongs here:**
- Next.js API route handlers (`app/api/**/route.ts`) — request in, response out
- Server actions with mocked database layer
- Components that consume context, router, or session providers
- Data-access functions with an in-memory or test database

**What does NOT belong here:**
- Browser interactions (use E2E tests for that)
- External third-party APIs (mock them at the network boundary)

**Mocking strategy:**

| Dependency | Approach |
|------------|----------|
| Database | In-memory SQLite or per-test transaction rollback |
| External HTTP APIs | `msw` (Mock Service Worker) handlers |
| Auth session | Mock `getServerSession` / `auth()` return value |
| File system | `memfs` or temp directory per test |
| Date / time | `vi.useFakeTimers()` |

**Example — API route:**

```typescript
// app/api/plans/route.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { POST } from "./route";
import { createMockRequest } from "@/test/helpers";
import { db } from "@/lib/db";

describe("POST /api/plans", () => {
  it("returns 201 and the new plan id on valid input", async () => {
    const req = createMockRequest({ body: { name: "test-plan" } });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toMatchObject({ id: expect.any(String) });
  });

  it("returns 400 when name is missing", async () => {
    const req = createMockRequest({ body: {} });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```

**Run:**
```bash
pnpm test:integration
```

---

### 4. E2E Tests (per Feature)

E2E tests are Playwright-based end-to-end tests that run against a fully booted application (local dev server or staging). **One E2E test per feature covers its primary happy-path use case.**

E2E tests are the only tests that validate the real browser experience: routing, authentication, form submissions, and visual feedback.

**Philosophy:**
- **One test = one user story.** Each test mirrors the acceptance criteria of a feature.
- **No white-box assertions.** Assert what the user sees — text, headings, URLs, toasts.
- **Idempotent.** Each test sets up and tears down its own data.
- **Tagged by feature.** Every E2E test file carries a `@feature-<id>` tag for targeted runs.

**File convention:**

```
e2e-tests/
    auth/
      login.e2e.ts           ← Feature 001: User Login
    plans/
      upload-plan.e2e.ts     ← Feature 003: Upload Plan
      view-plan-diff.e2e.ts  ← Feature 004: View Plan Diff
    settings/
      update-profile.e2e.ts  ← Feature 012: Update Profile
  fixtures/
    auth.fixture.ts            ← shared authenticated-user fixture
  helpers/
    seed.ts                    ← test data seeding utilities
```

**Example — feature E2E test:**

```typescript
// e2e-tests/plans/upload-plan.e2e.ts
import { test, expect } from "@playwright/test";
import { seedProject } from "../../helpers/seed";

// @feature-003
test.describe("Upload Plan [Feature 003]", () => {
  test("user can upload a Terraform plan and see the diff", async ({ page }) => {
    const { projectId } = await seedProject();

    await page.goto(`/projects/${projectId}`);
    await page.getByRole("button", { name: /upload plan/i }).click();
    await page.getByLabel("Plan file").setInputFiles("fixtures/sample.json");
    await page.getByRole("button", { name: /submit/i }).click();

    await expect(page.getByRole("heading", { name: /plan diff/i })).toBeVisible();
    await expect(page.getByText("3 to add")).toBeVisible();
  });
});
```

**Authenticated E2E tests** use a shared fixture to avoid re-logging in every test:

```typescript
// e2e-tests/settings/update-profile.e2e.ts
import { test, expect } from "../../fixtures/auth.fixture";

// @feature-012
test("user can update their display name", async ({ authenticatedPage }) => {
  await authenticatedPage.goto("/settings/profile");
  await authenticatedPage.getByLabel("Display name").fill("Alice Updated");
  await authenticatedPage.getByRole("button", { name: /save/i }).click();
  await expect(authenticatedPage.getByText("Profile saved")).toBeVisible();
});
```

**Run:**
```bash
pnpm test:e2e                         # all E2E tests (headless)
pnpm test:e2e --grep "@feature-003"  # single feature
pnpm test:e2e --headed               # with browser visible (debugging)
pnpm test:e2e --ui                   # Playwright UI mode
```

---

## Test Catalog

> _List E2E tests here as features are implemented. One row per E2E test file._

### E2E Tests

| Feature ID | File                             | Use Case |
|------------|----------------------------------|----------|
| `<001>` | `e2e-tests/<area>/<slug>.e2e.ts` | _primary happy-path description_ |
| `<002>` | `e2e-tests/<area>/<slug>.e2e.ts` | _primary happy-path description_ |

### Unit Tests

| Module | File | What it covers |
|--------|------|----------------|
| `<lib/format-date>` | `lib/format-date.test.ts` | _description_ |
| `<components/PlanCard>` | `components/PlanCard/PlanCard.test.tsx` | _description_ |

### Integration Tests

| Route / Action | File | What it covers |
|----------------|------|----------------|
| `POST /api/plans` | `app/api/plans/route.test.ts` | _description_ |

---

## Coverage

Coverage is collected by Vitest (V8 provider) for unit and integration tests. E2E tests are excluded from coverage because they test through the browser.

**Thresholds** (enforced in CI):

| Metric | Threshold |
|--------|-----------|
| Statements | ≥ 80 % |
| Branches | ≥ 75 % |
| Functions | ≥ 80 % |
| Lines | ≥ 80 % |

> Adjust thresholds in `vitest.config.ts` → `coverage.thresholds` as the codebase matures.

**Commands:**
```bash
pnpm test:coverage          # run all unit + integration tests with coverage
pnpm test:coverage --ui     # interactive coverage report in browser
```

Coverage reports are published as CI artifacts on every PR so reviewers can inspect uncovered branches.

---

## Test Data & Fixtures

| Type | Location                     | Purpose |
|------|------------------------------|---------|
| Unit test fixtures | `src/test/fixtures/`         | Static JSON / objects for unit tests |
| E2E seed helpers | `e2e-tests/helpers/seed.ts`  | Creates and cleans up DB records per test |
| MSW handlers | `src/test/mocks/handlers.ts` | Mock external HTTP APIs in integration tests |
| Playwright fixtures | `e2e-tests/fixtures/`        | Shared browser contexts (authenticated user, etc.) |

**Rules:**
- Every E2E test is responsible for its own data — seed in `test.beforeEach`, clean up in `test.afterEach`.
- Never share mutable state between tests.
- Fixtures that represent real-world payloads (e.g. Terraform plan JSON) live in `e2e-tests/fixtures/` and are version-controlled.

---

## Running Tests

### Full suite (CI order)

```bash
pnpm typecheck        # 1. Static: TypeScript
pnpm lint             # 2. Static: ESLint
pnpm test:unit        # 3. Unit tests
pnpm test:integration # 4. Integration tests
pnpm test:e2e         # 5. E2E tests (requires running app)
```

### During development

```bash
pnpm test:unit --watch                       # instant feedback while coding
pnpm test:unit --watch PlanCard              # filter to one file
pnpm test:e2e --grep "@feature-003" --headed # debug a specific E2E test
```

### Pre-commit hook

The pre-commit hook (managed by `husky` + `lint-staged`) runs on staged files only:

```
typecheck → lint → unit tests for changed files
```

E2E tests are **not** run pre-commit — they require a running server and are reserved for CI.

---

## CI Pipeline

```
┌─────────────────────────────────────────────────────┐
│  PR Validation                                      │
│                                                     │
│  1. typecheck & lint          (parallel, ~30 s)     │
│  2. unit + integration tests  (parallel, ~1–2 min)  │
│  3. coverage threshold check  (~5 s)                │
│  4. E2E tests                 (~3–5 min)            │
└─────────────────────────────────────────────────────┘
```

- Steps 1–3 run in parallel where possible.
- E2E tests run against a **preview deployment** spun up by the CI pipeline.
- A failed E2E test blocks merge. Flaky tests must be fixed or quarantined within one sprint.
- Coverage reports and Playwright traces are uploaded as CI artifacts for every PR.

---

## Flaky Test Policy

1. **A test that fails intermittently is treated as a bug**, not noise.
2. Mark with `test.fixme()` (Playwright) or `it.skip()` (Vitest) immediately with a linked issue.
3. The issue must be resolved within the current sprint.
4. Recurring flakiness in E2E tests → investigate use of `waitFor` / stable selectors / data isolation.

---

## Writing New Tests — Checklist

When implementing a new feature, the following tests are required before the PR is merged:

- [ ] Unit tests for all new pure functions and hooks
- [ ] Unit tests for new UI components (render + key interactions)
- [ ] Integration test for each new API route or server action
- [ ] E2E test covering the primary use case of the feature (tagged `@feature-<id>`)
- [ ] All existing tests still pass (`pnpm test`)
- [ ] Coverage thresholds still met (`pnpm test:coverage`)

---

## References

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Mock Service Worker (msw)](https://mswjs.io/)
- [Testing Trophy — Kent C. Dodds](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [Common Testing Mistakes — Kent C. Dodds](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

