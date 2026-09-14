# INFINITY-11 — Detailed Product, Architecture & Competitive Specification

> **Status:** Foundational product definition — research-aligned
> **Implementation status:** Documentation/design only; no product coding is authorized by this document
> **Strategy:** FREE-FIRST + OPEN-SOURCE-FIRST + BYOK-FIRST
> **Audience:** Product designers, architects, engineers, AI-agent designers, security reviewers, and future contributors
> **Scope:** Product behavior, architecture, competitive strategy, execution semantics, security, cost model, UX, extensibility, and future implementation contracts
> **Non-scope:** Implementation code, deployment commands, and a delivery roadmap

---

## 1. Executive definition

INFINITY-11 is a provider-independent AI engineering operating system and multimodal application builder. It is designed to unify AI chat, software engineering, research, media generation, agent teams, automation, sandboxed execution, GitHub workflows, knowledge, memory, and deployment without making any single AI provider, sandbox, database, or hosting vendor the architectural center.

The product is intentionally broader than a conventional AI chat application and intentionally different from a Replit clone. Replit demonstrates the value of a connected idea-to-build-to-deploy lifecycle; OpenCode demonstrates provider independence and local models; Claude Code demonstrates skills, hooks, MCP, subagents, and verification; Codex demonstrates persistent parallel agent work; ECC demonstrates portable engineering-harness concepts; Agency Agents demonstrates reusable specialist agents, teams, projects, and runbooks; E2B and Vercel demonstrate isolated execution; GitHub provides the source-of-truth engineering lifecycle; Supabase provides a practical free-first backend foundation.

INFINITY-11 combines the underlying patterns while adding a unified intelligence, routing, security, explainability, and workforce layer.

### North-star definition

> **INFINITY-11 turns user intent into safe, observable, verifiable work across models, credentials, agents, tools, execution environments, repositories, workflows, and deployment targets.**

---

## 2. Product position

INFINITY-11 should be understood as:

```text
AI APPLICATION BUILDER
        +
AI ENGINEERING ENVIRONMENT
        +
AI WORKFORCE / ORCHESTRATION LAYER
        +
PROVIDER-NEUTRAL AI GATEWAY
        +
AUTOMATION CONTROL PLANE
```

It should not be positioned as:

- a thin wrapper around one model API;
- a copy of Replit;
- a catalog of personality prompts;
- a mandatory paid cloud platform;
- a provider-specific gateway;
- an unsafe autonomous shell runner;
- an opaque model router that invents quota information.

---

## 3. Product promise

> **Bring your AI keys. Bring your tools. Bring your repositories. Build anything.**

This promise creates explicit architectural requirements:

1. Users can bring multiple credentials per provider.
2. Users can bring multiple providers and local models.
3. Provider failure must not unnecessarily terminate work.
4. Routing must be capability-aware and policy-aware.
5. Agent actions must be permissioned and observable.
6. Generated code must execute in controlled environments.
7. Important decisions must be explainable without exposing secrets or private chain-of-thought.
8. The basic architecture must remain usable without mandatory paid infrastructure.
9. Paid services may improve convenience or scale but must not become hidden architectural dependencies.

---

## 4. Competitive research synthesis

The following research is treated as architectural input, not as a list of features to copy.

### 4.1 Replit — pattern to learn

Replit's strongest strategic pattern is the connected lifecycle: describe an idea, let an agent build it, inspect/run it, preview it, debug it, and deploy it in one environment. Current Replit also emphasizes mobile-app generation and preview workflows. citeturn0search6

**INFINITY-11 decision:**

- **KEEP:** zero-friction idea-to-running-project experience;
- **ADAPT:** browser IDE + preview + deployment as one lifecycle;
- **IMPROVE:** make the lifecycle provider-, sandbox-, database-, and deployment-provider independent;
- **INVENT:** Project Brain + explainable routing + AI Workforce + verification loop;
- **REJECT:** architectural dependence on one hosted environment.

### 4.2 Ideavo — BYOK pattern

Ideavo validates the demand for BYOK and multi-provider use.

