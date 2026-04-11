import type { HabitRule } from "./types";

const CONTEXT_SUPPORT = {
  continue_current_track: [
    "评审",
    "review",
    "reviewer",
    "executor",
    "执行",
    "当前",
    "current",
    "track"
  ],
  move_to_next_item: [
    "状态板",
    "board",
    "item",
    "queue",
    "队列",
    "任务",
    "active"
  ],
  close_session: [
    "总结",
    "session",
    "收尾",
    "wrap",
    "close",
    "关闭"
  ]
} as const;

export function normalizeText(value: string | null | undefined): string {
  return String(value || "").trim().toLowerCase();
}

export function hasRecentContextSupport(rule: HabitRule, recentContext?: string[]): boolean {
  if (!Array.isArray(recentContext) || recentContext.length === 0) {
    return false;
  }

  const keywords = CONTEXT_SUPPORT[rule.normalized_intent as keyof typeof CONTEXT_SUPPORT] || [];
  if (keywords.length === 0) {
    return false;
  }

  const normalizedContext = recentContext
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .join(" ");

  return keywords.some((keyword) => normalizedContext.includes(normalizeText(keyword)));
}
