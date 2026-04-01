#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const {
  USER_REGISTRY_PATH,
  addUserHabitRule,
  ensureUserRegistryFile,
  exportUserRegistryState,
  importUserRegistryState,
  loadUserRegistryState,
  removeUserHabitPhrase
} = require("./habit_registry/user_registry");
const { parseHabitManagementRequest } = require("./habit_registry/management_prompt");

function parseArgs(argv) {
  const parsed = {
    action: null,
    phrase: null,
    intent: null,
    filePath: null,
    mode: null,
    scenario: [],
    confidence: null,
    registryPath: USER_REGISTRY_PATH,
    request: null,
    requestFromStdin: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--add") {
      parsed.action = "add";
      continue;
    }

    if (token === "--remove") {
      parsed.action = "remove";
      continue;
    }

    if (token === "--list") {
      parsed.action = "list";
      continue;
    }

    if (token === "--export") {
      parsed.action = "export";
      parsed.filePath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--import") {
      parsed.action = "import";
      parsed.filePath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--phrase") {
      parsed.phrase = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--intent") {
      parsed.intent = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--scenario") {
      parsed.scenario = String(argv[index + 1] ?? "")
        .split(/[,，]/u)
        .map((item) => item.trim())
        .filter(Boolean);
      index += 1;
      continue;
    }

    if (token === "--confidence") {
      parsed.confidence = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--file") {
      parsed.filePath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--mode") {
      parsed.mode = argv[index + 1] ?? "replace";
      index += 1;
      continue;
    }

    if (token === "--user-registry") {
      parsed.registryPath = argv[index + 1] ?? USER_REGISTRY_PATH;
      index += 1;
      continue;
    }

    if (token === "--request") {
      parsed.request = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--request-stdin") {
      parsed.requestFromStdin = true;
      continue;
    }

    if (token === "--help" || token === "-h") {
      parsed.help = true;
    }
  }

  return parsed;
}

function readRequestFromStdin() {
  const input = fs.readFileSync(0, "utf8");
  const trimmed = String(input || "").trim();

  if (!trimmed) {
    throw new Error("--request-stdin requires non-empty stdin input.");
  }

  return trimmed;
}

function getUsageText() {
  return [
    "Usage: manage-user-habits (--list | --add --phrase <text> --intent <intent> | --remove --phrase <text> | --export <path> | --import <path> | --request <text> | --request-stdin) [--scenario <a,b>] [--confidence <0-1>] [--mode replace|merge] [--user-registry <path>]",
    "",
    "Examples:",
    "  manage-user-habits --add --phrase \"收尾一下\" --intent close_session --scenario session_close --confidence 0.86",
    "  manage-user-habits --remove --phrase \"收尾一下\"",
    "  manage-user-habits --list",
    "  manage-user-habits --export .\\backup\\user_habits.json",
    "  manage-user-habits --import .\\backup\\user_habits.json --mode merge",
    "  manage-user-habits --request \"添加用户习惯短句: phrase=收尾一下; intent=close_session; 场景=session_close; 置信度=0.86\"",
    "  manage-user-habits --request \"删除用户习惯短句: 收尾一下\"",
    "  manage-user-habits --request \"列出用户习惯短句\"",
    "  @'\n新增习惯短句 phrase=收尾一下\nintent=close_session\n场景=session_close\n置信度=0.86\n'@ | manage-user-habits --request-stdin",
    "",
    "Options:",
    "  --add                    Add or update a user-defined habit phrase.",
    "  --remove                 Remove a habit phrase from the effective registry.",
    "  --list                   List the current user-defined additions and removals.",
    "  --export <path>          Export the current user overlay to a JSON file.",
    "  --import <path>          Import a user overlay JSON file.",
    "  --phrase <text>          Phrase to add or remove.",
    "  --intent <intent>        Normalized intent for --add.",
    "  --file <path>            Optional file path for prompt-driven import/export.",
    "  --mode replace|merge     Import mode. Default: replace.",
    "  --scenario <a,b>         Optional comma-separated scenario hints for --add.",
    "  --confidence <0-1>       Optional confidence for --add. Default: 0.85.",
    "  --request <text>         Lightweight prompt-based management request.",
    "  --request-stdin          Read a lightweight prompt request from stdin.",
    `  --user-registry <path>  Optional user registry path. Default: ${path.relative(process.cwd(), USER_REGISTRY_PATH) || USER_REGISTRY_PATH}`,
    "  --help, -h               Show this help text."
  ].join("\n");
}

