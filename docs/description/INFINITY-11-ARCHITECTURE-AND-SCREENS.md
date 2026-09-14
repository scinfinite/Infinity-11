# INFINITY-11 — Architecture & Screen Specification

> **Document status:** Product architecture definition
> **Scope:** System boundaries, runtime architecture, data/control flows, UI information architecture, screen contracts, security surfaces, and responsive behavior.
> **Non-scope:** Implementation code, deployment commands, and a delivery roadmap.

## 1. Architectural intent

INFINITY-11 is a provider-agnostic AI application platform for builders. Its architecture separates the user experience from model providers, credentials, execution environments, tools, repositories, and deployment platforms.

The central architectural rule is:

```text
User intent
    ↓
Application/API boundary
    ↓
Policy + context + orchestration
    ↓
AI Gateway / Router
    ↓
Provider + credential selection
    ↓
External AI capability
    ↓
Normalized response/events
    ↓
Artifacts / memory / usage / audit
    ↓
User-visible result
```

The same orchestration model is reused by Chat, Code, Build, Research, Media, Agents, and Workflows.

## 2. Logical system layers

```text
┌──────────────────────────────────────────────────────────────┐
│ EXPERIENCE LAYER                                             │
│ Web • PWA • Responsive UI • Command Palette • Notifications │
├──────────────────────────────────────────────────────────────┤
│ APPLICATION LAYER                                            │
│ Sessions • Projects • Conversations • Commands • APIs        │
├──────────────────────────────────────────────────────────────┤
│ ORCHESTRATION LAYER                                          │
│ AI Gateway • Router • Agents • Workflows • Context           │
├──────────────────────────────────────────────────────────────┤
│ CAPABILITY LAYER                                             │
│ Providers • Models • Tools • MCP • GitHub • E2B              │
├──────────────────────────────────────────────────────────────┤
│ DATA / CONTROL LAYER                                         │
│ Supabase • Storage • Queue/Jobs • Audit • Usage • Memory     │
├──────────────────────────────────────────────────────────────┤
│ EXTERNAL EXECUTION                                           │
│ AI providers • E2B • GitHub • Supabase • Vercel • Services   │
└──────────────────────────────────────────────────────────────┘
```

### 2.1 Experience layer

Owns navigation, composition, streaming presentation, editor surfaces, artifact previews, approval dialogs, status indicators, and responsive behavior. It must not contain provider-specific API logic.

### 2.2 Application layer

Owns authenticated user actions and domain operations such as creating projects, sending messages, starting agent runs, creating workflows, and managing integrations.

### 2.3 Orchestration layer

Coordinates policies, routing, context assembly, agent execution, tool calls, retries, fallback, verification, and lifecycle state.

### 2.4 Capability layer

Provides normalized contracts for providers, models, tools, MCP servers, repositories, sandboxes, and deployment targets.

### 2.5 Data/control layer

Persists durable application state and records operational evidence. Secrets require a dedicated protected lifecycle and must not be treated as ordinary application data.

## 3. Core domain boundaries

### 3.1 Identity and workspace

A workspace is the primary tenancy boundary. Users may belong to one or more workspaces. Workspace-level configuration can include provider policies, integrations, security defaults, and shared resources.

### 3.2 Project

A project is the primary builder workspace. It groups conversations, files, source code, agents, skills, knowledge, workflows, integrations, repositories, previews, and deployments.

### 3.3 Conversation

A conversation is a durable interaction stream containing messages, attachments, context references, model decisions, tool events, and generated artifacts.

### 3.4 Agent run

An agent run is an execution instance with explicit state, permissions, model selections, tool calls, child tasks, artifacts, verification results, and audit events.

### 3.5 Workflow run

A workflow run executes a persisted graph of triggers, tasks, conditions, agents, tools, and outputs. Workflow execution must be resumable and observable.

## 4. AI Gateway

The AI Gateway is the single conceptual entry point for model inference and generation.

```text
Request
  → authentication
  → authorization
  → policy evaluation
  → context normalization
  → capability requirements
  → routing
  → credential selection
  → provider adapter
  → streaming / response
  → usage accounting
  → audit + trace
```

The Gateway must normalize provider differences without pretending that providers have identical capabilities.

## 5. Provider abstraction

Each provider adapter owns provider-specific authentication, request construction, response parsing, error mapping, model discovery, capability discovery, and provider-specific usage/quota semantics.

The normalized contract should represent:

- provider identity
- model identity
- capabilities
- modalities
- streaming support
- tool support
- context limits
- pricing metadata
- health
- quota signals
- provider-specific limitations

