# External Consumer Node Demo

This folder shows the smallest realistic way another local Node.js project can consume `user-habit-pipeline`.

It demonstrates five paths:

- call the library directly from application code
- call the shipped CLI as a JSON subprocess boundary
- start the official localhost HTTP server from application code and call it through HTTP
- gate a host action before execution with a stable semantic decision object

Use this when you want a copyable external-project example instead of isolated snippets.

## Files

- `direct-library-demo.js`
- `cli-subprocess-demo.js`
- `embedded-http-demo.js`
- `pre-action-gate-demo.js`
- `host-router-demo.js`

## Run From This Repository

From the repository root:

```powershell
node .\examples\external-consumer-node\direct-library-demo.js
node .\examples\external-consumer-node\cli-subprocess-demo.js
node .\examples\external-consumer-node\embedded-http-demo.js
node .\examples\external-consumer-node\pre-action-gate-demo.js
node .\examples\external-consumer-node\host-router-demo.js
```

These scripts use `require("user-habit-pipeline")` exactly like an external consumer project would.

## Copy Into Another Project

1. Add the package to the target project:

```powershell
npm install user-habit-pipeline
```

2. Copy the script you want as a starting point.
3. Replace the sample message, scenario, and port with your host application's own values.

## Best Fit

Use `direct-library-demo.js` when:

- your host is already Node.js
- you want the simplest possible function-call integration

Use `cli-subprocess-demo.js` when:

- your host is Node.js but you still want the most stable JSON subprocess boundary
- you want to keep the package behind an explicit CLI contract
- you do not want to link host code directly to library calls yet

Use `embedded-http-demo.js` when:

- your host is Node.js or Electron
- you want an API-shaped localhost boundary
- you do not want subprocess management around `user-habit-pipeline-http`

Use `pre-action-gate-demo.js` when:

- your host is about to act on a short user message
- you want one stable `proceed` vs `ask_clarifying_question` decision before selecting downstream tools
- you want the package to stay an interpretation layer instead of a workflow executor

Use `host-router-demo.js` when:

- you want to simulate the full host loop of `interpret -> decide -> route`
- you need a copyable pattern for mapping `normalized_intent` into your own downstream handlers
- you want the host to own routing and execution while the package stays semantic-only
