import type { CandidateRule, HabitInput, ScoredCandidate } from "./types";
export declare const SCENARIO_BONUS = 0.05;
export declare const CONTEXT_BONUS = 0.05;
export declare const DEFAULT_CLARIFY_BELOW = 0.75;
export declare const AMBIGUITY_GAP = 0.08;
export declare function scoreCandidate(candidate: CandidateRule, input: HabitInput): ScoredCandidate;
export declare function shouldAskClarifyingQuestion(topCandidate?: ScoredCandidate, secondCandidate?: ScoredCandidate): boolean;
