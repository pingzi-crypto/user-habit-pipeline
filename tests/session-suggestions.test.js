const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  suppressSuggestionPhrase,
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

function loadFixtureText(name) {
  return fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8");
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

test("parseSessionTranscript normalizes Chinese role labels and preserves unprefixed leading text", () => {
  const messages = parseSessionTranscript([
    "会话摘录",
    "用户: 以后我说“收尾一下”就是 close_session",
    "助手: 收到。",
    "工具: 已缓存候选。"
  ].join("\n"));

  assert.equal(messages.length, 4);
  assert.equal(messages[0].role, "unknown");
  assert.equal(messages[0].content, "会话摘录");
  assert.equal(messages[1].role, "user");
  assert.equal(messages[2].role, "assistant");
  assert.equal(messages[3].role, "tool");
});

test("suggestSessionHabitCandidates handles a realistic Codex transcript with an explicit scenario-specific definition", () => {
  const userRegistryPath = createTempRegistryPath();
  const transcript = loadFixtureText("codex_session_realistic_definition.txt");

  const result = suggestSessionHabitCandidates(transcript, {
    userRegistryPath,
    maxCandidates: 5
  });

  assert.equal(result.transcript_stats.message_count, 12);
  assert.equal(result.transcript_stats.user_message_count, 5);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].phrase, "收尾一下");
  assert.equal(result.candidates[0].source_type, "explicit_definition");
  assert.equal(result.candidates[0].action, "suggest_add");
  assert.equal(result.candidates[0].confidence, 0.88);
  assert.deepEqual(result.candidates[0].risk_flags, []);
  assert.equal(result.candidates[0].evidence.occurrence_count, 3);
  assert.match(result.candidates[0].confidence_details.summary, /明确场景/u);
});

test("suggestSessionHabitCandidates handles a realistic Codex transcript with a correction-style definition", () => {
  const userRegistryPath = createTempRegistryPath();
  const transcript = loadFixtureText("codex_session_realistic_correction_definition.txt");

  const result = suggestSessionHabitCandidates(transcript, {
    userRegistryPath,
    maxCandidates: 5
  });

  assert.equal(result.transcript_stats.message_count, 12);
  assert.equal(result.transcript_stats.user_message_count, 5);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].phrase, "收工啦");
  assert.equal(result.candidates[0].source_type, "explicit_definition");
  assert.equal(result.candidates[0].action, "suggest_add");
  assert.equal(result.candidates[0].confidence, 0.91);
  assert.deepEqual(result.candidates[0].risk_flags, []);
  assert.equal(result.candidates[0].evidence.occurrence_count, 2);
  assert.equal(result.candidates[0].evidence.correction_count, 1);
  assert.match(result.candidates[0].confidence_details.summary, /纠正式/u);
});

test("suggestSessionHabitCandidates prioritizes correction-style definitions over noisy repeated phrases in a realistic transcript", () => {
  const userRegistryPath = createTempRegistryPath();
  const transcript = loadFixtureText("codex_session_realistic_correction_with_noise.txt");

  const result = suggestSessionHabitCandidates(transcript, {
    userRegistryPath,
    maxCandidates: 5
  });

  assert.equal(result.transcript_stats.message_count, 14);
  assert.equal(result.transcript_stats.user_message_count, 6);
  assert.equal(result.candidates.length, 2);

  assert.equal(result.candidates[0].phrase, "收工啦");
  assert.equal(result.candidates[0].source_type, "explicit_definition");
  assert.equal(result.candidates[0].action, "suggest_add");
  assert.equal(result.candidates[0].confidence, 0.91);
  assert.deepEqual(result.candidates[0].risk_flags, []);
  assert.equal(result.candidates[0].evidence.occurrence_count, 2);
  assert.equal(result.candidates[0].evidence.correction_count, 1);

  assert.equal(result.candidates[1].phrase, "先那样");
  assert.equal(result.candidates[1].source_type, "repeated_phrase");
  assert.equal(result.candidates[1].action, "review_only");
  assert.deepEqual(result.candidates[1].risk_flags, ["single_thread_only", "missing_intent"]);
  assert.equal(result.candidates[1].evidence.occurrence_count, 2);
});

