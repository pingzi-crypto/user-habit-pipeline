function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateRule(rule, index) {
  const prefix = `Invalid registry rule at index ${index}`;

  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    throw new Error(`${prefix}: rule must be an object.`);
  }

  if (typeof rule.phrase !== "string" || rule.phrase.trim() === "") {
    throw new Error(`${prefix}: "phrase" must be a non-empty string.`);
  }

  if (typeof rule.normalized_intent !== "string" || rule.normalized_intent.trim() === "") {
    throw new Error(`${prefix}: "normalized_intent" must be a non-empty string.`);
  }

  if (!isStringArray(rule.scenario_bias)) {
    throw new Error(`${prefix}: "scenario_bias" must be an array of strings.`);
  }

  if (typeof rule.confidence !== "number" || Number.isNaN(rule.confidence) || rule.confidence < 0 || rule.confidence > 1) {
    throw new Error(`${prefix}: "confidence" must be a number between 0 and 1.`);
  }

  if (
    Object.prototype.hasOwnProperty.call(rule, "match_type") &&
    rule.match_type !== "exact" &&
    rule.match_type !== "substring"
  ) {
    throw new Error(`${prefix}: "match_type" must be "exact" or "substring" when provided.`);
  }

  if (
    Object.prototype.hasOwnProperty.call(rule, "preferred_terms") &&
    !isStringArray(rule.preferred_terms)
  ) {
    throw new Error(`${prefix}: "preferred_terms" must be an array of strings when provided.`);
  }

  if (
    Object.prototype.hasOwnProperty.call(rule, "disambiguation_hints") &&
    !isStringArray(rule.disambiguation_hints)
  ) {
    throw new Error(`${prefix}: "disambiguation_hints" must be an array of strings when provided.`);
  }

  if (
    Object.prototype.hasOwnProperty.call(rule, "notes") &&
    !isStringArray(rule.notes)
  ) {
    throw new Error(`${prefix}: "notes" must be an array of strings when provided.`);
  }

  if (
    Object.prototype.hasOwnProperty.call(rule, "clarify_below") &&
    (
      typeof rule.clarify_below !== "number" ||
      Number.isNaN(rule.clarify_below) ||
      rule.clarify_below < 0 ||
      rule.clarify_below > 1
    )
  ) {
    throw new Error(`${prefix}: "clarify_below" must be a number between 0 and 1 when provided.`);
  }
}

function validateHabitRules(rules) {
  if (!Array.isArray(rules)) {
    throw new Error("Habit registry must be a JSON array.");
  }

  rules.forEach((rule, index) => validateRule(rule, index));
  return rules;
}

module.exports = {
  validateHabitRules
};
