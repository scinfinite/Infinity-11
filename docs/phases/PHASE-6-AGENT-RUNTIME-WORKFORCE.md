# INFINITY-11 — Stage 6: Agent Runtime / AI Workforce

> **Status:** IN PROGRESS
> **Started:** 2026-09-14
> **Roadmap stage:** 6 — agent runtime and AI workforce
> **Prerequisite:** Stage 5 merged into `main` and final CI verified

## Objective

Build a provider-neutral, governed execution runtime for individual agents and dynamic specialist teams. Agents must have explicit model, skill, context, memory, permission, and budget boundaries. Side effects must remain policy-controlled and observable.

## Scope

- agent definitions and registry;
- agent run state machine;
- task graph and bounded delegation;
- model policy;
- tool and skill binding;
- context and memory policies;
- explicit ALLOW / ASK / DENY governance;
- bounded iterations, tool calls, children, parallel workers and timeout;
- approval waits;
- Team Lead specialist selection;
- parallel specialist execution;
- run/event/performance records;
- cancellation and failure recording;
- provider-neutral model and tool interfaces.

## Security requirements

- Never upgrade DENY or ASK to ALLOW implicitly.
- ASK requires an approval gate; unavailable approval infrastructure fails closed.
- Tool capabilities are checked before execution.
- Workspace/project/correlation context is carried into every run and event.
- Agent budgets are hard runtime boundaries, not advisory metadata.
- Child delegation is bounded and cannot recurse without a depth limit.
- Tool/model providers remain adapters behind neutral contracts.
- Run records and events must not contain credentials or secret material.

## Acceptance checklist

- [x] agent definition contract
- [x] agent run lifecycle/state machine
- [x] task representation
- [x] model policy boundary
- [x] tool registry and execution boundary
- [x] skill registry/binding boundary
- [x] context policy boundary
- [x] memory policy boundary
- [x] permission policy boundary
- [x] iteration/tool/child/parallel/timeout budget fields
- [x] approval wait boundary
- [x] Team Lead specialist selection
- [x] bounded parallel worker execution
- [x] performance records
- [x] event/audit boundary
- [x] cancellation boundary
- [x] integration coverage
- [ ] final CI verification
- [ ] PR merge into `main`
- [ ] post-merge `main` verification
- [ ] final repository inspection

## Verification record

Initial implementation is on `stage-6-agent-runtime-workforce`. CI and code review are still required before this stage may be declared complete.
