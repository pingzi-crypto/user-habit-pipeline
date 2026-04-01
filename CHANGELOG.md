# Changelog

## Unreleased

- Added `--request-stdin` to the habit management CLI so multiline prompt requests work reliably in PowerShell and other shell setups that do not preserve multiline `--request` arguments through `npm run`.
- Documented the PowerShell here-string testing flow and added regression coverage for stdin-based prompt requests.

## 0.3.0 - 2026-04-01

- Added user overlay import/export support for persistent habit phrase customizations.
- Added `replace` and `merge` import modes for user registry state management.
- Expanded lightweight prompt parsing to better handle Chinese management phrasing and multiline add requests.
- Added CLI coverage and regression tests for import/export and more tolerant prompt parsing.

## 0.2.0 - 2026-04-01

- Added a persistent user-habits overlay on top of the default registry.
- Added support for user-managed habit phrase add/remove/list operations.
- Added a lightweight prompt parser so users can manage habits with simple natural-language requests.
- Added a dedicated `manage-user-habits` CLI and `--user-registry` support on the main interpreter CLI.
- Added regression tests and documentation for user-managed habit phrases.

## 0.1.0 - 2026-04-01

- Added a minimal habit interpreter with explicit phrase matching, scoring, and clarification rules.
- Added a `growth-hub` adapter that projects interpretation results into downstream hint fields.
- Added CLI entrypoints for interpretation and registry validation.
- Added runtime registry validation plus a formal JSON Schema artifact.
- Added fixture-driven examples and generated example documentation from a single source.
- Added workspace editor integration for registry schema hints in VS Code.
- Added API/reference, versioning, and release-check documentation plus a higher-level `release-check` script.
