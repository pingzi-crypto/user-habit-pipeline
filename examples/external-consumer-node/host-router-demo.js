const { interpretHabitForPreAction } = require("user-habit-pipeline");

function chooseHostRoute(preActionDecision) {
  if (preActionDecision.next_action === "ask_clarifying_question") {
    return {
      host_action: "ask_clarifying_question",
      target: null,
      prompt: preActionDecision.disambiguation_hints[0]
        || "请补充你想继续的具体目标。"
    };
  }

  const routeMap = {
    continue_current_track: "resume-active-track",
    refresh_latest_board_state: "status-board.refresh",
    close_session: "session.close"
  };

  return {
    host_action: "route_to_downstream_handler",
    target: routeMap[preActionDecision.normalized_intent] || "generic.intent-handler",
    prompt: null
  };
}

function evaluateCase(input) {
  const { result, pre_action_decision } = interpretHabitForPreAction(input);
  const route = chooseHostRoute(pre_action_decision);

  return {
    message: input.message,
    scenario: input.scenario,
    normalized_intent: result.normalized_intent,
    confidence: result.confidence,
    next_action: pre_action_decision.next_action,
    decision_basis: pre_action_decision.decision_basis,
    host_route: route
  };
}

function main() {
  const cases = [
    evaluateCase({
      message: "继续",
      scenario: "general",
      recent_context: []
    }),
    evaluateCase({
      message: "读取最新状态板",
      scenario: "status_board",
      recent_context: ["先同步看下最新状态"]
    }),
    evaluateCase({
      message: "收口",
      scenario: "session_close",
      recent_context: ["这轮整理差不多了"]
    })
  ];

  const roiMetrics = {
    ambiguous_action_prevented_count: cases.filter((item) => item.host_route.host_action === "ask_clarifying_question").length,
    clarification_triggered_count: cases.filter((item) => item.decision_basis === "clarification_required" || item.decision_basis === "no_match").length,
    clear_action_proceed_count: cases.filter((item) => item.next_action === "proceed").length,
    downstream_route_selected_count: cases.filter((item) => item.host_route.host_action === "route_to_downstream_handler").length
  };

  process.stdout.write(`${JSON.stringify({
    integration_path: "host-router",
    cases,
    roi_metrics: roiMetrics
  }, null, 2)}\n`);
}

main();
