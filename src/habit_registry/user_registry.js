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
    removals: []
  };
}

function validateUserRegistryState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    throw new Error("User habit registry must be a JSON object.");
  }

  const additions = Object.prototype.hasOwnProperty.call(state, "additions") ? state.additions : [];
  const removals = Object.prototype.hasOwnProperty.call(state, "removals") ? state.removals : [];

  validateHabitRules(additions);

  if (!Array.isArray(removals) || removals.some((item) => typeof item !== "string")) {
    throw new Error('User habit registry "removals" must be an array of strings.');
  }

  return {
    additions,
    removals
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

function addUserHabitRule(rule, registryPath = USER_REGISTRY_PATH) {
  const validatedRule = validateHabitRules([rule])[0];
  const state = loadUserRegistryState(registryPath);
  const normalizedPhrase = normalizePhrase(validatedRule.phrase);

  const additions = state.additions.filter((item) => normalizePhrase(item.phrase) !== normalizedPhrase);
  additions.push(validatedRule);

  const removals = state.removals.filter((phrase) => normalizePhrase(phrase) !== normalizedPhrase);

  return saveUserRegistryState({ additions, removals }, registryPath);
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

  return saveUserRegistryState({ additions, removals }, registryPath);
}

module.exports = {
  USER_REGISTRY_PATH,
  addUserHabitRule,
  createEmptyUserRegistry,
  ensureUserRegistryFile,
  loadMergedHabits,
  loadUserRegistryState,
  mergeHabitRegistries,
  removeUserHabitPhrase,
  saveUserRegistryState,
  validateUserRegistryState
};
