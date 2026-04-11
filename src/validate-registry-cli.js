#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const path = require("node:path");
const interpreter_1 = require("./habit_core/interpreter");
const HELP_TEXT = "Usage: validate-registry <path-to-registry.json>\n\nValidate a habit registry file and print structured JSON on success.\n";
function main(argv = process.argv.slice(2)) {
    const registryPath = argv[0];
    const wantsHelp = registryPath === "--help" || registryPath === "-h";
    if (wantsHelp) {
        process.stdout.write(HELP_TEXT);
        process.exit(0);
    }
    if (!registryPath) {
        process.stderr.write("Usage: validate-registry <path-to-registry.json>\n");
        process.exit(1);
    }
    const resolvedPath = path.resolve(process.cwd(), registryPath);
    try {
        const rules = (0, interpreter_1.loadHabitsFromFile)(resolvedPath);
        process.stdout.write(`${JSON.stringify({ ok: true, rules: rules.length, path: resolvedPath }, null, 2)}\n`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        process.stderr.write(`${message}\n`);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
