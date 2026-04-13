# Release Notes: v0.7.7

`user-habit-pipeline` `v0.7.7` is a cross-platform release-check hardening release.

## What changed

- Replaced the PowerShell-only `manual-e2e-smoke` implementation with a Node-based script.
- Kept `scripts/manual-e2e-smoke.ps1` as a thin compatibility wrapper so existing Windows usage still works.
- Updated package metadata so the new `scripts/manual-e2e-smoke.js` ships with the package.
- Refreshed the manual E2E acceptance doc to make the bundled smoke path explicitly cross-platform.

## Why it matters

Before `v0.7.7`, the repository already positioned itself as usable across Windows, macOS, and Linux, but `npm run release-check` still depended on `pwsh` through `manual-e2e-smoke`.

That left one unnecessary gap:

- the core validation path was still more Windows-oriented than the package itself
- contributors on macOS or Linux needed PowerShell for a release gate that otherwise only depends on Node.js

This release closes that gap by making the manual E2E gate itself a natural Node-based cross-platform path.

## Best next entrypoint

- Install from npm: `npm install user-habit-pipeline`
- Quick integration guide: [docs/integration-quickstart.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/integration-quickstart.md)
- Codex current-session contract: [docs/codex-current-session-contract.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/codex-current-session-contract.md)
- Codex skill: [pingzi-crypto/manage-current-session-habits](https://github.com/pingzi-crypto/manage-current-session-habits)

## Validation

Release validation for this version includes:

- full `npm run release-check`
- direct `node ./scripts/manual-e2e-smoke.js`
- direct PowerShell wrapper regression through `pwsh -File ./scripts/manual-e2e-smoke.ps1`
