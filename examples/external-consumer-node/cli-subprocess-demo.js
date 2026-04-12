const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function resolveCliInvocation() {
  const installedBin = path.join(
    process.cwd(),
    "node_modules",
    ".bin",
    process.platform === "win32" ? "user-habit-pipeline.cmd" : "user-habit-pipeline"
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
    args: [path.join(__dirname, "..", "..", "src", "cli.js")],
    shell: false
  };
}

const invocation = resolveCliInvocation();
const result = spawnSync(
  invocation.command,
  [
    ...invocation.args,
    "--message",
    "继续",
    "--scenario",
    "general"
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
    "CLI subprocess demo failed.",
    result.stdout ? `stdout:\n${result.stdout}` : null,
    result.stderr ? `stderr:\n${result.stderr}` : null
  ].filter(Boolean).join("\n\n"));
}

const payload = JSON.parse(result.stdout);
process.stdout.write(`${JSON.stringify({
  integration_path: "cli-subprocess",
  normalized_intent: payload.normalized_intent,
  confidence: payload.confidence,
  should_ask_clarifying_question: payload.should_ask_clarifying_question
}, null, 2)}\n`);
