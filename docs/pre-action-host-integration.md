# Pre-Action Host Integration

This document explains the recommended `A`-lane integration for `user-habit-pipeline`:

- let the host consult the pipeline before it executes an action
- use the returned decision to choose `proceed` vs `ask_clarifying_question`
- keep workflow execution in the host, not in this package

This is the intended way to use the project as a semantic gate in front of a larger assistant or local agent host.

---

## 1. When To Use This

Use the pre-action gate when the host is about to react to short or repeated user phrasing such as:

- `继续`
- `下一条`
- `收口`
- project-specific shorthand that may affect which tool or workflow runs next

The goal is not to execute anything here.
The goal is to decide whether the host has enough semantic certainty to continue.

---

## 2. Public API

Recommended library helper:

- `interpretHabitForPreAction`

Supporting helper:

- `buildPreActionDecision`

The helper returns:

- `result`: the normal interpretation output
- `pre_action_decision`: a host-facing decision object

Example:

```js
const { interpretHabitForPreAction } = require("user-habit-pipeline");

const { result, pre_action_decision } = interpretHabitForPreAction({
  message: "继续",
  scenario: "general"
});

console.log(result.normalized_intent);
console.log(pre_action_decision.next_action);
```

---

## 3. Decision Object

Current `pre_action_decision` fields:

- `decision_basis`
- `next_action`
- `normalized_intent`
- `confidence`
- `matched_phrase`
- `should_ask_clarifying_question`
- `disambiguation_hints`
- `preferred_terms`
- `reason`
- `host_guidance`

Current `decision_basis` values:

- `no_match`
- `clarification_required`
- `clear_match`

Current `next_action` values:

- `proceed`
- `ask_clarifying_question`

---

## 4. Recommended Host Behavior

### 4.1 `next_action = proceed`

Host behavior:

- continue into downstream routing
- use `normalized_intent` as a semantic hint
- keep actual execution rules in the host

Do not reinterpret this as hidden auto-execution.
The package is still an interpretation layer.

### 4.2 `next_action = ask_clarifying_question`

Host behavior:

- do not run downstream tools yet
- ask one short clarifying question
- use `reason` or `disambiguation_hints` to keep the clarification focused

Good pattern:

- one short clarification
- then re-run interpretation on the clarified user response if needed

---

## 5. HTTP Path

If the host uses the official local HTTP entrypoint, `POST /interpret` now returns both:

- `result`
- `pre_action_decision`

Example request:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:4848/interpret `
  -ContentType "application/json" `
  -Body '{"message":"继续","scenario":"general"}'
```

This keeps the HTTP path aligned with the direct library path.

---

## 6. Example Demo

See the copyable Node example:

- [examples/external-consumer-node/pre-action-gate-demo.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/external-consumer-node/pre-action-gate-demo.js)
- [examples/external-consumer-node/host-router-demo.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/external-consumer-node/host-router-demo.js)
- [docs/demo-roi-metrics.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/demo-roi-metrics.md)

This demo shows two outcomes:

- an under-specified shorthand that should trigger clarification
- an explicit shorthand that is clear enough to proceed

The router demo extends that one step further:

- host asks for clarification when the shorthand remains ambiguous
- host maps a clear `normalized_intent` into its own downstream handler key
- execution still belongs to the host, not to `user-habit-pipeline`

---

## 7. Minimal Host Routing Pattern

Recommended host loop:

1. read the current user message
2. call `interpretHabitForPreAction`
3. if `next_action = ask_clarifying_question`, ask one short question and stop
4. if `next_action = proceed`, map `normalized_intent` into a host-owned route key
5. execute only inside the host layer

Example route mapping:

```js
const routeMap = {
  continue_current_track: "resume-active-track",
  refresh_latest_board_state: "status-board.refresh",
  close_session: "session.close"
};
```

---

## 8. Boundary Reminder

This integration style is valuable because it stays narrow:

- this package interprets
- the host decides
- the host executes

Do not turn the pre-action gate into a hidden orchestration layer.
