# INFINITY-11 Architecture

## Architectural objective

INFINITY-11 is designed as a modular orchestration platform rather than a provider-specific chat frontend or a Replit clone. It separates presentation, identity, projects, AI access, model routing, credentials, agents, teams, tools, MCP, remote execution, knowledge, workflows, automation, integrations, deployments, security, verification, and observability.

The architecture has six non-negotiable characteristics:

1. **FREE-FIRST:** the initial product must not require a paid INFINITY-11 subscription.
2. **BYOK-FIRST:** user-controlled AI/provider credentials are first-class.
3. **REMOTE-EXECUTION-FIRST:** heavy build/test/run work should not depend on the user's device.
4. **MULTIPLATFORM:** the system must be capable of producing and managing web, mobile, desktop, and backend application targets.
5. **BEST-POSSIBLE-OUTPUT:** the system must iteratively test, critique, improve, and verify meaningful work rather than stopping at the first acceptable result.
6. **AUTOMATION-NATIVE:** deterministic workflows, autonomous agents, and hybrid workflows are first-class runtime primitives.

## System layers

```text
Web / PWA
  ↓
Application API / BFF
  ↓
Control Plane
  ├── Identity & Workspace
  ├── Project & Conversation
  ├── AI Gateway
  ├── Model Registry & Router
  ├── Credential Manager
  ├── Agent Workforce / Runtime
  ├── Tool Runtime
  ├── MCP Runtime
  ├── Context / Project Brain
  ├── Automation / Workflow Engine
  ├── Security & Policy
  ├── Verification / Quality Engine
  └── Observability
  ↓
Execution Plane
  ├── Execution Manager
  ├── Sandbox Providers
  ├── Browser / Visual QA
  ├── Build / Test / Run
  ├── Artifact / Preview
  ├── Background Jobs
  └── Packaging
  ↓
Provider / Infrastructure Adapters
  ├── AI providers / local models
  ├── GitHub
  ├── E2B / Vercel Sandbox / Docker / local
  ├── Supabase / PostgreSQL / future DB providers
  ├── Vercel / Cloudflare / other deployment targets
  └── MCP / external integrations
```

## Control plane vs execution plane

The control plane coordinates work. The execution plane performs potentially expensive or untrusted workloads.

```text
User Device
   ↓
Web / PWA
   ↓
Control Plane
   ↓
Orchestrator
   ↓
Execution Manager
   ↓
Remote Execution Environment
   ↓
Build → Test → Run → Browser QA
   ↓
Artifact / Preview / Logs
   ↓
Verification
   ↓
User Device
```

The user's device is primarily a control, interaction, editor, streaming, and visualization surface. Remote execution is preferred for heavy workloads, while local/self-hosted execution remains an optional provider.

## Core orchestration model

INFINITY-11 unifies deterministic workflows and autonomous agents.

```text
                 ORCHESTRATOR
                      │
          ┌───────────┼───────────┐
          ↓           ↓           ↓
     DETERMINISTIC  AUTONOMOUS   HYBRID
       WORKFLOW       AGENTS     WORKFLOW
          │           │           │
          └───────────┼───────────┘
                      ↓
                  VERIFICATION
```

### Deterministic

Exact execution order, conditions, state, retries, timeouts, approvals, and side-effect boundaries.

### Autonomous

Goal-driven agents can plan, delegate, use tools, and adapt within explicit policies.

### Hybrid

A deterministic workflow provides the safety/control structure while agents provide judgment at selected steps. Hybrid execution is the preferred architecture for serious production automation.

## Automation Fabric

```text
Automation Fabric
├── Visual workflow builder
├── Natural-language workflow generation
├── Triggers
├── Actions
├── Conditions
├── Loops
├── Parallel branches
├── Wait / timers
├── Approvals
├── Agents / sub-agents
├── Tools / MCP
├── Browser / GitHub / database / sandbox nodes
├── Retry
├── Recovery
├── Resume
├── Durable state
└── Audit / observability
```

The workflow engine must support manual, scheduled, recurring, webhook-driven, event-driven, long-running, resumable, and human-approved execution.

Automation is not restricted to SaaS API plumbing. Agents, sandboxes, code execution, verification, GitHub operations, browser actions, and deployment are workflow primitives subject to policy.

## Best-Possible-Output architecture

The quality engine sits after execution and can trigger additional improvement cycles.

```text
Request
 ↓
Plan
 ↓
Execute
 ↓
Test
 ↓
Critique
 ↓
Security / Performance / UX checks
 ↓
Improve
 ↓
Retest
 ↓
Final quality gate
 ↓
Verified result
```

The platform must not equate a successful build with a high-quality application.

Verification status must distinguish:

```text
VERIFIED
PARTIALLY VERIFIED
UNVERIFIED
BLOCKED
```

## AI Workforce architecture

```text
Project
 ↓
Workforce Planner
 ↓
Team Lead / Orchestrator
 ↓
Specialist Agents
 ↓
Tools / MCP / Sandbox
 ↓
Parallel work
 ↓
Synthesis
 ↓
Verification
```

An agent has:

```text
identity
role
goal
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
performance history
approval policy
```

Teams are dynamically composed according to the task rather than being limited to fixed personas.

## Cost ownership model

The architecture must never assume that remote compute or AI calls are unlimited and free.

