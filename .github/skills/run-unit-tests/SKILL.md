---
name: run-unit-tests
description: Run project unit tests using npm test (Vitest) and validate the build with next build.
---

# Run Unit Tests

## Purpose

Provide standardized instructions for running tests and validating the build. Ensures agents use `npm test` for unit/integration tests and `npm run build` for build validation.

## When to Use This Skill

- Before committing code changes
- When verifying bug fixes or new features
- When running targeted tests during development
- When the full test suite must pass before marking work complete

## Hard Rules

### Must

- Use `npm test` for running the test suite
- Use `npm run build` (which runs `next build`) to validate the production build
- Run all npm commands from the `src/` directory (where `package.json` lives)
- Wait for test completion and check exit code (0 = pass, non-zero = fail)

### Must Not

- Never skip tests to make CI pass
- Never modify test expectations to match broken output — fix the code, not the tests
- Never ignore test failures

## Common Unit Test Commands

### Run Full Unit Test Suite

```bash
cd src
npm test

```

### Run Unit Tests in Watch Mode (during development)

```bash
cd src
npm run test:watch

```

### Run a Specific Unit Test File

```bash
cd src
npx vitest run path/to/test.test.ts

```

### Run Unit Tests Matching a Pattern

```bash
cd src
npx vitest run --reporter=verbose -t "pattern"

```

### Validate Production Build

```bash
cd src
npm run build

```

### Run Lint + Type Check

```bash
cd src
npm run lint
npm run type-check

```

## Troubleshooting

### Tests fail with module not found

Run `cd src && npm ci` to ensure all dependencies are installed.

### Build fails with type errors

Run `cd src && npm run type-check` to see TypeScript errors independently of the build.

### Database-related test failures

Run `cd src && npx prisma db push` to ensure the database schema is up to date, then retry.
