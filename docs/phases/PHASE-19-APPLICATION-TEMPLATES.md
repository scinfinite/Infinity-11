# Phase 19 — Application Templates and Scaffolding

**Status: COMPLETE**

## Objective

Provide deterministic, provider-independent application templates and a safe scaffolding boundary that can generate project structure without granting the template layer direct filesystem mutation authority.

## Delivered

- Versioned template registry for:
  - Next.js + TypeScript/JavaScript
  - React + Vite + TypeScript/JavaScript
  - FastAPI + Python
  - Spring Boot + Java
  - Gin + Go
- Explicit target/language/framework compatibility validation.
- Application identity and positive revision validation.
- Deterministic scaffold plans with:
  - canonical parameter checksum
  - per-file SHA-256 checksums
  - deterministic file ordering
  - deterministic directory manifests
  - exact template-version binding
- Generated-path safety checks that allow ordinary dotfiles such as `.gitignore` and `.env.example` while rejecting traversal, absolute paths, empty path segments, and `.git` path segments.
- File-count and generated-content size limits.
- Adapter-only application boundary; the core package does not execute shell commands or write files directly.
- Central policy decision boundary with `ALLOW`, `ASK`, and `DENY` outcomes.
- Explicit approval for `ASK`, cryptographically bound to the exact scaffold-plan checksum.
- Conflict policies:
  - `never`
  - `changed-only`
  - `all`
- Plan tamper detection before the adapter is queried.
- Regression tests for determinism, Java support, validation, policy enforcement, approval binding, conflict handling, and tamper rejection.

## Architectural boundary

```text
Application specification
        ↓
Template registry + validation
        ↓
Deterministic scaffold plan
        ↓
Policy: ALLOW / ASK / DENY
        ↓
Explicit approval when required
        ↓
Scaffold adapter
        ↓
Filesystem / repository implementation
```

The template package is intentionally not coupled to a specific AI provider, deployment vendor, filesystem implementation, or shell runner. It exposes a small policy and adapter contract so runtime integrations can enforce the platform's existing security model.

## Verification evidence

- Implementation PR #28 merged into `main` as `61217b031eda49ab3e4512a8c57bffc9b580fa05`.
- Final implementation branch CI run #505 passed:
  - format check
  - lint
  - typecheck
  - 27 test files / 126 tests
  - build
  - dependency security audit
  - Gitleaks secret scan
- CI also caught and closed two real defects before merge:
  1. Prettier drift in the new template package.
  2. Dotfile rejection in the generated-path safety rule, followed by a deterministic-order assertion correction.

## Regression boundary

Phase 19 preserves the completion guarantees established by Phases 1–18. Template generation remains planning-only until the policy layer and adapter boundary authorize application. No template can bypass the central privileged-action decision path.

## Acceptance result

Phase 19 is complete only after documentation is merged and the synchronized `main` branch receives a passing post-merge CI run. The final main CI result is recorded in `docs/phases/README.md` at closure.