test("suggestSessionHabitCandidates can extract multiple correction-style definitions from one realistic transcript", () => {
  const userRegistryPath = createTempRegistryPath();
  const transcript = loadFixtureText("codex_session_realistic_double_correction.txt");

  const result = suggestSessionHabitCandidates(transcript, {
    userRegistryPath,
    maxCandidates: 5
  });

  assert.equal(result.transcript_stats.message_count, 13);
  assert.equal(result.transcript_stats.user_message_count, 5);
  assert.equal(result.candidates.length, 2);

  const closeSessionCandidate = result.candidates.find((item) => item.phrase === "收尾一下");
  const reviewCandidate = result.candidates.find((item) => item.phrase === "过一遍");

  assert.ok(closeSessionCandidate);
  assert.ok(reviewCandidate);

  assert.equal(closeSessionCandidate.source_type, "explicit_definition");
  assert.equal(closeSessionCandidate.action, "suggest_add");
  assert.equal(closeSessionCandidate.suggested_rule.normalized_intent, "close_session");
  assert.equal(closeSessionCandidate.confidence, 0.91);
  assert.equal(closeSessionCandidate.evidence.correction_count, 1);
  assert.deepEqual(closeSessionCandidate.risk_flags, []);

  assert.equal(reviewCandidate.source_type, "explicit_definition");
  assert.equal(reviewCandidate.action, "suggest_add");
  assert.equal(reviewCandidate.suggested_rule.normalized_intent, "review_acceptance");
  assert.equal(reviewCandidate.confidence, 0.91);
  assert.equal(reviewCandidate.evidence.correction_count, 1);
  assert.deepEqual(reviewCandidate.risk_flags, []);
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
  assert.equal(result.candidates[0].confidence_details.domain, "session_suggestion");
  assert.equal(result.candidates[0].confidence_details.source_type, "explicit_add_request");
  assert.equal(result.candidates[0].confidence_details.base_score, 0.87);
  assert.equal(result.candidates[0].confidence_details.final_score, 0.95);

  const definitionCandidate = result.candidates.find((item) => item.phrase === "收尾一下");
  assert.ok(definitionCandidate);
  assert.equal(definitionCandidate.suggested_rule.normalized_intent, "close_session");
  assert.equal(definitionCandidate.confidence_details.base_score, 0.84);
  assert.match(definitionCandidate.confidence_details.summary, /通用/u);
});

test("explicit add request confidence is boosted and capped at 0.98", () => {
  const userRegistryPath = createTempRegistryPath();
  const transcript = [
    "user: 新增习惯短句 phrase=收尾一下",
    "intent=close_session",
    "场景=session_close",
    "置信度=0.95"
  ].join("\n");

  const result = suggestSessionHabitCandidates(transcript, {
    userRegistryPath,
    maxCandidates: 5
  });

  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].source_type, "explicit_add_request");
  assert.equal(result.candidates[0].confidence, 0.98);
  assert.equal(result.candidates[0].suggested_rule.confidence, 0.95);
  assert.equal(result.candidates[0].confidence_details.final_score, 0.98);
  assert.equal(result.candidates[0].confidence_details.adjustments[1].type, "suggestion_cap");
  assert.equal(result.candidates[0].confidence_details.adjustments[1].applied, true);
});

test("explicit definitions score differently depending on scenario specificity", () => {
  const userRegistryPath = createTempRegistryPath();
  const transcript = [
    "user: 以后我说“收尾一下”就是 close_session",
    "user: 以后我说“复盘一下”就是 close_session 场景=session_close"
  ].join("\n");

  const result = suggestSessionHabitCandidates(transcript, {
    userRegistryPath,
    maxCandidates: 5
  });

  const generalCandidate = result.candidates.find((item) => item.phrase === "收尾一下");
  const scenarioCandidate = result.candidates.find((item) => item.phrase === "复盘一下");

  assert.ok(generalCandidate);
  assert.ok(scenarioCandidate);
  assert.equal(generalCandidate.confidence, 0.84);
  assert.deepEqual(generalCandidate.risk_flags, ["scenario_unspecified"]);
  assert.equal(generalCandidate.confidence_details.adjustments[0].type, "explicit_correction_bonus");
  assert.equal(generalCandidate.confidence_details.adjustments[0].applied, false);
  assert.equal(scenarioCandidate.confidence, 0.88);
  assert.deepEqual(scenarioCandidate.risk_flags, []);
  assert.equal(scenarioCandidate.confidence_details.adjustments[1].type, "scenario_specificity_bonus");
  assert.equal(scenarioCandidate.confidence_details.adjustments[1].delta, 0.04);
  assert.equal(scenarioCandidate.confidence_details.adjustments[1].applied, true);
});

test("suggestSessionHabitCandidates detects correction-style explicit definitions", () => {
  const userRegistryPath = createTempRegistryPath();
  const transcript = [
    "user: 我这里的“收工啦”不是结束线程，是 close_session",
    "assistant: 收到，我按 close_session 理解。",
    "user: 收工啦"
  ].join("\n");

  const result = suggestSessionHabitCandidates(transcript, {
    userRegistryPath,
    maxCandidates: 5
  });

  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].phrase, "收工啦");
  assert.equal(result.candidates[0].source_type, "explicit_definition");
  assert.equal(result.candidates[0].confidence, 0.87);
  assert.equal(result.candidates[0].evidence.correction_count, 1);
  assert.equal(result.candidates[0].suggested_rule.normalized_intent, "close_session");
  assert.equal(result.candidates[0].confidence_details.adjustments[0].type, "explicit_correction_bonus");
  assert.equal(result.candidates[0].confidence_details.adjustments[0].applied, true);
  assert.match(result.candidates[0].confidence_details.summary, /纠正式/u);
});

