#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const path = require("node:path");
const index_1 = require("./index");
function main() {
    const altRegistryPath = path.join(__dirname, "..", "tests", "fixtures", "alt_habits.json");
    const demos = [
        {
            label: "default_explicit",
            output: (0, index_1.interpretHabit)({ message: "更新入板", scenario: "status_board" }, { includeUserRegistry: false })
        },
        {
            label: "default_ambiguous",
            output: (0, index_1.interpretHabit)({ message: "继续", scenario: "general" }, { includeUserRegistry: false })
        },
        {
            label: "alternate_registry",
            output: (0, index_1.interpretHabit)({ message: "归档一下", scenario: "session_close" }, { registryPath: altRegistryPath })
        }
    ];
    process.stdout.write(`${JSON.stringify(demos, null, 2)}\n`);
}
if (require.main === module) {
    main();
}
