# Release Notes: v0.7.0

`user-habit-pipeline` `v0.7.0` makes the package easier to embed, easier to discover, and easier to describe correctly as an AI shorthand interpreter rather than a hidden workflow engine.

This release focuses on two practical improvements:

- Node.js and Electron hosts can now embed the official localhost HTTP contract directly from the library entrypoint
- the public package surface now explains the AI assistant, Codex, and user-habit use cases more clearly across npm and GitHub

## Highlights

- Added official library exports for the local HTTP server through `createHttpServer`, `startHttpServer`, and `routeHttpRequest`.
- Kept `user-habit-pipeline-http` as a thin CLI wrapper over the same shared HTTP server module so embedded and subprocess consumers stay aligned to one contract.
- Added regression coverage for starting and exercising the local HTTP server through the main package entrypoint.
- Updated package description, keywords, and README positioning so local-first AI shorthand interpretation, Codex integration, and user-habit workflows are easier to discover.

## Why This Release Exists

Before `v0.7.0`, the package already had a supported localhost HTTP CLI, but Node.js and Electron hosts still had to treat that surface as a subprocess concern.

This release closes that gap by promoting the same HTTP contract into an embeddable library surface while also tightening the public wording around what the package is and is not.

## Upgrade Notes

Existing CLI, library, and HTTP CLI consumers do not need code changes for previously supported flows.

New optional library entrypoints:

```js
const { createHttpServer, startHttpServer } = require("user-habit-pipeline");
```

## Validation

Release validation for this version includes:

- full `npm run release-check`
- direct HTTP module regression coverage
- tarball install smoke for installed package behavior
