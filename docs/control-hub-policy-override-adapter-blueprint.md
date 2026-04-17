# Control-Hub Policy-Override Adapter Blueprint

Experimental, repo-only design note.
This document describes a host-specific trial and is not part of the package's supported public API surface.

This document defines the first implementation blueprint for a narrow control-hub trial adapter inside `user-habit-pipeline`.

It is intentionally not a general workflow framework.

Its only goal is to show how a host-specific `policy_override` trial can be added without polluting the package core.

---

## 1. Trial Goal

The first trial should validate one narrow question:

Can a host-specific adapter reduce misinterpretation and silent execution risk around user `policy_override` shorthand without becoming part of the main package path?

This blueprint assumes the approved first trial scope is:

- whitelist-driven
- `policy_override` only
- clarify-first on ambiguity or conflict
- removable without destabilizing the core

It does not assume:

- generic workflow routing
- automatic approval execution
- general free-form natural-language approval parsing

---

## 2. Recommended Directory Shape

Preferred first layout:

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

Optional companion files later only if the trial proves useful:

```text
tests/
  control-hub-policy-override.test.js
  control-hub-policy-override-goldset.test.js

examples/
  control-hub/
    policy-override-demo.js
```

This layout is intentionally small.

---

## 3. File Responsibilities

### `policy_override.ts`

Primary entrypoint for the adapter.

Should own:

- adapter-level orchestration
- whitelist matching flow
- call order into mapper and question helpers
- final adapter response object

Should not own:

- durable write logic
- host execution
- generic phrase interpretation primitives

Short form:

- adapter coordinator only

### `policy_override_types.ts`

Defines adapter-local types only.

Should own:

- adapter response shape
- whitelist entry type
- adapter-specific enum-like unions

Examples:

- `PolicyOverrideMatchStatus`
- `PolicyOverrideScope`
- `PolicyOverrideMode`
- `PolicyOverrideTrialResult`

Should not move these concepts into `src/habit_core/types.ts` unless reuse across multiple hosts is proven later.

### `policy_override_whitelist.ts`

Stores the first approved phrase whitelist and narrow normalization helpers.

Should own:

- canonical phrases
- allowed phrase variants
- phrase metadata used only by this adapter

Examples:

- `这次例外`
- `默认按之前口径`
- `按老规矩`
- `这种先过`
- `风险类都给我看`
- `这次别自动推`

This file should stay declarative whenever possible.

### `policy_override_questions.ts`

Stores short clarify question templates.

Should own:

- ambiguity-specific question wording
- scope-clarification prompts
- one-time vs durable clarification prompts

Examples:

- current item vs future default
- current project vs global
- one-time override vs durable candidate

This file should not contain host UI rendering logic.

### `policy_override_goldset.ts`

Stores the first small goldset in a machine-friendly local format.

Should own:

- goldset cases
- expected scope
- expected override mode
- expected clarify behavior

This is the source of truth for adapter evaluation during the trial.

If the dataset grows large later, it can move to JSON fixtures.

### `policy_override_mapper.ts`

Maps between:

- generic semantic signals from core
- adapter-local phrases and metadata
- host-facing trial result fields

Should own:

- scope mapping
- override-mode mapping
- suggested preference write eligibility

Should not own:

- matching heuristics that belong in whitelist or adapter coordinator

---

## 4. Suggested First Input Contract

The first adapter should consume a small host-owned input object.

Recommended shape:

```ts
interface ControlHubPolicyOverrideInput {
  raw_user_text: string;
  context_type: "policy_override";
  current_action_candidate?: string | null;
  confirmed_preferences?: string[] | Record<string, unknown> | null;
  project_policy_summary?: string | Record<string, unknown> | null;
}
```

Notes:

- keep the adapter input local to the adapter
- do not force the package-wide core to adopt these field names
- the host remains responsible for building this object

---

## 5. Suggested First Output Contract

Recommended minimal adapter output:

```ts
interface PolicyOverrideTrialResult {
  match_status: "matched" | "no_match" | "ambiguous";
  phrase_type: "policy_override";
  interpreted_intent: string | null;
  scope: "current_item" | "current_project" | "global" | "unknown";
  override_mode: "one_time" | "durable_candidate" | "unknown";
  confidence: number;
  should_ask_clarifying_question: boolean;
  clarifying_question: string | null;
  suggested_preference_write: null | {
    intent: string;
    scope: "current_project" | "global";
  };
}
```

This output is intentionally narrow and host-facing.

It should not replace the package's generic outputs.

---

## 6. Call Flow Recommendation

Recommended first-stage flow:

1. host decides this is a `policy_override` candidate
2. host calls the adapter explicitly
3. adapter checks whitelist hit or high-confidence phrase variant
4. adapter derives initial scope and override-mode guess
5. if ambiguity or conflict remains, adapter returns clarify-first output
6. host decides whether to ask, ignore, or continue

Important:

- the host calls the adapter
- the adapter does not insert itself into the package's global default path

---

## 7. First-Stage Non-Goals

The first stage should explicitly refuse these goals:

- free-form approval parsing beyond whitelist phrases
- direct approval execution
- generic task routing
- project reducer participation
- status-machine mutation
- automatic durable writes
- global workflow abstraction

If the trial starts drifting into these areas, it is getting too heavy.

---

## 8. Failure-Safe Design Rules

The adapter should be easy to ignore when it is not useful.

Required behavior:

- `no_match` must be cheap and quiet
- ambiguity must degrade to clarify-first
- the host must be able to ignore adapter output and continue with explicit rules
- adapter absence must not break the package core

Recommended policy:

- high false negatives are acceptable during the first trial
- high false positives are not

---

## 9. Goldset-Driven Review Rules

Before widening the trial, the adapter should be reviewed against a small goldset.

Each goldset row should define:

- phrase
- current context
- expected intent
- expected scope
- expected override mode
- whether durable write is allowed
- whether conflict must clarify

The goal is not broad coverage.

The goal is preventing the most dangerous mistakes:

- one-time override mistaken as durable
- project-level rule mistaken as global
- conflict bypassed into silent execution

---

## 10. Promotion Criteria

Do not widen this adapter just because the first version exists.

Only consider widening after at least one real host trial shows:

- useful hit rate on approved whitelist phrases
- low false-positive rate
- clarify questions are accepted by the user
- host integration friction stays low

Only consider generalization beyond control-hub after:

- a second host wants nearly the same contract
- the field names stop being product-specific

---

## 11. Recommended Current Position

For now, treat this adapter as:

- a host-specific trial layer
- not a new package center
- not a general workflow framework

Short form:

- isolate it
- validate it
- only then consider reuse
