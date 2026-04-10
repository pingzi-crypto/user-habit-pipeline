# External Consumer Node Demo

This folder shows the smallest realistic way another local Node.js project can consume `user-habit-pipeline`.

It demonstrates two paths:

- call the library directly from application code
- start the official localhost HTTP server from application code and call it through HTTP

Use this when you want a copyable external-project example instead of isolated snippets.

## Files

- `direct-library-demo.js`
- `embedded-http-demo.js`

## Run From This Repository

From the repository root:

```powershell
node .\examples\external-consumer-node\direct-library-demo.js
node .\examples\external-consumer-node\embedded-http-demo.js
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

Use `embedded-http-demo.js` when:

- your host is Node.js or Electron
- you want an API-shaped localhost boundary
- you do not want subprocess management around `user-habit-pipeline-http`
