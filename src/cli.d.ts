#!/usr/bin/env node
export interface InterpretCliArgs {
    message: string | null;
    scenario: string | null;
    recent_context: string[];
    adapter: string | null;
    registryPath: string | null;
    userRegistryPath: string;
    preAction: boolean;
    externalMemoryIntent: string | null;
    externalMemorySource: string | null;
    externalMemoryConfidence: number | null;
    help: boolean;
}
export declare function parseArgs(argv: string[]): InterpretCliArgs;
export declare function getUsageText(): string;
export declare function main(argv?: string[]): void;
