# Workflow Adapter Modularization

Experimental, repo-only guidance.
This document is for architecture direction inside the repository and is not part of the package's supported public API surface.

This document records how host-specific or workflow-specific integration logic should evolve inside `user-habit-pipeline` without breaking the project's lightweight core.

It exists because some integrations are valuable only for one host or one workflow.
Those integrations should not automatically become part of the package's global core contract.

The current motivating example is a narrow control-hub trial around `policy_override` interpretation.

---

## 1. Core Rule

When a new feature is clearly tied to one host, one workflow, or one product surface, prefer an isolated adapter module instead of expanding the global core.

Short form:

- core stays narrow
- adapters absorb host-specific semantics

This protects the package from drifting into:

- workflow orchestration
- host-specific business logic
- fake generic abstraction created too early

---

## 2. What Counts As Adapter-Specific

A feature should usually live in an adapter module when it includes several of the following:

- host-specific `context_type` values
- workflow-specific output fields
- product-specific scope rules
- product-specific phrase whitelists
- custom clarification wording tied to one UI
- business terms that are not meaningful for most hosts

Typical examples:

- approval-board wording
- workflow-specific `policy_override` contracts
- host-owned routing hints
- one-system-only goldset fixtures

If the behavior only makes sense inside one product, it should not become a default package-wide concept yet.

---

## 3. What Must Stay In Core

The following kinds of logic should remain in the shared core unless there is strong evidence they are host-specific:

- shorthand interpretation primitives
- confidence and clarification logic
- explicit-vs-hidden memory boundary rules
- durable user preference persistence primitives
- current-session suggestion extraction primitives
- pre-action decision helpers that are host-agnostic

Current examples:

- `interpretHabit`
- `interpretHabitForPreAction`
- `buildPreActionDecision`
- `buildMemoryConflictDecision`

These are reusable semantic primitives.
They should not be renamed or reshaped around one host's business language.

---

## 4. What Belongs In An Adapter

The following kinds of logic should usually live in an adapter module:

- host-specific input mapping
- workflow-specific output mapping
- phrase whitelists for one trial or one product
- host-specific scope interpretation
- host-specific clarification prompts
- host-specific goldsets and fixtures
- policy templates that only one host currently uses

Examples for a future control-hub adapter:

- `policy_override` phrase whitelist
- `current_item / current_project / global / unknown` scope mapping
- one-time override vs durable-candidate mapping
- control-hub-specific clarify messages

---

## 5. Lightweight-State Protection Rules

Adapter modularization is intended to preserve the package's lightweight state, not weaken it.

To stay lightweight, adapter modules should follow these rules:

1. Do not add new npm dependencies unless the value is unusually clear.
2. Do not change the package's default CLI or HTTP behavior just because one adapter needs extra fields.
3. Do not make core flows depend on the adapter being present.
4. Do not introduce new top-level product concepts unless multiple hosts truly need them.
5. Do not move host business terms into the shared core type layer without strong reuse evidence.

If an adapter requires the user to learn a second full product surface, it is already too heavy.

---

## 6. Preferred Directory Pattern

For one-host or one-workflow integrations inside this repository, prefer:

```text
src/
  adapters/
    <host_or_surface>/
      <narrow_feature>.ts
      <narrow_feature>_types.ts
      <narrow_feature>_whitelist.ts
      <narrow_feature>_questions.ts
      <narrow_feature>_goldset.ts
      <narrow_feature>_mapper.ts
```

For example:

```text
src/
  adapters/
    control_hub/
      policy_override.ts
      policy_override_types.ts
      policy_override_whitelist.ts
      policy_override_questions.ts
      policy_override_goldset.ts
      policy_override_mapper.ts
```

This pattern keeps the adapter explicit without pretending it is generic before that has been proven.

---

## 7. Default Recommendation For The Current Project

When in doubt, use this sequence:

1. add a small adapter module inside the current repository
2. validate the adapter through one real host trial
3. keep the adapter out of the main default contract while the trial is young
4. only generalize after a second real host proves reuse

This sequence is intentionally conservative.

It avoids the two common failure modes:

- host-specific logic leaking into core
- premature framework design for imagined future workflows

---

## 8. When Not To Modularize

Do not create a separate adapter module when the new behavior is plainly core and host-agnostic.

Good reasons to keep logic in core:

- every host needs the same interpretation primitive
- the output is still generic and inspectable
- the behavior strengthens the package boundary for all integrations
- the naming does not depend on one product's workflow language

Examples:

- generic clarify-first routing helpers
- generic local-memory conflict decisions
- generic current-session suggestion extraction

Creating an adapter for obviously core behavior only adds ceremony.

---

## 9. When To Extract Beyond The Current Repository

Do not split an adapter into a new package or repository just because it exists.

A host-specific adapter is mature enough to extract only when at least two of the following are true:

- a second host or workflow needs nearly the same contract
- most of the adapter fields and rules are no longer tied to one product's language
- the adapter now has its own real release cadence
- extraction would reduce, not increase, user cognitive load

Until then, keeping the adapter inside this repository is usually the lighter choice.

---

## 10. Review Checklist

Before landing a host-specific adapter, check:

1. Does this logic belong to one host or one workflow more than to the core package?
2. Can the package still run normally when this adapter is absent?
3. Are we preserving current default CLI, HTTP, and library behavior?
4. Are we avoiding new top-level concepts that only one host needs?
5. Could this adapter be deleted later without destabilizing the core?

If the answer to these questions is unfavorable, the design is probably too heavy.

---

## 11. Recommended Current Position

For the current project direction, the best default is:

- keep `user-habit-pipeline` as the narrow semantic core
- place workflow- or host-specific trial logic under `src/adapters/...`
- treat adapters as explicit integration layers, not as new product centers

Short form:

- modularize to isolate
- do not modularize to over-abstract

For the current control-hub `policy_override` trial, see:

- [control-hub-policy-override-adapter-blueprint.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/control-hub-policy-override-adapter-blueprint.md)
