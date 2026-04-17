import type { PolicyOverrideGoldsetCase } from "./policy_override_types";

export const CONTROL_HUB_POLICY_OVERRIDE_GOLDSET: PolicyOverrideGoldsetCase[] = [
  {
    phrase: "这次例外",
    context_type: "policy_override",
    current_context: "系统准备按默认规则拒绝当前项",
    expected_intent: "allow_policy_exception_once",
    scope: "current_item",
    override_mode: "one_time",
    durable_write_allowed: false,
    must_clarify_when_conflict: true,
    default_clarify: false,
    notes: "一次性 override，不应被误写成长期规则。"
  },
  {
    phrase: "默认按之前口径",
    context_type: "policy_override",
    current_context: "系统准备按当前项目新规则自动推送审批结果",
    expected_intent: "reuse_previous_policy_default",
    scope: "unknown",
    override_mode: "durable_candidate",
    durable_write_allowed: true,
    must_clarify_when_conflict: true,
    default_clarify: true,
    notes: "需要先澄清作用域，避免 project/global 混淆。"
  },
  {
    phrase: "按老规矩",
    context_type: "policy_override",
    current_context: "用户临时口头覆盖默认审批策略",
    expected_intent: "reuse_previous_policy",
    scope: "unknown",
    override_mode: "unknown",
    durable_write_allowed: true,
    must_clarify_when_conflict: true,
    default_clarify: true,
    notes: "容易把当前一次性处理和长期偏好混淆。"
  },
  {
    phrase: "风险类都给我看",
    context_type: "policy_override",
    current_context: "系统准备继续自动审批低风险任务",
    expected_intent: "route_risk_items_to_manual_review",
    scope: "unknown",
    override_mode: "durable_candidate",
    durable_write_allowed: true,
    must_clarify_when_conflict: true,
    default_clarify: true,
    notes: "需要确认是当前项目还是全局默认口径。"
  },
  {
    phrase: "这次别自动推",
    context_type: "policy_override",
    current_context: "系统准备自动推送当前审批结果",
    expected_intent: "disable_auto_push_once",
    scope: "current_item",
    override_mode: "one_time",
    durable_write_allowed: false,
    must_clarify_when_conflict: true,
    default_clarify: false,
    notes: "一次性禁止自动推送。"
  }
];
