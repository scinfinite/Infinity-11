# INFINITY-11 — Architecture & Screen Specification

> **Status:** Research-aligned architecture definition
> **Implementation status:** Design only; no application coding is authorized yet
> **Strategy:** FREE-FIRST + OPEN-SOURCE-FIRST + BYOK-FIRST
> **Scope:** System boundaries, control planes, runtime architecture, data flows, screen contracts, security surfaces, and responsive behavior
> **Non-scope:** Implementation code, deployment commands, and a delivery roadmap

---

## 1. Architectural intent

INFINITY-11 is an AI engineering operating system and multimodal application builder. The architecture must remain independent of any single model provider, sandbox provider, database vendor, deployment platform, or agent harness.

The central invariant is:

```text
User intent
    ↓
Experience / API
    ↓
Identity + Policy + Context
    ↓
AI Intelligence Gateway
    ↓
Model / Credential / Provider selection
    ↓
Agent / Tool / Execution runtime
    ↓
Verification
    ↓
Artifacts / Repository / Deployment
    ↓
Observability + Memory + Project Brain
    ↓
User-visible result
```

Chat, Code, Build, Design, Media, Research, Agents, and Workflows must share the same underlying execution semantics.

---

## 2. Architectural planes

```text
┌──────────────────────────────────────────────────────────────┐
│ EXPERIENCE PLANE                                             │
│ Chat • Code • Build • Design • Research • Media • Command   │
│ Center • PWA • Responsive UI • Context Inspector             │
├──────────────────────────────────────────────────────────────┤
│ CONTROL PLANE                                                │
│ Identity • Policy • Security • Permissions • Cost • Audit    │
│ Observability • Approval • Feature configuration             │
├──────────────────────────────────────────────────────────────┤
│ INTELLIGENCE PLANE                                           │
│ AI Gateway • Router • Context • Project Brain • Memory       │
│ Knowledge • Evaluation • Model Performance                    │
├──────────────────────────────────────────────────────────────┤
│ EXECUTION PLANE                                              │
│ Agents • Tasks • Tools • MCP • Browser • Terminal            │
│ Sandboxes • Worktrees • Workflows • Background Jobs          │
├──────────────────────────────────────────────────────────────┤
│ ADAPTER PLANE                                                │
│ AI Providers • Local Models • GitHub • Supabase • E2B        │
│ Vercel • Deployment Targets • Storage • Future Integrations  │
├──────────────────────────────────────────────────────────────┤
│ DATA PLANE                                                   │
│ PostgreSQL • Object Storage • Events • Usage • Audit         │
│ Knowledge Index • Execution State                             │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Free-first deployment topology

The architecture must work in at least three modes.

### Mode A — local / $0 development

```text
Browser
 ↓
Local web/API
 ↓
Local PostgreSQL or Supabase-compatible database
 ↓
Local model / user BYOK provider
 ↓
Docker / local sandbox
 ↓
GitHub
```

### Mode B — free hosted development

```text
Browser
 ↓
Free hosting where available
 ↓
Supabase Free / equivalent
 ↓
User BYOK provider
 ↓
Optional E2B / other sandbox
```

Supabase currently documents a Free plan with 500 MB database, 1 GB file storage, 5 GB egress, 50,000 MAU, and two active projects; inactive free projects may pause. citeturn0search1turn0search3

### Mode C — paid scale

Managed services may be added for scale, but they must remain adapters rather than hard dependencies.

---

## 4. Core domain boundaries

```text
Identity & Workspace
Project
Conversation
Artifact
Provider
Credential
Model
Route Decision
Agent
Skill
Tool
MCP Server
Task
Agent Run
Workflow
Workflow Run
Sandbox
Repository
Deployment
Knowledge Source
Memory
Evaluation
Audit Event
Usage Record
```

Each domain owns its state and exposes stable contracts to neighboring domains.

---

## 5. AI Intelligence Gateway

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

The Gateway is the only conceptual inference boundary. UI code must not contain provider-specific inference logic.

---

## 6. Provider and model architecture

OpenCode's current provider model shows that a provider-neutral system can support dozens of providers and local OpenAI-compatible endpoints. citeturn0search0turn0search4

INFINITY-11 should use:

```text
ProviderAdapter
├── discoverModels()
├── discoverCapabilities()
├── validateCredential()
├── generateText()
├── streamText()
├── generateImage()
├── generateAudio()
├── generateVideo()
├── embed()
├── usage()
└── health()
```

Not every provider implements every operation.

Model metadata:

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
reasoning
pricing
health
availability
metadata_source
```

