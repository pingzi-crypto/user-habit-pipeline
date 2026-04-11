import type { HabitRule } from "./types";
export declare function normalizeText(value: string | null | undefined): string;
export declare function hasRecentContextSupport(rule: HabitRule, recentContext?: string[]): boolean;
