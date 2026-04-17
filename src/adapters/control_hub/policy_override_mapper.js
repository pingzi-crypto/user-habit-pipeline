"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferPolicyOverrideScope = inferPolicyOverrideScope;
exports.inferPolicyOverrideMode = inferPolicyOverrideMode;
exports.buildSuggestedPreferenceWrite = buildSuggestedPreferenceWrite;
const CURRENT_ITEM_HINTS = ["这次", "本次", "当前", "这一条", "这个任务"];
const CURRENT_PROJECT_HINTS = ["当前项目", "本项目", "这个项目", "项目里"];
const GLOBAL_HINTS = ["全局", "所有项目", "以后都", "默认都", "一直", "统一"];
const ONE_TIME_HINTS = ["这次", "本次", "临时", "先"];
const DURABLE_HINTS = ["默认", "以后", "都", "今后", "长期", "统一"];
function inferPolicyOverrideScope(rawUserText, entry) {
    if (containsHint(rawUserText, GLOBAL_HINTS)) {
        return "global";
    }
    if (containsHint(rawUserText, CURRENT_PROJECT_HINTS)) {
        return "current_project";
    }
    if (containsHint(rawUserText, CURRENT_ITEM_HINTS)) {
        return "current_item";
    }
    return entry.default_scope;
}
function inferPolicyOverrideMode(rawUserText, entry) {
    if (containsHint(rawUserText, DURABLE_HINTS)) {
        return "durable_candidate";
    }
    if (containsHint(rawUserText, ONE_TIME_HINTS)) {
        return "one_time";
    }
    return entry.default_override_mode;
}
function buildSuggestedPreferenceWrite(entry, scope, overrideMode) {
    if (!entry.allow_durable_write || overrideMode !== "durable_candidate") {
        return null;
    }
    if (scope !== "current_project" && scope !== "global") {
        return null;
    }
    return {
        intent: entry.interpreted_intent,
        scope,
        source_phrase: entry.phrase
    };
}
function containsHint(rawUserText, hints) {
    const normalized = String(rawUserText || "").trim();
    return hints.some((hint) => normalized.includes(hint));
}
