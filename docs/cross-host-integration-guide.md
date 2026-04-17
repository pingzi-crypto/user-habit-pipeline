# Cross-Host Integration Guide

This guide explains how to use `user-habit-pipeline` across different local host types without losing clarity about:

- which integration path to choose
- who owns execution
- where runtime user state should live
- when state should be shared vs isolated

It is written for the project direction that now matters most:

- `user-habit-pipeline` is a semantic layer
- hosts decide and execute
- durable preference writes stay explicit

---

## 1. The Three Main Host Paths

Today the project supports three primary host integration styles:

1. Node host through library calls
2. any-language host through CLI calls
3. conversation host through `codex-session-habits`

There is also a localhost HTTP path, but that is best understood as an alternate transport for a local host, not a fourth product category.

There are also repo-only experimental adapter notes for host-specific trials:

- control-hub `policy_override`

This is not a new main integration path.
It is not part of the package's supported public API surface.

---

## 2. Which Path To Choose

### 2.1 Node host

Choose this when:

- the host already runs on Node.js
- you want the smallest integration surface
- you want direct access to pre-action semantic gating

Best entrypoints:

- `interpretHabit`
- `interpretHabitForPreAction`
- `buildPreActionDecision`

Best fit:

- local agent shells
- Electron apps
- Node backend tools
- host-side router logic before downstream action

Main benefit:

- lowest overhead and strongest type of semantic integration

Main fragility:

- the host is directly coupled to the package API surface

Recommended default:

- use this path first if your host is already Node-based

---

### 2.2 CLI host

Choose this when:

- the host is not Node.js
- you want the most stable JSON subprocess boundary
- you do not want to embed package logic directly

Best entrypoints:

- `user-habit-pipeline`
- `manage-user-habits`

Best fit:

- Python tools
- Go or Rust local apps
- shell-first automation
- desktop tools that already spawn subprocesses

Main benefit:

- easy to integrate from almost any stack

Main fragility:

- slightly more process-management overhead
- less natural for high-frequency in-process calls

Recommended default:

- use this path first for non-Node hosts unless the host strongly prefers HTTP

---

### 2.3 Conversation host

Choose this when:

- the host already owns visible conversation text
- the user should trigger habit review from natural prompts
- the flow should stay inside the chat UI

Best entrypoint:

- `codex-session-habits`

Best fit:

- Codex-style current-session integrations
- chat-based assistant shells
- hosts that can present candidate previews and short follow-ups inline

Main benefit:

- lowest user cognitive load for current-session suggestion review

Main fragility:

- the host must own visible transcript gathering well
- bad transcript selection reduces suggestion quality

Recommended default:

- use this path when the user experience should feel like one short in-thread command, not a separate tool panel

---

### 2.4 Local HTTP transport

Choose this when:

- the host strongly prefers HTTP as its internal boundary
- you want a localhost contract instead of direct library calls or CLI subprocesses
- another local process will host the service

Best entrypoints:

- `user-habit-pipeline-http`
- `startHttpServer`
- `createHttpServer`

Main benefit:

- transport neutrality for local tools

Main fragility:

- one more process or server lifecycle to manage
- easy to over-position as a remote product API even though it is intentionally local-only

Recommended default:

- use this only when HTTP is already the natural host boundary

---

## 3. Decision Table

If you need the fastest choice, use this:

- Node host that needs pre-action semantic gating: library
- non-Node host that just needs JSON I/O: CLI
- chat host with visible transcript access: `codex-session-habits`
- local multi-process system that already standardizes on HTTP: local HTTP

Short form:

- same-process Node: library
- cross-language local app: CLI
- in-thread UX: current-session bridge
- transport-first local system: HTTP

---

## 4. Host Ownership Rules

No matter which path you choose, keep ownership boundaries clear.

`user-habit-pipeline` owns:

- shorthand interpretation
- suggestion extraction
- candidate ranking
- confidence and clarification logic
- explicit habit persistence primitives

The host owns:

- action execution
- workflow routing
- tool selection
- transcript capture
- UI rendering
- whether and when to ask the user for clarification

If these boundaries blur, the project loses its main advantage.

---

## 4.1 Host-Specific Adapter Rule

Experimental, repo-only guidance.
Use this section for architecture direction, not as a promise of packaged public APIs.

If one host needs workflow-specific semantics that do not belong in the shared package core, isolate them as an adapter.

