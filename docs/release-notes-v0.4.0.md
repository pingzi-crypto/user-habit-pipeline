# Release Notes: v0.4.0

Released on `2026-04-05`.

## Summary

`v0.4.0` extends the project from a habit interpretation CLI into a Codex-facing current-session suggestion flow with explicit confirmation, inspectable scoring, and stronger release discipline.

The release keeps the product boundary unchanged:

- this project still interprets shorthand expressions into structured intent hints
- this project still does not execute downstream workflow actions
- session suggestion scans remain review-first and do not auto-write active habits

## Highlights

- Added a formal Codex current-session contract covering transcript input, host responsibilities, bridge fields, and error boundaries.
- Added a Codex-facing bridge CLI so skills can scan the visible conversation and reuse prompt-style follow-up actions such as `添加第1条`.
- Added realistic transcript fixtures and regression coverage for explicit-definition and review-only current-session scans.
- Added persistent suggestion suppression so noisy phrases can be ignored without becoming active habits.
- Added explicit apply and override flows for reviewed candidates, including prompt-style confirmation and review-only intent overrides.
- Added confidence-scoring documentation and richer confidence details for session suggestion output.
- Added project principles and release-checklist updates so explicit confirmation, portable paths, and low-ROI stop behavior stay part of the release contract.
- Added `--request-stdin` support and documented multiline prompt testing for shells that do not preserve multiline request arguments well.

## Example Commands

Scan the current conversation through the Codex-facing bridge:

```powershell
@'
user: 以后我说“收尾一下”就是 close_session
assistant: 收到。
user: 收尾一下
'@ | npm run codex-session-habits -- --request "扫描这次会话里的习惯候选" --thread-stdin
```

Apply the first reviewed candidate:

```powershell
npm run codex-session-habits -- --request "添加第1条"
```

Apply a review-only candidate with explicit intent:

```powershell
npm run codex-session-habits -- --request "把第1条加到 session_close 场景; intent=close_session"
```

Ignore a noisy suggestion without turning it into an active habit:

```powershell
npm run manage-habits -- --request "忽略第1条"
```

Use multiline prompt input reliably through stdin:

```powershell
@'
新增习惯短句 phrase=收尾一下
intent=close_session
场景=session_close
置信度=0.86
'@ | npm run manage-habits -- --request-stdin
```

## Validation

This release was verified with:

- `npm test`
- `npm run release-check`
- `npm run manual-e2e-smoke`

## Related Docs

- [CHANGELOG.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/CHANGELOG.md)
- [codex-current-session-contract.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/codex-current-session-contract.md)
- [session-habit-suggestions.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/session-habit-suggestions.md)
- [user-habit-management.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/user-habit-management.md)
