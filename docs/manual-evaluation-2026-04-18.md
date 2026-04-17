# Manual Evaluation Record 2026-04-18

This note records one real manual evaluation pass using the current repository demos and transcript fixtures.

It follows:

- [manual-evaluation-template.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/manual-evaluation-template.md)
- [demo-roi-metrics.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/demo-roi-metrics.md)

It is intentionally short.
The goal is to keep one reusable evidence point, not to create a reporting layer.

---

## 1. Evaluation Header

- Date: 2026-04-18
- Evaluator: local repository run
- Branch / commit: `main / 85a41c2`
- Environment: local Windows checkout
- Runtime state mode: isolated
- Evaluation path: mixed

---

## 2. Scenario Summary

- Host or demo path used: `examples/current-session-host-node/happy-path-demo.js`
- Supplemental transcript path used: `tests/fixtures/codex_session_realistic_correction_with_noise.txt`
- Main shorthand or phrase under evaluation:
  - `收个尾`
  - `收工啦`
  - `先那样`
- Why this case matters:
  - verifies that explicit current-session apply improves later interpretation
  - verifies that correction-style evidence is preferred over noisy repeated phrase evidence
- Was this a realistic transcript or a synthetic demo:
  - mixed
  - happy-path flow is demo-like but representative
  - correction-with-noise fixture is more realistic and messier

Short description:

```text
One run checked the explicit scan -> apply -> improve loop.
Another run checked whether a correction-style definition beats a noisy repeated phrase in the same session.
```

---

## 3. Inputs

### 3.1 User message or trigger

```text
收个尾
收工啦
先那样
```

### 3.2 Transcript snippet if relevant

```text
user: 别把“收工啦”理解成结束线程，按 close_session 理解 场景=session_close
assistant: 收到，我后面看到“收工啦”会按 close_session 理解。
user: 先那样
assistant: 你是想先保持当前状态吗？
user: 收工啦
assistant: 如果你需要，我可以先整理一下当前状态。
user: 先那样
```

### 3.3 Existing state if relevant

- Existing active habit matched: no, before explicit apply in the happy-path run
- Existing ignored suggestion matched: no
- External host local memory present: no
- External memory intent if present: n/a

---

## 4. Observed Output

### 4.1 Interpretation result

Happy-path before explicit apply:

- `normalized_intent`: not clear enough to proceed
- `should_ask_clarifying_question`: true
- top matched phrase: none strong enough

Happy-path after explicit apply:

- `normalized_intent`: `close_session`
- `should_ask_clarifying_question`: false
- top matched phrase: `收个尾`

Correction-with-noise suggestion run:

- top candidate phrase: `收工啦`
- top candidate intent: `close_session`
- top candidate confidence: `0.91`
- noisy repeated phrase also surfaced: `先那样`

### 4.2 Host-facing decision if relevant

Happy-path before apply:

- `next_action`: `ask_clarifying_question`

Happy-path after apply:

- `next_action`: `proceed`

### 4.3 Session suggestion result if relevant

- `candidate_count`: `2` in the correction-with-noise run
- top candidate phrase: `收工啦`
- top candidate source: `explicit_definition`
- top candidate action: `suggest_add`
- top candidate risk flags: `[]`
- second candidate phrase: `先那样`
- second candidate action: `review_only`
- second candidate risk flags:
  - `single_thread_only`
  - `missing_intent`

---

## 5. ROI Event Record

- `ambiguous_action_prevented_count`: 1
- `clarification_triggered_count`: 1
- `clear_action_proceed_count`: 1
- `scan_runs`: 2
- `scan_runs_with_candidates`: 2
- `candidate_count_total`: 3
- `accepted_candidate_count`: 1
- `ignored_candidate_count`: 0
- `removed_after_accept_count`: 0
- `interpretation_improved_count`: 1

---

## 6. Judgment

### 6.1 What went well

- The same shorthand moved from clarify-first to proceed after an explicit apply.
- Correction-style evidence outranked a noisy repeated phrase inside one realistic transcript.
- The noisy phrase stayed `review_only` instead of being promoted into an active suggestion automatically.

### 6.2 What failed or felt weak

- The happy-path improvement proof still comes from a controlled demo, not a messy real user thread.
- There is still only a small set of realistic correction-heavy transcripts.

### 6.3 Was the user cost justified

- yes

Reason:

```text
The flow required explicit confirmation only once, and the same shorthand became cheaper to interpret afterward.
The correction-style transcript also showed that the system stayed conservative on the noisy phrase.
```

### 6.4 Was the next step high ROI

- yes

Reason:

```text
Adding realistic correction-heavy fixtures and a before/after evaluation record directly strengthens the project's main product claim.
```

---

## 7. Final Outcome

- Would I keep this behavior: yes
- Would I revert or remove any accepted candidate: not from this run
- Did this run increase trust in the product boundary: yes
- Most important takeaway:

Short conclusion:

```text
The current design can now show two useful proofs at the same time:
explicit current-session review improves later interpretation,
and correction-style evidence is preferred over noisy repetition without hidden writes.
That is a real product-strengthening result, not just demo polish.
```
