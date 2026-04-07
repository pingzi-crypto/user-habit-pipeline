# user-habit-pipeline v0.4.1

This patch release makes the public npm package easier to adopt as a real product surface.

## Highlights

- moved runtime user state to a user data directory instead of assuming a writable repository checkout
- added a real package-install smoke test and a `prepublishOnly` gate
- updated the public README to match an npm-first install path
- adopted the Apache License 2.0 for the public package and repository
- removed author-machine absolute paths from the public documentation surface

## Why This Release Exists

`0.4.0` established the main feature set, but the public package surface still felt more like an internal repo than a shareable install.

`0.4.1` closes that gap so:

- npm users land on install guidance that matches the published package
- runtime state behaves safely in packaged installs
- the public repo and package metadata better match the product's portability rules

## Validation

This release was validated with:

```powershell
npm test
npm run release-check
npm publish --dry-run
```
