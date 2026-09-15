# Phase 16 — Application Testing Engine

**Status:** COMPLETE
**Implementation branch:** `phase-16-application-testing-engine`
**Documentation branch:** `phase-16-documentation-closure`
**Baseline:** Phase 15 closed on `main` at `c65f9d808f5c750156889557cfa43e1e3950afbb` with final main CI #462 passed.
**Implementation PR:** #22 — merged into `main` as `f61b2d88c4746569c09bf0ad729e410285709107`.
**Implementation branch CI:** final verification passed all required gates.

## Objective

Provide a provider-independent, deterministic testing boundary that converts a structured application test suite into a policy-controlled test plan and executes it through a replaceable runner adapter.

## Delivered scope

- Structured unit, integration, E2E, security, and regression test cases.
- Safe executable-token and project-relative working-directory validation.
- `.git` and traversal protection for test working directories.
- Bounded timeouts and retries.
- Deterministic suite and plan checksums independent of declaration order.
- ALLOW / ASK / DENY policy evaluation before execution.
- Explicit approval for ASK plans.
- Suite/revision/definition binding so stale or altered suites cannot execute against an old plan.
- Replaceable runner adapter; the core engine does not execute shell commands itself.
- Exit-code, stdout, stderr, and timeout evaluation.
- Bounded retry behavior and preserved per-test diagnostics.
- Aggregate verification result and human-readable summary.

## Security invariants

- Shell metacharacters are rejected from the command token.
- Working directories cannot escape the project or enter `.git`.
- Privileged test execution is policy controlled.
- ASK plans never execute without explicit approval.
- A changed suite cannot execute against a previously generated plan.
- Test success is determined from explicit runner results and assertions, never from an AI claim.
- Provider/model choice remains outside the testing engine.

## Audit findings and fixes

1. Initial formatter verification exposed source formatting drift; a temporary CI formatter audit was used to obtain the repository's exact Prettier output, then the audit workflow/step was removed before completion.
2. The source was aligned to the repository formatter without changing repository-wide compiler settings.
3. Security validation was checked for command injection, traversal, `.git` access, unbounded retries, and excessive timeouts.
4. Regression tests cover deterministic planning, policy denial, approval, suite tampering, assertions, retries, and timeout diagnostics.

## Verification evidence

The final implementation branch CI passed:

- Format check
- Lint
- Typecheck
- Unit and contract tests
- Build
- Dependency security audit
- Secret scanning / Gitleaks

Implementation PR #22 was then merged into `main`.

## Acceptance boundary

Phase 16 satisfies its acceptance boundary when it can:

1. validate a structured application test suite;
2. reject unsafe command/cwd configuration before execution;
3. produce deterministic policy-evaluated test plans;
4. require approval for privileged ASK plans;
5. reject stale or altered suites/plans;
6. execute supported tests through a runner adapter;
7. evaluate explicit pass/fail/timeout evidence and bounded retries;
8. preserve diagnostics and aggregate verification results;
9. provide automated regression protection for these guarantees.

## Final completion gate

Phase 16 is not considered closed until this documentation closure is merged and the exact synchronized `main` head passes the required post-merge CI verification. That final main CI run is the authoritative closure evidence.
