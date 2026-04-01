# MVP Spec

## Goal

Deliver a minimal user-habit interpretation layer that can:

- interpret a small set of repeated shorthand expressions
- return structured, inspectable intent hints
- help downstream workflows reduce ambiguity
- remain removable without breaking downstream systems

The MVP is successful if it reduces misunderstanding for repeated high-frequency phrases without taking over workflow decisions.

---

## Scope

### In scope

- explicit phrase-based interpretation
- lightweight normalization
- confidence scoring
- clarification recommendation
- structured output
- one downstream adapter example for `growth-hub`

### Out of scope

- automatic learning
- hidden long-term memory
- full-thread semantic understanding
- direct board updates
- direct role switching
- approval logic
- file writes
- git operations
- service deployment
- multi-workflow orchestration

---

## Input Contract

### Required

- `message: string`

### Optional

- `recent_context: string[]`
- `scenario: string | null`

### Notes

- `message` is always the main source
- `recent_context` must stay short
- `scenario` is only a hint, not a hard rule

---

## Output Contract

The system must produce:

```json
{
  "normalized_intent": "unknown",
  "habit_matches": [],
  "disambiguation_hints": [],
  "confidence": 0.0,
  "should_ask_clarifying_question": false,
  "preferred_terms": [],
  "notes": []
}
```

### Field rules

- `normalized_intent` uses the top-ranked candidate intent or `unknown`
- `habit_matches` returns ranked candidate matches
- `disambiguation_hints` explains what extra information would reduce ambiguity
- `confidence` is clamped to `0.0` to `1.0`
- `should_ask_clarifying_question` is `true` when interpretation remains weak or ambiguous
- `preferred_terms` may contain downstream-preferred labels when available
- `notes` stays short and inspectable

---

## Registry Rule Shape

A registry rule must contain:

- `phrase: string`
- `normalized_intent: string`
- `scenario_bias: string[]`
- `confidence: number`

A registry rule may also contain:

- `match_type: "exact" | "substring"`
- `preferred_terms: string[]`
- `disambiguation_hints: string[]`
- `notes: string[]`
- `clarify_below: number`

Registry data should stay explicit and easy to inspect.
Behavior should not depend on hidden rule generation.

---

## Matching Rules

The MVP uses explicit rule matching only.

### Message normalization

Before matching:

- trim leading and trailing whitespace
- preserve original wording
- do not perform broad semantic rewriting
- do not rely on full-thread understanding

The MVP must stay conservative.
It must not introduce hidden NLP behavior.

### Candidate selection

Rules are loaded from the habit registry.

Matching order:

1. exact phrase match
2. substring phrase match

If one or more exact matches exist, substring matches must be ignored.

### Candidate priority

If multiple candidates match, sort by:

1. exact match before substring match
2. longer phrase before shorter phrase
3. higher base confidence before lower base confidence

This ensures phrases like `更新入板` win over shorter phrases like `入板`.

### No-match behavior

If no candidate matches:

- `normalized_intent = "unknown"`
- `habit_matches = []`
- `confidence = 0.0`
- `should_ask_clarifying_question = true`

---

## Scoring Rules

The MVP uses simple, inspectable confidence scoring.

### Base confidence

Each registry rule provides a base confidence value.
This value is the primary score source.

### Scenario bias

If `scenario` appears in the candidate rule's `scenario_bias` list:

- add a small confidence bonus

Recommended MVP bonus:

- `+0.05`

If `scenario` is absent or does not match:

- add no bonus
- apply no penalty

`scenario` is a hint, not a hard filter.

### Recent-context support

`recent_context` may provide a small bonus only when:

- the current message is under-specified
- a candidate already exists
- recent context clearly supports that candidate

Recommended MVP bonus:

- `+0.05`

`recent_context` must not:

- create a new intent when no rule matches
- override an explicit higher-priority phrase
- act as hidden long-term memory

### Final confidence

Final confidence is:

- base confidence
- plus scenario bonus if applicable
- plus recent-context bonus if applicable
- clamped to the range `0.0` to `1.0`

---

## Clarification Rules

The MVP must recommend clarification when interpretation remains weak or ambiguous.

### Clarification conditions

Set `should_ask_clarifying_question = true` if any of the following is true:

- no rule matched
- top candidate confidence is below `0.75`
- top two candidates are too close to each other
- the matched phrase is known to be under-specified

Recommended MVP ambiguity rule:

- if score gap between top candidate and second candidate is less than `0.08`, ask for clarification

### Under-specified phrases

Some high-frequency phrases are valid but ambiguous.

Examples:

- `继续`
- `下一条`

These may still return a provisional `normalized_intent`, but should remain more conservative than explicit phrases like:

- `session-close`
- `读取最新状态板`

### Clarification guidance

When clarification is recommended, `disambiguation_hints` should explain what is missing.

Examples:

- `Need clearer local target for "continue".`
- `Need to know whether "next item" refers to board order or another active queue.`

---

## Output Construction Rules

### normalized_intent

Use the top-ranked candidate intent.

If no candidate exists, return `unknown`.

### habit_matches

Return the ranked candidate list.
Each item must include:

- `phrase`
- `meaning`
- `confidence`

The first item should be the top interpretation.

### preferred_terms

If the matched rule provides preferred downstream terms, return them.
Otherwise, return an empty array.

### notes

Notes may include:

- matched-rule notes
- conservative interpretation warnings
- score adjustment explanations

Notes must stay short and inspectable.

---

## Scope Guardrails

The interpreter must not:

- trigger workflow actions
- update files or boards
- choose reviewer vs executor behavior as workflow state
- replace explicit source-of-truth documents
- infer hidden motives or personality
- use unrestricted thread reasoning to guess intent

The interpreter explains.
Downstream systems decide.
