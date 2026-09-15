# INFINITY-11 — Architecture & Screen Specification

> **Status:** Active canonical architecture and screen contract.
> **Implementation baseline:** Phases 1–10 complete, merged into `main`, and verified by CI; Phase 11 is next.
> **V1 roadmap:** `docs/architecture/INFINITY-11-V1-ROADMAP.md`, Phases 1–110.
> **Strategy:** FREE-FIRST + OPEN-SOURCE-FIRST + BYOK-FIRST.
> **Scope:** System planes, domain boundaries, control/data flows, runtime semantics, security, verification, web screen contracts, responsive behavior, and adapter boundaries.

---

## 1. Architectural intent

INFINITY-11 is a provider-independent AI engineering, creation, automation, and operations operating system. The architecture must remain independent of any single model provider, database vendor, sandbox vendor, deployment platform, browser harness, or agent framework.

The central invariant is:

```text
User intent
    ↓
Experience / API
    ↓
Identity + Workspace + Policy
    ↓
Context + Intelligence
    ↓
AI Gateway + Model/Credential Router
    ↓
Agent / Workflow / Direct Task
    ↓
Execution Fabric
    ↓
Verification
    ↓
Artifacts / Repository / Deployment
    ↓
Observability + Audit + Project Brain
    ↓
User-visible result
```

The same semantic model must underlie Chat, Code, Build, Design, Media, Research, Agents, Workflows, and Operations.

---

## 2. Core architectural principles

1. **Provider independence:** providers are adapters, never the product's center.
2. **BYOK-first:** user credentials are first-class and can exist in multiple independent entries per provider.
3. **Free-first:** useful operation must be possible without a mandatory platform subscription.
4. **Open-source-first:** open technologies and replaceable interfaces are preferred where practical.
5. **Evidence-first:** completion is established by verification evidence, not model claims.
6. **Policy-first:** privileged actions pass through centralized authorization and approval.
7. **Execution isolation:** untrusted generated code is controlled before execution.
8. **Durability:** long-running work has durable identities and resumable state where safe.
9. **Observability:** important state transitions are inspectable and auditable.
10. **Web boundary:** the browser is a presentation/interaction surface, not a second orchestration engine.
11. **Adapter boundary:** external vendors are replaceable implementations behind stable contracts.
12. **Incremental evolution:** completed phase contracts are preserved unless evidence requires a deliberate change with regression coverage.
13. **Interoperability:** OpenCode, Codex, Claude Code, Cline, Termux, IDE tooling, and future systems are integration targets, not architectural dependencies.
14. **Security by construction:** secrets, permissions, execution, and supply-chain trust are modeled explicitly.
15. **Maintainability:** architecture favors clear domain ownership and small stable contracts over hidden coupling.

---

## 3. Architectural planes

```text
┌──────────────────────────────────────────────────────────────────┐
│ EXPERIENCE PLANE                                                 │
│ Web/PWA • Command Center • Chat • Code • Build • Design         │
│ Research • Media • Agents • Workflows • Runs • Operations       │
├──────────────────────────────────────────────────────────────────┤
│ CONTROL PLANE                                                    │
│ Identity • Workspace • Policy • Permissions • Approval          │
│ Security • Secrets • Cost • Audit • Feature configuration       │
├──────────────────────────────────────────────────────────────────┤
│ INTELLIGENCE PLANE                                               │
│ AI Gateway • Model Registry • Router • Context • Project Brain  │
│ Knowledge • Memory • Evaluation • Quality • Code Intelligence   │
├──────────────────────────────────────────────────────────────────┤
│ EXECUTION PLANE                                                  │
│ Agents • Tasks • Tools • MCP • Browser • Terminal • Workflows   │
│ Sandboxes • Worktrees • Background Jobs • Build/Test            │
├──────────────────────────────────────────────────────────────────┤
│ ADAPTER PLANE                                                    │
│ AI Providers • Local Models • GitHub • Databases • Storage      │
│ Sandboxes • Browser Providers • Deployment Targets              │
├──────────────────────────────────────────────────────────────────┤
│ DATA PLANE                                                       │
│ Relational State • Object Storage • Events • Usage • Audit      │
│ Knowledge Index • Execution State • Artifacts                   │
└──────────────────────────────────────────────────────────────────┘
```

No plane is allowed to silently absorb responsibilities belonging to another plane.

---

## 4. System control flow

A normal request follows this conceptual sequence:

