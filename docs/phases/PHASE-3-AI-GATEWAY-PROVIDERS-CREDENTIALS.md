# INFINITY-11 — Stage 3: AI Gateway / Providers / Credentials

> **Status:** IN FINAL VERIFICATION
> **Started:** 2026-09-14
> **Roadmap stage:** 3 — AI Gateway, provider adapters, and credential security
> **Prerequisite:** Stage 2 merged into `main` and verified

## Objective

Create one normalized, provider-independent inference boundary with secure credential storage, capability-safe multimodal requests, streaming, normalized errors, and usage capture.

## Implemented

- `@infinity-11/ai-gateway` package behind a provider adapter contract.
- Normalized text and image request content types and normalized responses/usage.
- OpenAI-compatible chat-completions adapter using the platform `fetch` API.
- Anthropic Messages adapter using the platform `fetch` API.
- OpenAI and Anthropic streaming normalization into one async-iterable chunk contract.
- Stable provider error taxonomy with retryability and HTTP status metadata.
- AES-256-GCM credential encryption with an externally supplied 32-byte master key.
- Durable credential metadata and encrypted ciphertext persistence in the existing database provider.
- Workspace-scoped credential access, enable/disable, update, list, reveal, and deletion.
- Provider registry that keeps provider-specific behavior inside adapters.
- Usage-event sink contract with normalized `ai.usage.recorded` events.
- Integration, security, and regression tests for credential secrecy, isolation, provider normalization, streaming, and error handling.

## Acceptance checklist

- [x] provider contract exists
- [x] normalized request/response types exist
- [x] streaming contract exists
- [x] multimodal content representation exists
- [x] two materially different provider adapters exist
- [x] multiple credentials per workspace/provider are supported by durable storage
- [x] credentials are encrypted at rest
- [x] credential list never returns ciphertext
- [x] workspace isolation is enforced by credential reads
- [x] normalized provider error taxonomy exists
- [x] usage capture contract exists
- [x] provider-specific request mapping remains inside adapters
- [x] repository formatting and secret scanning pass on the current implementation snapshot
- [ ] final lint/typecheck/tests/build/security verification
- [ ] final CI verification on final implementation commit
- [ ] post-merge `main` CI verification
- [ ] final repository inspection

## Security decisions

- Raw provider credentials are never placed in request payloads or usage events.
- Credential ciphertext is authenticated using AES-256-GCM and the encryption key is never stored in the database.
- Credential metadata is workspace-scoped at the persistence boundary.
- Disabled credentials cannot be revealed for inference.
- Provider errors are normalized without exposing the credential value.
- The gateway does not depend on provider SDKs, keeping the core provider boundary vendor-neutral.

## Verification record

During verification, CI caught and the implementation corrected:

1. secret-like test literals detected by Gitleaks;
2. workspace lockfile drift after adding the new workspace package;
3. repository formatting mismatches;
4. an unused credential destructuring variable rejected by ESLint;
5. the new AI gateway package missing from the root TypeScript project graph;
6. exact-optional-property-type violations in normalized usage and credential update contracts.

The branch is now intentionally left unchanged while the final verification workflow applies and validates the corresponding contract fixes. No completion claim is made until the final implementation commit passes the full CI pipeline and the post-merge `main` verification.
