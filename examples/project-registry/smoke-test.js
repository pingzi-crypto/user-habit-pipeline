#!/usr/bin/env node

const assert = require("node:assert/strict");
const path = require("node:path");
const { loadHabitsFromFile, interpretHabit } = require("../../src");

const registryPath = path.join(__dirname, "custom-habits.json");

const rules = loadHabitsFromFile(registryPath);
assert.equal(rules.length, 2);

const result = interpretHabit(
  {
    message: "收口一下",
    scenario: "session_close"
  },
  {
    registryPath,
    includeUserRegistry: false
  }
);

assert.equal(result.normalized_intent, "close_session");
assert.equal(result.should_ask_clarifying_question, false);

process.stdout.write(`${JSON.stringify({
  ok: true,
  registry_path: registryPath,
  rules: rules.length,
  normalized_intent: result.normalized_intent
}, null, 2)}\n`);
