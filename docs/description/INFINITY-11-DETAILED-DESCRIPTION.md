# INFINITY-11 — Detailed Product & Web Specification

> Status: Active implementation specification.
> Current baseline: Phases 1–10 complete; Phase 11 next.
> V1 roadmap: `INFINITY-11-V1-ROADMAP.md`, Phases 1–110.
> Strategy: FREE-FIRST + OPEN-SOURCE-FIRST + BYOK-FIRST.

## 1. Product definition

INFINITY-11 is a provider-independent AI engineering, creation, automation, and operations operating system delivered first through a premium responsive web/PWA experience. It combines AI chat, multimodal creation, advanced application building, AI engineering, agent workforces, automation, research, knowledge, Project Brain, execution, verification, GitHub, deployment, observability, security, governance, and extensibility.

The web product is the primary control and experience surface. Heavy computation should move to controlled remote execution whenever available. The user's device should primarily provide interaction, editing, visualization, orchestration control, and result inspection rather than being forced to perform expensive builds, dependency installation, browser automation, or large test workloads.

## 2. Core product promise

> Bring your AI keys. Bring your tools. Bring your repositories. Build, engineer, automate, and operate anything.

The product is not a one-model wrapper, not a demo-only prompt-to-app generator, and not a mandatory paid cloud. Users control AI credentials and can use multiple providers, multiple keys, local models, self-hosted services, optional sandboxes, and optional deployment services.

## 3. Product pillars

### CREATE

Applications, interfaces, designs, images, audio, video, documents, presentations, reports, and reusable artifacts.

### ENGINEER

Repository analysis, architecture understanding, coding, debugging, root-cause analysis, code review, refactoring, migrations, tests, security, performance, CI repair, deployment repair, and maintenance.

### AUTOMATE

Visual workflows, natural-language workflow generation, deterministic execution, autonomous agents, hybrid workflows, schedules, events, approvals, retries, checkpoints, resumability, and bounded self-healing.

### OPERATE

Observe projects and deployments, diagnose failures, perform policy-approved actions, verify results, manage releases, recover from failures, and maintain project intelligence.

## 4. Best-practically-achievable output

INFINITY-11 must not stop at a plausible first output when additional work can materially improve it.

```text
Understand
→ Research
→ Specify
→ Architect
→ Plan
→ Workforce / Workflow
→ Model / Credential Route
→ Execute
→ Test
→ Critique
→ Improve
→ Verify
→ Deliver
→ Observe
→ Maintain
```

Quality dimensions are correctness, completeness, architecture, maintainability, security, performance, UX, accessibility, compatibility, verification, and cost efficiency.

Quality states are VERIFIED, PARTIALLY VERIFIED, UNVERIFIED, and BLOCKED.

## 5. Web product role

The web application is the unified command surface for every major capability. It must not become a second orchestration engine. Browser code owns presentation, interaction, local UI state, streaming presentation, navigation, and user controls. Server/runtime systems own policy, execution, routing, durable state, security decisions, workflow execution, and verification.

The web must make long-running work observable without requiring the user to keep a page open. Runs, jobs, workflow executions, builds, browser checks, deployments, and approvals have durable server-side identities and states.

## 6. Web application shell

The global shell consists of:

```text
┌────────────────────────────────────────────────────────────────────┐
│ Workspace │ Search / Command Palette │ Activity │ Notifications │ User │
├───────────────┬──────────────────────────────────────┬─────────────┤
│ Primary nav   │ Main workspace                       │ Context     │
│               │                                      │ inspector   │
│ Home          │ Chat / Code / Build / Design /       │ Files       │
│ Chat          │ Research / Media / Agents / Projects │ Models      │
│ Projects      │ / Workflows / Operations             │ Tools       │
│ Code          │                                      │ Activity    │
│ Build         │                                      │ Verification│
│ Design        │                                      │             │
│ Research      │                                      │             │
│ Media         │                                      │             │
│ Agents        │                                      │             │
│ Workflows     │                                      │             │
│ Runs          │                                      │             │
│ Deployments   │                                      │             │
│ Settings      │                                      │             │
└───────────────┴──────────────────────────────────────┴─────────────┘
```

The exact navigation may evolve, but the conceptual separation remains: primary work, contextual intelligence, and system controls.

## 7. Responsive web behavior

Desktop supports a three-region workspace: navigation, primary content, and contextual inspector. Tablet collapses secondary context and navigation where necessary. Mobile uses compact navigation, bottom sheets/drawers, stacked panels, touch-friendly controls, and preserved access to run status and approvals.

Responsive behavior must cover:

