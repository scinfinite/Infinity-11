# INFINITY-11 — Detailed Product & Web Specification

> **Status:** Active product specification; implementation is underway.
> **Verified baseline:** Phases 1–10 are complete, merged into `main`, and verified by CI.
> **Next phase:** Phase 11 — Advanced Application Builder Foundation.
> **V1 roadmap:** `docs/architecture/INFINITY-11-V1-ROADMAP.md` — Phases 1–110.
> **Strategy:** FREE-FIRST + OPEN-SOURCE-FIRST + BYOK-FIRST.
> **Purpose:** Define the product, complete web experience, major features, modules, user journeys, state semantics, and web/runtime boundary without changing the core INFINITY-11 thesis.

---

## 1. Product definition

INFINITY-11 is a **provider-independent AI engineering, creation, automation, and operations operating system**. The first-class user experience is a premium responsive web/PWA command surface that connects AI models, credentials, agents, tools, MCP servers, execution environments, repositories, workflows, knowledge, verification, deployment, and operations.

The product is deliberately broader than chat and deliberately deeper than a prompt-to-app demo. A user can move from an idea to requirements, architecture, implementation, tests, verification, GitHub, deployment, operation, diagnosis, and improvement without changing the underlying project identity.

The four permanent product pillars are:

```text
CREATE     → make applications, interfaces, media, documents and artifacts
ENGINEER   → build, debug, review, test, secure, optimize and maintain software
AUTOMATE   → compose deterministic, agentic and hybrid workflows
OPERATE    → observe, diagnose, repair, verify, release and maintain systems
```

The web experience makes these pillars feel like one product rather than four disconnected applications.

---

## 2. Core product promise

> **Bring your AI keys. Bring your tools. Bring your repositories. Build, engineer, automate, and operate anything.**

INFINITY-11 is not tied to one model, one provider, one sandbox, one database, one deployment platform, or one agent harness.

The platform must distinguish:

1. platform functionality;
2. user-supplied AI/API costs;
3. execution and sandbox costs;
4. storage and data costs;
5. deployment/hosting costs;
6. optional managed convenience services.

“Free-first” means the platform should not require a paid subscription to be useful. It does not mean third-party AI, compute, storage, or deployment resources are unlimited or free.

---

## 3. Best-practically-achievable output

INFINITY-11 optimizes for the **best practically achievable verified output within user requirements, available resources, policies, and constraints**.

The default lifecycle is:

```text
Understand
  ↓
Research
  ↓
Specify
  ↓
Architect
  ↓
Plan
  ↓
Workforce / Workflow
  ↓
Model / Credential Route
  ↓
Execute
  ↓
Test
  ↓
Critique
  ↓
Improve
  ↓
Verify
  ↓
Deliver
  ↓
Observe
  ↓
Recover / Maintain
  ↓
Project Brain
```

The system must continue improvement when additional work can materially improve the result and the user/policy permits that work.

Quality dimensions:

- correctness;
- completeness;
- architecture;
- maintainability;
- security;
- performance;
- UX;
- accessibility;
- compatibility;
- verification;
- cost efficiency.

Quality states:

- `VERIFIED` — evidence satisfies the accepted verification contract;
- `PARTIALLY VERIFIED` — some required evidence exists but the complete contract is not satisfied;
- `UNVERIFIED` — output exists without sufficient verification evidence;
- `BLOCKED` — completion cannot safely proceed because of a dependency, policy, resource, or environment constraint.

---

## 4. Web product role

The web application is the primary human control and visualization surface.

The browser owns:

- presentation;
- navigation;
- interaction;
- local UI state;
- streaming presentation;
- editing controls;
- visual previews;
- client-side validation that is safe to duplicate;
- user approval interaction.

Backend/runtime systems own:

- authentication and authorization;
- policy decisions;
- credential use;
- model routing;
- durable execution;
- orchestration;
- sandboxing;
- workflow execution;
- security controls;
- verification;
- durable state;
- audit;
- background processing.

The web must **not become a second orchestration engine**. It may visualize plans and state, but it does not secretly reimplement the agent runtime, workflow runtime, routing engine, or security policy.

