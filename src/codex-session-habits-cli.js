#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { USER_REGISTRY_PATH } = require("./habit_registry/user_registry");
const { parseHabitManagementRequest } = require("./habit_registry/management_prompt");
const {
  DEFAULT_MAX_CANDIDATES
} = require("./session_suggestions/extract_candidates");

const MANAGE_HABITS_CLI_PATH = path.join(__dirname, "manage-habits-cli.js");

function parseArgs(argv) {
  const parsed = {
    help: false,
    maxCandidates: DEFAULT_MAX_CANDIDATES,
    registryPath: USER_REGISTRY_PATH,
    request: null,
    threadFromStdin: false,
    threadPath: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--request") {
      parsed.request = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--thread") {
      parsed.threadPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--thread-stdin") {
      parsed.threadFromStdin = true;
      continue;
    }

    if (token === "--user-registry") {
      parsed.registryPath = argv[index + 1] ?? USER_REGISTRY_PATH;
      index += 1;
      continue;
    }

    if (token === "--max-candidates") {
      parsed.maxCandidates = Number(argv[index + 1] ?? DEFAULT_MAX_CANDIDATES);
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
    "Usage: codex-session-habits --request <text> [--thread <path> | --thread-stdin] [--max-candidates <n>] [--user-registry <path>]",
    "",
    "Examples:",
    "  codex-session-habits --request \"扫描这次会话里的习惯候选\" --thread .\\data\\thread.txt",
    "  codex-session-habits --request \"添加第1条\"",
    "  codex-session-habits --request \"把第1条加到 session_close 场景\"",
    "  @'\nuser: 以后我说“收尾一下”就是 close_session\nassistant: 收到。\nuser: 收尾一下\n'@ | codex-session-habits --request \"扫描这次会话里的习惯候选\" --thread-stdin",
    "",
    "Behavior:",
    "  - forwards lightweight management prompts into manage-habits-cli.js",
    "  - uses --thread / --thread-stdin only for current-session suggestion scans",
    "  - relies on the latest local suggestion cache for short follow-up apply requests",
    "",
    "Options:",
    "  --request <text>         Prompt-style habit management request.",
    "  --thread <path>          Session transcript file for current-session suggestion scans.",
    "  --thread-stdin          Read the session transcript from stdin for current-session scans.",
    `  --max-candidates <n>    Maximum suggestion candidates to return. Default: ${DEFAULT_MAX_CANDIDATES}.`,
    `  --user-registry <path>  Optional user registry path. Default: ${path.relative(process.cwd(), USER_REGISTRY_PATH) || USER_REGISTRY_PATH}`,
    "  --help, -h               Show this help text."
  ].join("\n");
}

function printUsageAndExit(exitCode = 1, stream = process.stderr) {
  stream.write(`${getUsageText()}\n`);
  process.exit(exitCode);
}

function validateArgs(args) {
  if (!args.request) {
    throw new Error("--request is required.");
  }

  if (args.threadFromStdin && args.threadPath) {
    throw new Error("Use only one thread source: --thread <path> or --thread-stdin.");
  }

  const parsedRequest = parseHabitManagementRequest(args.request);
  if (!parsedRequest) {
    throw new Error("Unable to parse habit management request.");
  }

  if (parsedRequest.action === "suggest" && !args.threadFromStdin && !args.threadPath) {
    throw new Error("Current-session suggestion scans require --thread <path> or --thread-stdin.");
  }
}

function forwardToManageHabits(args) {
  const commandArgs = [
    MANAGE_HABITS_CLI_PATH,
    "--request",
    args.request,
    "--user-registry",
    args.registryPath
  ];

  if (Number.isFinite(args.maxCandidates)) {
    commandArgs.push("--max-candidates", String(Math.max(1, Math.trunc(args.maxCandidates))));
  }

  let stdinInput;

  if (args.threadFromStdin) {
    stdinInput = fs.readFileSync(0, "utf8");
    const trimmed = String(stdinInput || "").trim();

    if (!trimmed) {
      throw new Error("--thread-stdin requires non-empty stdin input.");
    }

    commandArgs.push("--transcript-stdin");
  }

  if (args.threadPath) {
    commandArgs.push("--transcript", args.threadPath);
  }

  const result = spawnSync(process.execPath, commandArgs, {
    input: stdinInput,
    encoding: "utf8"
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  process.exit(result.status ?? 1);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsageAndExit(0, process.stdout);
  }

  validateArgs(args);
  forwardToManageHabits(args);
}

if (require.main === module) {
  main();
}

module.exports = {
  forwardToManageHabits,
  getUsageText,
  main,
  parseArgs,
  validateArgs
};
