#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseArgs = parseArgs;
exports.getUsageText = getUsageText;
exports.main = main;
const index_1 = require("./index");
const user_registry_1 = require("./habit_registry/user_registry");
function parseArgs(argv) {
    const parsed = {
        message: null,
        scenario: null,
        recent_context: [],
        adapter: null,
        registryPath: null,
        userRegistryPath: user_registry_1.USER_REGISTRY_PATH,
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
            parsed.userRegistryPath = argv[index + 1] ?? user_registry_1.USER_REGISTRY_PATH;
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
        "Usage: user-habit-pipeline --message <text> [--scenario <name>] [--context <text>] [--adapter growth-hub] [--registry <path>] [--user-registry <path>]",
        "",
        "Options:",
        "  --message <text>          Required shorthand message to interpret.",
        "  --scenario <name>         Optional scenario bias hint.",
        "  --context <text>          Optional recent-context item. Repeatable.",
        "  --adapter growth-hub      Project the result through the growth-hub adapter.",
        "  --registry <path>         Load a full custom registry file for this invocation.",
        `  --user-registry <path>    Load a user-habits overlay file. Default: ${user_registry_1.USER_REGISTRY_PATH}`,
        "  --help, -h                Show this help text."
    ].join("\n");
}
function printUsageAndExit(exitCode = 1, stream = process.stderr) {
    stream.write(`${getUsageText()}\n`);
    process.exit(exitCode);
}
function main(argv = process.argv.slice(2)) {
    const args = parseArgs(argv);
    if (args.help) {
        printUsageAndExit(0, process.stdout);
    }
    if (!args.message) {
        printUsageAndExit();
    }
    const interpretation = (0, index_1.interpretHabit)({
        message: args.message,
        scenario: args.scenario,
        recent_context: args.recent_context
    }, {
        registryPath: args.registryPath || undefined,
        userRegistryPath: args.userRegistryPath
    });
    const output = args.adapter === "growth-hub"
        ? (0, index_1.toGrowthHubHint)(interpretation)
        : interpretation;
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}
if (require.main === module) {
    main();
}