Long-running operations have durable server-side identities so the user can navigate away and return later.

---

# 5. Global web application shell

The global shell is the consistent frame around every capability.

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ Workspace │ Search / Command Palette │ Activity │ Notifications │ Profile │
├───────────────┬───────────────────────────────────────┬───────────────────┤
│ Primary Nav   │ Primary Work Area                     │ Context Inspector │
│               │                                       │                   │
│ Home          │ Chat / Code / Build / Design         │ Files             │
│ Chat          │ Research / Media / Agents            │ Models            │
│ Projects      │ Workflows / Runs / Operations        │ Tools             │
│ Code          │                                       │ Memory            │
│ Build         │                                       │ Project Brain      │
│ Design        │                                       │ Activity          │
│ Research      │                                       │ Verification      │
│ Media         │                                       │ Deployment        │
│ Agents        │                                       │                   │
│ Workflows     │                                       │                   │
│ Runs          │                                       │                   │
│ Deployments   │                                       │                   │
│ Settings      │                                       │                   │
└───────────────┴───────────────────────────────────────┴───────────────────┘
```

The exact navigation labels may evolve, but these conceptual responsibilities remain stable:

- **primary navigation** gets the user to a capability;
- **primary work area** performs the work;
- **context inspector** explains the state, evidence, resources, and controls surrounding the work.

---

## 6. Responsive behavior

### Desktop

Desktop uses a three-region workspace when useful: navigation, primary work, and context. Panels can resize or collapse without destroying the current task.

### Tablet

Tablet prioritizes primary work and collapses secondary context into drawers/sheets. Navigation becomes compact while preserving direct access to projects, runs, approvals, and active work.

### Mobile

Mobile uses stacked views, bottom navigation or compact navigation, drawers, bottom sheets, touch-friendly controls, and simplified inspectors. Long-running work remains observable and approvals remain actionable.

### PWA

The installed PWA uses the same product identity and responsive behavior. Offline behavior is limited to capabilities that can safely operate without the backend. Cached shell behavior must never imply that a remote run succeeded while disconnected.

---

## 7. Accessibility and interaction contract

Accessibility is a product requirement, not a final polish pass.

The web must support:

- semantic controls;
- keyboard navigation;
- visible focus;
- logical focus order;
- readable contrast;
- screen-reader labels;
- reduced motion;
- touch target sizing;
- error association;
- status announcements where appropriate;
- non-color-only state communication;
- responsive text and layout.

Destructive or high-impact actions must have explicit affordances and appropriate confirmation/approval behavior.

---

# 8. Home / Command Center

The Command Center is the operational home of INFINITY-11.

It summarizes:

- active projects;
- recent conversations;
- active agent runs;
- workflow runs;
- background jobs;
- pending approvals;
- recent artifacts;
- verification failures;
- provider health;
- credential health;
- usage and cost;
- deployments;
- security alerts;
- important system events.

A Command Center card must distinguish **information** from **action**. A warning should answer:

```text
What happened?
Why does it matter?
What evidence exists?
What can I do next?
Is approval required?
```

Empty states explain how to begin useful work instead of merely stating that no data exists.

---

# 9. Universal multimodal composer

The composer is the common entry point for intent.

It supports, subject to provider and runtime capability:

- text;
- images;
- audio;
- video;
- documents;
- code;
- repository/project context;
- model selection;
- automatic routing;
- agent selection;
- tools;
- MCP;
- workflow invocation;
- artifact generation;
- structured output;
- cancellation;
- retry;
- regeneration;
- verification requests.

The composer must communicate capability constraints honestly. If the selected route cannot perform the requested operation, the user receives an alternative route or a clear explanation.

---

# 10. Chat workspace

Chat is the general conversational surface, but it is connected to the entire operating system.

A conversation may, subject to policy:

- inspect project files;
- search symbols;
- read Project Brain;
- use skills;
- call tools;
- invoke MCP;
- execute code in a sandbox;
- create or modify artifacts;
- start an agent run;
- start a workflow;
- request research;
- modify a project;
- run tests;
- request browser QA;
- prepare GitHub changes;
- request deployment;
- inspect operational failures.

The conversation timeline distinguishes:

```text
CONNECTING
GENERATING
TOOL USE
WAITING FOR APPROVAL
WAITING FOR EXECUTION
VERIFYING
COMPLETED
FAILED
CANCELLED
```

Tool activity is observable, but private model chain-of-thought is not exposed.

---

# 11. Model and BYOK workspace

The model workspace is where users manage provider-independent AI access.

The conceptual hierarchy is:

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

Users can see safe metadata such as:

- provider;
- masked credential identifier;
- credential health;
- last validation;
- model availability;
- cooldown state;
- observed usage signals;
- policy eligibility.

Raw credentials must not be displayed after secure entry.

Routing modes include:

- manual;
- automatic;
- quality-first;
- speed-first;
- cost-first;
- free-only;
- local-only;
- provider-preferred;
- capability-first;
- custom policy.

---

# 12. AI Workspace and context inspector

The AI Workspace unifies model/agent selection, project context, tools, routing, execution, approvals, and verification.

The context inspector should show high-level evidence about what was supplied to the task:

- relevant files;
- symbols;
- Project Brain entries;
- knowledge items;
- memories;
- skills;
- policies;
- tools;
- MCP capabilities;
- omitted context caused by budget or policy.

It should explain relevance without exposing private chain-of-thought.

---

# 13. Projects workspace

A project is the durable unit connecting software, knowledge, automation, agents, and operations.

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

Project isolation applies to context, permissions, secrets, execution, artifacts, and operational state.

---

# 14. Advanced application builder

The Build workspace is the central application creation surface.

The intended lifecycle is:

```text
Idea
→ Requirements
→ Architecture
→ Stack
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

