# Changelog

## Unreleased

- No changes yet.

## 0.7.5 - 2026-04-13

- Tightened the public README opening so the value proposition, fastest install path, demo repo, and Codex skill entrypoints are visible faster.
- Added a committed README demo GIF and linked the public external demo repo more prominently from the package README and integration quickstart.
- Clarified integration guidance around project-local `USER_HABIT_PIPELINE_HOME` isolation for current-session host flows.
- Refreshed the public release copy and GitHub metadata so the npm package, GitHub repo, demo repo, and skill repo form a clearer outside-adoption path.

## 0.7.4 - 2026-04-12

- Added a packaged current-session host starter for Codex / chat-style integrations, covering transcript scan and short follow-up apply flows through `codex-session-habits`.
- Extended `user-habit-pipeline-init-consumer` with `--host codex` so installed consumers can scaffold the current-session host starter directly.
- Added regression and installed-package smoke coverage for the new current-session host starter path.
- Hardened installed-package smoke coverage for `user-habit-pipeline-init-consumer` by executing the generated Node starter scripts from a real installed consumer project, not only checking that the files exist.

## 0.7.3 - 2026-04-12

- Added `user-habit-pipeline-init-consumer` so installed packages can scaffold copyable Node.js or Python host starter files directly into another project directory.
- Added install-smoke coverage for the new consumer starter generator so shipped npm tarballs prove the scaffold command works after install.
- Added copyable external-consumer starter templates for Node.js and Python hosts instead of only isolated snippets.
- Added a Node.js CLI-subprocess demo so host projects can adopt the package through an explicit JSON boundary without linking directly to the library.
- Added a Python external-consumer template covering both CLI and local HTTP integration paths.

## 0.7.2 - 2026-04-12

- Hardened release validation to run across Windows, macOS, and Linux through a shared GitHub Actions matrix.
- Fixed cross-platform validation gaps caused by line-ending-sensitive examples doc checks and a Windows-only dependency on external `rg` during package metadata testing.
- Hardened the package-install smoke flow on Windows by routing npm invocation and installed `.cmd` shim execution through safer runner-compatible paths.
- Added public docs that explicitly state the currently verified platform matrix and the cross-platform validation scope for installed consumers.

## 0.7.1 - 2026-04-11

- Refactored the source tree from JavaScript to TypeScript while preserving the existing CommonJS runtime entrypoints and published CLI names.
- Added generated declaration files for the public library surface so TypeScript consumers can import the package without hand-written ambient types.
- Removed `@ts-nocheck` from the TypeScript source files and tightened the core interpreter, user-registry, suggestion, and HTTP entry modules with explicit types.
- Trimmed the published package contents so install consumers receive the compiled runtime, type declarations, and required docs without the full authoring source tree.

## 0.7.0 - 2026-04-10

- Added official library exports for the local HTTP server so Node.js and Electron hosts can embed the localhost integration surface without spawning the CLI.
- Kept `user-habit-pipeline-http` as a thin CLI wrapper over the same shared HTTP server module.
- Added regression coverage for starting the local HTTP server through the main library entrypoint.
- Refined the public package positioning across the npm description, keywords, and README so AI-tooling, Codex, and user-habit use cases are easier to discover.

## 0.6.0 - 2026-04-08

- Added official Python and PowerShell localhost client examples for the supported `user-habit-pipeline-http` entrypoint.
- Corrected integration docs so the shipped local HTTP entrypoint is described as a built-in package surface rather than an external wrapper only.
- Added a packaged project-registry starter example under `examples/project-registry/` for project-specific habit distribution.
- Added install-smoke validation for the packaged project-registry template so published tarballs prove the starter artifacts are actually usable after install.
- Added `user-habit-pipeline-init-registry` so consumers can scaffold a custom registry directory directly from the installed package.
- Updated package and docs positioning toward richer registry authoring and project-specific distribution workflows.

## 0.5.0 - 2026-04-08

- Added an official local HTTP entrypoint through `user-habit-pipeline-http` for localhost-style integration from other local projects.
- Promoted the earlier local HTTP wrapper example into a formal CLI under `src/http-server-cli.js`, while keeping the example path as a thin compatibility wrapper.
- Added configurable HTTP server flags for `--host`, `--port`, `--user-registry`, and `--max-body-bytes`.
- Expanded package-install smoke coverage to validate the installed HTTP entrypoint, including `/health`, `/manage`, `/interpret`, and `/suggest`.
- Added direct tests for the HTTP CLI argument contract and health / interpret route behavior.
- Updated integration docs and the public README to surface the official HTTP entrypoint as a supported local integration path.
- Refreshed package metadata and repository presentation so the local integration surface is easier to discover.

## 0.4.3 - 2026-04-08

- Added support for correction-style explicit session habit definitions such as `不是 X，是 close_session` and `别按 X 理解，按 close_session 理解`.
- Surfaced correction evidence directly in Codex chat-ready bridge replies instead of only reflecting it through higher scores.
- Added realistic correction-style session fixtures plus regression coverage across the suggestion backend and the Codex bridge.
- Expanded manual E2E smoke coverage to include correction-style definition scans.
- Gated backend `release-check` on `manual-e2e-smoke` so bridge-critical flows block releases on failure.
- Expanded package install smoke to verify the installed Codex bridge scan/apply path and cached follow-up candidate apply.
- Refreshed cross-repo release docs to the current `v0.4.2` backend baseline.

## 0.4.2 - 2026-04-07

- Refreshed the public npm and GitHub display copy to better position the package as a product-facing CLI and library.
- Shortened the npm README so the install path, main commands, runtime state, and product boundary are visible in under two minutes.
- Updated the npm package description and GitHub release copy to match the simplified public positioning.

## 0.4.1 - 2026-04-07

- Prepared the package for installable distribution by moving default user state to a user data directory with a compatibility fallback for older repo-local overlays.
- Added runtime path helpers and exported the user-home override constant so installed consumers can resolve or override package-managed state without hardcoded paths.
- Added a real package-install smoke test that packs, installs into a temporary consumer, validates installed bin shims, and verifies installed library imports before publish.
- Added a `prepublishOnly` gate so `npm publish` runs the full release check first.
- Switched the public package license to Apache-2.0 and added a repository license file.
- Reworked the public README and docs to remove author-machine paths and present npm-first install and usage guidance.

## 0.4.0 - 2026-04-05

- Added a formal Codex current-session contract document covering transcript input, bridge response fields, host responsibilities, and bridge error boundaries.
- Added realistic Codex session transcript fixtures and regression coverage for noisy current-thread scans through both the suggestion backend and the Codex bridge CLI.
- Added a formal confidence-scoring document that separates interpreter confidence from session-suggestion confidence and records the current runtime thresholds and bonuses.
- Added a formal project-principles document that captures the current interpretation-layer boundary, explicit-confirmation model, and the rule that install/config paths must stay configurable rather than hardcoded.
- Added persistent suggestion suppression so users can ignore a candidate with `忽略第1条`, `--ignore-candidate c1`, or suppress a noisy phrase with `以后别再建议这个短句`.
- Added `ignored_suggestions` to the user registry state so noisy phrases stay excluded from future suggestion scans without becoming active habits.
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
