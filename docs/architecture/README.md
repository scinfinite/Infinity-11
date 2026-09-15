# INFINITY-11 Architecture Documentation

## Current baseline

Phases 1–10 are complete and verified on `main`. The next implementation boundary is Phase 11 — Advanced Application Builder Foundation.

## Canonical documents

1. `INFINITY-11-FINAL-PRE-IMPLEMENTATION-BLUEPRINT.md` — canonical architecture baseline.
2. `INFINITY-11-IMPLEMENTATION-ROADMAP.md` — dependency-oriented implementation sequence.
3. `../INFINITY-11-V1-ROADMAP.md` — complete 110-phase V1 roadmap and detailed acceptance framework.
4. `INFINITY-11-PRE-CODING-AUDIT.md` — original architecture gate and assumptions.
5. `INFINITY-11-MIGRATION-AND-VERSIONING.md` — migration and versioning policy.

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

Agents, teams, tasks, tools, MCP, browser, terminal, worktrees, sandboxes, workflows, background jobs, and verification.

### Adapters

AI providers, local models, GitHub, databases, storage, sandbox providers, deployment providers, and external integrations.

### Data

Durable domain state, events, execution state, usage, audit, artifacts, knowledge indexes, and migrations.

## Core invariants

- Provider independence is architectural, not a UI option.
- Multiple BYOK credentials may coexist for one provider.
- Model routing considers capability, policy, health, quota signals, cost, latency, and historical performance where available.
- E2B is an optional sandbox adapter.
- Supabase is an optional/default development database adapter.
- Vercel is an optional deployment adapter.
- Local and self-hosted execution remain supported where feasible.
- High-impact actions require policy and, where configured, human approval.
- Untrusted code is executed through controlled boundaries.
- The browser must not duplicate backend orchestration or security policy.
- Long-running work must be observable and durable when required.
- Verification is evidence, not a model assertion.

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
→ Tests
→ Security
→ Browser / Visual QA
→ Critique
→ Improvement
→ Verification
→ GitHub
→ Deployment
→ Observation
→ Recovery / Maintenance
→ Project Brain
```

## Quality model

Quality dimensions:

- correctness;
- completeness;
- architecture;
- maintainability;
- security;
- performance;
- UX;
- accessibility;
- compatibility;
- verification;
- cost efficiency.

Quality states:

- VERIFIED;
- PARTIALLY VERIFIED;
- UNVERIFIED;
- BLOCKED.

## Security model

```text
Capability request
→ policy
→ risk classification
→ ALLOW / ASK / DENY
→ execution
→ audit
```

Capabilities include filesystem, shell, network, GitHub, database, deployment, secrets, browser, and MCP operations.

## Extension model

The system uses adapters and portable packages for providers, agents, skills, tools, MCP servers, workflows, databases, sandboxes, deployments, and future integrations. Compatibility metadata, permissions, dependencies, security status, and versioning are first-class.

## Engineering policy

Every phase follows the same evidence-first process:

```text
inspect → reproduce/verify → diagnose root cause → implement
→ format → lint → typecheck → unit → integration → build
→ E2E/runtime → security → regression → UX/accessibility
→ documentation → final main CI → close
```

The architecture may evolve when evidence requires it, but changes must be explicit, tested, documented, and compatible with the product's core idea.
