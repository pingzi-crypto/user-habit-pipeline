const test = require("node:test");
const assert = require("node:assert/strict");
const { interpretHabit } = require("../src");

test("returns the full output contract for unknown input", () => {
  const result = interpretHabit({ message: "去处理一下" });

  assert.deepEqual(Object.keys(result), [
    "normalized_intent",
    "habit_matches",
    "disambiguation_hints",
    "confidence",
    "should_ask_clarifying_question",
    "preferred_terms",
    "notes"
  ]);
  assert.equal(result.normalized_intent, "unknown");
  assert.equal(result.should_ask_clarifying_question, true);
});

test("prefers the longer phrase when substring matches overlap", () => {
  const result = interpretHabit({ message: "请帮我更新入板", scenario: "status_board" });

  assert.equal(result.normalized_intent, "add_or_update_board_item");
  assert.equal(result.habit_matches[0].phrase, "更新入板");
  assert.equal(result.habit_matches[1].phrase, "入板");
});

test("prefers 继续评审 over 继续 when both substring candidates match", () => {
  const result = interpretHabit({ message: "请继续评审这个任务", scenario: "reviewer" });

  assert.equal(result.normalized_intent, "continue_current_track");
  assert.equal(result.habit_matches[0].phrase, "继续评审");
  assert.equal(result.should_ask_clarifying_question, false);
});

test("recent context can support an under-specified phrase without creating a new intent", () => {
  const result = interpretHabit({
    message: "继续",
    scenario: "general",
    recent_context: ["继续当前评审", "review the next issue after this"]
  });

  assert.equal(result.normalized_intent, "continue_current_track");
  assert.ok(result.confidence > 0.7);
  assert.equal(result.habit_matches.length, 1);
});
