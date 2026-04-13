# Integration Quickstart

This document shows the lowest-friction ways to integrate `user-habit-pipeline` into another local project.

If you only need one recommendation, use this:

- Node project: call the library directly
- non-Node project: call the CLI and read JSON
- chat host / assistant UI: call `codex-session-habits`

If you need help choosing across hosts or deciding whether runtime state should be shared or isolated, see:

- [cross-host-integration-guide.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/cross-host-integration-guide.md)

The package is an interpretation layer, not a workflow server.
It now also ships an optional localhost HTTP entrypoint for local integration.

---

## Install

Add it to the target project:

```powershell
npm install user-habit-pipeline
```

If you want the fastest outside-project proof before wiring your own host, start with the public demo repo:

- [pingzi-crypto/user-habit-pipeline-codex-demo](https://github.com/pingzi-crypto/user-habit-pipeline-codex-demo)
- It installs the published package, auto-scaffolds the `--host codex` starter, and runs a local `scan -> apply` flow with project-local runtime isolation.

Optional starter generator for the target project:

```powershell
npx user-habit-pipeline-init-consumer --host node --out .\habit-pipeline-starter
npx user-habit-pipeline-init-consumer --host python --out .\habit-pipeline-python-starter
npx user-habit-pipeline-init-consumer --host codex --out .\habit-pipeline-codex-starter
```

The generated Node starter includes `memory-conflict-demo.js`.
The generated Python starter includes `memory-conflict-cli-demo.py`.

You do not need to clone the repository just to use it.

## Verified Environments

The published package and release-check flow are currently verified on:

- Windows with Node.js 18+
- macOS with Node.js 18+
- Linux with Node.js 18+

That validation includes:

- library import and CLI usage
- current-session scan flows
- local HTTP entrypoint checks
- package tarball install smoke from an installed consumer

If your host environment can run Node.js and `npx`, the package boundary should behave consistently across those three operating-system families.

---

## Path 1: Node Project

Use this when the target project already runs on Node.js.

```js
const { interpretHabit } = require("user-habit-pipeline");

const result = interpretHabit({
  message: "继续",
  scenario: "general",
  recent_context: ["继续处理刚才的发布检查"]
});

console.log(result);
```

Best fit:

- backend services already using Node.js
- Electron apps
- local tooling scripts in JavaScript

Useful exports:

- `interpretHabit`
- `interpretHabitForPreAction`
- `buildPreActionDecision`
- `suggestSessionHabitCandidates`
- `addUserHabitRule`
- `removeUserHabitPhrase`
- `loadUserRegistryState`
- `parseHabitManagementRequest`

This is the cleanest integration path when you want function calls instead of subprocesses.

If the host is about to execute a downstream action and needs a stable semantic gate first, use:

```js
const { interpretHabitForPreAction } = require("user-habit-pipeline");

const { pre_action_decision } = interpretHabitForPreAction({
  message: "继续",
  scenario: "general"
});

console.log(pre_action_decision.next_action);
```

Use this when:

- the host needs `proceed` vs `ask_clarifying_question` before selecting tools
- the package should remain an interpretation layer instead of embedding workflow execution

If the target project prefers an API-shaped localhost boundary but still runs on Node.js, you can also embed the shipped HTTP server directly instead of spawning the CLI:

```js
const { startHttpServer } = require("user-habit-pipeline");

async function main() {
  const { url, server } = await startHttpServer({
    host: "127.0.0.1",
    port: 4848
  });

  console.log(`user-habit-pipeline listening at ${url}`);

  process.on("SIGINT", () => {
    server.close(() => process.exit(0));
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

Useful embedded HTTP exports:

- `createHttpServer`
- `startHttpServer`

Use this when:

- the host is Node.js or Electron
- you want the official HTTP contract
- you do not want subprocess management overhead

Copyable external-project demo files:

- [examples/external-consumer-node/README.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/external-consumer-node/README.md)
- [examples/external-consumer-node/direct-library-demo.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/external-consumer-node/direct-library-demo.js)
- [examples/external-consumer-node/cli-subprocess-demo.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/external-consumer-node/cli-subprocess-demo.js)
- [examples/external-consumer-node/embedded-http-demo.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/external-consumer-node/embedded-http-demo.js)
- [examples/external-consumer-node/host-router-demo.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/external-consumer-node/host-router-demo.js)
- [docs/pre-action-host-integration.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/pre-action-host-integration.md)
- [docs/demo-roi-metrics.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/demo-roi-metrics.md)
- [docs/cross-host-integration-guide.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/cross-host-integration-guide.md)

Official starter command:

```powershell
npx user-habit-pipeline-init-consumer --host node --out .\habit-pipeline-starter
```

That generated starter includes a copyable `memory-conflict-demo.js` path for hosts that already keep their own local memory.

---

## Path 2: Any Language Via CLI

Use this when the target project is not written in Node.js, or when you want the most stable integration boundary.

Interpret one message:

```powershell
npx user-habit-pipeline --message "继续" --scenario general
```

Ask the CLI for a pre-action routing decision:

```powershell
npx user-habit-pipeline --message "继续" --scenario general --pre-action
```

Compare host local memory against the pipeline and downgrade to clarify-first on disagreement:

```powershell
npx user-habit-pipeline --message "读取最新状态板" --scenario status_board --external-memory-intent close_session --external-memory-source host_local_memory --external-memory-confidence 0.91
```

Manage user-defined phrases:

```powershell
npx manage-user-habits --request "添加用户习惯短句: phrase=收尾一下; intent=close_session; 场景=session_close; 置信度=0.86"
```

Why this path is often best:

- the CLI prints JSON
- any host language can call it
- runtime user state is handled by the package
- you avoid reimplementing parser and storage rules in another stack

Recommended host pattern:

1. install the package as a dependency in the target project
2. invoke `npx user-habit-pipeline` or `npx manage-user-habits`
3. parse stdout as JSON
4. let your host decide whether to execute any downstream action

If the host needs a subprocess-based semantic gate before action:

1. call `npx user-habit-pipeline --pre-action ...`
2. if the host also has local memory, pass `--external-memory-intent ...`
3. if `memory_conflict_decision.final_next_action = ask_clarifying_question`, ask first and stop

This is usually the simplest production boundary for Python, Go, Rust, or desktop automation tools.

Python example:

```python
import json
import subprocess

completed = subprocess.run(
    [
        "npx",
        "user-habit-pipeline",
        "--message",
        "继续",
        "--scenario",
        "general",
    ],
    check=True,
    capture_output=True,
    text=True,
)

result = json.loads(completed.stdout)
print(result["normalized_intent"])
```

Python example for phrase management:

```python
import json
import subprocess

completed = subprocess.run(
    [
        "npx",
        "manage-user-habits",
        "--request",
        "添加用户习惯短句: phrase=收尾一下; intent=close_session; 场景=session_close; 置信度=0.86",
    ],
    check=True,
    capture_output=True,
    text=True,
)

result = json.loads(completed.stdout)
print(result["status"])
```

Copyable Python-project starter files:

- [examples/external-consumer-python/README.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/external-consumer-python/README.md)
- [examples/external-consumer-python/cli-demo.py](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/external-consumer-python/cli-demo.py)
- [examples/external-consumer-python/http-client-demo.py](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/external-consumer-python/http-client-demo.py)

Official starter command:

```powershell
npx user-habit-pipeline-init-consumer --host python --out .\habit-pipeline-python-starter
```

---

## Path 3: Chat Host Or Assistant UI

Use this when the host already has access to visible conversation text and wants an in-thread flow such as:

- `扫描这次会话里的习惯候选`
- `添加第1条`
- `忽略第1条`

Bridge command:

```powershell
@'
user: 以后我说“收尾一下”就是 close_session
assistant: 收到。
user: 收尾一下
'@ | npx codex-session-habits --request "扫描这次会话里的习惯候选" --thread-stdin
```

Host responsibilities:

- gather visible conversation text
- pass it through `--thread <path>` or `--thread-stdin`
- render returned JSON or chat-ready fields in the UI
- require explicit user confirmation before durable writes

Do not make the user manually locate transcript files.
Do not scrape unknown private thread stores.

This path is the intended contract for Codex-style current-session integrations.

For project-local testing or multi-project isolation, prefer setting `USER_HABIT_PIPELINE_HOME` to a host-owned runtime directory before running the scan/apply flow. That keeps the cached suggestion snapshot and user registry local to the host project instead of reusing another existing machine-level setup.

Copyable current-session host starter files:

- [examples/current-session-host-node/README.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/current-session-host-node/README.md)
- [examples/current-session-host-node/scan-current-session-demo.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/current-session-host-node/scan-current-session-demo.js)
- [examples/current-session-host-node/apply-first-candidate-demo.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/current-session-host-node/apply-first-candidate-demo.js)
- [examples/current-session-host-node/scan-apply-interpret-demo.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/current-session-host-node/scan-apply-interpret-demo.js)
- [examples/current-session-host-node/happy-path-demo.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/current-session-host-node/happy-path-demo.js)
- [docs/happy-path-demo.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/happy-path-demo.md)
- [docs/cross-host-integration-guide.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/cross-host-integration-guide.md)

Official starter command:

```powershell
npx user-habit-pipeline-init-consumer --host codex --out .\habit-pipeline-codex-starter
```

---

## Runtime Data

By default, user state is stored outside the installed package:

- Windows: `%APPDATA%\user-habit-pipeline\user_habits.json`
- non-Windows: `~/.config/user-habit-pipeline/user_habits.json`

You can override the runtime data root with:

- `USER_HABIT_PIPELINE_HOME`

That is useful when another application wants a project-local or sandbox-local state directory.

For a decision framework on when to share state vs isolate it, see:

- [cross-host-integration-guide.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/cross-host-integration-guide.md)

---

## Which Path Should You Choose

Choose library calls if:

- your host is already Node.js
- you want direct function integration

Choose CLI calls if:

- your host is not Node.js
- you want the lowest integration complexity
- you want a stable subprocess boundary

Choose `codex-session-habits` if:

- the host is a conversation UI
- the user should trigger scans from natural prompts inside the current thread

---

## Local HTTP Entry Point

If another local project really wants an API-shaped boundary, the package now ships an official localhost entrypoint and matching embeddable server helpers:

- `user-habit-pipeline-http`
- library helpers: `createHttpServer`, `startHttpServer`
- implementation: [http-server-cli.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/src/http-server-cli.js)
- shared server module: [http_server.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/src/http_server.js)
- compatibility example wrapper: [local-http-wrapper.js](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/local-http-wrapper.js)
- Python client example: [http-client-python.py](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/http-client-python.py)
- PowerShell client example: [http-client-powershell.ps1](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/examples/http-client-powershell.ps1)

Run it:

```powershell
npx user-habit-pipeline-http --port 4848
```

Default address:

- `http://127.0.0.1:4848`

Available endpoints:

- `GET /health`
- `POST /interpret`
- `POST /suggest`
- `POST /manage`

`POST /interpret` now returns:

- `result`
- `pre_action_decision`

Optional flags:

- `--host <hostname>`
- `--port <number>`
- `--user-registry <path>`
- `--max-body-bytes <n>`

PowerShell example:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:4848/interpret `
  -ContentType "application/json" `
  -Body '{"message":"继续","scenario":"general"}'
```

Python example:

```python
import json
import urllib.request

request = urllib.request.Request(
    url="http://127.0.0.1:4848/interpret",
    data=json.dumps({"message": "继续", "scenario": "general"}).encode("utf-8"),
    headers={"Content-Type": "application/json"},
    method="POST",
)

with urllib.request.urlopen(request) as response:
    result = json.loads(response.read().decode("utf-8"))

print(result["result"]["normalized_intent"])
```

Use this when another local tool strongly prefers HTTP, but do not mistake it for a remote product server contract.

---

## What Does Not Exist Yet

The package does not currently ship:

- a remote SaaS API
- automatic workflow execution after interpretation

If another project needs HTTP, start with the official local entrypoint above instead of building a custom transport first.
