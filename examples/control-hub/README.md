# Experimental Control-Hub Adapter Demo

Experimental, repo-only material.
This folder is not part of the package's supported public API surface.

This folder shows the narrowest intended host integration path for a control-hub style workflow.

It is intentionally not a generic workflow framework demo.

Use it when you want to test this exact boundary:

- the host decides the current text should be treated as `context_type = "policy_override"`
- the host calls the adapter explicitly
- the adapter returns `matched`, `no_match`, or `ambiguous`
- the host still owns whether to ask, ignore, or apply the result

Files:

- `policy-override-demo.js`
- `host-contract-demo.js`

Run from the repository root:

```powershell
node .\examples\control-hub\policy-override-demo.js
node .\examples\control-hub\host-contract-demo.js
```

What this demo intentionally does not show:

- workflow execution
- reducer updates
- status-machine mutation
- automatic durable writes
- generic natural-language approval parsing

Short form:

- host detects context
- adapter interprets narrow shorthand
- host stays in control
