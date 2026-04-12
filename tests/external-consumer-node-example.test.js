const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.join(__dirname, "..");
const directDemoPath = path.join(rootDir, "examples", "external-consumer-node", "direct-library-demo.js");
const cliDemoPath = path.join(rootDir, "examples", "external-consumer-node", "cli-subprocess-demo.js");
const httpDemoPath = path.join(rootDir, "examples", "external-consumer-node", "embedded-http-demo.js");

function runNodeScript(scriptPath) {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error([
      `Script failed: ${scriptPath}`,
      result.stdout ? `stdout:\n${result.stdout}` : null,
      result.stderr ? `stderr:\n${result.stderr}` : null
    ].filter(Boolean).join("\n\n"));
  }

  return JSON.parse(result.stdout);
}

test("external consumer direct-library demo runs successfully", () => {
  const output = runNodeScript(directDemoPath);
  assert.equal(output.integration_path, "direct-library");
  assert.equal(output.normalized_intent, "continue_current_track");
  assert.equal(typeof output.confidence, "number");
});

test("external consumer cli-subprocess demo runs successfully", () => {
  const output = runNodeScript(cliDemoPath);
  assert.equal(output.integration_path, "cli-subprocess");
  assert.equal(output.normalized_intent, "continue_current_track");
  assert.equal(typeof output.confidence, "number");
});

test("external consumer embedded-http demo runs successfully", () => {
  const output = runNodeScript(httpDemoPath);
  assert.equal(output.integration_path, "embedded-http");
  assert.match(output.url, /^http:\/\/127\.0\.0\.1:\d+$/u);
  assert.equal(output.normalized_intent, "continue_current_track");
  assert.equal(typeof output.confidence, "number");
});
