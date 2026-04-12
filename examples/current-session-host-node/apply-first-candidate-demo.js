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

const userRegistryPath = process.env.USER_HABIT_PIPELINE_HOME
  ? path.join(process.env.USER_HABIT_PIPELINE_HOME, "user_habits.json")
  : null;

const invocation = resolveCodexSessionInvocation();
const result = spawnSync(
  invocation.command,
  [
    ...invocation.args,
    "--request",
    "把第1条加到 session_close 场景",
    ...(userRegistryPath ? ["--user-registry", userRegistryPath] : [])
  ],
  {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: invocation.shell
  }
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  throw new Error([
    "Current-session apply demo failed.",
    result.stdout ? `stdout:\n${result.stdout}` : null,
    result.stderr ? `stderr:\n${result.stderr}` : null
  ].filter(Boolean).join("\n\n"));
}

const payload = JSON.parse(result.stdout);
process.stdout.write(`${JSON.stringify({
  integration_path: "current-session-apply",
  action: payload.action,
  phrase: payload.applied_rule?.phrase || null,
  normalized_intent: payload.applied_rule?.normalized_intent || null,
  next_step_level: payload.next_step_assessment?.level || null
}, null, 2)}\n`);
