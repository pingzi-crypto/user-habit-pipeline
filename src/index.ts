import { toGrowthHubHint } from "./adapters/growth_hub/adapter";
import {
  createUnknownOutput,
  findCandidateRules,
  interpretHabit,
  loadDefaultHabits,
  loadHabitsFromFile
} from "./habit_core/interpreter";
import { buildPreActionDecision, interpretHabitForPreAction } from "./pre_action_gate";
import type {
  GrowthHubHint,
  HabitInput,
  HabitMatch,
  HabitOutput,
  HabitRule,
  InterpretedPreActionResult,
  InterpretHabitOptions,
  MatchType,
  PreActionDecision,
  PreActionDecisionBasis,
  PreActionNextAction,
  UserRegistryState
} from "./habit_core/types";
import {
  USER_DATA_ROOT,
  USER_REGISTRY_PATH,
  addUserHabitRule,
  ensureUserRegistryFile,
  exportUserRegistryState,
  importUserRegistryState,
  loadMergedHabits,
  loadUserRegistryState,
  removeUserHabitPhrase,
  suppressSuggestionPhrase
} from "./habit_registry/user_registry";
import {
  parseHabitManagementRequest as parseHabitManagementRequestImpl,
  type HabitManagementRequest as ParsedHabitManagementRequest
} from "./habit_registry/management_prompt";
import { validateHabitRules } from "./habit_registry/validate_registry";
import {
  LEGACY_DATA_DIR,
  LEGACY_USER_REGISTRY_PATH,
  PACKAGE_NAME,
  USER_HOME_OVERRIDE_ENV,
  resolveDefaultUserRegistryPath,
  resolveUserDataRoot
} from "./runtime_paths";
import {
  DEFAULT_SUGGESTION_CACHE_FILENAME,
  deriveSuggestionCachePath as deriveSuggestionCachePathImpl,
  loadSuggestionSnapshot as loadSuggestionSnapshotImpl,
  saveSuggestionSnapshot as saveSuggestionSnapshotImpl,
  type LoadedSuggestionSnapshot as CacheLoadedSuggestionSnapshot,
  type SuggestionSnapshotRecord as CacheSuggestionSnapshotRecord
} from "./session_suggestions/cache";
const extractCandidates = require("./session_suggestions/extract_candidates") as {
  findSuggestedCandidate: (...args: any[]) => any;
  parseCandidateReference: (...args: any[]) => any;
  parseSessionTranscript: (...args: any[]) => any;
  suggestSessionHabitCandidates: (...args: any[]) => any;
};
const httpServer = require("./http_server") as {
  DEFAULT_HTTP_HOST: string;
  DEFAULT_HTTP_MAX_BODY_BYTES: number;
  DEFAULT_HTTP_PORT: number;
  createHttpServer: (...args: any[]) => any;
  routeHttpRequest: (...args: any[]) => any;
  startHttpServer: (...args: any[]) => any;
};

export type {
  GrowthHubHint,
  HabitInput,
  ParsedHabitManagementRequest as HabitManagementRequest,
  HabitMatch,
  HabitOutput,
  HabitRule,
  InterpretedPreActionResult,
  InterpretHabitOptions,
  CacheLoadedSuggestionSnapshot as LoadedSuggestionSnapshot,
  MatchType,
  PreActionDecision,
  PreActionDecisionBasis,
  PreActionNextAction,
  CacheSuggestionSnapshotRecord as SuggestionSnapshotRecord,
  UserRegistryState
};

export {
  createUnknownOutput,
  findCandidateRules,
  buildPreActionDecision,
  interpretHabit,
  interpretHabitForPreAction,
  loadDefaultHabits,
  loadHabitsFromFile,
  toGrowthHubHint,
  validateHabitRules,
  LEGACY_DATA_DIR,
  LEGACY_USER_REGISTRY_PATH,
  PACKAGE_NAME,
  USER_HOME_OVERRIDE_ENV,
  resolveDefaultUserRegistryPath,
  resolveUserDataRoot
};
export {
  USER_DATA_ROOT,
  USER_REGISTRY_PATH,
  addUserHabitRule,
  ensureUserRegistryFile,
  exportUserRegistryState,
  importUserRegistryState,
  loadMergedHabits,
  loadUserRegistryState,
  removeUserHabitPhrase,
  suppressSuggestionPhrase
};

export const {
  findSuggestedCandidate,
  parseCandidateReference,
  parseSessionTranscript,
  suggestSessionHabitCandidates
} = extractCandidates;

export const parseHabitManagementRequest: typeof parseHabitManagementRequestImpl = parseHabitManagementRequestImpl;
export const deriveSuggestionCachePath: typeof deriveSuggestionCachePathImpl = deriveSuggestionCachePathImpl;
export const loadSuggestionSnapshot: typeof loadSuggestionSnapshotImpl = loadSuggestionSnapshotImpl;
export const saveSuggestionSnapshot: typeof saveSuggestionSnapshotImpl = saveSuggestionSnapshotImpl;

export {
  DEFAULT_SUGGESTION_CACHE_FILENAME,
};

export const {
  DEFAULT_HTTP_HOST,
  DEFAULT_HTTP_MAX_BODY_BYTES,
  DEFAULT_HTTP_PORT,
  createHttpServer,
  routeHttpRequest,
  startHttpServer
} = httpServer;
