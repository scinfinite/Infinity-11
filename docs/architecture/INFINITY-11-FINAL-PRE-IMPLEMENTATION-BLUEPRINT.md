# INFINITY-11 — Final Pre-Implementation Blueprint

> **Status:** Canonical pre-implementation architecture baseline — 2026-09-14
> **Implementation status:** Design/research only; application coding is not authorized by this document
> **Strategy:** FREE-FIRST + OPEN-SOURCE-FIRST + BYOK-FIRST
> **Purpose:** Freeze the product thesis, architectural boundaries, execution semantics, security model, quality model, UX contracts, and implementation invariants before engineering begins.

## 1. Executive decision

INFINITY-11 is a **provider-independent AI engineering, creation, automation, and operations operating system** delivered through a premium web/PWA experience.

It is not a single-model chat wrapper, not a Replit clone, not a collection of agent personas, and not an automation-only SaaS.

The product has four first-class capabilities:

```text
CREATE
ENGINEER
AUTOMATE
OPERATE
```

A cross-cutting **Command Center** manages projects, agents, teams, workflows, models, credentials, tools, MCP, execution, deployments, security, cost, events, and verification.

The product's core promise is:

> Turn user intent into safe, observable, verifiable work across models, credentials, agents, tools, execution environments, repositories, workflows, and deployment targets.

## 2. Non-negotiable product invariants

1. No mandatory INFINITY-11 paid subscription at initial launch.
2. BYOK is a first-class architecture capability.
3. Multiple providers, credentials, models, and local models must be routable.
4. No provider, database, sandbox, or deployment vendor may define the core architecture.
5. Heavy workloads should execute remotely whenever a suitable execution provider is available.
6. Local/self-hosted execution remains possible where practical.
7. Serious multi-service applications are in scope; demo-only generation is not.
8. Web, mobile, desktop, backend, and shared-service targets are architectural targets.
9. Deterministic workflows and autonomous agents are both first-class.
10. Hybrid orchestration is the preferred model for serious automation.
11. High-impact actions are permission- and approval-controlled.
12. Generated code is untrusted until execution and verification establish evidence.
13. A successful build is not equivalent to a high-quality result.
14. Important completion claims require evidence.
15. The system must distinguish `VERIFIED`, `PARTIALLY VERIFIED`, `UNVERIFIED`, and `BLOCKED`.
16. Secrets never enter normal client code, logs, prompts, artifacts, or telemetry unless explicitly required and policy-approved.
17. Retries and self-healing are bounded, idempotency-aware, and side-effect-aware.
18. Platform cost, user AI cost, user compute cost, free-tier resources, and optional managed-service cost remain separate.
19. Provider-specific behavior belongs behind adapters.
20. Documentation, contracts, tests, security, and observability are part of implementation quality.

## 3. System model

```text
                              INFINITY-11
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
     EXPERIENCE                CONTROL                   INTELLIGENCE
        │                      PLANE                         PLANE
 Chat / Code / Build       Identity / Policy          AI Gateway / Router
 Design / Research         Security / Cost            Context / Brain
 Media / Projects         Audit / Approval            Knowledge / Memory
 Agents / Workflows       Observability              Evaluation / Quality
        │                          │                          │
        └──────────────────────────┼──────────────────────────┘
                                   │
                              ORCHESTRATOR
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ↓                          ↓                          ↓
   AI Workforce              Automation Fabric          Direct Tasks
        │                          │                          │
        └──────────────────────────┼──────────────────────────┘
                                   ↓
                            EXECUTION FABRIC
                                   │
       Agents / Tools / MCP / Browser / Terminal / Git / Sandbox
                                   │
                            VERIFICATION ENGINE
                                   │
                         OBSERVABILITY + AUDIT
                                   │
                     PROJECT BRAIN / MEMORY / ARTIFACTS
                                   │
                    PROVIDER / INFRASTRUCTURE ADAPTERS
```

### 3.1 Planes

**Experience Plane** owns user interaction and presentation, not provider-specific business logic.

**Control Plane** owns identity, authorization, policies, approvals, budgets, cost boundaries, audit, feature configuration, and governance.

**Intelligence Plane** owns model discovery, routing, credentials as references, context assembly, Project Brain, knowledge, memory, evaluations, and quality decisions.

