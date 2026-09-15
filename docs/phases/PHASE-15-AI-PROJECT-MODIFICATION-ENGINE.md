# Phase 15 — AI Project Modification Engine

**Status:** IN PROGRESS
**Branch:** `phase-15-ai-project-modification-engine`
**Baseline:** Phase 14 is closed on `main` at `908bf5938b43769610e009dfba2d51f0b0fed1fa` with final main CI #450 passed.

## Objective

Provide a provider-independent, deterministic modification boundary that converts an AI-generated project change request into a validated, policy-controlled plan and safely applies that plan against a project store.

## Delivered scope

- create, update, delete, and rename operations;
- strict project/request/path validation with traversal and `.git` protection;
- optimistic project-revision and per-file expected-hash checks;
- deterministic modification plans and checksums;
- ALLOW / ASK / DENY policy evaluation before side effects;
- explicit approval for `ASK` plans;
- plan/request identity and revision binding to prevent stale-plan application;
- project-store adapter boundary so storage/execution remains replaceable;
- preflight checks for missing files, existing files, rename collisions, and operation conflicts;
- best-effort rollback of completed filesystem changes when an adapter operation fails;
- human-readable modification summaries;
- regression tests for security, concurrency, policy, planning, application, and failure behavior.

## Security invariants

- No AI provider or hosted code-generation vendor is required by the core package.
- Paths are relative, normalized, printable, and cannot traverse or target `.git`.
- Expected file hashes are checked before a change is planned.
- Project revision is checked both during planning and immediately before application.
- `DENY` is fail-closed and produces no modification plan.
- `ASK` cannot execute without an explicit approval callback.
- A plan cannot be applied to a different request, project, or base revision.
- Storage and execution are adapter responsibilities; the core does not execute shell commands or arbitrary code.
- Completion is never inferred from an AI claim; the caller receives an explicit apply result or error.

## Verification gate

Phase 15 is complete only after implementation audit, branch CI, documentation synchronization, merge, and exact synchronized `main` CI all pass.

Required verification includes format, lint, typecheck, unit/contract tests, build, dependency security, secret scanning, and regression coverage. Runtime/E2E checks are added where the repository exposes a real project-store runtime boundary.

## Acceptance boundary

A valid Phase 15 implementation must be able to:

1. validate a structured project modification request;
2. reject unsafe or conflicting operations before side effects;
3. produce a deterministic, policy-evaluated modification plan;
4. require approval for privileged `ASK` decisions;
5. reject stale projects/plans rather than overwriting concurrent work;
6. apply supported file operations through the storage adapter;
7. preserve diagnostics on adapter failure;
8. provide automated regression protection for these guarantees.
