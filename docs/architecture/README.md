# INFINITY-11 Architecture

## Architectural objective

INFINITY-11 is designed as a modular orchestration platform rather than a provider-specific chat frontend. The architecture separates presentation, identity, projects, AI access, model routing, credentials, agents, tools, MCP, sandbox execution, knowledge, workflows, integrations, deployments, security, and observability.

## System layers

```text
Web / PWA
  ↓
Application API / BFF
  ↓
Domain services
  ├── Identity & Workspace
  ├── Project & Conversation
  ├── AI Gateway
  ├── Model Registry & Router
  ├── Credential Manager
  ├── Agent Runtime
  ├── Tool Runtime
  ├── MCP Runtime
  ├── Sandbox Manager
  ├── Workflow Engine
  ├── Knowledge & Memory
  ├── Integration Adapters
  ├── Deployment Engine
  ├── Security & Policy
  └── Observability
  ↓
Supabase / E2B / GitHub / Vercel / external providers
```

## Boundary rules

### AI Gateway
The single logical entry point for model execution. It applies authentication, authorization, policy, context preparation, routing, credential selection, retries, failover, usage accounting, and normalized errors.

### Provider adapters
Provider-specific API behavior belongs here. The rest of the application consumes normalized contracts and capability metadata.

### Router
Chooses a model/provider/key candidate according to user policy, task requirements, availability, quota signals, latency, cost, and historical signals.

### Credential manager
Owns secure storage, masking, validation, lifecycle, and retrieval of provider credentials. Raw secrets must not leak into application logs or client code.

### Agent runtime
Executes agents with explicit model, tool, memory, permission, timeout, iteration, budget, and approval policies.

### Tool/MCP runtime
Provides a permission-controlled execution boundary for tools and external MCP servers.

### Sandbox manager
Creates and controls isolated E2B environments for code execution and application building.

### Workflow engine
Coordinates scheduled, webhook-driven, event-driven, and manual tasks with durable state, retries, timeouts, cancellation, and idempotency.

## Core data ownership

Supabase is the primary system of record for identity, relational application state, project metadata, usage metadata, audit information, and supported file/storage metadata. Sensitive credentials require additional encryption/secrets handling rather than ordinary plaintext fields.

## Execution lifecycle

```text
intent
→ policy
→ context
→ routing
→ credential
→ provider/tool/sandbox execution
→ observation
→ verification
→ artifact/result
→ persistence
```

## Agent execution

```text
Task
→ context assembly
→ model selection
→ reasoning
→ permission check
→ tool call when required
→ observation
→ iteration
→ verification
→ result
```

Parallel tasks should use dependency-aware graphs so independent work can run concurrently while dependent work waits for prerequisites.

## Security model

Default deny applies to privileged agent capabilities. Important permissions include filesystem writes, deletion, shell execution, network access, Git write operations, pull-request creation, deployment, database administration, and secret access.

## Reliability model

External operations are failure-prone. Normalize errors, use bounded retries, fail over only when the error class allows it, preserve correlation identifiers, expose execution state, support cancellation, and maintain idempotency for side effects.

## Observability

Execution should carry correlation identifiers across user requests, agent runs, model calls, tool calls, MCP operations, sandbox jobs, workflow tasks, and deployments. Logs must redact secrets.

## UI architecture

The product is organized around a persistent application shell with workspace navigation and purpose-built screens for Chat, Projects, Code, Build, Design, Research, Media, Agents, Skills, Workflows, Models, Router, API Keys, MCP, Integrations, GitHub, Deployments, Library, History, Usage, Security, Settings, and future Labs/Marketplace capabilities.

## Deployment boundaries

Vercel is the primary web/application hosting target. Supabase provides authentication and data services. E2B provides isolated code execution. GitHub provides repository workflows. MCP provides an extensible tool protocol. Individual AI providers remain external dependencies behind adapters.

## Architectural quality bar

New features must preserve modularity, security, testability, observability, and provider neutrality. A feature is not production-ready solely because its UI exists; the underlying contracts, failure handling, tests, security controls, documentation, and verification must also exist.
