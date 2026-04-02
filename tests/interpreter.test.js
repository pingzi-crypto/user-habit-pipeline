const test = require("node:test");
const assert = require("node:assert/strict");
const { interpretHabit } = require("../src");
const {
  AMBIGUITY_GAP,
  CONTEXT_BONUS,
  DEFAULT_CLARIFY_BELOW,
  SCENARIO_BONUS,
  scoreCandidate
} = require("../src/habit_core/scoring");

test("returns the full output contract for unknown input", () => {
  const result = interpretHabit({ message: "去处理一下" }, { includeUserRegistry: false });

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
  const result = interpretHabit(
    { message: "请帮我更新入板", scenario: "status_board" },
    { includeUserRegistry: false }
  );

  assert.equal(result.normalized_intent, "add_or_update_board_item");
  assert.equal(result.habit_matches[0].phrase, "更新入板");
  assert.equal(result.habit_matches[1].phrase, "入板");
});

test("prefers 继续评审 over 继续 when both substring candidates match", () => {
  const result = interpretHabit(
    { message: "请继续评审这个任务", scenario: "reviewer" },
    { includeUserRegistry: false }
  );

  assert.equal(result.normalized_intent, "continue_current_track");
  assert.equal(result.habit_matches[0].phrase, "继续评审");
  assert.equal(result.should_ask_clarifying_question, false);
});

test("recent context can support an under-specified phrase without creating a new intent", () => {
  const result = interpretHabit({
    message: "继续",
    scenario: "general",
    recent_context: ["继续当前评审", "review the next issue after this"]
  }, { includeUserRegistry: false });

  assert.equal(result.normalized_intent, "continue_current_track");
  assert.ok(result.confidence > 0.7);
  assert.equal(result.habit_matches.length, 1);
});

test("scoreCandidate applies scenario bonus and clamps to 1.00", () => {
  const scored = scoreCandidate({
    rule: {
      phrase: "收尾一下",
      normalized_intent: "close_session",
      scenario_bias: ["session_close"],
      confidence: 0.97
    },
    matchType: "exact"
  }, {
    message: "收尾一下",
    scenario: "session_close"
  });

  assert.equal(SCENARIO_BONUS, 0.05);
  assert.equal(scored.score, 1);
  assert.match(scored.reasons.join(" "), /Scenario bias matched/u);
});

test("rule-specific clarify threshold can be cleared by scenario and context bonuses", () => {
  const result = interpretHabit({
    message: "继续",
    scenario: "reviewer",
    recent_context: ["current review queue", "继续当前评审"]
  }, {
    includeUserRegistry: false,
    rules: [
      {
        phrase: "继续",
        normalized_intent: "continue_current_track",
        scenario_bias: ["reviewer"],
        confidence: 0.68,
        clarify_below: 0.74
      }
    ]
  });

  assert.equal(CONTEXT_BONUS, 0.05);
  assert.equal(DEFAULT_CLARIFY_BELOW, 0.75);
  assert.equal(result.confidence, 0.78);
  assert.equal(result.should_ask_clarifying_question, false);
});

test("ambiguity gap asks below threshold and does not ask above threshold", () => {
  const ambiguousResult = interpretHabit({
    message: "收尾一下"
  }, {
    includeUserRegistry: false,
    rules: [
      {
        phrase: "收尾一下",
        normalized_intent: "close_session",
        scenario_bias: ["general"],
        confidence: 0.83
      },
      {
        phrase: "收尾一下",
        normalized_intent: "summarize_session",
        scenario_bias: ["general"],
        confidence: 0.76
      }
    ]
  });

  const separatedResult = interpretHabit({
    message: "收尾一下"
  }, {
    includeUserRegistry: false,
    rules: [
      {
        phrase: "收尾一下",
        normalized_intent: "close_session",
        scenario_bias: ["general"],
        confidence: 0.83
      },
      {
        phrase: "收尾一下",
        normalized_intent: "summarize_session",
        scenario_bias: ["general"],
        confidence: 0.74
      }
    ]
  });

  assert.equal(AMBIGUITY_GAP, 0.08);
  assert.equal(ambiguousResult.should_ask_clarifying_question, true);
  assert.equal(separatedResult.should_ask_clarifying_question, false);
});