**INFINITY-11 decision:** go beyond simply selecting a provider by introducing credential-aware routing, quota confidence, health, cost policy, capability matching, and fallback.

### 4.3 E2B — execution pattern

E2B is a useful model for isolated execution of generated or untrusted code.

**INFINITY-11 decision:** E2B is an adapter, not the architecture. The sandbox contract must support E2B, local/container execution, Vercel-style sandboxing, and future providers.

### 4.4 ECC — engineering-harness pattern

ECC has evolved toward a broad engineering harness with skills, agents, orchestration, validation, memory, MCP inventory, worktree workflows, and cross-harness support.

**INFINITY-11 decision:** adopt the concepts of portable skills, agent registries, worktree-aware execution, validation gates, harness adapters, and engineering memory. Do not copy prompts, code, or proprietary structure.

### 4.5 Agency Agents — workforce pattern

Agency Agents demonstrates the usefulness of specialist agents, teams, projects, and runbook-style workflows.

**INFINITY-11 decision:** agents are executable software workers, not just personas. Each worker receives capabilities, tools, model policy, context policy, memory policy, permissions, budgets, workspace, verification, and history.

### 4.6 OpenCode — provider independence

OpenCode currently supports 75+ LLM providers and local models, with configurable providers and OpenAI-compatible endpoints. citeturn0search0turn0search4

**INFINITY-11 decision:** provider neutrality is a first-class architectural invariant. Local AI must be possible where the user's hardware permits it.

### 4.7 Claude Code — extension and verification pattern

Claude Code establishes a useful distinction among skills, subagents, teams, hooks, MCP, and plugins, with a gather → act → verify execution model.

**INFINITY-11 decision:** implement equivalent concepts through an original portable extension model and unified policy engine.

### 4.8 Codex — persistent workforce pattern

Codex demonstrates that parallel agents, isolated worktrees, long-running tasks, background work, and supervision are becoming normal engineering primitives.

**INFINITY-11 decision:** support durable task runs, parallel execution, worktree isolation, resumability, scheduling, and event-triggered work.

### 4.9 GitHub — source-of-truth pattern

GitHub should not be treated merely as an export destination. Repository state, issues, PRs, CI, reviews, branches, and commits should participate in the execution lifecycle.

**INFINITY-11 decision:** GitHub is a first-class integration boundary and project source-of-truth option.

### 4.10 Supabase — free-first backend pattern

Supabase currently offers a $0 Free plan with 500 MB database size, 1 GB file storage, 5 GB egress, 50,000 MAU, and two active projects, with inactivity pausing. citeturn0search1turn0search3

**INFINITY-11 decision:** Supabase is the default development backend adapter, but all persistence boundaries remain abstract enough to support PostgreSQL and future providers.

### 4.11 Vercel — routing/deployment pattern

Vercel demonstrates the value of managed AI routing, deployment, sandboxing, and observability primitives.

**INFINITY-11 decision:** use Vercel as an optional adapter. Never make Vercel the required AI gateway or execution engine.

---

## 5. Competitive capability matrix

| Capability | Replit | OpenCode | Claude Code | Codex | ECC | Agency Agents | INFINITY-11 decision |
|---|---|---|---|---|---|---|---|
| Prompt-to-app | Strong | Limited | Coding-focused | Strong | Harness-focused | Agent-focused | **Improve** |
| Browser IDE | Strong | Partial | External/editor-oriented | App/agent-oriented | No single IDE | App-oriented | **Keep + improve** |
| BYOK | Supported patterns | Strong | Provider-specific | Provider-specific | Harness-level | Tool integration | **Core** |
| Multi-key routing | Limited/managed | Provider config | Limited | Managed | Harness-level | Not core | **Invent** |
| Provider neutrality | Moderate | Strong | Moderate | Moderate | Strong | Strong | **Core invariant** |
| Local models | Limited | Strong | Limited | Limited | Adapters | Tool-dependent | **Core** |
| Agent workforce | Strong | Strong | Strong | Strong | Strong | Strong | **Improve** |
| Skills | Emerging | Supported patterns | Strong | Strong | Strong | Agent content | **Universal skill system** |
| MCP | Supported | Supported | Strong | Supported | Strong | Supported patterns | **Core** |
| Sandboxed execution | Strong | Local/external | Local/tool-based | Strong | Worktree/harness | Tool-dependent | **Adapter abstraction** |
| Verification | Growing | Engineering-focused | Strong | Strong | Strong | Runbooks | **Core moat** |
| GitHub lifecycle | Strong | Strong | Strong | Strong | Strong | Supported | **First-class** |
| Deployment | Strong | External | External | External | External | External | **Universal adapters** |
| Explainable routing | Limited | Model selection | Limited | Limited | Harness | Limited | **Invent** |
| Project Brain | Partial | Partial | Memory/context | Partial | Engineering memory | Project model | **Invent** |
| Event-driven workforce | Emerging | Strong tooling | Hooks/teams | Strong | Strong | Runbooks | **Improve** |

