# Phase 11 — Advanced Application Builder Foundation

**Status:** IMPLEMENTATION IN PROGRESS
**Canonical branch:** `phase-11-advanced-application-builder`
**Base:** `main` at `129ca181cb8214e3c5d073e6a17056eaed01ce26`
**CI verification:** PENDING — final phase CI is required before completion

## Objective

Establish the provider-independent foundation for INFINITY-11's serious application builder. The foundation turns a structured application intent into a validated, traceable project plan that later phases can execute, generate, test, inspect, modify, and deploy.

## Architecture boundary

```text
User intent
  → Application specification
  → Validation
  → Project plan
  → Generation/execution adapters (later phases)
  → Build/test/browser QA (later phases)
  → Verified delivery
```

The application builder is a domain capability. It must not move orchestration or privileged execution into the browser. It must reuse existing execution, knowledge, verification, policy, and observability contracts.

## Implemented in this phase

- Typed application specification contract.
- Explicit targets, languages, and framework compatibility.
- Requirement IDs and acceptance criteria for traceability.
- Deterministic normalization of user/project specification data.
- Fail-closed specification validation.
- Deterministic project-plan generation.
- Initial directory/file planning for web and full-stack applications.
- Verification requirements embedded in the generated plan.
- Root TypeScript project registration.
- Automated contract tests covering valid input, invalid combinations, duplicates, normalization, planning, and fail-closed behavior.

## Supported foundation languages

The contract includes TypeScript, JavaScript, Python, Java, Go, Rust, C#, Kotlin, and Swift. Java is explicitly supported rather than treating the builder as Python/TypeScript-only.

## Supported foundation frameworks

React, Next.js, Vue, Svelte, Express, FastAPI, Spring Boot, and Gin are represented as framework contracts. Unsupported combinations fail validation rather than silently producing an invalid project.

## Acceptance criteria

- [x] Application specification is machine-readable and strongly typed.
- [x] Requirements have stable identifiers and acceptance criteria.
- [x] Invalid framework/language combinations are rejected.
- [x] Invalid or incomplete specifications fail closed.
- [x] Project planning is deterministic for the same specification.
- [x] Project structure remains traceable to the specification.
- [x] Existing TypeScript project references include the new package.
- [x] Phase-specific automated tests exist.
- [ ] Full formatting/lint/typecheck/test/build/security CI is green on the phase branch.
- [ ] Final regression verification against Phases 1–10 is complete.
- [ ] Phase documentation and roadmap status are updated after accepted CI evidence.
- [ ] Phase branch is merged to `main`.
- [ ] Post-merge `main` CI is green.

## Non-goals for Phase 11

This phase does not claim to deliver full-stack code generation, database generation, auth generation, AI project modification, browser QA automation, or production deployment. Those capabilities are explicitly covered by later roadmap phases.

## Verification rule

A project plan, generated file list, compile result, or agent statement is not proof that an application works. Later phases must execute the plan and verify the resulting application before delivery.
