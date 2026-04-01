#!/usr/bin/env node

const path = require("node:path");
const { interpretHabit } = require("./index");

function main() {
  const altRegistryPath = path.join(__dirname, "..", "tests", "fixtures", "alt_habits.json");

  const demos = [
    {
      label: "default_explicit",
      output: interpretHabit(
        { message: "更新入板", scenario: "status_board" },
        { includeUserRegistry: false }
      )
    },
    {
      label: "default_ambiguous",
      output: interpretHabit(
        { message: "继续", scenario: "general" },
        { includeUserRegistry: false }
      )
    },
    {
      label: "alternate_registry",
      output: interpretHabit(
        { message: "归档一下", scenario: "session_close" },
        { registryPath: altRegistryPath }
      )
    }
  ];

  process.stdout.write(`${JSON.stringify(demos, null, 2)}\n`);
}

if (require.main === module) {
  main();
}

module.exports = {
  main
};
