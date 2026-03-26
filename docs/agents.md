# Agent-Based Coding Workflow

This document describes the agent-based workflow for feature development in this project. The workflow is inspired by best practices from the GitHub Copilot agents article, the VS Code Copilot Custom Agents documentation, and modern software engineering principles.

Agents work locally and produce artifacts as markdown files in the repository. The **Maintainer** coordinates handoffs between agents by starting chat sessions with each agent in VS Code. Agents may ask the Maintainer for clarification or request that feedback be relayed to a previous agent.

---

## Entry Point

The workflow begins when the **Maintainer** identifies a need:

### Manual Coordination (Default)

- **New Feature**: Start with the **Requirements Engineer** agent to gather requirements and create a Feature Specification
- **Bug Fix / Incident**: Start with the **Issue Analyst** agent to investigate and document the issue
- **Workflow Improvement**: Start with the **Workflow Engineer** agent to modify the development process itself

Throughout the workflow, the Maintainer coordinates handoffs between agents and provides clarifications as needed.

### Automated Orchestration (Optional)

For well-defined features or bugs, use the **Workflow Orchestrator** agent to automate the complete workflow:

- **GitHub (Cloud) - RECOMMENDED**: Assign a GitHub issue to `@copilot` to trigger automated orchestration from issue to release. The orchestrator runs as a coding agent with full delegation capabilities via the `task` tool.

**How It Works (Technical)**:
The routing is controlled by `.github/copilot-instructions.md`. That file contains an explicit rule: when the coding agent session is triggered from a GitHub issue assignment, it **must** load `.github/agents/workflow-orchestrator-coding-agent.agent.md` and act as the Workflow Orchestrator rather than implementing directly. Without this rule, the coding agent would bypass the pipeline and implement directly as a developer.

**Bypassing the Orchestrator (known failure mode)**:
When GitHub starts a coding agent session it automatically creates an "Initial plan" commit on the `copilot/*` branch. A previous version of the Exception clause in `copilot-instructions.md` allowed bypass when "prior commits" existed — the agent misread the automatic commit as evidence of a prior orchestrator session and implemented the feature directly. The clause was tightened to require actual orchestrator artifacts (`docs/features/<N>-*/specification.md` or `docs/adr/*.md`) before the exception can apply.

**Workflow**:
- The orchestrator **never asks clarifying questions** - it immediately delegates to the appropriate entry point agent (Requirements Engineer for features, Issue Analyst for bugs)
- The orchestrator **never implements anything itself** - it purely delegates to specialized agents in sequence
- Entry point agents (Requirements Engineer, Issue Analyst) handle requirements gathering and ask any needed clarifying questions
- The orchestrator tracks progress and handles feedback loops (code review rework, UAT failures)

**Best for**:
- Complete feature implementations with clear issue descriptions
- Bug fixes needing full workflow (investigation → fix → release)
- Reducing cognitive load on routine development tasks
- GitHub issue-driven development

**Not suitable for**:
- Exploratory analysis or design work (use individual agents directly)
- Single-agent tasks (just use that agent)
- Highly interactive work requiring maintainer decisions at each step

**PR Validation and draft PRs**:
The `PR Validation` pipeline only runs on **ready (non-draft) PRs**. When a coding agent pushes commits to a draft PR, the `synchronize` event triggers the workflow but all jobs are intentionally skipped — this is expected and the "skipped" run in the Actions history is not a failure. The pipeline runs for real only when `scripts/pr-github.sh mark-ready` converts the draft PR to ready-for-review (firing the `ready_for_review` event). This design prevents wasted CI resources on intermediate commits during development.

**Verification note:** If a change only touches agent instructions / skills / documentation (for example `.github/agents/`, `.github/skills/`, `.github/copilot-instructions.md`, or `docs/`), running `npm test` is not required because the test suite does not validate those changes. Run `cd src && npm test` when application code changes.

---

## Agent Execution Contexts

All agents exist in two variants optimized for their execution environment:

### Local Agents (VS Code)
- **Usage**: `@agent-name` in VS Code Copilot chat
- **Tools**: Explicitly configured tool list with local-only tools (execute, edit, vscode, todo, etc.)
- **Behavior**: Interactive with Maintainer, asks one question at a time, runs src/tests/builds locally
- **File naming**: Standard name (e.g., `developer.agent.md`)

### Coding Agents (GitHub Cloud)
- **Usage**: Automatically used when GitHub assigns issues to `@copilot` or when running as PR coding agent
- **Tools**: No explicit tool list (defaults to all available tools in cloud environment)
- **Behavior**: Autonomous operation, may ask multiple questions via comments, relies on CI/CD for validation
- **File naming**: Name with ` (coding agent)` suffix (e.g., `developer-coding-agent.agent.md`)

The workflow diagram and agent descriptions below refer to the conceptual agent roles, not the specific variants. Both variants follow the same workflow patterns and handoff relationships.

---

## Agent Skills

Agents are empowered by **Agent Skills**, which are specialized, reusable capabilities stored in `.github/skills/`. Skills encapsulate complex workflows, scripts, and strict procedures (like UAT or Release) that can be loaded on-demand by agents. This ensures consistency and reduces the cognitive load on the primary agent prompts.

When authoring skills, prefer designs that **minimize Maintainer approval interruptions** (terminal approvals): use a small number of stable wrapper commands, batch steps when practical, and reuse existing repo scripts.

For git working-tree checks, prefer the stable wrapper `scripts/git-status.sh` over raw `git status` so it can be permanently allowed once and reused with any needed flags.

For git history checks, prefer the stable wrapper `scripts/git-log.sh` over raw `git log` so agents can use arbitrary log flags/ranges without triggering approval churn.

For git diffs, prefer the stable wrapper `scripts/git-diff.sh` over raw `git diff` so agents can compare changes with arbitrary args/paths without triggering approval churn.

### PR Title/Description Guardrail

Before an agent runs any command that creates (or creates-and-merges) a pull request, it must post the **exact Title and Description** in chat.

The agent must author the PR description using this standard template:

```markdown
## Problem
<why is this change needed?>

## Change
<what changed?>

## Verification
<how was it validated?>
```

Wrapper scripts require an explicit title + body/description; they do not guess or derive PR content.

### Response Style

When agents have reasonable next steps, they should end user-facing responses with a **Next** section.

Guidelines:

- Include all options that are reasonable.
- If there is only 1 reasonable option, include 1.
- If there are no good options to recommend, do not list options; instead state that the agent can't recommend any specific next steps right now.
- If options are listed, include a recommendation (or explicitly say no recommendation).

Todo lists:

- Use a todo list when the work is multi-step (3+ steps) or when the agent expects to run src/tools/commands or edit files.
- Keep the todo list updated as steps move from not-started → in-progress → completed.
- Skip todo lists for simple Q&A or one-step actions.

Format:

```text
**Next**
- **Option 1:** <clear next action>
- **Option 2:** <clear alternative>
**Recommendation:** Option <n>, because <short reason>.
```

