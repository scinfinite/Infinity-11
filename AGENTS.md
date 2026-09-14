# AGENTS.md — INFINITY-11 Engineering Instructions

## Purpose

This file defines repository-wide expectations for AI coding agents and human contributors working on INFINITY-11.

INFINITY-11 is intended to become a production-grade, **FREE-FIRST, BYOK-first, multimodal AI engineering, creation, and automation platform** capable of building serious web, mobile, desktop, and backend applications, running governed AI workforces, and operating event-driven automations.

Contributors must preserve the architectural boundaries described in `docs/`.

## Current repository state

The repository is currently in the **pre-implementation product-definition and architecture stage**. Product requirements and architecture are being refined before coding starts. Do not assume that application code exists merely because a subsystem is described in the specifications.

For the current stage, documentation and architecture changes are allowed; implementation code should not be introduced unless implementation has been explicitly started.

## Mandatory engineering behavior

1. Inspect the relevant repository files before proposing changes.
2. Establish evidence before diagnosing a bug.
3. Reproduce failures when reproduction is possible.
4. Trace errors to their root cause rather than treating symptoms.
5. Inspect related modules before changing shared abstractions.
6. Prefer the smallest maintainable change that addresses the root cause.
7. Run the most relevant tests, type checks, builds, and regression checks after implementation changes begin.
8. Do not claim a fix is verified unless it was actually verified.
9. If verification is unavailable, state exactly what could not be verified.
10. Do not silently skip failing checks.
11. Fix discovered regressions before moving to unrelated work when practical.
12. Keep documentation synchronized with architecture and product changes.
13. Do not begin application implementation while the project is explicitly in the design-only stage.

## Product and economic rules

- The initial INFINITY-11 web product must not require a paid INFINITY-11 subscription.
- Prefer free-tier, open-source, local, self-hosted, and BYOK options where technically viable.
- Never design the core architecture around the assumption that third-party compute is unlimited or free.
- Keep platform costs, user AI/API costs, user compute costs, and optional future managed-service costs explicitly separated.
- Paid services may be supported as optional providers, but basic architectural capabilities must not depend on a single paid vendor.

## Best-Possible-Output rule

The product goal is not merely to produce a decent or plausible result.

> **INFINITY-11 must pursue the best practically achievable verified output within the user's requirements, resources, policies, cost, and execution constraints.**

For meaningful work, agents should use the strongest practical loop:

```text
Understand
→ research where needed
→ plan
→ execute
→ test
→ critique
→ improve
→ retest
→ verify
```

Completion state must distinguish:

```text
VERIFIED
PARTIALLY VERIFIED
UNVERIFIED
BLOCKED
```

Do not treat “the model generated it” or “the build passed” as sufficient proof of overall quality.

## Remote execution rules

INFINITY-11 is **remote-execution-first for heavy workloads**.

The user's phone/laptop is primarily the control, interaction, editing, streaming, and visualization surface. When remote execution is available, heavy work should run outside the user's device, including:

- dependency installation
- compilation/builds
- test suites
- application runtime services
- browser automation
- visual QA
- code indexing jobs
- large repository analysis
- packaging where remote tooling is appropriate

Execution must go through a provider abstraction rather than coupling the product to one sandbox vendor.

## Heavy application and multiplatform rules

INFINITY-11 must be designed for real applications rather than demo-only generation. Architecture should support, where technically appropriate:

- web applications
- mobile applications
- desktop applications
- backend services and APIs
- databases and storage
- multi-service systems
- shared contracts and reusable packages
- Java and other supported backend/programming languages

A single product specification may produce multiple application targets. Framework selection must remain capability-driven and provider-neutral rather than hard-coded into the platform.

## Automation rules

Automation is a first-class subsystem, not an integration afterthought.

The platform must support:

- visual workflow construction;
- natural-language workflow generation;
- triggers;
- actions;
- conditions;
- loops;
- parallel branches;
- schedules;
- webhooks;
- events;
- approvals;
- agents and sub-agents;
- tools and MCP;
- browser/GitHub/database/sandbox actions;
- retries;
- bounded recovery;
- durable state;
- resume;
- auditability.

Workflows may be deterministic, autonomous, or hybrid. Hybrid execution is the preferred target for serious production automation because deterministic boundaries can contain agent judgment.

Never allow “self-healing” to become an excuse for unlimited retries or uncontrolled destructive actions.

## AI workforce rules

Agents are governed software workers, not merely personas.

Each agent should have explicit:

- identity
- role
- goal
- capabilities
- skills
- tools
- model policy
- context policy
- memory policy
- permission policy
- execution profile
- verification policy
- iteration limit
- execution timeout
- budget limit
- network policy
- approval policy

Teams may use a Team Lead/orchestrator and specialist members. Teams should be dynamically composed around the actual task rather than hard-coded to one universal roster.

Autonomous execution must remain observable, interruptible, policy-controlled, and auditable.

## Architecture rules

