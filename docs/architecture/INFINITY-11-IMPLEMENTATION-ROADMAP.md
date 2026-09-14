# INFINITY-11 — Dependency-Driven Implementation Roadmap

> **Status:** Approved implementation sequence — 2026-09-14
> **Prerequisite:** Pre-coding architecture audit completed
> **Canonical architecture:** `docs/architecture/INFINITY-11-FINAL-PRE-IMPLEMENTATION-BLUEPRINT.md`
> **Strategy:** FREE-FIRST + OPEN-SOURCE-FIRST + BYOK-FIRST

## 1. Roadmap objective

This roadmap is derived from architectural dependency order rather than arbitrary feature phases.

The goal is to reach a usable, production-grade INFINITY-11 core while preserving the product's defining invariants:

- provider independence;
- BYOK and multi-credential routing;
- secure governed autonomy;
- remote execution;
- durable automation;
- Project Brain/context intelligence;
- evidence-based verification;
- serious application building;
- multiplatform capability;
- free-first economics.

A later stage must not bypass a foundational contract simply because its UI is attractive or its demo is easy to build.

## 2. Stage map

```text
STAGE 0  Architecture / audit gate
   ↓
STAGE 1  Repository + contracts + CI foundation
   ↓
STAGE 2  Identity + workspace + persistence + events
   ↓
STAGE 3  AI Gateway + provider adapters + credential vault
   ↓
STAGE 4  Model registry + routing + failover + usage
   ↓
STAGE 5  Execution Fabric + sandbox abstraction
   ↓
STAGE 6  Agent Runtime + AI Workforce
   ↓
STAGE 7  Automation Fabric + durable workflows
   ↓
STAGE 8  Project Brain + Context + Knowledge
   ↓
STAGE 9  Verification + browser/visual QA + quality loop
   ↓
STAGE 10 Core Web/PWA product UX
   ↓
STAGE 11 Heavy Application Builder
   ↓
STAGE 12 GitHub + deployment + operate loop
   ↓
STAGE 13 Multiplatform packaging
   ↓
STAGE 14 Ecosystem / marketplace / advanced automation
```

## 3. Stage 0 — Architecture and audit gate

**Status: COMPLETE**

Deliverables:

- canonical final blueprint;
- repository pre-coding audit;
- documentation hierarchy;
- dependency-driven roadmap;
- architecture invariants.

Acceptance:

- no unresolved product contradiction that changes the architecture;
- repository state agrees with documented pre-implementation status;
- implementation boundaries are explicit.

## 4. Stage 1 — Repository, contracts, and CI foundation

### Objective
Create the engineering skeleton without prematurely implementing product behavior.

### Work

- choose and document workspace/package management;
- establish application/package boundaries;
- establish shared type/contract package;
- define API/event/error conventions;
- establish configuration/environment strategy;
- establish formatting/lint/typecheck/test tooling;
- establish secret-scanning and dependency/security checks;
- establish CI pipeline;
- establish local development workflow;
- establish migration/versioning conventions.

### Acceptance

```text
install
→ lint
→ typecheck
→ unit-test
→ build
→ security checks
→ CI
```

A clean CI run is required before Stage 1 is closed.

## 5. Stage 2 — Identity, workspace, persistence, and events

### Objective
Establish durable product state and authorization boundaries.

### Work

- authentication;
- user/workspace/project model;
- authorization/RBAC or equivalent policy model;
- database schema/migrations;
- object storage abstraction;
- audit event schema;
- domain event model;
- correlation IDs;
- background job primitives;
- workspace/project isolation;
- database security policies.

### Acceptance

- authenticated user can create/select workspace and project;
- unauthorized cross-workspace access is rejected;
- durable events/audit records work;
- tests cover authorization boundaries;
- CI remains green.

## 6. Stage 3 — AI Gateway, provider adapters, and credential security

### Objective
Create one normalized inference boundary.

### Work

- provider contract;
- normalized request/response types;
- streaming;
- multimodal capability representation;
- provider adapters;
- credential encryption/storage;
- credential validation;
- credential lifecycle;
- secret redaction;
- normalized provider error taxonomy;
- usage event capture.

### Acceptance

- at least two materially different provider adapters can be integrated without changing UI/business-domain code;
- multiple credentials per provider are supported;
- secrets never appear in client bundles/logs;
- streaming and normalized errors are tested;
- provider-specific conditionals remain inside adapters.

## 7. Stage 4 — Model registry, router, failover, and cost signals

### Objective
Turn provider neutrality into intelligent routing.

### Work

- model registry;
- capability metadata;
- metadata provenance;
- model/credential eligibility;
- routing policies;
- scoring;
- provider health;
- credential health;
- quota state;
- cost/latency signals;
- bounded fallback chains;
- route decision records;
- usage/cost attribution.

### Acceptance

For a request requiring a specific capability:

```text
filter → score → select → execute → classify failure → bounded fallback
```