**Execution Plane** owns agents, tasks, workflows, tools, MCP, sandboxes, browser automation, terminal operations, background jobs, worktrees, builds, tests, packaging, and deployment actions.

**Adapter Plane** translates stable INFINITY-11 contracts to external providers.

**Data Plane** persists durable product state, execution state, usage, events, artifacts, audit records, knowledge indexes, and project intelligence.

## 4. Canonical request lifecycle

Every meaningful operation follows the same conceptual lifecycle:

```text
Intent
 ↓
Identity
 ↓
Authorization / Policy
 ↓
Context Assembly
 ↓
Task Classification
 ↓
Plan
 ↓
Workforce / Workflow Selection
 ↓
Model + Credential Routing
 ↓
Execution
 ↓
Observation
 ↓
Test / Critique
 ↓
Security / Performance / UX Review
 ↓
Improvement Loop when justified
 ↓
Final Quality Gate
 ↓
Verified Result / Explicit Failure State
 ↓
Persistence + Audit + Project Brain
```

The exact path may be shorter for simple tasks and longer for engineering or automation tasks, but security, observability, and verification remain shared boundaries.

## 5. AI Intelligence Gateway

The AI Gateway is the single logical inference boundary.

```text
Request
 → capability requirements
 → context requirements
 → policy constraints
 → eligible models
 → eligible credentials
 → provider health
 → quota signals
 → cost/latency constraints
 → historical performance
 → route
 → execute
 → record usage
 → verify outcome
```

### Routing modes

- Manual
- Auto
- Best quality
- Fastest
- Cheapest
- Free-only
- Local-only
- Provider-preferred
- Capability-first
- Custom policy
- Evaluation

### Route evidence

A route decision records observable facts, including selected model/provider/credential references, eligibility, capability match, policy constraints, health/quota signals, cost estimate when available, latency signal, historical performance signal, and fallback reason.

Explanations must not expose private chain-of-thought. Explainability means **observable decision factors**, not hidden reasoning disclosure.

## 6. Credential and failover model

Provider and credential are separate entities.

```text
Provider
 ├── Credential A → Models X/Y
 ├── Credential B → Models X/Z
 └── Credential C → Model Y
```

Credential states:

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

Fallback order is policy-driven rather than hard-coded:

```text
same credential / compatible model
 → another credential in provider
 → another compatible provider
 → alternate execution strategy
 → explicit failure / approval
```

The router must classify errors before fallback. Authentication failures, policy denials, invalid requests, safety refusals, quota exhaustion, transient outages, and unsupported capabilities are not interchangeable.

Quota information must carry provenance:

```text
PROVIDER_REPORTED
OBSERVED
ESTIMATED
UNKNOWN
```

## 7. AI Workforce

An agent is an executable governed worker.

```text
Agent
├── identity
├── role
├── goal
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
├── schedule
├── workspace
├── performance history
└── approval policy
```

A team adds:

```text
objective
lead/orchestrator
members
delegation rules
communication rules
shared context
shared memory
budget
permissions
workflow bindings
verification policy
```

### Dynamic workforce

The planner composes teams from requirements rather than forcing fixed personas.

Example:

```text
Production SaaS
→ Product + Architect + Frontend + Backend + DB + Security + QA + DevOps + UX QA

Mobile product
→ Product + UX + Mobile + Backend + QA + Release

Java enterprise service
→ Architect + Java/Spring + DB + Security + Integration + QA + DevOps
```

Agents may delegate to sub-agents only within recursion, budget, permission, and execution limits.

## 8. Automation Fabric

Automation is a first-class runtime, not merely an integration directory.

```text
Trigger
 ↓
Workflow state
 ↓
Node execution
 ↓
Decision / branch
 ↓
Parallel work
 ↓
Approval if required
 ↓
Verification
 ↓
Recovery / retry when eligible
 ↓
Resume / complete
 ↓
Audit
```

### Node contract families

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
CODE
BROWSER
GITHUB
DATABASE
SANDBOX
VERIFY
RETRY
RECOVER
```

### Trigger families

Schedule, recurrence, webhook, GitHub event, CI failure, deployment event, database event, file event, form event, monitoring alert, agent event, workflow completion, human approval, and custom event.

### Execution modes

**Deterministic:** exact state, ordering, conditions, retries, timeouts, and side-effect boundaries.

**Autonomous:** an agent chooses actions toward a goal inside policy boundaries.

**Hybrid:** deterministic workflow control surrounds selected autonomous decisions. This is the default target for serious production automation.

## 9. Workflow durability and recovery

Workflow runs are durable state machines.

Required semantics include:

- cancellation;
- timeout;
- idempotency;
- checkpointing;
- resume;
- retry limits;
- backoff;
- approval waits;
- dependency tracking;
- partial failure visibility;
- correlation IDs;
- audit records.

Self-healing follows:

```text
Failure
 ↓
