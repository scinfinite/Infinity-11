# Phase 17 — Browser and Visual QA Engine

**Status:** COMPLETE
**Implementation branch:** `phase-17-browser-visual-qa-engine`
**Documentation branch:** `phase-17-documentation-closure`
**Baseline:** Phase 16 closed on `main` at `34a1a9d5459bff4ae9899b67939da5245509b8f1`; final main CI #476 passed.
**Implementation PR:** #24 — merged into `main` as `b48ca3f133a84a655e2ca0941173f1a853647729`.
**Implementation branch CI:** run #485 passed all required gates.

## Objective

Provide a provider-independent browser/visual verification boundary for application pages. The core creates deterministic QA plans, enforces policy before browser activity, delegates browser execution and image comparison to adapters, and turns browser evidence into explicit pass/fail results.

## Delivered scope

- HTTP(S) target validation with credential-bearing URLs rejected.
- Stable target identifiers and duplicate target/URL rejection.
- Bounded viewport dimensions, device scale factor, and wait time.
- Deterministic target ordering and plan checksums independent of declaration order.
- ALLOW / ASK / DENY policy evaluation before browser execution.
- Explicit approval for ASK plans.
- Browser observation adapter boundary; the core never launches a browser or executes shell commands.
- Screenshot baseline and replaceable visual-diff adapter.
- Baseline-to-target binding and validation of visual-diff evidence.
- Title, URL, and actual page body-text assertions.
- Console error, failed-request, accessibility, and visual regression detection.
- Per-target diagnostics and aggregate pass/fail evidence.
- Automated regression coverage for security, policy, deterministic planning, assertions, and visual evidence.

## Security invariants

- Only HTTP(S) URLs are accepted; embedded URL credentials are rejected.
- Browser execution remains adapter-owned.
- Viewport, device-scale, and wait settings are bounded.
- Policy is evaluated before browser side effects.
- ASK requires explicit approval.
- Baselines are bound to explicit target IDs.
- Invalid visual-diff measurements fail closed.
- Visual comparison is explicit evidence, not an AI assertion.
- SSRF/private-network authorization remains the responsibility of the browser/network policy adapter rather than a fragile URL-string denylist in the core.

## Audit findings and fixes

1. Initial branch CI exposed formatter drift in the new package and source. The exact repository Prettier output was obtained through a temporary formatter audit, applied to the source, and the temporary audit workflow was deleted before completion.
2. Content assertions were strengthened from title/URL-only checks to actual browser-observed `bodyText`.
3. Browser targets gained stable IDs so visual baselines cannot silently bind to a different target.
4. URL validation was moved to the platform URL parser and rejects non-HTTP(S) schemes and embedded credentials.
5. Device-scale-factor and wait bounds were added to prevent oversized or unbounded browser work.
6. Visual-diff evidence is rejected when the reported difference is NaN, infinite, or negative.
7. Regression tests were expanded to cover forbidden/required body content, baseline binding, credential-bearing URLs, invalid visual evidence, console/network/accessibility failures, ASK approval, policy denial, and deterministic planning.

## Verification evidence

Implementation PR #24 was merged into `main` as `b48ca3f133a84a655e2ca0941173f1a853647729` after the implementation branch passed CI run #485. The run passed:

- Format check
- Lint
- Typecheck
- Unit and contract tests
- Build
- Dependency security audit
- Secret scanning / Gitleaks

## Acceptance boundary

Phase 17 satisfies its acceptance boundary when it can:

1. validate HTTP(S) browser targets and bounded viewports/waits;
2. produce deterministic plans independent of target declaration order;
3. enforce ALLOW / ASK / DENY and explicit ASK approval;
4. delegate navigation/observation to a browser adapter;
5. compare screenshots through a replaceable visual-diff adapter;
6. detect title/URL/content, console, failed-request, accessibility, and visual regressions;
7. preserve concrete diagnostics rather than inferring success from an AI claim;
8. provide automated regression protection.

## Final completion gate

Phase 17 implementation and audit are complete. Documentation closure must be merged and the exact synchronized `main` head must pass the required post-merge CI verification before the phase is considered closed. That final main CI run is the authoritative closure evidence.