The builder supports both:

1. **greenfield projects** — generate a new application from requirements;
2. **existing projects** — inspect and safely modify an existing repository.

The target is serious multi-service applications, not only toy landing pages.

---

## 14.1 Builder layout

The builder can expose:

- project/file tree;
- code editor;
- command/terminal output;
- task plan;
- agent activity;
- live preview;
- build state;
- test state;
- browser QA;
- verification report;
- change summary;
- Git diff;
- GitHub status;
- deployment status;
- approval requests;
- application logs.

The interface should make it possible to move from generated output to inspected source and evidence.

---

## 14.2 Natural-language modification

Users may request:

- add a feature;
- fix a bug;
- redesign a page;
- add authentication;
- add or modify APIs;
- change database schema;
- add storage;
- add background jobs;
- improve responsiveness;
- improve accessibility;
- optimize performance;
- migrate dependencies;
- refactor a module;
- add tests;
- repair CI;
- prepare deployment.

Before modifying an existing project, the system should inspect relevant code, dependencies, tests, Project Brain, architecture decisions, and known failure history.

The UI must expose what changed and what verification was performed.

---

# 15. Code workspace

The Code workspace is a developer-grade repository surface.

Core capabilities include:

- file tree;
- code editor;
- repository search;
- symbol navigation;
- references;
- diagnostics;
- diff view;
- change history;
- terminal/output;
- tests;
- agent assistance;
- review findings;
- security findings;
- performance findings;
- verification evidence.

The editor must not label generated code as correct merely because generation completed.

---

# 16. Build and execution workspace

Build operations are represented as durable runs and delegated through the execution abstraction.

```text
Web / PWA
   ↓
Control API
   ↓
ExecutionManager
   ├── Local
   ├── Docker
   ├── E2B
   ├── Self-hosted
   └── Future execution adapters
   ↓
Build / Test / Run / Browser QA
```

The web shows:

- run identifier;
- status;
- timestamps;
- logs;
- outputs;
- artifacts;
- resource information where available;
- verification status;
- failure reason;
- retry/recovery controls where allowed.

---

# 17. Preview workspace

Preview renders the application and its evidence state.

It must distinguish:

- building;
- starting;
- running;
- unavailable;
- failed;
- partially verified;
- verified.

Preview supports viewport-oriented inspection and links failures back to browser QA and relevant runs.

---

# 18. Browser and visual QA

The Browser QA surface displays:

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

The improvement loop is:

