# Session Habit Suggestions

This document describes the read-only suggestion flow for discovering candidate habit phrases from a current-thread transcript.

The feature is intentionally conservative:

- it scans transcript text
- it suggests candidate phrases
- it does not automatically write to the user overlay

The current overlay remains the source of truth for active user-specific rules.

---

## Why This Exists

Users often repeat short phrases or explicitly correct the meaning of a shorthand during a session.

This suggestion flow helps surface those patterns without turning the interpreter into a hidden auto-learning system.

---

## Current Boundary

The scanner can currently suggest candidates from:

- explicit add-style prompts already present in the transcript
- explicit phrase-to-intent definitions in the transcript
- repeated short user phrases that are not already registered

The scanner does not:

- automatically add new rules
- scan unrelated workspaces by itself
- infer a stable long-term meaning from weak evidence
- replace explicit registry management

---

## Recommended Codex App Flow

The intended UI flow is:

1. the user says something like `扫描这次会话里的习惯候选`
2. a Codex skill or host integration passes the current thread transcript into the backend
3. the backend returns candidate phrases and evidence
4. the user explicitly confirms which candidates should be added

The backend also stores the latest suggestion result in a local hidden cache so the follow-up confirmation step can stay short.

The repository backend does not directly read the Codex app's internal thread store.
The host integration should provide transcript text through stdin or a temporary file.

The repository now also includes a Codex-facing bridge CLI:

- [codex-session-habits-cli.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/src/codex-session-habits-cli.js)

This bridge accepts the same prompt-style requests, but uses `--thread <path>` or `--thread-stdin` so a Codex skill can map directly from the current thread context into the suggestion backend.

---

## CLI Examples

Structured scan from a transcript file:

```powershell
npm run manage-habits -- --suggest --transcript .\data\thread.txt
```

Prompt-style trigger from a transcript file:

```powershell
npm run manage-habits -- --request "扫描这次会话里的习惯候选" --transcript .\data\thread.txt
```

PowerShell here-string input:

```powershell
@'
user: 以后我说“收尾一下”就是 close_session
assistant: 收到。
user: 收尾一下
'@ | npm run manage-habits -- --suggest --transcript-stdin
```

Codex-facing bridge example:

```powershell
@'
user: 以后我说“收尾一下”就是 close_session
assistant: 收到。
user: 收尾一下
'@ | npm run codex-session-habits -- --request "扫描这次会话里的习惯候选" --thread-stdin
```

Apply a reviewed candidate from a saved snapshot:

```powershell
npm run manage-habits -- --apply-candidate c1
```

Prompt-style apply:

```powershell
npm run manage-habits -- --request "添加第1条"
npm run manage-habits -- --request "把第1条加到 session_close 场景"
```

Prompt-style ignore:

```powershell
npm run manage-habits -- --request "忽略第1条"
npm run manage-habits -- --request "以后别再建议这个短句: 收工啦"
```

---

## Transcript Format

The scanner accepts role-prefixed transcript text such as:

- `user: ...`
- `assistant: ...`
- `system: ...`
- `tool: ...`

Chinese role labels are also supported:

- `用户: ...`
- `助手: ...`
- `系统: ...`

If no role prefixes are present, the text is still parsed, but suggestion quality may be lower.

---

## Candidate Types

### `explicit_add_request`

Detected when the transcript already contains a structured add-style request that would be valid for user habit management.

These candidates usually contain a fully formed `suggested_rule`.

### `explicit_definition`

Detected when the transcript contains a phrase-to-intent definition such as:

- `以后我说“收尾一下”就是 close_session`
- `我这里的“收工啦”不是结束线程，是 close_session`

These candidates also usually contain a usable `suggested_rule`.

### `repeated_phrase`

Detected when a short user phrase repeats in the current transcript but is not already registered.

These candidates are returned as review-only observations by default.

---

## Output Shape

The backend returns:

- `transcript_stats`
- `candidates`

Each candidate may include:

- `candidate_id`
- `phrase`
- `source_type`
- `action`
- `confidence`
- `confidence_details`
- `suggested_rule`
- `evidence`
- `risk_flags`

`confidence_details` is a structured explanation of why the candidate received its current session-suggestion score.
It currently includes:

- `domain`
- `source_type`
- `base_score`
- `adjustments`
- `final_score`
- `summary`

This makes it easier for a host UI or Codex skill to explain:

- what base evidence the score started from
- which bonus or cap rules were applied
- why a candidate is still only review-only even when it surfaced prominently

This is designed so a host application can present candidates and let the user confirm them one by one.

Candidates that include a `suggested_rule` can be added directly after user confirmation.
Candidates returned as `review_only` can still be stored if the user supplies an explicit `intent`, and optionally `scenario` or `confidence`, during the apply step.
Candidates can also be suppressed from future suggestion scans if the user explicitly ignores them.

If needed, hosts can still pass an explicit snapshot through `--suggestions <path>` or `--suggestions-stdin`, but the default user-facing flow no longer requires that.

---

## Current Integration Gap

The repository now contains both the suggestion backend and a Codex-facing bridge CLI.

The remaining app-side dependency is still the same one boundary:

- a Codex skill or host integration must turn the visible current conversation into transcript text and pass it into the bridge

The project still does not read Codex private thread storage directly.
