#!/usr/bin/env node

import type {
  ExternalMemorySignal,
  GrowthHubHint,
  HabitInput,
  HabitOutput,
  InterpretedPreActionResult,
  MemoryConflictDecision
} from "./habit_core/types";
import {
  buildMemoryConflictDecision,
  interpretHabit,
  interpretHabitForPreAction,
  toGrowthHubHint
} from "./index";
import { USER_REGISTRY_PATH } from "./habit_registry/user_registry";

export interface InterpretCliArgs {
  message: string | null;
  scenario: string | null;
  recent_context: string[];
  adapter: string | null;
  registryPath: string | null;
  userRegistryPath: string;
  preAction: boolean;
  externalMemoryIntent: string | null;
  externalMemorySource: string | null;
  externalMemoryConfidence: number | null;
  help: boolean;
}

interface PreActionCliOutput extends InterpretedPreActionResult {
  memory_conflict_decision?: MemoryConflictDecision;
}

export function parseArgs(argv: string[]): InterpretCliArgs {
  const parsed: InterpretCliArgs = {
    message: null,
    scenario: null,
    recent_context: [],
    adapter: null,
    registryPath: null,
    userRegistryPath: USER_REGISTRY_PATH,
    preAction: false,
    externalMemoryIntent: null,
    externalMemorySource: null,
    externalMemoryConfidence: null,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--message") {
      parsed.message = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--scenario") {
      parsed.scenario = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--context") {
      parsed.recent_context.push(argv[index + 1] ?? "");
      index += 1;
      continue;
    }

    if (token === "--adapter") {
      parsed.adapter = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--pre-action") {
      parsed.preAction = true;
      continue;
    }

    if (token === "--external-memory-intent") {
      parsed.externalMemoryIntent = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--external-memory-source") {
      parsed.externalMemorySource = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--external-memory-confidence") {
      const rawValue = argv[index + 1] ?? null;
      parsed.externalMemoryConfidence = rawValue === null ? null : Number(rawValue);
      index += 1;
      continue;
    }

    if (token === "--registry") {
      parsed.registryPath = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (token === "--user-registry") {
      parsed.userRegistryPath = argv[index + 1] ?? USER_REGISTRY_PATH;
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
    "Usage: user-habit-pipeline --message <text> [--scenario <name>] [--context <text>] [--adapter growth-hub] [--pre-action] [--external-memory-intent <intent>] [--external-memory-source <label>] [--external-memory-confidence <0-1>] [--registry <path>] [--user-registry <path>]",
    "",
    "Options:",
    "  --message <text>          Required shorthand message to interpret.",
    "  --scenario <name>         Optional scenario bias hint.",
    "  --context <text>          Optional recent-context item. Repeatable.",
    "  --adapter growth-hub      Project the result through the growth-hub adapter.",
    "  --pre-action              Return result + pre_action_decision for host routing.",
    "  --external-memory-intent  Optional host local-memory intent to compare against pipeline output.",
    "  --external-memory-source  Optional host local-memory source label. Default: host_local_memory.",
    "  --external-memory-confidence Optional host local-memory confidence score.",
    "  --registry <path>         Load a full custom registry file for this invocation.",
    `  --user-registry <path>    Load a user-habits overlay file. Default: ${USER_REGISTRY_PATH}`,
    "  --help, -h                Show this help text."
  ].join("\n");
}

function printUsageAndExit(exitCode: number = 1, stream: NodeJS.WriteStream = process.stderr): never {
  stream.write(`${getUsageText()}\n`);
  process.exit(exitCode);
}

export function main(argv: string[] = process.argv.slice(2)): void {
  const args = parseArgs(argv);
  if (args.help) {
    printUsageAndExit(0, process.stdout);
  }

  if (!args.message) {
    printUsageAndExit();
  }

  const input = {
    message: args.message,
    scenario: args.scenario,
    recent_context: args.recent_context
  } as HabitInput;
  const options = {
    registryPath: args.registryPath || undefined,
    userRegistryPath: args.userRegistryPath
  };
  const shouldReturnPreAction = args.preAction || Boolean(args.externalMemoryIntent);

  let output: HabitOutput | GrowthHubHint | PreActionCliOutput;

  if (shouldReturnPreAction) {
    const preActionOutput = interpretHabitForPreAction(input, options);
    const externalMemorySignal: ExternalMemorySignal | null = args.externalMemoryIntent
      ? {
        normalized_intent: args.externalMemoryIntent,
        source_label: args.externalMemorySource || "host_local_memory",
        confidence: args.externalMemoryConfidence
      }
      : null;

    output = {
      ...preActionOutput
    };

    if (externalMemorySignal) {
      output.memory_conflict_decision = buildMemoryConflictDecision(
        preActionOutput.pre_action_decision,
        externalMemorySignal
      );
    }
  } else {
    const interpretation: HabitOutput = interpretHabit(input, options);
    output = args.adapter === "growth-hub"
      ? toGrowthHubHint(interpretation)
      : interpretation;
  }

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

if (require.main === module) {
  main();
}
