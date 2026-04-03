# Codex Current Session Contract

This document defines the current contract between a Codex-side host or skill and the `user-habit-pipeline` backend for current-session habit scanning.

It exists to make the in-conversation entry path stable, inspectable, and portable.

The contract is intentionally narrow:

- the host gathers visible conversation text
- the backend interprets or suggests habit candidates from that text
- explicit user confirmation still controls durable writes

It does not authorize the backend to inspect private Codex storage, infer hidden state, or execute downstream workflow actions.

---

## 1. Contract Goal

The preferred user experience is:

1. the user stays inside the current Codex conversation
2. the user triggers the flow with one short prompt such as `扫描这次会话里的习惯候选`
3. the host/skill passes current conversation text into the bridge
4. the backend returns structured candidate data plus chat-ready follow-up guidance
5. the user explicitly confirms add / ignore / stop actions

This contract is meant to reduce user friction without introducing hidden automation.

---

## 2. Stable Entry Point

The current bridge entrypoint is:

- [codex-session-habits-cli.js](/E:/user-habit-pipeline/src/codex-session-habits-cli.js)

Recommended invocation shape:

```powershell
@'
user: 以后我说“收尾一下”就是 close_session
assistant: 收到。
user: 收尾一下
'@ | npm run codex-session-habits -- --request "扫描这次会话里的习惯候选" --thread-stdin
```

The bridge keeps three responsibilities stable:

- translate Codex-oriented transcript input into the existing backend transcript contract
- preserve the short follow-up flow by reusing the latest local suggestion cache
- enrich backend output with chat-oriented presentation fields for the host UI

---

## 3. Request Classes

The bridge currently supports four request classes.

### 3.1 Current-session scan

Examples:

- `扫描这次会话里的习惯候选`

Required input:

- `--request <text>`
- exactly one thread source:
  - `--thread <path>`
  - or `--thread-stdin`

Behavior:

- forwards the request into the suggestion backend
- saves the latest suggestion snapshot next to the chosen user registry
- returns candidate data plus chat-ready rendering fields

### 3.2 Follow-up candidate confirmation

Examples:

- `添加第1条`
- `把第1条加到 session_close 场景`
- `把第1条加到 session_close 场景; intent=close_session`
- `忽略第1条`

Required input:

- `--request <text>`

Thread input is not required for follow-up confirmation because the bridge reuses the latest local suggestion snapshot.

### 3.3 Direct prompt-style habit management

Examples:

- `添加用户习惯短句: phrase=收尾一下; intent=close_session`
- `删除用户习惯短句: 收尾一下`
- `列出用户习惯短句`
- `以后别再建议这个短句: 收工啦`

Behavior:

- forwards directly into the existing management backend
- returns the backend result plus chat-ready rendering fields

### 3.4 Local stop request

Examples:

- `停`
- `跳过`

Behavior:

- handled locally in the bridge
- does not forward into the habit-management parser
- returns a structured stop response so the host can immediately stop the current low-ROI direction

---

## 4. Thread Input Contract

For current-session scans, the host must provide transcript text from visible conversation context.

Preferred source:

- the currently visible Codex conversation

The host should not:

- scrape unknown private Codex thread stores
- hardcode app-internal storage locations
- require the user to manually locate transcript files on disk

### 4.1 Accepted transcript styles

The parser accepts role-prefixed transcript lines such as:

- `user: ...`
- `assistant: ...`
- `system: ...`
- `tool: ...`

Chinese role labels are also accepted and normalized:

- `用户: ...`
- `助手: ...`
- `系统: ...`
- `工具: ...`

### 4.2 Multiline message grouping

If a line begins with a supported role prefix, it starts a new message.
Subsequent non-prefixed lines are appended to the current message until the next role prefix appears.

This means the host may pass multiline user turns such as:

```text
user: 新增习惯短句 phrase=收尾一下
intent=close_session
场景=session_close
```

and the backend will treat that block as one user message.

### 4.3 Unknown or unprefixed text