```text
Intent
 ↓
Identity
 ↓
Workspace / Project
 ↓
Policy
 ↓
Context requirements
 ↓
Capability requirements
 ↓
Model / Agent / Workflow selection
 ↓
Credential eligibility
 ↓
Execution plan
 ↓
Approval if required
 ↓
Execution
 ↓
Verification
 ↓
Artifact / external effect
 ↓
Audit + usage + telemetry
 ↓
Project Brain update
```

The sequence can branch for workflows, parallel workers, retries, approvals, or external events, but the security and verification boundaries remain.

---

## 5. Domain model

Core domains are:

```text
Identity
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
WorkflowVersion
WorkflowRun
Execution
Sandbox
Repository
Worktree
Deployment
KnowledgeSource
KnowledgeItem
Memory
Evaluation
Verification
AuditEvent
UsageRecord
Notification
```

Each domain owns its state and publishes stable events/contracts instead of allowing unrelated modules to mutate internal state directly.

---

## 6. Identity and workspace boundary

Identity determines who is acting. Workspace determines where the action is allowed to occur.

A project belongs to a workspace and inherits applicable policies while allowing project-specific restrictions.

Security context should conceptually include:

```text
actor
workspace
project
role
permissions
policy
credential scope
execution scope
resource scope
```

Every privileged operation must evaluate this context server-side.

---

## 7. AI Intelligence Gateway

The AI Gateway is the normalized inference boundary.

```text
Request
 ↓
Authentication
 ↓
Authorization
 ↓
Policy
 ↓
Intent / task classification
 ↓
Context requirements
 ↓
Capability requirements
 ↓
Candidate models
 ↓
Credential eligibility
 ↓
Provider health
 ↓
Quota signal
 ↓
Cost / latency policy
 ↓
Historical performance
 ↓
Route
 ↓
Execution
 ↓
Verification
 ↓
Usage + audit
```

The browser does not call provider APIs directly as the system's architectural inference path.

---

## 8. Provider adapter contract

Conceptually:

```text
ProviderAdapter
├── validateCredential()
├── discoverModels()
├── discoverCapabilities()
├── generateText()
├── streamText()
├── generateImage()
├── generateAudio()
├── generateVideo()
├── embed()
├── usage()
└── health()
```

Not every provider implements every operation. Capability metadata determines eligibility.

Provider-specific request/response formats are normalized at the adapter boundary.

---

## 9. Model registry

The model registry contains normalized metadata:

```text
provider
model_id
display_name
modalities
capabilities
context_window
max_output
tool_support
streaming
reasoning_support
pricing
availability
health
metadata_source
last_observed
```

Metadata provenance matters. Values may be:

```text
PROVIDER_REPORTED
OBSERVED
ESTIMATED
UNKNOWN
```

Unknown must remain unknown.

---

## 10. Credential architecture

One provider may contain many credentials.

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

Credential lifecycle:

```text
ACTIVE
DEGRADED
RATE_LIMITED
COOLDOWN
EXHAUSTED
INVALID
REVOKED
UNKNOWN
```

Rules:

- raw secrets never appear in ordinary UI after entry;
- secrets do not enter ordinary telemetry or logs;
- credentials are independently routable;
- invalid credentials can be quarantined;
- cooldowns are policy-controlled;
- credential identity may be referenced by run records without exposing secret material.

---

## 11. Model and credential routing

Routing applies hard constraints first.

```text
Request
 ↓
Hard constraints
 ↓
Capability filter
 ↓
Policy filter
 ↓
Credential filter
 ↓
Provider health
 ↓
Quota signal
 ↓
Cost / latency policy
 ↓
Historical performance
 ↓
Preference scoring
 ↓
Selected route
 ↓
Bounded fallback chain
```

Supported routing concepts include manual, automatic, quality-first, speed-first, cost-first, free-only, local-only, provider-preferred, capability-first, and custom policy.

Fallback must be bounded, loop-free, and compatible with the original task requirements.

---

## 12. Explainable routing

Users should be able to inspect safe routing evidence:

```text
REQUEST
 ↓
REQUIREMENTS
 ↓
ELIGIBLE MODELS
 ↓
ELIGIBLE CREDENTIALS
 ↓
POLICY / HEALTH / COST SIGNALS
 ↓
SELECTED ROUTE
 ↓
FALLBACKS
```

The explanation describes observable decision inputs. It never exposes private model chain-of-thought.

---

## 13. Context architecture

Context is assembled from:

