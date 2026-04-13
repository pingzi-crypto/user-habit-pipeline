const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildPreActionDecision,
  interpretHabit,
  interpretHabitForPreAction
} = require("../src");

test("interpretHabitForPreAction asks for clarification on under-specified shorthand", () => {
  const output = interpretHabitForPreAction({
    message: "继续",
    scenario: "general"
  });

  assert.equal(output.result.normalized_intent, "continue_current_track");
  assert.equal(output.pre_action_decision.next_action, "ask_clarifying_question");
  assert.equal(output.pre_action_decision.decision_basis, "clarification_required");
  assert.equal(output.pre_action_decision.matched_phrase, "继续");
});

test("interpretHabitForPreAction proceeds on a clear explicit shorthand", () => {
  const output = interpretHabitForPreAction({
    message: "读取最新状态板",
    scenario: "status_board"
  });

  assert.equal(output.result.normalized_intent, "refresh_latest_board_state");
  assert.equal(output.pre_action_decision.next_action, "proceed");
  assert.equal(output.pre_action_decision.decision_basis, "clear_match");
  assert.equal(output.pre_action_decision.matched_phrase, "读取最新状态板");
});

test("buildPreActionDecision marks no-match cases as clarify-first", () => {
  const result = interpretHabit({
    message: "这句还没有定义",
    scenario: "general"
  });

  const decision = buildPreActionDecision(result);
  assert.equal(decision.next_action, "ask_clarifying_question");
  assert.equal(decision.decision_basis, "no_match");
  assert.equal(decision.matched_phrase, null);
});