---

## 6. Strategic feature classification

Every major capability must be classified before implementation.

### KEEP

Patterns with proven user value that should exist in INFINITY-11:

- prompt-to-project creation;
- browser-based code workspace;
- live preview;
- model/provider selection;
- agent execution;
- specialist agents;
- skills;
- MCP;
- GitHub integration;
- isolated execution;
- workflow automation;
- deployment;
- usage and audit visibility;
- PWA/responsive operation.

### ADAPT

Patterns that should be changed to fit INFINITY-11:

- Replit-style build lifecycle → provider-neutral Build lifecycle;
- Claude-style skills → universal skill package with compatibility metadata;
- Codex worktrees → sandbox/worktree abstraction;
- ECC harness adapters → universal execution adapters;
- Agency personas → governed executable agents;
- managed model selection → multi-key intelligence router;
- cloud sandbox → pluggable SandboxProvider;
- Supabase backend → DatabaseProvider abstraction.

### IMPROVE

Capabilities where INFINITY-11 should provide stronger behavior:

- model routing;
- multi-key failover;
- agent teams;
- verification;
- codebase intelligence;
- project memory;
- observability;
- security policy;
- workflow resumability;
- provider portability;
- explainability;
- cost control.

### INVENT

The primary INFINITY-11 moat:

1. **Multi-Key Intelligence** — credential-level routing and health.
2. **AI Intelligence Gateway** — task/capability/policy-aware routing.
3. **AI Workforce** — persistent agents with identity, tools, memory, permissions, budgets, schedules, and performance history.
4. **Project Brain** — structured durable understanding of a project.
5. **Adaptive Model Router** — routing informed by historical task performance.
6. **Universal Agent Package** — portable agent definitions across supported harnesses.
7. **Universal Sandbox Manager** — execution-provider abstraction.
8. **Universal Deployment Manager** — deployment-provider abstraction.
9. **Verification Engine** — tests + static analysis + security + visual/browser checks + human review.
10. **Explainability Layer** — explains routing, context sources, permissions, costs, and execution decisions without exposing private reasoning.

### REJECT

Do not make these architectural requirements:

- mandatory paid API gateway;
- mandatory proprietary model;
- mandatory E2B account;
- mandatory Supabase paid plan;
- mandatory Vercel deployment;
- hidden quota assumptions;
- unlimited autonomous privileged execution;
- copying competitor source/prompts/configuration;
- provider-specific business logic in the UI;
- irreversible agent actions without policy/approval;
- opaque model scoring with no observable evidence.

---

## 7. Free-first / open-source-first operating policy

### 7.1 Principle

INFINITY-11 must be designed so that the project can be researched, developed, tested, and meaningfully operated with **$0 mandatory infrastructure spend**.

This does not mean every possible workload can run for free. Provider API calls, large-scale hosted execution, commercial model usage, domains, and high-volume storage may cost money. The architecture must instead make paid infrastructure optional and user-controlled.

### 7.2 Preferred stack hierarchy

```text
OPEN SOURCE / LOCAL
        ↓
FREE TIER / BYOK
        ↓
OPTIONAL MANAGED SERVICE
        ↓
PAID SCALE
```

### 7.3 Development defaults

