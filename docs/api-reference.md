# API Reference

This document describes the public surface currently exposed by the package.

The package entrypoint is:

- [src/index.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/src/index.js)

---

## Library Exports

### `interpretHabit(input, options?)`

Interpret a user shorthand message into a structured, reviewable intent hint.

Input:

- `input.message: string`
- `input.recent_context?: string[]`
- `input.scenario?: string | null`

Options:

- `options.rules?: HabitRule[]`
- `options.registryPath?: string`
- `options.userRegistryPath?: string`
- `options.includeUserRegistry?: boolean`

Output fields:

- `normalized_intent`
- `habit_matches`
- `disambiguation_hints`
- `confidence`
- `should_ask_clarifying_question`
- `preferred_terms`
- `notes`

Notes:

- if `options.rules` is provided, the interpreter validates and uses that rule set directly
- if `options.registryPath` is provided, the interpreter loads and validates that file
- if neither is provided, the interpreter loads the default registry plus the user-habits overlay
- `options.includeUserRegistry = false` forces default-registry-only behavior

### `loadDefaultHabits()`

Load and cache the default registry from:

- [default_habits.json](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/src/habit_registry/default_habits.json)

### `loadHabitsFromFile(registryPath)`

Load and validate a registry file from disk.
Throws if the registry is invalid.

### `validateHabitRules(rules)`

Validate an in-memory registry array.
Returns the same array if valid.
Throws if any rule violates the runtime contract.

### `loadUserRegistryState(registryPath?)`

Load the persisted user-habits overlay state.
Returns an object with:

- `additions`
- `removals`
- `ignored_suggestions`

Default behavior:

- prefers a user data directory such as `%APPDATA%\user-habit-pipeline\user_habits.json` on Windows
- prefers `~/.config/user-habit-pipeline/user_habits.json` on non-Windows systems
- can be overridden by setting `USER_HABIT_PIPELINE_HOME` to a custom runtime directory
- falls back to the legacy repo-local `data/user_habits.json` only when that file already exists and the new user-data path does not yet exist

### `resolveUserDataRoot(options?)`

Resolve the runtime user-data root directory for the current machine or override environment.

### `resolveDefaultUserRegistryPath(options?)`

Resolve the default `user_habits.json` path using the current runtime directory policy and legacy fallback behavior.

### `USER_HOME_OVERRIDE_ENV`

The environment variable name used to override the runtime user-data root:

- `USER_HABIT_PIPELINE_HOME`

### `addUserHabitRule(rule, registryPath?)`

Persist a user-defined habit phrase.
If the phrase already exists in the user overlay, it is replaced.
If the same phrase was previously removed, the removal tombstone is cleared.

### `removeUserHabitPhrase(phrase, registryPath?)`

Remove a phrase from the effective registry.
This removes any matching user-defined addition and records a removal marker so default phrases can also be hidden.

### `suppressSuggestionPhrase(phrase, registryPath?)`

Persist a phrase in the user registry's suggestion-ignore list.
Ignored phrases are skipped by future session suggestion scans, but they do not become active habit rules.

### `exportUserRegistryState(exportPath, registryPath?)`

Export the current user overlay to a JSON file.

### `importUserRegistryState(importPath, registryPath?, mode?)`

Import a user overlay from disk.

Supported modes:

- `replace`
- `merge`

### `parseHabitManagementRequest(message)`

Parse a lightweight habit-management prompt.

Supported examples:

- `添加用户习惯短句: phrase=收尾一下; intent=close_session; 场景=session_close; 置信度=0.86`
- `删除用户习惯短句: 收尾一下`
- `以后别再建议这个短句: 收工啦`
- `列出用户习惯短句`
- `扫描这次会话里的习惯候选`

### `parseSessionTranscript(transcriptText)`

Parse a role-prefixed session transcript into message objects.

Expected transcript style:

- `user: ...`
- `assistant: ...`
- `system: ...`
- `tool: ...`

Chinese role prefixes such as `用户:` and `助手:` are also accepted.

### `suggestSessionHabitCandidates(transcriptText, options?)`

Suggest candidate habit phrases from a current-thread transcript without changing the user overlay.

Options:

- `options.userRegistryPath?: string`
- `options.maxCandidates?: number`

Output fields:

- `transcript_stats`
- `candidates`

Candidate records may include:

- `candidate_id`
- `phrase`
- `source_type`
- `action`
- `confidence`
- `confidence_details`
- `suggested_rule`
- `evidence`
- `risk_flags`

