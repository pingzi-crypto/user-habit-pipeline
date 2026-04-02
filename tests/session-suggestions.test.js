const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  deriveSuggestionCachePath,
  findSuggestedCandidate,
  loadSuggestionSnapshot,
  parseCandidateReference,
  parseSessionTranscript,
  saveSuggestionSnapshot,
  suggestSessionHabitCandidates
} = require("../src");

function createTempRegistryPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "uhp-session-suggest-")), "user_habits.json");
}

test("parseSessionTranscript groups role-prefixed multiline messages", () => {
  const messages = parseSessionTranscript([
    "user: 新增习惯短句 phrase=收尾一下",
    "intent=close_session",
    "assistant: 好的，我先记录。",
    "user: 收尾一下"
  ].join("\n"));

  assert.equal(messages.length, 3);
  assert.equal(messages[0].role, "user");
  assert.equal(messages[0].content, "新增习惯短句 phrase=收尾一下\nintent=close_session");
  assert.equal(messages[1].role, "assistant");
  assert.equal(messages[2].content, "收尾一下");
});

test("suggestSessionHabitCandidates extracts explicit add and definition candidates", () => {
  const userRegistryPath = createTempRegistryPath();
  const transcript = [
    "user: 以后我说“收尾一下”就是 close_session",
    "assistant: 收到。",
    "user: 新增习惯短句 phrase=复盘一下",
    "intent=close_session",
    "场景=session_close",
    "置信度=0.87"
  ].join("\n");

  const result = suggestSessionHabitCandidates(transcript, {
    userRegistryPath,
    maxCandidates: 5
  });

  assert.equal(result.candidates.length, 2);
  assert.equal(result.candidates[0].action, "suggest_add");
  assert.equal(result.candidates[0].suggested_rule.phrase, "复盘一下");
  assert.equal(result.candidates[0].suggested_rule.normalized_intent, "close_session");

  const definitionCandidate = result.candidates.find((item) => item.phrase === "收尾一下");
  assert.ok(definitionCandidate);
  assert.equal(definitionCandidate.suggested_rule.normalized_intent, "close_session");
});

test("suggestSessionHabitCandidates surfaces repeated unknown short phrases as review-only candidates", () => {
  const userRegistryPath = createTempRegistryPath();
  const transcript = [
    "user: 收工啦",
    "assistant: 你是想结束当前线程吗？",
    "user: 收工啦",
    "assistant: 需要我帮你总结吗？"
  ].join("\n");

  const result = suggestSessionHabitCandidates(transcript, {
    userRegistryPath,
    maxCandidates: 5
  });

  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].phrase, "收工啦");
  assert.equal(result.candidates[0].action, "review_only");
  assert.equal(result.candidates[0].suggested_rule, null);
  assert.deepEqual(result.candidates[0].risk_flags, ["single_thread_only", "missing_intent"]);
});

test("candidate references support cN and 第N条 forms", () => {
  assert.equal(parseCandidateReference("c2"), "c2");
  assert.equal(parseCandidateReference("2"), "c2");
  assert.equal(parseCandidateReference("第 3 条"), "c3");
});

test("findSuggestedCandidate returns the referenced candidate from a snapshot", () => {
  const snapshot = {
    candidates: [
      { candidate_id: "c1", phrase: "收尾一下", suggested_rule: { phrase: "收尾一下" } },
      { candidate_id: "c2", phrase: "复盘一下", suggested_rule: { phrase: "复盘一下" } }
    ]
  };

  const candidate = findSuggestedCandidate(snapshot, "第2条");
  assert.equal(candidate.candidate_id, "c2");
  assert.equal(candidate.phrase, "复盘一下");
});

test("suggestion snapshots can be saved and loaded from the derived cache path", () => {
  const userRegistryPath = createTempRegistryPath();
  const snapshot = {
    schema_version: "1.0",
    record_type: "session_habit_suggestions",
    candidates: [
      { candidate_id: "c1", phrase: "收尾一下", suggested_rule: { phrase: "收尾一下" } }
    ]
  };

  const cachePath = saveSuggestionSnapshot(snapshot, userRegistryPath);
  assert.equal(cachePath, deriveSuggestionCachePath(userRegistryPath));

  const loaded = loadSuggestionSnapshot(userRegistryPath);
  assert.equal(loaded.cachePath, cachePath);
  assert.equal(loaded.snapshot.candidates[0].candidate_id, "c1");
});
