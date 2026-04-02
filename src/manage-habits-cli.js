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
  removeUserHabitPhrase,
  suppressSuggestionPhrase
} = require("./habit_registry/user_registry");
const { parseHabitManagementRequest } = require("./habit_registry/management_prompt");
const {
  DEFAULT_MAX_CANDIDATES,
  findSuggestedCandidate,
  suggestSessionHabitCandidates
} = require("./session_suggestions/extract_candidates");
const {
  deriveSuggestionCachePath,
  loadSuggestionSnapshot,
  saveSuggestionSnapshot
} = require("./session_suggestions/cache");

function parseArgs(argv) {
  const parsed = {
    action: null,
    phrase: null,
    intent: null,
    candidateRef: null,
    filePath: null,
    transcriptPath: null,
    suggestionsPath: null,
    mode: null,
    maxCandidates: DEFAULT_MAX_CANDIDATES,
    scenario: [],
    confidence: null,
    registryPath: USER_REGISTRY_PATH,
    request: null,
    requestFromStdin: false,
    transcriptFromStdin: false,
    suggestionsFromStdin: false,
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

    if (token === "--suggest") {
      parsed.action = "suggest";
      continue;
    }

    if (token === "--apply-candidate") {
      parsed.action = "apply-candidate";
      parsed.candidateRef = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--ignore-candidate") {
      parsed.action = "ignore-candidate";
      parsed.candidateRef = argv[index + 1] ?? null;
      index += 1;
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

    if (token === "--ignore-phrase") {
      parsed.action = "ignore-phrase";
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

    if (token === "--transcript") {
      parsed.transcriptPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--transcript-stdin") {
      parsed.transcriptFromStdin = true;
      continue;
    }

    if (token === "--suggestions") {
      parsed.suggestionsPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--suggestions-stdin") {
      parsed.suggestionsFromStdin = true;
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

function readRequestFromStdin() {
  const input = fs.readFileSync(0, "utf8");
  const trimmed = String(input || "").trim();

  if (!trimmed) {
    throw new Error("--request-stdin requires non-empty stdin input.");
  }

  return trimmed;
}

function parseJsonPayload(text, sourceLabel) {
  const normalized = String(text || "").replace(/^\uFEFF/u, "").trim();
  if (!normalized) {
    throw new Error(`${sourceLabel} is empty.`);
  }

  try {
    return JSON.parse(normalized);
  } catch {
    const firstObjectStart = normalized.indexOf("{");
    const lastObjectEnd = normalized.lastIndexOf("}");
    const firstArrayStart = normalized.indexOf("[");
    const lastArrayEnd = normalized.lastIndexOf("]");

    const objectCandidate = firstObjectStart >= 0 && lastObjectEnd > firstObjectStart
      ? normalized.slice(firstObjectStart, lastObjectEnd + 1)
      : null;
    const arrayCandidate = firstArrayStart >= 0 && lastArrayEnd > firstArrayStart
      ? normalized.slice(firstArrayStart, lastArrayEnd + 1)
      : null;

    for (const candidate of [objectCandidate, arrayCandidate]) {
      if (!candidate) {
        continue;
      }

      try {
        return JSON.parse(candidate);
      } catch {
        continue;
      }
    }

    throw new Error(`${sourceLabel} does not contain valid JSON.`);
  }
}

function readTranscriptInput(args) {
  if (args.transcriptFromStdin) {
    const input = fs.readFileSync(0, "utf8");
    const trimmed = String(input || "").trim();

    if (!trimmed) {
      throw new Error("--transcript-stdin requires non-empty stdin input.");
    }

    return trimmed;
  }

  if (args.transcriptPath) {
    const content = fs.readFileSync(args.transcriptPath, "utf8");
    const trimmed = String(content || "").trim();

    if (!trimmed) {
      throw new Error("--transcript requires a non-empty file.");
    }

    return trimmed;
  }

  throw new Error("Session suggestion scanning requires --transcript <path> or --transcript-stdin.");
}

function readSuggestionsInput(args) {
  if (args.suggestionsFromStdin) {
    const input = fs.readFileSync(0, "utf8");
    const trimmed = String(input || "").trim();

    if (!trimmed) {
      throw new Error("--suggestions-stdin requires non-empty stdin input.");
    }

    return parseJsonPayload(trimmed, "--suggestions-stdin input");
  }

  if (args.suggestionsPath) {
    const content = fs.readFileSync(args.suggestionsPath, "utf8");
    const trimmed = String(content || "").trim();

    if (!trimmed) {
      throw new Error("--suggestions requires a non-empty file.");
    }

    return parseJsonPayload(trimmed, "--suggestions file");
  }

  const cached = loadSuggestionSnapshot(args.registryPath);
  return cached.snapshot;
}

function resolveScenarioBias(baseRule, args, overrides = {}) {
  if (Array.isArray(overrides.scenario_bias) && overrides.scenario_bias.length > 0) {
    return overrides.scenario_bias;
  }

  if (Array.isArray(args.scenario) && args.scenario.length > 0) {
    return args.scenario;
  }

  if (Array.isArray(baseRule.scenario_bias) && baseRule.scenario_bias.length > 0) {
    return baseRule.scenario_bias;
  }

  return ["general"];
}

function resolveConfidence(baseRule, args, overrides = {}) {
  if (typeof overrides.confidence === "number" && !Number.isNaN(overrides.confidence)) {
    return overrides.confidence;
  }

  if (args.confidence !== null && args.confidence !== undefined) {
    return Number(args.confidence);
  }

  if (typeof baseRule.confidence === "number" && !Number.isNaN(baseRule.confidence)) {
    return baseRule.confidence;
  }

  return 0.85;
}

function buildRuleFromSuggestedCandidate(candidate, args, overrides = {}) {
  const baseRule = candidate.suggested_rule
    ? { ...candidate.suggested_rule }
    : { phrase: candidate.phrase };

  const normalizedIntent = overrides.intent || args.intent || baseRule.normalized_intent;
  if (!normalizedIntent) {
    throw new Error(`Candidate "${candidate.candidate_id}" requires an explicit intent before it can be added.`);
  }

  return {
    ...baseRule,
    phrase: candidate.phrase,
    normalized_intent: normalizedIntent,
    scenario_bias: resolveScenarioBias(baseRule, args, overrides),
    confidence: resolveConfidence(baseRule, args, overrides)
  };
}

function getUsageText() {
  return [
    "Usage: manage-user-habits (--list | --add --phrase <text> --intent <intent> | --remove --phrase <text> | --ignore-phrase <text> | --export <path> | --import <path> | --suggest | --apply-candidate <id> | --ignore-candidate <id> | --request <text> | --request-stdin) [--scenario <a,b>] [--confidence <0-1>] [--mode replace|merge] [--transcript <path> | --transcript-stdin] [--suggestions <path> | --suggestions-stdin] [--max-candidates <n>] [--user-registry <path>]",
    "",
    "Examples:",
    "  manage-user-habits --add --phrase \"收尾一下\" --intent close_session --scenario session_close --confidence 0.86",
    "  manage-user-habits --remove --phrase \"收尾一下\"",
    "  manage-user-habits --list",
    "  manage-user-habits --export .\\backup\\user_habits.json",
    "  manage-user-habits --import .\\backup\\user_habits.json --mode merge",
    "  manage-user-habits --suggest --transcript .\\data\\thread.txt",
    "  manage-user-habits --apply-candidate c1 --suggestions .\\data\\thread_suggestions.json",
    "  manage-user-habits --ignore-candidate c1 --suggestions .\\data\\thread_suggestions.json",
    "  manage-user-habits --ignore-phrase \"收工啦\"",
    "  manage-user-habits --apply-candidate c1 --suggestions .\\data\\thread_suggestions.json --scenario session_close",
    "  manage-user-habits --request \"添加用户习惯短句: phrase=收尾一下; intent=close_session; 场景=session_close; 置信度=0.86\"",
    "  manage-user-habits --request \"扫描这次会话里的习惯候选\" --transcript .\\data\\thread.txt",
    "  manage-user-habits --request \"添加第1条\" --suggestions .\\data\\thread_suggestions.json",
    "  manage-user-habits --request \"忽略第1条\" --suggestions .\\data\\thread_suggestions.json",
    "  manage-user-habits --request \"以后别再建议这个短句: 收工啦\"",
    "  manage-user-habits --request \"把第1条加到 session_close 场景\" --suggestions .\\data\\thread_suggestions.json",
    "  manage-user-habits --request \"删除用户习惯短句: 收尾一下\"",
    "  manage-user-habits --request \"列出用户习惯短句\"",
    "  @'\n新增习惯短句 phrase=收尾一下\nintent=close_session\n场景=session_close\n置信度=0.86\n'@ | manage-user-habits --request-stdin",
    "  @'\nuser: 以后我说“收尾一下”就是 close_session\nuser: 收尾一下\n'@ | manage-user-habits --suggest --transcript-stdin",
    "",
    "Options:",
    "  --add                    Add or update a user-defined habit phrase.",
    "  --remove                 Remove a habit phrase from the effective registry.",
    "  --list                   List the current user-defined additions, removals, and ignored suggestions.",
    "  --suggest                Suggest candidate habit phrases from a session transcript.",
    "  --apply-candidate <id>   Add one suggested candidate to the user overlay.",
    "  --ignore-candidate <id>  Suppress one suggested candidate from future suggestion scans.",
    "  --export <path>          Export the current user overlay to a JSON file.",
    "  --import <path>          Import a user overlay JSON file.",
    "  --phrase <text>          Phrase to add or remove.",
    "  --ignore-phrase <text>   Suppress a phrase from future suggestion scans.",
    "  --intent <intent>        Normalized intent for --add or --apply-candidate.",
    "  --file <path>            Optional file path for prompt-driven import/export.",
    "  --transcript <path>      Session transcript file for --suggest or prompt-driven suggestion scans.",
    "  --transcript-stdin       Read a session transcript from stdin.",
    "  --suggestions <path>     Suggestion snapshot file for --apply-candidate or prompt-driven candidate apply.",
    "  --suggestions-stdin      Read a suggestion snapshot from stdin.",
    `  --max-candidates <n>    Maximum suggestion candidates to return. Default: ${DEFAULT_MAX_CANDIDATES}.`,
    "  --mode replace|merge     Import mode. Default: replace.",
    "  --scenario <a,b>         Optional comma-separated scenario hints for --add or --apply-candidate.",
    "  --confidence <0-1>       Optional confidence for --add or --apply-candidate. Default: 0.85.",
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
      removals: state.removals,
      ignored_suggestions: state.ignored_suggestions
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
      removals: state.removals,
      ignored_suggestions: state.ignored_suggestions
    };
  }

  if (args.action === "ignore-phrase") {
    if (!args.phrase) {
      throw new Error("--ignore-phrase requires a phrase.");
    }

    const state = suppressSuggestionPhrase(args.phrase, args.registryPath);
    return {
      action: "ignore-phrase",
      ignored_phrase: args.phrase,
      registry_path: args.registryPath,
      additions: state.additions,
      removals: state.removals,
      ignored_suggestions: state.ignored_suggestions
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
      removals: state.removals,
      ignored_suggestions: state.ignored_suggestions
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
      removals: state.removals,
      ignored_suggestions: state.ignored_suggestions
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
      removals: state.removals,
      ignored_suggestions: state.ignored_suggestions
    };
  }

  if (args.action === "suggest") {
    const transcript = readTranscriptInput(args);
    const result = suggestSessionHabitCandidates(transcript, {
      userRegistryPath: args.registryPath,
      maxCandidates: Number.isFinite(args.maxCandidates) ? Math.max(1, Math.trunc(args.maxCandidates)) : DEFAULT_MAX_CANDIDATES
    });
    const suggestionsCachePath = saveSuggestionSnapshot(result, args.registryPath);

    return {
      action: "suggest",
      registry_path: args.registryPath,
      transcript_path: args.transcriptPath || null,
      transcript_source: args.transcriptFromStdin ? "stdin" : "file",
      suggestions_cache_path: suggestionsCachePath,
      candidate_count: result.candidates.length,
      transcript_stats: result.transcript_stats,
      candidates: result.candidates
    };
  }

  if (args.action === "apply-candidate") {
    if (!args.candidateRef) {
      throw new Error("--apply-candidate requires a candidate id such as c1.");
    }

    const snapshot = readSuggestionsInput(args);
    const candidate = findSuggestedCandidate(snapshot, args.candidateRef);
    const rule = buildRuleFromSuggestedCandidate(candidate, args);
    const state = addUserHabitRule(rule, args.registryPath);
    return {
      action: "apply-candidate",
      candidate_id: candidate.candidate_id,
      applied_rule: rule,
      registry_path: args.registryPath,
      suggestions_cache_path: deriveSuggestionCachePath(args.registryPath),
      additions: state.additions,
      removals: state.removals,
      ignored_suggestions: state.ignored_suggestions
    };
  }

  if (args.action === "ignore-candidate") {
    if (!args.candidateRef) {
      throw new Error("--ignore-candidate requires a candidate id such as c1.");
    }

    const snapshot = readSuggestionsInput(args);
    const candidate = findSuggestedCandidate(snapshot, args.candidateRef);
    const state = suppressSuggestionPhrase(candidate.phrase, args.registryPath);
    return {
      action: "ignore-candidate",
      candidate_id: candidate.candidate_id,
      ignored_phrase: candidate.phrase,
      registry_path: args.registryPath,
      suggestions_cache_path: deriveSuggestionCachePath(args.registryPath),
      additions: state.additions,
      removals: state.removals,
      ignored_suggestions: state.ignored_suggestions
    };
  }

  throw new Error("One of --list, --add, --remove, --ignore-phrase, --suggest, --apply-candidate, --ignore-candidate, or --request is required.");
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
      removals: state.removals,
      ignored_suggestions: state.ignored_suggestions
    };
  }

  if (parsedRequest.action === "remove") {
    const state = removeUserHabitPhrase(parsedRequest.phrase, args.registryPath);
    return {
      action: "remove",
      removed_phrase: parsedRequest.phrase,
      registry_path: args.registryPath,
      additions: state.additions,
      removals: state.removals,
      ignored_suggestions: state.ignored_suggestions
    };
  }

  if (parsedRequest.action === "ignore-phrase") {
    const state = suppressSuggestionPhrase(parsedRequest.phrase, args.registryPath);
    return {
      action: "ignore-phrase",
      ignored_phrase: parsedRequest.phrase,
      registry_path: args.registryPath,
      additions: state.additions,
      removals: state.removals,
      ignored_suggestions: state.ignored_suggestions
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
      removals: state.removals,
      ignored_suggestions: state.ignored_suggestions
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
      removals: state.removals,
      ignored_suggestions: state.ignored_suggestions
    };
  }

  if (parsedRequest.action === "suggest") {
    const transcript = readTranscriptInput(args);
    const result = suggestSessionHabitCandidates(transcript, {
      userRegistryPath: args.registryPath,
      maxCandidates: Number.isFinite(args.maxCandidates) ? Math.max(1, Math.trunc(args.maxCandidates)) : DEFAULT_MAX_CANDIDATES
    });
    const suggestionsCachePath = saveSuggestionSnapshot(result, args.registryPath);

    return {
      action: "suggest",
      scope: parsedRequest.scope,
      registry_path: args.registryPath,
      transcript_path: args.transcriptPath || null,
      transcript_source: args.transcriptFromStdin ? "stdin" : "file",
      suggestions_cache_path: suggestionsCachePath,
      candidate_count: result.candidates.length,
      transcript_stats: result.transcript_stats,
      candidates: result.candidates
    };
  }

  if (parsedRequest.action === "apply-candidate") {
    const snapshot = readSuggestionsInput(args);
    const candidate = findSuggestedCandidate(snapshot, parsedRequest.candidate_ref);
    const rule = buildRuleFromSuggestedCandidate(candidate, args, parsedRequest);
    const state = addUserHabitRule(rule, args.registryPath);
    return {
      action: "apply-candidate",
      candidate_id: candidate.candidate_id,
      applied_rule: rule,
      registry_path: args.registryPath,
      suggestions_cache_path: deriveSuggestionCachePath(args.registryPath),
      additions: state.additions,
      removals: state.removals,
      ignored_suggestions: state.ignored_suggestions
    };
  }

  if (parsedRequest.action === "ignore-candidate") {
    const snapshot = readSuggestionsInput(args);
    const candidate = findSuggestedCandidate(snapshot, parsedRequest.candidate_ref);
    const state = suppressSuggestionPhrase(candidate.phrase, args.registryPath);
    return {
      action: "ignore-candidate",
      candidate_id: candidate.candidate_id,
      ignored_phrase: candidate.phrase,
      registry_path: args.registryPath,
      suggestions_cache_path: deriveSuggestionCachePath(args.registryPath),
      additions: state.additions,
      removals: state.removals,
      ignored_suggestions: state.ignored_suggestions
    };
  }

  const state = addUserHabitRule(parsedRequest.rule, args.registryPath);
  return {
    action: "add",
    added_rule: parsedRequest.rule,
    registry_path: args.registryPath,
    additions: state.additions,
    removals: state.removals,
    ignored_suggestions: state.ignored_suggestions
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsageAndExit(0, process.stdout);
  }

  const stdinSources = [
    args.requestFromStdin,
    args.transcriptFromStdin,
    args.suggestionsFromStdin
  ].filter(Boolean).length;

  if (stdinSources > 1) {
    throw new Error("Use only one stdin source at a time: --request-stdin, --transcript-stdin, or --suggestions-stdin.");
  }

  if (args.requestFromStdin) {
    args.request = readRequestFromStdin();
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
