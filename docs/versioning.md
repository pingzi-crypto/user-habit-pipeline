# Versioning

This repository currently follows a simple MVP-first versioning policy.

## Current Status

- current package version: `0.1.0`
- current stage: MVP
- compatibility goal: keep the main output contract stable while the implementation is refined

The `0.x` series should be treated as pre-stable.
Changes can still tighten behavior, documentation, and validation rules without implying a long-term stable API guarantee.

---

## What Should Stay Stable in `0.1.x`

Within the `0.1.x` line, avoid unnecessary changes to:

- the top-level output field names
- the default registry format
- CLI flag names that already exist
- the meaning of the documented example cases

Allowed changes in `0.1.x`:

- clearer documentation
- stricter validation
- more regression tests
- packaging improvements
- conservative scoring fixes that align behavior with the spec

Avoid in `0.1.x` unless clearly justified:

- renaming `normalized_intent` values already documented
- changing the output shape
- broadening the project into workflow execution

---

## Release Shape

Before treating a change as a new internal release point:

1. update [CHANGELOG.md](/E:/user-habit-pipeline/CHANGELOG.md)
2. run `npm run release-check`
3. confirm [examples.md](/E:/user-habit-pipeline/docs/examples.md) still matches the fixture source
4. confirm [mvp-spec.md](/E:/user-habit-pipeline/docs/mvp-spec.md) still matches runtime behavior

---

## Future Direction

Possible future milestones:

- `0.2.x` for broader registry authoring and tooling improvements
- `0.3.x` for more adapter examples or packaging refinement
- `1.0.0` only after the output contract and intended extension model are considered stable

Do not advance to `1.0.0` just because the implementation exists.
Advance only when the project boundary and public contract have stopped moving.