```text
Conversation
Repository
Symbols
Project Brain
Skills
Memory
Knowledge
Tools
Policies
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

Context assembly is policy-aware. A resource can be omitted because it is irrelevant, too large, restricted, unavailable, or outside the task's permission scope.

The context inspector exposes metadata about inclusion/exclusion without revealing private reasoning.

---

## 14. Project Brain architecture

Project Brain is the structured long-lived intelligence of a project.

It can contain:

```text
requirements
architecture
architecture decisions
conventions
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
incidents
```

Project Brain entries should preserve provenance, confidence/evidence state, scope, and applicability when useful.

---

## 15. Agent runtime

Agents are durable workers.

```text
CREATED
 ↓
QUEUED
 ↓
CONTEXT_PREPARING
 ↓
ROUTING
 ↓
RUNNING
 ├── TOOL_WAIT
 ├── APPROVAL_WAIT
 ├── CHILD_TASKS
 └── SANDBOX_WAIT
 ↓
VERIFYING
 ↓
COMPLETED
```

Terminal/exception states:

```text
FAILED
CANCELLED
TIMED_OUT
BUDGET_EXCEEDED
POLICY_DENIED
BLOCKED
```

An agent run stores enough state to resume or diagnose according to policy.

---

## 16. Agent workforce

The workforce is a coordinated set of governed agents.

```text
Event
 ↓
Task
 ↓
Planner / Team Lead
 ↓
Agent selection
 ↓
Parallel workers
 ↓
Dependency-aware synthesis
 ↓
Verification
 ↓
Approval if required
 ↓
External effect
```

Agent package:

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
```

Parallel workers must not silently overwrite one another. Shared resources require explicit coordination.

---

## 17. Automation fabric

Automation is a first-class execution domain.

```text
Trigger
 ↓
Workflow
 ↓
Agent / Tool / Action
 ↓
Decision
 ↓
Condition / Branch
 ↓
Parallel / Loop
 ↓
Approval
 ↓
Verification
 ↓
Retry / Recovery
 ↓
Resume
 ↓
Audit
```

Node types:

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

Natural-language workflow generation must produce a visible workflow representation that the user can inspect and edit.

---

## 18. Durable workflow state

Workflow runs persist state at meaningful boundaries.

A workflow should support, where safe:

- retries;
- checkpoints;
- resume;
- cancellation;
- timeout;
- approval wait;
- partial completion;
- recovery;
- idempotent re-entry.

Self-healing is bounded and cannot become an uncontrolled infinite loop.

---

## 19. Execution fabric

INFINITY-11 owns the execution abstraction.

```text
ExecutionManager
├── LocalProvider
├── DockerProvider
├── E2BProvider
├── SelfHostedProvider
└── FutureProvider
```

The same abstraction principle applies to model, database, storage, browser, and deployment providers.

E2B is therefore an execution adapter, not the architecture center.

---

## 20. Untrusted code boundary

Generated code is untrusted until appropriate execution and verification establish evidence.

```text
Generated / modified code
        ↓
Policy
        ↓
Isolated execution
        ↓
Tests / diagnostics
        ↓
Security checks
        ↓
Browser / visual checks where relevant
        ↓
Verification
```

Secrets must not be injected unless required, permitted, scoped, and protected.

---

## 21. Verification engine

Verification is independent from model confidence.

Evidence can include:

- formatting;
- lint;
- typecheck;
- unit tests;
- integration tests;
- build;
- E2E/runtime;
- browser QA;
- visual QA;
- accessibility;
- security;
- performance;
- GitHub CI;
- deployment health;
- review decisions.

A verification result can be:

```text
VERIFIED
PARTIALLY VERIFIED
UNVERIFIED
BLOCKED
```

---

## 22. Browser and visual QA architecture

```text
Build
 ↓
Run application
 ↓
Browser session
 ↓
Screenshot + DOM + console + network
 ↓
Functional / visual / accessibility evaluation
 ↓
Findings
 ↓
Repair
 ↓
Rebuild
 ↓
Recheck
 ↓
Verify
```

Browser providers are adapters. Browser evidence is linked to a project run and relevant code changes.

---

## 23. GitHub engineering lifecycle

```text
Issue
 ↓
Plan
 ↓
Branch / Worktree
 ↓
Implement
 ↓
Test
 ↓
Security
 ↓
Review
 ↓
Pull Request
 ↓
CI
 ↓
Repair if necessary
 ↓
Approval
 ↓
Merge
```

Production-affecting GitHub actions require appropriate policy.

