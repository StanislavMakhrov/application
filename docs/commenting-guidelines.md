# Code Commenting Guidelines

This document defines the standards for code comments in this project. Well-written comments make code more maintainable and help both human developers and AI agents understand and reason about the codebase.

The project uses **TypeScript** (Next.js frontend, API routes). The conventions below apply to all TypeScript code in the project.

---

## Core Principles

1. **Comments explain "why", not "what"**
   - The code itself shows *what* it does — comments explain *why* a particular approach was chosen.
   - Provide context that cannot be inferred from reading the code alone.

2. **All exported and public members must be documented**
   - TypeScript: all exported functions, classes, types, interfaces, and React components.
   - Private/internal members only need comments when the intent is non-obvious.

3. **Comments must add value**
   - Don't repeat what's already obvious from the code or type signatures.
   - Provide additional context, reasoning, constraints, or edge cases.
   - Link to relevant specifications, ADRs, or feature docs when applicable.

4. **Keep comments synchronized with code**
   - Update comments whenever code changes.
   - Outdated comments are worse than no comments.

5. **Self-documenting code first**
   - Prefer clear naming and small functions over comments that explain tangled code.
   - If you need a comment to explain *what* the code does, consider refactoring instead.

---

## TypeScript / Next.js

### JSDoc Comments

