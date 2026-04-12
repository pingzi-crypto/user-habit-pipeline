# Current-Session Host Node Template

This folder is a copyable starting point for chat hosts or Codex-style integrations that already have access to visible conversation text and want to use `codex-session-habits`.

It demonstrates the two-step current-session flow:

- `scan-current-session-demo.js` for piping a role-prefixed transcript into the backend
- `apply-first-candidate-demo.js` for confirming the latest cached suggestion with a short follow-up prompt

Use this when you want a real host-side example for current-session habit scanning instead of only the low-level CLI contract.

## Run From This Repository

From the repository root:

```powershell
node .\examples\current-session-host-node\scan-current-session-demo.js
node .\examples\current-session-host-node\apply-first-candidate-demo.js
```

To keep the cache isolated while testing, set a temporary runtime home first:

```powershell
$env:USER_HABIT_PIPELINE_HOME = Join-Path $PWD ".tmp-runtime-home"
```

## Integration Notes

Use `scan-current-session-demo.js` when:

- the host can gather the visible current conversation directly
- you want chat-ready suggestion output including `assistant_reply_markdown`
- you want the backend to keep the latest local suggestion snapshot for follow-up actions

Use `apply-first-candidate-demo.js` when:

- the host is handling a short confirmation prompt such as `添加第1条`
- a scan already happened in the same runtime home
- you want the host to reuse cached candidate state instead of replaying transcript input

## Runtime Isolation

The current-session apply step reuses the latest local suggestion cache.

For project-local testing or when multiple host projects share one machine, prefer setting:

```powershell
$env:USER_HABIT_PIPELINE_HOME = Join-Path $PWD ".runtime-home"
```

before running the demos. That keeps the cached suggestion snapshot and user registry inside the host project instead of mixing with another existing local setup.

## Host Responsibilities

- gather visible conversation text
- keep role prefixes such as `user:` and `assistant:`
- pass only the focused excerpt needed for suggestion quality
- require explicit user confirmation before durable writes
