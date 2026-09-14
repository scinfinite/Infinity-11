# AGENTS.md — INFINITY-11 Engineering Instructions

## Purpose

This file defines repository-wide expectations for AI coding agents and human contributors working on INFINITY-11.

INFINITY-11 is intended to become a production-grade, BYOK-first, multimodal AI orchestration and development platform. Contributors must preserve the architectural boundaries described in `docs/`.

## Current repository state

The repository initialization currently establishes product documentation and structure. Do not assume that application code exists merely because a subsystem is described in the specifications.

## Mandatory engineering behavior

1. Inspect the relevant repository files before proposing changes.
2. Establish evidence before diagnosing a bug.
3. Reproduce failures when reproduction is possible.
4. Trace errors to their root cause rather than treating symptoms.
5. Inspect related modules before changing shared abstractions.
6. Prefer the smallest maintainable change that addresses the root cause.
7. Run the most relevant tests, type checks, builds, and regression checks after changes.
8. Do not claim a fix is verified unless it was actually verified.
9. If verification is unavailable, state exactly what could not be verified.
10. Do not silently skip failing checks.
11. Fix discovered regressions before moving to unrelated work when practical.
12. Keep documentation synchronized with architecture changes.

## Architecture rules

- Keep provider-specific behavior inside provider adapters.
- Keep AI orchestration behind the AI Gateway and routing abstractions.
- Treat models as capability metadata rather than hard-coded UI assumptions.
- Treat API credentials as secrets; never log or expose raw credentials.
- Enforce workspace/project authorization server-side and with database security controls.
- Default agent and tool permissions to deny unless explicitly granted.
- Treat shell, network, repository write, deployment, and secret access as privileged capabilities.
- Use isolated E2B environments for untrusted or autonomous code execution where appropriate.
- Make long-running work observable, cancellable, retryable, and stateful.
- Use normalized error categories for provider failures and routing decisions.
- Preserve idempotency for operations that can create external side effects.
- Prefer Git branches and reviewable diffs for autonomous repository changes.
- Never assume a generated artifact is correct until relevant verification succeeds.

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

## Agent rules

Agents must have explicit:

- model policy
- tool policy
- permission policy
- iteration limit
- execution timeout
- budget limit
- network policy
- approval policy

Autonomous execution must remain observable and interruptible. Destructive operations require appropriate approval or an explicit policy that permits them.

## E2B rules

E2B is an isolated execution environment for coding/building workflows. Do not assume sandbox execution is equivalent to trusted host execution.

Sandbox tasks should have lifecycle state, resource limits, timeouts, cleanup, logs, and explicit environment/secret injection.

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
→ regression check
→ inspect final output
```

Adjust the sequence to the actual change, but never replace verification with confidence language.

## Documentation rules

Architecture decisions should be reflected in `docs/architecture/`.
Product behavior should be reflected in `docs/description/`.
Future implementation-phase documentation belongs under `docs/phases/`.

Do not create an implementation roadmap merely because a future capability is mentioned in the product description.

## Scope discipline

Do not introduce unrelated dependencies, provider lock-in, unnecessary infrastructure, or speculative abstractions. Every new abstraction should have a clear boundary and a reason to exist.

## Quality bar

The goal is not merely to make INFINITY-11 work. The goal is to make it maintainable, secure, testable, observable, extensible, and understandable as the system grows.
