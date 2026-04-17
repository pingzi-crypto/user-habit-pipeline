const { evaluateControlHubPolicyOverride } = require("../../src/adapters/control_hub/policy_override.js");

const result = evaluateControlHubPolicyOverride({
  raw_user_text: "风险类都给我看",
  context_type: "policy_override",
  current_action_candidate: "auto_approve_risk_item",
  confirmed_preferences: [
    "finance project keeps low-risk tasks on auto-approve",
    "security issues always require manual review"
  ],
  project_policy_summary: "Current project policy is still being migrated."
});

console.log(JSON.stringify(result, null, 2));
