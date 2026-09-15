# INFINITY-11 Architecture Documentation

## Current baseline

**Phases 1–10 are complete, merged into `main`, and verified by CI. Phase 11 — Advanced Application Builder Foundation — is next.**

## Canonical documents

1. `INFINITY-11-FINAL-PRE-IMPLEMENTATION-BLUEPRINT.md` — canonical architecture baseline.
2. `INFINITY-11-V1-ROADMAP.md` — complete 110-phase V1 roadmap and detailed acceptance framework.
3. `INFINITY-11-IMPLEMENTATION-ROADMAP.md` — dependency-oriented implementation sequence.
4. `INFINITY-11-PRE-CODING-AUDIT.md` — original architecture gate and assumptions.
5. `INFINITY-11-MIGRATION-AND-VERSIONING.md` — migration and versioning policy.
6. `../description/INFINITY-11-DETAILED-DESCRIPTION.md` — complete product and web experience specification.
7. `../description/INFINITY-11-ARCHITECTURE-AND-SCREENS.md` — active architecture and screen contract.

## Architecture planes

```text
EXPERIENCE
    ↓
CONTROL
    ↓
INTELLIGENCE
    ↓
EXECUTION
    ↓
ADAPTERS
    ↓
DATA
```

### Experience

Web/PWA, chat, code, build, design, research, media, agents, projects, Command Center, previews, approvals, artifacts, usage, settings, and future mobile/desktop surfaces.

### Control

Identity, workspace, authorization, security policy, approvals, cost limits, audit, observability, feature configuration, and governance.

### Intelligence

AI Gateway, model registry, routing, credential intelligence, context engine, Project Brain, memory, knowledge, research, evaluation, quality, and performance history.

### Execution

Agents, teams, tasks, tools, MCP, browser, terminal, worktrees, sandboxes, workflows, background jobs, builds, tests, and verification.

### Adapters

AI providers, local models, GitHub, databases, storage, sandbox providers, deployment providers, browser providers, and external integrations.

### Data

Durable domain state, events, execution state, usage, audit, artifacts, knowledge indexes, project intelligence, and migrations.

## Core invariants

- Provider independence is architectural, not a UI option.
- BYOK is first-class and multiple credentials may coexist for one provider.
- Routing considers capability, policy, health, quota signals, cost, latency, and historical performance where available.
- E2B is an optional execution/sandbox adapter.
- Supabase is an optional/default development database adapter.
- Vercel is an optional deployment adapter.
- Local and self-hosted execution remain supported where feasible.
- High-impact actions require policy and, where configured, human approval.
- Untrusted code is executed through controlled boundaries.
- The browser must not duplicate backend orchestration or security policy.
- Long-running work must be observable and durable when required.
- Verification is evidence, not a model assertion.
- CREATE, ENGINEER, AUTOMATE, and OPERATE remain the four product pillars.

## Product lifecycle

```text
Idea
→ Requirements
→ Research
→ Architecture
→ Plan
→ Workforce / Workflow
→ Model / Credential Routing
→ Execution
→ Test
→ Critique
→ Improve
→ Verify
→ Deliver
→ Observe
→ Recover / Maintain
→ Project Brain
```

## Documentation hierarchy

```text
Product & Web Specification
        ↓
Architecture & Screen Specification
        ↓
Canonical Architecture Blueprint
        ↓
V1 Roadmap — Phases 1–110
        ↓
Repository Implementation
        ↓
Tests + Runtime Evidence + CI
```

Product and architecture documents define the intended system and contracts. Repository implementation and verification evidence determine what is actually complete.

## Status discipline

Do not infer implementation completion from documentation alone. A phase closes only after the accepted implementation boundary is verified, regression-tested, documented, and supported by final CI evidence.
