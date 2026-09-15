# INFINITY-11 — Stage 10: Core Web / PWA Product UX

> **Status:** IN PROGRESS
> **Roadmap stage:** 10
> **Branch:** `stage-10-core-web-pwa-ux`
> **Prerequisite:** Stage 9 complete and merged with green `main` CI

## Objective

Expose the underlying INFINITY-11 runtime through a premium, responsive, accessible, installable web workspace without duplicating backend orchestration rules in the UI.

## Scope

- global application shell and responsive navigation;
- Command Center;
- AI Workspace, Projects, Runs, Approvals, Artifacts, Usage and Settings surfaces;
- model/route and activity visibility boundaries;
- approvals and notification affordances;
- artifacts/history navigation;
- responsive mobile and desktop behavior;
- accessibility semantics and keyboard focus treatment;
- reduced-motion preference;
- PWA manifest, icon and offline shell;
- deterministic UI contract/regression tests;
- deployable web build output.

## Architecture boundary

The web package is a presentation and interaction layer. Runtime policy, execution, routing, verification and automation semantics remain owned by the existing domain packages. Stage 10 must not create a second orchestration implementation in browser code.

The web shell is currently provider-neutral and uses explicit navigation/state contracts. Live backend wiring is introduced only through existing domain/API contracts; placeholder surfaces must remain honest about unavailable capabilities.

## Acceptance checklist

- [ ] global shell
- [ ] responsive navigation
- [ ] Command Center
- [ ] AI Workspace surface
- [ ] Projects surface
- [ ] runs/activity surface
- [ ] approvals surface
- [ ] notifications affordance
- [ ] artifacts/history surface
- [ ] usage/cost surface
- [ ] settings/security surface
- [ ] accessible keyboard/focus behavior
- [ ] reduced-motion support
- [ ] mobile and desktop layouts
- [ ] installable PWA manifest/icon
- [ ] offline shell worker
- [ ] deterministic UI contract/regression tests
- [ ] deployable build output
- [ ] implementation audit
- [ ] branch CI verification
- [ ] PR merge
- [ ] post-merge `main` CI verification
- [ ] final documentation synchronization

## Completion gate

Stage 10 is not complete until the implementation is merged into `main`, the merged tree passes the complete CI pipeline, and documentation records the final evidence. A visually attractive interface without verified build/test/security evidence is not sufficient.
