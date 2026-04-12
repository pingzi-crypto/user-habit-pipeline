# Release Notes: v0.7.5

`user-habit-pipeline` `v0.7.5` is a docs and onboarding release for the published package.

This version does not introduce a new runtime command or output shape.
It makes the outside-adoption path easier to discover, easier to understand, and easier to validate quickly.

## What changed

- Tightened the README opening so the value proposition and fastest entrypoints are visible faster.
- Added the public external demo repo more prominently from the README and integration quickstart.
- Added a README demo GIF so the current-session interaction surface is visible before reading deep docs.
- Clarified project-local `USER_HABIT_PIPELINE_HOME` guidance for current-session host isolation.

## Why it matters

The package already had the runtime pieces in `v0.7.4`.
The gap was the first-run story: where to start, what to install, and how to verify the Codex-style host path in a clean outside project.

`v0.7.5` reduces that adoption friction without changing the contract.

## Best next entrypoint

- Install from npm: `npm install user-habit-pipeline`
- Outside-project demo: [pingzi-crypto/user-habit-pipeline-codex-demo](https://github.com/pingzi-crypto/user-habit-pipeline-codex-demo)
- Codex skill: [pingzi-crypto/manage-current-session-habits](https://github.com/pingzi-crypto/manage-current-session-habits)
- Integration guide: [docs/integration-quickstart.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/integration-quickstart.md)

## Validation

Release validation for this version includes:

- full `npm run release-check`
- package tarball smoke through `npm pack --dry-run`
- installed-package smoke through `package-install-smoke`
- docs and examples consistency checks through the normal release gate
