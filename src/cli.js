#!/usr/bin/env node

const { interpretHabit, toGrowthHubHint } = require("./index");

function parseArgs(argv) {
  const parsed = {
    message: null,
    scenario: null,
    recent_context: [],
    adapter: null,
    registryPath: null,
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

    if (token === "--help" || token === "-h") {
      parsed.help = true;
    }
  }

  return parsed;
}

function getUsageText() {
  return [
    "Usage: user-habit-pipeline --message <text> [--scenario <name>] [--context <text>] [--adapter growth-hub] [--registry <path>]",
    "",
    "Options:",
    "  --message <text>          Required shorthand message to interpret.",
    "  --scenario <name>         Optional scenario bias hint.",
    "  --context <text>          Optional recent-context item. Repeatable.",
    "  --adapter growth-hub      Project the result through the growth-hub adapter.",
    "  --registry <path>         Load a custom registry file for this invocation.",
    "  --help, -h                Show this help text."
  ].join("\n");
}

function printUsageAndExit(exitCode = 1, stream = process.stderr) {
  stream.write(`${getUsageText()}\n`);
  process.exit(exitCode);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsageAndExit(0, process.stdout);
  }

  if (!args.message) {
    printUsageAndExit();
  }

  const interpretation = interpretHabit({
    message: args.message,
    scenario: args.scenario,
    recent_context: args.recent_context
  }, {
    registryPath: args.registryPath
  });

  const output = args.adapter === "growth-hub"
    ? toGrowthHubHint(interpretation)
    : interpretation;

  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  getUsageText,
  main,
  parseArgs
};
