# INFINITY-11 — Architecture & Screen Specification

> **Status:** Active implementation specification
> **Current baseline:** Phases 1–10 complete and CI verified
> **Next:** Phase 11 — Advanced Application Builder Foundation
> **V1 roadmap:** `INFINITY-11-V1-ROADMAP.md`, Phases 1–110
> **Strategy:** FREE-FIRST + OPEN-SOURCE-FIRST + BYOK-FIRST

## 1. Architectural intent

INFINITY-11 unifies AI chat, software engineering, application building, research, multimodal creation, agent workforce, automation, execution, verification, GitHub, deployment, and operations while remaining independent of any single AI provider, sandbox, database, or deployment vendor.

## 2. Architecture planes

```text
┌──────────────────────────────────────────────────────────────┐
│ EXPERIENCE                                                   │
│ Chat • Code • Build • Design • Research • Media • Projects  │
│ Agents • Workflows • Command Center • PWA • Preview         │
├──────────────────────────────────────────────────────────────┤
│ CONTROL                                                      │
│ Identity • Workspace • Policy • Permissions • Cost • Audit  │
│ Approvals • Security • Observability • Governance            │
├──────────────────────────────────────────────────────────────┤
│ INTELLIGENCE                                                 │
│ AI Gateway • Models • Routing • Credentials • Context       │
│ Project Brain • Memory • Knowledge • Research • Evaluation  │
├──────────────────────────────────────────────────────────────┤
│ EXECUTION                                                    │
│ Agents • Tasks • Tools • MCP • Browser • Terminal           │
│ Sandboxes • Worktrees • Workflows • Background Jobs         │
├──────────────────────────────────────────────────────────────┤
│ ADAPTERS                                                     │
│ AI Providers • Local Models • GitHub • Database • Storage   │
│ Sandbox Providers • Deployment Providers • Integrations     │
├──────────────────────────────────────────────────────────────┤
│ DATA                                                         │
│ Domain State • Events • Usage • Audit • Execution State     │
│ Knowledge Indexes • Artifacts • Migrations                   │
└──────────────────────────────────────────────────────────────┘
```

## 3. Core execution flow

```text
User intent
→ Identity
→ Policy
→ Context
→ AI Gateway
→ Model / Credential routing
→ Agent / Tool / Execution
→ Verification
→ Artifact / Repository / Deployment
→ Observability
→ Project Brain
```

## 4. Provider architecture

Providers implement capability adapters rather than leaking vendor-specific behavior into product code.

```text
ModelProvider
├── discover models
├── discover capabilities
├── validate credential
├── text / streaming
├── vision
├── image
├── audio
├── video
├── embeddings
├── usage
└── health
```

Not every provider must implement every capability. The registry records actual support.

## 5. Credential architecture

```text
Provider
├── Credential A
├── Credential B
└── Credential C
```

Credentials have independent lifecycle and routing state. Raw secrets are never returned to normal UI output.

## 6. Routing architecture

```text
Task
→ Capability requirements
→ Candidate models
→ Credential eligibility
→ Provider health
→ Quota signal
→ Cost
→ Latency
→ Historical performance
→ Project policy
→ Route
→ Bounded fallback
```

Routing modes include manual, auto, quality-first, speed-first, cost-first, free-only, local-only, provider-preferred, capability-first, and custom policy.

## 7. Agent architecture

```text
Agent
├── identity
├── role
├── capabilities
├── skills
├── tools
├── model policy
├── context policy
├── memory policy
├── permission policy
├── execution profile
├── verification policy
├── budget policy
├── workspace
├── schedule
└── history
```

Teams dynamically combine specialist workers. Independent work may run in parallel. Synthesis and verification remain explicit.

## 8. Workflow architecture

```text
Trigger
→ Workflow
→ Agent / Tool / Action
→ Decision
→ Condition
→ Parallel / Loop
→ Approval
→ Verify
→ Retry / Recover
→ Resume
→ Audit
```

Long-running runs use durable state and explicit recovery semantics.

## 9. Execution architecture

```text
ExecutionManager
├── Local
├── Docker
├── E2B
├── Vercel / compatible managed execution
├── Self-hosted
└── Future providers
```

E2B is an adapter, never the architectural center.

## 10. Application builder architecture

```text
Idea
→ Requirements
→ Architecture
→ Scaffold
→ Frontend
→ Backend
→ Database
→ Auth
→ APIs
→ Tests
→ Security
→ Browser QA
→ Improvement
→ GitHub
→ CI
→ Deploy
```

The builder supports multi-language engineering including Java, Python, TypeScript/JavaScript, Go, Rust and other supported toolchains.

