import fs = require("node:fs");
import http = require("node:http");
import os = require("node:os");
import path = require("node:path");
import { randomUUID } from "node:crypto";
import type {
  ExternalMemorySignal,
  HabitOutput,
  MemoryConflictDecision,
  PreActionDecision
} from "./habit_core/types";
import { interpretHabit } from "./habit_core/interpreter";
import { buildMemoryConflictDecision, buildPreActionDecision } from "./pre_action_gate";
import {
  USER_REGISTRY_PATH,
  resolveDefaultUserRegistryPath
} from "./habit_registry/user_registry";
import { saveSuggestionSnapshot } from "./session_suggestions/cache";

const { executeRequestAction } = require("./manage-habits-cli") as {
  executeRequestAction: (args: ManageRequestArgs) => unknown;
};
const {
  DEFAULT_MAX_CANDIDATES,
  suggestSessionHabitCandidates
} = require("./session_suggestions/extract_candidates") as {
  DEFAULT_MAX_CANDIDATES: number;
  suggestSessionHabitCandidates: (
    transcript: string,
    options: { userRegistryPath: string; maxCandidates: number }
  ) => SuggestResponsePayload;
};

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

interface ManageRequestArgs {
  request: string;
  registryPath: string;
  transcriptPath: string | null;
  transcriptFromStdin: boolean;
  suggestionsPath: string | null;
  suggestionsFromStdin: boolean;
  filePath: string | null;
  mode: string | null;
  maxCandidates: number;
  scenario: string[];
  confidence: unknown;
  intent: string | null;
}

export interface StartHttpServerResult {
  server: http.Server;
  host: string;
  port: number;
  url: string;
  registryPath: string;
  maxBodyBytes: number;
}

export const DEFAULT_HTTP_HOST = process.env.UHP_HTTP_HOST || "127.0.0.1";
export const DEFAULT_HTTP_PORT = Number(process.env.UHP_HTTP_PORT || 4848);
export const DEFAULT_HTTP_MAX_BODY_BYTES = Number(process.env.UHP_HTTP_MAX_BODY_BYTES || 1024 * 1024);

function writeJson(response: http.ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

function writeError(response: http.ServerResponse, statusCode: number, error: unknown): void {
  writeJson(response, statusCode, {
    ok: false,
    error: {
      message: error instanceof Error ? error.message : String(error)
    }
  });
}

export function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,，]/u)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function parseJsonBody(
  request: http.IncomingMessage,
  maxBodyBytes: number = DEFAULT_HTTP_MAX_BODY_BYTES
): Promise<JsonObject> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    request.on("data", (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBodyBytes) {
        reject(new Error(`Request body exceeds ${maxBodyBytes} bytes.`));
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on("end", () => {
      const text = Buffer.concat(chunks).toString("utf8").trim();
      if (!text) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(text) as JsonObject);
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });

    request.on("error", reject);
  });
}

async function withTemporaryFile<T>(
  value: unknown,
  extension: string,
  handler: (filePath: string | null) => Promise<T> | T
): Promise<T> {
  if (value === undefined || value === null) {
    return handler(null);
  }

  const filePath = path.join(
    os.tmpdir(),
    `user-habit-pipeline-${process.pid}-${randomUUID()}${extension}`
  );

  const content = typeof value === "string"
    ? value
    : `${JSON.stringify(value, null, 2)}\n`;

  fs.writeFileSync(filePath, content, "utf8");

  try {
    return await handler(filePath);
  } finally {
    try {
      fs.rmSync(filePath, { force: true });
    } catch {
      // Best-effort cleanup only.
    }
  }
}

export function resolveHttpRegistryPath(body: JsonObject, options: HttpServerOptions = {}): string {
  const registryPath = body.user_registry_path || body.registry_path || options.registryPath || USER_REGISTRY_PATH;
  return String(registryPath);
}

export function normalizeHttpServerOptions(options: HttpServerOptions = {}): NormalizedHttpServerOptions {
  return {
    host: options.host || DEFAULT_HTTP_HOST,
    port: options.port === undefined ? DEFAULT_HTTP_PORT : options.port,
    registryPath: options.registryPath || USER_REGISTRY_PATH,
    maxBodyBytes: options.maxBodyBytes === undefined
      ? DEFAULT_HTTP_MAX_BODY_BYTES
      : options.maxBodyBytes
  };
}

export function handleInterpretRequest(body: JsonObject, options: HttpServerOptions = {}): {
  ok: true;
  result: HabitOutput;
  pre_action_decision: PreActionDecision;
  memory_conflict_decision?: MemoryConflictDecision;
} {
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    throw new Error("POST /interpret requires a non-empty message.");
  }

  const result = interpretHabit(
    {
      message,
      scenario: typeof body.scenario === "string" ? body.scenario : null,
      recent_context: normalizeStringArray(body.recent_context)
    },
    {
      userRegistryPath: resolveHttpRegistryPath(body, options),
      includeUserRegistry: body.include_user_registry !== false
    }
  );

  const preActionDecision = buildPreActionDecision(result);
  const response: {
    ok: true;
    result: HabitOutput;
    pre_action_decision: PreActionDecision;
    memory_conflict_decision?: MemoryConflictDecision;
  } = {
    ok: true,
    result,
    pre_action_decision: preActionDecision
  };

  if (body.external_memory_signal && typeof body.external_memory_signal === "object") {
    response.memory_conflict_decision = buildMemoryConflictDecision(
      preActionDecision,
      body.external_memory_signal as ExternalMemorySignal
    );
  }

  return response;
}