Classify
 ↓
Is recovery allowed?
 ├─ No → explicit failure / human action
 └─ Yes
      ↓
   bounded strategy
      ↓
   retry / alternate credential / alternate provider / repair
      ↓
   verify
      ↓
   resume
```

Destructive external effects must never be blindly replayed.

## 10. Execution Fabric

The platform owns an execution abstraction, not a particular sandbox vendor.

```text
ExecutionManager
 ├── LocalProvider
 ├── DockerProvider
 ├── E2BProvider
 ├── VercelProvider
 ├── SelfHostedProvider
 └── FutureProvider
```

A common execution contract covers provisioning, environment preparation, command execution, file transfer, process lifecycle, networking policy, resource limits, log streaming, artifact export, cleanup, persistence, and cost ownership metadata.

### Heavy application lifecycle

```text
Idea
→ Requirements
→ Architecture
→ Project scaffold
→ Frontend
→ Backend
→ Database
→ Auth
→ Integrations
→ Tests
→ Security
→ Browser QA
→ Build
→ GitHub
→ Preview
→ Deployment
→ Observe
→ Maintain
```

The user's device is primarily a control, editing, interaction, streaming, and visualization surface.

## 11. Project Brain and Context Engine

### Project Brain

The durable project model contains requirements, architecture, decisions, conventions, dependencies, codebase map, known bugs, failed approaches, successful patterns, tests, security findings, deployments, agent history, model performance, and lessons learned.

### Context Engine

```text
Conversation
Repository
Symbols
Project Brain
Skills
Memory
Knowledge
Tools
MCP
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

Context inclusion must be inspectable at the source/category level while secrets and private reasoning remain protected.

### Codebase intelligence

```text
Repository
→ language/framework detection
→ dependency graph
→ symbol graph
→ architecture inference
→ test map
→ risk map
→ documentation map
→ searchable/indexed representation
```

The capability registry must support multiple languages, including Python, Java, JavaScript, TypeScript, Go, Rust, C, C++, C#, PHP, Ruby, Kotlin, Swift, Dart, SQL, Shell, HTML, and CSS when appropriate toolchains are available.

## 12. Verification and Best-Possible-Output engine

The quality engine is a universal layer.

```text
Candidate Output
 ↓
Functional tests
 ↓
Architecture / maintainability review
 ↓
Static analysis
 ↓
Security checks
 ↓
Performance checks
 ↓
Browser / visual QA
 ↓
UX / accessibility review
 ↓
Critique
 ↓
Improve
 ↓
Retest
 ↓
Final quality gate
```

Quality dimensions are task-dependent:

```text
correctness
completeness
security
performance
maintainability
UX
accessibility
compatibility
verification
cost efficiency
```

The system must not optimize for a synthetic score alone. A quality score is useful only when backed by evidence and explicit weighting.

## 13. Browser and visual QA

For applications with a visual interface:

```text
Build
→ Run preview
→ Browser automation
→ DOM inspection
→ Console/network inspection
→ Screenshot
→ Accessibility checks
→ Visual evaluation
→ Defect classification
→ Fix
→ Regression verification
```

Visual polish is part of quality, but screenshots alone cannot establish functional correctness.

## 14. Security and governance

The security model is capability-based.

```text
Agent / Workflow
 ↓
Capability request
 ↓
Identity
 ↓
Project policy
 ↓
Risk classification
 ↓
ALLOW / ASK / DENY
 ↓
Execution
 ↓
Audit
```

Representative capabilities:

```text
filesystem.read
filesystem.write
filesystem.delete
shell.execute
network.request
github.read
github.write
github.merge
database.read
database.write
database.admin
deploy.execute
secret.use
browser.control
mcp.use
```

Default policy for privileged capabilities is deny until explicitly allowed by project/user policy.

### Approval examples

