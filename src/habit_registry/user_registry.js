const fs = require("node:fs");
const path = require("node:path");
const { validateHabitRules } = require("./validate_registry");

const USER_REGISTRY_PATH = path.join(__dirname, "..", "..", "data", "user_habits.json");

function normalizePhrase(phrase) {
  return String(phrase || "").trim().toLowerCase();
}

function createEmptyUserRegistry() {
  return {
    additions: [],
    removals: [],
    ignored_suggestions: []
  };
}

function validateUserRegistryState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new Error("User habit registry must be a JSON object.");
  }

  const additions = Object.prototype.hasOwnProperty.call(state, "additions") ? state.additions : [];
  const removals = Object.prototype.hasOwnProperty.call(state, "removals") ? state.removals : [];
  const ignoredSuggestions = Object.prototype.hasOwnProperty.call(state, "ignored_suggestions")
    ? state.ignored_suggestions
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

function ensureUserRegistryFile(registryPath = USER_REGISTRY_PATH) {
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

function loadUserRegistryState(registryPath = USER_REGISTRY_PATH) {
  ensureUserRegistryFile(registryPath);
  const raw = fs.readFileSync(registryPath, "utf8");
  return validateUserRegistryState(JSON.parse(raw));
}

function saveUserRegistryState(state, registryPath = USER_REGISTRY_PATH) {
  const validated = validateUserRegistryState(state);
  ensureUserRegistryFile(registryPath);
  fs.writeFileSync(registryPath, `${JSON.stringify(validated, null, 2)}\n`, "utf8");
  return validated;
}

function ensureParentDirectory(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function mergeHabitRegistries(defaultRules, userRegistryState) {
  const state = validateUserRegistryState(userRegistryState);
  const removedPhrases = new Set(state.removals.map((phrase) => normalizePhrase(phrase)));
  const addedPhrases = new Set(state.additions.map((rule) => normalizePhrase(rule.phrase)));

  const filteredDefaultRules = defaultRules.filter((rule) => {
    const normalizedPhrase = normalizePhrase(rule.phrase);
    return !removedPhrases.has(normalizedPhrase) && !addedPhrases.has(normalizedPhrase);
  });

  return [...state.additions, ...filteredDefaultRules];
}

function loadMergedHabits(defaultRules, registryPath = USER_REGISTRY_PATH) {
  const state = loadUserRegistryState(registryPath);
  return mergeHabitRegistries(defaultRules, state);
}

function mergeUserRegistryStates(baseState, incomingState) {
  const base = validateUserRegistryState(baseState);
  const incoming = validateUserRegistryState(incomingState);

  const additionsMap = new Map();
  for (const rule of base.additions) {
    additionsMap.set(normalizePhrase(rule.phrase), rule);
  }
  for (const rule of incoming.additions) {
    additionsMap.set(normalizePhrase(rule.phrase), rule);
  }

  const removalsMap = new Map();
  for (const phrase of [...base.removals, ...incoming.removals]) {
    removalsMap.set(normalizePhrase(phrase), phrase);
  }

  for (const phrase of additionsMap.keys()) {
    removalsMap.delete(phrase);
  }

  const ignoredSuggestionsMap = new Map();
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

function addUserHabitRule(rule, registryPath = USER_REGISTRY_PATH) {
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

function removeUserHabitPhrase(phrase, registryPath = USER_REGISTRY_PATH) {
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

function suppressSuggestionPhrase(phrase, registryPath = USER_REGISTRY_PATH) {
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

function exportUserRegistryState(exportPath, registryPath = USER_REGISTRY_PATH) {
  const state = loadUserRegistryState(registryPath);
  ensureParentDirectory(exportPath);
  fs.writeFileSync(exportPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  return state;
}

function importUserRegistryState(importPath, registryPath = USER_REGISTRY_PATH, mode = "replace") {
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

module.exports = {
  USER_REGISTRY_PATH,
  addUserHabitRule,
  createEmptyUserRegistry,
  ensureUserRegistryFile,
  exportUserRegistryState,
  importUserRegistryState,
  loadMergedHabits,
  loadUserRegistryState,
  mergeUserRegistryStates,
  mergeHabitRegistries,
  removeUserHabitPhrase,
  suppressSuggestionPhrase,
  saveUserRegistryState,
  validateUserRegistryState
};
