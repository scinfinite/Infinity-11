# Phase 12 — Full-Stack Code Generation

**Status:** IN PROGRESS
**Branch:** `phase-12-full-stack-code-generation`
**Baseline:** Phase 11 merged to `main` at `2e0d5ba17ac213a9cefe07839ac3db1ab9dff672`.

## Goal

Turn the Phase 11 application specification/foundation into deterministic, auditable project source rather than stopping at planning or a UI-only scaffold.

## Implemented boundary

- Machine-readable generation specification with application id, targets, language, framework, requirements, constraints, and revision.
- Deterministic project generation with stable file ordering.
- Web, backend, and full-stack target handling.
- TypeScript web/runtime templates for Next.js, React, Vue, Svelte, and Express.
- Python/FastAPI, Java/Spring Boot, and Go/Gin backend templates.
- Framework-neutral fallback output for explicitly supported unknown targets.
- Generated README, requirements traceability, `.env.example`, and `.gitignore` safety boundary.
- Machine-readable `infinity-11.generated.json` manifest.
- Requirement-to-generated-file traceability.
- Generated-project security audit for duplicate paths, traversal, unsafe secret files, private-key material, and secret-like content.
- Fail-closed validation for unsupported language/framework combinations and missing requirements.
- Test coverage across all supported Phase 12 framework variants plus tampering/security cases.

## Verification contract

Every generated project exposes a verification contract in its manifest:

- install
- dev
- build
- test
- lint
- typecheck
- security

The generator itself does not claim those commands passed; it records the contract so downstream execution/verification phases can run them and attach evidence.

## Acceptance criteria

1. Phase 11 application specifications can be converted into deterministic project file sets.
2. Supported TypeScript, Python, Java, and Go framework paths are covered.
3. Generated paths cannot escape the project root.
4. Generated output does not contain credential/private-key material.
5. Requirements remain traceable to generated files.
6. Generation is deterministic for the same specification.
7. Invalid or unsupported specifications fail closed.
8. Existing phases remain regression-safe.
9. Repository format, lint, typecheck, tests, build, and security checks are green.
10. Phase documentation and roadmap status are synchronized with verified repository evidence.

## Engineering evidence

- Unit coverage: `tests/phase-12-codegen.test.ts`
- Package build: `packages/codegen/tsconfig.json`
- Root TypeScript build graph includes `packages/codegen/tsconfig.json`.
- Branch CI is configured to verify Phase 12 pushes; formatting is treated as a hard gate.

## Remaining gate

Phase 12 remains **IN PROGRESS** until branch CI, PR review, merge, and post-merge `main` CI all pass. No completion claim is made before those gates close.