```text
Detect
→ Explain
→ Repair
→ Rebuild
→ Reopen
→ Recheck
→ Verify
```

Visual evidence is evidence, not a replacement for functional testing.

---

# 19. Agents workspace

Agents are executable workers governed by explicit policies.

An agent package contains:

```text
identity
role
capabilities
skills
tools
model_policy
context_policy
memory_policy
permission_policy
execution_profile
verification_policy
budget_policy
history
```

The Agents screen should show:

- installed agents;
- active agents;
- capabilities;
- assigned tools;
- skills;
- model policy;
- permission policy;
- budget;
- current run;
- verification status;
- historical performance.

Agents are not merely personas or prompt presets.

---

# 20. Workforce workspace

The Workforce surface visualizes a project team.

```text
Team Lead / Orchestrator
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

The workforce may change dynamically based on task requirements.

The UI exposes:

- assignments;
- dependencies;
- progress;
- outputs;
- blocked workers;
- conflicts;
- approvals;
- verification.

Parallel work must remain dependency-aware. Contradictory results require explicit synthesis or review.

---

# 21. Workflow builder

Automation is a first-class product surface rather than a hidden agent capability.

The visual workflow model includes:

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

Users can create workflows visually or through natural language.

Natural language should compile into a visible, editable workflow graph. The graph is the source of user-visible automation structure.

---

# 22. Automation run workspace

Every workflow run has durable state.

The UI displays:

- trigger;
- workflow version;
- current node;
- completed nodes;
- pending nodes;
- retries;
- approvals;
- logs;
- outputs;
- failures;
- recovery state;
- verification;
- final result.

Durable workflows can resume after transient failures where the underlying operation is safely resumable.

---

# 23. Approvals and privileged actions

The Approvals workspace is the human-in-the-loop boundary.

A request includes:

- requesting actor;
- project;
- action;
- target;
- risk classification;
- reason;
- affected resources;
- proposed changes;
- evidence;
- expiry;
- decision.

The policy model is:

```text
ALLOW
ASK
DENY
```

Typical defaults:

```text
Read repository                 ALLOW
Run tests                       ALLOW
Modify isolated sandbox         ALLOW
Create branch                   ALLOW / ASK by policy
Create pull request             ASK
Merge pull request              ASK
Production deployment           ASK
Use privileged secret           ASK
Delete production data          DENY by default
```

The exact policy is configurable within safe limits.

---

# 24. Runs and activity

Runs are the universal operational record for asynchronous work.

A run can represent:

- model generation;
- agent execution;
- workflow execution;
- build;
- test;
- browser QA;
- deployment;
- repair;
- migration;
- research;
- background job.

The Runs workspace supports filtering by project, type, actor, state, model, provider, time, and outcome.

---

# 25. Artifacts

Artifacts are durable outputs of work.

Examples:

- code patches;
- source files;
- application builds;
- screenshots;
- videos;
- audio;
- documents;
- presentations;
- test reports;
- security reports;
- research reports;
- workflow outputs;
- deployment records.

Artifacts carry provenance where practical:

```text
Artifact
→ source run
→ project
→ agent / user
→ model / provider when relevant
→ inputs
→ verification
→ version
```

---

# 26. Multimodal creation

The product includes specialized creation surfaces while preserving a unified artifact model.

## Image Studio

Supports prompt-based generation, editing, variation, composition, reference inputs, transparent backgrounds where supported, and project-aware assets.

## Audio and Voice Studio

Supports generation/transformation workflows where the selected provider permits them. Voice features must communicate consent, provenance, provider limitations, and applicable policy.

## Video Studio

Supports storyboard-oriented creation, generation, editing, asset composition, and verification of output properties where technically supported.

## Document and Presentation Studio

Supports structured documents, reports, presentations, exports, revisions, and evidence-linked source material.

## Unified Media Workspace

All media surfaces share:

- project context;
- model/provider routing;
- artifacts;
- versioning;
- permissions;
- usage/cost accounting;
- verification;
- search;
- Project Brain references.

---

# 27. Research workspace

Research is a first-class workflow rather than an ordinary chat mode.

The Research UI exposes:

- research question;
- sources;
- source status;
- claims;
- extracted evidence;
- synthesis;
- citations;
- unresolved questions;
- confidence/verification state;
- final artifact.

The system must distinguish sourced facts from model-generated inference and must not invent citations.

External data collection must respect applicable copyright, licensing, access, privacy, and provider terms.

---

# 28. Knowledge workspace

Knowledge stores durable project or workspace information.

Sources may include:

- uploaded documents;
- project files;
- approved external sources;
- research results;
- architecture documents;
- decisions;
- run outputs;
- lessons learned.

Knowledge items are indexed and retrievable through the Context Intelligence layer.

---

# 29. Project Brain

Project Brain is the durable intelligence layer for a project.

It contains structured knowledge such as:

```text
requirements
architecture
architecture decisions
coding conventions
dependencies
codebase map
test map
known bugs
failed approaches
successful patterns
security findings
performance findings
deployments
agent history
model performance
lessons learned
operational incidents
```

The Project Brain must be evidence-aware. A failed approach should not become a recommendation without context; a successful approach should retain the conditions under which it worked.

---

# 30. Context Intelligence

Context is assembled from multiple sources:

```text
Conversation
+ Repository
+ Symbols
+ Project Brain
+ Skills
+ Memory
+ Knowledge
+ Tools
+ Policies
        ↓
