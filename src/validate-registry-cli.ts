#!/usr/bin/env node

import path = require("node:path");
import { loadHabitsFromFile } from "./habit_core/interpreter";

const HELP_TEXT = "Usage: validate-registry <path-to-registry.json>\n\nValidate a habit registry file and print structured JSON on success.\n";

export function main(argv: string[] = process.argv.slice(2)): void {
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
    const rules = loadHabitsFromFile(resolvedPath);
    process.stdout.write(
      `${JSON.stringify({ ok: true, rules: rules.length, path: resolvedPath }, null, 2)}\n`
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
