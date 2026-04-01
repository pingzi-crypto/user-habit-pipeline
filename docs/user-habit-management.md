# User Habit Management Guide

This guide is for end users who want to manage their own shorthand phrases without editing JSON files manually.

The system supports three basic actions:

- add a phrase
- remove a phrase
- list current user-defined changes

It also supports:

- export your current overlay
- import an overlay from another file

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

---

## Prompt-Style Requests

If you prefer a lighter, more natural format, use `--request`.

### Add

```powershell
npm run manage-habits -- --request "添加用户习惯短句: phrase=收尾一下; intent=close_session; 场景=session_close; 置信度=0.86"
```

### Remove

```powershell
npm run manage-habits -- --request "删除用户习惯短句: 收尾一下"
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

By default, the user overlay is stored at:

- `data/user_habits.json`

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

If needed, switch from `--request` to the explicit `--add` flags.

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
