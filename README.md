# User Habit Pipeline

`user-habit-pipeline` is a local-first shorthand interpreter for AI assistants and local apps that need to turn repeated user phrases into structured, reviewable intent.

Use it when a host keeps seeing phrases like `继续`, `收尾一下`, or `验收` and you want explicit interpretation instead of brittle regex glue or hidden memory.

![Current-session demo](assets/readme-short-demo.gif)

## What It Gives You

- shorthand interpretation with structured JSON output
- user-managed phrase add/remove without editing shipped defaults
- current-session habit suggestion scanning for chat-style hosts
- clarify-first routing support before downstream actions
- local-only runtime state, with no hidden workflow execution

## Fastest Ways To Use It

Install:

```powershell
npm install user-habit-pipeline
```

Pick one entrypoint:

- Node / TypeScript host: call the library directly
- any language: call the CLI and parse JSON
- conversation UI or Codex-style host: use `codex-session-habits`

If you want the fastest outside-project proof first, use:

- demo repo: [user-habit-pipeline-codex-demo](https://github.com/pingzi-crypto/user-habit-pipeline-codex-demo)
- Codex skill: [manage-current-session-habits](https://github.com/pingzi-crypto/manage-current-session-habits)

## Quick Examples

Interpret one shorthand message:

```powershell
npx user-habit-pipeline --message "继续" --scenario general
```

Add one user-defined phrase:

```powershell
npx manage-user-habits --request "添加用户习惯短句: phrase=收尾一下; intent=close_session; 场景=session_close; 置信度=0.86"
```

Scan the current conversation for candidate habit phrases:

```powershell
@'
user: 以后我说“收尾一下”就是 close_session
assistant: 收到。
user: 收尾一下
'@ | npx codex-session-habits --request "扫描这次会话里的习惯候选" --thread-stdin
```

Pre-action gate before the host executes anything:

```powershell
npx user-habit-pipeline --message "继续" --scenario general --pre-action
```

Optional localhost HTTP entrypoint:

```powershell
npx user-habit-pipeline-http --port 4848
```

## Choose Your Integration Path

Use the library if:

- your host is already Node.js
- you want direct function calls

Use the CLI if:

- your host is Python, Go, Rust, shell, or another non-Node stack
- you want the simplest stable boundary

Use `codex-session-habits` if:

- your host is a conversation UI
- the user should trigger scans and applies with natural prompts inside the current thread

Use the local HTTP entrypoint if:

- another local tool strongly prefers an API-shaped boundary
- you still want the package to stay local-first

## Example Output

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

## Product Boundary

This package:

- interprets shorthand
- returns inspectable structured hints
- helps the host decide whether clarification is needed

This package does not:

- execute workflow actions
- auto-learn into active habits during scan-only flows
- silently write durable user rules without explicit confirmation

Runtime user state is stored outside the package directory by default:

- Windows: `%APPDATA%\user-habit-pipeline\user_habits.json`
- non-Windows: `~/.config/user-habit-pipeline/user_habits.json`

Verified environments:

- Windows with Node.js 18+
- macOS with Node.js 18+
- Linux with Node.js 18+

## Start Here

If you only open one doc, open:

- [Start Here](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/README.md)

Then choose the next doc by task:

- install and first integration: [Integration Quickstart](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/integration-quickstart.md)
- choose host path and runtime strategy: [Cross-Host Integration Guide](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/cross-host-integration-guide.md)
- current-session scan / apply flow: [Session Habit Suggestions](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/session-habit-suggestions.md)
- Codex-facing thread contract: [Codex Current-Session Contract](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/codex-current-session-contract.md)
- phrase management: [User Habit Management](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/user-habit-management.md)
- API details: [API Reference](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/api-reference.md)

## License

Apache License 2.0. See [LICENSE](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/LICENSE).
