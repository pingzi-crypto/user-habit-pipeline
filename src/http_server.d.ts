import http = require("node:http");
import type { HabitOutput, PreActionDecision } from "./habit_core/types";
export interface HttpServerOptions {
    host?: string;
    port?: number;
    registryPath?: string;
    maxBodyBytes?: number;
}
export interface NormalizedHttpServerOptions {
    host: string;
    port: number;
    registryPath: string;
    maxBodyBytes: number;
}
export interface SuggestResponsePayload {
    candidates: Array<Record<string, unknown>>;
    transcript_stats: Record<string, unknown>;
}
interface JsonObject {
    [key: string]: unknown;
}
export interface StartHttpServerResult {
    server: http.Server;
    host: string;
    port: number;
    url: string;
    registryPath: string;
    maxBodyBytes: number;
}
export declare const DEFAULT_HTTP_HOST: string;
export declare const DEFAULT_HTTP_PORT: number;
export declare const DEFAULT_HTTP_MAX_BODY_BYTES: number;
export declare function normalizeStringArray(value: unknown): string[];
export declare function parseJsonBody(request: http.IncomingMessage, maxBodyBytes?: number): Promise<JsonObject>;
export declare function resolveHttpRegistryPath(body: JsonObject, options?: HttpServerOptions): string;
export declare function normalizeHttpServerOptions(options?: HttpServerOptions): NormalizedHttpServerOptions;
export declare function handleInterpretRequest(body: JsonObject, options?: HttpServerOptions): {
    ok: true;
    result: HabitOutput;
    pre_action_decision: PreActionDecision;
};
export declare function handleSuggestRequest(body: JsonObject, options?: HttpServerOptions): {
    ok: true;
    action: "suggest";
    registry_path: string;
    suggestions_cache_path: string;
    candidate_count: number;
    transcript_stats: Record<string, unknown>;
    candidates: Array<Record<string, unknown>>;
};
export declare function handleManageRequest(body: JsonObject, options?: HttpServerOptions): Promise<{
    ok: true;
    result: unknown;
}>;
export declare function routeHttpRequest(request: http.IncomingMessage, response: http.ServerResponse, options?: HttpServerOptions): Promise<void>;
export declare function createHttpServer(options?: HttpServerOptions): http.Server;
export declare function startHttpServer(options?: HttpServerOptions): Promise<StartHttpServerResult>;
export {};
