# Registry Authoring

This project treats the habit registry as explicit data, not as hidden workflow logic.

The goal of a registry is to describe repeated shorthand expressions in a way that stays:

- inspectable
- conservative
- reusable
- removable

If a rule starts deciding workflow actions instead of describing shorthand meaning, it no longer belongs in the registry.

---

## Required Fields

Each rule must contain:

- `phrase`
- `normalized_intent`
- `scenario_bias`
- `confidence`

Example:

```json
{
  "phrase": "归档一下",
  "normalized_intent": "archive_current_thread",
  "scenario_bias": ["general", "session_close"],
  "confidence": 0.91
}
```

---

## Schema Artifact

This repository includes a formal JSON Schema at:

- [registry.schema.json](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/registry.schema.json)

Use it when wiring editor assistance or external validation tooling around registry files.
The runtime still uses the built-in validator, but the schema provides a stable format contract for tooling.

---

## Optional Fields

Use optional fields only when they improve inspectability.

- `match_type`
- `preferred_terms`
- `disambiguation_hints`
- `notes`
- `clarify_below`

Example:

```json
{
  "phrase": "继续",
  "normalized_intent": "continue_current_track",
  "scenario_bias": ["reviewer", "executor", "general"],
  "confidence": 0.68,
  "match_type": "exact",
  "clarify_below": 0.8,
  "preferred_terms": ["general"],
  "disambiguation_hints": ["Need clearer local target for \"continue\"."],
  "notes": ["Meaning depends on local context and may require clarification if context is weak."]
}
```

---

## Authoring Rules

### Keep intents generic

Prefer intent names that can survive across projects.

Good:

- `close_session`
- `review_acceptance`
- `draft_text_artifact`

Avoid project-specific workflow decisions in intent names.

Avoid:

- `switch_to_reviewer_and_close_ticket`
- `update_growth_hub_now`

### Keep phrases explicit

Rules should cover stable shorthand that users actually repeat.
Do not add broad semantic paraphrases just to increase coverage.

Good:

- `更新入板`
- `session-close`
- `继续评审`

Avoid:

- large collections of loosely related synonyms
- inferred meanings that depend on full-thread interpretation

### Use `scenario_bias` as a hint

`scenario_bias` supports ranking.
It is not a hard filter and should not be used to encode workflow routing.

Good:

```json
{
  "scenario_bias": ["reviewer", "status_board"]
}
```

Avoid treating `scenario_bias` as permission to force a workflow action.

### Keep confidence conservative

Higher confidence should mean the phrase is explicit and stable.

Suggested pattern:

- `0.9+` for explicit shorthand with low ambiguity
- `0.75 - 0.89` for common shorthand that still depends on scenario
- below `0.75` for high-frequency but under-specified shorthand

### Use `clarify_below` for ambiguous phrases

Only add `clarify_below` when the phrase is valid but often under-specified.

Good candidates:

- `继续`
- `下一条`
- `收口`

### Keep notes short

Notes should explain why the rule exists, not replicate workflow documentation.

Good:

- `Usually means reviewer-side acceptance check.`
- `Often means wrap up the current thread or produce session close output.`

Avoid:

- long operational instructions
- downstream action plans

---

## Conflict Guidance

When two phrases overlap, prefer the more explicit rule.

Examples:

- `更新入板` should outrank `入板`
- `继续评审` should outrank `继续`

If two overlapping phrases map to the same `normalized_intent`, that overlap is acceptable.
It should not force a clarification request by itself.

---

## Reuse Guidance

The recommended reuse model is:

1. keep the interpreter stable
2. create a registry per project or workflow family
3. keep adapters thin

This repository already includes an alternate fixture registry at:

- [alt_habits.json](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/tests/fixtures/alt_habits.json)

For a reusable project-level starting point, it now also includes:

- [examples/project-registry/custom-habits.json](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/project-registry/custom-habits.json)
- [examples/project-registry/README.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/project-registry/README.md)
- [examples/project-registry/smoke-test.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/project-registry/smoke-test.js)

If you want to generate the same starter into another directory, use:

```powershell
npx user-habit-pipeline-init-registry --out .\my-project-registry
```

You can load another registry through:

- library injection via `interpretHabit(input, { rules })`
- file-based injection via `interpretHabit(input, { registryPath })`
- CLI usage via `--registry <path>`
- external tooling via [registry.schema.json](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/registry.schema.json)

---

## Anti-Patterns

Do not use the registry to:

- trigger execution
- decide approvals
- switch roles as workflow state
- store long procedural instructions
- encode hidden source-of-truth logic

The registry describes shorthand.
It does not run the workflow.
