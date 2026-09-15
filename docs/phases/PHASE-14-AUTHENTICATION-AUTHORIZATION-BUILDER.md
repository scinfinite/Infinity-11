# Phase 14 — Authentication and Authorization Builder

**Status:** COMPLETE
**Branch:** `phase-14-auth-authorization-builder`
**Implementation merge:** `1c12f6f46687c8b4f9bd3113e92b47c94aa4db58`
**Branch CI:** Run #447 passed all required gates on the final implementation state before merge.
**Documentation closure:** `phase-14-documentation-closure` (pending merge)
**Baseline:** Phase 13 is closed on `main` with implementation merge `7b1b8d175d33927b8887c9a28c9d0242ae7cb94c` and documentation closure `09964b98b8d14763d1bd29d7216dc1f87724f521`.

## Goal

Provide a provider-independent, deterministic authentication and authorization specification/builder boundary. Security-sensitive provider implementations remain adapters; the core package must not force a hosted identity vendor or credential service.

## Delivered scope

- password, magic-link, OAuth2, and passkey strategy contracts;
- explicit session transport, TTL, idle timeout, rotation, and SameSite policy;
- explicit password policy when password authentication is enabled;
- role and permission declarations with strict identifier validation;
- resource/action authorization rules with deny precedence;
- fail-closed validation for unknown roles, malformed permissions, invalid session settings, incomplete OAuth configuration, and unsafe issuer schemes;
- case-insensitive blocking of executable/data URI issuer schemes;
- allow-rule permission-boundary validation so policies cannot grant a role an undeclared permission;
- deterministic canonicalization with normalized provider, role, permission, policy, and policy-role ordering;
- password hashing, token issuance, and session persistence as adapter interfaces rather than bundled cryptographic/vendor implementations;
- generated runtime contracts for authentication and authorization;
- explicit package module configuration compatible with the repository TypeScript build model.

## Security invariants

- No plaintext password storage or password-handling implementation is bundled in the builder.
- Authentication providers are replaceable adapters.
- Authorization never grants access merely because a role exists; an explicit matching allow is required.
- Allow rules cannot exceed the permissions declared by their target roles.
- Matching deny rules take precedence over allows.
- Global security policy remains owned by the platform security layer; phase-local deny rules must be role-scoped.
- Session configuration is explicit and bounded.
- Executable/data URI issuer schemes are rejected case-insensitively.
- Deterministic outputs are independent of declaration ordering.

## Audit findings and fixes

During implementation verification, CI exposed two integration defects: the auth test imported the unpublished workspace package name instead of source, and the package TypeScript project was inferred as CommonJS under the clean CI checkout. Both were corrected. A deeper security audit also identified policy grants that could exceed role permissions and canonical output that was not fully order-independent; both were hardened and covered by regression tests.

## Verification evidence

- Format check: PASS
- Lint: PASS
- Typecheck: PASS
- Unit/contract tests: PASS
- Build: PASS
- Dependency security audit: PASS
- Gitleaks secret scan: PASS
- Final implementation branch CI: PASS (run #447)
- Pull request #18 merged into `main` with merge commit `1c12f6f46687c8b4f9bd3113e92b47c94aa4db58`

## Completion gate

Phase 14 is accepted as complete only after documentation synchronization and the exact synchronized `main` CI passes on the final documentation-closure merge commit.
