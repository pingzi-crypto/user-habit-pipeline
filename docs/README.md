# Start Here

This is the public docs entry for `user-habit-pipeline`.

If you are new to the project, start here instead of opening random docs one by one.

---

## 1. Understand The Product In One Minute

`user-habit-pipeline` is a local-first interpretation layer.

It helps a host turn repeated user shorthand into structured, reviewable intent such as:

- `继续`
- `收尾一下`
- `验收`

It is useful when you want:

- structured intent output
- explicit user-controlled phrase memory
- current-session habit suggestions
- clarify-first behavior before downstream actions

It is not a workflow executor.
It does not silently learn or silently write durable user rules.

---

## 2. Pick The Right Entry Path

Choose one:

- Node / TypeScript host: use the library directly
- non-Node host: use the CLI and parse JSON
- conversation UI or Codex-style host: use `codex-session-habits`
- local tool that wants HTTP: use the local-only HTTP entrypoint

Primary doc:

- [integration-quickstart.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/integration-quickstart.md)

If you need a deeper decision guide:

- [cross-host-integration-guide.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/cross-host-integration-guide.md)

---

## 3. Fastest Working Examples

Outside-project demo:

- [pingzi-crypto/user-habit-pipeline-codex-demo](https://github.com/pingzi-crypto/user-habit-pipeline-codex-demo)

In-repo happy path:

- [happy-path-demo.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/happy-path-demo.md)

Copyable example folders:

- Node host: [examples/external-consumer-node/README.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/external-consumer-node/README.md)
- Python host: [examples/external-consumer-python/README.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/external-consumer-python/README.md)
- current-session host: [examples/current-session-host-node/README.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/current-session-host-node/README.md)

---

## 4. Most Common Tasks

Interpret shorthand:

- [api-reference.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/api-reference.md)

Manage user phrases:

- [user-habit-management.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/user-habit-management.md)

Scan current conversation for habit candidates:

- [session-habit-suggestions.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/session-habit-suggestions.md)

Integrate with Codex-style current-thread flows:

- [codex-current-session-contract.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/codex-current-session-contract.md)
- [codex-skill-integration.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/codex-skill-integration.md)

Use clarify-first routing before downstream actions:

- [pre-action-host-integration.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/pre-action-host-integration.md)

Handle host local memory conflicts conservatively:

- [local-memory-conflict-boundary.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/local-memory-conflict-boundary.md)

---

## 5. Customize The Registry

If you need to ship project-specific defaults or validate registry files:

- [registry-authoring.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/registry-authoring.md)
- [registry.schema.json](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/registry.schema.json)

---

## 6. When To Stop Reading

If you only need to get the package working in another project, these three docs are usually enough:

1. [integration-quickstart.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/integration-quickstart.md)
2. [session-habit-suggestions.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/session-habit-suggestions.md)
3. [user-habit-management.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/user-habit-management.md)

Everything else is for deeper integration detail, edge cases, or reference lookup.
