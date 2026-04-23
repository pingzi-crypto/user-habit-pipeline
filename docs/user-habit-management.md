# User Habit Management Guide

This guide is for end users who want to manage their own shorthand phrases without editing JSON files manually.

If you want one repeatable end-to-end walkthrough instead of command-by-command reference, see [happy-path-demo.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/happy-path-demo.md).

The system supports three basic actions:

- add a phrase
- remove a phrase
- list current user-defined changes

It also supports:

- export your current overlay
- import an overlay from another file
- scan a current session transcript for habit candidates

User-managed phrases are stored in a separate overlay file.
The default registry stays unchanged.

---

## What Happens When You Add or Remove a Phrase

The effective registry is built from:

1. the default habit registry
2. your user-habits overlay

If you add a phrase:

- it becomes available immediately through the interpreter
- it can override a default phrase with the same wording

If you remove a phrase:

- a user-defined phrase with that wording is removed
- a default phrase with that wording is hidden from the effective registry

This means removal works as a user-level hide operation, not as an edit to the shipped defaults.

---

## Recommended Commands

### Add a phrase

```powershell
npm run manage-habits -- --add --phrase "收尾一下" --intent close_session --scenario session_close --confidence 0.86
```

### Remove a phrase

```powershell
npm run manage-habits -- --remove --phrase "验收"
```

### Suppress a phrase from future suggestion scans

```powershell
npm run manage-habits -- --ignore-phrase "收工啦"
```

### List your current overlay

```powershell
npm run manage-habits -- --list
```

### Export your current overlay

```powershell
npm run manage-habits -- --export .\backup\user_habits.json
```

### Import an overlay file

```powershell
npm run manage-habits -- --import .\backup\user_habits.json
```

### Import with merge mode

```powershell
npm run manage-habits -- --import .\backup\user_habits.json --mode merge
```

### See help

```powershell
npm run manage-habits -- --help
```

### Scan a session transcript for habit candidates

```powershell
npm run manage-habits -- --suggest --transcript .\data\thread.txt
```

### Apply one suggestion after review

```powershell
npm run manage-habits -- --apply-candidate c1
npm run manage-habits -- --apply-candidate c1 --scenario session_close
```

### Ignore one suggestion after review

```powershell
npm run manage-habits -- --ignore-candidate c1
```

---

## Prompt-Style Requests

If you prefer a lighter, more natural format, use `--request`.

### Add

```powershell
npm run manage-habits -- --request "添加用户习惯短句: phrase=收尾一下; intent=close_session; 场景=session_close; 置信度=0.86"
```

For multiline prompt input in PowerShell, use `--request-stdin` instead of `--request`:

```powershell
@'
新增习惯短句 phrase=收尾一下
intent=close_session
场景=session_close
置信度=0.86
'@ | npm run manage-habits -- --request-stdin
```

### Remove

```powershell
npm run manage-habits -- --request "删除用户习惯短句: 收尾一下"
```

### Suppress suggestion

```powershell
npm run manage-habits -- --request "以后别再建议这个短句: 收工啦"
```

### List

```powershell
npm run manage-habits -- --request "列出用户习惯短句"
```

### Export

```powershell
npm run manage-habits -- --request "导出用户习惯短句: path=.\backup\user_habits.json"
```

### Import

```powershell
npm run manage-habits -- --request "导入用户习惯短句: path=.\backup\user_habits.json"
npm run manage-habits -- --request "导入习惯短句 路径=.\backup\user_habits.json; 模式=merge"
```

### Suggest candidates from the current session transcript

```powershell
npm run manage-habits -- --request "扫描这次会话里的习惯候选" --transcript .\data\thread.txt
```

For PowerShell transcript input, use `--transcript-stdin`:

```powershell
@'
user: 以后我说“收尾一下”就是 close_session
assistant: 收到。
user: 收尾一下
'@ | npm run manage-habits -- --request "扫描这次会话里的习惯候选" --transcript-stdin
```

### Apply one reviewed suggestion

```powershell
npm run manage-habits -- --request "添加第1条"
npm run manage-habits -- --request "把第1条加到 session_close 场景"
```

### Ignore one reviewed suggestion

