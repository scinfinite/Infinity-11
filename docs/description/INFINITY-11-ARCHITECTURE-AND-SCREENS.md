# INFINITY-11 — Architecture and Screen Specification

## 1. Product shell

INFINITY-11 uses a persistent, responsive application shell. Desktop uses a collapsible sidebar and a workspace canvas; mobile uses purpose-built navigation rather than a compressed desktop layout.

## 2. Primary navigation

```text
CORE
Home
Chat
Projects
History
Library

CREATE
Code
Build
Design
Media
Research

AI
Agents
Skills
Models
Router
Evaluations

AUTOMATE
Workflows
Automations
Tasks

DEVELOP
GitHub
MCP
Integrations
API Playground
Deployments

SYSTEM
API Keys
Usage
Security
Activity
Settings
```

## 3. Home

The Home dashboard is the AI command center. It provides a universal prompt entry point, recent projects, quick actions, provider/model health, active agents, workflow status, usage, and recent activity.

## 4. Chat

The Chat workspace supports multimodal conversations, attachments, model selection, agent invocation, file context, project context, tools, MCP, streaming, conversation branching, and per-message model changes.

The composer should expose:

- attachment controls
- model/router selector
- agent selector
- project context
- file context
- command palette integration
- run/stop controls

## 5. Projects

Projects are the central organizational unit. A project can contain conversations, code, files, agents, skills, workflows, knowledge, GitHub state, MCP configuration, environment configuration, previews, and deployments.

## 6. Code workspace

The Code workspace resembles a modern browser IDE:

```text
┌────────────┬──────────────────────────┬────────────────────┐
│ File Tree  │ Editor                   │ AI Agent            │
│            │                          │                     │
│ src/       │ code                     │ plan                │
│ tests/     │ diff                     │ tool calls          │
│ package    │ diagnostics              │ changes             │
├────────────┴──────────────────────────┴────────────────────┤
│ Terminal / Problems / Logs / Git / Preview                 │
└────────────────────────────────────────────────────────────┘
```

AI changes should be reviewable as diffs. The workspace should support terminal execution through an appropriate isolated environment.

## 7. Build workspace

The Build workspace turns an idea into an executable project. It collects requirements, architecture preferences, framework/database/deployment choices, creates an isolated E2B sandbox, generates code, runs checks, displays a live preview, and supports iterative feedback.

## 8. Design workspace

The Design workspace supports image generation/editing, UI concepts, design systems, screenshot analysis, brand assets, and design-to-code workflows.

## 9. Media workspace

Media is organized by capability: image, video, audio, voice, music, and documents. Provider/model options are dynamically filtered according to capability metadata.

## 10. Research workspace

Research provides source collection, evidence extraction, cross-checking, notes, citations, files, and generated reports. Source metadata should remain attached to externally sourced claims where applicable.

## 11. Agents

The Agents screen lists user agents and their state. The Agent Builder configures instructions, models, tools, skills, memory, permissions, budgets, limits, and approvals.

## 12. Agent run screen

An agent run should expose a live timeline:

```text
Task received
Context assembled
Model selected
Tool requested
Permission checked
Tool executed
Observation received
Reasoning continued
Verification started
Completed
```

For multi-agent runs, use a graph/timeline showing parent and child tasks and their dependency state.

## 13. Skills

Skills are reusable behavioral/tooling units attached to agents or invoked by workflows. They should be versioned and portable.

## 14. Models

The Models dashboard supports search, filters, favorites, capability inspection, provider association, context limits, routing preferences, health, and model comparison.

## 15. Router

The Router screen explains the active routing policy and recent routing decisions. It should support Manual, Auto, Best, Fastest, Cheapest, Free-only, and Custom policies.

## 16. API Keys

The API Keys dashboard groups credentials by provider. Each key shows a masked identifier, health, last-used metadata, observed usage, provider-reported quota when available, and errors. Raw secrets are never displayed after secure entry.

## 17. Provider dashboard

Providers expose connection health, supported capabilities, configured keys, models, usage, and failure information.

## 18. MCP

The MCP hub manages MCP servers, discovered tools, permissions, connection health, and execution history. Tools are presented with explicit permissions.

## 19. Integrations

The Integrations marketplace-like screen groups services by category and exposes authentication, permissions, capabilities, health, and supported actions.

## 20. GitHub

GitHub pages provide repository connection, branches, files, issues, pull requests, reviews, CI status, and agent-driven development workflows subject to permissions.

## 21. Deployments

Deployments display environment, commit/version, build state, runtime state, logs, rollback/redeploy actions, and provider information.

## 22. Library

The Library is the persistent artifact and knowledge area for files, generated outputs, documents, prompts, research, project artifacts, and other saved resources.

## 23. Knowledge

Knowledge views sources, indexing status, chunks/retrieval metadata where appropriate, and project associations.

## 24. Workflows

The Workflow Builder uses a visual graph with triggers, agents, tools, conditions, tasks, and outputs. Execution history displays queued/running/waiting/success/failed/cancelled/retrying states.

## 25. Usage

Usage shows requests, tokens, latency, failures, fallbacks, provider/model distribution, project consumption, agent consumption, and cost/estimate metadata.

## 26. Security Center

Security displays credential warnings, permission risks, suspicious activity, agent policies, MCP permissions, repository exposure, deployment concerns, and dependency findings where available.

## 27. Activity

Activity is a searchable audit/event timeline for important user, agent, integration, tool, workflow, repository, and deployment events.

## 28. Settings

Settings include profile, workspace, appearance, AI defaults, routing defaults, privacy, notification preferences, developer preferences, integrations, security policies, and experimental features.

## 29. Command palette

A global command palette should provide fast navigation and actions through `Ctrl/Cmd + K`.

## 30. Mobile

Mobile navigation should prioritize Home, Chat, Build, Agents, and More, with sheets/drawers for advanced controls.

## 31. Visual language

The product should feel premium, polished, futuristic, and professional without excessive visual effects. Use strong hierarchy, subtle depth, restrained gradients, smooth animation, clear status indicators, and accessible contrast.

## 32. Motion

Motion should communicate state: loading, streaming, transition, completion, warning, and failure. Respect reduced-motion preferences.

## 33. Responsive behavior

Desktop can use multi-pane layouts; tablets should collapse secondary panes; mobile should use focused single-pane workflows with contextual sheets.

## 34. Context inspector

The UI should let power users inspect system instructions, project context, memory, files, knowledge, tools, MCP servers, and conversation context included in a model request.

## 35. Observability UI

Advanced users should be able to inspect a request trace from user intent through routing, provider/key selection, model call, tool call, sandbox execution, verification, and final artifact.

## 36. Human approval UI

Privileged actions must produce explicit approval surfaces showing the requested operation, affected resource, reason, permissions, and available actions.

## 37. Accessibility

The interface should support keyboard navigation, semantic structure, screen readers, visible focus, accessible dialogs, adequate contrast, and reduced motion.

## 38. PWA

The application shell should be installable as a PWA with responsive behavior, offline shell handling, appropriate caching, app metadata, and supported notifications. Network-dependent AI operations must communicate offline state clearly.

## 39. Design system boundaries

Shared UI primitives belong in a reusable UI package. Product features should compose primitives rather than duplicating styling and interaction logic.

## 40. Screen principle

Every screen should answer three questions clearly: what is happening, what can the user do next, and what permissions or external effects are involved.
