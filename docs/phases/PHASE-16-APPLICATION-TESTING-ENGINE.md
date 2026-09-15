# Phase 16 — Application Testing Engine

**Status:** IN PROGRESS
**Implementation branch:** `phase-16-application-testing-engine`
**Baseline:** Phase 15 is closed on `main` at `c65f9d808f5c750156889557cfa43e1e3950afbb` with final main CI #462 passed.

## Objective

Provide a provider-independent, deterministic testing boundary that converts a structured application test suite into a policy-controlled test plan and executes it through a replaceable runner adapter.

## Acceptance boundary

A valid Phase 16 implementation must be able to:

1. validate structured test suites and reject unsafe command/cwd input;
2. bound timeouts and retries;
3. produce deterministic suite and plan checksums independent of declaration order;
4. evaluate ALLOW / ASK / DENY before execution;
5. require explicit approval for ASK plans;
6. bind execution to the exact suite revision/definition used for planning;
7. execute tests sequentially through an adapter without embedding shell execution in the core;
8. evaluate exit-code, stdout, stderr, and timeout outcomes;
9. retry only within an explicit bounded policy;
10. preserve per-test diagnostics and an aggregate verification result;
11. protect earlier phases through automated regression tests.

## Security invariants

- Shell metacharacters are not accepted in the command token; execution remains the responsibility of the runner adapter.
- Project-relative working directories cannot traverse outside the project or enter `.git`.
- Privileged test execution is governed by ALLOW / ASK / DENY.
- ASK plans never execute without explicit approval.
- Test results never become success merely because a runner returned; assertions and timeout state are evaluated explicitly.
- The engine does not expose provider-specific orchestration or secrets handling.
- A changed suite cannot execute against an old plan.

## Verification gate

Phase 16 is complete only after implementation audit, branch CI, documentation synchronization, merge, and exact synchronized `main` CI all pass.

Required verification includes format, lint, typecheck, unit/contract tests, build, dependency security, secret scanning, and applicable runtime/regression checks.
