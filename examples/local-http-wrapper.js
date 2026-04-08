#!/usr/bin/env node

const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const {
  USER_REGISTRY_PATH,
  interpretHabit,
  resolveDefaultUserRegistryPath,
  saveSuggestionSnapshot,
  suggestSessionHabitCandidates
} = require("../src");
const { executeRequestAction } = require("../src/manage-habits-cli");

const DEFAULT_HOST = process.env.UHP_HTTP_HOST || "127.0.0.1";
const DEFAULT_PORT = Number(process.env.UHP_HTTP_PORT || 4848);
const MAX_BODY_BYTES = Number(process.env.UHP_HTTP_MAX_BODY_BYTES || 1024 * 1024);

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

function parseJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;

    request.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > MAX_BODY_BYTES) {
        reject(new Error(`Request body exceeds ${MAX_BODY_BYTES} bytes.`));
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

function getRegistryPath(body) {
  return body.user_registry_path || body.registry_path || USER_REGISTRY_PATH;
}

function handleInterpret(body) {
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
      userRegistryPath: getRegistryPath(body),
      includeUserRegistry: body.include_user_registry !== false
    }
  );

  return {
    ok: true,
    result
  };
}

function handleSuggest(body) {
  const transcript = typeof body.transcript === "string" ? body.transcript.trim() : "";
  if (!transcript) {
    throw new Error("POST /suggest requires a non-empty transcript.");
  }

  const registryPath = getRegistryPath(body);
  const maxCandidates = Number.isFinite(Number(body.max_candidates))
    ? Math.max(1, Math.trunc(Number(body.max_candidates)))
    : undefined;

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

async function handleManage(body) {
  const request = typeof body.request === "string" ? body.request.trim() : "";
  if (!request) {
    throw new Error("POST /manage requires a non-empty request.");
  }

  return withTemporaryFile(body.transcript, ".txt", async (transcriptPath) => (
    withTemporaryFile(body.suggestions, ".json", async (suggestionsPath) => {
      const result = executeRequestAction({
        request,
        registryPath: getRegistryPath(body),
        transcriptPath,
        transcriptFromStdin: false,
        suggestionsPath,
        suggestionsFromStdin: false,
        filePath: body.file_path || null,
        mode: body.mode || null,
        maxCandidates: Number.isFinite(Number(body.max_candidates))
          ? Number(body.max_candidates)
          : undefined,
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

async function routeRequest(request, response) {
  if (request.method === "OPTIONS") {
    writeJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && request.url === "/health") {
    writeJson(response, 200, {
      ok: true,
      service: "user-habit-pipeline-local-http-wrapper",
      host: DEFAULT_HOST,
      port: DEFAULT_PORT,
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

  const body = await parseJsonBody(request);

  if (request.url === "/interpret") {
    writeJson(response, 200, handleInterpret(body));
    return;
  }

  if (request.url === "/suggest") {
    writeJson(response, 200, handleSuggest(body));
    return;
  }

  if (request.url === "/manage") {
    writeJson(response, 200, await handleManage(body));
    return;
  }

  writeError(response, 404, "Route not found.");
}

function main() {
  const server = http.createServer((request, response) => {
    routeRequest(request, response).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      const statusCode = /requires|must|exceeds|valid JSON|not found/u.test(message) ? 400 : 500;
      writeError(response, statusCode, error);
    });
  });

  server.listen(DEFAULT_PORT, DEFAULT_HOST, () => {
    process.stdout.write(
      `user-habit-pipeline local HTTP wrapper listening on http://${DEFAULT_HOST}:${DEFAULT_PORT}\n`
    );
  });
}

if (require.main === module) {
  main();
}

module.exports = {
  handleInterpret,
  handleManage,
  handleSuggest,
  main,
  parseJsonBody,
  routeRequest
};
