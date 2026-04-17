import type { PolicyOverrideMode, PolicyOverrideScope, PolicyOverrideSuggestedPreferenceWrite, PolicyOverrideWhitelistEntry } from "./policy_override_types";
export declare function inferPolicyOverrideScope(rawUserText: string, entry: PolicyOverrideWhitelistEntry): PolicyOverrideScope;
export declare function inferPolicyOverrideMode(rawUserText: string, entry: PolicyOverrideWhitelistEntry): PolicyOverrideMode;
export declare function buildSuggestedPreferenceWrite(entry: PolicyOverrideWhitelistEntry, scope: PolicyOverrideScope, overrideMode: PolicyOverrideMode): PolicyOverrideSuggestedPreferenceWrite | null;