test("suggestSessionHabitCandidates detects correction-style definitions with 按 intent 理解 phrasing", () => {
  const userRegistryPath = createTempRegistryPath();
  const transcript = [
    "user: 别把“收工啦”理解成结束线程，按 close_session 理解",
    "assistant: 收到，我按 close_session 理解。",
    "user: 收工啦"
  ].join("\n");

  const result = suggestSessionHabitCandidates(transcript, {
    userRegistryPath,
    maxCandidates: 5
  });

  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].phrase, "收工啦");
  assert.equal(result.candidates[0].source_type, "explicit_definition");
  assert.equal(result.candidates[0].confidence, 0.87);
  assert.equal(result.candidates[0].evidence.correction_count, 1);
  assert.equal(result.candidates[0].suggested_rule.normalized_intent, "close_session");
});

test("suggestSessionHabitCandidates ignores leading discourse markers before a correction-style definition", () => {
  const userRegistryPath = createTempRegistryPath();
  const transcript = [
    "user: 另外，我这里的“过一遍”不是继续执行，是 review_acceptance 场景=reviewer",
    "assistant: 收到。",
    "user: 过一遍"
  ].join("\n");

  const result = suggestSessionHabitCandidates(transcript, {
    userRegistryPath,
    maxCandidates: 5
  });

  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].phrase, "过一遍");
  assert.equal(result.candidates[0].suggested_rule.normalized_intent, "review_acceptance");
  assert.deepEqual(result.candidates[0].suggested_rule.scenario_bias, ["reviewer"]);
});

test("correction-style definitions still require an explicit normalized intent token", () => {
  const userRegistryPath = createTempRegistryPath();
  const transcript = [
    "user: 我这里的“收工啦”不是结束线程，是帮我做个收尾",
    "assistant: 收到。"
  ].join("\n");

  const result = suggestSessionHabitCandidates(transcript, {
    userRegistryPath,
    maxCandidates: 5
  });

  assert.equal(result.candidates.length, 0);
});

test("按 intent 理解 phrasing still requires an explicit normalized intent token", () => {
  const userRegistryPath = createTempRegistryPath();
  const transcript = [
    "user: 别把“收工啦”理解成结束线程，按帮我做个收尾理解",
    "assistant: 收到。"
  ].join("\n");

  const result = suggestSessionHabitCandidates(transcript, {
    userRegistryPath,
    maxCandidates: 5
  });

  assert.equal(result.candidates.length, 0);
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
  assert.equal(result.candidates[0].confidence_details.base_score, 0.55);
  assert.equal(result.candidates[0].confidence_details.adjustments[0].type, "repetition_bonus");
});

test("repeated phrase confidence grows with repetition and then caps", () => {
  const userRegistryPath = createTempRegistryPath();
  const transcript = [
    "user: 收工啦",
    "assistant: 你是想结束当前线程吗？",
    "user: 收工啦",
    "user: 收工啦",
    "user: 收工啦",
    "user: 收工啦"
  ].join("\n");

  const result = suggestSessionHabitCandidates(transcript, {
    userRegistryPath,
    maxCandidates: 5
  });

  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].source_type, "repeated_phrase");
  assert.equal(result.candidates[0].confidence, 0.7);
  assert.equal(result.candidates[0].evidence.occurrence_count, 5);
  assert.equal(result.candidates[0].confidence_details.final_score, 0.7);
  assert.equal(result.candidates[0].confidence_details.adjustments[0].delta, 0.15);
});

test("suggestSessionHabitCandidates keeps noisy realistic repeated phrases as review-only candidates", () => {
  const userRegistryPath = createTempRegistryPath();
  const transcript = loadFixtureText("codex_session_realistic_review_only.txt");

  const result = suggestSessionHabitCandidates(transcript, {
    userRegistryPath,
    maxCandidates: 5
  });

  assert.equal(result.transcript_stats.message_count, 12);
  assert.equal(result.transcript_stats.user_message_count, 5);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].phrase, "收工啦");
  assert.equal(result.candidates[0].source_type, "repeated_phrase");
  assert.equal(result.candidates[0].action, "review_only");
  assert.equal(result.candidates[0].confidence, 0.6);
  assert.deepEqual(result.candidates[0].risk_flags, ["single_thread_only", "missing_intent"]);
  assert.equal(result.candidates[0].evidence.occurrence_count, 3);
  assert.match(result.candidates[0].confidence_details.summary, /值得复核/u);
});

test("suggestSessionHabitCandidates skips phrases that the user suppressed from suggestions", () => {
  const userRegistryPath = createTempRegistryPath();
  suppressSuggestionPhrase("收工啦", userRegistryPath);
  const transcript = [
    "user: 收工啦",
    "assistant: 你是想结束当前线程吗？",
    "user: 收工啦"
  ].join("\n");

  const result = suggestSessionHabitCandidates(transcript, {
    userRegistryPath,
    maxCandidates: 5
  });

  assert.equal(result.candidates.length, 0);
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
