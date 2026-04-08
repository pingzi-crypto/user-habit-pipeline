# user-habit-pipeline v0.5.0

This release turns the previous local HTTP wrapper example into an official package entrypoint and validates it as part of the shipped install surface.

It keeps the same project boundary:

- interpretation layer only
- explicit confirmation still controls writes
- local integration convenience without hidden workflow execution

## Highlights

- added an official localhost server bin: `user-habit-pipeline-http`
- promoted the earlier wrapper example into a formal CLI under `src/http-server-cli.js`
- added HTTP server flags for `--host`, `--port`, `--user-registry`, and `--max-body-bytes`
- expanded package-install smoke to validate installed HTTP `/health`, `/manage`, `/interpret`, and `/suggest` routes
- added direct tests for HTTP CLI argument parsing and route behavior
- updated README and integration docs so the HTTP path is now presented as a supported local integration option

## Why This Release Exists

`v0.4.3` already had strong local CLI, library, and Codex bridge paths, but one practical gap remained:

- teams that wanted a localhost API shape still had to adopt a repo example instead of a formal package entrypoint

That extra packaging friction made integration look more experimental than it really needed to be.

This release closes that gap by making the local HTTP transport installable, documented, and release-gated.

## Validation

This release was validated with:

- `npm test`
- `npm run package-install-smoke`
- `npm run release-check`

Installed package validation now includes:

- `user-habit-pipeline-http --help`
- `GET /health`
- `POST /manage`
- `POST /interpret`
- `POST /suggest`