`confidence_details` is a structured explanation object for session suggestion scoring.
It includes:

- `domain`
- `source_type`
- `base_score`
- `adjustments`
- `final_score`
- `summary`

### `parseCandidateReference(value)`

Normalize candidate references such as:

- `c1`
- `1`
- `第1条`

### `findSuggestedCandidate(snapshot, reference)`

Find one candidate from a suggestion snapshot by candidate id or ordinal reference.

### `toGrowthHubHint(habitOutput)`

Project a standard interpretation result into a thin `growth-hub` hint shape.

Output fields:

- `hint_intent`
- `hint_confidence`
- `hint_requires_confirmation`
- `hint_terms`
- `hint_notes`

This adapter does not trigger workflow actions.

---

## CLI

The main CLI entrypoint is:

- [cli.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/src/cli.js)

Command:

```powershell
npm run interpret -- --message "更新入板" --scenario status_board
```

Help:

```powershell
npm run interpret -- --help
```

Supported flags:

- `--message <text>` required
- `--scenario <name>` optional
- `--context <text>` repeatable
- `--adapter growth-hub` optional
- `--registry <path>` optional
- `--user-registry <path>` optional

The CLI prints JSON only.

---

## Validation CLI

The registry validation CLI entrypoint is:

- [validate-registry-cli.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/src/validate-registry-cli.js)

Command:

```powershell
npm run validate-registry -- .\src\habit_registry\default_habits.json
```

Help:

```powershell
npm run validate-registry -- --help
```

Behavior:

- prints structured JSON on success
- prints a validation error to stderr and exits non-zero on failure

---

## Init-Registry CLI

The registry starter CLI entrypoint is:

- [init-registry-cli.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/src/init-registry-cli.js)

Command:

```powershell
npx user-habit-pipeline-init-registry --out .\my-project-registry
```

Help:

```powershell
npx user-habit-pipeline-init-registry --help
```

Supported flags:

- `--out <directory>` required
- `--force` optional

Behavior:

- generates a minimal project-registry starter directory
- writes `custom-habits.json`, `README.md`, and `smoke-test.js`
- refuses to overwrite generated files unless `--force` is provided

Use this when another project wants an explicit registry starting point without manually copying the example directory.

---

## Manage-Habits CLI

The user-habit management CLI entrypoint is:

- [manage-habits-cli.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/src/manage-habits-cli.js)

Command:

```powershell
npm run manage-habits -- --request "添加用户习惯短句: phrase=收尾一下; intent=close_session; 场景=session_close; 置信度=0.86"
```

Structured examples:

```powershell
npm run manage-habits -- --add --phrase "收尾一下" --intent close_session --scenario session_close --confidence 0.86
npm run manage-habits -- --remove --phrase "收尾一下"
npm run manage-habits -- --list
npm run manage-habits -- --suggest --transcript .\data\thread.txt
npm run manage-habits -- --apply-candidate c1
npm run manage-habits -- --apply-candidate c1 --intent close_session --scenario session_close
npm run manage-habits -- --ignore-candidate c1
npm run manage-habits -- --ignore-phrase "收工啦"
npm run manage-habits -- --export .\backup\user_habits.json
npm run manage-habits -- --import .\backup\user_habits.json --mode merge
```

Help:

```powershell
npm run manage-habits -- --help
```

Behavior:

- persists user-defined additions in a separate user registry file
- supports removal markers so default phrases can be hidden
- supports read-only session suggestion scans from transcript text
- caches the latest suggestion snapshot locally for follow-up apply actions
- supports explicit apply-from-suggestion actions after user review
- supports explicit ignore-from-suggestion actions after user review
- supports apply-time overrides for `intent`, `scenario`, and `confidence`
- supports export/import of the user overlay JSON file
- supports `replace` and `merge` import modes
- allows prompt-based add/remove/list/suggest requests without editing JSON manually

---

## Codex Session Bridge CLI

The Codex-oriented bridge CLI entrypoint is:

- [codex-session-habits-cli.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/src/codex-session-habits-cli.js)

The current host/skill contract for this bridge is documented in:

- [codex-current-session-contract.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/codex-current-session-contract.md)

Command:

```powershell
@'
user: 以后我说“收尾一下”就是 close_session
assistant: 收到。
user: 收尾一下
'@ | npm run codex-session-habits -- --request "扫描这次会话里的习惯候选" --thread-stdin
```

Follow-up apply example:

```powershell
npm run codex-session-habits -- --request "添加第1条"
```

