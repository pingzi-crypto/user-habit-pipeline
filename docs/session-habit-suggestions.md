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

The repository backend does not directly read the Codex app's internal thread store.
The host integration should provide transcript text through stdin or a temporary file.

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

Apply a reviewed candidate from a saved snapshot:

```powershell
npm run manage-habits -- --apply-candidate c1 --suggestions .\data\thread_suggestions.json
```

Prompt-style apply:

```powershell
npm run manage-habits -- --request "添加第1条" --suggestions .\data\thread_suggestions.json
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
- `suggested_rule`
- `evidence`
- `risk_flags`

This is designed so a host application can present candidates and let the user confirm them one by one.

Candidates that include a `suggested_rule` can be added directly after user confirmation.
Candidates returned as `review_only` still need an explicit rule definition before they can be stored.

---

## Known Gap

The repository now contains the suggestion backend, but the direct in-app one-sentence trigger still requires a Codex-side skill or host integration to pass the current thread transcript into this backend.
