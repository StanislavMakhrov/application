---
name: generate-demo-artifacts
description: Seed the running app with demo data for UAT or manual testing. Use before UAT to ensure the app has realistic data that covers the feature being tested.
compatibility: Requires Docker and Node.js.
---

# Generate Demo Artifacts

## Purpose
Populate the running application with realistic demo/seed data before UAT or manual testing. This ensures reviewers can verify the feature against meaningful content rather than an empty state.

## Hard Rules

### Must
- [ ] Ensure the app is running before seeding
- [ ] Verify seed data was applied successfully
- [ ] Document what data was created (for UAT instructions)

### Must Not
- [ ] Seed production environments
- [ ] Commit generated data files to the repository unless they are fixture files

## Actions

### 1. Start the App

```bash
docker build -t app:local ./src
docker run -d --name app-demo -p 3000:3000 app:local

# Wait for the app to be ready
for i in $(seq 1 20); do
  curl -sf http://localhost:3000/ > /dev/null 2>&1 && echo "✅ App ready" && break
  echo "Waiting... ($i/20)"
  sleep 3
done
```

### 2. Seed Demo Data

If the project has a seed script:

```bash
cd src && npm run seed
# or
cd src && npm run db:seed
```

If the project has e2e fixtures/helpers:

```bash
cd src && npx tsx e2e-tests/helpers/seed.ts
```

Check `src/package.json` for the actual seed command available in this project.

### 3. Verify

Open `http://localhost:3000` in a browser and confirm demo data is visible.

### 4. Stop When Done

```bash
docker stop app-demo
docker rm app-demo
```

## When to Use
- Before running UAT to ensure the app has realistic data
- When setting up a demo environment for a PR review
- After making changes to data models or rendering logic that require fresh fixtures
