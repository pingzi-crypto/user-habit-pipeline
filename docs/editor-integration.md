# Editor Integration

This repository includes a workspace-level schema association for habit registry files.

The configuration lives at:

- [.vscode/settings.json](/E:/user-habit-pipeline/.vscode/settings.json)

It maps these file patterns to the registry schema:

- `/src/habit_registry/*.json`
- `/tests/fixtures/*habits.json`

The schema file is:

- [registry.schema.json](/E:/user-habit-pipeline/docs/registry.schema.json)

---

## VS Code Behavior

When the workspace is opened in VS Code:

- matching registry files should get schema-backed field hints
- invalid field shapes should show editor diagnostics
- optional fields should still display descriptions from the schema

This setup is intentionally narrow.
It only targets registry-like JSON files in this repository.

---

## Custom Registry Files

If you create a new registry file outside the default patterns, either:

1. move it under `src/habit_registry/`
2. move it under `tests/fixtures/`
3. extend [.vscode/settings.json](/E:/user-habit-pipeline/.vscode/settings.json) with another `fileMatch` entry

Keep the schema association scoped to registry files only.

---

## Runtime Note

Editor schema support is convenience only.
Runtime validation still happens through the built-in validator and `validate-registry` CLI.
