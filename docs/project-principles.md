# Project Principles

This document records the current design principles that already govern `user-habit-pipeline`.

It is not a speculative roadmap.
It is a concise statement of the boundaries and consistency rules the project is expected to keep as it evolves.

---

## 1. Interpretation Layer Only

This project is an interpretation layer, not a workflow engine.

It may:

- interpret repeated shorthand phrases
- normalize likely intent
- return structured, inspectable hints
- reduce repeated ambiguity for downstream systems

It must not:

- execute workflow actions
- update files, boards, or approvals as part of interpretation
- choose operational behavior in place of explicit downstream rules
- become a hidden orchestration layer

Short form:

- this layer explains
- downstream systems decide

---

## 2. Explicit Over Hidden

Behavior should come from explicit, inspectable inputs.

Preferred sources of truth:

- the shipped default registry
- the user overlay
- the current explicit prompt/request
- the current reviewed suggestion snapshot

Avoid:

- hidden rule generation
- opaque long-term memory
- silent mutation of active rules

If a behavior cannot be explained by visible rules or visible user confirmation, it is outside the intended design.

---

## 3. Conservative By Default

The system should prefer being reviewable over being aggressive.

This means:

- no auto-learning into active habits
- no automatic write-back from session suggestions
- no broad semantic guessing when explicit phrase evidence is weak
- no pretending that one-thread evidence equals a stable long-term preference

Suggestion flows may help the user notice patterns, but they must remain suggestion-first unless the user explicitly confirms a write.

---

## 4. User Confirmation Controls Writes

Any durable change to user-specific state must happen through an explicit user action.

Examples:

- adding a user habit phrase
- removing a phrase from the effective registry
- applying a reviewed suggestion candidate
- suppressing a noisy suggestion phrase

Scanning, suggesting, or analyzing alone must not silently update active rules.

---

## 5. Inspectable Structured Output

The project should return stable structured output rather than vague prose-only interpretation.

Core outputs should remain easy to inspect:

- `normalized_intent`
- `habit_matches`
- `disambiguation_hints`
- `confidence`
- `should_ask_clarifying_question`

Suggestion output should also stay inspectable:

- candidate id
- phrase
- candidate source
- evidence
- risk flags

The user or host should be able to understand why the system suggested or matched something.

---

## 6. Message First, Context Second

The current message is the main interpretation target.

Supporting context is allowed, but only as a weak bias:

- `recent_context` stays short
- `scenario` is a hint, not a hard rule
- context must not create a new intent when no phrase rule matched

This prevents the system from drifting into hidden thread-level semantic reasoning.

---

## 7. Clarify Instead Of Overclaim

When evidence is weak or ambiguous, the project should recommend clarification instead of acting confident.

Typical triggers:

- no matching rule
- low-confidence match
- near-tie between candidates
- under-specified shorthand such as `继续`

The project should prefer a conservative provisional answer plus clarification hints over a confident but opaque guess.

---

## 8. Suggestion Layer And Active Habit Layer Must Stay Separate

The repository now contains both:

- an active habit layer
- a session suggestion layer

These two layers must remain distinct.

Active habit state includes:

- `additions`
- `removals`

Suggestion-management state may include:

- cached suggestion snapshots
- `ignored_suggestions`

Ignored suggestions mean:

- do not suggest this phrase again from session scans

They do not mean:

- add this phrase as an active habit
- remove this phrase from interpretation matching

---

## 9. Low Friction Matters, But Not At The Cost Of Hidden Behavior

The user should be able to trigger the system in the most natural interaction surface available, especially inside the current Codex conversation.

That is why the project supports:

- prompt-style management requests
- session suggestion scans
- a Codex-facing skill/bridge flow

But reducing friction must not break other principles:

- convenience is good
- silent automation is not

The project should reduce user effort while preserving explicit confirmation and inspectability.

---

## 10. Paths And Machine-Specific Addresses Must Not Be Hardcoded

File paths, install locations, and config addresses must be portable.

This is now a project-level principle, not just a skill-repo preference.

Required behavior:

- prefer parameters over machine-specific literals
- support environment-variable based configuration when reasonable
- allow local generated config files for machine-specific resolution
- document generic placeholders rather than author-machine absolute paths in user-facing install guidance

Acceptable examples:

- `-BackendRepoPath <path>`
- `USER_HABIT_PIPELINE_REPO`
- `CODEX_HOME`
- `<skill-repo>\\config\\local-config.json`

Avoid in portable guidance:

- author-machine absolute paths such as `E:\\...`
- user-profile-specific install paths baked into docs as the only option
- assuming a fixed workspace layout with no override path

Machine-local paths may still exist in generated local config, but they must be:

- derived during install
- replaceable
- outside the project’s public contract

This matters for:

- multi-machine personal use
- sharing the skill with other users
- publishing to a skill marketplace

---

## 11. Host Integration Should Pass Context, Not Expose Private Storage Assumptions

For Codex-side integration, the host or skill should pass visible conversation text into the backend.

The project should not depend on:

- scraping unknown private thread stores
- hardcoding internal app storage paths
- requiring users to manually locate transcript files on disk

Preferred pattern:

- current conversation text is gathered by the host/skill
- backend receives transcript text through a stable interface
- follow-up confirmation reuses local cached suggestion state

---

## 12. Evolvability Through Small, Defensible Steps

New features should extend the current boundary, not blur it.

Good extensions:

- better suggestion review UX
- explicit ignore/suppress flows
- configurable integration paths
- clearer confidence and evidence reporting

Risky extensions that need strong scrutiny:

- automatic learning into active rules
- broad historical mining without explicit review
- personality or motive inference
- implicit workflow execution

When in doubt, prefer the smaller feature that preserves explicit control.

---

## 13. Stop Low-ROI Next Steps Early

The project should not keep pushing a next step when the likely payoff is clearly smaller than the user's cost to execute or review it.

This applies especially to:

- speculative polish with weak user value
- busywork follow-ups after the main value has already been captured
- low-signal refinement that adds cognitive load without improving control or clarity

Required behavior:

- say clearly when the next suggested action is probably not worth it
- prefer naming the tradeoff directly instead of mechanically proposing more work
- offer a very low-friction exit so the user can stop the current direction immediately
- make it easy to switch attention to a higher-value TODO item

Preferred interaction pattern:

- explicitly state that the current next step is low ROI
- offer one single-word reply the user can send to stop, such as `停` or `跳过`
- after that, move to the next higher-value pending item instead of dragging the current thread forward

Preferred wording example:

```text
这一步继续做的收益不高，可能不太划算。
如果你想停掉这个方向，直接回“停”。
我就改看更高价值的 TODO。
```

Short form:

- low-value next steps should be challenged early
- stopping should be cheaper than continuing
