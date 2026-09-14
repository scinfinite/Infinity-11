# INFINITY-11 — Stage 2: Identity / Persistence / Events

> **Status:** IN PROGRESS
> **Started:** 2026-09-14
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
- [ ] final CI verification on final Stage 2 commit
- [ ] final repository inspection after CI

## Security decisions

- Passwords are never persisted in plaintext; salted `scrypt` hashes are stored.
- Session tokens are returned only at login and only their SHA-256 hashes are persisted.
- Authorization is checked against workspace membership before project reads/writes exposed by the identity service.
- Storage keys reject absolute paths and `.` / `..` traversal components.
- Domain mutations write event and audit records in the same persistence boundary.
- Database RLS uses an adapter-supplied transaction-local principal and a security-definer access helper to avoid recursive membership policy evaluation.

## Verification record

Earlier CI failures were inspected rather than ignored:

1. frozen-lockfile failure exposed missing Stage 2 workspace importers; CI generated and persisted the canonical lockfile.
2. formatting failure exposed unformatted Stage 2 files; CI normalized the files.
3. lint failure exposed an unused identity import and unused storage content-type parameter; both were fixed.

The final CI run must execute against the final commit after the temporary lockfile/format bootstrap mechanism is removed.

## Completion decision

Stage 2 remains **IN PROGRESS** until the final CI run passes against the final implementation commit and the repository is re-inspected afterward.