- navigation;
- command palette;
- chat composer;
- code editor;
- project tree;
- workflow canvas;
- agent panels;
- logs;
- tables;
- artifacts;
- previews;
- approvals;
- settings;
- usage;
- deployment status.

Keyboard focus, visible focus, reduced motion, semantic controls, readable contrast, touch targets, and screen-reader labeling are product requirements.

## 8. Home / Command Center

Purpose: give the user an immediate operational view.

It should show active projects, recent conversations, running jobs, agent runs, workflow runs, pending approvals, artifacts, verification warnings, provider health, credential health, usage, cost, and important system alerts.

The Command Center must distinguish information from actions. A warning should identify what is wrong and what action is available. Empty states should explain how to start useful work.

## 9. Universal composer

The primary composer is multimodal and context-aware.

It supports:

- text;
- image attachments;
- audio attachments;
- video attachments;
- documents;
- repository/project context;
- model selection;
- routing mode;
- agent selection;
- tools;
- MCP;
- workflow invocation;
- generated artifacts;
- cancellation;
- retry;
- regeneration;
- structured outputs.

The composer must expose capability limitations honestly. If a selected provider cannot perform a requested modality, the UI should offer a valid alternative or explain the constraint.

## 10. Chat workspace

Chat is not isolated from the rest of the system. A conversation can invoke agents, inspect files, create artifacts, run code, start workflows, research sources, modify a project, and request verification subject to policy.

A response can include:

- text;
- code;
- files;
- images;
- audio;
- video;
- structured data;
- application previews;
- test reports;
- verification records;
- research citations;
- workflow results.

Streaming state must include connecting, generating, tool use, waiting for approval, waiting for execution, verifying, complete, failed, and cancelled states where relevant.

## 11. Model and BYOK interface

Users can manage multiple providers and multiple credentials per provider.

```text
Provider
├── Credential A
│   ├── Model X
│   └── Model Y
├── Credential B
│   ├── Model X
│   └── Model Z
└── Credential C
    └── Model Y
```

The web must never display raw secrets after secure entry. It may show masked identifiers, provider, credential status, last validation, usage signals, cooldown, and health.

Routing modes include manual, automatic, quality-first, speed-first, cost-first, free-only, local-only, provider-preferred, capability-first, and custom policy.

Routing explanation may show eligibility, capability match, health, quota signal, cost signal, latency history, policy restrictions, and fallback reason. It must not expose private chain-of-thought.

## 12. AI workspace

The AI workspace is a unified place to select a model or agent, choose project context, attach resources, inspect route decisions, observe tool execution, approve privileged actions, and inspect verification.

A context inspector should show which project files, symbols, knowledge items, memories, skills, policies, and tools were included, why they were relevant, and whether information was omitted due to budget or policy.

## 13. Projects workspace

A project is the durable container for application, engineering, knowledge, automation, and operational state.

```text
Project
├── Overview
├── Chat
├── Files
├── Code
├── Build
├── Preview
├── Agents
├── Teams
├── Skills
├── Knowledge
├── Memory / Project Brain
├── Workflows
├── Runs
├── Artifacts
├── Tests
├── Security
├── GitHub
├── Deployments
├── Integrations
└── Activity
```

Project switching must preserve isolation of context, permissions, secrets, and execution state.

## 14. Advanced application builder web experience

The Build workspace is the central app-builder surface.

```text
Idea
→ Requirements
→ Architecture
→ Stack selection
→ Scaffold
→ Frontend
→ Backend
→ Database
→ Auth
→ APIs
→ Storage
→ Jobs
→ Tests
→ Security
→ Browser QA
→ Critique
→ Improve
→ GitHub
→ CI
→ Deploy
→ Observe
```

The builder should support both greenfield creation and existing-project modification.

### Builder interface

The interface should expose:

- project file tree;
- editor;
- terminal/output;
- live preview;
- application logs;
- agent activity;
- task plan;
- build/test status;
- browser QA status;
- verification report;
- change summary;
- approval requests;
- Git diff;
- GitHub state;
- deployment state.

### Natural-language modification

Users can request changes such as adding features, fixing bugs, changing design, adding authentication, adding APIs, changing database schema, improving responsive behavior, optimizing performance, or migrating dependencies. Before modifying an existing project, the system should inspect relevant code and project knowledge.

## 15. Code workspace

The Code workspace provides repository navigation, editing, search, symbol-aware navigation, diff inspection, agent collaboration, terminal output, diagnostics, tests, and verification.

The web editor must not pretend that code is valid merely because a model generated it. Diagnostics and verification status remain visible.

