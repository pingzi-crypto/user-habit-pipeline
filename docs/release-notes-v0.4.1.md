# user-habit-pipeline v0.4.1

This patch release aligns the public npm package with the recent package-readiness and public-repo cleanup work.

## Highlights

- moved default runtime user state to a user data directory instead of assuming a writable repository checkout
- added a real package-install smoke test and a `prepublishOnly` gate
- updated the public README to be npm-first instead of repository-first
- adopted the Apache License 2.0 for the public package and repository
- removed author-machine absolute paths from the main public documentation set

## Why This Release Exists

`0.4.0` established the main feature set, but the public package metadata and repo surface still lagged behind the current packaging direction.

`0.4.1` closes that gap so:

- npm users see the correct public license
- new users land on install guidance that matches the published package
- the public repository better matches the project's portability rules

## Validation

This release was validated with:

```powershell
npm test
npm run release-check
npm publish --dry-run
```
