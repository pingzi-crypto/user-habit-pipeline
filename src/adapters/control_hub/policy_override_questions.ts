import type { PolicyOverrideMode, PolicyOverrideScope, PolicyOverrideWhitelistEntry } from "./policy_override_types";

export function getScopeClarifyingQuestion(entry: PolicyOverrideWhitelistEntry): string {
  return `你说的“${entry.phrase}”是只针对当前这一条，还是当前项目 / 全局后的默认规则？`;
}

export function getModeClarifyingQuestion(entry: PolicyOverrideWhitelistEntry): string {
  return `你说的“${entry.phrase}”是这次临时生效，还是想沉淀成以后默认规则？`;
}

export function getCombinedClarifyingQuestion(entry: PolicyOverrideWhitelistEntry): string {
  return `你说的“${entry.phrase}”是当前这一条临时处理，还是要作为当前项目 / 全局的默认规则？`;
}

export function getConflictClarifyingQuestion(entry: PolicyOverrideWhitelistEntry): string {
  return `“${entry.phrase}”和现有偏好可能冲突，要按这次临时覆盖，还是保持原默认规则？`;
}

export function pickClarifyingQuestion(args: {
  entry: PolicyOverrideWhitelistEntry;
  scope: PolicyOverrideScope;
  overrideMode: PolicyOverrideMode;
  hasPreferenceConflict: boolean;
}): string | null {
  const { entry, scope, overrideMode, hasPreferenceConflict } = args;

  if (hasPreferenceConflict) {
    return getConflictClarifyingQuestion(entry);
  }

  if (scope === "unknown" && overrideMode === "unknown") {
    return getCombinedClarifyingQuestion(entry);
  }

  if (scope === "unknown") {
    return getScopeClarifyingQuestion(entry);
  }

  if (overrideMode === "unknown") {
    return getModeClarifyingQuestion(entry);
  }

  return null;
}
