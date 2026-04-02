const fs = require("node:fs");
const path = require("node:path");
const { USER_REGISTRY_PATH } = require("../habit_registry/user_registry");

const DEFAULT_SUGGESTION_CACHE_FILENAME = ".last_session_habit_suggestions.json";

function deriveSuggestionCachePath(registryPath = USER_REGISTRY_PATH) {
  const resolvedRegistryPath = path.resolve(registryPath);
  return path.join(path.dirname(resolvedRegistryPath), DEFAULT_SUGGESTION_CACHE_FILENAME);
}

function saveSuggestionSnapshot(snapshot, registryPath = USER_REGISTRY_PATH) {
  const cachePath = deriveSuggestionCachePath(registryPath);
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  return cachePath;
}

function loadSuggestionSnapshot(registryPath = USER_REGISTRY_PATH) {
  const cachePath = deriveSuggestionCachePath(registryPath);
  if (!fs.existsSync(cachePath)) {
    throw new Error(`No cached suggestion snapshot found at ${cachePath}. Run a suggestion scan first or provide --suggestions.`);
  }

  return {
    cachePath,
    snapshot: JSON.parse(fs.readFileSync(cachePath, "utf8"))
  };
}

module.exports = {
  DEFAULT_SUGGESTION_CACHE_FILENAME,
  deriveSuggestionCachePath,
  loadSuggestionSnapshot,
  saveSuggestionSnapshot
};
