# Phase 18 — Application Improvement Engine

**Status:** COMPLETE
**Implementation branch:** `phase-18-application-improvement-engine`
**Documentation branch:** `phase-18-documentation-closure`
**Baseline:** Phase 17 closed on `main` at `cb6424d52e83581400b1413a2d2d74763c453b48`; final main CI #488 passed.
**Implementation PR:** #26 — merged into `main` as `3ba4987b89d9f86dbc1292d31db3fe876aea9c2d`.
**Implementation CI:** run #491 passed all required gates.

## Objective

Turn verified application evidence into deterministic, policy-controlled improvement work without allowing an AI claim to become an unverified side effect.

## Delivered scope

- Evidence contracts with confidence and provenance.
- Candidate contracts covering bug, performance, reliability, accessibility, security, and UX improvements.
- Candidate validation for identity, revision, paths, risk, effort, and evidence references.
- Deterministic priority/score ordering with stable ID tie-breaking.
- ALLOW / ASK / DENY policy integration before application.
- Evidence checksum binding so changed observations invalidate a plan.
- Exact project-revision binding and stale-plan protection.
- Explicit ASK approval before side effects.
- Adapter-based application boundary; the core does not execute shell commands or mutate files directly.
- Regression tests for invalid evidence, unsafe paths, deterministic planning, policy denial, approval, stale revisions, changed evidence, and successful application.

## Security invariants

- Invalid, ambiguous, or untrusted evidence fails closed.
- Unsafe project paths are rejected.
- Policy is evaluated before improvement side effects.
- ASK requires explicit approval.
- Stale project revisions cannot be applied.
- Changed evidence invalidates the plan.
- The core does not execute shell commands or mutate project files directly.
- Improvement planning remains provider-independent.

## Audit findings and fixes

1. Branch CI initially exposed Prettier drift; exact formatter output was applied and re-verified.
2. The first implementation used an iterator form incompatible with the repository's TypeScript target; it was replaced with an index loop after CI exposed the error.
3. No temporary formatter/debug workflow was left in the repository.
4. Regression coverage was retained for the complete security and lifecycle boundary.

## Verification evidence

Implementation PR #26 was merged into `main` as `3ba4987b89d9f86dbc1292d31db3fe876aea9c2d` after implementation CI run #491 passed:

- Format check
- Lint
- Typecheck
- Unit and contract tests — 26 files / 116 tests passed
- Build
- Dependency security audit
- Secret scanning / Gitleaks

The exact synchronized `main` head after implementation merge is the authoritative baseline for documentation closure.

## Final completion gate

Phase 18 is complete only after documentation synchronization, documentation PR merge, and exact synchronized `main` CI pass.
