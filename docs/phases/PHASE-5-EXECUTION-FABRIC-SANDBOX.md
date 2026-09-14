# INFINITY-11 — Stage 5: Execution Fabric / Sandbox Abstraction

> **Status:** IN PROGRESS
> **Started:** 2026-09-14
> **Roadmap stage:** 5 — execution fabric and sandbox abstraction
> **Prerequisite:** Stage 4 merged into `main` and verified

## Objective

Provide a provider-independent execution boundary for project workloads. Execution must be explicitly authorized, workspace-scoped, bounded, observable, and honest about which isolation guarantees a provider can enforce.

## Implemented

- `ExecutionProvider` contract with explicit lifecycle cleanup.
- `ExecutionFabric` provider selection boundary.
- `LocalExecutionProvider` reference adapter suitable for local development/Termux-style environments.
- Workspace-root path containment checks before process execution.
- `shell: false` process spawning; commands are argv arrays rather than shell strings.
- Explicit permission decision before execution, defaulting to the existing execution capability boundary.
- Environment-variable allowlist.
- Bounded execution timeout and captured stdout/stderr size.
- Deterministic execution IDs, duration, exit status, signal, and correlation metadata.
- Artifact metadata with SHA-256 content hashes.
- Workspace cleanup helper.
- Conservative network policy: the local provider refuses `network: deny` rather than pretending it can provide OS-level network isolation.

## Security decisions

- Path traversal outside the workspace root is rejected.
- No shell interpolation is used by the local provider.
- Execution is denied unless the injected policy returns `ALLOW`; `ASK` is not silently upgraded.
- Environment variables are allowlisted to reduce secret leakage into child processes.
- Timeout and output limits are bounded by hard maximums.
- Network isolation is an explicit provider capability, not a label. A provider that cannot enforce deny-mode must reject it.
- The abstraction remains open for stronger remote/container/VM providers that can enforce filesystem, network, CPU, memory, and process isolation at the runtime boundary.

## Acceptance checklist

- [x] provider-independent execution contract
- [x] provider selection/fabric boundary
- [x] local reference execution provider
- [x] workspace filesystem containment
- [x] explicit permission integration boundary
- [x] non-shell argv execution
- [x] timeout enforcement
- [x] bounded output capture
- [x] environment allowlist
- [x] correlation/audit metadata in results
- [x] artifact hashing metadata
- [x] lifecycle cleanup contract
- [x] conservative network isolation behavior
- [x] integration/security coverage
- [ ] final branch CI verification
- [ ] PR merge into `main`
- [ ] post-merge `main` CI verification
- [ ] final repository inspection

## Verification record

Initial CI caught formatting issues in the three Stage 5 files. A temporary formatter workflow was used only to apply the repository's pinned Prettier version; it was then removed from the branch. Secret scanning passed during the first CI attempts.

The final completion gate remains open until the permanent CI workflow passes on the final branch snapshot, the PR is merged, and post-merge `main` verification passes.