### Available Skills

| Skill Name                     | Description                                                                                                                                                                                                                                               |
|:-------------------------------|:----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `arc42-documentation`          | Create comprehensive architecture documentation using the arc42 template structure (12 sections covering introduction, constraints, context, solution strategy, building blocks, runtime, deployment, concepts, decisions, quality, risks, and glossary). |
| `coding-agent-workflow`        | Standard workflow for GitHub Copilot coding agents including report_progress usage, delegation handling, and PR communication patterns.                                                                                                                   |
| `create-agent-skill`           | Create a new Agent Skill following project standards and templates.                                                                                                                                                                                       |
| `create-pr-github`             | Create and (optionally) merge a GitHub pull request (prefer GitHub chat tools; gh/wrappers are fallback), following the repo policy to use rebase and merge for a linear history.                                                                         |
| `detect-diagram-crossings`     | Detect and analyze edge crossings and overlaps in SVG workflow diagrams using geometric intersection algorithms and visual analysis.                                                                                                                      |
| `git-rebase-main`              | Safely rebase the current feature branch on top of the latest origin/main.                                                                                                                                                                                |
| `merge-conflict-resolution`    | Resolve git merge/rebase conflicts safely without losing intended changes; verify by reviewing diffs and searching for conflict markers.                                                                                                                  |
| `next-issue-number`            | Determine the next available issue number across all change types (feature, fix, workflow) by checking both local docs and remote branches, then reserve it by pushing an empty branch.                                                                   |
| `generate-demo-artifacts`      | Seed the running app with demo data for UAT or manual testing. Use before UAT to ensure the app has realistic data that covers the feature being tested.                                                                                                  |
| `generate-release-screenshots` | Capture PNG screenshots of the running web app via Playwright + Docker. Used by UAT Tester (during e2e tests) and Release Manager (if UAT screenshots are missing). Saves to `docs/features/NNN-.../screenshots/`.                                                    |
| `run-unit-tests`               | Run the project test suite using `npm test` (Vitest) from the `src/` directory. Use `npm run test:watch` for development.                                                                                                                                 |
| `update-workflow-diagram`      | Convert the mermaid diagram in docs/agents.md to a blueprint-styled SVG for the website. Use when the workflow diagram is updated.                                                                                                                        |
| `view-pr-github`               | View a GitHub PR (prefer GitHub chat tools; gh is fallback with pager disabled).                                                                                                                                                                          |
| `agent-file-structure`         | Standard structure and key principles for agent definition markdown files.                                                                                                                                                                                |
| `agent-model-selection`        | Guidelines for selecting appropriate language models for agents based on task-specific benchmarks, availability, and cost efficiency.                                                                                                                     |
| `validate-agent`               | Validate agent definitions for consistency, model availability, handoff integrity, and tool existence.                                                                                                                                                    |
| `watch-pr-validation`          | After finishing work and pushing changes, automatically find and watch the PR Validation pipeline, then read errors and fix failures if the build is red. Use this after every report_progress call.                                                      |
| `pre-push-validation`          | Run all PR Validation checks locally before pushing to ensure the PR passes CI without maintainer intervention.                                                                                                                                          |
| `update-test-snapshots`        | Regenerate test snapshot (golden file) baselines after intentional UI or output changes. Use after modifying rendering logic, templates, or UI components.                                                                                                |
| `watch-uat-github-pr`          | Watch a GitHub UAT PR for maintainer feedback or approval by polling comments until approved/passed.                                                                                                                                                     |

## Workflow Overview

```mermaid
%%{init: {'theme':'dark', 'themeVariables': { 'fontSize':'16px', 'fontFamily':'ui-sans-serif, system-ui, sans-serif'}}}%%
flowchart TB
	%% Modern styles optimized for dark backgrounds
	classDef agent fill:#3b82f6,stroke:#60a5fa,stroke-width:3px,color:#ffffff,rx:8,ry:8;
	classDef artifact fill:#8b5cf6,stroke:#a78bfa,stroke-width:2px,color:#ffffff,rx:6,ry:6;
	classDef metaagent fill:#10b981,stroke:#34d399,stroke-width:3px,color:#ffffff,rx:8,ry:8;
	classDef orchestrator fill:#ec4899,stroke:#f472b6,stroke-width:3px,color:#ffffff,rx:8,ry:8;
	classDef human fill:#f59e0b,stroke:#fbbf24,stroke-width:4px,color:#ffffff,rx:10,ry:10;

	%% Nodes
	HUMAN(["👤 <b>Maintainer</b><br/>(Human)"])
	
	%% Orchestrator (Optional)
	WO["<b>Workflow Orchestrator</b><br/>(Optional)"]

	%% Row 1: Entry Agents
	RE["<b>Requirements Engineer</b>"]
	IA_AGENT["<b>Issue Analyst</b>"]
	WE["<b>Workflow Engineer</b>"]

	%% Row 2: Artifacts from Entry
	FS["📄 Feature Specification"]
	IA["🔍 Issue Analysis"]
	WD["⚙️ Workflow Documentation"]

	%% Row 3: Planning Agents
	AR["<b>Architect</b>"]
	
	%% Row 4: Planning Artifacts
	ADR["📐 Architecture Decision Records"]

<<<<<<< HEAD
	%% Row 5: UI/UX Designer
	UIUX["<b>UI/UX Designer</b>"]

	%% Row 6: Design Artifact
	UID["🎨 UI/UX Design Specification"]

	%% Row 7: Quality & Tasks
=======
	%% Row 5: Quality & Tasks
>>>>>>> 9edd39e (docs: add test plan and UAT test plan for 001-company-settings-ui)
	QE["<b>Quality Engineer</b>"]
	
	%% Row 6: Test Plan
	TP["✓ Test Plan & Test Cases"]

	%% Row 7: Task Planner
	TP_AGENT["<b>Task Planner</b>"]

	%% Row 8: User Stories
	US["📋 User Stories / Tasks"]

	%% Row 9: Developer
	DEV["<b>Developer</b>"]

	%% Row 10: Code & Unit Tests
	CODE["💻 Code & Unit Tests"]

	%% Row 11: Tech Writer
	TW["<b>Technical Writer</b>"]

	%% Row 12: Docs
	DOCS["📚 Documentation"]

	%% Row 13: Code Reviewer
	CR["<b>Code Reviewer</b>"]

	%% Row 14: Review Report
	CRR["✅ Code Review Report"]

	%% Row 15: UAT Tester
	UAT_AGENT["<b>UAT Tester</b>"]

	%% Row 16: E2E Tests + UAT Report
	UAT["🧪 E2E Tests + UAT Report"]

	%% Row 17: Release Manager
	RM["<b>Release Manager</b>"]

	%% Release Artifacts
	REL["🚀 Release Notes"]
	PR["🔀 Pull Request<br/>(draft → ready-for-review<br/>via mark-ready)"]
	CI["⚙️ PR Validation CI<br/>Docker build + E2E tests"]

	%% Maintainer touchpoints
	UAT_REVIEW(["👤 <b>Maintainer</b><br/>PASS / FAIL comment"])
	MERGE(["👤 <b>Maintainer</b><br/>Approve &amp; Merge PR"])

	%% Retrospective
	RETRO_AGENT["<b>Retrospective</b>"]
	RETRO["📝 Retrospective Report"]

	%% Connections - Main Flow
	HUMAN ==> WO
	HUMAN ==> RE
	HUMAN ==> IA_AGENT
	HUMAN ==> WE
	
	%% Orchestrator delegates to entry agents
	WO -.-> RE
	WO -.-> IA_AGENT

	RE --> FS --> AR
	IA_AGENT --> IA --> DEV
	WE --> WD

<<<<<<< HEAD
	AR --> ADR --> UIUX
	UIUX --> UID --> QE
=======
	AR --> ADR --> QE
>>>>>>> 9edd39e (docs: add test plan and UAT test plan for 001-company-settings-ui)
	QE --> TP --> TP_AGENT
	TP_AGENT --> US --> DEV

	DEV --> CODE --> TW
	DEV --> CODE --> CR

	TW --> DOCS --> CR

	CR --> CRR
	CRR -. "Rework" .-> DEV
	CRR -- "Approved (UAT needed)" --> UAT_AGENT
	CRR -- "Approved (no UAT)" --> RM

	UAT_AGENT --> UAT
	UAT -. "E2E / UAT Failures" .-> DEV
	UAT --> UAT_REVIEW
	UAT_REVIEW -. "FAIL" .-> DEV
	UAT_REVIEW -- "PASS" --> RM

	RM --> REL
	RM --> PR
	PR --> CI
	CI -. "CI Failures" .-> DEV
	CI -- "CI ✅" --> MERGE
	MERGE --> RETRO_AGENT

	RETRO_AGENT --> RETRO --> WE

	%% Styling
	class HUMAN,UAT_REVIEW,MERGE human;
	class WO orchestrator;
<<<<<<< HEAD
	class IA_AGENT,RE,AR,UIUX,TP_AGENT,QE,DEV,TW,CR,UAT_AGENT,RM,RETRO_AGENT agent;
	class WE metaagent;
	class IA,FS,US,ADR,UID,TP,CODE,DOCS,CRR,REL,PR,WD,UAT,RETRO,CI artifact;
=======
	class IA_AGENT,RE,AR,TP_AGENT,QE,DEV,TW,CR,UAT_AGENT,RM,RETRO_AGENT agent;
	class WE metaagent;
	class IA,FS,US,ADR,TP,CODE,DOCS,CRR,REL,PR,WD,UAT,RETRO,CI artifact;
>>>>>>> 9edd39e (docs: add test plan and UAT test plan for 001-company-settings-ui)
```