```text
                    Workload Cost
                         │
       ┌─────────────────┼─────────────────┐
       ↓                 ↓                 ↓
 INFINITY platform    User BYOK       User compute
     resources        AI/provider       or free-tier
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ↓
               Optional future managed
                    infrastructure
```

A provider may have a free tier, trial credit, or local mode, but those limits must be represented accurately. Optional paid providers are adapters, not mandatory foundations.

## Application target architecture

One product specification can describe several coordinated targets:

```text
Product Specification
        ↓
Architecture / Contracts / Design System
        ↓
 ┌──────────┬────────────┬────────────┐
 │   Web    │   Mobile   │  Desktop   │
 │ Next/Vue │ Expo/etc.  │ Tauri/etc. │
 └──────────┴────────────┴────────────┘
        ↓
Backend / APIs / Database / Auth / Integrations
        ↓
Build + Test + Security + Visual QA
        ↓
Package + Preview + Deploy
```

The framework is selected according to the project's requirements and available capabilities. The platform must not hard-code one stack. Java and other supported programming languages belong in the language capability registry.

## Boundary rules

### AI Gateway
The single logical entry point for model execution. It applies authentication, authorization, policy, context preparation, routing, credential selection, retries, failover, usage accounting, and normalized errors.

### Provider adapters
Provider-specific API behavior belongs here. The rest of the application consumes normalized contracts and capability metadata.

### Router
Chooses a model/provider/key candidate according to user policy, task requirements, availability, quota signals, latency, cost, historical signals, and credential/provider health.

### Credential manager
Owns secure storage, masking, validation, lifecycle, and retrieval of provider credentials. Raw secrets must not leak into application logs or client code.

### Agent runtime
Executes agents with explicit model, tool, memory, permission, timeout, iteration, budget, approval, and verification policies.

### Tool/MCP runtime
Provides a permission-controlled execution boundary for tools and external MCP servers.

### Execution manager
Owns the lifecycle of heavy and untrusted workloads. It selects an execution provider, provisions an environment, streams state/logs, enforces limits and policies, stores artifacts, performs cleanup, and records cost/ownership metadata.

### Sandbox providers
Expose a common execution contract so E2B, Vercel Sandbox, Docker, local/self-hosted runners, and future providers can be added or replaced without redesigning the product.

### Workflow engine
Coordinates deterministic and agentic tasks with durable state, retries, timeouts, cancellation, approvals, idempotency, and bounded recovery.

### Verification engine
Runs the strongest applicable tests and quality checks and records evidence. It can request another improvement cycle when meaningful defects remain.

## Execution lifecycle

```text
intent
→ identity / policy
→ context
→ routing
→ workforce / workflow
→ credential
→ tool / agent / sandbox execution
→ critique
→ verification
→ artifact / result
→ persistence
→ observation
```

## Generated-application lifecycle

```text
idea
→ requirements
→ research
→ specification
→ architecture
→ plan
→ dynamic agent team
→ code generation
→ dependency installation
→ build
→ test
→ run
→ browser/visual QA
→ security verification
→ quality critique
→ improvement
→ GitHub
→ preview
→ deploy
→ observe
→ fix
→ iterate
```

## Agent execution

```text
Task
→ context assembly
→ model selection
→ reasoning/action
→ permission check
→ tool/sandbox call
→ observation
→ iteration
→ verification
→ result
```

Parallel tasks should use dependency-aware graphs so independent work can run concurrently while dependent work waits for prerequisites.

## Security model

Default deny applies to privileged agent capabilities. Important permissions include filesystem writes, deletion, shell execution, network access, Git write operations, pull-request creation, deployment, database administration, and secret access.

Execution environments must be isolated according to workload risk. Autonomous code must never be treated as trusted merely because an AI agent generated it.

## Reliability and recovery model

External operations are failure-prone. Normalize errors, use bounded retries, fail over only when the error class allows it, preserve correlation identifiers, expose execution state, support cancellation, maintain idempotency for side effects, and resume recoverable workflows.

Self-healing is allowed only for policy-approved, bounded recovery paths.

## Observability

Execution should carry correlation identifiers across user requests, agent runs, model calls, tool calls, MCP operations, sandbox jobs, workflow tasks, builds, tests, and deployments. Logs must redact secrets and expose enough state to diagnose failures without exposing private model reasoning.

## UI architecture

The product is organized around a persistent application shell with purpose-built surfaces for Chat, Projects, Code, Build, Design, Research, Media, Agents, Teams, Skills, Workflows, Models, Router, API Keys, MCP, Integrations, GitHub, Deployments, Library, History, Usage, Security, and future Labs/Marketplace capabilities.

The Automation workspace is a first-class visual canvas. It must show nodes, dependencies, agent participation, permissions, execution state, retries, approvals, and verification status.

The Build workspace must make remote execution visible through environment status, logs, build/test state, preview, artifacts, and resource/ownership information.

## Deployment boundaries

Vercel is an intended primary web/application hosting target, not a mandatory dependency. Supabase is an intended backend option. E2B is an intended isolated execution adapter, not the definition of the execution layer. GitHub is a first-class source-control/lifecycle integration. MCP provides an extensible tool protocol. Individual AI providers remain external dependencies behind adapters.

## Architectural quality bar

New features must preserve modularity, security, testability, observability, provider neutrality, free-first economics, execution portability, automation reliability, and best-output verification. A feature is not production-ready solely because its UI exists; the underlying contracts, failure handling, tests, security controls, documentation, and verification must also exist.
