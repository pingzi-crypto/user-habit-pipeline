import type { ExternalMemorySignal, HabitInput, HabitOutput, InterpretHabitOptions, MemoryConflictDecision, InterpretedPreActionResult, PreActionDecision } from "./habit_core/types";
export declare function buildPreActionDecision(result: HabitOutput): PreActionDecision;
export declare function buildMemoryConflictDecision(preActionDecision: PreActionDecision, externalMemorySignal?: ExternalMemorySignal | null): MemoryConflictDecision;
export declare function interpretHabitForPreAction(input: HabitInput, options?: InterpretHabitOptions): InterpretedPreActionResult;
