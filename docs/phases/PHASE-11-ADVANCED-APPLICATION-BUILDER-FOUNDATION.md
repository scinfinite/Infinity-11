# Phase 11 — Advanced Application Builder Foundation

**Status:** IMPLEMENTATION IN PROGRESS  
**Canonical branch:** `phase-11-advanced-application-builder`  
**Base:** `main` at `f255523b4be3749afd48ccaba0d451020e54cf84`  
**Current head:** `91a72febeac139138abfcf5d0470cbc0ec028d56`  
**CI verification:** FAILED on initial phase head; fix cycle in progress

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
- Fail-closed runtime validation, including unsupported language/framework/target values.
- Deterministic project-plan generation.
- Language-aware source-file extensions instead of silently planning TypeScript files for every language.
- Initial directory/file planning for web and full-stack applications.
- Verification requirements embedded in the generated plan.
- Root TypeScript project registration.
- Automated contract tests covering valid input, invalid combinations, duplicates, normalization, deterministic planning, runtime fail-closed behavior, and Java planning.

## Supported foundation languages

The contract includes TypeScript, JavaScript, Python, Java, Go, Rust, C#, Kotlin, and Swift. Java is explicitly supported rather than treating the builder as Python/TypeScript-only.

## Supported foundation frameworks

React, Next.js, Vue, Svelte, Express, FastAPI, Spring Boot, and Gin are represented as framework contracts. Unsupported combinations fail validation rather than silently producing an invalid project.

## Verification evidence so far

- The initial PR was created against the verified Phase 1–10 `main` baseline.
- Initial PR CI ran automatically and exposed a formatting failure before deeper checks could execute.
- Secret scanning passed on the initial head.
- The first implementation audit found two correctness gaps beyond formatting: runtime-invalid framework values could throw instead of failing closed, and the planner always emitted `.ts` source paths despite advertising nine languages.
- The current fix cycle hardens both boundaries and expands regression coverage.

## Acceptance criteria

- [x] Application specification is machine-readable and strongly typed.
- [x] Requirements have stable identifiers and acceptance criteria.
- [x] Invalid framework/language combinations are rejected.
- [x] Invalid or incomplete specifications fail closed.
- [x] Project planning is deterministic for the same specification.
- [x] Project structure remains traceable to the specification.
- [x] Existing TypeScript project references include the new package.
- [x] Phase-specific automated tests exist.
- [x] Language-aware planner behavior is covered for Java.
- [x] Runtime-invalid framework values fail closed instead of throwing unexpectedly.
- [ ] Full formatting/lint/typecheck/test/build/security CI is green on the final phase head.
- [ ] Final regression verification against Phases 1–10 is complete.
- [ ] Phase documentation and roadmap status are updated after accepted CI evidence.
- [ ] Phase branch is merged to `main`.
- [ ] Post-merge `main` CI is green.

## Non-goals for Phase 11

This phase does not claim to deliver full-stack code generation, database generation, auth generation, AI project modification, browser QA automation, or production deployment. Those capabilities are explicitly covered by later roadmap phases.

## Verification rule

A project plan, generated file list, compile result, or agent statement is not proof that an application works. Later phases must execute the plan and verify the resulting application before delivery.
