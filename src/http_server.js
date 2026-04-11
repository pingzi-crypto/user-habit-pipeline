"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_HTTP_MAX_BODY_BYTES = exports.DEFAULT_HTTP_PORT = exports.DEFAULT_HTTP_HOST = void 0;
exports.normalizeStringArray = normalizeStringArray;
exports.parseJsonBody = parseJsonBody;
exports.resolveHttpRegistryPath = resolveHttpRegistryPath;
exports.normalizeHttpServerOptions = normalizeHttpServerOptions;
exports.handleInterpretRequest = handleInterpretRequest;
exports.handleSuggestRequest = handleSuggestRequest;
exports.handleManageRequest = handleManageRequest;
exports.routeHttpRequest = routeHttpRequest;
exports.createHttpServer = createHttpServer;
exports.startHttpServer = startHttpServer;
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const node_crypto_1 = require("node:crypto");
const interpreter_1 = require("./habit_core/interpreter");
const user_registry_1 = require("./habit_registry/user_registry");
const cache_1 = require("./session_suggestions/cache");
const { executeRequestAction } = require("./manage-habits-cli");
const { DEFAULT_MAX_CANDIDATES, suggestSessionHabitCandidates } = require("./session_suggestions/extract_candidates");
exports.DEFAULT_HTTP_HOST = process.env.UHP_HTTP_HOST || "127.0.0.1";
exports.DEFAULT_HTTP_PORT = Number(process.env.UHP_HTTP_PORT || 4848);
exports.DEFAULT_HTTP_MAX_BODY_BYTES = Number(process.env.UHP_HTTP_MAX_BODY_BYTES || 1024 * 1024);
function writeJson(response, statusCode, payload) {
    response.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
    });
    response.end(`${JSON.stringify(payload, null, 2)}\n`);
}
function writeError(response, statusCode, error) {
    writeJson(response, statusCode, {
        ok: false,
        error: {
            message: error instanceof Error ? error.message : String(error)
        }
    });
}
function normalizeStringArray(value) {
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
function parseJsonBody(request, maxBodyBytes = exports.DEFAULT_HTTP_MAX_BODY_BYTES) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let totalBytes = 0;
        request.on("data", (chunk) => {
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
                resolve(JSON.parse(text));
            }
            catch {
                reject(new Error("Request body must be valid JSON."));
            }
        });
        request.on("error", reject);
    });
}
async function withTemporaryFile(value, extension, handler) {
    if (value === undefined || value === null) {
        return handler(null);
    }
    const filePath = path.join(os.tmpdir(), `user-habit-pipeline-${process.pid}-${(0, node_crypto_1.randomUUID)()}${extension}`);
    const content = typeof value === "string"
        ? value
        : `${JSON.stringify(value, null, 2)}\n`;
    fs.writeFileSync(filePath, content, "utf8");
    try {
        return await handler(filePath);
    }
    finally {
        try {
            fs.rmSync(filePath, { force: true });
        }
        catch {
            // Best-effort cleanup only.
        }
    }
}
function resolveHttpRegistryPath(body, options = {}) {
    const registryPath = body.user_registry_path || body.registry_path || options.registryPath || user_registry_1.USER_REGISTRY_PATH;
    return String(registryPath);
}
function normalizeHttpServerOptions(options = {}) {
    return {
        host: options.host || exports.DEFAULT_HTTP_HOST,
        port: options.port === undefined ? exports.DEFAULT_HTTP_PORT : options.port,
        registryPath: options.registryPath || user_registry_1.USER_REGISTRY_PATH,
        maxBodyBytes: options.maxBodyBytes === undefined
            ? exports.DEFAULT_HTTP_MAX_BODY_BYTES
            : options.maxBodyBytes
    };
}
function handleInterpretRequest(body, options = {}) {
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) {
        throw new Error("POST /interpret requires a non-empty message.");
    }
    const result = (0, interpreter_1.interpretHabit)({
        message,
        scenario: typeof body.scenario === "string" ? body.scenario : null,
        recent_context: normalizeStringArray(body.recent_context)
    }, {
        userRegistryPath: resolveHttpRegistryPath(body, options),
        includeUserRegistry: body.include_user_registry !== false
    });
    return {
        ok: true,
        result
    };
}
function handleSuggestRequest(body, options = {}) {
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
    const suggestionsCachePath = (0, cache_1.saveSuggestionSnapshot)(result, registryPath);
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
async function handleManageRequest(body, options = {}) {
    const request = typeof body.request === "string" ? body.request.trim() : "";
    if (!request) {
        throw new Error("POST /manage requires a non-empty request.");
    }
    return withTemporaryFile(body.transcript, ".txt", async (transcriptPath) => (withTemporaryFile(body.suggestions, ".json", async (suggestionsPath) => {
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
    })));
}
async function routeHttpRequest(request, response, options = {}) {
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
            user_registry_path: normalizedOptions.registryPath || (0, user_registry_1.resolveDefaultUserRegistryPath)(),
            default_user_registry_path: (0, user_registry_1.resolveDefaultUserRegistryPath)(),
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
function createHttpServer(options = {}) {
    const normalizedOptions = normalizeHttpServerOptions(options);
    return http.createServer((request, response) => {
        routeHttpRequest(request, response, normalizedOptions).catch((error) => {
            const message = error instanceof Error ? error.message : String(error);
            const statusCode = /requires|must|exceeds|valid JSON|not found/u.test(message) ? 400 : 500;
            writeError(response, statusCode, error);
        });
    });
}
function startHttpServer(options = {}) {
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
