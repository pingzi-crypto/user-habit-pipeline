const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const CLI_PATH = path.join(__dirname, "..", "src", "cli.js");
function createTempUserRegistryPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "uhp-interpret-cli-")), "user_habits.json");
}

test("cli prints interpreted JSON", () => {
  const userRegistryPath = createTempUserRegistryPath();
  const result = spawnSync(process.execPath, [
    CLI_PATH,
    "--message",
    "更新入板",
    "--scenario",
    "status_board",
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.normalized_intent, "add_or_update_board_item");
  assert.equal(parsed.should_ask_clarifying_question, false);
});

test("cli can project through the growth-hub adapter", () => {
  const userRegistryPath = createTempUserRegistryPath();
  const result = spawnSync(process.execPath, [
    CLI_PATH,
    "--message",
    "验收",
    "--scenario",
    "reviewer",
    "--adapter",
    "growth-hub",
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.hint_intent, "review_acceptance");
  assert.equal(parsed.hint_requires_confirmation, false);
});

test("cli can return pre-action output for host routing", () => {
  const userRegistryPath = createTempUserRegistryPath();
  const result = spawnSync(process.execPath, [
    CLI_PATH,
    "--message",
    "读取最新状态板",
    "--scenario",
    "status_board",
    "--pre-action",
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.result.normalized_intent, "refresh_latest_board_state");
  assert.equal(parsed.pre_action_decision.next_action, "proceed");
});

test("cli can return memory conflict output when host local memory disagrees", () => {
  const userRegistryPath = createTempUserRegistryPath();
  const result = spawnSync(process.execPath, [
    CLI_PATH,
    "--message",
    "读取最新状态板",
    "--scenario",
    "status_board",
    "--external-memory-intent",
    "close_session",
    "--external-memory-source",
    "host_local_memory",
    "--external-memory-confidence",
    "0.91",
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.pre_action_decision.next_action, "proceed");
  assert.equal(parsed.memory_conflict_decision.memory_conflict_detected, true);
  assert.equal(parsed.memory_conflict_decision.final_next_action, "ask_clarifying_question");
});

test("cli can switch to a custom registry file", () => {
  const userRegistryPath = createTempUserRegistryPath();
  const result = spawnSync(process.execPath, [
    CLI_PATH,
    "--message",
    "归档一下",
    "--scenario",
    "session_close",
    "--registry",
    path.join(__dirname, "fixtures", "alt_habits.json"),
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.normalized_intent, "archive_current_thread");
  assert.equal(parsed.should_ask_clarifying_question, false);
});

test("cli exits with usage when message is missing", () => {
  const result = spawnSync(process.execPath, [CLI_PATH], {
    encoding: "utf8"
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Usage: user-habit-pipeline/);
});

test("cli prints help and exits zero", () => {
  const result = spawnSync(process.execPath, [CLI_PATH, "--help"], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: user-habit-pipeline/);
  assert.match(result.stdout, /--registry <path>/);
  assert.match(result.stdout, /--user-registry <path>/);
  assert.match(result.stdout, /--pre-action/);
  assert.match(result.stdout, /--external-memory-intent/);
});