Unknown provider data must remain explicitly unknown rather than being fabricated.

## 6. Multi-key credential architecture

INFINITY-11 treats credentials as first-class routing resources.

```text
Provider
├── Credential A → healthy
├── Credential B → rate limited
├── Credential C → exhausted
└── Credential D → invalid
```

Selection must consider policy, health, observed failures, quota signals, request compatibility, and cooldown state.

The system must distinguish:

- invalid credential
- authentication failure
- rate limit
- quota exhaustion
- temporary provider failure
- model unavailable
- unsupported capability
- network timeout
- policy rejection

A transient failure must not permanently disable a credential. A known invalid credential must not participate in ordinary routing until revalidated.

## 7. Routing and failover

Routing is a constrained optimization problem rather than simple random key rotation.

Required inputs include:

- task capability requirements
- user-selected model or routing mode
- provider compatibility
- model health
- credential health
- quota state
- cost preference
- latency preference
- free-only constraint
- context requirements
- modality requirements
- tool requirements
- policy restrictions

A conceptual fallback chain is:

```text
Requested model
   ↓ unavailable?
Compatible model on same credential/provider
   ↓ unavailable?
Compatible model on another credential of same provider
   ↓ unavailable?
Compatible provider
   ↓ unavailable?
Explicit failure with actionable diagnostics
```

The router must have bounded attempts and must prevent fallback loops.

## 8. Agent runtime

The agent runtime executes structured tasks rather than treating an agent as a prompt string.

An execution contains:

```text
Run
├── objective
├── context
├── policy
├── model strategy
├── tool permissions
├── budget
├── parent task
├── child tasks
├── observations
├── artifacts
├── verification
└── final result
```

Agent execution should expose state transitions to the UI without exposing private internal reasoning.

## 9. Parallel agent execution

Parallel work is represented as a task graph.

```text
                 ┌─ Research ─┐
User task → Plan ├─ Code ─────┼→ Synthesis → Verify
                 ├─ Design ───┤
                 └─ Review ───┘
```

Dependencies are explicit. Independent tasks may execute concurrently. Dependent tasks wait for required outputs. Failed branches must be visible and recoverable.

## 10. Tool and MCP runtime

Tools are capability endpoints with schemas, permissions, execution policies, timeouts, and audit events.

MCP servers are treated as external tool providers. Discovery does not imply execution permission.

```text
MCP server
  ↓ discovery
Tool catalog
  ↓ policy evaluation
Allowed tool
  ↓ approval if required
Execution
  ↓
Observation + audit
```

## 11. E2B sandbox architecture

The Build and Code systems use isolated execution environments for untrusted or generated code.

```text
Project
  ↓
Sandbox request
  ↓
Ephemeral E2B environment
  ↓
Install / configure
  ↓
Generate or modify files
  ↓
Run tests / build / preview
  ↓
Collect artifacts + logs
  ↓
Destroy or persist according to policy
```

Secrets must not be copied into a sandbox unless explicitly authorized and scoped.

## 12. GitHub integration boundary

GitHub operations are isolated behind a repository integration layer. The UI can expose repositories, branches, files, commits, pull requests, issues, reviews, and CI state without coupling those screens to the GitHub API implementation.

Write operations must carry explicit authorization and should be represented in the activity/audit stream.

## 13. Deployment boundary

Deployment adapters abstract targets such as Vercel and future platforms.

A deployment record should identify:

- project
- environment
- source revision
- build status
- deployment status
- runtime URL when available
- logs
- rollback/redeploy capability
- provider

## 14. Memory and knowledge

Memory represents durable user/project context. Knowledge represents retrievable external or project material.

They must remain distinguishable:

```text
Memory  → durable context about work/user preferences
Knowledge → source-backed information available for retrieval
Context  → material selected for one execution
```

Retrieval metadata should remain attached to source-backed content where applicable.

## 15. Usage and observability

Every meaningful AI execution should have a traceable lifecycle.

```text
request_id
  ├── routing decision
  ├── credential decision
  ├── provider call
  ├── tool calls
  ├── sandbox actions
  ├── usage measurements
  ├── fallback events
  └── final outcome
```

The observability layer must support latency, errors, retries, fallback, token/usage metadata, provider health, and cost estimates.

## 16. Security architecture

Security is cross-cutting rather than a single screen.

Controls include:

- authentication
- authorization
- least privilege
- secret isolation
- encrypted credential storage
- scoped integration permissions
- tool policies
- sandbox isolation
- approval gates
- audit logging
- rate limits
- abuse controls
- data retention controls
- privacy boundaries

