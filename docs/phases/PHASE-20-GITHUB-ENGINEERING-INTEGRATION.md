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

- Implementation PR #31 merged into `main` as `8440ad17551370cba72440e122d8bb5b00560654`.
- The first post-merge main CI run #513 caught formatter drift in `packages/github/src/index.ts`; the issue was reproduced from the CI diff and corrected using the exact Prettier output.
- Formatter remediation PR #33 merged into `main` as `e5866d3996afd877e6e444a670cb114cd2d0aaed`.
- Remediation PR CI #520 passed format, lint, typecheck, tests, build, dependency security audit, and Gitleaks.
- Final synchronized post-merge `main` CI run #522 passed all required gates.
- The temporary formatter-evidence CI step used to capture exact output was removed before merge; the repository workflow is restored to its canonical form.

## Completion rule

Phase 20 is fully closed: implementation, regression coverage, documentation, remediation, merge, and synchronized post-merge `main` CI are all verified. No provider-specific credential or network implementation is required by this phase; those remain replaceable adapter concerns.
