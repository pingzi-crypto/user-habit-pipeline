import fs = require("node:fs");
import path = require("node:path");
import type { HabitRule, UserRegistryState } from "../habit_core/types";
import { validateHabitRules } from "./validate_registry";
import {
  LEGACY_USER_REGISTRY_PATH,
  resolveDefaultUserRegistryPath,
  resolveUserDataRoot
} from "../runtime_paths";

export {
  LEGACY_USER_REGISTRY_PATH,
  resolveDefaultUserRegistryPath,
  resolveUserDataRoot
};

export const USER_DATA_ROOT = resolveUserDataRoot();
export const USER_REGISTRY_PATH = resolveDefaultUserRegistryPath();

function normalizePhrase(phrase: string | null | undefined): string {
  return String(phrase || "").trim().toLowerCase();
}

export function createEmptyUserRegistry(): UserRegistryState {
  return {
    additions: [],
    removals: [],
    ignored_suggestions: []
  };
}

export function validateUserRegistryState(state: unknown): UserRegistryState {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new Error("User habit registry must be a JSON object.");
  }

  const candidate = state as Partial<UserRegistryState> & Record<string, unknown>;
  const additions = Object.prototype.hasOwnProperty.call(candidate, "additions") ? candidate.additions : [];
  const removals = Object.prototype.hasOwnProperty.call(candidate, "removals") ? candidate.removals : [];
  const ignoredSuggestions = Object.prototype.hasOwnProperty.call(candidate, "ignored_suggestions")
    ? candidate.ignored_suggestions
    : [];

  validateHabitRules(additions);

  if (!Array.isArray(removals) || removals.some((item) => typeof item !== "string")) {
    throw new Error('User habit registry "removals" must be an array of strings.');
  }

  if (!Array.isArray(ignoredSuggestions) || ignoredSuggestions.some((item) => typeof item !== "string")) {
    throw new Error('User habit registry "ignored_suggestions" must be an array of strings.');
  }

  return {
    additions,
    removals,
    ignored_suggestions: ignoredSuggestions
  };
}

export function ensureUserRegistryFile(registryPath: string = USER_REGISTRY_PATH): string {
  const directory = path.dirname(registryPath);
  fs.mkdirSync(directory, { recursive: true });

  if (!fs.existsSync(registryPath)) {
    fs.writeFileSync(
      registryPath,
      `${JSON.stringify(createEmptyUserRegistry(), null, 2)}\n`,
      "utf8"
    );
  }

  return registryPath;
}

export function loadUserRegistryState(registryPath: string = USER_REGISTRY_PATH): UserRegistryState {
  ensureUserRegistryFile(registryPath);
  const raw = fs.readFileSync(registryPath, "utf8");
  return validateUserRegistryState(JSON.parse(raw));
}

