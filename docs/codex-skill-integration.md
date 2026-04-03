# Codex Skill Integration

This document describes the current Codex app entry path for session-based habit suggestions.

The goal is to let the user stay inside the current Codex conversation and trigger the flow with one short prompt, without manually locating transcript files or running ad hoc shell commands.

---

## Current Entry Surface

The repository now provides a Codex-facing bridge CLI:

- [codex-session-habits-cli.js](/E:/user-habit-pipeline/src/codex-session-habits-cli.js)

The formal host/skill contract for that bridge is documented in:

- [codex-current-session-contract.md](/E:/user-habit-pipeline/docs/codex-current-session-contract.md)

It accepts the same lightweight request phrases that the management parser already understands, but exposes a session-oriented transcript flag:

- `--thread <path>`
- `--thread-stdin`

This keeps the contract aligned with the user mental model:

- current conversation text goes in
- candidate suggestions come out
- explicit confirmation still controls writes to the user overlay

---

## Recommended In-App Flow

### 1. Scan the current conversation

The Codex skill should gather the relevant turns from the current thread context, format them as a role-prefixed transcript, and pipe them into:

```powershell
$transcript = @'
user: 以后我说“收尾一下”就是 close_session
assistant: 收到。
user: 收尾一下
'@
$transcript | node E:\user-habit-pipeline\src\codex-session-habits-cli.js --request "扫描这次会话里的习惯候选" --thread-stdin
```

The bridge CLI forwards the request into the existing backend and caches the latest suggestion snapshot locally next to the user registry.
On successful responses it now also returns:

- `assistant_reply_markdown`
- `suggested_follow_ups`
- `next_step_assessment`

These fields are intended for Codex skill / chat-UI rendering so the skill can show a natural Chinese summary instead of re-deriving one from raw candidate JSON.
When `next_step_assessment.level = low_roi`, the bridge may also surface a one-word stop path such as `停`.

### 2. Confirm a candidate with a short follow-up prompt

Once the scan result has been cached, the follow-up prompt no longer needs transcript input:

```powershell
node E:\user-habit-pipeline\src\codex-session-habits-cli.js --request "添加第1条"
node E:\user-habit-pipeline\src\codex-session-habits-cli.js --request "把第1条加到 session_close 场景"
```

### 3. Apply review-only candidates with explicit meaning

If a candidate is review-only, the user can still confirm it by supplying an explicit intent:

```powershell
node E:\user-habit-pipeline\src\codex-session-habits-cli.js --request "把第1条加到 session_close 场景; intent=close_session"
```

---

## Transcript Guidance

The skill should not look for Codex app thread files on disk.

Instead, it should build a concise transcript directly from the visible conversation context and keep role prefixes such as:

- `user:`
- `assistant:`
- `system:`
- `tool:`

For large threads, prefer a focused excerpt that includes:

- explicit phrase definitions
- user corrections
- repeated short phrases
- nearby assistant clarifications

This keeps the flow lightweight and avoids coupling the project to any private host-side storage scheme.

If you change transcript gathering, request routing, or chat-facing bridge fields, update the contract document above in the same change set.

---

## Installed Skill

The intended auto-discovered skill location is:

- `C:\Users\pz\.codex\skills\manage-current-session-habits`

That skill can use the bridge CLI above so the user can trigger:

- `扫描这次会话里的习惯候选`
- `添加第1条`
- `把第1条加到 session_close 场景`
- `停`

from a normal Codex app conversation.
