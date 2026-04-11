import type { HabitRule } from "../habit_core/types";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function validateRule(rule: unknown, index: number): asserts rule is HabitRule {
  const prefix = `Invalid registry rule at index ${index}`;

  if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
    throw new Error(`${prefix}: rule must be an object.`);
  }

  const candidate = rule as Partial<HabitRule> & Record<string, unknown>;

  if (typeof candidate.phrase !== "string" || candidate.phrase.trim() === "") {
    throw new Error(`${prefix}: "phrase" must be a non-empty string.`);
  }

  if (typeof candidate.normalized_intent !== "string" || candidate.normalized_intent.trim() === "") {
    throw new Error(`${prefix}: "normalized_intent" must be a non-empty string.`);
  }

  if (!isStringArray(candidate.scenario_bias)) {
    throw new Error(`${prefix}: "scenario_bias" must be an array of strings.`);
  }

  if (
    typeof candidate.confidence !== "number" ||
    Number.isNaN(candidate.confidence) ||
    candidate.confidence < 0 ||
    candidate.confidence > 1
  ) {
    throw new Error(`${prefix}: "confidence" must be a number between 0 and 1.`);
  }

  if (
    Object.prototype.hasOwnProperty.call(candidate, "match_type") &&
    candidate.match_type !== "exact" &&
    candidate.match_type !== "substring"
  ) {
    throw new Error(`${prefix}: "match_type" must be "exact" or "substring" when provided.`);
  }

  if (
    Object.prototype.hasOwnProperty.call(candidate, "preferred_terms") &&
    !isStringArray(candidate.preferred_terms)
  ) {
    throw new Error(`${prefix}: "preferred_terms" must be an array of strings when provided.`);
  }

  if (
    Object.prototype.hasOwnProperty.call(candidate, "disambiguation_hints") &&
    !isStringArray(candidate.disambiguation_hints)
  ) {
    throw new Error(`${prefix}: "disambiguation_hints" must be an array of strings when provided.`);
  }

  if (
    Object.prototype.hasOwnProperty.call(candidate, "notes") &&
    !isStringArray(candidate.notes)
  ) {
    throw new Error(`${prefix}: "notes" must be an array of strings when provided.`);
  }

  if (
    Object.prototype.hasOwnProperty.call(candidate, "clarify_below") &&
    (
      typeof candidate.clarify_below !== "number" ||
      Number.isNaN(candidate.clarify_below) ||
      candidate.clarify_below < 0 ||
      candidate.clarify_below > 1
    )
  ) {
    throw new Error(`${prefix}: "clarify_below" must be a number between 0 and 1 when provided.`);
  }
}

export function validateHabitRules(rules: unknown): HabitRule[] {
  if (!Array.isArray(rules)) {
    throw new Error("Habit registry must be a JSON array.");
  }

  rules.forEach((rule, index) => validateRule(rule, index));
  return rules;
}
