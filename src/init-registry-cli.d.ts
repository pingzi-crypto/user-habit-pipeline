#!/usr/bin/env node
export interface InitRegistryCliArgs {
    outDir: string | null;
    force: boolean;
    help: boolean;
}
interface WriteTemplateFilesResult {
    ok: true;
    out_dir: string;
    files: string[];
}
export declare function parseArgs(argv: string[]): InitRegistryCliArgs;
export declare function getUsageText(): string;
export declare function validateArgs(args: InitRegistryCliArgs): void;
export declare function writeTemplateFiles(outDir: string, force?: boolean): WriteTemplateFilesResult;
export declare function main(argv?: string[]): void;
export {};
