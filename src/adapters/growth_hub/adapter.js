"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toGrowthHubHint = toGrowthHubHint;
function toGrowthHubHint(habitOutput) {
    return {
        hint_intent: habitOutput.normalized_intent,
        hint_confidence: habitOutput.confidence,
        hint_requires_confirmation: habitOutput.should_ask_clarifying_question,
        hint_terms: Array.isArray(habitOutput.preferred_terms) ? habitOutput.preferred_terms : [],
        hint_notes: Array.isArray(habitOutput.notes) ? habitOutput.notes : []
    };
}
