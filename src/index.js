const {
  interpretHabit,
  loadDefaultHabits,
  loadHabitsFromFile
} = require("./habit_core/interpreter");
const { toGrowthHubHint } = require("./adapters/growth_hub/adapter");
const { validateHabitRules } = require("./habit_registry/validate_registry");
const {
  PACKAGE_NAME,
  USER_HOME_OVERRIDE_ENV
} = require("./runtime_paths");
const {
  LEGACY_USER_REGISTRY_PATH,
  USER_REGISTRY_PATH,
  USER_DATA_ROOT,
  addUserHabitRule,
  ensureUserRegistryFile,
  exportUserRegistryState,
  importUserRegistryState,
  loadMergedHabits,
  loadUserRegistryState,
  removeUserHabitPhrase,
  resolveDefaultUserRegistryPath,
  resolveUserDataRoot,
  suppressSuggestionPhrase
} = require("./habit_registry/user_registry");
const { parseHabitManagementRequest } = require("./habit_registry/management_prompt");
const {
  parseSessionTranscript,
  findSuggestedCandidate,
  parseCandidateReference,
  suggestSessionHabitCandidates
} = require("./session_suggestions/extract_candidates");
const {
  DEFAULT_SUGGESTION_CACHE_FILENAME,
  deriveSuggestionCachePath,
  loadSuggestionSnapshot,
  saveSuggestionSnapshot
} = require("./session_suggestions/cache");

module.exports = {
  LEGACY_USER_REGISTRY_PATH,
  PACKAGE_NAME,
  USER_REGISTRY_PATH,
  USER_DATA_ROOT,
  USER_HOME_OVERRIDE_ENV,
  addUserHabitRule,
  ensureUserRegistryFile,
  exportUserRegistryState,
  findSuggestedCandidate,
  importUserRegistryState,
  interpretHabit,
  DEFAULT_SUGGESTION_CACHE_FILENAME,
  deriveSuggestionCachePath,
  loadDefaultHabits,
  loadHabitsFromFile,
  loadMergedHabits,
  loadSuggestionSnapshot,
  loadUserRegistryState,
  parseHabitManagementRequest,
  parseCandidateReference,
  parseSessionTranscript,
  removeUserHabitPhrase,
  resolveDefaultUserRegistryPath,
  resolveUserDataRoot,
  suppressSuggestionPhrase,
  saveSuggestionSnapshot,
  suggestSessionHabitCandidates,
  validateHabitRules,
  toGrowthHubHint
};
