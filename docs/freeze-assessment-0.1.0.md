# Freeze Assessment: 0.1.0

This document captures what `0.1.0` currently includes, what it intentionally does not include, and how to evaluate whether the MVP is ready to freeze.

## Included in 0.1.0

- explicit phrase-based habit interpretation
- conservative confidence scoring and clarification behavior
- default registry loading and validation
- custom registry injection by rules array or file path
- JSON-only interpretation CLI
- registry validation CLI
- `growth-hub` adapter example
- generated example documentation from fixture source
- JSON Schema artifact for registry files
- VS Code workspace schema association for registry-like JSON files
- package-level checks and dry-run packaging

## Intentionally Out of Scope in 0.1.0

- automatic learning
- hidden memory
- workflow execution
- role switching as workflow state
- approval logic
- service deployment
- broad semantic reasoning beyond explicit shorthand matching

These exclusions are part of the product boundary, not missing implementation work.

## Freeze Criteria

Treat `0.1.0` as ready to freeze when all of the following are true:

1. `npm run release-check` passes
2. the documented examples still match runtime behavior
3. the default registry validates successfully
4. the CLI help output remains accurate
5. no change in the branch expands the interpreter into workflow execution

## Quick Manual Verification

Run:

```powershell
npm run demo
```

This should show:

- one explicit default-registry example
- one conservative ambiguous example
- one alternate-registry example

## Assessment

At the current state of the repository:

- the MVP boundary is documented
- the runtime contract is tested
- registry authoring is documented and validated
- package and release checks are scripted

That is enough for an internal `0.1.0` freeze point.
It is not yet claiming long-term API stability.
