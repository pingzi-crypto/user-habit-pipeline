"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPreActionDecision = buildPreActionDecision;
exports.interpretHabitForPreAction = interpretHabitForPreAction;
const interpreter_1 = require("./habit_core/interpreter");
function getMatchedPhrase(result) {
    return result.habit_matches[0]?.phrase ?? null;
}
function buildPreActionDecision(result) {
    const matchedPhrase = getMatchedPhrase(result);
    if (!matchedPhrase || result.normalized_intent === "unknown") {
        return {
            decision_basis: "no_match",
            next_action: "ask_clarifying_question",
            normalized_intent: result.normalized_intent,
            confidence: result.confidence,
            matched_phrase: null,
            should_ask_clarifying_question: true,
            disambiguation_hints: result.disambiguation_hints,
            preferred_terms: result.preferred_terms,
            reason: "No explicit habit rule matched the current message.",
            host_guidance: "Do not execute downstream actions yet. Ask the user to restate the target or define the shorthand first."
        };
    }
    if (result.should_ask_clarifying_question) {
        return {
            decision_basis: "clarification_required",
            next_action: "ask_clarifying_question",
            normalized_intent: result.normalized_intent,
            confidence: result.confidence,
            matched_phrase: matchedPhrase,
            should_ask_clarifying_question: true,
            disambiguation_hints: result.disambiguation_hints,
            preferred_terms: result.preferred_terms,
            reason: result.disambiguation_hints[0]
                || "Matched shorthand is still under-specified or ambiguous.",
            host_guidance: "Ask one short clarifying question before selecting a downstream tool or workflow."
        };
    }
    return {
        decision_basis: "clear_match",
        next_action: "proceed",
        normalized_intent: result.normalized_intent,
        confidence: result.confidence,
        matched_phrase: matchedPhrase,
        should_ask_clarifying_question: false,
        disambiguation_hints: result.disambiguation_hints,
        preferred_terms: result.preferred_terms,
        reason: "Matched explicit shorthand with enough confidence to continue.",
        host_guidance: "Proceed into downstream workflow selection using normalized_intent as a semantic hint, not as hidden execution."
    };
}
function interpretHabitForPreAction(input, options = {}) {
    const result = (0, interpreter_1.interpretHabit)(input, options);
    return {
        result,
        pre_action_decision: buildPreActionDecision(result)
    };
}