- Keep provider-specific behavior inside provider adapters.
- Keep AI orchestration behind the AI Gateway and routing abstractions.
- Treat models as capability metadata rather than hard-coded UI assumptions.
- Treat API credentials as secrets; never log or expose raw credentials.
- Enforce workspace/project authorization server-side and with database security controls.
- Default agent and tool permissions to deny unless explicitly granted.
- Treat shell, network, repository write, deployment, and secret access as privileged capabilities.
- Use isolated execution environments for untrusted or autonomous code execution where appropriate.
- Make long-running work observable, cancellable, retryable, resumable, and stateful.
- Use normalized error categories for provider failures and routing decisions.
- Preserve idempotency for operations that can create external side effects.
- Prefer Git branches and reviewable diffs for autonomous repository changes.
- Never assume a generated artifact is correct until relevant verification succeeds.
- Keep sandbox, database, and deployment integrations behind provider interfaces.
- Keep workflow state separate from transient UI state.
- Do not hide automation side effects behind generic “AI action” abstractions.

## AI provider rules

INFINITY-11 must remain provider-agnostic.

A new provider should normally be integrated through a provider adapter implementing the shared provider contract. Do not spread provider-specific conditionals across unrelated application modules.

The routing layer must distinguish at least authentication failures, authorization failures, rate limits, quota exhaustion, credit exhaustion, unavailable models, invalid requests, context-limit failures, content restrictions, timeouts, network failures, server failures, and unknown failures where the provider supplies enough information.

Do not invent exact provider quotas, prices, model capabilities, or availability. Clearly distinguish provider-reported values, INFINITY-11 observed values, estimates, and unknown values.

## BYOK rules

- Never put raw API keys in source control.
- Never put raw API keys in logs, URLs, analytics events, client bundles, or ordinary browser storage.
- Encrypt credentials at rest using an appropriate secrets architecture.
- Mask credentials in the UI.
- Record health and usage metadata without storing unnecessary secret material.
- Rotate or disable unhealthy credentials through explicit lifecycle operations.
- Do not automatically export raw credentials in project backups.

## Execution-provider rules

Execution must use an abstraction such as `SandboxProvider`/`ExecutionProvider` so that E2B, Vercel Sandbox, Docker, local/self-hosted runners, and future providers can be added or replaced without redesigning the product.

Each execution environment should define lifecycle state, resource limits, timeout, cleanup, logs, artifact handling, secret injection, network policy, and ownership/cost attribution.

Never imply that an external free tier provides unlimited compute.

## Workflow/runtime rules

Workflow execution should be durable and observable.

Every meaningful run should expose, where applicable:

```text
run ID
workflow version
trigger
state
current step
agent/model/tool decisions
permissions
retries
approvals
outputs
errors
verification
cost/usage
final outcome
```

Recovery must be bounded and side-effect aware. Operations that can create duplicate external effects must be idempotent or guarded by explicit state/approval.

## GitHub rules

Git operations performed by agents should be reviewable. Prefer a branch, diff, tests, and explicit commit/PR boundaries over silent modifications to protected production branches.

Do not automatically merge or deploy production changes unless the user's configured policy explicitly permits that operation.

## MCP and integration rules

MCP servers and external integrations are privileged boundaries.

Before execution, evaluate:

- server identity/configuration
- requested tool
- input schema
- permissions
- project scope
- secret access
- network access
- approval requirements

Do not grant every connected MCP tool access to every project secret by default.

Imported workflows, agents, skills, MCP servers, and marketplace assets are untrusted until their dependencies and requested permissions are inspected.

## Verification standard

For code changes, use the strongest practical verification sequence:

```text
inspect
→ reproduce
→ diagnose
→ plan
→ implement
→ lint/typecheck
→ unit tests
→ integration tests
→ build
→ E2E/runtime verification where relevant
→ security verification
→ regression check
→ inspect final output
```

For generated applications, verification should be target-aware and may include:

```text
build
→ start
→ API/service checks
→ browser/DOM checks
→ visual QA
→ accessibility
→ performance checks
→ platform packaging checks
→ security checks
→ regression checks
```

For automations, verification should additionally cover:

```text
trigger behavior
→ state transitions
→ permissions
→ retries
→ recovery
→ idempotency
→ approval gates
→ final side effects
```

Adjust the sequence to the actual change, but never replace verification with confidence language.

## Documentation rules

Architecture decisions should be reflected in `docs/architecture/`.
Product behavior should be reflected in `docs/description/`.
The latest cross-cutting research amendments belong in `docs/description/INFINITY-11-LATEST-RESEARCH-AMENDMENTS.md`.
Future implementation-phase documentation belongs under `docs/phases/`.

The documentation set should remain internally consistent about:

- $0 subscription target
- BYOK economics
- remote execution
- heavy-application capability
- multiplatform application generation
- automation
- AI workforce
- provider abstractions
- security and verification
- best-possible-output quality
- implementation status

## Scope discipline

Do not introduce unrelated dependencies, provider lock-in, unnecessary infrastructure, or speculative abstractions. Every new abstraction should have a clear boundary and a reason to exist.

## Quality bar

The goal is not merely to make INFINITY-11 work. The goal is to make it maintainable, secure, testable, observable, extensible, understandable, free-first, provider-independent, capable of building serious multiplatform software, capable of orchestrating useful automation, and capable of continuously improving results until the strongest practical verified outcome is reached.
