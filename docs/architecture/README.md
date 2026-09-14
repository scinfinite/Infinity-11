# INFINITY-11 Architecture

## Architectural objective

INFINITY-11 is designed as a modular orchestration platform rather than a provider-specific chat frontend or a Replit clone. It separates presentation, identity, projects, AI access, model routing, credentials, agents, tools, MCP, remote execution, knowledge, workflows, integrations, deployments, security, and observability.

The architecture has four non-negotiable characteristics:

1. **FREE-FIRST:** the initial product must not require a paid INFINITY-11 subscription.
2. **BYOK-FIRST:** user-controlled AI/provider credentials are first-class.
3. **REMOTE-EXECUTION-FIRST:** heavy build/test/run work should not depend on the user's device.
4. **MULTIPLATFORM:** the system must be capable of producing and managing web, mobile, desktop, and backend application targets.

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
  ├── Workflow Engine
  ├── Security & Policy
  └── Observability
  ↓
Execution Plane
  ├── Execution Manager
  ├── Sandbox Providers
  ├── Browser / Visual QA
  ├── Build / Test / Run
  ├── Artifact / Preview
  └── Packaging
  ↓
Provider / Infrastructure Adapters
  ├── AI providers
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
Execution Manager
   ↓
Remote Execution Environment
   ↓
Build → Test → Run → Browser QA
   ↓
Artifact / Preview / Logs
   ↓
User Device
```

The user's device is primarily a control, interaction, editor, streaming, and visualization surface. Remote execution is preferred for heavy workloads, while local/self-hosted execution remains an optional provider.

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
Executes agents with explicit model, tool, memory, permission, timeout, iteration, budget, and approval policies.

### Tool/MCP runtime
Provides a permission-controlled execution boundary for tools and external MCP servers.

### Execution manager
Owns the lifecycle of heavy and untrusted workloads. It selects an execution provider, provisions an environment, streams state/logs, enforces limits and policies, stores artifacts, performs cleanup, and records cost/ownership metadata.

### Sandbox providers
Expose a common execution contract so E2B, Vercel Sandbox, Docker, local/self-hosted runners, and future providers can be added or replaced without redesigning the product.

### Workflow engine
Coordinates scheduled, webhook-driven, event-driven, and manual tasks with durable state, retries, timeouts, cancellation, and idempotency.

## Core data ownership

Supabase is an intended primary backend option for identity, relational application state, project metadata, usage metadata, audit information, and supported file/storage metadata. Database access must remain behind a provider abstraction so PostgreSQL or another supported backend can replace it later.

Sensitive credentials require dedicated encryption/secrets handling rather than ordinary plaintext fields.

## Execution lifecycle

```text
intent
→ policy
→ context
→ routing
→ credential
→ agent/tool/sandbox execution
→ observation
→ verification
→ artifact/result
→ persistence
```

## Generated-application lifecycle

```text
idea
→ requirements
→ research
→ specification
→ architecture
→ plan
→ agent team
→ code generation
→ dependency installation
→ build
→ test
→ run
→ browser/visual QA
→ security verification
→ review
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

## Reliability model

External operations are failure-prone. Normalize errors, use bounded retries, fail over only when the error class allows it, preserve correlation identifiers, expose execution state, support cancellation, and maintain idempotency for side effects.

## Observability

Execution should carry correlation identifiers across user requests, agent runs, model calls, tool calls, MCP operations, sandbox jobs, workflow tasks, builds, tests, and deployments. Logs must redact secrets and expose enough state to diagnose failures without exposing private model reasoning.

## UI architecture

The product is organized around a persistent application shell with purpose-built surfaces for Chat, Projects, Code, Build, Design, Research, Media, Agents, Skills, Workflows, Models, Router, API Keys, MCP, Integrations, GitHub, Deployments, Library, History, Usage, Security, Settings, and future Labs/Marketplace capabilities.

The Build workspace must make remote execution visible through environment status, logs, build/test state, preview, artifacts, and resource/ownership information.

## Deployment boundaries

Vercel is an intended primary web/application hosting target, not a mandatory dependency. Supabase is an intended backend option. E2B is an intended isolated execution adapter, not the definition of the execution layer. GitHub is a first-class source-control/lifecycle integration. MCP provides an extensible tool protocol. Individual AI providers remain external dependencies behind adapters.

## Architectural quality bar

New features must preserve modularity, security, testability, observability, provider neutrality, free-first economics, and execution portability. A feature is not production-ready solely because its UI exists; the underlying contracts, failure handling, tests, security controls, documentation, and verification must also exist.
