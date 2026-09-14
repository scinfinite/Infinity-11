# INFINITY-11 — Stage 2: Identity / Persistence / Events

> **Status:** COMPLETE
> **Started:** 2026-09-14
> **Completed:** 2026-09-14
> **Roadmap stage:** 2 — Identity, workspace, persistence, and events
> **Prerequisite:** Stage 1 merged into `main` and final CI verified

## Objective

Establish durable product state and authorization boundaries without coupling the core domain to a database, storage, or authentication vendor.

## Implemented

- Authentication primitives with email normalization, password hashing using Node `scrypt`, opaque session tokens, hashed session persistence, expiration, and revocation.
- User, workspace, membership, and project domain records.
- Workspace roles: `owner`, `admin`, `member`, `viewer`.
- Service-level workspace isolation and role authorization.
- Provider-independent `DatabaseProvider` contract.
- Durable SQLite reference adapter using Node's built-in SQLite implementation.
- Transaction boundary for multi-write domain operations.
- Versioned domain event persistence with correlation/actor/workspace/project context.
- Append-only audit records associated with domain mutations.
- Durable background-job primitives with queued/running/completed/failed state.
- Provider-independent object storage contract and filesystem reference adapter with traversal protection and content hashes.
- Canonical relational migration plus database row-level security policy boundary and corrective migration for policy recursion.
- Integration and security tests covering authentication, persistence across reopen, workspace isolation, role boundaries, audit/events, jobs, and storage traversal.

## Acceptance checklist

- [x] authenticated user can register/login/authenticate/logout
- [x] user can create a workspace
- [x] workspace owner can add members with bounded roles
- [x] authorized user can create/select projects
- [x] unauthorized cross-workspace access is rejected
- [x] durable relational state is represented by migration and tested by SQLite adapter
- [x] domain events and audit records are durable
- [x] correlation IDs are attached to generated events
- [x] background job primitive exists with durable state transitions
- [x] object storage abstraction exists without vendor coupling
- [x] security boundary tests exist
- [x] final pre-merge CI verification
- [x] post-merge `main` CI verification
- [x] final repository inspection

## Security decisions

- Passwords are never persisted in plaintext; salted `scrypt` hashes are stored.
- Session tokens are returned only at login and only their SHA-256 hashes are persisted.
- Authorization is checked against workspace membership before project reads/writes exposed by the identity service.
- Storage keys reject absolute paths and `.` / `..` traversal components.
- Domain mutations write event and audit records in the same persistence boundary.
- Database RLS uses an adapter-supplied transaction-local principal and a security-definer access helper to avoid recursive membership policy evaluation.

## Verification record

CI failures were inspected and corrected rather than ignored:

1. frozen-lockfile mismatch was resolved by generating and committing the canonical workspace lockfile.
2. formatting failure was resolved by normalizing Stage 2 implementation files.
3. lint failures were resolved by removing an unused identity import and explicitly consuming the storage content-type contract.
4. typecheck failures were resolved by making SQLite row conversions explicit, honoring exact optional correlation fields, and using a callback for `structuredClone` history mapping.
5. integration failure was resolved by normalizing filesystem reads to `Uint8Array` instead of returning Node `Buffer` objects.

### Pre-merge CI evidence

GitHub Actions run `34849349361` verified implementation commit `788d8f62f9c8c87bee60d7ca70ab3fef0f591c6d` with frozen dependency install, format check, lint, typecheck, tests, build, dependency audit, and Gitleaks all passing.

### Post-merge `main` CI evidence

Stage 2 was merged by PR #2 as merge commit `4686e463f97ac445fd5544c8f4ef849d93bfe578`. GitHub Actions run `34849540106` then verified that exact `main` merge commit with every foundation gate passing: frozen install, format, lint, typecheck, unit/contract/integration/security/regression tests, build, dependency audit, and Gitleaks.

The permanent workflow uses least-privilege `contents: read` permissions and frozen-lockfile installation. The temporary CI bootstrap/auto-commit mechanism used only to establish the Stage 2 lockfile and formatting snapshot is no longer present.

## Completion decision

**Stage 2 is complete.** The identity, persistence, event, audit, storage, and durable-job foundations are implemented behind provider boundaries, security-tested, reproducibly installed, merged into `main`, and verified after merge.

The repository is ready to proceed to Stage 3 — AI Gateway / Providers / Credentials.