- GitHub for source control and public/open collaboration.
- Supabase Free for early hosted persistence when needed. citeturn0search1
- Local PostgreSQL as a self-hosted alternative.
- Local models through Ollama/LM Studio/vLLM or other compatible servers where hardware permits; OpenCode demonstrates the feasibility of this provider model. citeturn0search0turn0search5
- Docker/local processes for development sandboxes when E2B is unavailable.
- E2B as optional user-provided infrastructure.
- Vercel/Cloudflare/other deployment targets as optional adapters.
- Playwright and open-source browser tooling for visual verification.
- Open-source static analysis and security tools where technically appropriate.

### 7.4 Cost boundary

The platform must expose:

```text
mandatory cost
optional cost
user-owned cost
estimated cost
unknown cost
```

No UI may imply that a service is free when the underlying provider can charge for it.

---

## 8. System architecture

```text
                              INFINITY-11
                                   │
             ┌─────────────────────┴─────────────────────┐
             │                                           │
        EXPERIENCE                                  CONTROL PLANE
             │                                           │
   Chat / Code / Build / Design                  Identity / Policy
   Research / Media / Agents                     Security / Cost
   Projects / Workflows                          Audit / Observability
             │                                           │
             └─────────────────────┬─────────────────────┘
                                   │
                           INTELLIGENCE PLANE
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
    Context Engine          AI Gateway / Router       Evaluation
    Project Brain           Credential Router         Model Memory
    Knowledge / Memory      Provider Adapters         Verification
          │                        │                        │
          └────────────────────────┼────────────────────────┘
                                   │
                            EXECUTION PLANE
                                   │
      ┌───────────┬───────────┬────┴────┬───────────┬───────────┐
      │ Agents    │ Tools     │ MCP      │ Sandbox   │ Workflows │
      │ Worktrees │ Browser   │ Git      │ Terminal  │ Jobs      │
      └───────────┴───────────┴──────────┴───────────┴───────────┘
                                   │
                          PROVIDER / ADAPTER PLANE
                                   │
    AI Providers / Local Models / GitHub / Supabase / E2B / Vercel
    Deployment Providers / Storage / Future Integrations
```

---

## 9. AI Intelligence Gateway

The gateway is not a normal proxy. It is an intelligence and policy boundary.

```text
Request
 ↓
Intent classification
 ↓
Task type
 ↓
Capability requirements
 ↓
Context requirements
 ↓
Project policy
 ↓
Candidate models
 ↓
Provider health
 ↓
Credential health
 ↓
Quota signal
 ↓
Cost preference
 ↓
Latency preference
 ↓
Historical success
 ↓
Selection
 ↓
Execution
 ↓
Verification
```

### Routing modes

- Manual model.
- Auto.
- Best quality.
- Fastest.
- Cheapest.
- Free-only.
- Local-only.
- Provider-preferred.
- Capability-first.
- Custom policy.
- Evaluation mode.

### Routing evidence

Every route should be explainable through facts such as:

- requested capability;
- candidate eligibility;
- model availability;
- credential health;
- policy constraints;
- observed latency;
- estimated cost;
- historical success;
- fallback reason.

Private chain-of-thought must never be exposed as the explanation mechanism.

---

## 10. Multi-key intelligence

Provider and credential are separate objects.

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

Credential state:

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

Quota confidence:

```text
PROVIDER_REPORTED
OBSERVED
ESTIMATED
UNKNOWN
```

Routing must never pretend an estimated quota is exact.

---

## 11. Agent workforce

An agent is a governed software worker.

```text
Agent
├── identity
├── role
├── capabilities
├── skills
├── tools
├── model_policy
├── context_policy
├── memory_policy
├── permission_policy
├── execution_profile
├── verification_policy
├── budget_policy
├── schedule
├── workspace
└── performance_history
```

### Workforce model

```text
Event
 ↓
Task
 ↓
Planner
 ↓
Agent selection
 ↓
Parallel workers
 ↓
Verification
 ↓
Synthesis
 ↓
Human approval when required
 ↓
External effect
```

Workers may be:

- planner;
- researcher;
- architect;
- coder;
- debugger;
- tester;
- security reviewer;
- UI/visual specialist;
- documentation agent;
- release agent;
- deployment agent;
- monitoring/repair agent.

