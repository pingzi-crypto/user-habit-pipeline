const {
  interpretHabit,
  loadDefaultHabits,
  loadHabitsFromFile
} = require("./habit_core/interpreter");
const { toGrowthHubHint } = require("./adapters/growth_hub/adapter");
const { validateHabitRules } = require("./habit_registry/validate_registry");
const {
  USER_REGISTRY_PATH,
  addUserHabitRule,
  ensureUserRegistryFile,
  exportUserRegistryState,
  importUserRegistryState,
  loadMergedHabits,
  loadUserRegistryState,
  removeUserHabitPhrase,
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
  USER_REGISTRY_PATH,
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
  suppressSuggestionPhrase,
  saveSuggestionSnapshot,
  suggestSessionHabitCandidates,
  validateHabitRules,
  toGrowthHubHint
};