## 16. Build and execution workspace

Users can start builds, commands, tests, services, browser sessions, and sandbox jobs. Heavy work is delegated to the ExecutionManager.

```text
Web/PWA
 ↓
Control API
 ↓
ExecutionManager
 ├── Local
 ├── Docker
 ├── E2B
 ├── Self-hosted
 └── Future providers
 ↓
Build / Test / Run / Browser QA
```

Execution output includes status, timestamps, logs, artifacts, resource information where available, and verification results.

## 17. Application preview

The Preview surface displays the running application and its verification state. It must distinguish:

- running;
- building;
- unavailable;
- failed;
- partially verified;
- verified.

The preview should support desktop and mobile viewport checks and connect browser QA results back to the relevant project run.

## 18. Browser and visual QA web experience

The browser QA surface shows:

- target URL;
- browser/session state;
- screenshots;
- DOM/semantic findings;
- console errors;
- network failures;
- accessibility findings;
- visual findings;
- reproduction steps;
- linked code changes;
- verification state.

A visual defect can enter an improvement loop:

```text
Detect
→ Explain
→ Repair
→ Rebuild
→ Reopen browser
→ Recheck
→ Verify
```

## 19. Agents workspace

The Agents workspace shows installed agents, available agents, active runs, capabilities, skills, tools, model policy, memory policy, permissions, budget, and performance history.

Agents are governed executable workers, not just personalities.

```text
Agent
├── identity
├── role
├── capabilities
├── skills
├── tools
├── model policy
├── context policy
├── memory policy
├── permission policy
├── execution profile
├── verification policy
├── budget policy
└── history
```

## 20. Workforce workspace

The Workforce surface visualizes a project team.

```text
Team Lead
├── Architect
├── Frontend
├── Backend
├── Database
├── Security
├── QA
├── DevOps
├── UX
└── Research
```

Users can inspect assignments, dependencies, progress, outputs, blocked workers, approvals, and verification.

Parallel work must remain dependency-aware. The UI must not hide conflicts or merge contradictory outputs without an explicit synthesis step.

## 21. Workflow builder

The web workflow builder supports a visual canvas and natural-language generation.

Node types include:

```text
TRIGGER
ACTION
CONDITION
LOOP
PARALLEL
WAIT
APPROVAL
AGENT
SUB-AGENT
MODEL
TOOL
MCP
SANDBOX
CODE
BROWSER
GITHUB
DATABASE
HTTP
WEBHOOK
VERIFY
RETRY
RECOVER
```

The canvas must make execution order, dependencies, conditions, retries, approvals, and failure paths visible.

## 22. Workflow run interface

A workflow run displays a timeline/graph of nodes and their states.

States include queued, running, waiting, approval-required, retrying, recovering, completed, failed, cancelled, timed-out, and policy-denied.

Durable execution means closing the browser must not destroy the run.

## 23. Approvals

Approvals are explicit user decisions for privileged actions.

Examples:

- create PR: ASK;
- merge PR: ASK;
- production deploy: ASK;
- secret use: ASK where policy requires;
- delete database: DENY;
- read repository: ALLOW;
- run tests: ALLOW.

Approval UI must identify actor, requested capability, target, reason, scope, expiration, and resulting action. Approvals must be auditable.

## 24. Runs and activity

Runs unify AI, agents, workflows, builds, browser sessions, research jobs, deployments, and verification.

Each run should expose:

- identifier;
- project;
- actor;
- agent/model/provider where relevant;
- start/end time;
- state;
- inputs/outputs metadata;
- tools used;
- approvals;
- logs;
- artifacts;
- verification;
- errors;
- cost/usage where available.

## 25. Artifacts

Artifacts include generated files, applications, images, videos, audio, reports, test results, security reports, builds, packages, and deployment outputs.

Artifact metadata includes project, source run, revision, type, size, created time, verification state, and retention policy.

## 26. Multimodal web workspace

### Image

Generation, editing, variations, enhancement, background removal, design assets, UI concepts, diagrams, and image analysis.

### Audio

Speech-to-text, text-to-speech, transcription, voice workflows, audio analysis, and generated audio artifacts.

### Video

Generation workflows, editing workflows, analysis, subtitles, dubbing, storyboards, and video artifacts.

### Documents

PDF, DOCX, PPTX, spreadsheets, reports, structured exports, parsing, analysis, and generation.

All modalities are capability-driven and provider-independent.

## 27. Research workspace

Research is a first-class workspace rather than only a chat mode.