---

## 12. Project Brain

The Project Brain is one of the primary product moats.

```text
PROJECT BRAIN
│
├── Requirements
├── Architecture
├── Decisions
├── Conventions
├── Dependencies
├── Codebase map
├── Known bugs
├── Failed approaches
├── Successful patterns
├── Tests
├── Security state
├── Deployments
├── Agent history
├── Model performance
└── Lessons learned
```

The brain must distinguish facts, observations, assumptions, stale information, and source-backed knowledge.

---

## 13. Codebase intelligence

```text
Repository
 ↓
Language detection
 ↓
Framework detection
 ↓
Dependency graph
 ↓
Symbol graph
 ↓
Architecture inference
 ↓
Test map
 ↓
Risk map
 ↓
Documentation map
 ↓
Codebase index
```

The result feeds the Context Engine, Project Brain, code review, agent planning, and verification.

---

## 14. Context engine

```text
Retrieve
 ↓
Rank
 ↓
Compress
 ↓
Budget
 ↓
Assemble
 ↓
Execute
```

Potential context sources:

- conversation;
- repository;
- symbols;
- project brain;
- skills;
- memory;
- knowledge;
- tools;
- MCP;
- policies;
- verified prior execution results.

### Context Inspector

The UI should show source categories and inclusion reasons, for example:

```text
Repository       34%
Project Brain    18%
Conversation       9%
Skill              7%
Memory             8%
Tool output       17%
Knowledge          7%
```

These numbers are illustrative, not fixed quotas.

---

## 15. Evidence-first engineering loop

The engineering experience must encode the following discipline:

```text
Inspect
 ↓
Reproduce
 ↓
Diagnose
 ↓
Identify root cause
 ↓
Inspect related code
 ↓
Minimal maintainable change
 ↓
Run tests / build
 ↓
Inspect output
 ↓
Regression check
 ↓
Report verified result
```

An agent must not mark a code task complete merely because a model generated a patch.

---

## 16. Verification engine

Verification is a first-class subsystem.

```text
Implementation
 ↓
Unit tests
 ↓
Integration tests
 ↓
Static analysis
 ↓
Security checks
 ↓
Build
 ↓
Browser / visual QA
 ↓
Human review when required
 ↓
Verification score
```

Verification evidence is attached to the task/run/project record.

---

## 17. Browser and visual QA

For web projects:

```text
Build
 ↓
Run preview
 ↓
Browser automation
 ↓
Screenshot
 ↓
DOM / accessibility tree
 ↓
Console / network inspection
 ↓
Visual evaluation
 ↓
Detected issue
 ↓
Agent fix
 ↓
Repeat
```

The goal is to prevent “build succeeded” from being confused with “application actually works.”

---

## 18. Security model

```text
Agent
 ↓
Capability request
 ↓
Policy evaluation
 ↓
Risk classification
 ↓
ALLOW / ASK / DENY
 ↓
Execution
 ↓
Audit
```

Canonical capabilities:

```text
filesystem.read
filesystem.write
filesystem.delete
shell.execute
network.request
github.read
github.write
database.read
database.write
deploy.execute
secret.use
browser.control
mcp.use
```

High-impact operations should support human approval.

---

## 19. MCP supply-chain model

MCP is treated as a software supply chain, not as an automatic trust boundary.

```text
Discover
 ↓
Inspect metadata
 ↓
Assess publisher / source
 ↓
Review requested permissions
 ↓
Install / register
 ↓
Sandbox where possible
 ↓
Monitor
 ↓
Audit
 ↓
Revoke
```

---

## 20. Universal adapters

### Sandbox

```text
SandboxProvider
├── Local
├── Docker
├── E2B
├── Vercel
├── Daytona
└── Future
```

### Database

```text
DatabaseProvider
├── Supabase
├── PostgreSQL
├── Neon
├── Self-hosted PostgreSQL
└── Future
```

### Deployment

```text
DeploymentProvider
├── Vercel
├── Cloudflare
├── Netlify
├── Railway
├── Render
├── Docker
└── Self-hosted
```