## 17. Screen architecture

Every screen has three layers:

1. **Orientation:** what is happening?
2. **Action:** what can the user do?
3. **Impact:** what permissions, cost, or external effects are involved?

## 18. Global application shell

```text
┌──────────────────────────────────────────────────────────────┐
│ Workspace • Search • Command Palette • Notifications • User │
├───────────────┬──────────────────────────────┬──────────────┤
│ Navigation    │ Primary workspace            │ Context      │
│               │                              │ Inspector    │
│ Home          │ page-specific content        │              │
│ Chat          │                              │ files        │
│ Projects      │                              │ models       │
│ Code          │                              │ tools        │
│ Build         │                              │ activity     │
│ Agents        │                              │              │
│ ...           │                              │              │
├───────────────┴──────────────────────────────┴──────────────┤
│ Status / streaming / jobs / connection indicators           │
└──────────────────────────────────────────────────────────────┘
```

The right context panel is optional and collapsible. It must never hide critical content on small screens.

## 19. Home screen contract

Home is the operational command center.

Primary regions:

- universal prompt/composer
- recent projects
- active runs
- recent artifacts
- provider/model health
- usage snapshot
- workflow status
- quick actions
- security warnings

The screen should prioritize active work over decorative analytics.

## 20. Chat screen contract

Chat supports text and compatible multimodal inputs.

Required capabilities:

- model selection
- routing selection
- project context
- attachments
- file references
- agent invocation
- tools
- MCP
- streaming
- stop/cancel
- branch/fork
- retry
- copy/export
- artifact creation

Every tool action should have a visible state representation.

## 21. Projects screen contract

Projects provide a structured workspace browser.

A project overview should expose:

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
└── Deployments
```

## 22. Code screen contract

The Code workspace is an AI-assisted IDE surface.

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

AI-generated changes should be reviewable before being applied. The UI should distinguish proposed, applied, reverted, and externally changed files.

## 23. Build screen contract

Build is the product's idea-to-application surface.

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
Tests
 ↓
Preview
 ↓
Review
 ↓
GitHub
 ↓
Deploy
```

The UI must show current build stage, sandbox state, generated artifacts, verification results, and external side effects.

## 24. Design screen contract

Design supports:

- image generation/editing
- UI exploration
- screenshot analysis
- design tokens
- visual references
- asset generation
- design-to-code handoff

Design artifacts should be versionable and associated with projects.

## 25. Media screen contract

Media groups image, video, audio, speech/voice, music, and document generation. Capability metadata controls which models can appear for a selected operation.

## 26. Research screen contract

Research emphasizes evidence. The interface should expose source list, extracted claims, notes, citations, confidence/verification state, and generated outputs.

## 27. Agents screen contract

The Agents area contains:

- agent catalog
- agent builder
- permissions
- skills
- model strategy
- memory policy
- tool policy
- run history
- evaluation status

## 28. Agent run screen contract

A run timeline should show:

```text
Queued
→ Context prepared
→ Routing
→ Executing
→ Tool / sandbox action
→ Waiting / approval
→ Verification
→ Completed / failed / cancelled
```

For parallel work, show a graph with parent-child relationships and dependency states.

## 29. Skills screen contract

Skills are reusable, versioned capability packages. The screen should show ownership, version, description, dependencies, permissions, compatible agents, and usage history.

## 30. Models screen contract

Model cards should expose normalized capability metadata rather than marketing claims alone.

Useful fields:

- provider
- model identifier
- modality
- context capacity
- tool support
- reasoning support
- streaming
- price metadata
- health
- user rating/favorite
- routing eligibility

## 31. Router screen contract

Router UI must make automated decisions understandable.

```text
Request
  ↓
Requirements
  ↓
Eligible models
  ↓
Eligible credentials
  ↓
Policy scoring
  ↓
Selected route
  ↓
Fallbacks if needed
```

The user should be able to inspect the decision without seeing credentials.

## 32. API Keys screen contract

Credential management should display:

- provider
- masked identifier
- status
- validation state
- last-used timestamp
- observed usage
- quota signal
- cooldown/failure state

Raw secret values are never rendered after entry.

## 33. Provider screen contract

Provider dashboards combine models, capabilities, credentials, health, usage, errors, and provider-specific limitations.

## 34. MCP screen contract

MCP management exposes servers, tools, schemas, permissions, connection state, recent executions, and approval requirements.

## 35. Integrations screen contract

Integrations should show service category, connection state, permissions, supported actions, and data-access scope.

