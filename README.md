# User Habit Pipeline

A reusable user-habit interpretation layer that turns repeated shorthand expressions into structured, reviewable intent hints for downstream workflows.

---

## 1. Purpose

This project exists to reduce repeated interpretation cost for stable, high-frequency user expressions.

It is designed for cases where a user repeatedly uses short prompts such as:

- `继续`
- `下一条`
- `入板`
- `更新入板`
- `验收`
- `session-close`
- `收口`

Without a habit layer, downstream systems repeatedly spend effort re-inferring the same meaning.
This project aims to make that interpretation cheaper, more stable, and easier to review.

---

## 2. Product Position

This project is an **interpretation layer**.

It does:

- interpret repeated shorthand expressions
- normalize likely user intent
- return structured hints
- help downstream workflows reduce ambiguity

It does **not**:

- decide workflow actions
- write files
- update boards
- approve tasks
- switch roles
- replace explicit workflow rules

Core rule:

- this project explains
- downstream workflows decide

---

## 3. MVP Goal

The MVP should prove one thing:

> A small, explicit, inspectable habit layer can reduce misunderstanding of repeated user shorthand without taking over workflow decisions.

The MVP does **not** need to support broad coverage.
The MVP does **not** need to learn automatically.
The MVP does **not** need to be smart in a general sense.

It only needs to be useful, stable, and easy to inspect.

---

## 4. Hard Scope Boundary

The MVP must remain inside this boundary:

### In scope

- interpret current user message
- use limited recent context when needed
- map repeated phrases to normalized intent hints
- return explicit, inspectable structured output
- recommend clarification when confidence is low

### Out of scope

Anything that directly changes workflow state, files, approvals, or role behavior is out of scope for MVP.

Specifically, MVP must not:

- write status boards
- update files
- trigger execution
- choose reviewer vs executor behavior
- replace handoff or other explicit source-of-truth documents
- infer personality, emotion, hidden motives, or psychological traits
- require full-thread replay to work
- become a hidden rule engine

---

## 5. Input Contract

### Required input

- `message: string`

### Optional input

- `recent_context: string[]`
- `scenario: string | null`

### Input guidance

- `message` is the main interpretation target
- `recent_context` should stay short
- `scenario` is only a bias hint, not a hard rule

Suggested `scenario` examples:

- `reviewer`
- `executor`
- `status_board`
- `session_close`
- `general`

---

## 6. Output Contract

The MVP must return a structured object with stable fields.

### Required fields

- `normalized_intent`
- `habit_matches`
- `disambiguation_hints`
- `confidence`
- `should_ask_clarifying_question`

### Optional fields

- `preferred_terms`
- `notes`

### Field contract

#### `normalized_intent`
- type: `string`
- required
- may be `unknown`
- should stay generic enough to reuse across projects

Examples:
- `continue_current_track`
- `move_to_next_item`
- `add_or_update_board_item`
- `review_acceptance`
- `refresh_latest_board_state`
- `close_session`
- `draft_text_artifact`
- `unknown`

#### `habit_matches`
- type: `array`
- required
- each item should describe one matched phrase or rule

Each match item should contain:
- `phrase: string`
- `meaning: string`
- `confidence: number`

#### `disambiguation_hints`
- type: `array[string]`
- required
- empty array allowed

#### `confidence`
- type: `number`
- required
- range: `0.0` to `1.0`

#### `should_ask_clarifying_question`
- type: `boolean`
- required

#### `preferred_terms`
- type: `array[string]`
- optional

#### `notes`
- type: `array[string]`
- optional

### Output example

```json
{
  "normalized_intent": "add_or_update_board_item",
  "habit_matches": [
    {
      "phrase": "帮我入板",
      "meaning": "add_or_update_board_item",
      "confidence": 0.94
    }
  ],
  "disambiguation_hints": [
    "Prefer board action over general planning."
  ],
  "confidence": 0.94,
  "should_ask_clarifying_question": false,
  "preferred_terms": [
    "status_board"
  ],
  "notes": [
    "High-confidence shorthand mapping."
  ]
}
```

---

## 7. Usage

### Library

```js
const { interpretHabit, toGrowthHubHint } = require("./src");

const interpreted = interpretHabit({
  message: "继续",
  scenario: "general",
  recent_context: ["继续当前评审", "review the next issue after this"]
});

const growthHubHint = toGrowthHubHint(interpreted);
```