## 11. Project Brain and context

```text
Conversation
Repository
Symbols
Project Brain
Skills
Memory
Knowledge
Tools
MCP
Policies
      ↓
Retrieve → Rank → Compress → Budget → Assemble
```

Project Brain stores requirements, architecture, decisions, conventions, dependencies, codebase maps, known bugs, failed approaches, successful patterns, tests, security findings, deployments, agent history, model performance, and lessons.

## 12. Verification architecture

```text
Change
→ Unit
→ Integration
→ Static analysis
→ Security
→ Performance
→ Build
→ Browser / Visual QA
→ Accessibility / UX
→ Review
→ Evidence
```

Verification evidence is separate from model claims.

## 13. Browser / visual QA

```text
Build / Preview
→ Browser
→ DOM
→ Console
→ Network
→ Screenshot
→ Accessibility
→ Visual evaluation
→ Issue
→ Repair
→ Regression
```

## 14. Security architecture

```text
Capability request
→ Policy
→ Risk classification
→ ALLOW / ASK / DENY
→ Execute
→ Audit
```

Sensitive capabilities include filesystem write/delete, shell, network, GitHub write, database write, deployment, secret use, browser control, and MCP.

## 15. GitHub lifecycle

```text
Issue
→ Plan
→ Worktree
→ Implement
→ Test
→ Security
→ Review
→ PR
→ CI
→ Fix
→ Merge
→ Deploy
→ Observe
```

## 16. Deployment architecture

```text
DeploymentProvider
├── Vercel
├── Cloudflare
├── Netlify
├── Railway
├── Render
├── Docker
└── Self-hosted
```

Deployment providers remain replaceable.

## 17. Screen system

### Global shell

```text
┌──────────────────────────────────────────────────────────────┐
│ Workspace • Search • Command Palette • Notifications • User │
├───────────────┬──────────────────────────────┬──────────────┤
│ Navigation    │ Primary workspace            │ Context      │
│ Home          │                              │ Inspector    │
│ Chat          │                              │ Files        │
│ Projects      │                              │ Models       │
│ Code          │                              │ Tools        │
│ Build         │                              │ Activity     │
│ Design        │                              │              │
│ Research      │                              │              │
│ Agents        │                              │              │
│ Workflows     │                              │              │
└───────────────┴──────────────────────────────┴──────────────┘
```

### Command Center

Shows active projects, runs, workflows, approvals, provider/model health, recent artifacts, verification warnings, security warnings, and usage/cost information.

### AI Workspace

Supports multimodal composer, model selection, routing mode, project context, attachments, files, agent invocation, tools, MCP, streaming, cancellation, retry, branching, and artifact creation.

### Project workspace

```text
Project
├── Overview
├── Chat
├── Files
├── Code
├── Build
├── Agents
├── Skills
├── Knowledge
├── Workflows
├── GitHub
├── Preview
├── Deployments
└── Activity
```

### Application Builder workspace

```text
Requirements | Architecture | Files | Editor | Terminal
Preview      | Tests        | Browser QA | Agent | Diff
```

### Agent workspace

Shows agent identity, current task, model/credential route, tools, permissions, budget, context, events, outputs, verification, and history.

### Workflow workspace

Shows visual nodes, triggers, conditions, agent/tool nodes, approvals, retries, execution state, logs, checkpoints, and recovery.

### Model / credential workspace

Shows providers, models, capabilities, credential health, routing policies, usage, cost, fallback state, and observable route explanations. Raw secrets remain hidden.

### Security workspace

Shows policy, capability requests, approvals, denied actions, active sessions, sandbox state, MCP trust, secret events, and audit history.

### Operations workspace

Shows deployments, health checks, logs, metrics, traces, incidents, rollbacks, recovery, and release state.

## 18. Responsive rules

Desktop can use multi-column workspaces. Tablet reduces secondary context. Mobile converts side panels into drawers/sheets and preserves core workflows. Keyboard focus, semantic controls, readable states, and reduced-motion behavior remain mandatory.

## 19. UI implementation boundary

The UI is presentation and interaction. Backend/runtime systems own inference, orchestration, policy, routing, durable execution, credentials, verification, and external side effects. The browser must not recreate those responsibilities.

## 20. Current product boundary

Phase 10 is the verified web/PWA baseline. Later phases connect the visible boundaries to deeper runtime functionality. The UI must never fabricate a live feature merely because its screen exists.

## 21. V1 completion

The architecture is developed through 110 independent phases defined in `INFINITY-11-V1-ROADMAP.md`. Phase 110 is the V1 closure gate.
