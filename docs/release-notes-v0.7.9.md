# Release Notes: v0.7.9

`user-habit-pipeline` `v0.7.9` is a local-memory conflict boundary release.

It adds a missing host-integration safeguard:

- when a host's own local memory disagrees with the pipeline's explicit habit interpretation, the default result should be clarify-first

## What changed

- Added a formal boundary doc:
  - [docs/local-memory-conflict-boundary.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/local-memory-conflict-boundary.md)
- Added public helpers for conflict-aware host routing:
  - `buildMemoryConflictDecision`
  - `ExternalMemorySignal`
  - `MemoryConflictDecision`
- Extended `POST /interpret` to optionally accept:
  - `external_memory_signal`
- Extended `POST /interpret` to optionally return:
  - `memory_conflict_decision`
- Extended the main CLI with:
  - `--pre-action`
  - `--external-memory-intent`
  - `--external-memory-source`
  - `--external-memory-confidence`
- Added copyable demos for memory-conflict handling:
  - Node: `examples/external-consumer-node/memory-conflict-demo.js`
  - Python: `examples/external-consumer-python/memory-conflict-cli-demo.py`
- Updated the generated consumer starters so Node and Python installs now include those memory-conflict templates by default.

## Why it matters

Before `v0.7.9`, the project already had:

- explicit habit overlays
- suggestion vs active-layer separation
- pre-action semantic gating

But one important integration gap remained:

- the project documented the preference for explicit over hidden memory
- yet hosts still had to invent their own disagreement behavior when local memory said one thing and the pipeline said another

This release closes that gap without broadening the project into a hidden memory platform.

The new contract is intentionally narrow:

- hidden memory may help a host decide to ask a clarifying question
- hidden memory must not silently override the explicit habit layer
- disagreement should degrade into `ask_clarifying_question`

## Best next entrypoint

- Boundary rules: [docs/local-memory-conflict-boundary.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/local-memory-conflict-boundary.md)
- Pre-action integration: [docs/pre-action-host-integration.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/pre-action-host-integration.md)
- Quickstart: [docs/integration-quickstart.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/integration-quickstart.md)
- Cross-host strategy: [docs/cross-host-integration-guide.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/cross-host-integration-guide.md)

## Validation

Release validation for this version includes:

- full `npm test`
- regression coverage for `buildMemoryConflictDecision`
- HTTP regression coverage for `external_memory_signal -> memory_conflict_decision`
- CLI regression coverage for `--pre-action` and external-memory flags
- starter generator coverage for Node and Python memory-conflict templates
- direct demo validation for the new Node and Python conflict examples
