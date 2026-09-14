# INFINITY-11 Architecture

## Canonical baseline

The canonical pre-implementation architecture is now:

**`docs/architecture/INFINITY-11-FINAL-PRE-IMPLEMENTATION-BLUEPRINT.md`**

This file remains the concise architecture index and governing principles. Where this index and the blueprint differ, the blueprint is authoritative until this index is fully consolidated.

## Architectural objective

INFINITY-11 is a modular orchestration platform rather than a provider-specific chat frontend or a Replit clone. It separates presentation, identity, projects, AI access, model routing, credentials, agents, teams, tools, MCP, remote execution, knowledge, workflows, automation, integrations, deployments, security, verification, and observability.

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

## Core orchestration model

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

Hybrid execution is the preferred architecture for serious production automation.

## Automation Fabric

Automation is a first-class runtime with visual editing, natural-language generation, durable state, triggers, agents, tools, MCP, code, browser, GitHub, database, sandbox, approvals, verification, retry, recovery, resume, and audit.

## AI Workforce

Agents are governed executable workers with identity, goals, skills, tools, model/context/memory policies, permissions, execution profiles, budgets, schedules, workspace, performance history, verification, and approvals. Teams are dynamically composed from project requirements.

## Execution abstraction

The core owns `ExecutionManager`; external environments implement provider contracts. E2B, Vercel Sandbox, Docker, local/self-hosted runners, and future providers are adapters. No single sandbox is the architecture.

## Verification

```text
Request → Plan → Execute → Test → Critique
       → Security / Performance / UX checks
       → Improve → Retest → Final quality gate
```

Verification states are `VERIFIED`, `PARTIALLY VERIFIED`, `UNVERIFIED`, and `BLOCKED`. A successful build is not sufficient evidence of high quality.

## Security

Privileged capabilities use explicit policy and risk classification:

```text
Capability request → Identity → Policy → Risk
→ ALLOW / ASK / DENY → Execute → Audit
```

Secrets remain behind secure server-side boundaries. Generated code is treated as untrusted until verified.

## Cost ownership

The architecture distinguishes INFINITY-11 platform cost, user BYOK AI cost, user compute/sandbox cost, free-tier resources, and optional managed-service cost. Remote compute is not assumed to be free or unlimited.

## Provider neutrality

Core domains use stable contracts. Provider-specific behavior belongs in adapters for AI, credentials, execution, databases, storage, browsers, deployments, Git, knowledge, notifications, and external integrations.

## Pre-implementation status

```text
Product thesis       FROZEN
Core architecture    FROZEN
Execution model      FROZEN
AI Workforce         FROZEN
Automation Fabric    FROZEN
Security model       FROZEN
Quality model        FROZEN
UX information arch. FROZEN
Provider abstractions FROZEN
Implementation code  NOT STARTED
Roadmap              NOT YET GENERATED
```

The next gate is an evidence-based repository/documentation audit against the canonical blueprint, followed by an acceptance-driven implementation dependency graph and roadmap. No application coding begins before that gate is closed.
