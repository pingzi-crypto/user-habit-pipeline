# Release Notes: v0.7.3

`user-habit-pipeline` `v0.7.3` is an integration-onboarding release focused on making it materially easier for another local project to adopt the package without cloning the repository or manually copying example files one by one.

This release focuses on one practical outcome:

- installed consumers can now scaffold copyable host starter files directly from the published package

## Highlights

- Added `user-habit-pipeline-init-consumer` so another project can generate a ready-to-edit starter directory for `node` or `python`.
- Added a packaged Node.js starter set that covers direct library use, CLI subprocess integration, and embedded local HTTP integration.
- Added a packaged Python starter set that covers CLI-based JSON integration and localhost HTTP client integration.
- Expanded installed-package smoke validation so the published tarball proves the new starter generator works after a real npm install.

## Why This Release Exists

Before `v0.7.3`, the repository already shipped useful external-consumer examples, but the adoption path still expected users to discover those files and copy them manually.

This release turns that into an explicit product surface: install the package, run one scaffold command, and start from a real local template that matches the supported integration boundary.

## Upgrade Notes

No existing CLI names, output fields, or library entrypoints were broken in this release.

Existing consumers do not need to change anything.

New consumers can now start with:

```powershell
npx user-habit-pipeline-init-consumer --host node --out .\habit-pipeline-starter
npx user-habit-pipeline-init-consumer --host python --out .\habit-pipeline-python-starter
```

## Validation

Release validation for this version includes:

- full `npm run release-check`
- installed-package smoke coverage for the new `init-consumer` scaffold path
- regression tests for both Node and Python starter generation
