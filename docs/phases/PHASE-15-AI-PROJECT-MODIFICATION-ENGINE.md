# Phase 15 — AI Project Modification Engine

**Status:** COMPLETE
**Implementation branch:** `phase-15-ai-project-modification-engine`
**Documentation branch:** `phase-15-documentation-closure`
**Baseline:** Phase 14 is closed on `main` at `908bf5938b43769610e009dfba2d51f0b0fed1fa` with final main CI #450 passed.
**Implementation PR:** #20 — merged into `main` as `6ffde460767fb7f421154643e5bc5f2d99113aa3`.
**Implementation branch CI:** #459 passed all required gates.

## Objective

Provide a provider-independent, deterministic modification boundary that converts an AI-generated project change request into a validated, policy-controlled plan and safely applies that plan against a project store.

## Delivered scope

- create, update, delete, and rename operations;
- strict project/request/path validation with traversal and `.git` protection;
- optimistic project-revision and per-file expected-hash checks;
- deterministic modification plans and checksums independent of operation declaration order;
- request-to-plan checksum binding so a plan cannot be applied to altered request operations;
- ALLOW / ASK / DENY policy evaluation before side effects;
- explicit approval for `ASK` plans;
- plan/request identity and revision binding to prevent stale-plan application;
- project-store adapter boundary so storage/execution remains replaceable;
- preflight checks for missing files, existing files, rename collisions, and operation conflicts;
- awaited best-effort rollback of completed changes when an adapter operation fails;
- human-readable modification summaries;
- regression tests for security, concurrency, policy, deterministic planning, application, stale plans, request tampering, and failure behavior.

## Security invariants

- No AI provider or hosted code-generation vendor is required by the core package.
- Paths are relative, normalized, printable, and cannot traverse or target `.git`.
- Expected file hashes are checked before a change is planned.
- Project revision is checked both during planning and immediately before application.
- `DENY` is fail-closed and produces no modification plan.
- `ASK` cannot execute without an explicit approval callback.
- A plan cannot be applied to a different request, project, or base revision.
- A plan cannot be applied after its request operations are changed.
- Storage and execution are adapter responsibilities; the core does not execute shell commands or arbitrary code.
- Completion is never inferred from an AI claim; the caller receives an explicit apply result or error.

## Audit findings and fixes

1. Initial format verification exposed non-Prettier formatting; formatter output was inspected through CI and the source was corrected. The temporary audit step was removed before the final branch verification.
2. Lint identified an unused adapter revision parameter in the test store; the fixture was corrected without weakening lint policy.
3. Regression testing exposed that a plan could be applied with a different request operation set. A canonical request checksum was added and is now verified before application.
4. Determinism testing exposed operation-order sensitivity. Request and planned operations are canonicalized/sorted before checksums are generated.
5. Build verification exposed the repository's lower TypeScript target. Set/Map/iterator usage was changed to target-compatible `Array.from`/array APIs instead of changing the repository-wide compiler target.
6. Rollback was audited for asynchronous completion; rollback work is now awaited before the original adapter failure is rethrown.

## Verification evidence

The final implementation branch CI run **#459** passed:

- Format check
- Lint
- Typecheck
- Unit and contract tests — 23 files / 93 tests passed
- Build
- Dependency security audit
- Secret scanning / Gitleaks

The implementation PR was then merged into `main` as `6ffde460767fb7f421154643e5bc5f2d99113aa3`.

## Acceptance boundary

Phase 15 satisfies its acceptance boundary when it can:

1. validate a structured project modification request;
2. reject unsafe or conflicting operations before side effects;
3. produce a deterministic, policy-evaluated modification plan;
4. require approval for privileged `ASK` decisions;
5. reject stale projects/plans rather than overwriting concurrent work;
6. reject request/plan tampering rather than applying a mismatched plan;
7. apply supported file operations through the storage adapter;
8. preserve diagnostics on adapter failure and await rollback work;
9. provide automated regression protection for these guarantees.

## Final completion gate

Phase 15 is not considered closed until this documentation closure is merged and the exact synchronized `main` head passes the required post-merge CI verification. That final main CI run is the authoritative closure evidence.