Routing must be deterministic under identical policy/input snapshots where practical, explainable through observable factors, and must not invent provider quota data.

## 8. Stage 5 — Execution Fabric and sandbox abstraction

### Objective
Make remote heavy execution a first-class capability.

### Work

- ExecutionManager;
- execution provider contract;
- local/Docker baseline where practical;
- first remote provider adapter;
- lifecycle management;
- environment preparation;
- command execution;
- file transfer;
- process management;
- logs;
- artifacts;
- resource limits;
- network policy;
- secret injection boundary;
- cleanup;
- ownership/cost metadata.

### Acceptance

- create environment;
- prepare project;
- run command;
- stream logs;
- collect artifact;
- terminate environment;
- recover from provider failure without corrupting durable state.

## 9. Stage 6 — Agent Runtime and AI Workforce

### Objective
Build governed executable agents and dynamic teams.

### Work

- agent definitions;
- agent run state machine;
- task graph;
- tool binding;
- skill binding;
- context policy;
- memory policy;
- model policy;
- permission policy;
- budget/iteration/timeout limits;
- approval waits;
- Team Lead/orchestrator;
- dynamic specialist selection;
- parallel workers;
- child-task limits;
- agent performance records.

### Acceptance

A representative engineering task can be delegated to multiple bounded workers, produce structured outputs, execute approved tools, and reach a verification stage without bypassing policy.

## 10. Stage 7 — Automation Fabric and durable workflow runtime

### Objective
Support n8n/Make-class workflow semantics plus AI-native execution.

### Work

- workflow definition/versioning;
- trigger engine;
- node contracts;
- deterministic execution;
- autonomous agent nodes;
- hybrid nodes;
- conditions/loops/parallel branches;
- waits/timers;
- approvals;
- retries/backoff;
- idempotency;
- checkpoints;
- resume;
- cancellation;
- bounded recovery;
- webhook/event triggers;
- audit and run history.

### Acceptance

At least one representative workflow demonstrates:

```text
trigger
→ deterministic steps
→ agent decision
→ tool action
→ approval
→ verification
→ retry/recovery when eligible
→ durable completion
```

A duplicate side effect must be prevented or explicitly guarded.

## 11. Stage 8 — Project Brain, Context Engine, and Knowledge

### Objective
Give every project durable engineering intelligence.

### Work

- Project Brain schema;
- repository ingestion;
- language/framework detection;
- dependency graph;
- symbol/index representation;
- knowledge sources;
- memory types;
- retrieval/ranking;
- context compression;
- token/capability budgeting;
- context provenance;
- context inspector;
- successful/failed approach memory;
- codebase risk/test maps.

### Acceptance

A large project can retrieve relevant requirements, symbols, decisions, files, tests, and historical context without dumping the entire repository into a prompt. Included context must be explainable at source/category level.

## 12. Stage 9 — Verification, evaluation, and browser/visual QA

### Objective
Turn “generated” into evidence-backed completion.

### Work

- verification record schema;
- test orchestration;
- static analysis;
- security checks;
- performance checks;
- accessibility checks;
- browser automation;
- DOM/console/network inspection;
- screenshot/visual evaluation;
- quality dimensions;
- critique engine;
- improvement loop;
- regression comparison;
- verification state machine.

### Acceptance

The system can detect a meaningful defect, route it back for improvement, rerun relevant checks, and record evidence showing whether the final state is verified, partially verified, unverified, or blocked.

## 13. Stage 10 — Core Web/PWA product experience

### Objective
Expose the underlying system through the premium INFINITY-11 interface.

### Work

- global shell;
- responsive navigation;
- Command Center;
- Chat;
- Projects;
- model/route controls;
- API key management;
- activity/run views;
- approvals;
- notifications;
- artifacts/library/history;
- usage/cost;
- security controls;
- context inspector;
- accessibility;
- PWA behavior.

### Acceptance

UI actions use backend contracts rather than duplicating orchestration rules. Long-running runs remain observable after navigation/reload. Mobile and desktop remain usable.

## 14. Stage 11 — Heavy Application Builder

### Objective
Build serious applications rather than prompt-to-demo pages.

### Work

- project specification intake;
- requirements extraction;
- architecture planning;
- dynamic engineering workforce;
- scaffold generation;
- frontend/backend/database/auth generation;
- dependency management;
- remote build/run/test;
- preview;
- browser QA;
- security verification;
- iterative repair;
- artifact management;
- repository/worktree integration.

### Acceptance

Build a representative multi-service application from a specification through:

```text
requirements
→ architecture
→ code
→ dependencies
→ build
→ tests
→ runtime
→ browser QA
→ security
→ improvement
→ verified preview
```

## 15. Stage 12 — GitHub, deployment, and OPERATE loop

### Objective
Complete the idea → build → deploy → observe → repair lifecycle.

### Work

