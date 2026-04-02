const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  addUserHabitRule,
  exportUserRegistryState,
  importUserRegistryState,
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
    parseHabitManagementRequest("看看当前习惯短句列表"),
    { action: "list" }
  );

  assert.deepEqual(
    parseHabitManagementRequest("删除习惯短句 收尾一下"),
    { action: "remove", phrase: "收尾一下" }
  );

  const addRequest = parseHabitManagementRequest(
    "新增习惯短句 phrase=收尾一下\nintent=close_session\n场景=session_close\n置信度=0.86"
  );
  assert.equal(addRequest.action, "add");
  assert.equal(addRequest.rule.phrase, "收尾一下");
  assert.equal(addRequest.rule.normalized_intent, "close_session");
  assert.deepEqual(addRequest.rule.scenario_bias, ["session_close"]);
  assert.equal(addRequest.rule.confidence, 0.86);

  const exportRequest = parseHabitManagementRequest("导出用户习惯短句: path=./backup.json");
  assert.deepEqual(exportRequest, {
    action: "export",
    path: "./backup.json",
    mode: undefined
  });

  const importRequest = parseHabitManagementRequest("导入习惯短句 路径=./backup.json; 模式=merge");
  assert.deepEqual(importRequest, {
    action: "import",
    path: "./backup.json",
    mode: "merge"
  });

  const suggestRequest = parseHabitManagementRequest("扫描这次会话里的习惯候选");
  assert.deepEqual(suggestRequest, {
    action: "suggest",
    scope: "current_session"
  });

  const applyCandidateRequest = parseHabitManagementRequest("添加第1条");
  assert.deepEqual(applyCandidateRequest, {
    action: "apply-candidate",
    candidate_ref: "c1"
  });
});

test("user registry state can be exported and imported", () => {
  const sourceRegistryPath = createTempRegistryPath();
  const destinationRegistryPath = createTempRegistryPath();
  const exportPath = path.join(path.dirname(sourceRegistryPath), "exported_user_habits.json");

  addUserHabitRule({
    phrase: "收尾一下",
    normalized_intent: "close_session",
    scenario_bias: ["session_close"],
    confidence: 0.87
  }, sourceRegistryPath);
  removeUserHabitPhrase("验收", sourceRegistryPath);

  exportUserRegistryState(exportPath, sourceRegistryPath);
  const imported = importUserRegistryState(exportPath, destinationRegistryPath, "replace");

  assert.equal(imported.additions.length, 1);
  assert.equal(imported.additions[0].phrase, "收尾一下");
  assert.deepEqual(imported.removals, ["验收"]);
});

test("user registry import merge keeps existing entries and overlays imported ones", () => {
  const sourceRegistryPath = createTempRegistryPath();
  const destinationRegistryPath = createTempRegistryPath();
  const exportPath = path.join(path.dirname(sourceRegistryPath), "merge_user_habits.json");

  addUserHabitRule({
    phrase: "收尾一下",
    normalized_intent: "close_session",
    scenario_bias: ["session_close"],
    confidence: 0.87
  }, sourceRegistryPath);
  exportUserRegistryState(exportPath, sourceRegistryPath);

  addUserHabitRule({
    phrase: "复盘一下",
    normalized_intent: "close_session",
    scenario_bias: ["session_close"],
    confidence: 0.82
  }, destinationRegistryPath);
  removeUserHabitPhrase("验收", destinationRegistryPath);

  const merged = importUserRegistryState(exportPath, destinationRegistryPath, "merge");

  assert.equal(merged.additions.length, 2);
  assert.deepEqual(
    merged.additions.map((item) => item.phrase).sort(),
    ["收尾一下", "复盘一下"].sort()
  );
  assert.deepEqual(merged.removals, ["验收"]);
});