```powershell
npm run manage-habits -- --request "忽略第1条"
```

Supported field names in add requests include:

- `phrase` or `短句`
- `intent` or `意图`
- `scenario` or `场景`
- `confidence` or `置信度`
- `preferred_terms` / `preferred` / `术语`
- `notes` / `备注`
- `disambiguation_hints` / `澄清提示`
- `clarify_below` / `澄清阈值`
- `match_type` / `匹配方式`

Supported field names in import/export requests include:

- `path` / `file` / `路径` / `文件`
- `mode` / `模式`

Suggestion scans currently use transcript input from:

- `--transcript <path>`
- `--transcript-stdin`

They do not write anything automatically.
They only return candidate phrases and evidence for review.
The latest suggestion result is also cached locally so the next apply step can omit a suggestion file path.

To turn a suggestion into an active user habit:

- use `--apply-candidate <id>` after a recent suggestion scan
- or use a prompt request like `添加第1条`
- use `--intent` and optional `--scenario` / `--confidence` overrides if the candidate is review-only or needs adjustment

To keep a noisy suggestion from reappearing without adding it:

- use `--ignore-candidate <id>` after a recent suggestion scan
- or use a prompt request like `忽略第1条`

Review-only candidates without a `suggested_rule` can still be applied if you provide an explicit `intent`.

---

## Interpreting With Your Overlay

After you add a phrase, you can test it immediately:

```powershell
npm run interpret -- --message "收尾一下" --scenario session_close
```

If you want to point at a different overlay file:

```powershell
npm run interpret -- --message "收尾一下" --scenario session_close --user-registry .\data\user_habits.json
```

---

## Where Your Data Lives

By default, the user overlay is stored in a user data directory:

- Windows: `%APPDATA%\user-habit-pipeline\user_habits.json`
- non-Windows: `~/.config/user-habit-pipeline/user_habits.json`
- set `USER_HABIT_PIPELINE_HOME` if you want the runtime to use a different root directory without changing every CLI call

Compatibility note:

- if an older repo-local `data/user_habits.json` already exists and the new user-data path does not exist yet, the runtime keeps using that legacy file so existing local setups do not silently lose their current habits

This file is intentionally ignored by git.
It is treated as local user state, not as repository source.

If you want to experiment without touching the default location, pass:

- `--user-registry <path>`

to either:

- `npm run manage-habits`
- `npm run interpret`

You can export that file to another location for backup or sharing, then import it later.

## Import Modes

### `replace`

Replace the current user overlay with the imported file.

### `merge`

Merge imported additions and removals into the current user overlay.

Merge is useful when you want to bring in another overlay without losing your current local phrases.

---

## Recommended Intent Choices

Prefer intents that already exist in the project unless you have a good reason to introduce a new one.

Examples already used by the project:

- `continue_current_track`
- `move_to_next_item`
- `add_or_update_board_item`
- `review_acceptance`
- `refresh_latest_board_state`
- `close_session`
- `draft_text_artifact`

If you add brand-new intents, make sure downstream consumers know what to do with them.

---

## Common Problems

### The phrase does not match

Check:

- the phrase text exactly matches what you added
- the phrase was not later removed
- you are reading the same `--user-registry` file you wrote to

### A default phrase still appears after I thought I removed it

List the current user overlay:

```powershell
npm run manage-habits -- --list
```

Make sure the phrase appears in `removals`.

### The add request fails

Most failures come from:

- missing `phrase`
- missing `intent`
- invalid `confidence`
- malformed prompt segments
- trying to pass a multiline `--request` value through `npm run` on Windows

If needed, switch from `--request` to the explicit `--add` flags.
For multiline prompt input on Windows PowerShell, prefer `--request-stdin`.

### Import fails

Check:

- the imported file is a valid user overlay object
- it contains `additions` and `removals` with the expected shapes
- you chose the intended import mode

---

## Safe Usage Pattern

For normal day-to-day use:

1. add or remove a phrase with `npm run manage-habits`
2. verify it with `npm run interpret`
3. keep the default registry untouched unless you are changing shipped behavior

This keeps personal shorthand management lightweight and reversible.