_Agents produce and consume artifacts. Arrows show artifact creation and consumption. Communication for feedback/questions between agents (regarding consumed artifacts) is always possible, but intentionally omitted from the diagram for clarity._

**Linear Workflow:**

1. **Issue Analyst** investigates bugs, incidents, and technical problems.
2. **Requirements Engineer** gathers and clarifies requirements for new features.
3. **Architect** designs the solution and documents decisions.
<<<<<<< HEAD
4. **UI/UX Designer** creates state-of-the-art UI/UX design specifications (consumes architecture). Defines layouts, interaction patterns, responsive behavior, accessibility requirements, and visual guidelines.
5. **Quality Engineer** defines the test plan and cases (consumes architecture and UI/UX design). For user-facing features, defines acceptance scenarios for UAT.
6. **Task Planner** creates and prioritizes actionable work items (consumes test plan).
7. **Developer** implements features/fixes and tests.
8. **Technical Writer** updates all relevant documentation (markdown files in the repository).
9. **Code Reviewer** reviews and approves the work. Hands off to UAT Tester for user-facing features, or directly to Release Manager for internal changes.
10. **UAT Tester** writes automated **E2E tests** for user-facing scenarios/user stories (committed to `e2e-tests/<feature-slug>/e2e.spec.ts` at repo root) that cover all scenarios from the test plan. E2E tests run in CI via the `e2e-tests` job — the Orchestrator monitors CI via `watch-pr-validation` and routes any E2E failures back to Developer automatically. Also posts a PR comment with optional manual verification instructions (checklist + `docker run` command + screenshots + demo login credentials) for the Maintainer as an additional check. **Waits for Maintainer to reply `PASS` or `FAIL: <page>, <expected>, <actual>` in the PR comment** before writing the UAT report. Any failure (broken use case, wrong data, UI defect, etc.) is handed back to Developer; on PASS, hands off to Release Manager.
   - 👤 **Maintainer action:** Reply `PASS` or `FAIL: ...` in the PR comment.
11. **Release Manager** generates release notes, then calls `scripts/pr-github.sh mark-ready` to convert the `copilot/*` draft PR → ready-for-review. This triggers the **PR Validation** CI pipeline automatically: first a Docker image is built and pushed to GHCR (`ghcr.io/…:pr-N-sha`), then E2E tests run against that image. The Orchestrator monitors CI via `watch-pr-validation` and routes any CI failures back to Developer. Once CI is green, Release Manager notifies the Maintainer the PR is ready.
=======
4. **Quality Engineer** defines the test plan and cases (consumes architecture). For user-facing features, defines acceptance scenarios for UAT.
5. **Task Planner** creates and prioritizes actionable work items (consumes test plan).
6. **Developer** implements features/fixes and tests.
7. **Technical Writer** updates all relevant documentation (markdown files in the repository).
8. **Code Reviewer** reviews and approves the work. Hands off to UAT Tester for user-facing features, or directly to Release Manager for internal changes.
9. **UAT Tester** writes automated **E2E tests** for user-facing scenarios/user stories (committed to `e2e-tests/<feature-slug>/e2e.spec.ts` at repo root) that cover all scenarios from the test plan. E2E tests run in CI via the `e2e-tests` job — the Orchestrator monitors CI via `watch-pr-validation` and routes any E2E failures back to Developer automatically. Also posts a PR comment with optional manual verification instructions (checklist + `docker run` command + screenshots + demo login credentials) for the Maintainer as an additional check. **Waits for Maintainer to reply `PASS` or `FAIL: <page>, <expected>, <actual>` in the PR comment** before writing the UAT report. Any failure (broken use case, wrong data, UI defect, etc.) is handed back to Developer; on PASS, hands off to Release Manager.
   - 👤 **Maintainer action:** Reply `PASS` or `FAIL: ...` in the PR comment.