## 36. GitHub screen contract

GitHub views include repository selection, branch state, files, commits, pull requests, issues, reviews, and CI. Agent actions require visible authorization and should be auditable.

## 37. Deployments screen contract

Deployment UI should show source revision, environment, build, runtime status, logs, URL, rollback/redeploy controls, and deployment history.

## 38. Library screen contract

Library is the artifact surface for generated and imported resources. Filters should include project, type, source, date, and status.

## 39. Knowledge screen contract

Knowledge should distinguish source documents, indexing state, retrieval state, and project association. Source lineage should remain inspectable.

## 40. Workflow screen contract

The workflow builder is graph-first.

```text
Trigger → Task → Condition → Agent → Tool → Output
                     │
                     └────────→ Branch / Retry / Approval
```

Execution state must be visible per node.

## 41. Usage screen contract

Usage should support filtering by workspace, project, provider, model, credential, agent, workflow, date, capability, and outcome.

## 42. Security screen contract

Security Center aggregates credential risks, excessive permissions, suspicious events, integration scope, tool policies, repository exposure, and deployment concerns.

## 43. Activity screen contract

Activity is an event timeline with filters and drill-down into execution traces. Important events must link back to their originating project/resource.

## 44. Settings screen contract

Settings are grouped by identity, workspace, appearance, AI defaults, routing, privacy, notifications, developer behavior, integrations, security, and experimental capabilities.

## 45. Command palette

`Ctrl/Cmd + K` provides navigation and contextual actions. Commands must be permission-aware and should not expose actions the current user cannot perform.

## 46. Context inspector

Power users can inspect the effective execution context:

```text
Instructions
Project context
Conversation context
Selected files
Knowledge references
Memory
Tools
MCP servers
Model
Routing policy
Permissions
```

Secrets and protected internal data must be redacted.

## 47. Approval UX

Before a privileged external effect, the UI should identify:

- requested action
- target resource
- actor/agent
- reason
- permissions
- expected side effects
- estimated cost where available
- approve / reject / modify controls

## 48. Responsive architecture

Desktop uses multi-pane layouts where they improve productivity. Tablet layouts collapse secondary information. Mobile prioritizes focused tasks and uses sheets/drawers for advanced controls.

Mobile navigation should prioritize Home, Chat, Build, Agents, and More.

## 49. Visual system

The visual language should be premium and futuristic without sacrificing density or usability. Use hierarchy, restrained depth, clear typography, consistent spacing, meaningful status indicators, and purposeful animation.

Avoid animation that delays work or obscures state.

## 50. Accessibility

All screens must support keyboard navigation, semantic landmarks, visible focus, accessible dialogs, screen-reader labels, adequate contrast, and reduced-motion preferences.

## 51. PWA behavior

The application shell should be installable as a PWA. Offline mode must clearly distinguish cached UI availability from unavailable network operations. AI requests should never appear successful while disconnected.

## 52. Screen quality rules

Every screen must:

1. Have a clear primary task.
2. Preserve user context during navigation.
3. Make asynchronous state visible.
4. Make destructive or external effects explicit.
5. Provide recovery paths for failures.
6. Avoid leaking credentials or protected context.
7. Remain usable at mobile widths.
8. Respect accessibility settings.
9. Expose relevant provenance and audit information.
10. Keep domain logic out of presentation components.

## 53. Architectural invariants

The following invariants define the intended system boundary:

- UI never directly owns provider credentials.
- Provider-specific behavior stays inside provider adapters.
- Routing decisions are policy-driven and observable.
- Tool discovery never grants execution permission.
- Generated code executes in controlled environments.
- External write actions are permissioned and auditable.
- Usage is recorded independently from visual analytics.
- Unknown provider data remains unknown.
- Retries are bounded and idempotency-aware.
- User-visible state reflects actual execution state.

## 54. End-to-end reference flow

```text
User
 ↓
Web/PWA
 ↓
Authenticated application API
 ↓
Project + conversation context
 ↓
Policy / permissions
 ↓
AI Gateway
 ↓
Router
 ↓
Credential selector
 ↓
Provider adapter
 ↓
Model provider
 ↓
Streamed normalized events
 ↓
Tool / MCP / E2B actions when required
 ↓
Verification
 ↓
Artifact + usage + audit persistence
 ↓
UI updates
```

This architecture is intentionally provider-agnostic and extensible. New providers, tools, sandboxes, deployment targets, and UI capabilities should integrate through defined boundaries rather than expanding the core with provider-specific conditionals.
