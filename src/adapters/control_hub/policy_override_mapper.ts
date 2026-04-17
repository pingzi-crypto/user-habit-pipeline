import type {
  PolicyOverrideMode,
  PolicyOverrideScope,
  PolicyOverrideSuggestedPreferenceWrite,
  PolicyOverrideWhitelistEntry
} from "./policy_override_types";

const CURRENT_ITEM_HINTS = ["这次", "本次", "当前", "这一条", "这个任务"];
const CURRENT_PROJECT_HINTS = ["当前项目", "本项目", "这个项目", "项目里"];
const GLOBAL_HINTS = ["全局", "所有项目", "以后都", "默认都", "一直", "统一"];
const ONE_TIME_HINTS = ["这次", "本次", "临时", "先"];
const DURABLE_HINTS = ["默认", "以后", "都", "今后", "长期", "统一"];

export function inferPolicyOverrideScope(
  rawUserText: string,
  entry: PolicyOverrideWhitelistEntry
): PolicyOverrideScope {
  if (containsHint(rawUserText, GLOBAL_HINTS)) {
    return "global";
  }

  if (containsHint(rawUserText, CURRENT_PROJECT_HINTS)) {
    return "current_project";
  }

  if (containsHint(rawUserText, CURRENT_ITEM_HINTS)) {
    return "current_item";
  }

  return entry.default_scope;
}

export function inferPolicyOverrideMode(
  rawUserText: string,
  entry: PolicyOverrideWhitelistEntry
): PolicyOverrideMode {
  if (containsHint(rawUserText, DURABLE_HINTS)) {
    return "durable_candidate";
  }

  if (containsHint(rawUserText, ONE_TIME_HINTS)) {
    return "one_time";
  }

  return entry.default_override_mode;
}

export function buildSuggestedPreferenceWrite(
  entry: PolicyOverrideWhitelistEntry,
  scope: PolicyOverrideScope,
  overrideMode: PolicyOverrideMode
): PolicyOverrideSuggestedPreferenceWrite | null {
  if (!entry.allow_durable_write || overrideMode !== "durable_candidate") {
    return null;
  }

  if (scope !== "current_project" && scope !== "global") {
    return null;
  }

  return {
    intent: entry.interpreted_intent,
    scope,
    source_phrase: entry.phrase
  };
}

function containsHint(rawUserText: string, hints: string[]): boolean {
  const normalized = String(rawUserText || "").trim();
  return hints.some((hint) => normalized.includes(hint));
}