Metadata source must identify provider-reported, observed, estimated, or unknown values.

---

## 7. Credential architecture

```text
Provider
├── Credential A
│   ├── model X
│   └── model Y
├── Credential B
│   ├── model X
│   └── model Z
└── Credential C
    └── model Y
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

Rules:

- raw secrets never appear in normal UI after entry;
- invalid credentials are quarantined;
- cooldowns expire according to policy;
- credentials are independently routable;
- one provider may contain many credentials;
- one credential may expose many models;
- routing records the credential identity without exposing its secret.

---

## 8. Router architecture

```text
User request
 ↓
Hard constraints
 ↓
Capability filter
 ↓
Policy filter
 ↓
Credential filter
 ↓
Health / quota filter
 ↓
Preference scoring
 ↓
Historical performance
 ↓
Selected route
 ↓
Fallback chain
```

Routing modes:

- Manual.
- Auto.
- Quality-first.
- Speed-first.
- Cost-first.
- Free-only.
- Local-only.
- Provider-preferred.
- Capability-first.
- Custom policy.

Fallback must be bounded and loop-free.

---

## 9. Explainable routing screen model

The Router UI should expose:

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

The UI explains decisions using observable metadata. It never exposes private model reasoning.

---

## 10. Agent runtime

An agent run is a durable state machine.

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

Terminal alternatives:

```text
FAILED
CANCELLED
TIMED_OUT
BUDGET_EXCEEDED
POLICY_DENIED
```

---

## 11. Agent workforce

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
Synthesis
 ↓
Verification
 ↓
Approval if needed
 ↓
External effect
```

Workers have:

```text
identity
role
capabilities
skills
tools
model policy
context policy
memory policy
permission policy
execution profile
verification policy
budget policy
schedule
workspace
history
```

---

## 12. Parallel task graph

```text
                 ┌── Research ──┐
                 │              │
Request → Plan ──┼── Code ──────┼→ Synthesis → Verify
                 │              │
                 ├── Design ────┤
                 │              │
                 └── Security ──┘
```

Independent nodes may execute concurrently. Dependencies are explicit. Failed nodes remain visible rather than disappearing into a single generic failure.

---

## 13. Tool runtime

Every tool has:

```text
name
version
input schema
output schema
permission policy
timeout
retry policy
side-effect classification
observability hooks
```

Tool discovery never grants permission.

---

## 14. MCP runtime and supply chain

```text
Discover
 ↓
Inspect
 ↓
Trust assessment
 ↓
Permission analysis
 ↓
Register
 ↓
Sandbox / isolate where possible
 ↓
Execute
 ↓
Observe
 ↓
Audit
 ↓
Revoke
```

The MCP screen must show requested permissions and recent effects.

---

## 15. Sandbox architecture

```text
SandboxProvider
├── Local
├── Docker
├── E2B
├── Vercel
├── Daytona
└── Future
```

Lifecycle:

```text
CREATE
 ↓
INITIALIZE
 ↓
PREPARE
 ↓
EXECUTE
 ↓
OBSERVE
 ↓
TEST
 ↓
EXPORT
 ↓
TERMINATE / PERSIST
```

E2B is an optional execution provider, not a mandatory product dependency.

---

## 16. Project Brain and Context Engine

### Project Brain

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
Security
Deployments
Agent history
Model performance
Lessons
```

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
Retrieve → Rank → Compress → Budget → Assemble
```

### Context Inspector

