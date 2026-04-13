# Agent-Era Roadmap: 30 Days

This roadmap follows the recommended `A + B` strategy from [agent-era-positioning.md](./agent-era-positioning.md):

- A: pre-action semantic layer / preference router
- B: best-in-class current-session habit review UX

It intentionally avoids low-ROI expansion into general agent orchestration.

---

## 1. 30-Day Goal

Within 30 days, the project should be able to demonstrate all of the following in a way that is obvious to an outside user:

1. a host can consult `user-habit-pipeline` before acting on ambiguous shorthand
2. a user can discover and confirm habit candidates from the current conversation with low friction
3. durable writes remain explicit and inspectable
4. the same semantic layer can be consumed through more than one host-facing entrypoint

If those four outcomes are not visible, more polish work is probably not worth it yet.

---

## 2. Success Metrics

Before adding broad new features, track a small set of ROI signals.

### Product metrics

- percentage of scanned sessions that produce at least one credible candidate
- percentage of candidates explicitly accepted
- percentage of accepted habits later removed
- percentage of ambiguous prompts that trigger clarification instead of a wrong confident interpretation

### UX metrics

- time from scan request to add or ignore action
- number of user steps required for scan -> review -> apply
- number of manual environment-specific commands required in the happy path

### Integration metrics

- number of host entrypoints using the same backend contract
- number of demos that show `before action` semantic gating

---

## 3. Week 1: Prove The Pre-Action Semantic Gate

### Goal

Show one concrete host flow where a larger assistant would otherwise be too eager, and `user-habit-pipeline` improves the outcome before action happens.

### Deliverables

- one minimal host demo that sends a user message to the pipeline before executing downstream logic
- one example with an under-specified phrase such as `继续`
- one example with an explicit correction-style phrase definition
- one documented decision object showing:
  - normalized intent
  - confidence
  - should ask clarifying question
  - recommended next action for the host

### Suggested scope

Prefer a small localhost or Node host demo over a broad framework integration.

Good enough:

- local HTTP wrapper plus demo client
- Node script that simulates an OpenClaw-like host decision point

Avoid for now:

- deep integration into a large third-party runtime
- multi-agent orchestration demos

### Primary risk

The demo might look synthetic unless it uses realistic ambiguous prompts.

---

## 4. Week 2: Strengthen The Current-Session Review Wedge

### Goal

Make the current-session scan and apply path obviously easy inside a host conversation.

### Deliverables

- tighter current-session scan response rendering
- clearer candidate preview ordering and rationale summaries
- better copy for add / ignore / stop follow-up prompts
- one realistic transcript fixture showing correction-based learning
- one realistic transcript fixture showing repeated shorthand with review-only output

### UX bar

The flow should feel like:

- user says one sentence to trigger scan
- host shows top candidates clearly
- user replies with one short follow-up
- backend performs only the explicitly requested durable write

### Primary risk

If the UI keeps looking like a debugging surface, users will not perceive the low-friction value.

---

## 5. Week 3: Add Minimal ROI Instrumentation

### Goal

Stop relying on intuition for whether the product is helping.

### Deliverables

- a small metrics doc defining what to log during demos and manual tests
- optional structured counters in demo outputs
- one acceptance checklist for:
  - misinterpretation prevented
  - clarification correctly triggered
  - candidate accepted
  - candidate ignored
  - candidate later removed

### Important boundary

Do not turn this into surveillance or hidden memory mining.
Keep instrumentation local, explicit, and tied to visible test flows.

### Primary risk

If the measurements are too abstract, they will not inform product decisions.

---

## 6. Week 4: Prepare The Cross-Host Story Without Overbuilding

### Goal

Show that the semantic layer is not trapped inside one host, without prematurely building a large platform.

### Deliverables

- one concise host integration comparison doc
- one additional adapter or starter beyond the existing Codex-oriented flow
- one example of shared runtime state guidance that keeps user habits portable and explicit

### Good targets

- local HTTP example
- Node consumer starter
- Python consumer starter using the same visible contract

### Avoid

- enterprise governance packaging
- central service architecture
- cloud dependency as a prerequisite

### Primary risk

This can turn into abstraction work with weak user value if there is no crisp demo.

---

## 7. Recommended Build Order

If engineering time is limited, do the work in this order:

1. pre-action semantic gate demo
2. current-session review UX improvements that help real adoption
3. ROI instrumentation
4. cross-host story tightening

If a proposed next step falls below that order and has mostly polish value, it is probably low ROI.

---

## 8. Suggested Concrete TODOs

These are the highest-value tasks that naturally follow from the current codebase.

### P0

- add a small host-side demo showing `interpret -> decide clarify vs act`
- define one stable response shape for host pre-action gating
- document the recommended host behavior when `should_ask_clarifying_question = true`

### P1

- improve current-session candidate rendering for realistic host UIs
- add more correction-heavy transcript fixtures
- add one manual demo path that shows scan -> add -> interpret improvement in sequence

### P1

- add a lightweight ROI metrics note for demos and manual testing
- capture acceptance and removal signals from manual evaluation runs

### P2

- add one more host starter that consumes the same semantic contract
- tighten versioned contract wording around host integration

---

## 9. What Not To Do In The Next 30 Days

These directions are currently low ROI and should be challenged early:

- building a full orchestration framework
- broad autonomous memory features
- deep enterprise governance packaging
- speculative personality inference
- large README or release-copy churn without product proof

If one of these starts to dominate work, it is worth stopping and switching.

---

## 10. Expected Outcome After 30 Days

If this roadmap succeeds, the project should be able to say something much stronger than it can today:

`user-habit-pipeline` is not just a phrase parser.
It is a host-ready semantic gate plus a low-friction current-session review loop that helps larger agents interpret a user's shorthand safely before action and improve over time through explicit confirmation.

That would be a meaningful, defensible position in the agent era.