It supports source discovery, source collection, evidence extraction, comparison, synthesis, citation, document analysis, repository research, technical research, and fact checking.

The UI should distinguish source-backed facts from model-generated interpretation.

## 28. Knowledge workspace

Users can inspect knowledge sources, indexes, retrieval results, documents, project references, and knowledge relationships.

Knowledge objects may include source, title, location, content type, permissions, freshness, confidence, extracted entities, and relationships.

## 29. Project Brain workspace

Project Brain is durable project intelligence.

```text
Requirements
Architecture
Decisions
Conventions
Dependencies
Codebase map
Known bugs
Failed approaches
Successful patterns
Tests
Security findings
Deployments
Agent history
Model performance
Lessons learned
```

The web UI should let users inspect, confirm, correct, and govern important project facts.

## 30. Memory

Memory is separated into user/workspace/project/agent scopes as appropriate. Sensitive information must not be silently promoted into broad memory. Secret values must never become normal memory content.

## 31. Codebase intelligence web experience

Repository analysis should expose:

- detected languages;
- frameworks;
- dependencies;
- modules;
- symbols;
- relationships;
- architecture hypotheses;
- test coverage map;
- security risks;
- documentation gaps;
- high-risk areas.

The system must support multiple languages, including Java, Python, JavaScript, TypeScript, Go, Rust, C, C++, C#, PHP, Ruby, Kotlin, Swift, Dart, SQL, Shell, HTML, and CSS where compatible toolchains exist.

## 32. Debugging workspace

The debugging surface combines source, logs, stack traces, CI output, browser console, network failures, dependency state, configuration, and runtime information.

Required reasoning sequence:

```text
Inspect
→ Reproduce
→ Diagnose
→ Identify root cause
→ Inspect related code
→ Minimal fix
→ Test/build
→ Inspect output
→ Regression check
```

The system should explain evidence and confidence rather than invent certainty.

## 33. Code review workspace

Reviews show changed files, findings, severity, evidence, suggested fixes, test impact, security impact, maintainability impact, and final verification.

The reviewer should consider correctness, architecture, security, performance, readability, compatibility, tests, and regression risk.

## 34. Security workspace

Security UI covers:

- permissions;
- secrets;
- sandbox status;
- network access;
- tool capabilities;
- MCP trust;
- dependency vulnerabilities;
- code findings;
- audit events;
- approvals;
- policy decisions.

The core action policy is:

```text
ALLOW
ASK
DENY
```

## 35. Settings

Settings should include:

- profile;
- workspace;
- providers;
- credentials;
- model routing;
- execution providers;
- GitHub;
- deployment providers;
- MCP;
- integrations;
- security policy;
- notifications;
- appearance;
- accessibility;
- PWA behavior;
- usage and cost.

Sensitive settings require appropriate re-authentication or approval controls.

## 36. Usage and cost

The UI distinguishes:

```text
AI/API cost
Compute/sandbox cost
Storage cost
Deployment cost
INFINITY-11 platform cost
Unknown cost
```

Observed usage should be separated from provider-reported quotas. Unknown information remains unknown rather than being guessed.

## 37. GitHub workspace

GitHub is first-class.

```text
Issue
→ Research
→ Plan
→ Worktree
→ Implement
→ Test
→ Security
→ Review
→ PR
→ CI
→ Fix
→ Merge
→ Deploy
→ Observe
```

The UI exposes repository, branches, commits, diffs, PRs, issues, CI checks, reviews, and deployment links according to permissions.

## 38. Deployment workspace

Deployment supports provider adapters rather than a single required host.

```text
DeploymentProvider
├── Vercel
├── Cloudflare
├── Netlify
├── Docker
├── Self-hosted
└── Future providers
```

The interface shows environment, revision, build state, deployment state, runtime endpoint, logs, health, rollback, and redeploy options.

## 39. Operations workspace

Operations combines deployments, health checks, alerts, logs, incidents, repairs, verification, and release history.

```text
Observe
→ Detect
→ Diagnose
→ Repair
→ Verify
→ Record
```

Autonomous repair is always bounded by policy.

## 40. PWA behavior

The web product is installable as a PWA where supported. The shell should remain useful during temporary network loss, but offline functionality must not pretend that server-only capabilities are available.

Offline states must clearly distinguish cached UI from live server functionality.

## 41. Web notifications and long-running work

Notifications may report:

- run completed;
- run failed;
- approval required;
- workflow recovered;
- CI failed;
- deployment failed;
- security finding;
- provider degraded;
- credential cooldown;
- verification completed.

Notifications should link directly to the relevant run or object.

## 42. Web search and command palette

