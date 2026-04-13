# Current-Session Host Node Template

This folder is a copyable starting point for chat hosts or Codex-style integrations that already have access to visible conversation text and want to use `codex-session-habits`.

It demonstrates the current-session flow in two levels:

- `scan-current-session-demo.js` for piping a role-prefixed transcript into the backend
- `apply-first-candidate-demo.js` for confirming the latest cached suggestion with a short follow-up prompt
- `scan-apply-interpret-demo.js` for showing the full before/after improvement on the same shorthand message
- `happy-path-demo.js` for the shortest outward-facing story that combines scan, apply, and interpretation improvement

Use this when you want a real host-side example for current-session habit scanning instead of only the low-level CLI contract.

The demo outputs also include small `roi_event` objects so manual evaluation can record whether candidate discovery and explicit acceptance actually happened.

## Run From This Repository

From the repository root:

```powershell
node .\examples\current-session-host-node\scan-current-session-demo.js
node .\examples\current-session-host-node\apply-first-candidate-demo.js
node .\examples\current-session-host-node\scan-apply-interpret-demo.js
node .\examples\current-session-host-node\happy-path-demo.js
```

To keep the cache isolated while testing, set a temporary runtime home first:

```powershell
$env:USER_HABIT_PIPELINE_HOME = Join-Path $PWD ".tmp-runtime-home"
```

## Integration Notes

Use `scan-current-session-demo.js` when:

- the host can gather the visible current conversation directly
- you want chat-ready suggestion output including `assistant_reply_markdown`
- you want a structured `candidate_previews` layer for UI cards or richer candidate rows
- you want the backend to keep the latest local suggestion snapshot for follow-up actions

Use `apply-first-candidate-demo.js` when:

- the host is handling a short confirmation prompt such as `添加第1条`
- a scan already happened in the same runtime home
- you want the host to reuse cached candidate state instead of replaying transcript input

Use `scan-apply-interpret-demo.js` when:

- you want one proof that current-session suggestion review improves later interpretation
- you need a simple before/after artifact for demos or release notes
- you want to show that durable habit writes stay explicit but still create measurable value

Use `happy-path-demo.js` when:

- you want the shortest outward-facing demo story
- you need a README, release, or recording script that is easy to narrate
- you want one compact JSON artifact instead of multiple intermediate outputs

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