```text
Read repository → ALLOW
Run tests → ALLOW
Modify sandbox → ALLOW
Create branch → ALLOW
Create PR → ASK
Merge PR → ASK
Deploy production → ASK
Use production secret → ASK
Delete database → DENY by default
```

The exact default can be configured, but risk classification must remain explicit.

## 15. MCP and extension supply chain

MCP/tool installation follows:

```text
Discover
→ Inspect
→ License / provenance check
→ Trust assessment
→ Permission analysis
→ Register
→ Isolate where possible
→ Execute
→ Observe
→ Audit
→ Revoke / update
```

Marketplace assets are untrusted until inspected. Metadata must include publisher, version, license, compatibility, dependencies, required permissions, required secrets, model requirements, security status, evaluation status, and update history.

## 16. Universal provider abstractions

The following domains must remain replaceable:

```text
AIProvider
CredentialProvider
ExecutionProvider
DatabaseProvider
StorageProvider
BrowserProvider
DeploymentProvider
GitProvider
KnowledgeProvider
NotificationProvider
```

Provider-specific logic belongs in adapters. Core domains consume normalized capability and error contracts.

## 17. GitHub engineering lifecycle

GitHub is a first-class lifecycle boundary.

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

The system must preserve source revision identity through builds, verification, artifacts, and deployments.

## 18. Data model boundaries

Core durable entities:

```text
User
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
Team
Skill
Tool
MCPServer
Task
AgentRun
Workflow
WorkflowVersion
WorkflowRun
WorkflowNodeRun
Sandbox
Repository
Worktree
Build
TestRun
VerificationRecord
Deployment
KnowledgeSource
Memory
ProjectBrainRecord
UsageRecord
CostRecord
Event
AuditEvent
Approval
Evaluation
```

No single table or service should become a universal dumping ground. Domains own their invariants and communicate through explicit contracts/events.

## 19. Event and observability model

Events should cover:

```text
github.event
ci.failed
deployment.failed
schedule.triggered
webhook.received
workflow.started
workflow.failed
workflow.completed
agent.started
agent.failed
provider.health.changed
credential.state.changed
verification.failed
approval.requested
approval.completed
```

Every long-running operation carries a correlation ID across model calls, agent runs, tool calls, MCP operations, sandbox jobs, workflow nodes, builds, tests, and deployments.

Logs must redact secrets and avoid storing private chain-of-thought.

## 20. UX architecture

The global shell is persistent across product modes.

```text
Workspace / Search / Command Palette / Notifications / User
────────────────────────────────────────────────────────────
Navigation | Primary Workspace | Context Inspector
────────────────────────────────────────────────────────────
Streaming / Jobs / Connection / Verification status
```

### Primary modes

- Home / Command Center
- Chat
- Projects
- Code
- Build
- Design
- Research
- Media
- Agents
- Teams
- Workflows
- Models / Router
- API Keys
- MCP / Integrations
- GitHub
- Deployments
- Library / History
- Usage / Cost
- Security

### Mobile behavior

Navigation becomes compact and task-oriented. Context Inspector becomes a sheet/drawer. Heavy execution remains remote; the mobile UI must remain useful for monitoring, approvals, editing, and intervention rather than pretending to be a full local workstation.

## 21. Build workspace contract

The Build surface must expose:

- project target;
- execution environment;
- environment health;
- files/worktree;
- build/test status;
- logs;
- running services;
- browser preview;
- artifacts;
- verification state;
- resource/cost ownership;
- agent activity;
- stop/restart controls.

## 22. Automation workspace contract

The workflow canvas must show:

- graph topology;
- node type;
- dependencies;
- agent participation;
- tool/MCP usage;
- permission requirements;
- input/output contracts;
- execution state;
- retries;
- approvals;
- verification;
- run history;
- version history.

Natural-language workflow generation produces a **proposal**, not an automatically activated privileged workflow. Before activation, the user sees tools, permissions, models, expected measurable costs, approvals, retry/recovery behavior, and external side effects.

## 23. Multiplatform application model

One product specification can produce coordinated targets:

```text
Product Specification
 ↓
Shared architecture / contracts / design system
 ├── Web
 ├── Mobile
 ├── Desktop
 └── Backend / Services
 ↓
Shared APIs / database / auth / integrations
 ↓
Target-specific implementation
 ↓
Tests + Security + QA
 ↓
Packaging + Preview + Deployment
```

