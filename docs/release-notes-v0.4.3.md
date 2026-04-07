# user-habit-pipeline v0.4.3

This release strengthens current-session suggestion quality and makes release-time validation tighter around the Codex bridge flow.

It stays within the existing project boundary:

- explicit over hidden
- suggestion-first
- user confirmation still controls writes

## Highlights

- added support for correction-style explicit habit definitions in current-session scans
- surfaced correction evidence directly in Codex chat-ready bridge replies
- expanded realistic session fixtures and manual E2E coverage for correction-style definitions
- gated backend release checks on manual E2E smoke
- expanded package install smoke to cover the installed Codex bridge scan/apply path
- refreshed cross-repo release docs to the current backend baseline

## Why This Release Exists

`v0.4.2` improved public packaging and presentation, but two practical gaps remained:

- current-session suggestion extraction did not yet recognize common explicit correction phrasing such as `不是 X，是 close_session` or `别按 X 理解，按 close_session 理解`
- release validation still relied too much on separate reminders instead of gating the actual Codex bridge and follow-up apply paths

This release closes those gaps without broadening the project into hidden learning or workflow execution.

## Validation

This release was validated with:

- `npm run release-check`
- `npm run manual-e2e-smoke`
- installed package smoke covering:
  - `codex-session-habits --request "扫描这次会话里的习惯候选" --thread-stdin`
  - cached follow-up apply through `添加第1条`
- cross-repo rehearsal with:
  - backend `npm run release-check`
  - skill `install.ps1 -CheckOnly`
  - skill `scripts/check-install.ps1 -SmokeTest`
  - skill repo-override preview through `install.ps1 -BackendRepoPath <path> -CheckOnly`
