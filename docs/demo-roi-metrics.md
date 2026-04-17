# Demo ROI Metrics

This document defines the smallest useful ROI signals for `user-habit-pipeline` demos and manual evaluation.

It exists to answer one practical question:

Is the project reducing real ambiguity and user effort, or only producing nice-looking demo output?

The metrics here are intentionally narrow.
They are meant for:

- manual demos
- local host simulations
- current-session evaluation runs

They are not meant to become hidden telemetry or broad behavior mining.

---

## 1. Metric Rules

Only track signals that help decide whether the product is worth continuing to build.

Good metric properties:

- directly tied to a visible user flow
- easy to explain from one transcript or one host decision
- comparable across repeated demos
- local and explicit

Avoid:

- broad passive logging
- hidden historical scraping
- vanity counters with no product decision attached

---

## 2. Core ROI Signals

### 2.1 Ambiguous action prevented

Count this when:

- the host was about to act on shorthand
- `pre_action_decision.next_action = "ask_clarifying_question"`
- the gate prevented the host from routing directly to a downstream handler

Why it matters:

- stronger agents make wrong confident action more expensive

Suggested field:

- `ambiguous_action_prevented_count`

### 2.2 Clarification correctly triggered

Count this when:

- the phrase is genuinely under-specified or weakly matched
- the system asks for clarification instead of proceeding

Why it matters:

- it measures whether the semantic gate is being conservative in the right place

Suggested field:

- `clarification_triggered_count`

### 2.3 Clear action allowed

Count this when:

- the phrase is explicit enough
- the host is allowed to continue into its own downstream route

Why it matters:

- a gate that only blocks is not useful

Suggested field:

- `clear_action_proceed_count`

### 2.4 Candidate surfaced for review

Count this when:

- a current-session scan returns at least one credible candidate

Why it matters:

- this is the first proof that the current-session wedge is finding something worth user attention

Suggested fields:

- `scan_runs`
- `scan_runs_with_candidates`
- `candidate_count_total`

### 2.5 Candidate explicitly accepted

Count this when:

- the user confirms an add/apply action
- a durable habit write occurs through an explicit request

Why it matters:

- suggestion UX has value only if useful candidates get promoted into active habits

Suggested field:

- `accepted_candidate_count`

### 2.6 Candidate explicitly ignored

Count this when:

- the user suppresses a noisy candidate

Why it matters:

- good suggestion UX is not only about accepting
- it is also about reducing repeated noise cheaply

Suggested field:

- `ignored_candidate_count`

### 2.7 Candidate later removed

Count this when:

- a previously accepted habit is later removed from active state

Why it matters:

- this is a lightweight correction signal on suggestion quality

Suggested field:

- `removed_after_accept_count`

### 2.8 Interpretation improved after explicit apply

Count this when:

- the same shorthand first required clarification or had no useful match
- a current-session candidate was explicitly accepted
- the same shorthand later becomes clear enough to proceed

Why it matters:

- this is the cleanest proof that current-session habit review is not just bookkeeping
- it shows that explicit durable writes improve future host behavior

Suggested field:

- `interpretation_improved_count`

---

## 3. Recommended Demo Output Shape

For demo scripts, prefer adding a small top-level object such as:

```json
{
  "roi_metrics": {
    "ambiguous_action_prevented_count": 1,
    "clarification_triggered_count": 1,
    "clear_action_proceed_count": 2
  }
}
```

For current-session flows, prefer event-style summaries such as:

```json
{
  "roi_event": {
    "event_type": "candidate_accepted",
    "durable_write_explicit": true,
    "accepted_candidate_count": 1
  }
}
```

This keeps demos machine-readable without pretending to be a full analytics system.

For before/after flows, a comparison object is better:

```json
{
  "roi_comparison": {
    "interpretation_improved": true,
    "accepted_candidate_count": 1,
    "ambiguous_before_count": 1,
    "ambiguous_after_count": 0,
    "resolved_by_explicit_habit_write_count": 1
  }
}
```

---

## 4. Manual Evaluation Checklist

After one realistic evaluation run, answer these questions:

1. Did the gate stop at least one ambiguous action from routing forward too early?
2. Did at least one explicit or correction-style candidate surface during current-session scan?
3. Did the user accept at least one useful candidate through an explicit write?
4. Did the user ignore at least one noisy candidate without extra friction?
5. If a candidate was wrong, how cheaply could it be removed?

If the answer is mostly no, more polish work is probably low ROI.

If you want to record one run in a consistent format, use:

- [manual-evaluation-template.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/manual-evaluation-template.md)

---

## 5. What To Compare Over Time

The most useful simple comparisons are:

- before semantic gate vs after semantic gate
- before current-session review UX vs after
- scan count vs accepted candidate count
- accepted candidate count vs removed-after-accept count

These comparisons are enough to support near-term product decisions.

---

## 6. Boundary Reminder

These ROI metrics must stay compatible with the project principles:

- no hidden durable writes
- no opaque long-term memory
- no private storage scraping
- no broad passive user mining

The point is to measure whether explicit, local, reviewable flows are helping.
