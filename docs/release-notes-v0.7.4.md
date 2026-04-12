# Release Notes: v0.7.4

`user-habit-pipeline` `v0.7.4` is a Codex and chat-host integration release focused on making the current-session habit flow productized instead of merely documented.

This release focuses on one practical outcome:

- installed consumers can now scaffold a real current-session host starter for `codex-session-habits`, not only general Node or Python examples

## Highlights

- Added a packaged current-session host starter under `examples/current-session-host-node/`.
- Extended `user-habit-pipeline-init-consumer` with `--host codex` so consumers can scaffold that starter directly into another project.
- Added source-level and installed-package validation for the scan/apply current-session host flow.
- Hardened install smoke so generated starter scripts are executed from a real installed consumer project, not merely checked for file existence.

## Why This Release Exists

Before `v0.7.4`, the package already documented the `codex-session-habits` contract, but the easiest copyable starter path still existed only for general external consumers.

This release closes that gap by turning the current-session scan/apply path into a shipped starter surface that host projects can generate and adapt directly.

## Upgrade Notes

No existing CLI names, output fields, or library entrypoints were broken in this release.

Existing consumers do not need code changes.

New Codex-style or chat-host consumers can now start with:

```powershell
npx user-habit-pipeline-init-consumer --host codex --out .\habit-pipeline-codex-starter
```

## Validation

Release validation for this version includes:

- full `npm run release-check`
- regression tests for the new current-session host starter
- installed-package smoke coverage for generated Node, Python, and Codex-style starter paths
