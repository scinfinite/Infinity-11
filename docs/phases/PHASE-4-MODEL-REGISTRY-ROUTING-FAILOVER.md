# INFINITY-11 — Stage 4: Model Registry / Routing / Failover / Usage

> **Status:** IN FINAL VERIFICATION
> **Started:** 2026-09-14
> **Roadmap stage:** 4 — model registry, intelligent routing, health/failover, and cost signals
> **Prerequisite:** Stage 3 merged into `main` and final CI verified

## Objective

Turn the provider-neutral AI gateway into an explicit, deterministic routing layer without making provider quota or health data up.

## Implemented

- `ModelRegistry` with validated model metadata and provenance.
- Capability-aware model eligibility filtering.
- Credential eligibility and quota-state filtering.
- Provider health tracking with bounded circuit cooldown.
- Explainable weighted scoring for cost, latency, reliability, and provider preference.
- Stable deterministic tie-breaking.
- Bounded fallback chains.
- Retry only for explicitly retryable provider failures.
- Route decision records and in-memory sink for observability.
- Usage-based estimated cost attribution from declared model pricing.
- Provider-independent `RoutedAIGateway` on top of the existing AI gateway.
- Integration tests for capability filtering, determinism, quota handling, health recovery, fallback, and retry safety.

## Acceptance checklist

- [x] model registry exists
- [x] capability metadata exists
- [x] metadata provenance is explicit
- [x] model/credential eligibility is enforced
- [x] routing policy and weighted scoring exist
- [x] provider health is tracked without invented provider data
- [x] credential quota state is supplied explicitly and never inferred as authoritative
- [x] bounded fallback chains exist
- [x] route decision records expose observable factors
- [x] usage-based estimated cost attribution exists
- [x] deterministic routing is tested
- [x] retryability boundaries are tested
- [ ] final formatting/lint/typecheck/tests/build/security verification
- [ ] final CI verification on final implementation commit
- [ ] post-merge `main` CI verification
- [ ] final repository inspection

## Security and correctness decisions

- Provider quota is advisory input owned by the caller; the router never fabricates remaining quota or reset times.
- Provider health is local observed state, not a claim about provider-wide availability.
- Fallback occurs only for errors explicitly marked retryable by the normalized gateway error contract.
- Fallback is bounded by `maxAttempts` and cannot expand dynamically during a request.
- Route records contain metadata and failure messages only; provider credentials are never copied into routing records.
- Cost is an estimate based only on declared model pricing and returned token usage; missing pricing produces no invented monetary value.
- Stable sorting by score/provider/model/credential makes equal-input decisions reproducible.

## Verification record

Verification is intentionally left open until the final implementation commit has passed the complete CI pipeline and the post-merge `main` pipeline.
