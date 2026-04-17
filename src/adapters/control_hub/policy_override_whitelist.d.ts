import type { PolicyOverrideWhitelistEntry } from "./policy_override_types";
export declare const CONTROL_HUB_POLICY_OVERRIDE_WHITELIST: PolicyOverrideWhitelistEntry[];
export declare function findWhitelistMatches(rawUserText: string): PolicyOverrideWhitelistEntry[];
export declare function normalizePolicyOverrideText(value: string): string;
