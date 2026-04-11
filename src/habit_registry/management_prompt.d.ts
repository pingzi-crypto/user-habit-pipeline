import type { HabitRule } from "../habit_core/types";
export interface ListHabitManagementRequest {
    action: "list";
}
export interface SuggestHabitManagementRequest {
    action: "suggest";
    scope: "current_session";
}
export interface ApplyCandidateOverrides {
    intent?: string;
    scenario_bias?: string[];
    confidence?: number;
}
export interface ApplyCandidateHabitManagementRequest extends ApplyCandidateOverrides {
    action: "apply-candidate";
    candidate_ref: string;
}
export interface IgnoreCandidateHabitManagementRequest {
    action: "ignore-candidate";
    candidate_ref: string;
}
export interface IgnorePhraseHabitManagementRequest {
    action: "ignore-phrase";
    phrase: string;
}
export interface RemoveHabitManagementRequest {
    action: "remove";
    phrase: string;
}
export interface AddHabitManagementRequest {
    action: "add";
    rule: HabitRule;
}
export interface ImportHabitManagementRequest {
    action: "import";
    path: string;
    mode?: string;
}
export interface ExportHabitManagementRequest {
    action: "export";
    path: string;
    mode?: string;
}
export type HabitManagementRequest = AddHabitManagementRequest | ApplyCandidateHabitManagementRequest | ExportHabitManagementRequest | IgnoreCandidateHabitManagementRequest | IgnorePhraseHabitManagementRequest | ImportHabitManagementRequest | ListHabitManagementRequest | RemoveHabitManagementRequest | SuggestHabitManagementRequest;
export declare function parseHabitManagementRequest(message: string): HabitManagementRequest | null;
