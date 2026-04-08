#!/usr/bin/env node

const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { interpretHabit } = require("./habit_core/interpreter");
const {
  USER_REGISTRY_PATH,
  resolveDefaultUserRegistryPath
} = require("./habit_registry/user_registry");
const { executeRequestAction } = require("./manage-habits-cli");
const { saveSuggestionSnapshot } = require("./session_suggestions/cache");
const {
  DEFAULT_MAX_CANDIDATES,
  suggestSessionHabitCandidates
} = require("./session_suggestions/extract_candidates");

const DEFAULT_HOST = process.env.UHP_HTTP_HOST || "127.0.0.1";
const DEFAULT_PORT = Number(process.env.UHP_HTTP_PORT || 4848);
const DEFAULT_MAX_BODY_BYTES = Number(process.env.UHP_HTTP_MAX_BODY_BYTES || 1024 * 1024);

function parseArgs(argv) {
  const parsed = {
    help: false,
    host: DEFAULT_HOST,
    port: DEFAULT_PORT,
    registryPath: USER_REGISTRY_PATH,
    maxBodyBytes: DEFAULT_MAX_BODY_BYTES
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--host") {
      parsed.host = argv[index + 1] ?? DEFAULT_HOST;
      index += 1;
      continue;
    }

    if (token === "--port") {
      parsed.port = Number(argv[index + 1] ?? DEFAULT_PORT);
      index += 1;
      continue;
    }

    if (token === "--user-registry") {
      parsed.registryPath = argv[index + 1] ?? USER_REGISTRY_PATH;
      index += 1;
      continue;
    }

    if (token === "--max-body-bytes") {
      parsed.maxBodyBytes = Number(argv[index + 1] ?? DEFAULT_MAX_BODY_BYTES);
      index += 1;
      continue;
    }

    if (token === "--help" || token === "-h") {
      parsed.help = true;
    }
  }

  return parsed;
}

function getUsageText() {
  return [
    "Usage: user-habit-pipeline-http [--host <hostname>] [--port <number>] [--user-registry <path>] [--max-body-bytes <n>]",
    "",
    "Examples:",
    "  user-habit-pipeline-http",
    "  user-habit-pipeline-http --port 4848",
    "  user-habit-pipeline-http --host 127.0.0.1 --port 4848 --user-registry .\\data\\user_habits.json",
    "",
    "Environment:",
    "  UHP_HTTP_HOST            Default host when --host is not provided.",
    "  UHP_HTTP_PORT            Default port when --port is not provided.",
    "  UHP_HTTP_MAX_BODY_BYTES  Max accepted JSON body size in bytes."
  ].join("\n");
}

function printUsageAndExit(code, stream = process.stdout) {
  stream.write(`${getUsageText()}\n`);
  process.exit(code);
}

function validateArgs(args) {
  if (!args.host || !String(args.host).trim()) {
    throw new Error("--host requires a non-empty value.");
  }

  if (!Number.isInteger(args.port) || args.port < 1 || args.port > 65535) {
    throw new Error("--port must be an integer between 1 and 65535.");
  }

  if (!args.registryPath || !String(args.registryPath).trim()) {
    throw new Error("--user-registry requires a file path.");
  }

  if (!Number.isInteger(args.maxBodyBytes) || args.maxBodyBytes < 1) {
    throw new Error("--max-body-bytes must be a positive integer.");
  }
}

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

function parseJsonBody(request, maxBodyBytes = DEFAULT_MAX_BODY_BYTES) {
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
      } catch {
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

function getRegistryPath(body, options = {}) {
  return body.user_registry_path || body.registry_path || options.registryPath || USER_REGISTRY_PATH;
}

function handleInterpret(body, options = {}) {
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    throw new Error("POST /interpret requires a non-empty message.");
  }

  const result = interpretHabit(
    {
      message,
      scenario: body.scenario || null,
      recent_context: normalizeStringArray(body.recent_context)
    },
    {
      userRegistryPath: getRegistryPath(body, options),
      includeUserRegistry: body.include_user_registry !== false
    }
  );

  return {
    ok: true,
    result
  };
}

function handleSuggest(body, options = {}) {
  const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
  if (!transcript) {
    throw new Error("POST /suggest requires a non-empty transcript.");
  }

  const registryPath = getRegistryPath(body, options);
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

async function handleManage(body, options = {}) {
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
        registryPath: getRegistryPath(body, options),
        transcriptPath,
        transcriptFromStdin: false,
        suggestionsPath,
        suggestionsFromStdin: false,
        filePath: body.file_path || null,
        mode: body.mode || null,
        maxCandidates,
        scenario: normalizeStringArray(body.scenario),
        confidence: body.confidence ?? null,
        intent: body.intent || null
      });

      return {
        ok: true,
        result
      };
    })
  ));
}

async function routeRequest(request, response, options = {}) {
  const requestUrl = new URL(request.url || "/", `http://${options.host || DEFAULT_HOST}`);
  const pathname = requestUrl.pathname;

  if (request.method === "OPTIONS") {
    writeJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && pathname === "/health") {
    writeJson(response, 200, {
      ok: true,
      service: "user-habit-pipeline-http",
      host: options.host || DEFAULT_HOST,
      port: options.port || DEFAULT_PORT,
      user_registry_path: options.registryPath || resolveDefaultUserRegistryPath(),
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

  const body = await parseJsonBody(request, options.maxBodyBytes || DEFAULT_MAX_BODY_BYTES);

  if (pathname === "/interpret") {
    writeJson(response, 200, handleInterpret(body, options));
    return;
  }

  if (pathname === "/suggest") {
    writeJson(response, 200, handleSuggest(body, options));
    return;
  }

  if (pathname === "/manage") {
    writeJson(response, 200, await handleManage(body, options));
    return;
  }

  writeError(response, 404, "Route not found.");
}

function createServer(options = {}) {
  return http.createServer((request, response) => {
    routeRequest(request, response, options).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      const statusCode = /requires|must|exceeds|valid JSON|not found/u.test(message) ? 400 : 500;
      writeError(response, statusCode, error);
    });
  });
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    printUsageAndExit(0, process.stdout);
  }

  validateArgs(args);
  const server = createServer(args);

  server.listen(args.port, args.host, () => {
    process.stdout.write(
      `user-habit-pipeline HTTP server listening on http://${args.host}:${args.port}\n`
    );
  });
}

if (require.main === module) {
  main();
}

module.exports = {
  createServer,
  DEFAULT_HOST,
  DEFAULT_MAX_BODY_BYTES,
  DEFAULT_PORT,
  getUsageText,
  handleInterpret,
  handleManage,
  handleSuggest,
  main,
  parseArgs,
  parseJsonBody,
  routeRequest,
  validateArgs
};
