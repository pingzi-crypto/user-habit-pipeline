#!/usr/bin/env node

const {
  USER_REGISTRY_PATH
} = require("./habit_registry/user_registry");
const {
  DEFAULT_HTTP_HOST,
  DEFAULT_HTTP_MAX_BODY_BYTES,
  DEFAULT_HTTP_PORT,
  createHttpServer,
  handleInterpretRequest,
  handleManageRequest,
  handleSuggestRequest,
  parseJsonBody,
  routeHttpRequest
} = require("./http_server");

const DEFAULT_HOST = DEFAULT_HTTP_HOST;
const DEFAULT_PORT = DEFAULT_HTTP_PORT;
const DEFAULT_MAX_BODY_BYTES = DEFAULT_HTTP_MAX_BODY_BYTES;

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

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    printUsageAndExit(0, process.stdout);
  }

  validateArgs(args);
  const server = createHttpServer(args);

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
  createServer: createHttpServer,
  DEFAULT_HOST,
  DEFAULT_MAX_BODY_BYTES,
  DEFAULT_PORT,
  getUsageText,
  handleInterpret: handleInterpretRequest,
  handleManage: handleManageRequest,
  handleSuggest: handleSuggestRequest,
  main,
  parseArgs,
  parseJsonBody,
  routeRequest: routeHttpRequest,
  validateArgs
};