10. **Release Manager** generates release notes, then calls `scripts/pr-github.sh mark-ready` to convert the `copilot/*` draft PR → ready-for-review. This triggers the **PR Validation** CI pipeline automatically: first a Docker image is built and pushed to GHCR (`ghcr.io/…:pr-N-sha`), then E2E tests run against that image. The Orchestrator monitors CI via `watch-pr-validation` and routes any CI failures back to Developer. Once CI is green, Release Manager notifies the Maintainer the PR is ready.
>>>>>>> 9edd39e (docs: add test plan and UAT test plan for 001-company-settings-ui)
    - 👤 **Maintainer action:** Approve and merge the PR in the GitHub UI.

**Meta-Agent:**
- **Workflow Engineer** improves and maintains the agent workflow itself (operates outside the normal feature flow).
- When requesting a Maintainer decision on a `tasks.md` item, the Workflow Engineer uses the `askQuestions` tool (in VS Code) or PR comments (in GitHub coding context) to present the 3 recommended options interactively.

---

## Agent Roles & Responsibilities

**Note:** All agents support both local (VS Code) and cloud (GitHub) execution modes. Each agent automatically detects its environment and adapts its behavior accordingly. See [Cloud Agents vs Local Agents](#cloud-agents-vs-local-agents) for details.

### Maintainer (Human — not an agent)
- **Role:** The Maintainer is the human who coordinates the entire workflow. They start chat sessions with agents in VS Code, approve work, answer clarifying questions, and perform the two required human actions: replying `PASS`/`FAIL` on the UAT PR comment, and approving & merging the final PR in the GitHub UI.
- **Not an agent:** The Maintainer does not have an agent definition file. They coordinate via VS Code Copilot Chat or GitHub issues.

### 0. Workflow Orchestrator (Optional Automation)
- **Goal:** Orchestrate complete development workflows from issue to release with minimal maintainer interaction.
- **Use Cases:**
  - **GitHub Cloud (RECOMMENDED)**: Assign issue to `@copilot` for fully automated end-to-end execution with full delegation capabilities
  - **VS Code Local (LIMITED)**: Use `@workflow-orchestrator` for interactive workflow coordination with limited delegation capabilities
- **Deliverables:** Complete workflow execution by delegating to all required specialized agents in sequence.
- **Key Behavior:** 
  - **Never asks clarifying questions** - immediately delegates to entry point agents who handle requirements gathering
  - **Never implements anything** - purely orchestrates by delegating to specialized agents via `task` tool
  - Tracks progress, handles feedback loops (code review rework, UAT failures)
  - Minimizes maintainer interactions by letting specialized agents make decisions
- **Entry Points:** Determines workflow type and immediately delegates:
  - Features → Requirements Engineer (who asks clarifying questions if needed)
  - Bugs → Issue Analyst (who investigates and clarifies details)
  - Workflow improvements → Workflow Engineer
- **Definition of Done:** All workflow stages complete, PR merged, release published, retrospective conducted.
- **Best For:** Well-defined features/bugs with clear issue descriptions, routine development workflows, GitHub issue-driven development.
- **Not For:** Highly exploratory work, unclear requirements needing extensive clarification, tasks requiring frequent design decisions.

### 1. Issue Analyst
- **Goal:** Investigate and document bugs, incidents, and technical issues.
- **Deliverables:** Issue analysis with root cause, diagnostic data, and suggested fix approach.
- **Definition of Done:** Issue is clearly documented and ready for Developer to implement fix.

### 2. Requirements Engineer
- **Goal:** Gather, clarify, and document needs for new features (including non-functional improvements).
- **Deliverables:** High level feature specification describing user outcomes and success criteria
- **Definition of Done:** Requirements are clear, unambiguous, and approved.

### 3. Architect
- **Goal:** Design the technical solution and document decisions.
- **Deliverables:** Architecture overview, ADRs, technology choices.
- **Key Behavior:** When multiple viable options exist, presents pros/cons with a recommendation and uses the `askQuestions` tool to let the maintainer choose the final approach interactively.
- **Definition of Done:** Architecture is documented and approved.

<<<<<<< HEAD
### 4. UI/UX Designer
- **Goal:** Create state-of-the-art UI/UX design specifications for user-facing features.
- **Deliverables:** UI/UX Design Specification (`ui-design.md`) with layouts, wireframes, interaction states, responsive behavior, accessibility requirements, and visual guidelines.
- **Key Behavior:** Follows the latest modern design standards, audits existing app patterns for consistency, and produces developer-ready design specs using the project's Tailwind/shadcn/ui design system. Never writes implementation code.
- **Definition of Done:** Design specification is complete with all interaction states, responsive breakpoints, and accessibility requirements documented.

### 5. Quality Engineer
=======
### 4. Quality Engineer
>>>>>>> 9edd39e (docs: add test plan and UAT test plan for 001-company-settings-ui)
- **Goal:** Define how the feature will be tested and validated.
- **Deliverables:** Test plan, test cases, quality criteria. For user-facing features, user acceptance scenarios for manual review via PRs.
- **Definition of Done:** Test plan covers all acceptance criteria. User-facing features have clear acceptance scenarios defined.

<<<<<<< HEAD
### 6. Task Planner
=======
### 5. Task Planner
>>>>>>> 9edd39e (docs: add test plan and UAT test plan for 001-company-settings-ui)
- **Goal:** Translate requirements and architecture into actionable work items.
- **Deliverables:** User stories/tasks with acceptance criteria and priorities.
- **Definition of Done:** Work items are clear, actionable, and prioritized.

<<<<<<< HEAD
### 7. Developer
=======
### 6. Developer
>>>>>>> 9edd39e (docs: add test plan and UAT test plan for 001-company-settings-ui)
- **Goal:** Implement features and tests as specified.
- **Deliverables:** Code, tests, passing CI. If no `Dockerfile` exists in `src/`, the Developer creates one as part of the first implementation task.
- **Definition of Done:** Code and tests meet requirements and pass all checks. Docker image builds and runs correctly (`docker build -t app:local ./src`).

<<<<<<< HEAD
### 8. Technical Writer
=======
### 7. Technical Writer
>>>>>>> 9edd39e (docs: add test plan and UAT test plan for 001-company-settings-ui)
- **Goal:** Update and maintain all relevant documentation.
- **Deliverables:** Updated user and developer docs.
- **Definition of Done:** Documentation is accurate and complete.

<<<<<<< HEAD
### 9. Code Reviewer
=======
### 8. Code Reviewer
>>>>>>> 9edd39e (docs: add test plan and UAT test plan for 001-company-settings-ui)
- **Goal:** Ensure code quality and process adherence.
- **Deliverables:** Code review feedback or approval.
- **Definition of Done:** Code is reviewed and approved or sent back for rework.

<<<<<<< HEAD
### 10. UAT Tester
=======
### 9. UAT Tester
>>>>>>> 9edd39e (docs: add test plan and UAT test plan for 001-company-settings-ui)
- **Goal:** Validate user-facing features by writing automated TypeScript Playwright e2e tests covering all user-facing scenarios, and providing optional manual UAT instructions for the Maintainer.
- **Deliverables:**
  1. Playwright e2e tests at `e2e-tests/<feature-slug>/e2e.spec.ts`, committed so the CI `e2e-tests` job runs them automatically.
  2. A PR comment with an optional manual verification checklist, demo login credentials, and `docker run` instructions for the Maintainer.
  3. A UAT report at `docs/features/NNN-<feature-slug>/uat-report.md` after Maintainer confirms PASS/FAIL.
- **E2E test location:** `e2e-tests/<feature-slug>/e2e.spec.ts` (repo root, not inside `src/`). Uses shared config from `e2e-tests/playwright.config.ts`.
- **BLOCKER:** If the feature has no user-facing UI changes (e.g. pure background job or API-only), the agent must ask the Maintainer before proceeding.
- **Maintainer touchpoint:** After posting the PR comment, the agent waits for the Maintainer to reply with `PASS` or `FAIL: <page>, <expected>, <actual>` (screenshots welcome). Any failure (broken use case, wrong data, UI defect, etc.) is handed back to Developer. After fixing, UAT Tester re-validates. Note: automated E2E CI failures are monitored by the Orchestrator via `watch-pr-validation` — they are routed back to Developer independently of the manual check.
- **Definition of Done:** All user-facing scenarios from the test plan are covered by Playwright tests, the CI `e2e-tests` job passes, and the Maintainer has replied with explicit PASS on the manual check.
- **Implementation:** Playwright (TypeScript); tests drive a headless Chromium browser against the running application outside the Docker container.

<<<<<<< HEAD
### 11. Release Manager
=======
### 10. Release Manager
>>>>>>> 9edd39e (docs: add test plan and UAT test plan for 001-company-settings-ui)
- **Goal:** Plan, coordinate, and execute releases.
- **Deliverables:** Pull request (ready for review), release notes, versioning, deployment plan, and post-release checklist.
- **Key Behavior:** Write release notes as honest, technical notes for users (not marketing), include ✨/🐛/📚 icons, include a 🔗 Commits section with user-facing commits, and only include ▶️ Getting started / 📸 Screenshots when applicable (screenshots required for user-visible output changes).
- **mark-ready:** Calls `scripts/pr-github.sh mark-ready` to convert the existing draft PR (auto-created by GitHub when issue was assigned to `@copilot`) from draft → ready-for-review. This fires the `ready_for_review` GitHub Actions event, which triggers the **PR Validation** pipeline:
  1. **Docker build & push** — builds `src/Dockerfile` and pushes image to GHCR as `ghcr.io/…:pr-N-sha`
  2. **E2E tests** — pulls the image, starts the container, runs Playwright tests from `e2e-tests/`
  CI failures are monitored by the Orchestrator via `watch-pr-validation` and routed back to Developer.
- **Maintainer touchpoint:** Approve and merge the PR in the GitHub UI once CI is green. This is the single required human action before the post-merge release pipeline runs.
- **Definition of Done:** PR is merged by the Maintainer, release pipeline completes, GitHub Release published, Docker image in GHCR, CHANGELOG updated.

<<<<<<< HEAD
### 12. Retrospective
=======
### 11. Retrospective
>>>>>>> 9edd39e (docs: add test plan and UAT test plan for 001-company-settings-ui)
- **Goal:** Identify improvement opportunities for the development workflow.
- **Deliverables:** Retrospective report with summary, successes, failures, and improvement opportunities.
- **Key Behavior:** Be evidence-based and critical; prefer chat logs/artifacts/CI status checks for objective event history, cluster findings by theme, and apply a scoring rubric with explicit deductions.
- **Definition of Done:** Report is generated with action items and a completeness checklist (DoD).

<<<<<<< HEAD
### 13. Workflow Engineer (Meta-Agent)
=======
### 12. Workflow Engineer (Meta-Agent)
>>>>>>> 9edd39e (docs: add test plan and UAT test plan for 001-company-settings-ui)
- **Goal:** Analyze, improve, and maintain the agent-based workflow.
- **Execution Modes:**
  - **Cloud (GitHub):** Automated execution of well-defined workflow improvements via issue assignment
- **Deliverables:** A prioritized workflow-improvement `tasks.md` (with status), updated agent definitions, workflow documentation updates, PRs with workflow changes.
- **Definition of Done:** Workflow changes are documented, committed, and PR is created.
- **Note:** Can operate in both local (chat) and cloud (issue) contexts. This agent operates outside the normal feature development flow.

---

## Artifacts

This section describes the purpose and format of each artifact produced and consumed in the workflow.

### Documentation Folder Naming (Global Sequence)

To make feature/issue/workflow documentation easier to scan in chronological development order, subfolders under `docs/features/`, `docs/issues/`, and `docs/workflow/` use a **global, monotonically increasing** numeric prefix.

- **Format:** `NNN-<topic-slug>/` (3 digits, zero-padded)
- **Examples:** `docs/features/020-custom-report-title/`, `docs/issues/015-totals-count-mismatch-in-summary-table/`, `docs/workflow/023-retrospective-2025-12-28/`

#### Parallel Work Rule ("First Merge Wins")

When multiple branches are created in parallel, they may independently pick the same next `NNN`.

- The **first PR that merges** keeps its chosen `NNN`.
- Any later PR that conflicts must **renumber its folder(s)** to the next available `NNN` **before merge**.
- Renumbering must include updating any affected intra-doc links under `docs/`.

| Artifact | Purpose | Format | Location |
|----------|---------|--------|----------|
| **Issue Analysis** | Documents bug reports, diagnostic information, root cause analysis, and suggested fix approach. Serves as the foundation for implementing fixes. | Markdown document with sections: Problem Description, Steps to Reproduce, Root Cause Analysis, Suggested Fix Approach, Related Tests. | `docs/issues/NNN-<issue-slug>/analysis.md` |
| **Feature Specification** | Documents user needs, goals, and scope from an end-user perspective. Serves as the foundation for architecture and planning. | Markdown document with sections: Overview, User Goals, Scope, Out of Scope, Success Criteria. | `docs/features/NNN-<feature-slug>/specification.md` |
| **Architecture Decision Records (ADRs)** | Captures significant design decisions, alternatives considered, and rationale. Provides context for future maintainers. | Markdown following the ADR format: Context, Decision, Consequences. | `docs/adr-<number>-<short-title>.md` (high level / general decisions) and `docs/features/NNN-<feature-slug>/architecture.md` (feature-specific decisions) |
<<<<<<< HEAD
| **UI/UX Design Specification** | Defines visual layouts, interaction patterns, responsive behavior, accessibility requirements, and visual guidelines for user-facing features. Includes **static HTML mockup files** that the Developer opens in a browser as a pixel-accurate reference and copies Tailwind classes from. Consumed by Quality Engineer, Task Planner, and Developer. | Markdown spec + standalone HTML mockup files (Tailwind CDN, self-contained, all interaction states). | `docs/features/NNN-<feature-slug>/ui-design.md` and `docs/features/NNN-<feature-slug>/mockups/*.html` |
=======
>>>>>>> 9edd39e (docs: add test plan and UAT test plan for 001-company-settings-ui)
| **User Stories / Tasks** | Actionable work items with clear acceptance criteria. Used to track implementation progress (features) or workflow improvement work (workflow). | Markdown. For workflow improvements, use a table with a Status column (icon + text) and a short rationale per item. | `docs/features/NNN-<feature-slug>/tasks.md` and `docs/workflow/NNN-<topic-slug>/tasks.md` |
| **Test Plan & Test Cases** | Defines how the feature will be verified. Maps test cases to acceptance criteria. For user-facing features, includes user acceptance scenarios for manual review. | Markdown document with: Test Objectives, Test Cases (ID, Description, Steps, Expected Result), Coverage Matrix, User Acceptance Scenarios (for user-facing features). | `docs/features/NNN-<feature-slug>/test-plan.md` |
| **UAT Test Plan** | For user-facing features, defines what will be tested during UAT and provides validation instructions for the maintainer. | Markdown document specifying: Goal, Test Steps, Expected Results, Validation Instructions. | `docs/features/NNN-<feature-slug>/uat-test-plan.md` |
| **User Acceptance Testing** | Real-environment verification for user-facing features. UAT Tester writes Playwright e2e tests (committed to `e2e-tests/`) that run automatically in CI, and posts a PR comment with optional manual verification instructions for the Maintainer. | Playwright e2e tests at `e2e-tests/<feature-slug>/e2e.spec.ts`. PR comment with manual checklist, `docker run` instructions, and demo login credentials. Maintainer replies `PASS` or `FAIL: <page>, <expected>, <actual>`. | `e2e-tests/<feature-slug>/e2e.spec.ts`, PR comments |
| **Code & Tests** | Implementation of the feature including unit tests, integration tests, and any necessary refactoring. | Source code files following project conventions. Tests in `src/tests/` directory. | `src/` and `src/tests/` directories |
| **Documentation** | Updated user-facing and developer documentation reflecting the new feature. | Markdown files following existing documentation structure. | `docs/`, `README.md` |
| **Code Review Report** | Feedback on code quality, adherence to standards, and approval status. May request rework. | Markdown document with: Summary, Issues Found, Recommendations, Approval Status. | `docs/features/NNN-<feature-slug>/code-review.md` |
| **Pull Request** | Pull request created for merging the feature branch into main. Triggers CI/CD pipeline for validation and deployment. | GitHub Pull Request with title, description, and link to feature documentation. | GitHub repository |
| **Release Notes** | Summary of changes, new features, bug fixes, and breaking changes for the release. | Markdown following conventional changelog format. Auto-generated by CI pipeline. | `CHANGELOG.md` |
| **Retrospective Report** | Summary of the development cycle, highlighting successes, failures, and improvement opportunities. | Markdown document with sections: Summary, What Went Well, What Didn't Go Well, Improvement Opportunities; include action items with change location + verification method, CI/status-check summary when applicable, automation opportunities (including suggested skills/scripts), and a Retrospective DoD checklist. | `docs/features/NNN-<feature-slug>/retrospective.md` or `docs/issues/NNN-<issue-slug>/retrospective.md` |
| **Workflow Documentation** | Updated agent definitions and workflow documentation reflecting process improvements. | Agent markdown files and workflow docs. | `.github/agents/*.agent.md`, `docs/agents.md` |
| **Work Protocol** | Tracks which agents have performed work during a development cycle. Every agent appends a log entry summarizing their work and any problems encountered. Used by Code Reviewer and Release Manager to verify workflow completeness, and by Retrospective as additional input. | Markdown document with: Required Agents table (workflow-type dependent), Agent Work Log entries. See [Work Protocol](#work-protocol) section below for template. | `docs/features/NNN-<feature-slug>/work-protocol.md`, `docs/issues/NNN-<issue-slug>/work-protocol.md`, or `docs/workflow/NNN-<topic-slug>/work-protocol.md` |

---

## Work Protocol

The Work Protocol is a mandatory artifact that tracks which agents have performed work during a development cycle. It serves as an audit trail ensuring all required workflow steps are completed.

### Purpose

- **Accountability**: Every agent logs their work, making it visible which steps were completed
- **Verification**: Code Reviewer and Release Manager use it to verify workflow completeness before approval/release
- **Retrospective Input**: The Retrospective agent uses it to analyze the development cycle
- **Problem Tracking**: Agents log problems they encountered, feeding continuous improvement

### Who Creates It

The **first agent** in the workflow (Requirements Engineer for features, Issue Analyst for bug fixes, Workflow Engineer for workflow improvements) creates `work-protocol.md` in the work item folder.

### Who Updates It

**Every agent** appends a log entry to the Work Protocol after completing their work and before handing off. The entry must include a summary of the work performed and any problems encountered.

### Required Agents by Workflow Type

| Agent | Feature | Bug Fix | Workflow |
|-------|---------|---------|----------|
| Requirements Engineer | ✅ Required | — | — |
| Issue Analyst | — | ✅ Required | — |
| Architect | ✅ Required | — | — |
<<<<<<< HEAD
| UI/UX Designer | ⚠️ If user-facing | — | — |
=======
>>>>>>> 9edd39e (docs: add test plan and UAT test plan for 001-company-settings-ui)
| Quality Engineer | ✅ Required | — | — |
| Task Planner | ✅ Required | — | — |
| Developer | ✅ Required | ✅ Required | — |
| Technical Writer | ✅ Required | ✅ Required | — |
| Code Reviewer | ✅ Required | ✅ Required | — |
| UAT Tester | ⚠️ If user-facing | ⚠️ If needed | — |
| Release Manager | ✅ Required | ✅ Required | ✅ Required |
| Retrospective | ✅ Required | ✅ Required | — |
| Workflow Engineer | — | — | ✅ Required |

### Template

The first agent in the workflow creates `work-protocol.md` using this template:

```markdown
# Work Protocol: <Work Item Title>

**Work Item:** `docs/<type>/NNN-<slug>/`
**Branch:** `<type>/NNN-<slug>`
**Workflow Type:** Feature / Bug Fix / Workflow
**Created:** YYYY-MM-DD

## Agent Work Log

<!-- Each agent appends their entry below when they complete their work. -->

### <Agent Name>
- **Date:** YYYY-MM-DD
- **Summary:** <Brief description of work performed>
- **Artifacts Produced:** <List of files created or updated>
- **Problems Encountered:** None | <Description of any issues relevant for retrospective>
```

### Verification

- **Code Reviewer** must check the Work Protocol to verify that all required agents (per the workflow type) have logged their work before approving. Missing agent entries are a **Blocker** issue.
- **Code Reviewer** must also verify that global documentation was updated where applicable (see [Global Documentation Checks](#global-documentation-checks)).
- **Release Manager** must verify that all required agents have logged entries in the Work Protocol before creating a PR or proceeding with the release.

### Global Documentation Checks

For feature and bug fix workflows, the **Code Reviewer** must verify that the following global documentation files were considered and updated where the feature/fix impacts them:

| Document | Check |
|----------|-------|
| `docs/architecture.md` | Updated if the feature introduces new components, patterns, or architectural changes |
| `docs/features.md` | Updated with a summary entry for each new feature (required for all features). The Technical Writer appends a row when documenting a new feature. |
| `docs/testing-strategy.md` | Updated if new test patterns, frameworks, or testing approaches were introduced |
| `README.md` | Updated if the feature affects installation, usage, CLI options, or quick start |
| `docs/agents.md` | Updated if the workflow or agent behavior changed |

The Technical Writer is responsible for making these updates; the Code Reviewer verifies they were done.

---

## Branch Naming Conventions

Different types of work use different branch prefixes to maintain clarity:

To support prompt-file automation (inferring the current work item from the git branch name), branches for features, fixes, and workflow improvements must include the numeric work item prefix (`NNN`) that matches the corresponding folder under `docs/`.

The work item prefix (`NNN`) is **global and unique across change types** (features, issues, and workflow improvements). Do not reuse a number for a different change type.

Example: If the most recent feature is `025-...` and a workflow item `026-...` already exists, the next new feature must be `027-...` (not `026-...`).

- `feature/<NNN>-<slug>`  `docs/features/<NNN>-<feature-slug>/`
- `fix/<NNN>-<slug>`  `docs/issues/<NNN>-<issue-slug>/`
- `workflow/<NNN>-<slug>`  `docs/workflow/<NNN>-<workflow-slug>/`

| Work Type | Branch Prefix | Example | Used By Agent |
|-----------|---------------|---------|---------------|
| Feature Development | `feature/` | `feature/123-firewall-diff-display` | Requirements Engineer, Developer |
| Bug Fixes / Incidents | `fix/` | `fix/004-release-pipeline-failure-awk` | Issue Analyst, Developer |
| Workflow Improvements | `workflow/` | `workflow/028-improvement-opportunities` | Workflow Engineer |

**GitHub Copilot PR branch exception:** When GitHub creates a coding-agent pull request, it may place the work on an auto-generated `copilot/*` branch. That branch name is an execution-context detail for the existing PR, not a replacement for the underlying `feature/`, `fix/`, or `workflow/` work-item convention. Continue to use the matching work-item folder and workflow type, and do not treat `copilot/*` by itself as a workflow violation.

**Note:** The Requirements Engineer creates the feature branch at the start of the feature workflow. The Issue Analyst creates the fix branch at the start of the bug fix workflow. All subsequent agents work on the same branch until Release Manager creates the pull request.

**Commit Type Guardrails:** Pull requests that only change workflow/internal tooling (`.github/`, `scripts/`, `docs/`, `website/`) must NOT use `feat:` or `fix:` commit types — use `workflow:`, `docs:`, `chore:`, `ci:`, or `refactor:` instead. Using `feat:` or `fix:` for non-code changes causes unintended version bumps.

---

## Agent Handoff Criteria

Each agent hands off to the next by producing a specific deliverable. The workflow follows a **linear sequence** to ensure consistency and completeness:

| From Agent              | To Agent                | Handoff Trigger / Deliverable                        |
|-------------------------|-------------------------|------------------------------------------------------|
| Issue Analyst           | Developer               | Issue Analysis with root cause and fix approach      |
| Requirements Engineer   | Architect               | Feature Specification                                |
| Architect               | Quality Engineer        | Architecture Decision Records (ADRs)                 |
| Quality Engineer        | Task Planner            | Test Plan & Test Cases                               |
| Task Planner            | Developer               | User Stories / Tasks with Acceptance Criteria        |
| Developer               | Technical Writer        | Code & Tests                                         |
| Technical Writer        | Code Reviewer           | Updated Documentation                                |
| Code Reviewer           | UAT Tester (user-facing features) <br/> Release Manager (internal changes) <br/> Developer (rework needed) | Code Review Report |
| UAT Tester              | Release Manager (PASS) <br/> Developer (E2E / UAT Failures) | E2E tests committed + Maintainer PASS/FAIL |
| Release Manager         | CI/CD Pipeline, GitHub  | Pull Request (ready for review), Release Notes       |
| Release Manager         | Retrospective           | Deployment Complete                                  |
| Retrospective           | Workflow Engineer       | Retrospective Report with Action Items               |

**Exception:** Code Reviewer has three possible handoffs depending on approval status and feature type. UAT Tester hands to Release Manager on PASS, or back to Developer on any failure (broken use case, wrong data, UI defect, or failing E2E tests). Release Manager may hand back to Developer if build/release fails.

Handoffs are triggered when the deliverable is complete and meets the "Definition of Done" for that agent. Automation (e.g., GitHub Actions) can be used to detect completion and notify the next agent(s).

**Commit Before Handoff (Required):** Agents must commit and push all pending changes **before** suggesting a handoff to the next agent or asking the Maintainer if they're ready to proceed. This ensures the next agent has access to the complete work and eliminates unnecessary back-and-forth.

---

## Handoffs and Communication

All agent coordination is managed by the **Maintainer**:

1. **Starting an agent** - The Maintainer opens a new chat session in VS Code and selects the appropriate agent from the agents dropdown.
2. **Providing context** - The Maintainer points the agent to relevant artifacts from previous steps (e.g., "Review the specification in docs/features/X/specification.md").
3. **Handoff buttons** - Agents provide handoff buttons that pre-fill prompts for the next agent in the workflow.
4. **Feedback relay** - If an agent needs clarification from a previous step, it asks the Maintainer, who either answers directly or relays the question to the appropriate agent.

**When an agent is blocked and needs more input:** It must explicitly say it is blocked, summarize progress so far, and provide clear **Next** options to unblock it (plus at most one clarifying question at a time).

### Prompt Files (Recommended for New Chat Sessions)

When the Maintainer prefers to start a **new** chat session (instead of continuing in the same chat via handoff buttons), use workspace prompt files in `.github/prompts/`.

Prompt files can be run by typing `/` in chat and selecting the prompt, or by running **Chat: Run Prompt** from the Command Palette.

This repository provides prompt files in `.github/prompts/`.

### Default prompts

Default prompts use the short agent names (e.g., `/dev`). These are the default actions each agent performs in the workflow:

- `/wo` Workflow Orchestrator (orchestrate complete workflow from issue to release)
- `/re` Requirements Engineer
- `/ia` Issue Analyst
- `/ar` Architect (matches Requirements Engineer -> Architect handoff)
- `/qe` Quality Engineer (matches Architect -> Quality Engineer handoff)
- `/tp` Task Planner (matches Quality Engineer -> Task Planner handoff)
- `/dev` Developer (matches Task Planner -> Developer handoff)
- `/tw` Technical Writer (matches Developer -> Technical Writer handoff)
- `/cr` Code Reviewer (matches Technical Writer -> Code Reviewer handoff)
- `/uat` UAT Tester (matches Code Reviewer -> UAT Tester handoff)
- `/rm` Release Manager (matches UAT Tester -> Release Manager handoff)
- `/retro` Retrospective (matches Release Manager -> Retrospective handoff)
- `/we` Workflow Engineer (matches Retrospective -> Workflow Engineer handoff)

### Non-default prompts

Non-default prompts add a suffix describing what the agent should do instead of its default workflow action:

- `/ia-from-gh-issue` Issue Analyst (start from a GitHub issue)
- `/dev-rework-cr-failed` Developer rework (Code Reviewer requested changes)
- `/dev-rework-uat-failed` Developer rework (UAT failed)
- `/dev-fix-build-failed` Developer fix (CI/release build failed)
- `/dev-fix-ia-handoff` Developer fix (Issue Analyst -> Developer transition; uses `analysis.md`)
- `/rm-no-uat` Release Manager (prepare release with no UAT)

For prompts that correspond to a workflow handoff, the prompt text is kept identical to the handoff button prompt.

For consistent inference, use the `feature/<NNN>-...`, `fix/<NNN>-...`, or `workflow/<NNN>-...` branch formats described in the Branch Naming Conventions section.

This approach keeps the workflow simple and gives the Maintainer full visibility and control over all agent interactions.

---

## Rework and Feedback Loops

When the **Code Reviewer** requests changes, the following process applies:

1. **Code Reviewer** produces a Code Review Report specifying required changes.
2. **Maintainer** reviews the report and starts a new session with the **Developer** agent, referencing the feedback.
3. **Developer** addresses the feedback by:
   - Making the requested code changes
   - Updating the code review response in the feature folder
4. **Maintainer** returns to the **Code Reviewer** agent for re-review.
5. This cycle continues until the Code Reviewer approves.

For significant rework that affects requirements or architecture:
- The Maintainer may need to consult the **Task Planner** or **Architect** agents for clarification.
- If the rework reveals gaps in the original specification, the Maintainer may return to the **Requirements Engineer** agent.

---

## Escalation Paths and Blocker Handling

Agents may encounter blockers or need clarification from previous steps. The following approach applies:

- **Ask the Maintainer** - Agents should clearly state what information is missing or what decision is needed.
- **Maintainer relays** - The Maintainer decides whether to answer directly or consult another agent.
- **Document blockers** - If work cannot proceed, the agent should document the blocker in its output and wait for resolution.

This keeps all decisions traceable through the conversation history and artifact files.

---

## Best Practices

- **Clear Agent Boundaries:** Each agent should have a single responsibility and clear handoff criteria.
- **Artifact Ownership:** Each artifact type has exactly one responsible agent. Agents must NOT edit artifacts owned by other agents:
  - Source code (`src/`, `src/tests/`) → Developer only
  - Documentation (`docs/`, `README.md`) → Technical Writer only
  - Code Review Reports → Code Reviewer only
  - Retrospective Reports → Retrospective agent only
  - UAT PRs/Comments → UAT Tester only
  - Release artifacts → Release Manager only
- **Extensibility:** Design agents to be composable and customizable for different project needs.
- **Traceability:** Document all decisions, requirements, and changes in artifact files.
- **Maintainer Control:** The Maintainer coordinates all handoffs and has final approval on all artifacts.
- **Continuous Improvement:** Regularly review and refine agent roles and workflow.

---

## Sub-Agent Strategy

Agents can delegate focused tasks to **sub-agents** (via the `task` tool) to reduce context rot and improve output quality. Sub-agents run in their own context window, so the parent agent's context stays clean.

> **Terminology**: The `task` tool is used to invoke sub-agents. It accepts an `agent_type` parameter specifying which built-in agent type (`explore`, `task`, `general-purpose`) or custom agent to run. Note that `task` is both the tool name and one of the built-in agent types (specialized for running commands).

### When to Use Sub-Agents

| Scenario | Agent Type (via `task` tool) | Benefit |
|----------|----------------------------|---------|
| Quick codebase lookup (find files, search patterns, answer questions) | `explore` | Keeps search results out of parent context; fast Haiku model |
| Run builds, tests, lints where only pass/fail matters | `task` (built-in) | Only returns summary on success, full output on failure; Haiku model |
| Complex multi-step research or implementation in isolation | `general-purpose` | Full toolset in separate context; Sonnet model |
| Specialized domain work (review, architecture, testing) | Custom agent (e.g., `code-reviewer-coding-agent`) | Domain expertise with clean context boundary |

### When NOT to Use Sub-Agents

- **Single file reads** — use `view` directly (faster, no overhead)
- **Simple single grep/glob** — use the tool directly
- **When you need the result in your working context** — sub-agent results are summarized, not raw
- **Trivial operations** — the overhead of spawning a sub-agent isn't justified for one-line commands

### Context Rot Mitigation

Sub-agents help combat context rot (degraded output quality as conversation grows) by:

1. **Isolating research** — Searching, reading, and analyzing files in a sub-agent keeps those tokens out of your main context
2. **Summarizing results** — Sub-agents return concise answers, not raw file contents
3. **Parallel investigation** — Multiple `explore` sub-agents can search different aspects simultaneously
4. **Preserving focus** — The parent agent maintains a clean context focused on its primary task

**Rule of thumb**: If a task requires reading more than 3 files or involves multi-step investigation, delegate it to a sub-agent.

### Cost and Billing

Sub-agent costs vary by execution context:

| Context | Billing Model | Sub-Agent Cost Impact |
|---------|--------------|----------------------|
| **Coding Agent** (GitHub cloud) | 1 premium request per session | Sub-agent calls are **included** in the parent session — no additional premium requests |
| **VS Code Chat** (local) | Per-message billing | Each sub-agent invocation counts as additional message(s) based on the sub-agent's model multiplier |

**Model override implications**: When a sub-agent uses a different model (via the `model` parameter on the `task` tool), the cost is determined by that model's premium multiplier. Use cheaper models (`explore` defaults to Haiku) for research and expensive models only when quality demands it.

**Cost optimization tips**:
- Use the `explore` agent type (Haiku model, low cost) for codebase questions before using heavier agents
- Use the `task` agent type (Haiku model) for build/test runs where you only need pass/fail
- Reserve `general-purpose` (Sonnet model) for complex multi-step work
- In VS Code Chat, be mindful that each sub-agent invocation adds to your message count

---

## References
- [GitHub Copilot: How to write a great agents.md](https://github.blog/ai-and-ml/github-copilot/how-to-write-a-great-agents-md-lessons-from-over-2500-repositories/)
- [VS Code Copilot Custom Agents](https://code.visualstudio.com/docs/copilot/customization/custom-agents)
- [Microsoft: AI agent best practices](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/agent-patterns/)
- [Atlassian: How to write user stories](https://www.atlassian.com/agile/project-management/user-stories)