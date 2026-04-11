#!/usr/bin/env node
import { createHttpServer, handleInterpretRequest, handleManageRequest, handleSuggestRequest, parseJsonBody, routeHttpRequest } from "./http_server";
export interface HttpServerCliArgs {
    help: boolean;
    host: string;
    port: number;
    registryPath: string;
    maxBodyBytes: number;
}
export declare const DEFAULT_HOST: string;
export declare const DEFAULT_PORT: number;
export declare const DEFAULT_MAX_BODY_BYTES: number;
export declare function parseArgs(argv: string[]): HttpServerCliArgs;
export declare function getUsageText(): string;
export declare function validateArgs(args: HttpServerCliArgs): void;
export declare function main(argv?: string[]): void;
export { createHttpServer as createServer, handleInterpretRequest as handleInterpret, handleManageRequest as handleManage, handleSuggestRequest as handleSuggest, parseJsonBody, routeHttpRequest as routeRequest };