Framework selection is capability- and requirement-driven. The platform must not hard-code a single framework.

## 24. Free-first economics

The product must distinguish:

```text
INFINITY-11 platform cost
User BYOK AI cost
User compute/sandbox cost
Free-tier resource
Optional managed-service cost
```

Cost state must be explicit:

```text
MANDATORY
OPTIONAL
USER-OWNED
ESTIMATED
UNKNOWN
```

The architecture should support a meaningful $0 development/operation path through open-source/local components, free tiers, BYOK, and self-hosted execution where feasible. It must never imply unlimited free third-party compute or model usage.

## 25. Extension and interoperability model

Portable assets should include:

```text
Agents
Teams
Skills
Workflows
Tools
MCP servers
Templates
Integrations
Verification policies
```

A universal skill/agent package format should carry compatibility metadata so useful assets can be adapted for supported harnesses such as INFINITY-11, Codex, Claude Code, OpenCode, Cursor, Cline, and future systems without copying proprietary implementation.

## 26. Failure model

Failure is a first-class state, not an exception hidden behind a generic error toast.

```text
SUCCESS
PARTIAL
FAILED
CANCELLED
TIMED_OUT
BUDGET_EXCEEDED
POLICY_DENIED
WAITING_APPROVAL
WAITING_RESOURCE
BLOCKED
```

Failures must preserve the evidence needed to resume, retry, repair, or explain why human intervention is required.

## 27. Implementation boundaries

When implementation starts, the first contracts to stabilize are:

```text
Identity / Workspace
AI Gateway
Model Registry
Credential Manager
Router
Agent Runtime
Automation Fabric
Workflow Runtime
Execution Manager
Project Brain
Context Engine
Verification Engine
Security / Policy Engine
Observability / Events
Provider Adapter contracts
```

UI implementation must consume these contracts rather than becoming the place where orchestration rules are invented.

## 28. Implementation sequencing rule

Do not create arbitrary feature phases before the architecture is frozen.

Implementation sequencing should be derived from dependency order:

```text
Contracts
 ↓
Persistence / events / identity
 ↓
AI gateway + provider adapters
 ↓
Execution + agent runtime
 ↓
Workflow durability
 ↓
Context / Project Brain
 ↓
Verification / observability
 ↓
Core UX surfaces
 ↓
Heavy application builder
 ↓
Automation UX
 ↓
GitHub / deployment integrations
 ↓
Multiplatform packaging
 ↓
Marketplace / advanced ecosystem
```

The exact roadmap should be generated from the implementation dependency graph and acceptance criteria after this blueprint is adopted as canonical.

## 29. Definition of done for implementation work

A feature is not complete because code exists or a screen renders.

For meaningful functionality, completion requires:

1. Contract and boundary defined.
2. Security and permission behavior defined.
3. Failure states defined.
4. Observability included.
5. Unit/integration tests appropriate to the feature.
6. End-to-end verification where user-visible.
7. Regression checks.
8. Documentation updated.
9. Cost ownership represented where applicable.
10. Provider neutrality preserved.
11. Verification evidence recorded.
12. No unsupported production-readiness claim.

## 30. Canonical status

This blueprint is the **canonical pre-implementation architecture baseline**.

Precedence for design decisions:

```text
This Blueprint
      ↓
Latest Research Amendments
      ↓
Foundational Product / Architecture Documents
      ↓
Older planning notes
```

Where a conflict remains, the conflict must be resolved explicitly rather than silently mixing incompatible assumptions.

### Current status

```text
PRODUCT THESIS              FROZEN
CORE CAPABILITIES           FROZEN
ARCHITECTURAL PLANES        FROZEN
EXECUTION MODEL             FROZEN
AI WORKFORCE                FROZEN
AUTOMATION FABRIC           FROZEN
SECURITY MODEL              FROZEN
QUALITY MODEL               FROZEN
PROVIDER ABSTRACTIONS       FROZEN
UX INFORMATION ARCHITECTURE FROZEN
FREE-FIRST ECONOMICS        FROZEN
IMPLEMENTATION ROADMAP      NOT YET GENERATED
APPLICATION CODE            NOT STARTED
```

The next engineering step after this baseline is to audit the repository against these invariants, resolve any remaining documentation conflicts, then derive the implementation dependency graph and acceptance-driven roadmap before writing application code.
