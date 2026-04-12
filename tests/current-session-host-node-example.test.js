const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.join(__dirname, "..");
const scanDemoPath = path.join(rootDir, "examples", "current-session-host-node", "scan-current-session-demo.js");
const applyDemoPath = path.join(rootDir, "examples", "current-session-host-node", "apply-first-candidate-demo.js");

function createRuntimeHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "uhp-current-session-host-demo-"));
}

function runNodeScript(scriptPath, env) {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: rootDir,
    env,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    throw new Error([
      `Script failed: ${scriptPath}`,
      result.stdout ? `stdout:\n${result.stdout}` : null,
      result.stderr ? `stderr:\n${result.stderr}` : null
    ].filter(Boolean).join("\n\n"));
  }

  return JSON.parse(result.stdout);
}

test("current-session host node demos run successfully in sequence", () => {
  const runtimeHome = createRuntimeHome();
  const env = {
    ...process.env,
    USER_HABIT_PIPELINE_HOME: runtimeHome
  };

  const scanOutput = runNodeScript(scanDemoPath, env);
  assert.equal(scanOutput.integration_path, "current-session-scan");
  assert.equal(scanOutput.action, "suggest");
  assert.equal(scanOutput.candidate_count, 1);
  assert.equal(scanOutput.top_phrase, "收个尾");

  const applyOutput = runNodeScript(applyDemoPath, env);
  assert.equal(applyOutput.integration_path, "current-session-apply");
  assert.equal(applyOutput.action, "apply-candidate");
  assert.equal(applyOutput.phrase, "收个尾");
  assert.equal(applyOutput.normalized_intent, "close_session");
  assert.equal(applyOutput.next_step_level, "low_roi");
});
