# Phase 20 — GitHub Engineering Integration

**Status:** COMPLETE

## Objective

Provide a provider-neutral GitHub engineering boundary for repository inspection and controlled write workflows without moving policy or orchestration into the web UI.

## Delivered

- Repository, branch, commit, pull-request, and issue contracts.
- Deterministic change ordering and plan checksums.
- Request identity and project binding.
- Safe repository path/ref validation with `.git` protection.
- Adapter-only GitHub mutations; core contracts contain no HTTP, shell, or GitHub SDK dependency.
- Central `ALLOW` / `ASK` / `DENY` policy boundary.
- Explicit approval for `ASK` operations.
- Base-branch SHA binding and stale-plan rejection before mutation.
- Branch creation, commit creation, and optional pull-request creation.
- Commit-only mode for workflows that intentionally do not open a PR.
- Regression tests for validation, determinism, policy, approval, stale plans, and successful mutation sequencing.

## Security and architecture invariants

GitHub is an external adapter, not a privileged orchestration layer. The package never handles credentials directly, never executes shell commands, and never writes repository state itself. Mutations require a caller-supplied adapter and pass through policy before the adapter is invoked. Plans are bound to the exact base branch SHA so changes discovered from stale repository state cannot silently mutate a newer branch.

## Verification

The initial merged Phase 20 CI run identified formatter drift in the GitHub package. The formatting correction is isolated to source layout and introduces no behavioral change. The corrected branch is re-verified before phase closure.

The phase acceptance gate is the repository's standard format, lint, typecheck, unit/contract tests, build, dependency security audit, Gitleaks, regression, documentation, PR merge, and final synchronized `main` CI verification.

## Completion rule

Phase 20 is complete only after implementation and documentation are merged and final `main` CI passes all required gates. No provider-specific credential or network implementation is required by this phase; those remain replaceable adapter concerns.
