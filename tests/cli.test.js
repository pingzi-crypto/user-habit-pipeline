const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const CLI_PATH = path.join(__dirname, "..", "src", "cli.js");

test("cli prints interpreted JSON", () => {
  const result = spawnSync(process.execPath, [
    CLI_PATH,
    "--message",
    "更新入板",
    "--scenario",
    "status_board"
  ], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.normalized_intent, "add_or_update_board_item");
  assert.equal(parsed.should_ask_clarifying_question, false);
});

test("cli can project through the growth-hub adapter", () => {
  const result = spawnSync(process.execPath, [
    CLI_PATH,
    "--message",
    "验收",
    "--scenario",
    "reviewer",
    "--adapter",
    "growth-hub"
  ], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.hint_intent, "review_acceptance");
  assert.equal(parsed.hint_requires_confirmation, false);
});

test("cli can switch to a custom registry file", () => {
  const result = spawnSync(process.execPath, [
    CLI_PATH,
    "--message",
    "归档一下",
    "--scenario",
    "session_close",
    "--registry",
    path.join(__dirname, "fixtures", "alt_habits.json")
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
});
