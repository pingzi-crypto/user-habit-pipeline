#!/usr/bin/env node

import path = require("node:path");
import type { HabitOutput } from "./habit_core/types";
import { interpretHabit } from "./index";

interface DemoRecord {
  label: string;
  output: HabitOutput;
}

export function main(): void {
  const altRegistryPath = path.join(__dirname, "..", "tests", "fixtures", "alt_habits.json");

  const demos: DemoRecord[] = [
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
