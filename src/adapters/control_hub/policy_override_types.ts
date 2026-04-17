export type PolicyOverridePhraseType = "policy_override";
export type PolicyOverrideMatchStatus = "matched" | "no_match" | "ambiguous";
export type PolicyOverrideScope = "current_item" | "current_project" | "global" | "unknown";
export type PolicyOverrideMode = "one_time" | "durable_candidate" | "unknown";

export interface ControlHubPolicyOverrideInput {
  raw_user_text: string;
  context_type: "policy_override";
  current_action_candidate?: string | null;
  confirmed_preferences?: string[] | Record<string, unknown> | null;
  project_policy_summary?: string | Record<string, unknown> | null;
}

export interface PolicyOverrideSuggestedPreferenceWrite {
  intent: string;
  scope: "current_project" | "global";
  source_phrase: string;
}

export interface PolicyOverrideTrialResult {
  match_status: PolicyOverrideMatchStatus;
  phrase_type: PolicyOverridePhraseType;
  interpreted_intent: string | null;
  scope: PolicyOverrideScope;
  override_mode: PolicyOverrideMode;
  confidence: number;
  should_ask_clarifying_question: boolean;
  clarifying_question: string | null;
  suggested_preference_write: PolicyOverrideSuggestedPreferenceWrite | null;
  matched_phrase: string | null;
}

export interface PolicyOverrideWhitelistEntry {
  phrase: string;
  variants: string[];
  interpreted_intent: string;
  confidence: number;
  default_scope: PolicyOverrideScope;
  default_override_mode: PolicyOverrideMode;
  require_scope_clarification: boolean;
  require_mode_clarification: boolean;
  allow_durable_write: boolean;
}

export interface PolicyOverrideGoldsetCase {
  phrase: string;
  context_type: "policy_override";
  current_context: string;
  expected_intent: string;
  scope: PolicyOverrideScope;
  override_mode: PolicyOverrideMode;
  durable_write_allowed: boolean;
  must_clarify_when_conflict: boolean;
  default_clarify: boolean;
  notes?: string;
}