function printUsageAndExit(exitCode = 1, stream = process.stderr) {
  stream.write(`${getUsageText()}\n`);
  process.exit(exitCode);
}

function executeStructuredAction(args) {
  if (args.action === "list") {
    ensureUserRegistryFile(args.registryPath);
    const state = loadUserRegistryState(args.registryPath);
    return {
      action: "list",
      registry_path: args.registryPath,
      additions: state.additions,
      removals: state.removals
    };
  }

  if (args.action === "remove") {
    if (!args.phrase) {
      throw new Error("--remove requires --phrase.");
    }

    const state = removeUserHabitPhrase(args.phrase, args.registryPath);
    return {
      action: "remove",
      removed_phrase: args.phrase,
      registry_path: args.registryPath,
      additions: state.additions,
      removals: state.removals
    };
  }

  if (args.action === "export") {
    if (!args.filePath) {
      throw new Error("--export requires a file path.");
    }

    const state = exportUserRegistryState(args.filePath, args.registryPath);
    return {
      action: "export",
      registry_path: args.registryPath,
      file_path: args.filePath,
      additions: state.additions,
      removals: state.removals
    };
  }

  if (args.action === "import") {
    if (!args.filePath) {
      throw new Error("--import requires a file path.");
    }

    const mode = args.mode || "replace";
    const state = importUserRegistryState(args.filePath, args.registryPath, mode);
    return {
      action: "import",
      mode,
      registry_path: args.registryPath,
      file_path: args.filePath,
      additions: state.additions,
      removals: state.removals
    };
  }

  if (args.action === "add") {
    if (!args.phrase || !args.intent) {
      throw new Error("--add requires both --phrase and --intent.");
    }

    const rule = {
      phrase: args.phrase,
      normalized_intent: args.intent,
      scenario_bias: args.scenario.length > 0 ? args.scenario : ["general"],
      confidence: args.confidence ? Number(args.confidence) : 0.85
    };

    const state = addUserHabitRule(rule, args.registryPath);
    return {
      action: "add",
      added_rule: rule,
      registry_path: args.registryPath,
      additions: state.additions,
      removals: state.removals
    };
  }

  throw new Error("One of --list, --add, --remove, or --request is required.");
}

function executeRequestAction(args) {
  const parsedRequest = parseHabitManagementRequest(args.request);
  if (!parsedRequest) {
    throw new Error("Unable to parse habit management request.");
  }

  if (parsedRequest.action === "list") {
    const state = loadUserRegistryState(args.registryPath);
    return {
      action: "list",
      registry_path: args.registryPath,
      additions: state.additions,
      removals: state.removals
    };
  }

  if (parsedRequest.action === "remove") {
    const state = removeUserHabitPhrase(parsedRequest.phrase, args.registryPath);
    return {
      action: "remove",
      removed_phrase: parsedRequest.phrase,
      registry_path: args.registryPath,
      additions: state.additions,
      removals: state.removals
    };
  }

  if (parsedRequest.action === "export") {
    const exportPath = args.filePath || parsedRequest.path;
    const state = exportUserRegistryState(exportPath, args.registryPath);
    return {
      action: "export",
      registry_path: args.registryPath,
      file_path: exportPath,
      additions: state.additions,
      removals: state.removals
    };
  }

  if (parsedRequest.action === "import") {
    const importPath = args.filePath || parsedRequest.path;
    const mode = parsedRequest.mode || args.mode || "replace";
    const state = importUserRegistryState(importPath, args.registryPath, mode);
    return {
      action: "import",
      mode,
      registry_path: args.registryPath,
      file_path: importPath,
      additions: state.additions,
      removals: state.removals
    };
  }

  const state = addUserHabitRule(parsedRequest.rule, args.registryPath);
  return {
    action: "add",
    added_rule: parsedRequest.rule,
    registry_path: args.registryPath,
    additions: state.additions,
    removals: state.removals
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.requestFromStdin) {
    args.request = readRequestFromStdin();
  }

  if (args.help) {
    printUsageAndExit(0, process.stdout);
  }

  const output = args.request
    ? executeRequestAction(args)
    : executeStructuredAction(args);

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  executeRequestAction,
  executeStructuredAction,
  getUsageText,
  main,
  parseArgs
};