export function handleSuggestRequest(body: JsonObject, options: HttpServerOptions = {}): {
  ok: true;
  action: "suggest";
  registry_path: string;
  suggestions_cache_path: string;
  candidate_count: number;
  transcript_stats: Record<string, unknown>;
  candidates: Array<Record<string, unknown>>;
} {
  const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
  if (!transcript) {
    throw new Error("POST /suggest requires a non-empty transcript.");
  }

  const registryPath = resolveHttpRegistryPath(body, options);
  const rawMaxCandidates = body.max_candidates === undefined
    ? DEFAULT_MAX_CANDIDATES
    : Number(body.max_candidates);
  const maxCandidates = Number.isFinite(rawMaxCandidates)
    ? Math.max(1, Math.trunc(rawMaxCandidates))
    : DEFAULT_MAX_CANDIDATES;

  const result = suggestSessionHabitCandidates(transcript, {
    userRegistryPath: registryPath,
    maxCandidates
  });

  const suggestionsCachePath = saveSuggestionSnapshot(result, registryPath);

  return {
    ok: true,
    action: "suggest",
    registry_path: registryPath,
    suggestions_cache_path: suggestionsCachePath,
    candidate_count: result.candidates.length,
    transcript_stats: result.transcript_stats,
    candidates: result.candidates
  };
}

export async function handleManageRequest(
  body: JsonObject,
  options: HttpServerOptions = {}
): Promise<{ ok: true; result: unknown }> {
  const request = typeof body.request === "string" ? body.request.trim() : "";
  if (!request) {
    throw new Error("POST /manage requires a non-empty request.");
  }

  return withTemporaryFile(body.transcript, ".txt", async (transcriptPath) => (
    withTemporaryFile(body.suggestions, ".json", async (suggestionsPath) => {
      const rawMaxCandidates = body.max_candidates === undefined
        ? DEFAULT_MAX_CANDIDATES
        : Number(body.max_candidates);
      const maxCandidates = Number.isFinite(rawMaxCandidates)
        ? Math.max(1, Math.trunc(rawMaxCandidates))
        : DEFAULT_MAX_CANDIDATES;

      const result = executeRequestAction({
        request,
        registryPath: resolveHttpRegistryPath(body, options),
        transcriptPath,
        transcriptFromStdin: false,
        suggestionsPath,
        suggestionsFromStdin: false,
        filePath: typeof body.file_path === "string" ? body.file_path : null,
        mode: typeof body.mode === "string" ? body.mode : null,
        maxCandidates,
        scenario: normalizeStringArray(body.scenario),
        confidence: body.confidence ?? null,
        intent: typeof body.intent === "string" ? body.intent : null
      });

      return {
        ok: true,
        result
      };
    })
  ));
}

export async function routeHttpRequest(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  options: HttpServerOptions = {}
): Promise<void> {
  const normalizedOptions = normalizeHttpServerOptions(options);
  const requestUrl = new URL(request.url || "/", `http://${normalizedOptions.host}`);
  const pathname = requestUrl.pathname;

  if (request.method === "OPTIONS") {
    writeJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && pathname === "/health") {
    writeJson(response, 200, {
      ok: true,
      service: "user-habit-pipeline-http",
      host: normalizedOptions.host,
      port: normalizedOptions.port,
      user_registry_path: normalizedOptions.registryPath || resolveDefaultUserRegistryPath(),
      default_user_registry_path: resolveDefaultUserRegistryPath(),
      endpoints: [
        "GET /health",
        "POST /interpret",
        "POST /suggest",
        "POST /manage"
      ]
    });
    return;
  }

  if (request.method !== "POST") {
    writeError(response, 404, "Route not found.");
    return;
  }

  const body = await parseJsonBody(request, normalizedOptions.maxBodyBytes);

  if (pathname === "/interpret") {
    writeJson(response, 200, handleInterpretRequest(body, normalizedOptions));
    return;
  }

  if (pathname === "/suggest") {
    writeJson(response, 200, handleSuggestRequest(body, normalizedOptions));
    return;
  }

  if (pathname === "/manage") {
    writeJson(response, 200, await handleManageRequest(body, normalizedOptions));
    return;
  }

  writeError(response, 404, "Route not found.");
}

export function createHttpServer(options: HttpServerOptions = {}): http.Server {
  const normalizedOptions = normalizeHttpServerOptions(options);

  return http.createServer((request, response) => {
    routeHttpRequest(request, response, normalizedOptions).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      const statusCode = /requires|must|exceeds|valid JSON|not found/u.test(message) ? 400 : 500;
      writeError(response, statusCode, error);
    });
  });
}

export function startHttpServer(options: HttpServerOptions = {}): Promise<StartHttpServerResult> {
  const normalizedOptions = normalizeHttpServerOptions(options);
  const server = createHttpServer(normalizedOptions);

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(normalizedOptions.port, normalizedOptions.host, () => {
      server.off("error", reject);
      const address = server.address();
      const resolvedPort = typeof address === "object" && address ? address.port : normalizedOptions.port;

      resolve({
        server,
        host: normalizedOptions.host,
        port: resolvedPort,
        url: `http://${normalizedOptions.host}:${resolvedPort}`,
        registryPath: normalizedOptions.registryPath,
        maxBodyBytes: normalizedOptions.maxBodyBytes
      });
    });
  });
}
