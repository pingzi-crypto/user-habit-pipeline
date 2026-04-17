const { evaluateControlHubPolicyOverride } = require("../../src/adapters/control_hub/policy_override.js");

function chooseHostDecision(adapterResult) {
  if (adapterResult.match_status === "no_match") {
    return {
      host_action: "ignore_adapter",
      reason: "no_whitelist_hit"
    };
  }

  if (adapterResult.should_ask_clarifying_question) {
    return {
      host_action: "ask_clarifying_question",
      reason: "clarify_first_boundary",
      prompt: adapterResult.clarifying_question
    };
  }

  return {
    host_action: "apply_interpretation",
    reason: "clear_narrow_override",
    apply_as: {
      interpreted_intent: adapterResult.interpreted_intent,
      scope: adapterResult.scope,
      override_mode: adapterResult.override_mode
    },
    suggested_preference_write: adapterResult.suggested_preference_write
  };
}

function evaluateCase(input) {
  const adapterResult = evaluateControlHubPolicyOverride(input);
  const hostDecision = chooseHostDecision(adapterResult);

  return {
    raw_user_text: input.raw_user_text,
    context_type: input.context_type,
    adapter_result: adapterResult,
    host_decision: hostDecision
  };
}

function main() {
  const cases = [
    evaluateCase({
      raw_user_text: "这次别自动推",
      context_type: "policy_override",
      current_action_candidate: "push_approval_result"
    }),
    evaluateCase({
      raw_user_text: "按老规矩",
      context_type: "policy_override",
      current_action_candidate: "approve_current_item"
    }),
    evaluateCase({
      raw_user_text: "这个你先记一下，不用现在改策略",
      context_type: "policy_override",
      current_action_candidate: "no_policy_change"
    })
  ];

  const summary = {
    apply_count: cases.filter((item) => item.host_decision.host_action === "apply_interpretation").length,
    clarify_count: cases.filter((item) => item.host_decision.host_action === "ask_clarifying_question").length,
    ignore_count: cases.filter((item) => item.host_decision.host_action === "ignore_adapter").length
  };

  process.stdout.write(`${JSON.stringify({
    integration_path: "control-hub-host-contract",
    contract_boundary: {
      adapter_is_optional: true,
      host_owns_execution: true,
      host_owns_durable_write_confirmation: true,
      adapter_not_in_default_core_path: true
    },
    cases,
    summary
  }, null, 2)}\n`);
}

main();
