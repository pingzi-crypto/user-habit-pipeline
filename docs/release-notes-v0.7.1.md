# Release Notes: v0.7.1

`user-habit-pipeline` `v0.7.1` converts the package source to TypeScript without changing the existing CLI names, CommonJS entrypoints, or the review-first interpretation contract.

This release focuses on package-consumer hardening:

- the source is now authored in TypeScript and shipped with generated declaration files
- the published tarball is smaller and more intentional, so installed consumers get the runtime and docs they actually need

## Highlights

- Migrated the authoring source tree from JavaScript to TypeScript while keeping `main`, `exports`, and `bin` entrypoints stable for existing consumers.
- Added generated `.d.ts` output for the public library surface so TypeScript consumers can import the package without manual ambient declarations.
- Removed `@ts-nocheck` from the TypeScript source files and tightened explicit typing across the interpreter, user registry, suggestion flow, and HTTP integration modules.
- Reduced the published package contents to compiled runtime files, declarations, key docs, examples, and required data artifacts instead of shipping the full authoring tree.

## Why This Release Exists

Before `v0.7.1`, the package runtime was usable from TypeScript projects, but consumers did not receive a maintained declaration surface from the official package and the published tarball still carried more authoring material than necessary.

This release closes both gaps while deliberately preserving the current public runtime contract.

## Upgrade Notes

Existing JavaScript and CLI consumers do not need code changes.

TypeScript consumers can now import the package directly:

```ts
import {
  interpretMessage,
  createHttpServer,
  loadUserRegistry
} from "user-habit-pipeline";
```

## Validation

Release validation for this version includes:

- full `npm run release-check`
- package metadata regression coverage for type declarations and publish file filtering
- tarball install smoke for installed package behavior
