"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateControlHubPolicyOverride = evaluateControlHubPolicyOverride;
const policy_override_mapper_1 = require("./policy_override_mapper");
const policy_override_questions_1 = require("./policy_override_questions");
const policy_override_whitelist_1 = require("./policy_override_whitelist");
function evaluateControlHubPolicyOverride(input) {
    const matches = (0, policy_override_whitelist_1.findWhitelistMatches)(input.raw_user_text);
    if (matches.length === 0) {
        return createNoMatchResult();
    }
    if (matches.length > 1) {
        return {
            match_status: "ambiguous",
            phrase_type: "policy_override",
            interpreted_intent: null,
            scope: "unknown",
            override_mode: "unknown",
            confidence: 0.4,
            should_ask_clarifying_question: true,
            clarifying_question: "这句里命中了多个 policy override 短句，你是想表达哪一种覆盖规则？",
            suggested_preference_write: null,
            matched_phrase: null
        };
    }
    const entry = matches[0];
    const scope = (0, policy_override_mapper_1.inferPolicyOverrideScope)(input.raw_user_text, entry);
    const overrideMode = (0, policy_override_mapper_1.inferPolicyOverrideMode)(input.raw_user_text, entry);
    const hasPreferenceConflict = detectPreferenceConflict(input, entry);
    const shouldClarify = hasPreferenceConflict ||
        (entry.require_scope_clarification && scope === "unknown") ||
        (entry.require_mode_clarification && overrideMode === "unknown");
    const suggestedPreferenceWrite = shouldClarify
        ? null
        : (0, policy_override_mapper_1.buildSuggestedPreferenceWrite)(entry, scope, overrideMode);
    return {
        match_status: shouldClarify ? "ambiguous" : "matched",
        phrase_type: "policy_override",
        interpreted_intent: entry.interpreted_intent,
        scope,
        override_mode: overrideMode,
        confidence: scorePolicyOverrideConfidence(entry, shouldClarify, hasPreferenceConflict),
        should_ask_clarifying_question: shouldClarify,
        clarifying_question: shouldClarify
            ? (0, policy_override_questions_1.pickClarifyingQuestion)({
                entry,
                scope,
                overrideMode,
                hasPreferenceConflict
            })
            : null,
        suggested_preference_write: suggestedPreferenceWrite,
        matched_phrase: entry.phrase
    };
}
function createNoMatchResult() {
    return {
        match_status: "no_match",
        phrase_type: "policy_override",
        interpreted_intent: null,
        scope: "unknown",
        override_mode: "unknown",
        confidence: 0,
        should_ask_clarifying_question: false,
        clarifying_question: null,
        suggested_preference_write: null,
        matched_phrase: null
    };
}
function detectPreferenceConflict(input, entry) {
    const combinedText = JSON.stringify({
        current_action_candidate: input.current_action_candidate || "",
        confirmed_preferences: input.confirmed_preferences || "",
        project_policy_summary: input.project_policy_summary || ""
    }).toLowerCase();
    const contradictionHints = getContradictionHints(entry.interpreted_intent);
    return contradictionHints.some((hint) => combinedText.includes(hint));
}
function getContradictionHints(interpretedIntent) {
    switch (interpretedIntent) {
        case "disable_auto_push_once":
            return ["always_auto_push", "auto_push_required", "must_auto_push"];
        case "route_risk_items_to_manual_review":
            return ["risk_items_auto_approve", "always_auto_approve_risk"];
        case "allow_policy_exception_once":
            return ["never_allow_exception", "exceptions_forbidden"];
        case "reuse_previous_policy_default":
        case "reuse_previous_policy":
            return ["use_new_policy_default", "new_policy_required"];
        case "approve_this_kind":
            return ["never_auto_approve_kind", "kind_requires_manual_review"];
        case "defer_current_item_without_execution":
            return ["must_execute_now", "no_deferral_allowed"];
        default:
            return [];
    }
}
function scorePolicyOverrideConfidence(entry, shouldClarify, hasPreferenceConflict) {
    let confidence = entry.confidence;
    if (shouldClarify) {
        confidence -= 0.18;
    }
    if (hasPreferenceConflict) {
        confidence -= 0.08;
    }
    return Math.max(0, Math.min(1, Number(confidence.toFixed(2))));
}
