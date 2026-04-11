"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_REGISTRY_PATH = exports.USER_DATA_ROOT = exports.resolveUserDataRoot = exports.resolveDefaultUserRegistryPath = exports.LEGACY_USER_REGISTRY_PATH = void 0;
exports.createEmptyUserRegistry = createEmptyUserRegistry;
exports.validateUserRegistryState = validateUserRegistryState;
exports.ensureUserRegistryFile = ensureUserRegistryFile;
exports.loadUserRegistryState = loadUserRegistryState;
exports.saveUserRegistryState = saveUserRegistryState;
exports.mergeHabitRegistries = mergeHabitRegistries;
exports.loadMergedHabits = loadMergedHabits;
exports.mergeUserRegistryStates = mergeUserRegistryStates;
exports.addUserHabitRule = addUserHabitRule;
exports.removeUserHabitPhrase = removeUserHabitPhrase;
exports.suppressSuggestionPhrase = suppressSuggestionPhrase;
exports.exportUserRegistryState = exportUserRegistryState;
exports.importUserRegistryState = importUserRegistryState;
const fs = require("node:fs");
const path = require("node:path");
const validate_registry_1 = require("./validate_registry");
const runtime_paths_1 = require("../runtime_paths");
Object.defineProperty(exports, "LEGACY_USER_REGISTRY_PATH", { enumerable: true, get: function () { return runtime_paths_1.LEGACY_USER_REGISTRY_PATH; } });
Object.defineProperty(exports, "resolveDefaultUserRegistryPath", { enumerable: true, get: function () { return runtime_paths_1.resolveDefaultUserRegistryPath; } });
Object.defineProperty(exports, "resolveUserDataRoot", { enumerable: true, get: function () { return runtime_paths_1.resolveUserDataRoot; } });
exports.USER_DATA_ROOT = (0, runtime_paths_1.resolveUserDataRoot)();
exports.USER_REGISTRY_PATH = (0, runtime_paths_1.resolveDefaultUserRegistryPath)();
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
    const candidate = state;
    const additions = Object.prototype.hasOwnProperty.call(candidate, "additions") ? candidate.additions : [];
    const removals = Object.prototype.hasOwnProperty.call(candidate, "removals") ? candidate.removals : [];
    const ignoredSuggestions = Object.prototype.hasOwnProperty.call(candidate, "ignored_suggestions")
        ? candidate.ignored_suggestions
        : [];
    (0, validate_registry_1.validateHabitRules)(additions);
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
function ensureUserRegistryFile(registryPath = exports.USER_REGISTRY_PATH) {
    const directory = path.dirname(registryPath);
    fs.mkdirSync(directory, { recursive: true });
    if (!fs.existsSync(registryPath)) {
        fs.writeFileSync(registryPath, `${JSON.stringify(createEmptyUserRegistry(), null, 2)}\n`, "utf8");
    }
    return registryPath;
}
function loadUserRegistryState(registryPath = exports.USER_REGISTRY_PATH) {
    ensureUserRegistryFile(registryPath);
    const raw = fs.readFileSync(registryPath, "utf8");
    return validateUserRegistryState(JSON.parse(raw));
}
function saveUserRegistryState(state, registryPath = exports.USER_REGISTRY_PATH) {
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
function loadMergedHabits(defaultRules, registryPath = exports.USER_REGISTRY_PATH) {
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
function addUserHabitRule(rule, registryPath = exports.USER_REGISTRY_PATH) {
    const validatedRule = (0, validate_registry_1.validateHabitRules)([rule])[0];
    const state = loadUserRegistryState(registryPath);
    const normalizedPhrase = normalizePhrase(validatedRule.phrase);
    const additions = state.additions.filter((item) => normalizePhrase(item.phrase) !== normalizedPhrase);
    additions.push(validatedRule);
    const removals = state.removals.filter((phrase) => normalizePhrase(phrase) !== normalizedPhrase);
    const ignoredSuggestions = state.ignored_suggestions
        .filter((phrase) => normalizePhrase(phrase) !== normalizedPhrase);
    return saveUserRegistryState({ additions, removals, ignored_suggestions: ignoredSuggestions }, registryPath);
}
function removeUserHabitPhrase(phrase, registryPath = exports.USER_REGISTRY_PATH) {
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
function suppressSuggestionPhrase(phrase, registryPath = exports.USER_REGISTRY_PATH) {
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
function exportUserRegistryState(exportPath, registryPath = exports.USER_REGISTRY_PATH) {
    const state = loadUserRegistryState(registryPath);
    ensureParentDirectory(exportPath);
    fs.writeFileSync(exportPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    return state;
}
function importUserRegistryState(importPath, registryPath = exports.USER_REGISTRY_PATH, mode = "replace") {
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