Shows source, scope, relevance, and inclusion reason while redacting secrets and private reasoning.

---

## 17. Codebase intelligence

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

The system must support multiple languages, including at minimum Python, Java, JavaScript, TypeScript, Go, Rust, C, C++, C#, PHP, Ruby, Kotlin, Swift, Dart, SQL, Shell, HTML, and CSS where toolchains are available.

---

## 18. Verification architecture

```text
Code / Build
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
Human review when needed
 ↓
Verification record
```

A model's textual claim is never sufficient evidence of success.

---

## 19. Browser and visual QA

```text
Preview
 ↓
Browser automation
 ↓
Screenshot
 ↓
DOM
 ↓
Accessibility
 ↓
Console
 ↓
Network
 ↓
Visual evaluation
 ↓
Issue
 ↓
Agent fix
 ↓
Regression check
```

This supports the goal of producing genuinely working applications rather than visually plausible prototypes.

---

## 20. Security control plane

```text
Capability request
 ↓
Policy
 ↓
Risk classification
 ↓
ALLOW / ASK / DENY
 ↓
Execution
 ↓
Audit
```

Capabilities:

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

High-impact operations should support approval gates.

---

## 21. Event bus

Events include:

```text
github.event
ci.failed
deployment.failed
database.alert
schedule.triggered
webhook.received
user.action
monitoring.alert
provider.health.changed
credential.state.changed
```

Events can create tasks and invoke agents subject to policy.

---

## 22. Workflow engine

```text
Trigger
 ↓
Task
 ↓
Agent / Tool
 ↓
Condition
 ↓
Parallel
 ↓
Approval
 ↓
Retry / Timeout
 ↓
Resume
 ↓
Output
```

Runs are durable and observable.

---

## 23. GitHub lifecycle

```text
Issue
 ↓
Research
 ↓
Plan
 ↓
Worktree
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
Deploy
 ↓
Observe
```

GitHub is a source-of-truth integration, not merely an export button.

---

## 24. Universal deployment architecture

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

Deployment records:

```text
project
environment
source revision
build status
deployment status
runtime URL
logs
rollback/redeploy
provider
```

---

# 25. Screen architecture

## 25.1 Global shell

```text
┌──────────────────────────────────────────────────────────────┐
│ Workspace • Search • Command Palette • Notifications • User │
├───────────────┬──────────────────────────────┬──────────────┤
│ Navigation    │ Primary workspace            │ Context      │
│               │                              │ Inspector    │
│ Home          │                              │ files        │
│ Chat          │                              │ models       │
│ Projects      │                              │ tools        │
│ Code          │                              │ activity     │
│ Build         │                              │              │
│ Design        │                              │              │
│ Research      │                              │              │
│ Agents        │                              │              │
│ ...           │                              │              │
├───────────────┴──────────────────────────────┴──────────────┤
│ Streaming / jobs / connection / verification status         │
└──────────────────────────────────────────────────────────────┘
```

On mobile, the context panel becomes a sheet/drawer and the navigation becomes a compact command/navigation surface.

---

## 25.2 Home / Command Center

Purpose: orient the user around active work.

Regions:

- universal composer;
- active projects;
- active agent runs;
- workflows;
- provider/model health;
- recent artifacts;
- verification warnings;
- security warnings;
- usage/cost summary.

Avoid decorative dashboards that hide actionable state.

---

## 25.3 Chat

Required:

- multimodal composer;
- model selection;
- routing mode;
- project context;
- attachments;
- files;
- agent invocation;
- tools;
- MCP;
- streaming;
- stop/cancel;
- retry;
- branch/fork;
- artifact creation;
- source/citation presentation where relevant.

---

## 25.4 Projects

```text
Project
├── Overview
├── Chat
├── Files
├── Code
├── Agents
├── Skills
├── Knowledge
├── Workflows
├── GitHub
├── Integrations
├── Preview
├── Deployments
└── Activity
```

---

## 25.5 Code / Engineering workspace