---

## 24. Deployment architecture

```text
Build
 ↓
Validate
 ↓
Package
 ↓
Approval
 ↓
Deployment adapter
 ↓
Health check
 ↓
Smoke / browser verification
 ↓
Observe
```

Vercel, container hosting, self-hosted infrastructure, or other providers are interchangeable deployment adapters.

---

## 25. Security and permission model

Every sensitive action follows:

```text
Actor
 ↓
Capability request
 ↓
Risk classification
 ↓
Policy evaluation
 ↓
ALLOW / ASK / DENY
 ↓
Approval if ASK
 ↓
Execution
 ↓
Audit
```

Capabilities include:

```text
filesystem.read
filesystem.write
shell.execute
network.request
github.read
github.write
database.read
database.write
deploy.execute
secret.use
browser.control
```

The system defaults to least privilege.

---

## 26. MCP supply-chain architecture

MCP is an external capability boundary.

```text
Discover
 ↓
Inspect
 ↓
Trust assessment
 ↓
Permission analysis
 ↓
Install
 ↓
Sandbox / constrain
 ↓
Monitor
 ↓
Audit
```

MCP tools do not automatically receive unrestricted project or secret access.

---

# 27. Web screen architecture

The web surface is a set of coordinated screens sharing the same runtime contracts.

```text
Command Center
 ├── Chat
 ├── AI Workspace
 ├── Projects
 │    ├── Code
 │    ├── Build
 │    ├── Preview
 │    ├── Agents
 │    ├── Teams
 │    ├── Workflows
 │    ├── Runs
 │    ├── Artifacts
 │    ├── Tests
 │    ├── Security
 │    ├── GitHub
 │    └── Deployments
 ├── Research
 ├── Design / Media
 ├── Global Runs
 ├── Approvals
 ├── Usage / Cost
 └── Settings
```

---

## 28. Global application shell

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Workspace │ Search / Command │ Activity │ Notifications │ User          │
├──────────────┬──────────────────────────────────────┬──────────────────┤
│ Navigation   │ Primary work                         │ Context          │
│              │                                      │ Inspector        │
│ Home         │ Current capability                   │ Files            │
│ Chat         │                                      │ Models           │
│ Projects     │                                      │ Tools            │
│ Code         │                                      │ Brain / Memory   │
│ Build        │                                      │ Activity         │
│ Design       │                                      │ Verification     │
│ Research     │                                      │ Deployment       │
│ Media        │                                      │                  │
│ Agents       │                                      │                  │
│ Workflows    │                                      │                  │
│ Runs         │                                      │                  │
│ Deployments  │                                      │                  │
│ Settings     │                                      │                  │
└──────────────┴──────────────────────────────────────┴──────────────────┘
```

The shell must make current workspace/project context obvious.

---

## 29. Command Center screen contract

Purpose: operational overview.

Primary modules:

- project cards;
- recent work;
- active runs;
- pending approvals;
- agent/workforce status;
- workflow status;
- verification alerts;
- provider health;
- credential health;
- deployments;
- usage/cost;
- security alerts.

Every card should link to the detailed state that supports its summary.

---

## 30. Chat screen contract

The Chat screen contains:

```text
Conversation history
Context controls
Composer
Attachments
Model/agent selector
Tool/MCP controls
Streaming status
Tool activity
Verification result
Artifacts
```

Chat can initiate other product actions subject to policy.

---

## 31. AI Workspace screen contract

The AI Workspace emphasizes controlled execution of AI tasks.

Panels:

- request/task;
- model/route;
- credential state;
- context;
- tools;
- agent;
- execution;
- approvals;
- verification;
- output.

The user should be able to understand why the system selected a route and what evidence resulted.

---

## 32. Projects screen contract

Project overview includes:

- project identity;
- stack;
- repository;
- current branch;
- active work;
- recent artifacts;
- test/verification state;
- deployments;
- Project Brain health;
- security state;
- activity.

Project navigation preserves context while moving between code, build, agents, workflows, and operations.

---

## 33. Code screen contract

Core regions:

```text
File tree | Editor | Context / Diagnostics

