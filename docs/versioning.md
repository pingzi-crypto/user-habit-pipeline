# Versioning

This repository currently follows a simple MVP-first versioning policy.

## Current Status

- current package version: `0.7.2`
- current stage: pre-stable MVP expansion
- compatibility goal: keep the main output contract stable while the implementation is refined

The `0.x` series should be treated as pre-stable.
Changes can still tighten behavior, documentation, and validation rules without implying a long-term stable API guarantee.

---

## What Should Stay Stable in `0.x`

Within the current `0.x` line, avoid unnecessary changes to:

- the top-level output field names
- the default registry format
- CLI flag names that already exist
- the meaning of the documented example cases

Allowed changes in `0.x`:

- clearer documentation
- stricter validation
- more regression tests
- packaging improvements
- conservative scoring fixes that align behavior with the spec

Avoid in `0.x` unless clearly justified:

- renaming `normalized_intent` values already documented
- changing the output shape
- broadening the project into workflow execution

---

## Release Shape

Before treating a change as a new internal release point:

1. update [CHANGELOG.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/CHANGELOG.md)
2. run `npm run release-check`
3. confirm [examples.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/examples.md) still matches the fixture source
4. confirm [mvp-spec.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/mvp-spec.md) still matches runtime behavior

---

## Future Direction

Possible future milestones:

- `0.7.x` for polishing package-consumer onboarding, official integration wrappers, and cross-environment install ergonomics
- `0.8.x` for deeper cross-environment install ergonomics and package-consumer hardening
- `1.0.0` only after the output contract and intended extension model are considered stable

Do not advance to `1.0.0` just because the implementation exists.
Advance only when the project boundary and public contract have stopped moving.
