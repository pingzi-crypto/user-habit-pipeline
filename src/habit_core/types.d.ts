export type MatchType = "exact" | "substring";
export interface HabitInput {
    message: string;
    recent_context?: string[];
    scenario?: string | null;
}
export interface HabitRule {
    phrase: string;
    normalized_intent: string;
    scenario_bias: string[];
    confidence: number;
    match_type?: MatchType;
    preferred_terms?: string[];
    disambiguation_hints?: string[];
    notes?: string[];
    clarify_below?: number;
}
export interface HabitMatch {
    phrase: string;
    meaning: string;
    confidence: number;
}
export interface HabitOutput {
    normalized_intent: string;
    habit_matches: HabitMatch[];
    disambiguation_hints: string[];
    confidence: number;
    should_ask_clarifying_question: boolean;
    preferred_terms: string[];
    notes: string[];
}
export interface GrowthHubHint {
    hint_intent: string;
    hint_confidence: number;
    hint_requires_confirmation: boolean;
    hint_terms: string[];
    hint_notes: string[];
}
export interface CandidateRule {
    rule: HabitRule;
    matchType: MatchType;
}
export interface ScoredCandidate extends CandidateRule {
    score: number;
    reasons: string[];
}
export interface InterpretHabitOptions {
    rules?: HabitRule[];
    registryPath?: string;
    userRegistryPath?: string;
    includeUserRegistry?: boolean;
}
export interface UserRegistryState {
    additions: HabitRule[];
    removals: string[];
    ignored_suggestions: string[];
}
