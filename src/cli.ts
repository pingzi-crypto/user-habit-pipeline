#!/usr/bin/env node

import type { GrowthHubHint, HabitInput, HabitOutput } from "./habit_core/types";
import { interpretHabit, toGrowthHubHint } from "./index";
import { USER_REGISTRY_PATH } from "./habit_registry/user_registry";

export interface InterpretCliArgs {
  message: string | null;
  scenario: string | null;
  recent_context: string[];
  adapter: string | null;
  registryPath: string | null;
  userRegistryPath: string;
  help: boolean;
}

export function parseArgs(argv: string[]): InterpretCliArgs {
  const parsed: InterpretCliArgs = {
    message: null,
    scenario: null,
    recent_context: [],
    adapter: null,
    registryPath: null,
    userRegistryPath: USER_REGISTRY_PATH,
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
    "Usage: user-habit-pipeline --message <text> [--scenario <name>] [--context <text>] [--adapter growth-hub] [--registry <path>] [--user-registry <path>]",
    "",
    "Options:",
    "  --message <text>          Required shorthand message to interpret.",
    "  --scenario <name>         Optional scenario bias hint.",
    "  --context <text>          Optional recent-context item. Repeatable.",
    "  --adapter growth-hub      Project the result through the growth-hub adapter.",
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

  const interpretation: HabitOutput = interpretHabit({
    message: args.message,
    scenario: args.scenario,
    recent_context: args.recent_context
  } as HabitInput, {
    registryPath: args.registryPath || undefined,
    userRegistryPath: args.userRegistryPath
  });

  const output: HabitOutput | GrowthHubHint = args.adapter === "growth-hub"
    ? toGrowthHubHint(interpretation)
    : interpretation;

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

if (require.main === module) {
  main();
}
