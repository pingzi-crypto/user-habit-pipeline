import type { PolicyOverrideMode, PolicyOverrideScope, PolicyOverrideWhitelistEntry } from "./policy_override_types";
export declare function getScopeClarifyingQuestion(entry: PolicyOverrideWhitelistEntry): string;
export declare function getModeClarifyingQuestion(entry: PolicyOverrideWhitelistEntry): string;
export declare function getCombinedClarifyingQuestion(entry: PolicyOverrideWhitelistEntry): string;
export declare function getConflictClarifyingQuestion(entry: PolicyOverrideWhitelistEntry): string;
export declare function pickClarifyingQuestion(args: {
    entry: PolicyOverrideWhitelistEntry;
    scope: PolicyOverrideScope;
    overrideMode: PolicyOverrideMode;
    hasPreferenceConflict: boolean;
}): string | null;
