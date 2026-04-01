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
  removeUserHabitPhrase
} = require("./habit_registry/user_registry");
const { parseHabitManagementRequest } = require("./habit_registry/management_prompt");

module.exports = {
  USER_REGISTRY_PATH,
  addUserHabitRule,
  ensureUserRegistryFile,
  exportUserRegistryState,
  importUserRegistryState,
  interpretHabit,
  loadDefaultHabits,
  loadHabitsFromFile,
  loadMergedHabits,
  loadUserRegistryState,
  parseHabitManagementRequest,
  removeUserHabitPhrase,
  validateHabitRules,
  toGrowthHubHint
};