```text
┌─────────────┬──────────────────────────┬───────────────────┐
│ Explorer     │ Editor                   │ Agent / Context   │
│              │                          │                   │
│ files        │ source                   │ plan              │
│ branches     │ diff                     │ tool calls        │
│ search       │ diagnostics              │ changes           │
├─────────────┴──────────────────────────┴───────────────────┤
│ Terminal │ Problems │ Tests │ Git │ Logs │ Preview          │
└─────────────────────────────────────────────────────────────┘
```

AI changes must be reviewable before application.

File states should include:

```text
PROPOSED
APPLIED
REVERTED
EXTERNALLY_CHANGED
CONFLICTED
```

---

## 25.6 Build Studio

```text
Idea
 ↓
Requirements
 ↓
Architecture
 ↓
Sandbox
 ↓
Implementation
 ↓
Verification
 ↓
Preview
 ↓
GitHub
 ↓
Deploy
```

The UI always shows current stage, execution status, artifacts, verification evidence, and external effects.

---

## 25.7 Design Studio

Capabilities:

- image generation/editing;
- UI exploration;
- screenshot analysis;
- design tokens;
- visual references;
- asset generation;
- design-to-code handoff;
- versioned design artifacts.

---

## 25.8 Media Studio

Operations:

- image;
- video;
- audio;
- speech/voice;
- music where supported;
- document generation/transformation.

The model list is capability-filtered.

---

## 25.9 Research Workspace

The UI emphasizes evidence:

```text
Question
 ↓
Sources
 ↓
Claims
 ↓
Cross-checks
 ↓
Evidence
 ↓
Synthesis
```

Expose source lineage, citations, verification state, and uncertainty.

---

## 25.10 Agents

Sections:

- catalog;
- builder;
- capabilities;
- skills;
- model policy;
- memory policy;
- tools;
- permissions;
- budgets;
- schedules;
- evaluations;
- history.

---

## 25.11 Agent Run

Timeline:

```text
Queued
→ Context
→ Routing
→ Executing
→ Tool / Sandbox
→ Approval
→ Verification
→ Completed / Failed / Cancelled
```

Parallel runs use a graph view.

---

## 25.12 Skills

Display:

- name;
- version;
- publisher;
- license;
- dependencies;
- permissions;
- compatible agents/harnesses;
- evaluation;
- usage;
- source.

---

## 25.13 Models

Model cards:

- provider;
- model ID;
- modalities;
- context capacity;
- tool support;
- reasoning support;
- streaming;
- price metadata;
- health;
- availability;
- routing eligibility;
- local/remote indicator.

---

## 25.14 Router

Show:

```text
Request
→ Requirements
→ Candidate models
→ Candidate credentials
→ Policy
→ Health
→ Cost / latency
→ Selection
→ Fallback
```

Users can understand the decision without seeing secrets or private reasoning.

---

## 25.15 API Keys / Credentials

Show:

- provider;
- masked identifier;
- status;
- validation state;
- last used;
- observed usage;
- quota signal;
- cooldown;
- recent failures.

Raw secrets are never rendered after initial secure entry.

---

## 25.16 Provider dashboard

```text
Provider
├── Models
├── Credentials
├── Health
├── Usage
├── Errors
├── Limits / quota signals
└── Provider-specific capabilities
```

---

## 25.17 MCP

Show:

- servers;
- tools;
- schemas;
- requested permissions;
- trust metadata;
- connection state;
- recent executions;
- audit events;
- revoke controls.

---

## 25.18 Integrations

Each integration displays:

```text
Service
Connection
Permissions
Supported actions
Data scope
Recent activity
Revoke
```

---

## 25.19 GitHub

Views:

- repositories;
- branches;
- files;
- commits;
- issues;
- PRs;
- reviews;
- CI;
- agent activity.

Write operations require authorization and are auditable.

---

## 25.20 Deployments

Show:

- source revision;
- environment;
- build;
- runtime state;
- URL;
- logs;
- deployment history;
- rollback/redeploy.

---