Retrieve
        ↓
Rank
        ↓
Compress
        ↓
Budget
        ↓
Assemble
```

The context inspector should make this process understandable without exposing private reasoning.

Context budget decisions are observable as metadata such as included, omitted, summarized, or blocked resources.

---

# 31. Memory

Memory has different scopes and must not be treated as an undifferentiated prompt history.

Conceptual scopes:

- conversation;
- project;
- workspace;
- agent;
- skill/tool;
- system policy.

Memory should record useful durable information while respecting privacy, retention, permissions, and user controls.

Project Brain is the structured engineering intelligence layer; memory can contain broader interaction knowledge.

---

# 32. Codebase intelligence

For software projects, the system should progressively build:

```text
Language detection
→ Framework detection
→ Dependency graph
→ Symbol graph
→ Architecture inference
→ Test map
→ Risk map
→ Documentation map
→ Codebase index
```

This intelligence feeds debugging, review, modification, migration, testing, and architecture decisions.

The UI should make discovered structure inspectable rather than presenting an opaque score.

---

# 33. Debugging and root-cause analysis

The debugging experience follows an evidence-first loop:

```text
Collect evidence
→ Reproduce
→ Narrow scope
→ Trace execution
→ Identify root cause
→ Propose minimal fix
→ Implement
→ Test
→ Regression check
→ Verify
```

Evidence can include:

- stack traces;
- logs;
- failing tests;
- diagnostics;
- code paths;
- dependency versions;
- environment information;
- browser console/network evidence;
- Git history;
- previous Project Brain incidents.

The system must distinguish symptom, contributing factor, root cause, and fix evidence.

---

# 34. Code review and refactoring

Review surfaces findings by category:

- correctness;
- architecture;
- security;
- performance;
- maintainability;
- test coverage;
- API compatibility;
- dependency risk;
- accessibility where UI is involved.

Refactoring must preserve behavior unless behavior change is explicitly requested.

Suggested changes should be linked to files, symbols, tests, and verification evidence.

---

# 35. Security workspace

Security is visible throughout the product.

The Security surface covers:

- permission policies;
- credentials;
- secrets;
- sandbox status;
- dependency findings;
- MCP trust;
- action audit;
- authentication state;
- deployment security;
- project risks.

Security actions should be classified by impact and should not bypass the central policy layer.

---

# 36. Settings and control center

Settings are grouped by responsibility rather than one undifferentiated list.

```text
Workspace
Identity
Providers
Credentials
Models
Routing
Agents
Skills
Tools
MCP
Execution
Security
Permissions
Notifications
Appearance
Accessibility
Usage
Storage
GitHub
Deployments
Interoperability
Advanced
```

Sensitive settings require stronger affordances and should avoid exposing secrets.

---

# 37. Usage and cost workspace

Usage reporting separates:

- AI model usage;
- provider/API usage;
- sandbox/compute usage;
- storage usage;
- deployment usage;
- platform usage where relevant.

Each value has a provenance state where necessary:

```text
OBSERVED
PROVIDER_REPORTED
ESTIMATED
UNKNOWN
```

Unknown cost must remain unknown rather than being fabricated.

Users can inspect cost by project, provider, credential, model, agent, workflow, and time range where data permits.

---

# 38. GitHub workspace

GitHub integration follows the engineering lifecycle:

```text
Issue
→ Plan
→ Worktree / Branch
→ Implement
→ Test
→ Security
→ Review
→ Pull Request
→ CI
→ Repair
→ Merge
```

The web surface shows repository, branch, changes, checks, pull requests, and deployment relationships.

High-impact repository actions are policy-controlled.

---

# 39. Deployment workspace

Deployments are adapter-backed.

The conceptual flow is:

```text
Build
→ Validate
→ Package
→ Approval if required
→ Deploy
→ Health check
→ Browser / smoke verification
→ Observe
```

Vercel or another platform may be an adapter. It is not the core architecture.

---

# 40. Operations workspace

Operations brings deployed systems into the same lifecycle as code.

It provides:

- service health;
- deployments;
- incidents;
- logs;
- metrics where available;
- alerts;
- recent changes;
- run history;
- recovery actions;
- verification;
- rollback/release controls.

Autonomous repair is bounded by policy and approval requirements.

---

# 41. Notifications and activity

Notifications are meaningful operational events, not a generic stream of every internal event.

Examples:

- approval required;
- build failed;
- verification failed;
- deployment unhealthy;
- credential invalid;
- provider degraded;
- workflow resumed;
- security finding discovered;
- artifact ready.

Users can inspect the underlying run or event from a notification.

---

# 42. Search and command palette

Global search spans permitted:

- projects;
- files;
- symbols;
- conversations;
- runs;
- artifacts;
- agents;
- workflows;
- knowledge;
- deployments;
- settings.

The command palette exposes actions appropriate to the user's permissions and current context.

It must not surface actions that the policy engine would reject as executable choices without clearly indicating the required permission/approval state.

---

# 43. Loading, empty, error, and recovery states

Every major screen defines explicit states.

### Loading

Show what is loading and preserve the user's existing context where possible.

### Empty

Explain why the surface is empty and provide a useful next action.

### Unavailable

Explain whether the issue is capability, provider, credential, permission, connectivity, or dependency related.

### Error

Show actionable error information and a path to retry, diagnose, or recover.

### Partial success

Show which work succeeded and which work remains incomplete.

### Recovery

When a run is resumable, expose recovery state rather than pretending it restarted from the beginning.

---

# 44. Web security boundary

The browser must never receive secrets unnecessarily.

Sensitive operations use server-side policy enforcement and controlled credentials.

The web must not:

- execute arbitrary privileged commands solely because UI code requested them;
- bypass policy checks;
- embed raw provider keys in normal client state;
- fabricate successful backend state;
- treat client-side validation as authorization;
- make irreversible operations appear equivalent to preview operations.

---

# 45. Performance requirements

The web must remain responsive while remote work is running.

Principles include:

- stream useful progress;
- virtualize large lists where necessary;
- lazy-load heavy surfaces;
- avoid unnecessary rerenders;
- preserve editor responsiveness;
- keep large logs incremental;
- avoid blocking the main thread with heavy computation;
- use remote execution for expensive work when appropriate.

Performance measurements must distinguish UI latency from backend/execution latency.

---

# 46. Observability contract

The UI should correlate major actions with durable identifiers:

```text
workspace_id
project_id
conversation_id
run_id
workflow_id
workflow_run_id
agent_id
artifact_id
deployment_id
event_id
```

Where appropriate, users can navigate from a result to the run, from the run to logs, from logs to artifacts, and from artifacts to the project change that produced them.

---

# 47. Verification contract

The product treats verification as a first-class result.

A verification record may include:

- test results;
- build results;
- lint/typecheck results;
- security findings;
- browser QA;
- visual QA;
- accessibility results;
- performance checks;
- GitHub CI results;
- deployment health;
- reviewer decisions.

A model saying “done” is not verification evidence.

---

# 48. Web information hierarchy

The product should preserve a consistent hierarchy:

```text
Intent
 ↓
