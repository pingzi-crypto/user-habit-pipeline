#!/usr/bin/env node
type StructuredAction = "add" | "remove" | "list" | "suggest" | "apply-candidate" | "ignore-candidate" | "export" | "import" | "ignore-phrase";
export interface ManageCliArgs {
    action: StructuredAction | null;
    phrase: string | null;
    intent: string | null;
    candidateRef: string | null;
    filePath: string | null;
    transcriptPath: string | null;
    suggestionsPath: string | null;
    mode: string | null;
    maxCandidates: number;
    scenario: string[];
    confidence: string | number | null;
    registryPath: string;
    request: string | null;
    requestFromStdin: boolean;
    transcriptFromStdin: boolean;
    suggestionsFromStdin: boolean;
    help: boolean;
}
type ManageCliOutput = Record<string, unknown>;
export declare function parseArgs(argv: string[]): ManageCliArgs;
export declare function getUsageText(): string;
export declare function executeStructuredAction(args: ManageCliArgs): ManageCliOutput;
export declare function executeRequestAction(args: ManageCliArgs): ManageCliOutput;
export declare function main(argv?: string[]): void;
export {};
