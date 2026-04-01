/**
 * @typedef {Object} HabitInput
 * @property {string} message
 * @property {string[]=} recent_context
 * @property {string | null=} scenario
 */

/**
 * @typedef {Object} HabitRule
 * @property {string} phrase
 * @property {string} normalized_intent
 * @property {string[]} scenario_bias
 * @property {number} confidence
 * @property {"exact" | "substring"=} match_type
 * @property {string[]=} preferred_terms
 * @property {string[]=} disambiguation_hints
 * @property {string[]=} notes
 * @property {number=} clarify_below
 */

/**
 * @typedef {Object} HabitMatch
 * @property {string} phrase
 * @property {string} meaning
 * @property {number} confidence
 */

/**
 * @typedef {Object} HabitOutput
 * @property {string} normalized_intent
 * @property {HabitMatch[]} habit_matches
 * @property {string[]} disambiguation_hints
 * @property {number} confidence
 * @property {boolean} should_ask_clarifying_question
 * @property {string[]} preferred_terms
 * @property {string[]} notes
 */

module.exports = {};
