const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function resolveCodexSessionInvocation() {
  const installedBin = path.join(
    process.cwd(),
    "node_modules",
    ".bin",
    process.platform === "win32" ? "codex-session-habits.cmd" : "codex-session-habits"
  );

  if (fs.existsSync(installedBin)) {
    return {
      command: installedBin,
      args: [],
      shell: process.platform === "win32"
    };
  }

  return {
    command: process.execPath,
    args: [path.join(__dirname, "..", "..", "src", "codex-session-habits-cli.js")],
    shell: false
  };
}

const transcript = [
  "user: 以后我说“收个尾”就是 close_session",
  "assistant: 收到，我后面按 close_session 理解。",
  "user: 收个尾"
].join("\n");
const userRegistryPath = process.env.USER_HABIT_PIPELINE_HOME
  ? path.join(process.env.USER_HABIT_PIPELINE_HOME, "user_habits.json")
  : null;

const invocation = resolveCodexSessionInvocation();
const result = spawnSync(
  invocation.command,
  [
    ...invocation.args,
    "--request",
    "扫描这次会话里的习惯候选",
    "--thread-stdin",
    ...(userRegistryPath ? ["--user-registry", userRegistryPath] : [])
  ],
  {
    cwd: process.cwd(),
    encoding: "utf8",
    input: transcript,
    stdio: ["pipe", "pipe", "pipe"],
    shell: invocation.shell
  }
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  throw new Error([
    "Current-session scan demo failed.",
    result.stdout ? `stdout:\n${result.stdout}` : null,
    result.stderr ? `stderr:\n${result.stderr}` : null
  ].filter(Boolean).join("\n\n"));
}

const payload = JSON.parse(result.stdout);
process.stdout.write(`${JSON.stringify({
  integration_path: "current-session-scan",
  action: payload.action,
  candidate_count: payload.candidate_count,
  top_phrase: payload.candidates?.[0]?.phrase || null,
  suggested_follow_ups: payload.suggested_follow_ups
}, null, 2)}\n`);
