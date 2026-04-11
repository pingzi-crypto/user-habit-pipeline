import fs = require("node:fs");
import path = require("node:path");
import { USER_REGISTRY_PATH } from "../habit_registry/user_registry";

export const DEFAULT_SUGGESTION_CACHE_FILENAME = ".last_session_habit_suggestions.json";

export interface SuggestionSnapshotRecord {
  [key: string]: unknown;
}

export interface LoadedSuggestionSnapshot<TSnapshot = SuggestionSnapshotRecord> {
  cachePath: string;
  snapshot: TSnapshot;
}

export function deriveSuggestionCachePath(registryPath: string = USER_REGISTRY_PATH): string {
  const resolvedRegistryPath = path.resolve(registryPath);
  return path.join(path.dirname(resolvedRegistryPath), DEFAULT_SUGGESTION_CACHE_FILENAME);
}

export function saveSuggestionSnapshot<TSnapshot>(
  snapshot: TSnapshot,
  registryPath: string = USER_REGISTRY_PATH
): string {
  const cachePath = deriveSuggestionCachePath(registryPath);
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  return cachePath;
}

export function loadSuggestionSnapshot<TSnapshot = SuggestionSnapshotRecord>(
  registryPath: string = USER_REGISTRY_PATH
): LoadedSuggestionSnapshot<TSnapshot> {
  const cachePath = deriveSuggestionCachePath(registryPath);
  if (!fs.existsSync(cachePath)) {
    throw new Error(`No cached suggestion snapshot found at ${cachePath}. Run a suggestion scan first or provide --suggestions.`);
  }

  return {
    cachePath,
    snapshot: JSON.parse(fs.readFileSync(cachePath, "utf8")) as TSnapshot
  };
}
