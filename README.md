# User Habit Pipeline

`user-habit-pipeline` is a Node.js CLI and library for turning repeated user shorthand into structured, reviewable intent hints.

It is for products, scripts, local tools, and assistants that keep seeing phrases like `继续`, `收尾一下`, or `验收`, and need a stable shorthand interpretation layer without turning that layer into a hidden workflow engine.

It works well for:

- user shorthand interpretation
- intent parsing in local automation tools
- Codex or chat-style current-session habit scanning
- prompt and workflow hinting without hidden execution

If you are searching for a local-first intent parser, shorthand CLI, Codex habit scanner, or a lightweight way to interpret chat workflow phrases, this is the project.

## Who It Is For

Use this package if you are building:

- a Node.js product that needs stable shorthand interpretation
- a local tool that wants JSON output instead of brittle regex glue
- a chat or assistant host that wants current-session habit suggestions
- a workflow layer that needs hints, not auto-executed actions

## Common Use Cases

Interpret one ambiguous shorthand message into structured intent data:

```powershell
npx user-habit-pipeline --message "继续" --scenario general
```

Add one user-defined phrase without editing shipped defaults:

```powershell
npx manage-user-habits --request "添加用户习惯短句: phrase=收尾一下; intent=close_session; 场景=session_close; 置信度=0.86"
```

Scan a current conversation for candidate habit phrases:

```powershell
@'
user: 以后我说“收尾一下”就是 close_session
assistant: 收到。
user: 收尾一下
'@ | npx codex-session-habits --request "扫描这次会话里的习惯候选" --thread-stdin
```

## Quick Start

Install from npm:

```powershell
npm install user-habit-pipeline
```

Interpret a shorthand phrase:

```powershell
npx user-habit-pipeline --message "收尾一下" --scenario session_close
```

## What You Get

- a CLI and library for shorthand interpretation
- a separate user overlay for add/remove habit phrases without editing shipped defaults
- current-session habit suggestion scanning for Codex-style chat flows
- stable structured output for downstream systems

Example output:

```json
{
  "normalized_intent": "close_session",
  "habit_matches": [
    {
      "phrase": "收尾一下",
      "meaning": "close_session",
      "confidence": 0.86
    }
  ],
  "disambiguation_hints": [],
  "confidence": 0.86,
  "should_ask_clarifying_question": false
}
```

## Integration Paths

Node.js library use:

```js
const { interpretHabit } = require("user-habit-pipeline");

const result = interpretHabit({
  message: "继续",
  scenario: "general",
  recent_context: ["继续当前评审"]
});
```

CLI use:

```powershell
npx user-habit-pipeline --message "更新入板" --scenario status_board
```

User phrase management:

```powershell
npx manage-user-habits --list
npx manage-user-habits --request "删除用户习惯短句: 收尾一下"
```

Current-session scan for chat or assistant hosts:

```powershell
@'
user: 以后我说“收尾一下”就是 close_session
assistant: 收到。
user: 收尾一下
'@ | npx codex-session-habits --request "扫描这次会话里的习惯候选" --thread-stdin
```

Official local HTTP entrypoint for localhost integration:

```powershell
npx user-habit-pipeline-http --port 4848
```

Generate a custom project-registry starter:

```powershell
npx user-habit-pipeline-init-registry --out .\my-project-registry
```

## Runtime State

Runtime user state is stored outside the package directory by default:

- Windows: `%APPDATA%\user-habit-pipeline\user_habits.json`
- non-Windows: `~/.config/user-habit-pipeline/user_habits.json`

This keeps installed package files read-only and makes local npm installs safer to reuse across projects.

## Product Boundary

This package:

- interprets shorthand
- returns inspectable structured hints
- helps the host decide whether clarification is needed

This package does not:

- execute workflow actions
- auto-learn into active habits during scan-only flows
- silently write durable user rules without explicit confirmation

## Docs

Start here if you need more than the quick start:

- [API Reference](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/api-reference.md)
- [Integration Quickstart](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/integration-quickstart.md)
- [Registry Authoring](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/registry-authoring.md)
- [User Habit Management](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/user-habit-management.md)
- [Session Habit Suggestions](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/session-habit-suggestions.md)
- [Codex Current-Session Contract](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/codex-current-session-contract.md)
- [Confidence Scoring](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/confidence-scoring.md)

## License

Apache License 2.0. See [LICENSE](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/LICENSE).
