---
name: update-test-snapshots
description: Regenerate test snapshot (golden file) baselines after intentional UI or output changes. Use after modifying rendering logic, templates, or UI components.
compatibility: Requires Node.js and project dependencies installed.
---

# Update Test Snapshots

## Purpose
Regenerate test snapshot baselines when intentional changes are made to rendered output. This updates the expected outputs that snapshot tests compare against.

## Hard Rules

### Must
- Review the git diff of snapshot changes before committing
- Understand **why** snapshots changed before accepting them
- Only update snapshots after intentional, reviewed changes to output

### Must Not
- Update snapshots without understanding why they changed
- Blindly accept all snapshot changes — verify each diff
- Skip reviewing diffs before committing

## Actions

### Vitest Snapshots (unit/integration)

Update all Vitest snapshots:

```bash
cd src && npm test -- --update-snapshots
```

Or update snapshots for a specific test file:

```bash
cd src && npx vitest run path/to/test.test.ts --update-snapshots
```

### Playwright Visual Snapshots (e2e)

Update Playwright screenshots used as visual regression baselines:

```bash
cd src && npx playwright test --update-snapshots
```

Or for a specific test:

```bash
cd src && npx playwright test e2e/feature.spec.ts --update-snapshots
```

## After Running

Always review the changes:

```bash
scripts/git-diff.sh src/
```

Verify the diffs match your expectations, then commit:

```bash
git add src/
git commit -m "test: update snapshots after [describe change]"
```

## When to Use
- After intentionally modifying UI components or rendered output
- After changing templates, formatters, or display logic
- After adding new snapshot tests
- When snapshot tests fail due to expected, reviewed changes