Work
 ↓
Context
 ↓
Execution
 ↓
Evidence
 ↓
Decision / Approval
 ↓
Result
 ↓
History / Memory
```

This prevents the UI from becoming a collection of disconnected dashboards.

---

# 49. Interoperability

INFINITY-11 is designed to work with and around existing developer tools.

Target interoperability includes:

- OpenCode;
- Codex;
- Claude Code;
- Cline;
- IDE/developer tools;
- Termux;
- GitHub tooling;
- future agent/skill protocols.

The architecture uses adapters and stable contracts rather than assuming one external harness is authoritative.

---

# 50. Skills, tools, and MCP

Skills are reusable capability packages. A conceptual skill package contains:

```text
SKILL.md
metadata
references
scripts
examples
tests
adapters
```

Tools expose controlled actions.

MCP integrations are treated as a supply-chain and permission problem, not merely an installation button.

The user-facing lifecycle is:

```text
Discover
→ Inspect
→ Trust assessment
→ Permission analysis
→ Install
→ Sandbox / constrain
→ Monitor
→ Audit
```

---

# 51. Marketplace and extension model

The eventual marketplace can contain:

- agents;
- skills;
- teams;
- tools;
- MCP servers;
- workflows;
- templates;
- plugins;
- integrations.

Published items should carry metadata for:

- publisher;
- version;
- permissions;
- tools;
- secrets;
- model requirements;
- dependencies;
- compatibility;
- security information;
- evaluation status.

Marketplace availability must not weaken the security model.

---

# 52. Application targets

The web product controls creation of multiple application classes:

```text
Web
Mobile
Desktop
Backend / Services
APIs
Workers / Jobs
Shared packages
```

The same Project Brain, Git lifecycle, testing, verification, and deployment abstractions should be reusable across targets.

---

# 53. Data and state model

Major product entities include:

```text
Workspace
Project
Conversation
Message
Artifact
Provider
Credential
Model
RouteDecision
Agent
Skill
Tool
MCPServer
Task
AgentRun
Workflow
WorkflowRun
Execution
Sandbox
Repository
Deployment
KnowledgeSource
KnowledgeItem
Memory
Evaluation
Verification
AuditEvent
UsageRecord
```

The exact storage technology can evolve. Domain contracts should not depend on a single vendor.

---

# 54. State semantics

Long-running states must be explicit.

Generic run lifecycle:

```text
CREATED
→ QUEUED
→ PREPARING
→ ROUTING
→ RUNNING
→ WAITING / PAUSED
→ VERIFYING
→ COMPLETED
```

Terminal or exceptional states include:

```text
FAILED
CANCELLED
TIMED_OUT
BUDGET_EXCEEDED
POLICY_DENIED
BLOCKED
PARTIALLY_VERIFIED
```

The exact state machine for each domain can specialize this contract, but state transitions must be deterministic and observable.

---

# 55. Error semantics

Errors are classified rather than displayed as arbitrary provider strings.

Useful classes include:

- validation;
- authentication;
- authorization;
- policy denial;
- provider unavailable;
- credential invalid;
- rate limited;
- quota exhausted;
- execution failure;
- dependency failure;
- timeout;
- verification failure;
- artifact failure;
- deployment failure;
- unknown/internal failure.

The UI should show a human explanation while preserving machine-readable classification for recovery and automation.

---

# 56. Provider independence in the web

Provider names are user-visible metadata, not architectural boundaries.

The UI may display:

```text
OpenAI
Anthropic
Google
local model
self-hosted endpoint
other provider
```

but product behavior is expressed in capability terms such as:

- text generation;
- vision;
- image generation;
- audio;
- video;
- tool calling;
- structured output;
- embeddings;
- reasoning;
- context capacity.

If a provider lacks a capability, the router chooses an eligible alternative or explains the limitation.

---

# 57. Execution abstraction

The web should not know whether a build is running locally, in Docker, E2B, a self-hosted worker, or another execution environment except where that information is useful to the user.

```text
ExecutionManager
├── LocalProvider
├── DockerProvider
├── E2BProvider
├── SelfHostedProvider
└── FutureProvider
```

This preserves the option to move heavy workloads away from mobile/low-power devices.

---

# 58. Mobile and desktop relationship

Mobile is a first-class control surface, not a reduced product idea.

The web/PWA experience must support:

- monitoring;
- chat;
- approvals;
- run inspection;
- artifact review;
- project navigation;
- workflow monitoring;
- deployment status;
- lightweight editing;
- command/control.

Desktop can provide a deeper development environment where local filesystem, terminals, editors, or local runtimes are appropriate.

The underlying project and run identities remain portable.

---

# 59. Web extensibility

New product surfaces should compose shared primitives:

```text
Command Center
Composer
Context Inspector
Run Viewer
Artifact Viewer
Approval Panel
Verification Panel
Activity Timeline
Provider/Model Selector
Project Navigator
```

This avoids every feature inventing a separate status and interaction language.

---

# 60. Product invariants

The following are non-negotiable:

1. INFINITY-11 remains provider-independent.
2. BYOK remains first-class.
3. Multiple credentials per provider remain supported.
4. Local/self-hosted paths remain valid where technically feasible.
5. No single sandbox provider becomes the architecture.
6. No single database becomes the architecture.
7. No single deployment vendor becomes the architecture.
8. Agents remain governed executable workers.
9. Deterministic and agentic automation remain first-class.
10. Privileged actions remain policy-controlled.
11. Untrusted code remains isolated.
12. Verification evidence remains separate from model claims.
13. Long-running work remains durable and observable.
14. The browser does not become a second orchestration engine.
15. Secrets remain protected.
16. Cost and quota information is never fabricated.
17. Competitor research informs patterns but does not authorize wholesale copying.
18. Existing completed work is preserved unless an evidence-based correction is required.
19. Documentation reflects actual implementation status.
20. V1 completion remains Phase 110.

---

# 61. Current implementation boundary

As of the current verified baseline:

- Phases 1–10 are complete.
- Phase 10 established the core web/PWA product UX.
- The web shell, Command Center, AI Workspace, Projects, Runs, Approvals, Artifacts, Usage, Settings, responsive behavior, accessibility contracts, PWA metadata/offline shell behavior, and regression contracts form the current web baseline.
- Some surfaces intentionally represent backend boundaries that are not yet fully wired to later-phase runtime capabilities.
- Such surfaces must not be mistaken for completed backend functionality.
- Phase 11 is the next implementation target: Advanced Application Builder Foundation.

The product specification describes the complete V1 target; it is not evidence that every described feature is already implemented.

---

# 62. Relationship to the architecture specification

`docs/description/INFINITY-11-ARCHITECTURE-AND-SCREENS.md` defines system architecture, planes, domain boundaries, execution semantics, security, and screen contracts.

This document defines the **product and web experience in detail**.

They must remain complementary:

```text
Detailed Product & Web Specification
        ↕
Architecture & Screen Specification
        ↕
Canonical Architecture Blueprint
        ↕
V1 Phase Roadmap
        ↕
Repository Implementation + Tests + CI
```

The repository and CI remain the source of truth for implementation status.

---

# 63. V1 definition

INFINITY-11 V1 is complete only when Phase 110 closes the roadmap.

V1 must provide a coherent system in which a user can:

```text
Enter intent
→ build context
→ choose or route AI
→ delegate to agents/workflows
→ execute safely
→ inspect evidence
→ improve the result
→ verify it
→ create artifacts
→ manage GitHub
→ deploy
→ observe
→ recover
→ retain project intelligence
```

The web is the command center through which this lifecycle becomes understandable and controllable.

---

# 64. Final web principle

The final experience should feel like one **AI operating system for creation, engineering, automation, and operations**, not a pile of unrelated AI tools.

Every major surface should answer five questions:

```text
What am I doing?
What context is being used?
What is the system doing now?
What evidence do we have?
What can I safely do next?
```

That principle is the stable UX expression of the INFINITY-11 core idea.
