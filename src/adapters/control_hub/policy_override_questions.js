"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScopeClarifyingQuestion = getScopeClarifyingQuestion;
exports.getModeClarifyingQuestion = getModeClarifyingQuestion;
exports.getCombinedClarifyingQuestion = getCombinedClarifyingQuestion;
exports.getConflictClarifyingQuestion = getConflictClarifyingQuestion;
exports.pickClarifyingQuestion = pickClarifyingQuestion;
function getScopeClarifyingQuestion(entry) {
    return `你说的“${entry.phrase}”是只针对当前这一条，还是当前项目 / 全局后的默认规则？`;
}
function getModeClarifyingQuestion(entry) {
    return `你说的“${entry.phrase}”是这次临时生效，还是想沉淀成以后默认规则？`;
}
function getCombinedClarifyingQuestion(entry) {
    return `你说的“${entry.phrase}”是当前这一条临时处理，还是要作为当前项目 / 全局的默认规则？`;
}
function getConflictClarifyingQuestion(entry) {
    return `“${entry.phrase}”和现有偏好可能冲突，要按这次临时覆盖，还是保持原默认规则？`;
}
function pickClarifyingQuestion(args) {
    const { entry, scope, overrideMode, hasPreferenceConflict } = args;
    if (hasPreferenceConflict) {
        return getConflictClarifyingQuestion(entry);
    }
    if (scope === "unknown" && overrideMode === "unknown") {
        return getCombinedClarifyingQuestion(entry);
    }
    if (scope === "unknown") {
        return getScopeClarifyingQuestion(entry);
    }
    if (overrideMode === "unknown") {
        return getModeClarifyingQuestion(entry);
    }
    return null;
}
