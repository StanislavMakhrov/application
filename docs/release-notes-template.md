# <Short title>

<1–2 sentences. Be explicit about scope (e.g., “bug fixes only”).>

## ✨ Features

- <Only include if there are real new user-visible features>

## 🐛 Bug fixes

- <Symptom → fix (what was wrong, what changed)>

## 📚 Documentation

- <Only include if user-facing docs changed>

<!-- Optional: Screenshots

Include this section only if you have screenshots.

If you list anything under ✨ Features and it changes rendered output, you should include screenshots.

Generate screenshots by running the app locally:
```bash
docker build -t app:local ./src
docker run --rm -p 3000:3000 app:local
# Take screenshots via browser or Playwright
```

Constraints for release notes:
- Max screenshot size: 580×400
- Focus on the relevant UI area

## 📸 Screenshots

> **CRITICAL**: Use absolute `raw.githubusercontent.com` URLs, NOT relative paths.
> Relative paths (e.g., `./image.png`) break in GitHub Release pages.
> Use the release tag in the URL: `https://raw.githubusercontent.com/<owner>/<project-name>/v{VERSION}/docs/{path}/image.png`

### Before
![Before](https://raw.githubusercontent.com/<owner>/<project-name>/v{VERSION}/docs/features/NNN-feature-name/before-screenshot.png)

### After
![After](https://raw.githubusercontent.com/<owner>/<project-name>/v{VERSION}/docs/features/NNN-feature-name/after-screenshot.png)

-->

## 🔗 Commits

> List user-facing commits only (exclude task tracking, internal workflow/agent changes, snapshot-only commits unless they reflect a user-visible output change).

- [`<sha>`](https://github.com/<owner>/<project-name>/commit/<sha>) <subject>

## 🚨 Breaking changes

⚠️ <If any, include migration steps>

## ▶️ Getting started (only if usage changed)

> Include this section only when there are changes to how users run the tool (new flags, changed defaults, new required config, etc.).

```bash
# Example: show new usage or changed flags
```
