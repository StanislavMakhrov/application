#!/usr/bin/env bash
# docker-build-test.sh — Build the Docker image locally to catch Dockerfile errors
# before they reach the PR Validation CI pipeline.
#
# This is the agent-side equivalent of the "Build and push Docker image" step in
# pr-validation.yml. It builds linux/amd64 only (no push) to keep it fast.
#
# Usage:
#   scripts/docker-build-test.sh            # build linux/amd64, no push
#   scripts/docker-build-test.sh --e2e      # build + run Playwright e2e tests against it
#   scripts/docker-build-test.sh --help
#
# Exit codes:
#   0 — build (and optional e2e tests) succeeded
#   1 — build failed  /  e2e tests failed
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
IMAGE_TAG="app-local:ci-test"
RUN_E2E=false

usage() {
  grep '^#' "$0" | sed 's/^# \?//'
  exit 0
}

for arg in "$@"; do
  case "$arg" in
    --e2e) RUN_E2E=true ;;
    --help|-h) usage ;;
    *) echo "Unknown argument: $arg" >&2; exit 1 ;;
  esac
done

cd "$REPO_ROOT"

echo "════════════════════════════════════════"
echo " Docker Build Test (local CI equivalent)"
echo "════════════════════════════════════════"
echo "Context: $REPO_ROOT"
echo "Tag:     $IMAGE_TAG"
echo ""

# Build for linux/amd64 only (fast; CI also builds arm64 but that's slower)
docker buildx build \
  --platform linux/amd64 \
  --file src/Dockerfile \
  --tag "$IMAGE_TAG" \
  --load \
  .

echo ""
echo "✅ Docker build succeeded — image: $IMAGE_TAG"

if [ "$RUN_E2E" = "true" ]; then
  echo ""
  echo "──────────────────────────────────────"
  echo " Playwright E2E Tests"
  echo "──────────────────────────────────────"

  CONTAINER_NAME="app-e2e-local"
  # Clean up any previous container
  docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

  echo "Starting container on port 3001..."
  docker run -d --name "$CONTAINER_NAME" -p 3001:3000 "$IMAGE_TAG"

  echo "Waiting for app to be ready at http://localhost:3001 ..."
  READY=false
  for i in $(seq 1 30); do
    if curl -sf http://localhost:3001/ > /dev/null 2>&1; then
      echo "✅ App is ready (attempt $i)"
      READY=true
      break
    fi
    echo "  attempt $i/30 — not ready yet, retrying in 3 s..."
    sleep 3
  done

  if [ "$READY" = "false" ]; then
    echo "❌ App failed to start within 90 s — container logs:"
    docker logs "$CONTAINER_NAME"
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
    exit 1
  fi

  echo "Running Playwright e2e tests..."
  (cd "$REPO_ROOT/e2e-tests" && BASE_URL="http://localhost:3001" npm test)
  E2E_EXIT=$?

  docker stop "$CONTAINER_NAME" 2>/dev/null || true
  docker rm "$CONTAINER_NAME" 2>/dev/null || true

  if [ $E2E_EXIT -ne 0 ]; then
    echo "❌ E2E tests failed."
    exit 1
  fi

  echo "✅ E2E tests passed."
fi

echo ""
echo "✅ Docker build test complete."
