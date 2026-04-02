# API Reference

This document describes the public surface currently exposed by the package.

The package entrypoint is:

- [src/index.js](/E:/user-habit-pipeline/src/index.js)

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

- [default_habits.json](/E:/user-habit-pipeline/src/habit_registry/default_habits.json)

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
- `suggested_rule`
- `evidence`
- `risk_flags`

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

- [cli.js](/E:/user-habit-pipeline/src/cli.js)

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

- [validate-registry-cli.js](/E:/user-habit-pipeline/src/validate-registry-cli.js)

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

## Manage-Habits CLI

The user-habit management CLI entrypoint is:

- [manage-habits-cli.js](/E:/user-habit-pipeline/src/manage-habits-cli.js)

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

- [codex-session-habits-cli.js](/E:/user-habit-pipeline/src/codex-session-habits-cli.js)

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

---

## Stability Notes

The current intent names and output fields are intended to be stable for the MVP.
The internal scoring details may still change as long as they remain consistent with:

- [mvp-spec.md](/E:/user-habit-pipeline/docs/mvp-spec.md)
- [examples.md](/E:/user-habit-pipeline/docs/examples.md)
