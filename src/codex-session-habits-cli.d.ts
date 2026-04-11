#!/usr/bin/env node
import type { HabitRule } from "./habit_core/types";
type AssessmentLevel = "unknown" | "low_roi" | "actionable" | "stopped";
interface SessionHabitCliArgs {
    help: boolean;
    maxCandidates: number;
    registryPath: string;
    request: string | null;
    threadFromStdin: boolean;
    threadPath: string | null;
}
interface ConfidenceAdjustment {
    type: string;
    delta?: number;
    applied?: boolean;
    note?: string;
}
interface ConfidenceDetails {
    summary?: string;
    adjustments?: ConfidenceAdjustment[];
    [key: string]: unknown;
}
interface SessionHabitCandidate {
    candidate_id: string;
    phrase: string;
    action?: string;
    confidence?: number;
    confidence_details?: ConfidenceDetails;
    suggested_rule?: HabitRule | null;
    risk_flags?: string[];
    [key: string]: unknown;
}
interface NextStepAssessment {
    level: AssessmentLevel;
    reason: string;
    stop_word: string | null;
}
interface RenderedAssistantReply {
    assistant_reply_markdown: string;
    suggested_follow_ups: string[];
    next_step_assessment: NextStepAssessment;
}
interface SessionHabitOutput {
    action?: string;
    request?: string;
    candidate_count?: number;
    candidates?: SessionHabitCandidate[];
    additions?: HabitRule[];
    removals?: string[];
    ignored_suggestions?: string[];
    ignored_phrase?: string;
    removed_phrase?: string;
    added_rule?: HabitRule;
    applied_rule?: HabitRule;
    transcript_stats?: Record<string, unknown>;
    [key: string]: unknown;
}
export declare function parseArgs(argv: string[]): SessionHabitCliArgs;
export declare function getUsageText(): string;
export declare function validateArgs(args: SessionHabitCliArgs): void;
export declare function parseJsonOutput(text: string): SessionHabitOutput;
export declare function buildNextStepAssessment(output: SessionHabitOutput | null | undefined): NextStepAssessment;
export declare function buildLocalStopResponse(request: string | null): SessionHabitOutput & RenderedAssistantReply;
export declare function renderAssistantReply(output: SessionHabitOutput): RenderedAssistantReply;
export declare function forwardToManageHabits(args: SessionHabitCliArgs): never;
export declare function main(argv?: string[]): void;
export {};
