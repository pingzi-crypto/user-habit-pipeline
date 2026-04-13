# Release Notes: v0.7.8

`user-habit-pipeline` `v0.7.8` is a host-integration and positioning release.

It turns the project from:

- a shorthand interpreter with current-session scanning

into a clearer host-facing package with:

- a pre-action semantic gate
- cross-host integration guidance
- outward-facing happy-path demos

## What changed

- Added `interpretHabitForPreAction` and `buildPreActionDecision` as formal public library helpers.
- Updated `POST /interpret` so local HTTP hosts receive both:
  - `result`
  - `pre_action_decision`
- Added Node demos for:
  - pre-action semantic gating
  - host-side routing after semantic gating
  - current-session scan -> apply -> interpret improvement
  - one compact happy-path story for README, release, or recording use
- Added docs for:
  - pre-action host integration
  - cross-host path selection
  - runtime state sharing vs isolation
  - demo ROI metrics
  - the shortest happy-path demo flow
- Aligned the API reference, quickstart, starter generator, and packaged metadata with those new surfaces.

## Why it matters

Before `v0.7.8`, the project already had:

- shorthand interpretation
- current-session suggestion review
- local HTTP transport

But one practical gap remained:

- the host-facing story was still spread across several surfaces
- the best integration path depended too much on reading multiple docs and inferring intent
- the project still looked more like a useful parser than a clear semantic layer for larger hosts

This release closes that gap by making the host contract more explicit.

The package now has a much clearer answer to:

- how a host should decide `proceed` vs `ask_clarifying_question`
- how a current-session suggestion can improve later interpretation
- when to choose library vs CLI vs current-session bridge vs local HTTP
- when runtime habit state should be shared vs isolated

## Best next entrypoint

- Install from npm: `npm install user-habit-pipeline`
- Cross-host path selection: [docs/cross-host-integration-guide.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/cross-host-integration-guide.md)
- Pre-action host integration: [docs/pre-action-host-integration.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/pre-action-host-integration.md)
- Happy-path demo: [docs/happy-path-demo.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/happy-path-demo.md)
- Codex current-session contract: [docs/codex-current-session-contract.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/codex-current-session-contract.md)

## Validation

Release validation for this version includes:

- full `npm test`
- pre-action gate regression coverage
- HTTP interpret route regression coverage for `pre_action_decision`
- current-session host demo coverage including before/after improvement and happy-path output
- starter generator coverage for the new demo files
