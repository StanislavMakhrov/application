# Fix: Docker Build Context in Release Pipeline

This patch corrects a Docker build context misconfiguration that caused the release CI pipeline to fail since the Dockerfile was added. No user-facing application behavior has changed.

## 🐛 Bug fixes

- **Docker build context mismatch in `release.yml`**: The `Build and push` step was setting `context: ./src`, but `src/Dockerfile` uses COPY paths that are relative to the repository root (e.g., `COPY src/ ...`, `COPY prisma/ ...`, `COPY public/ ...`, `COPY docker/ ...`). This caused every release pipeline run to fail with "path not found" errors during the Docker build. Fixed by setting `context: .` (repo root) and adding `file: src/Dockerfile` so Buildx locates the Dockerfile correctly.

## 📚 Documentation

- Updated stale `docker build -t app:local ./src` command examples in `docs/agents.md` and `docs/release-notes-template.md` to the correct `docker build -t app:local -f src/Dockerfile .` form, matching the fix.

## 🔗 Commits

- [`65b18b4`](https://github.com/StanislavMakhrov/application/commit/65b18b4692aa96561946fbba0c21e6aba65fdbdc) fix: set Docker build context to repo root in release.yml
- [`34db9b6`](https://github.com/StanislavMakhrov/application/commit/34db9b6) docs: update work protocol and standardize Dockerfile path in release.yml

## 🐳 Docker image

> Appended automatically by the release workflow — do not add to hand-written notes.

```bash
docker pull ghcr.io/stanislavmakhrov/application:<version>
```
