"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONTROL_HUB_POLICY_OVERRIDE_WHITELIST = void 0;
exports.findWhitelistMatches = findWhitelistMatches;
exports.normalizePolicyOverrideText = normalizePolicyOverrideText;
exports.CONTROL_HUB_POLICY_OVERRIDE_WHITELIST = [
    {
        phrase: "这次例外",
        variants: ["这次例外", "本次例外"],
        interpreted_intent: "allow_policy_exception_once",
        confidence: 0.96,
        default_scope: "current_item",
        default_override_mode: "one_time",
        require_scope_clarification: false,
        require_mode_clarification: false,
        allow_durable_write: false
    },
    {
        phrase: "默认按之前口径",
        variants: ["默认按之前口径", "默认按之前规则", "以后按之前口径"],
        interpreted_intent: "reuse_previous_policy_default",
        confidence: 0.9,
        default_scope: "unknown",
        default_override_mode: "durable_candidate",
        require_scope_clarification: true,
        require_mode_clarification: false,
        allow_durable_write: true
    },
    {
        phrase: "按老规矩",
        variants: ["按老规矩", "照老规矩", "还是老规矩"],
        interpreted_intent: "reuse_previous_policy",
        confidence: 0.84,
        default_scope: "unknown",
        default_override_mode: "unknown",
        require_scope_clarification: true,
        require_mode_clarification: true,
        allow_durable_write: true
    },
    {
        phrase: "这种先过",
        variants: ["这种先过", "这类先过", "这种先通过"],
        interpreted_intent: "approve_this_kind",
        confidence: 0.82,
        default_scope: "unknown",
        default_override_mode: "unknown",
        require_scope_clarification: true,
        require_mode_clarification: true,
        allow_durable_write: true
    },
    {
        phrase: "风险类都给我看",
        variants: ["风险类都给我看", "风险类都给我过目", "风险项都给我看"],
        interpreted_intent: "route_risk_items_to_manual_review",
        confidence: 0.91,
        default_scope: "unknown",
        default_override_mode: "durable_candidate",
        require_scope_clarification: true,
        require_mode_clarification: false,
        allow_durable_write: true
    },
    {
        phrase: "这次别自动推",
        variants: ["这次别自动推", "这次不要自动推", "本次别自动推"],
        interpreted_intent: "disable_auto_push_once",
        confidence: 0.96,
        default_scope: "current_item",
        default_override_mode: "one_time",
        require_scope_clarification: false,
        require_mode_clarification: false,
        allow_durable_write: false
    },
    {
        phrase: "先挂着",
        variants: ["先挂着", "先放着", "先别动"],
        interpreted_intent: "defer_current_item_without_execution",
        confidence: 0.8,
        default_scope: "current_item",
        default_override_mode: "one_time",
        require_scope_clarification: false,
        require_mode_clarification: false,
        allow_durable_write: false
    }
];
function findWhitelistMatches(rawUserText) {
    const normalized = normalizePolicyOverrideText(rawUserText);
    return exports.CONTROL_HUB_POLICY_OVERRIDE_WHITELIST.filter((entry) => entry.variants.some((variant) => normalized.includes(normalizePolicyOverrideText(variant))));
}
function normalizePolicyOverrideText(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}
