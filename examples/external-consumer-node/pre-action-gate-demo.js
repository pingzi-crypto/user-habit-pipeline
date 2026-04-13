const { interpretHabitForPreAction } = require("user-habit-pipeline");

function evaluate(message, scenario, recentContext) {
  const { result, pre_action_decision } = interpretHabitForPreAction({
    message,
    scenario,
    recent_context: recentContext
  });

  return {
    message,
    scenario,
    normalized_intent: result.normalized_intent,
    confidence: result.confidence,
    next_action: pre_action_decision.next_action,
    decision_basis: pre_action_decision.decision_basis,
    matched_phrase: pre_action_decision.matched_phrase,
    reason: pre_action_decision.reason
  };
}

function main() {
  const cases = [
    evaluate("继续", "general", []),
    evaluate("读取最新状态板", "status_board", ["先看下最新状态"])
  ];

  process.stdout.write(`${JSON.stringify({
    integration_path: "pre-action-gate",
    cases
  }, null, 2)}\n`);
}

main();
