const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  addUserHabitRule,
  interpretHabit,
  loadUserRegistryState,
  parseHabitManagementRequest,
  removeUserHabitPhrase
} = require("../src");

function createTempRegistryPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "uhp-user-registry-")), "user_habits.json");
}

test("user-added habit phrases become available to the interpreter", () => {
  const userRegistryPath = createTempRegistryPath();

  addUserHabitRule({
    phrase: "收尾一下",
    normalized_intent: "close_session",
    scenario_bias: ["session_close"],
    confidence: 0.87
  }, userRegistryPath);

  const result = interpretHabit(
    { message: "收尾一下", scenario: "session_close" },
    { userRegistryPath }
  );

  assert.equal(result.normalized_intent, "close_session");
  assert.equal(result.should_ask_clarifying_question, false);
});

test("removing a phrase hides the default registry match in the effective registry", () => {
  const userRegistryPath = createTempRegistryPath();

  removeUserHabitPhrase("验收", userRegistryPath);

  const result = interpretHabit(
    { message: "验收", scenario: "reviewer" },
    { userRegistryPath }
  );

  assert.equal(result.normalized_intent, "unknown");
  assert.equal(result.should_ask_clarifying_question, true);
});

test("user registry state tracks additions and removals separately", () => {
  const userRegistryPath = createTempRegistryPath();

  addUserHabitRule({
    phrase: "收尾一下",
    normalized_intent: "close_session",
    scenario_bias: ["session_close"],
    confidence: 0.87
  }, userRegistryPath);
  removeUserHabitPhrase("验收", userRegistryPath);

  const state = loadUserRegistryState(userRegistryPath);
  assert.equal(state.additions.length, 1);
  assert.equal(state.additions[0].phrase, "收尾一下");
  assert.deepEqual(state.removals, ["验收"]);
});

test("prompt parser supports add, remove, and list requests", () => {
  assert.deepEqual(
    parseHabitManagementRequest("列出用户习惯短句"),
    { action: "list" }
  );

  assert.deepEqual(
    parseHabitManagementRequest("删除用户习惯短句: 收尾一下"),
    { action: "remove", phrase: "收尾一下" }
  );

  const addRequest = parseHabitManagementRequest(
    "添加用户习惯短句: phrase=收尾一下; intent=close_session; 场景=session_close; 置信度=0.86"
  );
  assert.equal(addRequest.action, "add");
  assert.equal(addRequest.rule.phrase, "收尾一下");
  assert.equal(addRequest.rule.normalized_intent, "close_session");
  assert.deepEqual(addRequest.rule.scenario_bias, ["session_close"]);
  assert.equal(addRequest.rule.confidence, 0.86);
});
