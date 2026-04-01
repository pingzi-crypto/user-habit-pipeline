# API Reference

This document describes the public surface currently exposed by the package.

The package entrypoint is:

- [src/index.js](/E:/user-habit-pipeline/src/index.js)

---

## Library Exports

### `interpretHabit(input, options?)`

Interpret a user shorthand message into a structured, reviewable intent hint.

Input:

- `input.message: string`
- `input.recent_context?: string[]`
- `input.scenario?: string | null`

Options:

- `options.rules?: HabitRule[]`
- `options.registryPath?: string`

Output fields:

- `normalized_intent`
- `habit_matches`
- `disambiguation_hints`
- `confidence`
- `should_ask_clarifying_question`
- `preferred_terms`
- `notes`

Notes:

- if `options.rules` is provided, the interpreter validates and uses that rule set directly
- if `options.registryPath` is provided, the interpreter loads and validates that file
- if neither is provided, the default registry is used

### `loadDefaultHabits()`

Load and cache the default registry from:

- [default_habits.json](/E:/user-habit-pipeline/src/habit_registry/default_habits.json)

### `loadHabitsFromFile(registryPath)`

Load and validate a registry file from disk.
Throws if the registry is invalid.

### `validateHabitRules(rules)`

Validate an in-memory registry array.
Returns the same array if valid.
Throws if any rule violates the runtime contract.

### `toGrowthHubHint(habitOutput)`

Project a standard interpretation result into a thin `growth-hub` hint shape.

Output fields:

- `hint_intent`
- `hint_confidence`
- `hint_requires_confirmation`
- `hint_terms`
- `hint_notes`

This adapter does not trigger workflow actions.

---

## CLI

The main CLI entrypoint is:

- [cli.js](/E:/user-habit-pipeline/src/cli.js)

Command:

```powershell
npm run interpret -- --message "更新入板" --scenario status_board
```

Help:

```powershell
npm run interpret -- --help
```

Supported flags:

- `--message <text>` required
- `--scenario <name>` optional
- `--context <text>` repeatable
- `--adapter growth-hub` optional
- `--registry <path>` optional

The CLI prints JSON only.

---

## Validation CLI

The registry validation CLI entrypoint is:

- [validate-registry-cli.js](/E:/user-habit-pipeline/src/validate-registry-cli.js)

Command:

```powershell
npm run validate-registry -- .\src\habit_registry\default_habits.json
```

Help:

```powershell
npm run validate-registry -- --help
```

Behavior:

- prints structured JSON on success
- prints a validation error to stderr and exits non-zero on failure

---

## Stability Notes

The current intent names and output fields are intended to be stable for the MVP.
The internal scoring details may still change as long as they remain consistent with:

- [mvp-spec.md](/E:/user-habit-pipeline/docs/mvp-spec.md)
- [examples.md](/E:/user-habit-pipeline/docs/examples.md)
