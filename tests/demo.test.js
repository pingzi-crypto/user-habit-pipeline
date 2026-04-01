const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const DEMO_PATH = path.join(__dirname, "..", "src", "demo.js");

test("demo script prints the three expected release-facing examples", () => {
  const result = spawnSync(process.execPath, [DEMO_PATH], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);

  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].label, "default_explicit");
  assert.equal(parsed[0].output.normalized_intent, "add_or_update_board_item");
  assert.equal(parsed[1].label, "default_ambiguous");
  assert.equal(parsed[1].output.should_ask_clarifying_question, true);
  assert.equal(parsed[2].label, "alternate_registry");
  assert.equal(parsed[2].output.normalized_intent, "archive_current_thread");
});
