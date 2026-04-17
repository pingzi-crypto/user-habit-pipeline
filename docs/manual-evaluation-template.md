# Manual Evaluation Template

This template is for one realistic manual evaluation run of `user-habit-pipeline`.

It is intentionally small.
The goal is not to create a reporting system.
The goal is to make one run easy to compare against another run.

Example record:

- [manual-evaluation-2026-04-18.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/manual-evaluation-2026-04-18.md)

Use this after:

- a current-session scan flow
- a pre-action host gating demo
- a scan -> apply -> interpret-improvement run
- a realistic correction-heavy transcript review

If the record becomes long or hard to fill in, the template is too heavy.

---

## 1. Evaluation Header

- Date:
- Evaluator:
- Branch / commit:
- Environment:
- Runtime state mode:
  - shared
  - isolated
- Evaluation path:
  - pre-action gate
  - current-session scan
  - scan -> apply -> interpret improvement
  - correction-heavy transcript review
  - mixed

---

## 2. Scenario Summary

- Host or demo path used:
- Main shorthand or phrase under evaluation:
- Why this case matters:
- Was this a realistic transcript or a synthetic demo:

Short description:

```text
<1 to 4 lines>
```

---

## 3. Inputs

### 3.1 User message or trigger

```text
<user shorthand / request / trigger prompt>
```

### 3.2 Transcript snippet if relevant

```text
<short transcript excerpt>
```

### 3.3 Existing state if relevant

- Existing active habit matched:
- Existing ignored suggestion matched:
- External host local memory present:
- External memory intent if present:

---

## 4. Observed Output

### 4.1 Interpretation result

- `normalized_intent`:
- `confidence`:
- `should_ask_clarifying_question`:
- Top matched phrase:

### 4.2 Host-facing decision if relevant

- `decision_basis`:
- `next_action`:
- `memory_conflict_detected`:
- `final_next_action`:

### 4.3 Session suggestion result if relevant

- `candidate_count`:
- Top candidate phrase:
- Top candidate source:
- Top candidate action:
- Top candidate risk flags:

---

## 5. ROI Event Record

Fill only the fields that actually happened in this run.

- `ambiguous_action_prevented_count`:
- `clarification_triggered_count`:
- `clear_action_proceed_count`:
- `scan_runs`:
- `scan_runs_with_candidates`:
- `candidate_count_total`:
- `accepted_candidate_count`:
- `ignored_candidate_count`:
- `removed_after_accept_count`:
- `interpretation_improved_count`:

---

## 6. Judgment

### 6.1 What went well

- 

### 6.2 What failed or felt weak

- 

### 6.3 Was the user cost justified

- yes
- mixed
- no

Reason:

```text
<1 to 3 lines>
```

### 6.4 Was the next step high ROI

- yes
- uncertain
- no

If no, say what should be skipped or stopped:

```text
<short note>
```

---

## 7. Final Outcome

- Would I keep this behavior:
- Would I revert or remove any accepted candidate:
- Did this run increase trust in the product boundary:
- Most important takeaway:

Short conclusion:

```text
<2 to 5 lines>
```

---

## 8. Minimal Example Record

```md
- Date: 2026-04-18
- Evaluator: local manual run
- Branch / commit: main / <commit>
- Environment: Windows + Node 18
- Runtime state mode: isolated
- Evaluation path: scan -> apply -> interpret improvement

- Host or demo path used: examples/current-session-host-node/happy-path-demo.js
- Main shorthand or phrase under evaluation: 收个尾
- Why this case matters: proves explicit apply improves later interpretation
- Was this a realistic transcript or a synthetic demo: synthetic but realistic

- normalized_intent: close_session
- confidence: 0.88
- should_ask_clarifying_question: false
- candidate_count: 1
- accepted_candidate_count: 1
- interpretation_improved_count: 1

- What went well:
  - the same shorthand moved from clarify-first to proceed after explicit apply

- What failed or felt weak:
  - transcript was still demo-like, not a messy real thread

- Was the user cost justified: yes
- Was the next step high ROI: yes

- Most important takeaway:
  - explicit current-session review can create a measurable before/after improvement without hidden writes
```
