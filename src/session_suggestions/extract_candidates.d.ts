import type { HabitRule } from "../habit_core/types";
type TranscriptRole = "user" | "assistant" | "system" | "tool" | "unknown";
type CandidateSourceType = "explicit_add_request" | "explicit_definition" | "repeated_phrase";
type CandidateAction = "suggest_add" | "review_only";
type RiskFlag = "scenario_unspecified" | "single_thread_only" | "missing_intent";
type ConfidenceAdjustmentType = "structured_request_bonus" | "explicit_correction_bonus" | "suggestion_cap" | "scenario_specificity_bonus" | "repetition_bonus" | "single_thread_limit";
interface TranscriptMessage {
    role: TranscriptRole;
    content: string;
}
export interface SessionSuggestionConfidenceAdjustment {
    type: ConfidenceAdjustmentType;
    delta: number;
    applied: boolean;
    note: string;
}
export interface SessionSuggestionConfidenceDetails {
    domain: "session_suggestion";
    source_type: CandidateSourceType;
    base_score: number;
    adjustments: SessionSuggestionConfidenceAdjustment[];
    final_score: number;
    summary: string;
}
interface CandidateEvidence {
    occurrence_count: number;
    correction_count: number;
    examples: string[];
}
interface CandidateRecordInput {
    source_type: CandidateSourceType;
    action: CandidateAction;
    confidence: number;
    confidence_details: SessionSuggestionConfidenceDetails;
    suggested_rule: HabitRule | null;
    evidence: CandidateEvidence;
    risk_flags: RiskFlag[];
}
interface CandidateRecord extends CandidateRecordInput {
    phrase: string;
}
export interface SuggestedCandidate extends CandidateRecord {
    candidate_id: string;
}
export interface SuggestionSnapshot {
    schema_version?: string;
    record_type?: string;
    transcript_stats?: {
        message_count: number;
        user_message_count: number;
    };
    candidates: SuggestedCandidate[];
    [key: string]: unknown;
}
export interface SessionSuggestionResult {
    schema_version: "1.0";
    record_type: "session_habit_suggestions";
    transcript_stats: {
        message_count: number;
        user_message_count: number;
    };
    candidates: SuggestedCandidate[];
}
export interface SuggestSessionHabitCandidateOptions {
    userRegistryPath?: string;
    maxCandidates?: number;
}
export declare const DEFAULT_MAX_CANDIDATES = 5;
export declare function parseSessionTranscript(transcriptText: string): TranscriptMessage[];
export declare function suggestSessionHabitCandidates(transcriptText: string, options?: SuggestSessionHabitCandidateOptions): SessionSuggestionResult;
export declare function parseCandidateReference(value: string | null | undefined): string;
export declare function validateSuggestionSnapshot(snapshot: unknown): SuggestionSnapshot;
export declare function findSuggestedCandidate(snapshot: unknown, reference: string): SuggestedCandidate;
export {};
