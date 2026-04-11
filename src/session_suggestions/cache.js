"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SUGGESTION_CACHE_FILENAME = void 0;
exports.deriveSuggestionCachePath = deriveSuggestionCachePath;
exports.saveSuggestionSnapshot = saveSuggestionSnapshot;
exports.loadSuggestionSnapshot = loadSuggestionSnapshot;
const fs = require("node:fs");
const path = require("node:path");
const user_registry_1 = require("../habit_registry/user_registry");
exports.DEFAULT_SUGGESTION_CACHE_FILENAME = ".last_session_habit_suggestions.json";
function deriveSuggestionCachePath(registryPath = user_registry_1.USER_REGISTRY_PATH) {
    const resolvedRegistryPath = path.resolve(registryPath);
    return path.join(path.dirname(resolvedRegistryPath), exports.DEFAULT_SUGGESTION_CACHE_FILENAME);
}
function saveSuggestionSnapshot(snapshot, registryPath = user_registry_1.USER_REGISTRY_PATH) {
    const cachePath = deriveSuggestionCachePath(registryPath);
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    fs.writeFileSync(cachePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    return cachePath;
}
function loadSuggestionSnapshot(registryPath = user_registry_1.USER_REGISTRY_PATH) {
    const cachePath = deriveSuggestionCachePath(registryPath);
    if (!fs.existsSync(cachePath)) {
        throw new Error(`No cached suggestion snapshot found at ${cachePath}. Run a suggestion scan first or provide --suggestions.`);
    }
    return {
        cachePath,
        snapshot: JSON.parse(fs.readFileSync(cachePath, "utf8"))
    };
}
