# Local Memory Conflict Boundary

This document defines the current boundary between `user-habit-pipeline` and any host-side local memory layer.

It answers one narrow question:

What should happen when a host's local memory and this project's explicit habit layer do not agree?

The short answer is:

- the project already prefers explicit, inspectable habit state over hidden memory
- the host must not silently override explicit habit state with hidden memory
- when the two disagree, the default behavior should be clarify-first

This is a boundary document, not a promise that the package already implements full conflict arbitration fields.

---

## 1. Why This Boundary Exists

`user-habit-pipeline` is intentionally narrow:

- it interprets repeated shorthand
- it returns inspectable structured hints
- it persists explicit user-confirmed habit overlays

It is not intended to become:

- a broad hidden memory system
- a silent long-term preference miner
- a workflow engine that executes through opaque state

Because of that boundary, conflict handling should bias toward:

- explicit over hidden
- review over automation
- clarification over silent override

---

## 2. Sources Of Meaning

In a host integration, meaning may come from multiple places:

1. shipped default registry
2. explicit user overlay in `user_habits.json`
3. current explicit message or visible short context
4. current-session suggestion cache
5. host-side local memory outside this package

These sources are not equally strong.

Current intended strength order is:

1. current explicit user confirmation
2. active explicit habit overlay
3. shipped default registry
4. current-session suggestions that are not yet confirmed
5. hidden or opaque host memory

The main design point is simple:

- hidden memory may inform a host's decision to ask a clarifying question
- hidden memory should not silently rewrite explicit habit meaning

---

## 3. Current Hard Rules

These rules are already implied by the current project principles and should be treated as binding for host integrations.

### 3.1 Explicit overlay beats hidden memory

If the user has explicitly confirmed a phrase in the active overlay, host-side hidden memory must not silently reinterpret that phrase to mean something else.

If the host thinks the meaning has drifted, it should ask the user instead of overriding the overlay.

### 3.2 Suggestion state never beats active state

Current-session suggestions are candidate hints only.

They must not:

- override active additions
- erase removals
- silently become durable habits

If a scanned suggestion disagrees with an existing active phrase, the result is a conflict to surface, not a write to apply automatically.

### 3.3 Hidden memory must not create silent durable writes

If a host learns something from its own local memory, correction history, or private cache, that knowledge must still go through explicit confirmation before it becomes part of the durable active overlay.

### 3.4 Conflict defaults to clarify-first

If a host sees disagreement between:

- its own local memory
- the package's active overlay
- or a new session suggestion

the safe default is:

- do not proceed as if the meaning is settled
- ask one short clarifying question
- wait for an explicit user answer or explicit overlay update

### 3.5 Shared and isolated runtime must be explicit

If a host uses shared runtime state, it should do so intentionally.

If a host uses isolated runtime state, it should also do so intentionally.

The host should not accidentally mix:

- personal shared shorthand state
- project-local isolated shorthand state

without making that distinction visible in setup or documentation.

---

## 4. Edge Cases To Treat As Conflicts

The project does not yet ship a formal conflict object, but hosts should already treat the following as conflict-class scenarios.

### 4.1 Host local memory disagrees with active overlay

Example:

- host memory says `继续` usually means `resume_last_task`
- active overlay says `继续` means `continue_current_direction`

Expected behavior:

- do not silently choose host memory over the overlay
- ask the user which meaning now applies

### 4.2 Session scan disagrees with active overlay

Example:

- scanned evidence suggests `收尾一下` should map to `close_session`
- active overlay already maps it to some other intent

Expected behavior:

- show it as a review situation
- require explicit user confirmation before changing the durable overlay

### 4.3 Shared personal runtime conflicts with isolated project runtime

Example:

- the user's global personal state defines one meaning
- a project-local isolated runtime defines another

Expected behavior:

- the host should decide which runtime it is using before interpretation
- do not merge both implicitly during one decision

### 4.4 Another host changes shared state unexpectedly

Example:

- one local host writes a phrase into shared state
- another host still has stale assumptions in its own local memory

Expected behavior:

- refresh from explicit registry state before treating hidden host memory as authoritative
- if outputs still disagree, ask for clarification

### 4.5 Removal tombstone conflicts with host memory

Example:

- the overlay explicitly removed a phrase
- host memory still thinks the phrase is active

Expected behavior:

- removal remains authoritative for the package layer
- the host should not resurrect that phrase without explicit add confirmation

---

## 5. What The Package Already Supports

The current package does not expose full conflict-resolution metadata, but it already supports the safer side of the boundary in several ways.

- active habit state and suggestion state are stored separately
- durable writes require explicit user action
- `should_ask_clarifying_question` already exists as a conservative fallback
- pre-action gating already gives hosts a stable `proceed` vs `ask_clarifying_question` decision surface
- shared vs isolated runtime strategy is already documented

Relevant docs:

- [project-principles.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/project-principles.md)
- [cross-host-integration-guide.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/cross-host-integration-guide.md)
- [codex-current-session-contract.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/codex-current-session-contract.md)
- [pre-action-host-integration.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/pre-action-host-integration.md)

---

## 6. What Is Not Yet Formalized

The current repo still does not define a full memory conflict resolution protocol.

Missing pieces include:

- a structured `memory_conflict_detected` field
- a standard `conflict_sources` payload
- source timestamps such as `last_confirmed_at`
- a host contract field describing shared vs isolated runtime mode
- a machine-readable precedence declaration in API responses

So the current project stance is:

- the boundary is designed
- the implementation is still principle-first, not protocol-complete

---

## 7. Host Integration Guidance

If you integrate this package into a host that also has local memory, use these rules.

1. Decide runtime mode first: shared or isolated.
2. Load explicit package state before consulting hidden host memory.
3. Never let hidden memory silently override active overlay state.
4. If signals disagree, ask a clarifying question instead of acting confidently.
5. Only convert a new meaning into durable overlay state through explicit confirmation.

Recommended one-line host policy:

- explicit overlay may guide action
- hidden memory may guide clarification
- hidden memory must not silently rewrite explicit overlay

---

## 8. Future Low-Cost Upgrade Path

If the project later wants stronger host interoperability, the next worthwhile upgrade is small and focused.

Add a documented conflict payload such as:

- `memory_conflict_detected`
- `conflict_sources`
- `recommended_resolution`

Recommended default resolution:

- `recommended_resolution = ask_clarifying_question`

That would strengthen host integrations without pushing the package into a broad hidden memory platform.
