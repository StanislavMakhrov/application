# Issue: CI Release Pipeline Fails — Docker Build Context Mismatch

## Problem Description

The release CI pipeline fails during the Docker `Build and Push` step with errors like:

```
ERROR: failed to build: failed to solve: failed to compute cache key:
failed to calculate checksum of ref ...: "/docker/healthcheck.sh": not found
```

Docker cannot find `src/`, `public/`, `prisma/`, `docker/healthcheck.sh`, and
`docker/supervisord.conf` during the image build because the build context supplied
to Docker is `./src` (the application source directory), while the `Dockerfile` was
authored assuming the **repository root** (`.`) is the build context.

## Steps to Reproduce

1. Push a tag matching `v*` to the `main` branch (or trigger the release workflow via
   `workflow_dispatch`).
2. Observe the **Build and Push** step in the `docker` job of the `Release` workflow.
3. The step fails with "not found" errors for every path that sits outside `./src/`.

## Expected Behavior

The Docker image builds successfully and is pushed to GHCR with the correct version tags.

## Actual Behavior

The build fails with errors similar to:

```
=> ERROR [builder 4/8] COPY src/ .
...
ERROR [builder 4/8] COPY prisma/ ./prisma/
...
ERROR failed to compute cache key: "/docker/healthcheck.sh": not found
```

On `arm64` the build additionally fails at:
```
COPY docker/supervisord.conf /etc/supervisord.conf
```
(on `amd64` this layer is usually cached, hiding the error for that platform).

## Root Cause Analysis

### Affected Files

| File | Role |
|------|------|
| `.github/workflows/release.yml` | Sets `context: ./src` for Docker build — **incorrect** |
| `src/Dockerfile` | Written for repo-root build context — paths are correct for `.` |

### What's Broken

In `.github/workflows/release.yml` the `docker/build-push-action` step specifies:

```yaml
- name: Build and push
  uses: docker/build-push-action@v7
  with:
    context: ./src          # ← BUG: context is scoped to ./src
    push: true
    ...
```

Because no `file:` key is given, Docker infers the Dockerfile from `<context>/Dockerfile`,
which correctly resolves to `./src/Dockerfile`. However, every `COPY` instruction inside
that Dockerfile is evaluated **relative to the supplied context root** (`./src`), not the
repository root. The Dockerfile contains:

```dockerfile
# Stage 1 – builder
COPY src/       .            # looks for ./src/src/   — does NOT exist
COPY prisma/    ./prisma/    # looks for ./src/prisma/ — does NOT exist
COPY public/    ./public/    # looks for ./src/public/ — does NOT exist

# Stage 2 – runner
COPY prisma/    ./prisma/    # same problem
COPY docker/supervisord.conf /etc/supervisord.conf   # ./src/docker/ — does NOT exist
COPY docker/healthcheck.sh   /docker/healthcheck.sh  # ./src/docker/ — does NOT exist
```

All of those source directories and files exist at the **repository root**, not inside
`./src/`:

```
/repo-root
├── docker/
│   ├── healthcheck.sh     ✅ exists at repo root
│   └── supervisord.conf   ✅ exists at repo root
├── prisma/                ✅ exists at repo root
├── public/                ✅ exists at repo root
└── src/                   ✅ exists at repo root (but is NOT a subdirectory of itself)
    ├── Dockerfile
    ├── app/
    └── ...
```

### Why It Happened

The `Dockerfile` was written (or updated) with the expectation that the build is invoked
from the repository root, using a `docker build .` style command. The workflow file,
however, sets `context: ./src`, which narrows the build context to only the `./src/`
subtree. This disconnect between where the Dockerfile expects files to be and where
Docker actually looks for them is the sole cause of all the "not found" errors.

## Suggested Fix Approach

**Change the build context in `.github/workflows/release.yml` from `./src` to `.`
(repo root) and add an explicit `file:` path pointing to the Dockerfile.**

In `.github/workflows/release.yml`, update the `Build and push` step:

```yaml
- name: Build and push
  uses: docker/build-push-action@v7
  with:
    context: .                      # ← repo root (was ./src)
    file: ./src/Dockerfile          # ← explicit Dockerfile path
    push: true
    platforms: linux/amd64,linux/arm64
    tags: ${{ steps.tags.outputs.tags }}
    ...
```

With `context: .`, all `COPY` instructions resolve against the repo root exactly as the
Dockerfile author intended. Adding `file: ./src/Dockerfile` is necessary so Docker knows
where to find the Dockerfile now that it is no longer at `<context>/Dockerfile`.

No changes are required to `src/Dockerfile` itself — its COPY paths are correct.

### Verification Steps

After applying the fix:

1. Run the release workflow manually (`workflow_dispatch`) with a test tag.
2. Confirm the `Build and push` step completes without "not found" errors.
3. Confirm the resulting image starts correctly with `docker run --rm -p 3000:3000 <image>`.

## Related Tests

- [ ] Docker image builds without errors on both `linux/amd64` and `linux/arm64`
- [ ] All COPY source paths resolve successfully during build
- [ ] Built image starts the application on port 3000

## Additional Context

### Secondary Issue: `scripts/next-issue-number.sh` Script Bug

While setting up this analysis, the script returned `001` instead of the correct `004`.
The bug is in `find_remote_max`: when no remote branches match
`refs/heads/feature/*`, `refs/heads/fix/*`, or `refs/heads/workflow/*`, the subshell
pipeline (`while read | sort | tail -1 || echo "$max"`) produces empty output (exit code 0),
so `|| echo "$max"` never fires and `remote_max` is set to an empty string `""`. The
subsequent integer comparison `[ "$local_max" -gt "$remote_max" ]` then fails with
`[: : integer expression expected`. The `overall_max` variable is never set, defaulting
to `((0 + 1)) = 1`. The number was manually verified to be `004` by inspecting the
highest-numbered folder in `docs/issues/` (`003-invoice-upload-button-bugs`) and
`docs/features/` (`002-methodology-summary`).

### Related Files for Context

- `src/Dockerfile` — multi-stage build file; COPY paths are correct for repo-root context
- `docker/healthcheck.sh` — shell health-check script used in Stage 2
- `docker/supervisord.conf` — supervisord config starting PostgreSQL + Next.js
- `docker/tesseract/Dockerfile` — separate Tesseract image; unaffected by this issue
- `.dockerignore` — excludes `node_modules`, `docs`, `.git`, etc. (no issue here)