A universal search can locate projects, files, symbols, conversations, agents, workflows, runs, artifacts, knowledge, deployments, and settings.

A command palette provides fast actions while respecting permissions. Commands must not bypass policy.

## 43. Error and empty-state design

Every major web surface must support:

- loading;
- empty;
- success;
- warning;
- unavailable;
- unauthorized;
- forbidden;
- rate limited;
- provider failure;
- execution failure;
- validation failure;
- network failure;
- retrying;
- cancelled;
- policy denied.

Errors should identify the responsible layer when known and provide safe next actions.

## 44. Security boundary for the web

The browser must not contain long-lived provider secrets, privileged policy bypasses, unrestricted shell execution, or direct access to internal databases.

Server/runtime boundaries enforce:

```text
Identity
→ Authorization
→ Policy
→ Risk
→ Approval
→ Execution
→ Audit
```

## 45. Web performance

The web should use route-level code splitting, lazy loading for heavy surfaces, efficient streaming, bounded polling/subscriptions, virtualization for long logs/lists, cached project metadata, and resilient reconnection.

The product must remain usable on mobile devices and constrained networks.

## 46. Web accessibility

Accessibility includes semantic HTML, keyboard navigation, focus management, labels, announcements for dynamic status, accessible dialogs, contrast, reduced motion, touch targets, readable typography, and screen-reader-compatible state changes.

Accessibility must be tested rather than inferred from visual appearance.

## 47. Web observability

Web events should capture useful operational telemetry without leaking secrets or private content.

Important signals include page performance, API latency, streaming failures, reconnects, client errors, navigation errors, PWA failures, and interaction failures.

## 48. Extension model exposed by the web

The UI should allow discovery and management of agents, skills, tools, MCP servers, workflows, templates, plugins, providers, deployment adapters, and integrations.

Installing an extension must not automatically grant its requested permissions.

## 49. Marketplace web experience

Marketplace surfaces include discovery, search, categories, version, publisher, compatibility, license, dependencies, permissions, security status, evaluation status, changelog, installation, update, disable, and removal.

Private/internal registries can use the same contract.

## 50. Interoperability

The web can connect workflows and project state to OpenCode, Codex, Claude Code, Cline, IDE tooling, Termux, and future harnesses through adapters and portable contracts. Interoperability does not mean copying their implementation.

## 51. Mobile and desktop relationship

The responsive web/PWA is the primary interface. Native mobile and desktop applications are later V1 targets that share the same backend contracts and project model.

```text
Shared Project Specification
        ↓
Shared Services / APIs
        ↓
Web / PWA
Mobile
Desktop
```

## 52. Data and state model

Core entities include Workspace, Project, Conversation, Artifact, Provider, Credential, Model, Route Decision, Agent, Skill, Tool, MCP Server, Task, Run, Workflow, Workflow Run, Sandbox, Repository, Deployment, Knowledge Source, Memory, Evaluation, Audit Event, Usage Record, and Approval.

Durable state belongs to server-side domain services. The browser may cache safe presentation state but must not become the source of truth for execution.

## 53. Verification contract

A web action is complete only when relevant evidence exists.

```text
Change
→ Unit
→ Integration
→ Build
→ Runtime
→ Browser QA
→ Accessibility
→ Security
→ Regression
→ Evidence
```

The UI should display verification evidence and its scope.

## 54. Architecture invariants

- Provider independence.
- Multiple credentials per provider.
- BYOK-first.
- Free-first.
- Open-source-first.
- Local/self-hosted capable.
- Sandbox-provider independence.
- Database-provider independence.
- Deployment-provider independence.
- Policy-controlled privileged actions.
- Durable observable execution.
- Evidence-first verification.
- No private chain-of-thought exposure.
- No hidden quota assumptions.
- No fabricated backend functionality in the web UI.
- No duplicate browser orchestration.

## 55. Phase relationship

The detailed web product is implemented progressively across the 110-phase V1 roadmap. Phases 1–10 establish the current baseline. Phase 11 begins the advanced application builder. Later phases add multimodal creation, advanced workforce behavior, automation, research, engineering intelligence, model intelligence, security, governance, scale, interoperability, and final production hardening.

The roadmap is a planning contract; actual implementation status must always be verified from repository state, tests, builds, and CI.

## 56. Final V1 definition

V1 is complete only after Phase 110 closes the roadmap and the full system passes the final integration, regression, security, performance, compatibility, documentation, and production verification gates.

After V1, maintenance, security fixes, provider updates, compatibility work, reliability improvements, and future-version features continue without moving the V1 completion boundary.
