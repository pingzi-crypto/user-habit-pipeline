import type { HabitInput, HabitOutput, InterpretHabitOptions, InterpretedPreActionResult, PreActionDecision } from "./habit_core/types";
export declare function buildPreActionDecision(result: HabitOutput): PreActionDecision;
export declare function interpretHabitForPreAction(input: HabitInput, options?: InterpretHabitOptions): InterpretedPreActionResult;
