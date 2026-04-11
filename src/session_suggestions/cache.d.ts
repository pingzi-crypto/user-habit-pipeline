export declare const DEFAULT_SUGGESTION_CACHE_FILENAME = ".last_session_habit_suggestions.json";
export interface SuggestionSnapshotRecord {
    [key: string]: unknown;
}
export interface LoadedSuggestionSnapshot<TSnapshot = SuggestionSnapshotRecord> {
    cachePath: string;
    snapshot: TSnapshot;
}
export declare function deriveSuggestionCachePath(registryPath?: string): string;
export declare function saveSuggestionSnapshot<TSnapshot>(snapshot: TSnapshot, registryPath?: string): string;
export declare function loadSuggestionSnapshot<TSnapshot = SuggestionSnapshotRecord>(registryPath?: string): LoadedSuggestionSnapshot<TSnapshot>;