Use a different registry without changing the interpreter:

```js
const { interpretHabit, loadHabitsFromFile } = require("./src");

const altRules = loadHabitsFromFile("./tests/fixtures/alt_habits.json");

const interpreted = interpretHabit(
  { message: "归档一下", scenario: "session_close" },
  { rules: altRules }
);
```

### CLI

Run the interpreter directly:

```powershell
npm run interpret -- --message "更新入板" --scenario status_board
```

Show CLI help:

```powershell
npm run interpret -- --help
```

Provide recent context by repeating `--context`:

```powershell
npm run interpret -- --message "继续" --scenario general --context "继续当前评审" --context "review the next issue after this"
```

Use a custom registry file:

```powershell
npm run interpret -- --message "归档一下" --scenario session_close --registry .\tests\fixtures\alt_habits.json
```

Use a custom user-habits overlay file:

```powershell
npm run interpret -- --message "收尾一下" --scenario session_close --user-registry .\data\user_habits.json
```

Validate a registry file before using it:

```powershell
npm run validate-registry -- .\tests\fixtures\alt_habits.json
```

Show validator help:

```powershell
npm run validate-registry -- --help
```

The registry format is also described by a JSON Schema artifact:

- [registry.schema.json](/E:/user-habit-pipeline/docs/registry.schema.json)
- [editor-integration.md](/E:/user-habit-pipeline/docs/editor-integration.md)
- [api-reference.md](/E:/user-habit-pipeline/docs/api-reference.md)
- [versioning.md](/E:/user-habit-pipeline/docs/versioning.md)
- [release-checklist.md](/E:/user-habit-pipeline/docs/release-checklist.md)
- [release-notes-v0.3.0.md](/E:/user-habit-pipeline/docs/release-notes-v0.3.0.md)
- [freeze-assessment-0.1.0.md](/E:/user-habit-pipeline/docs/freeze-assessment-0.1.0.md)
- [user-habit-management.md](/E:/user-habit-pipeline/docs/user-habit-management.md)

Regenerate the examples document after changing the example fixtures:

```powershell
npm run generate-examples-doc
```

Run a quick end-to-end demo of the current package scope:

```powershell
npm run demo
```

Project the output through the `growth-hub` adapter:

```powershell
npm run interpret -- --message "验收" --scenario reviewer --adapter growth-hub
```

### User-Managed Habit Phrases

Add a user habit with structured flags:

```powershell
npm run manage-habits -- --add --phrase "收尾一下" --intent close_session --scenario session_close --confidence 0.86
```

Remove a phrase from the effective registry:

```powershell
npm run manage-habits -- --remove --phrase "验收"
```

List the current user-defined additions and removals:

```powershell
npm run manage-habits -- --list
```

Export your current user overlay:

```powershell
npm run manage-habits -- --export .\backup\user_habits.json
```

Import a saved overlay:

```powershell
npm run manage-habits -- --import .\backup\user_habits.json
npm run manage-habits -- --import .\backup\user_habits.json --mode merge
```

Use a lightweight prompt-like request instead of flags:

```powershell
npm run manage-habits -- --request "添加用户习惯短句: phrase=收尾一下; intent=close_session; 场景=session_close; 置信度=0.86"
npm run manage-habits -- --request "删除用户习惯短句: 收尾一下"
npm run manage-habits -- --request "列出用户习惯短句"
npm run manage-habits -- --request "导出用户习惯短句: path=.\backup\user_habits.json"
npm run manage-habits -- --request "导入习惯短句 路径=.\backup\user_habits.json; 模式=merge"
```

For multiline prompt requests in PowerShell, prefer piping a here-string into `--request-stdin`:

```powershell
@'
新增习惯短句 phrase=收尾一下
intent=close_session
场景=session_close
置信度=0.86
'@ | npm run manage-habits -- --request-stdin
```

This writes user-managed phrases into a separate overlay file and leaves the default registry untouched.

### CLI contract

- `--message` is required
- `--scenario` is optional
- repeat `--context` to supply short recent-context items
- `--adapter growth-hub` projects the interpretation into downstream hint fields
- `--registry <path>` loads a different habit registry file for this invocation
- `--user-registry <path>` loads a user-habits overlay file for this invocation

The CLI prints JSON only.