If transcript text begins without a recognized role prefix, the parser keeps it as an `unknown` message instead of dropping it.

This keeps the bridge tolerant of imperfect host formatting, but host integrations should still prefer explicit role prefixes because suggestion quality is better when user turns are clearly marked.

### 4.4 Host-side transcript selection guidance

For large threads, the host should prefer a focused excerpt that includes:

- explicit phrase definitions
- user corrections
- repeated short user phrases
- nearby assistant clarifications

The host does not need to replay the full conversation history.
The project boundary still prefers short, visible, local context over broad historical mining.

---

## 5. Response Contract

The bridge returns backend JSON plus presentation fields intended for Codex chat rendering.

These bridge-specific fields are part of the current integration contract:

- `assistant_reply_markdown`
- `suggested_follow_ups`
- `next_step_assessment`

### 5.1 `assistant_reply_markdown`

Type:

- `string`

Purpose:

- natural-language summary for direct display in the Codex conversation UI

Requirements:

- should stay human-readable
- should avoid leaking internal implementation labels when a simpler explanation exists
- may include low-ROI stop wording when appropriate

### 5.2 `suggested_follow_ups`

Type:

- `array[string]`

Purpose:

- short follow-up prompts the host may surface directly to the user

Current expectations:

- suggestions should stay lightweight and copyable as plain prompts
- when the current direction is low ROI, the stop word may be prepended
- when the current direction is already stopped, this array should be empty

### 5.3 `next_step_assessment`

Type:

- `object`

Current fields:

- `level`
- `reason`
- `stop_word`

Current `level` values used by the bridge:

- `actionable`
- `low_roi`
- `stopped`
- `unknown`

Purpose:

- let the host distinguish between normal next steps, low-ROI follow-up situations, and an explicit local stop

---

## 6. Error Contract

The bridge currently treats these as contract errors:

- missing `--request`
- providing both `--thread <path>` and `--thread-stdin`
- running a current-session scan without any thread source
- using `--thread-stdin` with empty stdin input
- forwarding a malformed management request that the backend cannot parse

Current behavior:

- successful responses print JSON to stdout and exit `0`
- validation or backend errors print to stderr and exit non-zero

Hosts should treat non-zero exit codes as a failed invocation rather than as a partial success.

---

## 7. Host Responsibilities

The host or skill is responsible for:

- deciding when the user intent matches this current-session habit flow
- gathering visible conversation text
- passing one stable transcript input into the bridge
- rendering `assistant_reply_markdown` or equivalent UI text
- optionally surfacing `suggested_follow_ups`

The host is not responsible for:

- re-implementing candidate scoring
- re-deriving chat summaries from raw candidate JSON
- directly mutating the user registry file

That split keeps the host lightweight and keeps interpretation logic centralized in the backend.

---

## 8. Boundary Rules That Must Stay True

This contract assumes the following project rules stay intact:

- the backend remains an interpretation layer, not a workflow executor
- session scanning remains suggestion-first
- durable writes still require explicit user confirmation
- current-session integration should rely on visible conversation text, not hidden private storage assumptions
- low-ROI next steps should be surfaced explicitly, with a cheap one-word stop path

If future changes violate those rules, this contract should be revised in the same change set.

---

## 9. Stability Notes

Within the current `0.x` line, avoid unnecessary churn to:

- `codex-session-habits` flag names that already exist
- transcript role handling documented here
- the meaning of `assistant_reply_markdown`, `suggested_follow_ups`, and `next_step_assessment`
- the one-word local stop path behavior

Allowed refinement:

- clearer wording
- more regression coverage
- tighter validation
- better examples

If the bridge contract changes materially, update all of these together:

- [api-reference.md](/E:/user-habit-pipeline/docs/api-reference.md)
- [codex-skill-integration.md](/E:/user-habit-pipeline/docs/codex-skill-integration.md)
- [manual-e2e-acceptance.md](/E:/user-habit-pipeline/docs/manual-e2e-acceptance.md)
- [release-checklist.md](/E:/user-habit-pipeline/docs/release-checklist.md)
