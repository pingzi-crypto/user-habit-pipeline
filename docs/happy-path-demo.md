# Happy Path Demo

This is the shortest demo story that explains the project well to an outside user.

Use it when you need:

- one README-friendly explanation path
- one release-note or social demo script
- one recording flow that proves value without requiring deep setup knowledge

---

## 1. Demo Goal

Show this exact progression:

1. the same shorthand is ambiguous at first
2. a current-session scan finds an explicit candidate from visible conversation text
3. the user explicitly applies that candidate
4. the same shorthand becomes clear enough for the host to proceed

That story proves both halves of the product:

- `A`: pre-action semantic gate
- `B`: current-session habit review and explicit confirmation

---

## 2. Recommended Script

Use:

- [examples/current-session-host-node/happy-path-demo.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/current-session-host-node/happy-path-demo.js)

Run from the repository root:

```powershell
$env:USER_HABIT_PIPELINE_HOME = Join-Path $PWD ".tmp-happy-path"
node .\examples\current-session-host-node\happy-path-demo.js
```

The output is intentionally compact:

- `story`
- `roi_summary`

---

## 3. What To Emphasize While Demoing

The important points are:

- before apply, the host should not confidently route the shorthand yet
- the candidate comes from visible current-session evidence, not hidden memory
- durable change happens only after explicit user confirmation
- after apply, the same shorthand becomes materially more useful

If those four points are visible, the demo is doing its job.

---

## 4. Recording-Friendly Narrative

Recommended voiceover or caption flow:

1. `收个尾` is not in the active habit layer yet, so the host should clarify.
2. The user has already defined it in the current session, so scan surfaces a candidate.
3. The candidate is explicitly applied into the user habit layer.
4. Now the same shorthand maps cleanly to `close_session`, so the host can proceed.

---

## 5. Minimal ROI Check

The demo is good enough if `roi_summary` shows:

- `interpretation_improved = true`
- `candidate_surfaced_count = 1`
- `accepted_candidate_count = 1`
- `clarification_before_count = 1`
- `clarification_after_count = 0`

If it does not show that, the happy path is not actually proving value yet.