Current example:

- control-hub `policy_override`

Use this pattern when:

- one host has a narrow workflow-specific shorthand problem
- the host can explicitly decide when to invoke the adapter
- ambiguity should downgrade to clarify-first

Do not use this pattern to:

- replace the core interpreter
- add generic workflow orchestration
- add execution behavior to the package
- make the shared core depend on one product surface

Reference docs:

- [workflow-adapter-modularization.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/workflow-adapter-modularization.md)
- [control-hub-policy-override-adapter-blueprint.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/control-hub-policy-override-adapter-blueprint.md)

---

## 5. Runtime State Strategy

The most important cross-host decision is not transport.
It is runtime state ownership.

Today the package stores user state outside the installed package directory by default.

Default locations:

- Windows: `%APPDATA%\\user-habit-pipeline\\user_habits.json`
- non-Windows: `~/.config/user-habit-pipeline/user_habits.json`

Override:

- `USER_HABIT_PIPELINE_HOME`

This means each host integration has two sane strategies:

1. shared state
2. isolated state

---

## 6. When To Share State

Choose shared state when:

- multiple local hosts belong to the same user
- shorthand meaning should stay consistent across those hosts
- the user expects one personal habit layer, not per-app variation

Examples:

- Codex plus a local Electron companion
- one Node host plus one Python tool used by the same person

Benefits:

- less duplicate habit maintenance
- one phrase meaning can travel across hosts
- stronger cross-host semantic consistency

Main risk:

- one host can introduce habits that affect another host unexpectedly if the user does not realize they share state

Recommended rule:

- share state only when the user benefit of semantic consistency is obvious

---

## 7. When To Isolate State

Choose isolated state when:

- the host is project-specific
- the environment is a demo or sandbox
- different projects should not share shorthand assumptions
- you are recording or testing and want reproducible local state

Examples:

- demo repositories
- CI or smoke runs
- a client project with domain-specific shorthand
- parallel experiments

Benefits:

- reproducible behavior
- no accidental leakage from another host or project
- easier debugging

Main risk:

- the user may end up with too many separate habit layers if isolation is used everywhere

Recommended rule:

- isolate by default for demos, tests, and project-specific integrations

---

## 8. Recommended Runtime Patterns

### 8.1 Personal multi-host setup

Use:

- default global runtime location

Why:

- easier cross-host consistency

### 8.2 Project demo or public example

Use:

- `USER_HABIT_PIPELINE_HOME=<project-local-runtime>`

Why:

- keeps demos reproducible
- avoids contaminating the user's normal personal state

### 8.3 Host starter template

Use:

- project-local runtime during onboarding examples
- optional note explaining how to switch to shared personal state later

Why:

- new users should not have to debug hidden old local state

### 8.4 Team or shared machine environment

Use:

- explicit host-owned runtime path

Why:

- default global paths can create confusing overlap across users or projects

---

## 9. Recommended Defaults By Host Type

Node library host:

- shared state for personal tools
- isolated state for demos or project-specific assistants

CLI host:

- isolated state first if the tool is embedded inside a project workflow
- shared state only when the tool is clearly a personal assistant companion

Conversation host:

- isolated state for demo and host integration work
- shared state only when the conversation host is intended to represent the user's main personal shorthand layer

HTTP host:

- whatever the server process owns should be explicit
- never rely on accidental machine-global sharing without documenting it

---

## 10. Current Best Entry Docs

Use these together:

- [integration-quickstart.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/integration-quickstart.md)
- [pre-action-host-integration.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/pre-action-host-integration.md)
- [codex-current-session-contract.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/codex-current-session-contract.md)
- [local-memory-conflict-boundary.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/local-memory-conflict-boundary.md)
- [workflow-adapter-modularization.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/workflow-adapter-modularization.md)
- [happy-path-demo.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/happy-path-demo.md)

Use this guide when the question is:

- which host path should I choose
- should this host share or isolate runtime state
- how should host local memory behave when it disagrees with explicit habit state
- where should host-specific workflow trial logic live without polluting the core package

---

## 11. Practical Recommendation

If you want one pragmatic default recommendation:

- Node host: library + pre-action gate
- chat host: `codex-session-habits`
- non-Node host: CLI
- demos and onboarding: isolated runtime state
- long-lived personal assistant setups: shared runtime state

That is the simplest cross-host strategy that stays aligned with the current project boundary.
