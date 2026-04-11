#!/usr/bin/env node
export declare const EXAMPLES_FIXTURE_PATH: string;
export declare const EXAMPLES_DOC_PATH: string;
interface ExampleInput {
    message?: string;
    scenario?: string;
    recent_context?: string[];
}
interface ExampleExpected {
    normalized_intent?: string;
    top_phrase?: string;
    should_ask_clarifying_question?: boolean;
    confidence_gt?: number;
    confidence_lt?: number;
}
interface ExampleFixture {
    input: ExampleInput;
    expected: ExampleExpected;
    why: string;
}
export declare function renderExamplesDoc(fixtures: ExampleFixture[]): string;
export declare function main(argv?: string[]): void;
export {};
