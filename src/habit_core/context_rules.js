"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeText = normalizeText;
exports.hasRecentContextSupport = hasRecentContextSupport;
const CONTEXT_SUPPORT = {
    continue_current_track: [
        "评审",
        "review",
        "reviewer",
        "executor",
        "执行",
        "当前",
        "current",
        "track"
    ],
    move_to_next_item: [
        "状态板",
        "board",
        "item",
        "queue",
        "队列",
        "任务",
        "active"
    ],
    close_session: [
        "总结",
        "session",
        "收尾",
        "wrap",
        "close",
        "关闭"
    ]
};
function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
}
function hasRecentContextSupport(rule, recentContext) {
    if (!Array.isArray(recentContext) || recentContext.length === 0) {
        return false;
    }
    const keywords = CONTEXT_SUPPORT[rule.normalized_intent] || [];
    if (keywords.length === 0) {
        return false;
    }
    const normalizedContext = recentContext
        .map((item) => normalizeText(item))
        .filter(Boolean)
        .join(" ");
    return keywords.some((keyword) => normalizedContext.includes(normalizeText(keyword)));
}
