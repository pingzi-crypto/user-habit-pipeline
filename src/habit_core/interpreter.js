const fs = require("node:fs");
const path = require("node:path");
const { normalizeText } = require("./context_rules");
const { scoreCandidate, shouldAskClarifyingQuestion } = require("./scoring");
const { validateHabitRules } = require("../habit_registry/validate_registry");
const { loadMergedHabits, USER_REGISTRY_PATH } = require("../habit_registry/user_registry");

const DEFAULT_REGISTRY_PATH = path.join(__dirname, "..", "habit_registry", "default_habits.json");

let cachedRules = null;

function loadHabitsFromFile(registryPath) {
  const raw = fs.readFileSync(registryPath, "utf8");
  return validateHabitRules(JSON.parse(raw));
}

function loadDefaultHabits() {
  if (!cachedRules) {
    cachedRules = loadHabitsFromFile(DEFAULT_REGISTRY_PATH);
  }

  return cachedRules;
}

function createUnknownOutput() {
  return {
    normalized_intent: "unknown",
    habit_matches: [],
    disambiguation_hints: [],
    confidence: 0,
    should_ask_clarifying_question: true,
    preferred_terms: [],
    notes: ["No habit rule matched the current message."]
  };
}

function compareCandidates(left, right) {
  const matchTypeWeight = { exact: 2, substring: 1 };
  const leftWeight = matchTypeWeight[left.matchType] || 0;
  const rightWeight = matchTypeWeight[right.matchType] || 0;

  if (leftWeight !== rightWeight) {
    return rightWeight - leftWeight;
  }

  if (left.rule.phrase.length !== right.rule.phrase.length) {
    return right.rule.phrase.length - left.rule.phrase.length;
  }

  return right.rule.confidence - left.rule.confidence;
}

function findCandidateRules(message, rules) {
  const normalizedMessage = normalizeText(message);
  if (!normalizedMessage) {
    return [];
  }

  const exactMatches = rules
    .filter((rule) => normalizeText(rule.phrase) === normalizedMessage)
    .map((rule) => ({ rule, matchType: "exact" }));

  if (exactMatches.length > 0) {
    return exactMatches.sort(compareCandidates);
  }

  return rules
    .filter((rule) => normalizedMessage.includes(normalizeText(rule.phrase)))
    .map((rule) => ({ rule, matchType: "substring" }))
    .sort(compareCandidates);
}

function buildDisambiguationHints(topCandidate, shouldClarify) {
  if (!topCandidate || !shouldClarify) {
    return [];
  }

  const hints = Array.isArray(topCandidate.rule.disambiguation_hints)
    ? topCandidate.rule.disambiguation_hints
    : [];

  if (hints.length > 0) {
    return hints;
  }

  return ["Need a clearer target before turning the shorthand into a downstream hint."];
}

function buildNotes(topCandidate) {
  if (!topCandidate) {
    return ["No habit rule matched the current message."];
  }

  const notes = Array.isArray(topCandidate.rule.notes) ? [...topCandidate.rule.notes] : [];
  return [...notes, ...topCandidate.reasons];
}

/**
 * @param {import("./types").HabitInput} input
 * @param {{ rules?: import("./types").HabitRule[], registryPath?: string, userRegistryPath?: string, includeUserRegistry?: boolean }=} options
 * @returns {import("./types").HabitOutput}
 */
function interpretHabit(input, options = {}) {
  const message = typeof input.message === "string" ? input.message.trim() : "";
  if (!message) {
    return createUnknownOutput();
  }

  const rules = Array.isArray(options.rules)
    ? validateHabitRules(options.rules)
    : options.registryPath
      ? loadHabitsFromFile(options.registryPath)
      : options.includeUserRegistry === false
        ? loadDefaultHabits()
        : loadMergedHabits(loadDefaultHabits(), options.userRegistryPath || USER_REGISTRY_PATH);
  const candidates = findCandidateRules(message, rules).map((candidate) => scoreCandidate(candidate, input));
  const [topCandidate, secondCandidate] = candidates;

  if (!topCandidate) {
    return createUnknownOutput();
  }

  const shouldClarify = shouldAskClarifyingQuestion(topCandidate, secondCandidate);

  return {
    normalized_intent: topCandidate.rule.normalized_intent,
    habit_matches: candidates.map((candidate) => ({
      phrase: candidate.rule.phrase,
      meaning: candidate.rule.normalized_intent,
      confidence: candidate.score
    })),
    disambiguation_hints: buildDisambiguationHints(topCandidate, shouldClarify),
    confidence: topCandidate.score,
    should_ask_clarifying_question: shouldClarify,
    preferred_terms: Array.isArray(topCandidate.rule.preferred_terms)
      ? topCandidate.rule.preferred_terms
      : [],
    notes: buildNotes(topCandidate)
  };
}

module.exports = {
  DEFAULT_REGISTRY_PATH,
  createUnknownOutput,
  findCandidateRules,
  interpretHabit,
  loadHabitsFromFile,
  loadDefaultHabits
};
