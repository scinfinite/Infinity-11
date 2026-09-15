# Phase 18 — Application Improvement Engine

**Status:** IN PROGRESS
**Implementation branch:** `phase-18-application-improvement-engine`
**Baseline:** Phase 17 is closed on `main` at `cb6424d52e83581400b1413a2d2d74763c453b48` with final main CI #488 passed.

## Objective

Turn verified application evidence into deterministic, policy-controlled improvement work without allowing an AI claim to become an unverified side effect.

## Acceptance boundary

1. ingest structured evidence from testing, visual QA, security, reliability, performance, accessibility, and UX systems;
2. validate evidence confidence, identity, and provenance;
3. create deterministic improvement candidates with explicit affected paths, risk, effort, and expected benefit;
4. rank candidates deterministically;
5. enforce ALLOW / ASK / DENY before application;
6. bind application to the exact project revision and evidence set used for planning;
7. delegate actual modification to an adapter rather than executing arbitrary commands in the core;
8. preserve concrete application diagnostics and regression protection.

## Security invariants

- Invalid, ambiguous, or untrusted evidence fails closed.
- Unsafe project paths are rejected.
- Policy is evaluated before improvement side effects.
- ASK requires explicit approval.
- Stale project revisions cannot be applied.
- Changed evidence invalidates the plan.
- The core does not execute shell commands or mutate project files directly.
- Improvement planning remains provider-independent.

## Delivered scope

- Evidence contracts with confidence and provenance.
- Candidate contracts covering bug, performance, reliability, accessibility, security, and UX improvements.
- Candidate validation for identity, revision, paths, risk, effort, and evidence references.
- Deterministic priority/score ordering with stable ID tie-breaking.
- ALLOW / ASK / DENY policy integration.
- Evidence checksum binding.
- Revision binding and stale-plan protection.
- Explicit ASK approval.
- Adapter-based application boundary.
- Regression tests for invalid evidence, unsafe paths, deterministic plans, policy denial, approval, stale revisions, changed evidence, and successful application.

## Final completion gate

Phase 18 is complete only after implementation audit, branch CI, documentation synchronization, merge, and exact synchronized `main` CI all pass.
