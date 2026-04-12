#!/usr/bin/env node
export interface InitConsumerCliArgs {
    host: string | null;
    outDir: string | null;
    force: boolean;
    help: boolean;
}
interface WriteConsumerTemplateResult {
    ok: true;
    host: "node" | "python";
    out_dir: string;
    files: string[];
}
export declare function parseArgs(argv: string[]): InitConsumerCliArgs;
export declare function getUsageText(): string;
export declare function validateArgs(args: InitConsumerCliArgs): void;
export declare function writeConsumerTemplateFiles(host: string, outDir: string, force?: boolean): WriteConsumerTemplateResult;
export declare function main(argv?: string[]): void;
export {};