Bottom / side areas:
Terminal
Problems
Tests
Diff
Agent activity
Verification
```

The screen should make changes inspectable and reversible through the repository lifecycle.

---

## 34. Build screen contract

The Build screen coordinates application construction.

It exposes:

- requirements;
- architecture plan;
- implementation tasks;
- agents;
- file changes;
- build state;
- test state;
- preview;
- browser QA;
- verification;
- Git diff;
- deployment readiness.

The interface should support both generated and manually edited code.

---

## 35. Preview screen contract

Preview is an evidence-aware running application surface.

States:

```text
BUILDING
STARTING
RUNNING
UNAVAILABLE
FAILED
PARTIALLY VERIFIED
VERIFIED
```

The preview should not be represented as production-ready merely because a local render exists.

---

## 36. Agents screen contract

The Agents screen exposes:

- catalog;
- active agents;
- capabilities;
- skills;
- tools;
- model policy;
- memory policy;
- permission policy;
- budget;
- execution profile;
- verification policy;
- performance history.

Agent installation and activation are policy-aware.

---

## 37. Workforce screen contract

The Workforce screen visualizes:

```text
Team Lead
 ↓
Specialists
 ↓
Tasks
 ↓
Dependencies
 ↓
Outputs
 ↓
Synthesis
 ↓
Verification
```

Conflicts and blocked workers must be visible.

---

## 38. Workflow Builder screen contract

The visual editor provides:

- node palette;
- canvas;
- connections;
- configuration panel;
- trigger configuration;
- conditions;
- approvals;
- retries;
- versioning;
- test/run controls;
- validation;
- execution preview.

Natural-language generation creates an editable graph rather than an opaque background automation.

---

## 39. Runs screen contract

The universal run viewer shows:

```text
Run identity
State
Timeline
Inputs
Context summary
Route
Execution steps
Logs
Artifacts
Approvals
Verification
Errors
Recovery
Cost/usage
```

Runs remain inspectable after completion.

---

## 40. Approvals screen contract

Approval cards include:

- actor;
- action;
- project;
- target;
- risk;
- proposed effect;
- evidence;
- expiry;
- approve/deny controls.

The approval screen is a security boundary, not merely a notification screen.

---

## 41. Artifacts screen contract

Artifact browsing supports:

- preview;
- metadata;
- provenance;
- source run;
- project;
- version;
- verification;
- related changes.

Artifacts must not lose their origin merely because they are displayed in a different screen.

---

## 42. Research screen contract

Research screens show:

- question;
- source set;
- source status;
- extracted evidence;
- claims;
- synthesis;
- citations;
- unresolved questions;
- final report/artifact.

The UI distinguishes sourced evidence from inference.

---

## 43. Media/design screen contract

Media creation surfaces share:

- prompt/request;
- references;
- model/route;
- generation/edit state;
- variations;
- artifact history;
- usage/cost;
- verification where meaningful.

Specialized image, audio, video, document, and presentation experiences remain part of the same project/artifact system.

---

## 44. Usage and cost screen contract

The Usage screen separates:

```text
AI / API
Compute / Sandbox
Storage
Deployment
Platform
```

Each metric carries its provenance where necessary: observed, provider-reported, estimated, or unknown.

---

## 45. Security screen contract

Security UI aggregates:

- permissions;
- policies;
- credentials;
- secrets state;
- sandbox state;
- dependency findings;
- MCP trust;
- audit events;
- deployment risks.

It should link findings to the exact run, project, or resource that produced them.

---

## 46. Settings screen contract

Settings are grouped by domain:

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

Sensitive settings require explicit handling and never display raw secrets by default.

---

## 47. Responsive screen rules

Every screen follows the same priorities:

1. preserve task identity;
2. preserve critical status;
3. preserve approvals;
4. preserve error/evidence visibility;
5. collapse secondary context before primary work;
6. avoid hiding destructive actions in ambiguous gestures.

Desktop uses persistent panels where useful. Tablet uses collapsible panels. Mobile uses stacked views, drawers, sheets, and compact navigation.

---

## 48. PWA architecture

The PWA provides:

- installable application shell;
- cached static assets where safe;
- offline shell behavior;
- reconnect handling;
- responsive interaction;
- durable remote-run visibility when connectivity returns.

Offline state must never fabricate successful remote execution.

---

## 49. Notifications and activity architecture

The notification system consumes meaningful events such as:

- approval required;
- run failed;
- verification failed;
- deployment unhealthy;
- credential invalid;
- provider degraded;
- workflow resumed;
- security finding;
- artifact ready.

Activity timelines preserve chronological evidence without becoming an unfiltered internal event dump.

---

## 50. Error and recovery UX

The product distinguishes:

```text
VALIDATION ERROR
AUTHENTICATION ERROR
AUTHORIZATION ERROR
POLICY DENIED
PROVIDER UNAVAILABLE
CREDENTIAL INVALID
RATE LIMITED
QUOTA EXHAUSTED
EXECUTION FAILURE
TIMEOUT
VERIFICATION FAILURE
DEPLOYMENT FAILURE
INTERNAL ERROR
```

Each state provides an actionable next step when one exists.

---

## 51. Performance architecture

UI performance and execution performance are separate measurements.

The web should:

- stream progress;
- avoid blocking the main thread;
- lazy-load heavy views;
- virtualize large lists/logs;
- keep editor interaction responsive;
- render incremental run output;
- use remote execution for expensive workloads when appropriate.

---

## 52. Accessibility architecture

Accessibility requirements apply to all major screens:

- semantic HTML/controls;
- keyboard operation;
- visible focus;
- screen-reader labeling;
- status announcements;
- contrast;
- touch targets;
- reduced motion;
- non-color-only state indicators;
- error association.

Accessibility checks belong in verification for relevant phases.

---

## 53. Observability architecture

Core identifiers allow correlation:

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

Users should be able to navigate from result → run → logs → artifact → project change → verification.

---

## 54. Data ownership and durability

Durable records must define:

- owner;
- scope;
- lifecycle;
- retention;
- deletion;
- migration;
- idempotency;
- concurrency.

The architecture avoids hard-coding these semantics to one database vendor.

---

## 55. Free-first deployment modes

### Local / $0 development

```text
Browser
 ↓
