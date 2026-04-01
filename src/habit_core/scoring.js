const { hasRecentContextSupport } = require("./context_rules");

const SCENARIO_BONUS = 0.05;
const CONTEXT_BONUS = 0.05;
const DEFAULT_CLARIFY_BELOW = 0.75;
const AMBIGUITY_GAP = 0.08;

function clampConfidence(value) {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

function scoreCandidate(candidate, input) {
  const { rule } = candidate;
  let score = rule.confidence;
  const reasons = [];

  if (candidate.matchType === "exact") {
    reasons.push("Exact phrase match.");
  } else {
    reasons.push("Substring phrase match.");
  }

  const normalizedScenario = String(input.scenario || "").trim().toLowerCase();
  const scenarioBias = Array.isArray(rule.scenario_bias) ? rule.scenario_bias : [];

  if (normalizedScenario && scenarioBias.map((value) => String(value).toLowerCase()).includes(normalizedScenario)) {
    score += SCENARIO_BONUS;
    reasons.push(`Scenario bias matched: ${input.scenario}.`);
  }

  const isUnderSpecified = typeof rule.clarify_below === "number";
  if (isUnderSpecified && hasRecentContextSupport(rule, input.recent_context)) {
    score += CONTEXT_BONUS;
    reasons.push("Recent context supported the interpretation.");
  }

  return {
    ...candidate,
    score: clampConfidence(score),
    reasons
  };
}

function shouldAskClarifyingQuestion(topCandidate, secondCandidate) {
  if (!topCandidate) {
    return true;
  }

  const threshold = typeof topCandidate.rule.clarify_below === "number"
    ? topCandidate.rule.clarify_below
    : DEFAULT_CLARIFY_BELOW;

  if (topCandidate.score < threshold) {
    return true;
  }

  if (
    secondCandidate &&
    topCandidate.rule.normalized_intent !== secondCandidate.rule.normalized_intent &&
    topCandidate.score - secondCandidate.score < AMBIGUITY_GAP
  ) {
    return true;
  }

  return false;
}

module.exports = {
  AMBIGUITY_GAP,
  CONTEXT_BONUS,
  DEFAULT_CLARIFY_BELOW,
  SCENARIO_BONUS,
  scoreCandidate,
  shouldAskClarifyingQuestion
};
