# Phase 14 — Authentication and Authorization Builder

**Status:** IN PROGRESS
**Branch:** `phase-14-auth-authorization-builder`
**Baseline:** Phase 13 is closed on `main` with implementation merge `7b1b8d175d33927b8887c9a28c9d0242ae7cb94c` and documentation closure `09964b98b8d14763d1bd29d7216dc1f87724f521`.

## Goal

Provide a provider-independent, deterministic authentication and authorization specification/builder boundary. Security-sensitive provider implementations remain adapters; the core package must not force a hosted identity vendor or credential service.

## Scope

- password, magic-link, OAuth2, and passkey strategy contracts;
- explicit session transport, TTL, idle timeout, rotation, and SameSite policy;
- explicit password policy when password authentication is enabled;
- role and permission declarations with strict identifier validation;
- resource/action authorization rules with deny precedence;
- fail-closed validation for unknown roles, malformed permissions, invalid session settings, incomplete OAuth configuration, and unsafe issuer schemes;
- deterministic canonicalization and plan checksums;
- password hashing, token issuance, and session persistence as adapter interfaces rather than bundled cryptographic/vendor implementations;
- generated runtime contracts for authentication and authorization.

## Security invariants

- No plaintext password storage or password-handling implementation is bundled in the builder.
- Authentication providers are replaceable adapters.
- Authorization never grants access merely because a role exists; an explicit matching allow is required.
- Matching deny rules take precedence over allows.
- Global security policy remains owned by the platform security layer; phase-local deny rules must be role-scoped.
- Session configuration is explicit and bounded.
- No executable/data URI issuer is accepted.

## Verification gate

Phase 14 is complete only after implementation audit, tests, branch CI, PR merge, documentation synchronization, and exact synchronized `main` CI all pass.
