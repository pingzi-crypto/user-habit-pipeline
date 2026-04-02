# Changelog

## Unreleased

- Added a Codex-facing session bridge CLI so in-app skills can pass the current conversation transcript through `--thread-stdin` and reuse the existing prompt-based management flow.
- Added documentation for the installed Codex skill entry path and the current-session one-sentence flow inside the Codex app.
- Cached the latest session suggestion snapshot locally so follow-up apply actions can use `添加第1条` or `--apply-candidate c1` without an explicit suggestions file path.
- Added apply-time overrides for suggestion candidates so users can confirm with messages such as `把第1条加到 session_close 场景`, or provide `intent` when applying a review-only candidate.
- Added explicit suggestion-apply support so reviewed session candidates can be written into the user overlay through `--apply-candidate` or prompt requests such as `添加第1条`.
- Added read-only session habit suggestion scanning from transcript text, including prompt-triggered `suggest` requests through the manage-habits CLI.
- Added transcript parsing and candidate extraction for explicit add requests, explicit phrase definitions, and repeated short phrases that are not already registered.
- Added documentation for the Codex-oriented transcript-scan backend and clarified that the remaining app boundary is transcript injection from visible conversation context.
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
