# Confidence Scoring

This document explains how confidence is currently calculated in `user-habit-pipeline`.

It focuses on the implemented behavior in the repository today.
If the code changes, this document should be updated to match the implementation.

---

## 1. Two Different Confidence Domains

The project currently uses confidence in two related but different places:

1. interpreter confidence
2. session suggestion confidence

These should not be treated as the same signal.

Interpreter confidence answers:

- how strongly does the active habit registry support this interpretation right now

Session suggestion confidence answers:

- how strong is the evidence that this phrase should be reviewed as a candidate habit

---

## 2. Interpreter Confidence

Interpreter scoring is implemented in:

- [scoring.js](/E:/user-habit-pipeline/src/habit_core/scoring.js)
- [interpreter.js](/E:/user-habit-pipeline/src/habit_core/interpreter.js)

### 2.1 Base score source

The primary score source is the matched rule's stored `confidence`.

That value comes from:

- the default registry
- the user overlay
- or an explicitly supplied rule set

The interpreter does not invent a base score from scratch.

### 2.2 Match selection before scoring

Before final scoring, candidate rules are selected and ranked conservatively:

1. exact phrase matches are preferred over substring matches
2. longer phrases are preferred over shorter phrases
3. higher base confidence is preferred when other factors tie

This means phrase specificity matters before any small runtime bonus is applied.

### 2.3 Runtime bonuses

The current implementation applies only two small bonuses.

#### Scenario bonus

If the input `scenario` matches the rule's `scenario_bias`, the interpreter adds:

- `+0.05`

Current constant:

- `SCENARIO_BONUS = 0.05`

Important boundary:

- scenario is a bias hint, not a hard filter
- no penalty is applied when scenario does not match

#### Recent-context bonus

If both conditions are true:

1. the rule has `clarify_below`
2. `recent_context` contains intent-specific support keywords

the interpreter adds:

- `+0.05`

Current constant:

- `CONTEXT_BONUS = 0.05`

Important boundary:

- context support is only used for under-specified phrases
- context must not create an intent when no phrase matched

### 2.4 Context support keywords

Current context support is implemented in:

- [context_rules.js](/E:/user-habit-pipeline/src/habit_core/context_rules.js)

Today it only recognizes keyword support for a small set of intents:

- `continue_current_track`
- `move_to_next_item`
- `close_session`

If an intent has no configured support keywords, recent context adds nothing.

### 2.5 Final interpreter score

The interpreter final score is:

- base rule confidence
- plus scenario bonus if applicable
- plus context bonus if applicable
- clamped to `0.00` to `1.00`
- rounded to two decimals

Current clamp behavior:

- values below `0` become `0`
- values above `1` become `1`

---

## 3. Clarification Thresholds

Confidence and clarification are related, but not identical.

The interpreter can return a non-trivial confidence and still recommend clarification.

Clarification logic is implemented in:

- [scoring.js](/E:/user-habit-pipeline/src/habit_core/scoring.js)

### 3.1 Default clarification threshold

If the top candidate score is below:

- `0.75`

the interpreter asks for clarification.

Current constant:

- `DEFAULT_CLARIFY_BELOW = 0.75`

### 3.2 Rule-specific clarification threshold

If a rule defines `clarify_below`, that rule-specific threshold overrides the default.

This is how under-specified phrases can remain conservative even when they are common.

### 3.3 Ambiguity gap

Even when the top score is reasonably high, the interpreter still asks for clarification if:

- there is a second candidate
- the second candidate has a different `normalized_intent`
- the score gap is less than `0.08`

Current constant:

- `AMBIGUITY_GAP = 0.08`

This protects against overclaiming when two different meanings remain too close.

---

## 4. What Interpreter Confidence Is Meant To Mean

Roughly:

- `0.90+`: explicit and stable phrase match
- `0.75 - 0.89`: usable shorthand, often still somewhat scenario-sensitive
- below `0.75`: likely valid as a candidate interpretation, but usually not strong enough to avoid clarification

