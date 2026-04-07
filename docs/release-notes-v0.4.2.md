# user-habit-pipeline v0.4.2

This patch release refreshes the public package presentation without changing the core runtime contract.

## Highlights

- shortened the npm README into a faster product-facing quick start
- updated the package description to better explain the CLI and library surface
- aligned the GitHub release copy with the simpler public positioning

## Why This Release Exists

`0.4.1` fixed packaging and portability, but the public-facing copy still read more like internal project notes than a product install surface.

`0.4.2` closes that gap so new users can understand:

- what the package is
- how to install it
- how to try it quickly
- where the product boundary stops

without reading through the full engineering background first.

## Validation

This release was validated with:

```powershell
npm run release-check
npm publish --dry-run
```
