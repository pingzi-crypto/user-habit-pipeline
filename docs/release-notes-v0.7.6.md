# Release Notes: v0.7.6

`user-habit-pipeline` `v0.7.6` is a host-integration release for current-session suggestion UIs.

## What changed

- Added structured `candidate_previews` to successful `codex-session-habits` scan results.
- Each preview now exposes a host-friendly summary of phrase, suggested intent, confidence, evidence, rationale, and risk.
- Updated the current-session host demo to show the top preview directly.
- Updated the Codex current-session contract and integration docs to document this field.

## Why it matters

Before `v0.7.6`, hosts had the raw candidate data plus `assistant_reply_markdown`, but richer UIs still had to re-derive display summaries from nested fields or parse markdown text.

This release closes that gap with a stable structured preview layer, while keeping the backend suggestion model explicit and inspectable.

## Best next entrypoint

- Install from npm: `npm install user-habit-pipeline`
- Outside-project demo: [pingzi-crypto/user-habit-pipeline-codex-demo](https://github.com/pingzi-crypto/user-habit-pipeline-codex-demo)
- Codex skill: [pingzi-crypto/manage-current-session-habits](https://github.com/pingzi-crypto/manage-current-session-habits)
- Contract doc: [docs/codex-current-session-contract.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/codex-current-session-contract.md)

## Validation

Release validation for this version includes:

- full `npm run release-check`
- direct `codex-session-habits` regression coverage for `candidate_previews`
- updated current-session host demo output
