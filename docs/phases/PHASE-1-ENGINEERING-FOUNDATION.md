# INFINITY-11 — Stage 1: Engineering Foundation

> **Status:** IN PROGRESS — final CI verification pending
> **Started:** 2026-09-14
> **Roadmap stage:** 1 — Repository, contracts, and CI foundation
> **Baseline:** Stage 0 architecture/audit gate complete

## Objective

Turn the frozen architecture into a real, testable engineering foundation without prematurely implementing Stage 2+ product behavior.

## Scope

- pnpm monorepo/workspace and Node toolchain
- application/package boundaries
- shared TypeScript contracts
- API/event/error conventions at contract level
- environment/configuration boundary
- secret-handling boundary
- formatting/lint/typecheck/test/build tooling
- unit/integration/security/regression test locations
- dependency security audit
- GitHub Actions CI and secret scanning
- migration/versioning conventions
- foundational observability/redaction
- documentation/status synchronization

## Implemented foundation

- Root workspace manifest and pnpm workspace definition.
- Strict TypeScript project references and package-local composite builds.
- `@infinity-11/types` shared contract package with quality states, permission decisions, provider references, correlation context, API errors, domain events, and verification evidence.
- `@infinity-11/config` environment boundary with explicit required public configuration and no credential values.
- `@infinity-11/observability` structured log shape plus recursive secret-key redaction.
- `@infinity-11/security` capability vocabulary and deny-by-default permission policy.
- Explicit web and worker application boundaries without implementing later-stage product behavior.
- Vitest unit/contract/integration/security/regression coverage for the foundation invariants.
- Prettier, ESLint, TypeScript, Vitest, dependency audit, and Gitleaks CI foundation.
- Recognized `.prettierrc.json` formatting configuration.
- `pnpm-lock.yaml` committed as the canonical dependency-resolution snapshot.
- CI uses `pnpm install --frozen-lockfile` for reproducible installs.
- Vitest upgraded to 3.2.6 to clear the critical audit advisory detected during CI.
- `.env.example` and repository secret exclusions.
- Migration and versioning conventions documented under `docs/architecture/`.

## Verification evidence

The latest substantive CI run passed every engineering check before the lockfile/documentation changes:

- [x] clean dependency install
- [x] format check
- [x] lint
- [x] typecheck
- [x] unit/contract tests — 5/5 test files, 5/5 tests passed
- [x] integration coverage included in the test suite
- [x] build — all 6 buildable workspace projects completed
- [x] dependency security audit
- [x] secret scan — Gitleaks passed
- [x] regression coverage included in the test suite
- [ ] final CI run for the final branch state
- [ ] final repository inspection

## Lockfile bootstrap

The repository originally had no lockfile. A temporary, least-scope GitHub Actions bootstrap job generated the lockfile with pnpm 10.15.0 and committed it. The temporary write-enabled workflow was then removed.

The permanent CI workflow now has read-only repository permissions and enforces `pnpm install --frozen-lockfile`.

## Completion rule

Stage 1 remains open until the final branch state has a successful CI run and the repository tree has been inspected after that run. Only then may this document be changed to `COMPLETE`.