## 25.21 Library

Artifact browser with:

- project;
- type;
- source;
- date;
- status;
- version;
- lineage.

---

## 25.22 Knowledge

Distinguish:

```text
Source document
Indexing
Retrieval
Claims
Project association
Lineage
```

---

## 25.23 Workflows

Graph-first editor with:

- triggers;
- nodes;
- conditions;
- parallel branches;
- approval nodes;
- retries;
- schedules;
- run history;
- logs.

---

## 25.24 Usage

Show:

- requests;
- tokens where available;
- estimated cost;
- provider;
- model;
- credential;
- latency;
- success/failure;
- fallback frequency;
- sandbox usage;
- deployment usage where available.

Unknown values must be labeled unknown.

---

## 25.25 Security Center

Show:

- credential health;
- permissions;
- risky tools;
- MCP trust state;
- sandbox policies;
- approval requirements;
- audit events;
- suspicious activity;
- data retention settings.

---

## 25.26 Activity

Unified event stream:

```text
AI request
Agent run
Tool call
MCP call
Sandbox action
GitHub action
Deployment
Workflow
Approval
Security event
Credential event
```

---

## 25.27 Settings

Categories:

- account;
- workspace;
- providers;
- routing;
- credentials;
- privacy;
- security;
- notifications;
- appearance;
- data/export;
- integrations;
- automation defaults.

---

## 25.28 Command Palette

The command palette is a universal control surface for:

- navigation;
- project actions;
- model selection;
- agent invocation;
- workflow execution;
- GitHub actions;
- sandbox commands;
- settings;
- search.

Commands are permission-aware.

---

## 26. Responsive behavior

### Desktop

Three-column engineering workspace where appropriate.

### Tablet

Two-column adaptive workspace.

### Mobile

Single primary surface with sheets for context, files, activity, and controls.

### PWA

The PWA should support installation, offline shell behavior, resumable UI state, notifications where permitted, and graceful degradation when network-dependent capabilities are unavailable.

---

## 27. Accessibility

Requirements:

- keyboard navigation;
- focus visibility;
- semantic labels;
- reduced-motion mode;
- screen-reader-compatible status changes;
- color-independent status indicators;
- accessible editor and terminal controls;
- approval dialogs that clearly identify impact.

---

## 28. Visual language

The visual system should be premium and technical without excessive decoration.

Use:

- strong hierarchy;
- consistent status language;
- restrained animation;
- contextual density;
- high-quality empty states;
- clear destructive-action treatment;
- visible verification state;
- visible permission/cost impact;
- progressive disclosure.

---

## 29. Security UX rule

Every potentially consequential action should communicate:

```text
WHAT will happen?
WHO / WHICH AGENT will do it?
WHICH permissions are used?
WHAT external system is affected?
WHAT may it cost?
CAN it be reversed?
```

---

## 30. Free-first UX rule

The UI must distinguish:

```text
FREE / LOCAL
BYOK
OPTIONAL PAID
ESTIMATED COST
UNKNOWN COST
```

Never imply that a managed service is free merely because INFINITY-11's own interface is free.

---

## 31. Architecture decision rules

1. No provider-specific inference logic in the UI.
2. No sandbox-specific assumptions in domain logic.
3. No database-specific business logic outside persistence adapters.
4. No deployment-provider-specific assumptions in project models.
5. No secret material in ordinary logs.
6. No agent privilege without policy.
7. No quota claim without evidence.
8. No successful task without verification evidence where verification is applicable.
9. No irreversible external action without appropriate approval/policy.
10. No mandatory paid dependency where a viable free/open alternative exists.

---

## 32. Current implementation boundary

This document is intentionally a design specification. **Do not start coding from it yet.**

The immediate objective is to stabilize:

- product definition;
- competitive gap analysis;
- architecture;
- free-first strategy;
- security model;
- routing contracts;
- agent contracts;
- sandbox/deployment abstractions;
- screen information architecture.

Implementation begins only after this design baseline is accepted as sufficiently complete.