Local Web/API
 ↓
Local DB / compatible service
 ↓
BYOK or local model
 ↓
Local/Docker execution
 ↓
GitHub
```

### Free hosted development

```text
Browser
 ↓
Free hosting where available
 ↓
Free-tier database where available
 ↓
BYOK
 ↓
Optional execution provider
```

### Paid scale

Managed services can be added through adapters without changing core domain contracts.

---

## 56. Interoperability architecture

External developer systems integrate through stable interfaces.

Targets include:

```text
OpenCode
Codex
Claude Code
Cline
IDE tooling
Termux
GitHub tooling
future agent protocols
```

Integration must preserve INFINITY-11 policy, execution, verification, and audit boundaries.

---

## 57. Extension architecture

The extensibility model supports:

```text
Agents
Skills
Tools
MCP servers
Workflows
Templates
Plugins
Integrations
```

Each extension can declare permissions, tools, secrets, model requirements, dependencies, compatibility, security metadata, and evaluation status.

---

## 58. Architectural anti-patterns

The following are prohibited unless explicitly justified and isolated:

- provider-specific inference in browser UI;
- duplicated orchestration engines;
- unrestricted shell execution from UI actions;
- secrets stored in ordinary client state;
- hard dependency on one sandbox provider;
- hard dependency on one deployment vendor;
- model-generated “success” treated as verification;
- infinite agent retries;
- hidden background side effects;
- silent project-context leakage;
- undocumented contract changes;
- wholesale copying of competitor source, prompts, proprietary workflows, or architecture.

---

## 59. Current implementation boundary

The architecture is no longer pre-coding-only. Implementation is active.

Verified baseline:

- Phases 1–10 complete;
- Phase 10 is merged into `main` and its post-merge CI is green;
- the current web/PWA shell and regression contracts are part of the baseline;
- later screens may exist as architectural/product boundaries without their full backend runtime being implemented;
- Phase 11 is the next implementation target.

The architecture specification describes the intended V1 system. It must not be used as proof that every future capability already exists.

---

## 60. Relationship to the other canonical documents

```text
Detailed Product & Web Specification
        ↓
Architecture & Screen Specification
        ↓
Final Architecture Blueprint
        ↓
V1 Roadmap (Phases 1–110)
        ↓
Repository Implementation
        ↓
Tests / Security / Runtime Evidence / CI
```

Product documents define intent and contracts. Repository evidence defines implementation status.

---

## 61. Final architecture invariant

INFINITY-11 should behave as one coherent operating system:

```text
CREATE
   ↕
ENGINEER
   ↕
AUTOMATE
   ↕
OPERATE
```

all connected through:

```text
Identity
Policy
Context
AI Gateway
Agents
Workflows
Execution
Verification
Artifacts
GitHub
Deployment
Observability
Project Brain
```

The architecture is successful when these systems compose without requiring a user to understand the internal boundaries, while the boundaries remain explicit enough for engineering, security, verification, replacement of vendors, and long-term maintenance.
