const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const CODEX_SESSION_HABITS_CLI_PATH = path.join(__dirname, "..", "src", "codex-session-habits-cli.js");

function createTempRegistryPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "uhp-codex-session-cli-")), "user_habits.json");
}

test("codex-session-habits cli can scan the current session from stdin", () => {
  const userRegistryPath = createTempRegistryPath();

  const result = spawnSync(process.execPath, [
    CODEX_SESSION_HABITS_CLI_PATH,
    "--request",
    "扫描这次会话里的习惯候选",
    "--thread-stdin",
    "--user-registry",
    userRegistryPath
  ], {
    input: [
      "user: 以后我说“收尾一下”就是 close_session",
      "assistant: 收到。",
      "user: 收尾一下"
    ].join("\n"),
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.action, "suggest");
  assert.equal(parsed.candidate_count, 1);
  assert.equal(parsed.candidates[0].phrase, "收尾一下");
  assert.equal(parsed.candidates[0].confidence_details.domain, "session_suggestion");
  assert.equal(parsed.candidates[0].confidence_details.final_score, 0.84);
});

test("codex-session-habits cli can apply the latest cached suggestion with a short follow-up request", () => {
  const userRegistryPath = createTempRegistryPath();

  const scanResult = spawnSync(process.execPath, [
    CODEX_SESSION_HABITS_CLI_PATH,
    "--request",
    "扫描这次会话里的习惯候选",
    "--thread-stdin",
    "--user-registry",
    userRegistryPath
  ], {
    input: [
      "user: 以后我说“收尾一下”就是 close_session",
      "assistant: 收到。",
      "user: 收尾一下"
    ].join("\n"),
    encoding: "utf8"
  });

  assert.equal(scanResult.status, 0);

  const applyResult = spawnSync(process.execPath, [
    CODEX_SESSION_HABITS_CLI_PATH,
    "--request",
    "把第1条加到 session_close 场景",
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });

  assert.equal(applyResult.status, 0);
  const parsed = JSON.parse(applyResult.stdout);
  assert.equal(parsed.action, "apply-candidate");
  assert.equal(parsed.applied_rule.phrase, "收尾一下");
  assert.deepEqual(parsed.applied_rule.scenario_bias, ["session_close"]);
});

test("codex-session-habits cli requires a thread source for current-session scans", () => {
  const userRegistryPath = createTempRegistryPath();

  const result = spawnSync(process.execPath, [
    CODEX_SESSION_HABITS_CLI_PATH,
    "--request",
    "扫描这次会话里的习惯候选",
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Current-session suggestion scans require --thread <path> or --thread-stdin\./);
});
