# Release Notes: v0.7.2

`user-habit-pipeline` `v0.7.2` is a package-consumer hardening release focused on making the shipped install and validation story hold together consistently across Windows, macOS, and Linux.

This release focuses on one practical outcome:

- the same release-check flow now works as a real cross-platform gate instead of only looking reliable on one environment

## Highlights

- Added a GitHub Actions matrix that runs the shared `release-check` flow on `windows-latest`, `macos-latest`, and `ubuntu-latest`.
- Fixed line-ending-sensitive examples-doc validation so Windows CRLF does not cause false failures in generated-doc checks.
- Removed the package metadata test dependency on external `rg`, replacing it with a built-in Node.js source scan so Linux and macOS runners do not depend on extra tooling.
- Hardened the package-install smoke flow on Windows by routing npm execution and installed `.cmd` shim invocation through runner-compatible paths.
- Added public documentation that clearly states the currently verified platform matrix for installed consumers.

## Why This Release Exists

Before `v0.7.2`, the project already aimed to be usable across major local environments, but the release gate still had environment-specific weak spots that only showed up once a real three-platform CI matrix was turned on.

This release closes those gaps so cross-platform support is backed by repeatable validation rather than inference.

## Upgrade Notes

No public CLI names, runtime output fields, or library entrypoints changed in this release.

Existing consumers do not need code changes.

## Validation

Release validation for this version includes:

- full `npm run release-check`
- GitHub Actions validation on Windows, macOS, and Linux
- installed-package smoke coverage for CLI shims, library imports, HTTP flow, and current-session habit operations
