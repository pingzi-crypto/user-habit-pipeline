const {
  buildMemoryConflictDecision,
  interpretHabitForPreAction
} = require("user-habit-pipeline");

function evaluate(message, scenario, externalMemoryIntent, externalMemorySource) {
  const { result, pre_action_decision } = interpretHabitForPreAction({
    message,
    scenario
  });

  const memory_conflict_decision = buildMemoryConflictDecision(pre_action_decision, {
    normalized_intent: externalMemoryIntent,
    source_label: externalMemorySource,
    confidence: 0.88
  });

  return {
    message,
    scenario,
    pipeline_intent: result.normalized_intent,
    pipeline_next_action: pre_action_decision.next_action,
    external_memory_intent: externalMemoryIntent,
    memory_conflict_detected: memory_conflict_decision.memory_conflict_detected,
    final_next_action: memory_conflict_decision.final_next_action,
    recommended_resolution: memory_conflict_decision.recommended_resolution,
    reason: memory_conflict_decision.reason
  };
}

function main() {
  const cases = [
    evaluate("读取最新状态板", "status_board", "refresh_latest_board_state", "host_local_memory"),
    evaluate("读取最新状态板", "status_board", "close_session", "host_local_memory")
  ];

  process.stdout.write(`${JSON.stringify({
    integration_path: "memory-conflict-boundary",
    cases
  }, null, 2)}\n`);
}

main();
