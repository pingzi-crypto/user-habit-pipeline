# Project Registry Template

This folder is a minimal template for shipping a project-specific registry on top of `user-habit-pipeline`.

Files:

- `custom-habits.json`: example registry data
- `smoke-test.js`: minimal validation and interpretation check

## When To Use This Template

Use this pattern when:

- one project has repeated shorthand that does not belong in the package defaults
- you want explicit registry data instead of hidden prompt logic
- you want a portable file that can be versioned, reviewed, and validated

Do not use this pattern to encode workflow execution.
The registry should describe shorthand meaning, not run downstream actions.

## Validate The Registry

From the package root:

```powershell
npx validate-registry .\examples\project-registry\custom-habits.json
```

## Interpret With The Registry

```powershell
npx user-habit-pipeline --message "收口一下" --scenario session_close --registry .\examples\project-registry\custom-habits.json
```

## Run The Example Smoke Test

```powershell
node .\examples\project-registry\smoke-test.js
```

The smoke test proves two things:

- the example registry validates
- one example phrase resolves through the main interpreter

## Reuse Pattern

In another project, the usual pattern is:

1. copy this folder or start from `custom-habits.json`
2. replace the example phrases with your own repeated shorthand
3. validate with `validate-registry`
4. pass the file through `--registry <path>` or `interpretHabit(..., { registryPath })`

## Library Example

```js
const path = require("node:path");
const { interpretHabit } = require("user-habit-pipeline");

const result = interpretHabit(
  {
    message: "收口一下",
    scenario: "session_close"
  },
  {
    registryPath: path.resolve("./custom-habits.json")
  }
);
```