Use [JSDoc](https://jsdoc.app/) (`/** ... */`) for all exported symbols. TypeScript types are already expressed in the signature — JSDoc should add *semantic* context, not restate types.

#### Functions and API Route Handlers

```typescript
/**
 * Fetches paginated plan records for a given project.
 *
 * Sorting defaults to `createdAt DESC` because the UI always shows newest
 * plans first. Passing a different `sortBy` is supported but not exposed in
 * the public API yet (see TODO below).
 *
 * @param projectId - UUID of the project whose plans are fetched.
 * @param options - Pagination and filtering options.
 * @returns Paginated list of plan summaries. Empty `items` when none exist.
 * @throws {NotFoundError} When the project does not exist.
 * @throws {ForbiddenError} When the caller lacks read access to the project.
 *
 * @see {@link PlanSummary} for the shape of each item.
 * @see docs/features/003-plan-list/specification.md
 */
export async function fetchPlans(
  projectId: string,
  options: FetchPlansOptions,
): Promise<PaginatedResult<PlanSummary>> {
  // implementation
}
```

**Required tags:**
- `@param` — one per parameter; describe purpose and constraints, not the type (TypeScript already has that).
- `@returns` — what the resolved value contains; note empty/null cases explicitly.

**Conditional tags:**
- `@throws` — document every error class the function can raise that the caller must handle.
- `@see` — link to related symbols or feature docs.
- `@example` — add for non-trivial public utilities (see below).

#### React Components

```typescript
/**
 * Renders the diff view for a single Terraform resource change.
 *
 * Sensitive attribute values are masked by default. Pass `showSensitive`
 * to reveal them — only intended for admin views where the user has
 * explicitly opted in (see ADR-007).
 *
 * @param props.change - The resource change to display.
 * @param props.showSensitive - When true, raw sensitive values are shown.
 *   Defaults to false.
 */
export function ResourceChangeDiff({
  change,
  showSensitive = false,
}: ResourceChangeDiffProps) {
  // implementation
}
```

- Document props inline via `@param props.<name>` rather than repeating the `Props` interface definition.
- Skip obvious props like `className` or `children` unless they have constraints.
- Note any side effects, portals, or context dependencies in the component body.

#### Interfaces and Types

```typescript
/**
 * Options accepted by {@link fetchPlans}.
 */
export interface FetchPlansOptions {
  /** Maximum number of records per page. Must be between 1 and 100. */
  pageSize: number;

  /**
   * Cursor for keyset pagination returned by the previous call.
   * Omit to start from the first page.
   */
  cursor?: string;

  /**
   * ISO 8601 date string. Only plans created on or after this date are
   * returned. Useful for filtering recent CI runs.
   */
  since?: string;
}
```

- Use single-line `/** ... */` for brief property descriptions.
- Use multi-line for constraints, defaults, or valid value ranges.

#### Constants and Module-Level Variables

```typescript
/**
 * Maximum number of resources rendered in a single diff view without
 * virtualisation. Above this threshold the component switches to a
 * windowed list to keep initial render time under 100 ms.
 *
 * Benchmark result: docs/adr/009-virtualised-diff-list.md
 */
export const DIFF_VIRTUALISATION_THRESHOLD = 200;
```

#### Examples in JSDoc

Use `@example` for complex utilities and helper functions:

```typescript
/**
 * Truncates a string to the given byte length, appending an ellipsis when
 * the string is cut. Safe for multi-byte Unicode characters.
 *
 * @param value - The string to truncate.
 * @param maxBytes - Maximum byte length of the output, including the ellipsis.
 * @returns Truncated string, or the original if it fits within `maxBytes`.
 *
 * @example
 * truncateBytes("Hello, world!", 8);
 * // → "Hello…"
 *
 * truncateBytes("Hi", 8);
 * // → "Hi"
 */
export function truncateBytes(value: string, maxBytes: number): string {
  // implementation
}
```

---

### Next.js–Specific Conventions

#### `page.tsx` and `layout.tsx`

Always document:
- **Data fetching strategy** — why SSR, SSG, or ISR was chosen.
- **Auth / access control** — what session checks happen before render.
- **Revalidation intervals** — when and why cache is invalidated.

```typescript
/**
 * Project dashboard page (Server Component).
 *
 * Rendered server-side on every request so that plan counts are always
 * fresh. We intentionally skip ISR here because stale counts cause
 * confusion after a CI run completes (see issue #412).
 *
 * Access control: redirects to /login when the session is missing.
 */
export default async function ProjectPage({ params }: PageProps) {
  // implementation
}
```

#### `route.ts` (App Router API Routes)

```typescript
/**
 * POST /api/plans
 *
 * Accepts a multipart upload of a Terraform JSON plan file and stores it
 * for the authenticated user's active project.
 *
 * Rate-limited to 10 requests per minute per user to prevent abuse.
 * Limit is enforced in the middleware layer, not here.
 *
 * @returns 201 with the created plan ID on success.
 * @returns 400 when the uploaded file is not valid Terraform JSON.
 * @returns 413 when the file exceeds the 50 MB size limit.
 */
export async function POST(request: Request): Promise<Response> {
  // implementation
}
```

#### Server Actions

```typescript
/**
 * Deletes a plan and all associated diff data.
 *
 * This is a destructive, non-reversible operation. The action is
 * intentionally not exposed through the public API — only available
 * from the owner's project settings UI to reduce accidental deletions.
 *
 * @param planId - UUID of the plan to delete.
 * @throws {ForbiddenError} When the caller is not the plan owner.
 */
"use server";
export async function deletePlan(planId: string): Promise<void> {
  // implementation
}
```

---

### Inline Implementation Comments (TypeScript)

Use `//` for inline comments inside function bodies.

**When to use:**

```typescript
// Binary search: role definitions are sorted by ID at load time (O(log n))
const index = binarySearch(roleDefinitions, targetId);

// WORKAROUND: next/image does not support SVG data URIs in Safari 16.
// Use a plain <img> tag until the upstream bug is resolved.
// See: https://github.com/vercel/next.js/issues/XXXXX
<img src={svgDataUri} alt={alt} />;

// Debounce delay matches the UX spec (docs/features/011-search/specification.md §3.2).
// Do not lower this — it causes excessive API calls on slow connections.
const SEARCH_DEBOUNCE_MS = 350;
```

**When NOT to use:**

```typescript
// ❌ Restates the code
const total = items.length; // get length of items

// ❌ Obvious control flow
if (!user) {
  return null; // return null if no user
}

// ✅ Only comment when there is a non-obvious reason
if (!user) {
  // Unauthenticated visitors see a public placeholder — do not redirect
  // here because this route is also used in email preview links.
  return <PublicPlaceholder />;
}
```

---


## Traceability to Features

When a function, class, or component implements a specific feature, reference it in comments.

```typescript
/**
 * Generates the summary table HTML showing resource counts by change type.
 *
 * @see docs/features/005-summary-resource-type-breakdown/specification.md
 */
export function SummaryTable({ changes }: SummaryTableProps) {
  // implementation
}
```


This helps trace code back to requirements and makes impact analysis easier during changes.

---

## Lint Suppression

Suppress linter warnings sparingly. Prefer refactoring over suppressing.

```typescript
// Required: explain why the rule is suppressed and when it can be removed.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// `any` needed here because the third-party SDK exposes untyped webhook
// payloads. Replace once SDK v4 ships typed events (tracked in #456).
const payload = event.data as any;
```

- Always use `eslint-disable-next-line` (not file-level disables) unless the entire file is generated code.
- Include a justification comment directly above the suppression line.


---

## Comment Maintenance

### During Code Reviews

Reviewers must verify:
- All exported / public members have JSDoc comments.
- Comments explain "why", not just "what".
- Feature references are present where applicable.
- No outdated comments remain after refactoring.
- Lint suppressions include a justification and issue reference.

### During Refactoring

When modifying code:
1. Update all affected JSDoc comments.
2. Review inline comments for accuracy; remove comments that no longer apply.
3. Add new comments for new non-obvious logic.
4. Update `@see` / `@link` references if related docs move.

---

## Tooling Summary

| Language   | Doc comment style | Linter / Formatter             | Enforced in CI |
|------------|-------------------|--------------------------------|---------------|
| TypeScript | JSDoc `/** */`    | ESLint + `eslint-plugin-jsdoc` | ✅ |

Ensure the linter runs in pre-commit hooks and in CI so doc-comment coverage is always validated.

---

## References

- [JSDoc Reference](https://jsdoc.app/)
- [TypeDoc Documentation](https://typedoc.org/)
- [Google TypeScript Style Guide — Comments](https://google.github.io/styleguide/tsguide.html#comments-documentation)
- [Next.js Documentation](https://nextjs.org/docs)

---

## Summary

Good comments serve as documentation for both current and future maintainers (human and AI). They should:

- ✅ Explain *why* decisions were made
- ✅ Cover all exported / public symbols
- ✅ Document parameters, return values, and thrown exceptions
- ✅ Provide context not visible from code or type signatures
- ✅ Reference specifications and features for traceability
- ✅ Stay synchronized with code changes
- ✅ Include issue numbers in TODOs and suppression justifications
- ❌ Not simply repeat what the code or type annotations already show