export function saveUserRegistryState(
  state: unknown,
  registryPath: string = USER_REGISTRY_PATH
): UserRegistryState {
  const validated = validateUserRegistryState(state);
  ensureUserRegistryFile(registryPath);
  fs.writeFileSync(registryPath, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
  return validated;
}

function ensureParentDirectory(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function mergeHabitRegistries(defaultRules: HabitRule[], userRegistryState: unknown): HabitRule[] {
  const state = validateUserRegistryState(userRegistryState);
  const removedPhrases = new Set(state.removals.map((phrase) => normalizePhrase(phrase)));
  const addedPhrases = new Set(state.additions.map((rule) => normalizePhrase(rule.phrase)));

  const filteredDefaultRules = defaultRules.filter((rule) => {
    const normalizedPhrase = normalizePhrase(rule.phrase);
    return !removedPhrases.has(normalizedPhrase) && !addedPhrases.has(normalizedPhrase);
  });

  return [...state.additions, ...filteredDefaultRules];
}

export function loadMergedHabits(defaultRules: HabitRule[], registryPath: string = USER_REGISTRY_PATH): HabitRule[] {
  const state = loadUserRegistryState(registryPath);
  return mergeHabitRegistries(defaultRules, state);
}

export function mergeUserRegistryStates(baseState: unknown, incomingState: unknown): UserRegistryState {
  const base = validateUserRegistryState(baseState);
  const incoming = validateUserRegistryState(incomingState);

  const additionsMap = new Map<string, HabitRule>();
  for (const rule of base.additions) {
    additionsMap.set(normalizePhrase(rule.phrase), rule);
  }
  for (const rule of incoming.additions) {
    additionsMap.set(normalizePhrase(rule.phrase), rule);
  }

  const removalsMap = new Map<string, string>();
  for (const phrase of [...base.removals, ...incoming.removals]) {
    removalsMap.set(normalizePhrase(phrase), phrase);
  }

  for (const phrase of additionsMap.keys()) {
    removalsMap.delete(phrase);
  }

  const ignoredSuggestionsMap = new Map<string, string>();
  for (const phrase of [...base.ignored_suggestions, ...incoming.ignored_suggestions]) {
    ignoredSuggestionsMap.set(normalizePhrase(phrase), phrase);
  }

  for (const phrase of additionsMap.keys()) {
    ignoredSuggestionsMap.delete(phrase);
  }

  return {
    additions: [...additionsMap.values()],
    removals: [...removalsMap.values()],
    ignored_suggestions: [...ignoredSuggestionsMap.values()]
  };
}

export function addUserHabitRule(rule: HabitRule, registryPath: string = USER_REGISTRY_PATH): UserRegistryState {
  const validatedRule = validateHabitRules([rule])[0];
  const state = loadUserRegistryState(registryPath);
  const normalizedPhrase = normalizePhrase(validatedRule.phrase);

  const additions = state.additions.filter((item) => normalizePhrase(item.phrase) !== normalizedPhrase);
  additions.push(validatedRule);

  const removals = state.removals.filter((phrase) => normalizePhrase(phrase) !== normalizedPhrase);
  const ignoredSuggestions = state.ignored_suggestions
    .filter((phrase) => normalizePhrase(phrase) !== normalizedPhrase);

  return saveUserRegistryState({ additions, removals, ignored_suggestions: ignoredSuggestions }, registryPath);
}

export function removeUserHabitPhrase(
  phrase: string | null | undefined,
  registryPath: string = USER_REGISTRY_PATH
): UserRegistryState {
  const trimmedPhrase = String(phrase || "").trim();
  if (!trimmedPhrase) {
    throw new Error("A non-empty phrase is required for removal.");
  }

  const normalizedPhrase = normalizePhrase(trimmedPhrase);
  const state = loadUserRegistryState(registryPath);

  const additions = state.additions.filter((item) => normalizePhrase(item.phrase) !== normalizedPhrase);
  const removalExists = state.removals.some((item) => normalizePhrase(item) === normalizedPhrase);
  const removals = removalExists ? state.removals : [...state.removals, trimmedPhrase];

  return saveUserRegistryState({
    additions,
    removals,
    ignored_suggestions: state.ignored_suggestions
  }, registryPath);
}

export function suppressSuggestionPhrase(
  phrase: string | null | undefined,
  registryPath: string = USER_REGISTRY_PATH
): UserRegistryState {
  const trimmedPhrase = String(phrase || "").trim();
  if (!trimmedPhrase) {
    throw new Error("A non-empty phrase is required for suggestion suppression.");
  }

  const normalizedPhrase = normalizePhrase(trimmedPhrase);
  const state = loadUserRegistryState(registryPath);
  const ignoredExists = state.ignored_suggestions.some((item) => normalizePhrase(item) === normalizedPhrase);
  const ignoredSuggestions = ignoredExists
    ? state.ignored_suggestions
    : [...state.ignored_suggestions, trimmedPhrase];

  return saveUserRegistryState({
    additions: state.additions,
    removals: state.removals,
    ignored_suggestions: ignoredSuggestions
  }, registryPath);
}

export function exportUserRegistryState(
  exportPath: string,
  registryPath: string = USER_REGISTRY_PATH
): UserRegistryState {
  const state = loadUserRegistryState(registryPath);
  ensureParentDirectory(exportPath);
  fs.writeFileSync(exportPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  return state;
}

export function importUserRegistryState(
  importPath: string,
  registryPath: string = USER_REGISTRY_PATH,
  mode: "replace" | "merge" = "replace"
): UserRegistryState {
  const imported = validateUserRegistryState(JSON.parse(fs.readFileSync(importPath, "utf8")));

  if (mode === "replace") {
    return saveUserRegistryState(imported, registryPath);
  }

  if (mode === "merge") {
    const current = loadUserRegistryState(registryPath);
    return saveUserRegistryState(mergeUserRegistryStates(current, imported), registryPath);
  }

  throw new Error('Import mode must be "replace" or "merge".');
}