These are interpretation heuristics, not public API thresholds beyond the implemented clarification rules above.

---

## 5. Session Suggestion Confidence

Session suggestion scoring is implemented in:

- [extract_candidates.js](/E:/user-habit-pipeline/src/session_suggestions/extract_candidates.js)

This confidence is not about active interpretation quality.
It is about review priority for candidate discovery.

### 5.1 `explicit_add_request`

If the transcript already contains a structured add-style request, the candidate confidence is:

- requested rule confidence
- plus `0.08`
- capped at `0.98`

Current behavior:

- `Math.min(parsedRequest.rule.confidence + 0.08, 0.98)`

Reasoning:

- the user already expressed the candidate in a habit-management-compatible structure

### 5.2 `explicit_definition`

If the transcript contains an explicit phrase-to-intent definition, the candidate confidence is:

- `0.88` when a scenario is explicitly present
- `0.84` otherwise

Reasoning:

- explicit definitions are strong evidence
- missing scenario is still acceptable, but slightly weaker

### 5.3 `repeated_phrase`

If the transcript only shows repeated short phrases with no explicit intent, the candidate is review-only by default.

Current scoring:

- starts at `0.55`
- adds `0.05` for each repetition beyond the minimum threshold
- caps extra repetition bonus at `0.15`

In code:

- `0.55 + Math.min((count - 2) * 0.05, 0.15)`

Reasoning:

- repetition is worth surfacing
- repetition alone is not enough to auto-promote to an active rule

### 5.4 Suggestion ranking

Candidates are ranked by:

1. `suggest_add` before `review_only`
2. higher confidence
3. higher occurrence count
4. phrase lexical order as a final stable tie-break

This keeps explicit user evidence ahead of weak one-thread repetition patterns.

---

## 6. Suggestion Risk Flags Matter Alongside Confidence

Session suggestion confidence must be read together with `risk_flags`.

Examples:

- `scenario_unspecified`
- `single_thread_only`
- `missing_intent`

A phrase with moderate confidence plus strong risk flags should still be reviewed conservatively.

The suggestion output now also includes `confidence_details` on each candidate so UIs and skills can show:

- the base score
- the applied bonus or cap rules
- the final score
- a short human-readable summary

This keeps the scoring inspectable at the result level instead of only in implementation docs.

---

## 7. Ignored Suggestions And Confidence

Ignored suggestions are stored in:

- user registry `ignored_suggestions`

Ignored phrases are filtered out before future session suggestion ranking.

That means:

- they are not rescored
- they are not re-suggested
- they do not become active interpretation rules

This behavior reduces noise without inflating the active registry.

---

## 8. Apply-Time Confidence For Suggestions

When a suggestion candidate is explicitly applied into the user overlay, the resulting stored rule confidence is resolved in this order:

1. explicit override from the apply request
2. CLI `--confidence`
3. candidate's suggested rule confidence
4. fallback default `0.85`

This is implemented in:

- [manage-habits-cli.js](/E:/user-habit-pipeline/src/manage-habits-cli.js)

This matters because:

- suggestion confidence helps rank review candidates
- applied rule confidence becomes a real interpreter input afterward

Those two values may match, but they do not have to.

---

## 9. Authoring Guidance

When authoring or editing rules, use confidence conservatively.

Good practice:

- reserve higher confidence for explicit, stable, low-ambiguity phrases
- keep under-specified shorthand lower
- use `clarify_below` when a phrase is valid but often still needs confirmation

See also:

- [registry-authoring.md](/E:/user-habit-pipeline/docs/registry-authoring.md)
- [mvp-spec.md](/E:/user-habit-pipeline/docs/mvp-spec.md)

---

## 10. Stability Note

The exact numbers in this document reflect the current implementation:

- scenario bonus `0.05`
- context bonus `0.05`
- default clarify threshold `0.75`
- ambiguity gap `0.08`

If these constants change in code, this document should be updated in the same change set.
