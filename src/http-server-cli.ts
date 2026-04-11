#!/usr/bin/env node

import { USER_REGISTRY_PATH } from "./habit_registry/user_registry";
import {
  DEFAULT_HTTP_HOST,
  DEFAULT_HTTP_MAX_BODY_BYTES,
  DEFAULT_HTTP_PORT,
  createHttpServer,
  handleInterpretRequest,
  handleManageRequest,
  handleSuggestRequest,
  parseJsonBody,
  routeHttpRequest,
  type HttpServerOptions
} from "./http_server";

export interface HttpServerCliArgs {
  help: boolean;
  host: string;
  port: number;
  registryPath: string;
  maxBodyBytes: number;
}

export const DEFAULT_HOST = DEFAULT_HTTP_HOST;
export const DEFAULT_PORT = DEFAULT_HTTP_PORT;
export const DEFAULT_MAX_BODY_BYTES = DEFAULT_HTTP_MAX_BODY_BYTES;

export function parseArgs(argv: string[]): HttpServerCliArgs {
  const parsed: HttpServerCliArgs = {
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

export function getUsageText(): string {
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

function printUsageAndExit(code: number, stream: NodeJS.WriteStream = process.stdout): never {
  stream.write(`${getUsageText()}\n`);
  process.exit(code);
}

export function validateArgs(args: HttpServerCliArgs): void {
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

export function main(argv: string[] = process.argv.slice(2)): void {
  const args = parseArgs(argv);
  if (args.help) {
    printUsageAndExit(0, process.stdout);
  }

  validateArgs(args);
  const server = createHttpServer(args as HttpServerOptions);

  server.listen(args.port, args.host, () => {
    process.stdout.write(
      `user-habit-pipeline HTTP server listening on http://${args.host}:${args.port}\n`
    );
  });
}

if (require.main === module) {
  main();
}

export {
  createHttpServer as createServer,
  handleInterpretRequest as handleInterpret,
  handleManageRequest as handleManage,
  handleSuggestRequest as handleSuggest,
  parseJsonBody,
  routeHttpRequest as routeRequest
};
