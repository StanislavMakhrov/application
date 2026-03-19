---
name: generate-release-screenshots
description: Capture PNG screenshots of the running web app. Used by UAT Tester (during e2e tests) and Release Manager (if UAT screenshots are missing). Saves to docs/features/NNN-.../screenshots/.
---

# Generate Release Screenshots

## Purpose
Capture PNG screenshots of the running application to document features visually. Screenshots are used in:
- **PR body** (by Release Manager, relative paths)
- **Release notes** (by Release Manager, absolute `raw.githubusercontent.com` URLs)
- **PR comment** (by UAT Tester, inline in manual verification checklist)

## Who Uses This Skill

| Agent | When |
|-------|------|
| **UAT Tester** | During e2e tests — captures screenshots via `page.screenshot()` and saves to `docs/features/NNN-.../screenshots/` |
| **Release Manager** | When generating release notes or PR body — reuses UAT screenshots if available; captures fresh ones if not |

## Hard Rules

### Must
- Save screenshots to `docs/features/NNN-<feature-slug>/screenshots/<name>.png`
- Verify the app is running and responding before capturing
- Verify the PNG file actually exists before referencing it in any markdown
- Stop the container after capturing (if you started it)
- Use **relative paths** in PR body — GitHub renders them correctly from the branch
- Use **absolute `raw.githubusercontent.com` URLs** in release notes — relative paths break in GitHub Release pages

### Must Not
- Add image references in markdown before the PNG file exists
- Leave the container running after capturing
- Capture blank pages or error screens — verify content before saving

## Workflow

### Option A — Via Playwright in e2e tests (UAT Tester)

Add `page.screenshot()` calls inside the Playwright test after navigating to the relevant state:

```typescript
// After navigating to the feature page and asserting it works:
await page.screenshot({
  path: "docs/features/NNN-<feature-slug>/screenshots/<state-name>.png",
  clip: { x: 0, y: 0, width: 1280, height: 720 },
});
```

Commit alongside the e2e tests:
```bash
git add e2e-tests/ docs/features/NNN-<feature-slug>/screenshots/
git commit -m "test(uat): add e2e tests and screenshots for <feature-slug>"
```

### Option B — Via Docker + Playwright CLI (Release Manager, fallback)

Use when UAT screenshots don't exist yet:

```bash
# 1. Build and start the app
docker build -t app:local ./src
docker run -d --name app-screenshots -p 3000:3000 app:local

# 2. Wait for readiness
for i in $(seq 1 20); do
  curl -sf http://localhost:3000/ > /dev/null 2>&1 && echo "✅ Ready" && break
  echo "Waiting... ($i/20)" && sleep 3
done

# 3. Capture with Playwright CLI
mkdir -p docs/features/NNN-<feature-slug>/screenshots
cd src && npx playwright screenshot \
  --browser chromium \
  http://localhost:3000/<page> \
  ../docs/features/NNN-<feature-slug>/screenshots/<name>.png

# 4. Stop the container
docker stop app-screenshots && docker rm app-screenshots
```

## Using Screenshots in Markdown

### In PR body (relative paths — rendered by GitHub from the branch)
```markdown
## Screenshots
![Feature in action](docs/features/NNN-<feature-slug>/screenshots/dashboard.png)
```

### In release notes (absolute URLs — required for GitHub Release pages)
```markdown
## 📸 Screenshots
![Feature in action](https://raw.githubusercontent.com/<owner>/<project-name>/v{VERSION}/docs/features/NNN-<feature-slug>/screenshots/dashboard.png)
```

## On Failure

If screenshots cannot be captured:
- **DO NOT** add broken image references to any markdown
- Report to Maintainer with full error details
- Do not proceed with release notes or PR body until resolved
