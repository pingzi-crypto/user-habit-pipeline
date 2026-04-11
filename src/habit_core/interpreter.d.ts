import type { CandidateRule, HabitInput, HabitOutput, HabitRule, InterpretHabitOptions } from "./types";
export declare const DEFAULT_REGISTRY_PATH: string;
export declare function loadHabitsFromFile(registryPath: string): HabitRule[];
export declare function loadDefaultHabits(): HabitRule[];
export declare function createUnknownOutput(): HabitOutput;
export declare function findCandidateRules(message: string, rules: HabitRule[]): CandidateRule[];
export declare function interpretHabit(input: HabitInput, options?: InterpretHabitOptions): HabitOutput;
