# Phase 17 — Browser and Visual QA Engine

**Status:** IN PROGRESS
**Implementation branch:** `phase-17-browser-visual-qa-engine`
**Baseline:** Phase 16 is closed on `main` at `34a1a9d5459bff4ae9899b67939da5245509b8f1` with final main CI #476 passed.

## Objective

Provide a provider-independent browser/visual verification boundary for application pages. The core creates deterministic QA plans, enforces policy before browser activity, delegates browser execution and image comparison to adapters, and turns browser evidence into explicit pass/fail results.

## Acceptance boundary

1. validate HTTP(S) browser targets and bounded viewports/waits;
2. produce deterministic plans independent of target declaration order;
3. enforce ALLOW / ASK / DENY and explicit ASK approval;
4. delegate navigation/observation to a browser adapter;
5. compare screenshots through a replaceable visual-diff adapter;
6. detect title/URL/content, console, failed-request, accessibility, and visual regressions;
7. preserve concrete diagnostics rather than inferring success from an AI claim;
8. provide automated regression protection.

## Security invariants

- Only HTTP(S) URLs are accepted.
- Browser execution is adapter-owned; the core does not launch a browser or execute arbitrary shell commands.
- Viewport and wait settings are bounded.
- Policy is evaluated before browser side effects.
- ASK requires explicit approval.
- Visual comparison is explicit evidence, not an AI assertion.

## Final completion gate

Phase 17 is complete only after implementation audit, branch CI, documentation synchronization, merge, and exact synchronized `main` CI all pass.