- GitHub repositories/issues/branches/PRs;
- reviewable worktrees/diffs;
- CI status;
- deployment-provider abstraction;
- preview deployments;
- production approval gates;
- deployment logs/status;
- rollback/redeploy;
- monitoring events;
- failure-triggered automation;
- operational repair workflows.

### Acceptance

A verified project can be pushed through a reviewable Git lifecycle into a deployment target, observed, and repaired using bounded policy-controlled automation.

## 16. Stage 13 — Multiplatform packaging

### Objective
Expand from web-first delivery to coordinated mobile, desktop, and service targets.

### Work

- target capability registry;
- shared contracts;
- mobile build pipelines;
- desktop packaging;
- native/cross-platform toolchains;
- signing boundary;
- artifact lifecycle;
- target-specific verification.

### Acceptance

A shared product specification can produce at least one additional non-web target with target-specific build and verification evidence without breaking shared backend/contracts.

## 17. Stage 14 — Ecosystem and advanced automation

### Objective
Make INFINITY-11 extensible beyond the core runtime.

### Work

- skill/agent/team/workflow packages;
- extension registry;
- marketplace metadata;
- publisher/provenance model;
- security/evaluation status;
- import/export;
- MCP catalog;
- reusable workflow templates;
- advanced scheduled agents;
- controlled continuous improvement;
- optional managed infrastructure adapters.

### Acceptance

An external asset can be inspected, permissioned, evaluated, versioned, installed, executed in scope, observed, and revoked without bypassing core governance.

## 18. Cross-stage quality gates

Every implementation stage must pass the strongest applicable checks:

```text
inspect
→ implement
→ lint/typecheck
→ unit tests
→ integration tests
→ build
→ E2E/runtime checks
→ security checks
→ regression
→ documentation
→ CI
```

Additional checks apply to the relevant domain:

```text
Agents/workflows → permissions + retries + recovery + idempotency + audit
Apps             → browser + visual + accessibility + performance
Providers        → capability + error + failover + secret safety
Execution        → isolation + resource limits + cleanup + artifacts
Deployments      → revision identity + rollback + environment policy
```

## 19. Critical dependency rules

1. Do not build the visual workflow editor before workflow contracts and durable runtime semantics exist.
2. Do not build autonomous agent UX before permissions, budgets, and run-state semantics exist.
3. Do not expose API-key management before secure credential storage exists.
4. Do not claim multi-provider routing before normalized provider contracts exist.
5. Do not build heavy application generation before execution and verification foundations exist.
6. Do not enable autonomous deployment before approval and audit boundaries exist.
7. Do not claim production readiness before evidence-backed verification exists.
8. Do not make E2B, Vercel, Supabase, or another vendor a core-domain dependency.
9. Do not add marketplace execution before supply-chain inspection exists.
10. Do not add uncontrolled self-healing; recovery must be bounded and side-effect-aware.

## 20. MVP definition

The first meaningful MVP is **not** the entire vision.

It is the smallest slice that proves the architecture:

```text
Identity / Workspace
        ↓
Project
        ↓
BYOK credential
        ↓
AI Gateway
        ↓
Model routing
        ↓
Agent
        ↓
Sandbox execution
        ↓
Tests / Verification
        ↓
Artifact / Preview
        ↓
Observable run history
```

A second MVP slice should prove:

```text
Trigger
→ Workflow
→ Agent
→ Tool
→ Approval
→ Verify
→ Durable resume/recovery
```

Only after those vertical slices are stable should the large application builder and full visual automation surface be expanded.

## 21. Completion policy

A stage is complete only when its acceptance criteria are satisfied, implementation evidence exists, relevant tests pass, security checks pass, documentation reflects reality, and the repository/CI state is verified.

A stage may be marked **PARTIALLY COMPLETE** when a bounded subset is delivered, but it must not be represented as fully complete.

## 22. Current roadmap status

```text
STAGE 0  Architecture / audit gate             COMPLETE
STAGE 1  Repository + contracts + CI            COMPLETE
STAGE 2  Identity + workspace + persistence    COMPLETE
STAGE 3  AI Gateway + providers + credentials   COMPLETE
STAGE 4  Router + failover + usage              COMPLETE
STAGE 5  Execution Fabric                       COMPLETE
STAGE 6  Agent Runtime + Workforce              COMPLETE
STAGE 7  Automation Fabric                      COMPLETE
STAGE 8  Project Brain + Context                NEXT
STAGE 9  Verification + Browser QA              TODO
STAGE 10 Core Web/PWA UX                         TODO
STAGE 11 Heavy Application Builder               TODO
STAGE 12 GitHub + Deployment + OPERATE           TODO
STAGE 13 Multiplatform                           TODO
STAGE 14 Ecosystem / Marketplace                TODO
```

Stage 7 is closed on the `stage-7-automation-fabric` implementation branch after final CI verification. The branch is ready for merge into `main`; post-merge `main` verification is still required before Stage 7 can be considered repository-closed.