Behavior:

- forwards prompt-style requests into the manage-habits backend
- maps Codex-oriented transcript flags `--thread <path>` and `--thread-stdin` onto the existing transcript contract
- keeps the follow-up confirm flow short by relying on the latest local suggestion cache
- is intended for skills or host integrations that can access the current conversation context directly
- enriches successful results with `assistant_reply_markdown` and `suggested_follow_ups` for chat-oriented presentation
- enriches successful results with `next_step_assessment` so low-ROI follow-up situations can be surfaced explicitly
- accepts one-word local stop requests such as `停` or `跳过` without forwarding them into the habit-management parser
- requires exactly one thread source for current-session scans and treats missing or conflicting thread input as a contract error

---

## Local HTTP Server CLI

The local HTTP server entrypoint is:

- [http-server-cli.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/src/http-server-cli.js)

Command:

```powershell
npx user-habit-pipeline-http --port 4848
```

Help:

```powershell
npx user-habit-pipeline-http --help
```

Supported flags:

- `--host <hostname>` optional
- `--port <number>` optional
- `--user-registry <path>` optional
- `--max-body-bytes <n>` optional

Environment fallbacks:

- `UHP_HTTP_HOST`
- `UHP_HTTP_PORT`
- `UHP_HTTP_MAX_BODY_BYTES`

Default address:

- `http://127.0.0.1:4848`

This server is intended for localhost integration from other local tools.
It is not a remote SaaS API and it does not change the project into a workflow engine.

### `GET /health`

Returns a small JSON status payload for health checks and runtime discovery.

Example:

```powershell
Invoke-RestMethod -Method Get -Uri http://127.0.0.1:4848/health
```

Typical fields:

- `ok`
- `service`
- `host`
- `port`
- `user_registry_path`
- `default_user_registry_path`
- `endpoints`

### `POST /interpret`

Interpret one shorthand message through the same core engine used by the CLI and library.

Request body:

- `message: string` required
- `scenario?: string | null`
- `recent_context?: string[] | string`
- `include_user_registry?: boolean`
- `user_registry_path?: string`

PowerShell example:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:4848/interpret `
  -ContentType "application/json" `
  -Body '{"message":"继续","scenario":"general"}'
```

Response shape:

- `ok`
- `result.normalized_intent`
- `result.habit_matches`
- `result.disambiguation_hints`
- `result.confidence`
- `result.should_ask_clarifying_question`

### `POST /suggest`

Scan a transcript for candidate habit phrases without directly changing active habit state.

Request body:

- `transcript: string` required
- `max_candidates?: number`
- `user_registry_path?: string`

Example:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:4848/suggest `
  -ContentType "application/json" `
  -Body (@{
    transcript = "user: 以后我说“收尾一下”就是 close_session`nassistant: 收到。`nuser: 收尾一下"
    max_candidates = 3
  } | ConvertTo-Json -Compress)
```

Response shape:

- `ok`
- `action`
- `registry_path`
- `suggestions_cache_path`
- `candidate_count`
- `transcript_stats`
- `candidates`

### `POST /manage`

Forward one prompt-style habit-management request through the same management backend used by `manage-user-habits`.

Request body:

- `request: string` required
- `transcript?: string`
- `suggestions?: object | array`
- `scenario?: string[] | string`
- `intent?: string`
- `confidence?: number`
- `mode?: string`
- `file_path?: string`
- `max_candidates?: number`
- `user_registry_path?: string`

Example:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:4848/manage `
  -ContentType "application/json" `
  -Body '{"request":"添加用户习惯短句: phrase=收尾一下; intent=close_session; 场景=session_close; 置信度=0.86"}'
```

Typical response:

- `ok`
- `result.action`
- `result.registry_path`
- action-specific payload such as:
  - `result.added_rule`
  - `result.additions`
  - `result.removals`
  - `result.ignored_suggestions`
  - `result.candidates`

### Error Boundary

The HTTP server returns JSON errors instead of HTML.

Typical `400` cases:

- invalid JSON request body
- missing `message` on `/interpret`
- missing `transcript` on `/suggest`
- missing `request` on `/manage`
- invalid startup flags such as an out-of-range `--port`

---

## Stability Notes

The current intent names and output fields are intended to be stable for the MVP.
The internal scoring details may still change as long as they remain consistent with:

- [confidence-scoring.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/confidence-scoring.md)
- [mvp-spec.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/mvp-spec.md)
- [examples.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/examples.md)