No adapter should leak provider-specific assumptions into domain code.

---

## 21. Universal skills

The preferred conceptual package format is compatible with the emerging Agent Skills direction while remaining INFINITY-11-owned.

```text
skill/
├── SKILL.md
├── metadata/
├── references/
├── scripts/
├── examples/
├── tests/
└── adapters/
```

Compatibility targets include INFINITY-11, Claude Code, Codex, OpenCode, Cursor, Cline, and GitHub Copilot where technically possible.

---

## 22. GitHub lifecycle

```text
Issue
 ↓
Understand
 ↓
Plan
 ↓
Worktree / isolated workspace
 ↓
Implement
 ↓
Test
 ↓
Security
 ↓
Review
 ↓
PR
 ↓
CI
 ↓
Fix
 ↓
Merge
 ↓
Observe
```

GitHub events may also trigger the AI Workforce.

---

## 23. Event-driven automation

```text
Event Bus
│
├── GitHub event
├── CI failure
├── deployment failure
├── database alert
├── schedule
├── webhook
├── user event
└── monitoring event
        ↓
   Agent trigger
        ↓
   Task creation
        ↓
   Agent execution
        ↓
   Verification
        ↓
   Approval / action
```

Supported workflow forms:

- immediate;
- scheduled;
- recurring;
- event-driven;
- long-running;
- resumable;
- human-approved.

---

## 24. Workflow model

```text
Workflow
├── Trigger
├── Task
├── Agent
├── Tool
├── Condition
├── Parallel
├── Approval
├── Retry
├── Timeout
├── Resume
└── Output
```

Workflow runs must retain execution state so that transient infrastructure failures do not silently destroy work.

---

## 25. Three UX modes

### CREATE

For users who want the shortest path from idea to result.

### ENGINEER

For users who want:

- editor;
- terminal;
- Git;
- diffs;
- tests;
- logs;
- agents;
- context;
- verification.

### COMMAND CENTER

For users managing:

- agents;
- tasks;
- projects;
- workflows;
- models;
- providers;
- credentials;
- sandboxes;
- deployments;
- events;
- usage;
- security.

The same underlying execution system powers all three modes.

---

## 26. Multimodal system

Modality is represented as capability metadata.

```text
TEXT
VISION
IMAGE_GENERATION
IMAGE_EDITING
AUDIO_INPUT
AUDIO_OUTPUT
SPEECH
VIDEO
DOCUMENT
EMBEDDING
```

A model is selectable only when it satisfies the operation's real requirements.

---

## 27. Model performance memory

The platform may learn routing preferences from observed results.

```text
Task type
Model
Provider
Credential
Latency
Cost
Tokens
Tool usage
Tests
Outcome
Human rating
```

Examples of learned signals:

- React coding success;
- Java debugging success;
- Python test repair;
- UI design quality;
- security review quality;
- long-context reliability;
- tool-call reliability.

Learning must remain bounded by policy and must never silently override explicit user constraints.

---

## 28. Evaluation engine

```text
Task
 ↓
Model / Agent A
Model / Agent B
Model / Agent C
 ↓
Run
 ↓
Tests
 ↓
Static analysis
 ↓
Security
 ↓
Visual QA
 ↓
Human review
 ↓
Score
```

Evaluation can improve routing without exposing private reasoning.

---

## 29. Agent marketplace / catalog

A future catalog can contain:

- agents;
- skills;
- teams;
- tools;
- MCP servers;
- workflows;
- templates;
- integrations.

Metadata should include:

```text
publisher
version
permissions
required tools
required secrets
model requirements
security status
dependencies
compatibility
evaluation
license
```

No marketplace item is trusted merely because it is listed.

---

## 30. Explainability

The system should explain:

- why a model was selected;
- why another model was rejected;
- why a credential entered cooldown;
- why a fallback occurred;
- which context sources were used;
- which permissions were required;
- what estimated cost was incurred;
- which verification checks passed or failed.

It should not reveal private chain-of-thought, raw secrets, or protected internal data.

---

## 31. Data model principles

Core durable entities:

```text
User
Workspace
Membership
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
AgentRun
Task
Workflow
WorkflowRun
Sandbox
Repository
CommitReference
PullRequestReference
Deployment
KnowledgeSource
MemoryEntry
Evaluation
AuditEvent
UsageRecord
```

All execution records should have stable IDs and correlation IDs where applicable.

---

## 32. Privacy and secret boundaries

Secrets are not ordinary project content.

Rules:

1. Never return raw credentials to the browser after secure storage.
2. Never place provider keys into generated source files unless explicitly required and authorized.
3. Never copy all application secrets into a sandbox by default.
4. Redact secrets from logs and traces.
5. Keep integration scopes explicit.
6. Allow credential revocation.
7. Make data retention configurable where technically feasible.

---

## 33. Failure semantics

External errors are normalized:

```text
AUTHENTICATION_ERROR
AUTHORIZATION_ERROR
RATE_LIMITED
QUOTA_EXCEEDED
CREDIT_EXHAUSTED
MODEL_UNAVAILABLE
CAPABILITY_UNSUPPORTED
INVALID_REQUEST
CONTEXT_TOO_LARGE
CONTENT_RESTRICTION
TIMEOUT
NETWORK_ERROR
PROVIDER_ERROR
SANDBOX_ERROR
TOOL_ERROR
POLICY_DENIED
UNKNOWN_ERROR
```

Retry and fallback behavior must be determined from the category, not from a generic “retry everything” policy.

---

## 34. Observability

Every meaningful execution should be traceable:

```text
request_id
 ├── context selection
 ├── route decision
 ├── credential decision
 ├── provider call
 ├── tool calls
 ├── sandbox actions
 ├── verification
 ├── usage
 ├── fallback events
 └── final outcome
```

The observability UI is an engineering surface, not merely a monitoring dashboard.

---

## 35. UI product map

Primary surfaces:

```text
Home
Chat
Projects
Code
Build
Design
Media
Research
Agents
Agent Run
Skills
Models
Router
API Keys
Providers
MCP
Integrations
GitHub
Deployments
Library
Knowledge
Workflows
Usage
Security Center
Activity
Settings
Command Palette
```

---

## 36. Visual language

The product should feel premium without becoming decorative noise.

Principles:

- strong hierarchy;
- high information density where engineering requires it;
- calm empty states;
- consistent status semantics;
- restrained motion;
- responsive layouts;
- keyboard accessibility;
- clear permission/cost indicators;
- progressive disclosure;
- excellent mobile/PWA behavior.

---

## 37. Product quality gates before implementation

No coding phase should begin from this document until these design questions are resolved sufficiently:

- What is free/local by default?
- Which services are optional adapters?
- What is the minimum viable provider contract?
- What is the credential lifecycle?
- What are the security defaults?
- What can agents do without approval?
- How are quota states represented honestly?
- What constitutes verification?
- What is the source of truth for a project?
- How is provider lock-in avoided?
- How can a user export their project and data?
- What is the minimum infrastructure required for local development?

---

## 38. Implementation constraint: no coding yet

This document is deliberately a **design contract**, not a request to begin implementation.

The current phase is research and architecture hardening. Future coding should begin only after the product, architecture, free-first strategy, security boundaries, and capability contracts are sufficiently stable.

When implementation eventually begins, work must follow the evidence-first engineering discipline:

```text
Inspect
 → Reproduce
 → Design
 → Implement minimally
 → Test
 → Inspect output
 → Regression-check
 → Document
 → Verify
```

---

## 39. Final architectural thesis

The common direction across the researched ecosystem is not “better chat.” It is:

```text
Intent
 ↓
Intelligence
 ↓
Agents
 ↓
Tools
 ↓
Execution
 ↓
Verification
 ↓
Software lifecycle
 ↓
Continuous operation
```

INFINITY-11 should own this control plane while remaining open at the edges.

The strategic goal is not to defeat one competitor by copying its feature list. The goal is to build a system where the strongest patterns from the ecosystem become interoperable primitives, while INFINITY-11's own moat comes from multi-key intelligence, adaptive routing, project understanding, governed AI workers, universal adapters, verification, and explainability.
