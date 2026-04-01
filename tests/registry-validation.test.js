const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  interpretHabit,
  loadHabitsFromFile,
  validateHabitRules
} = require("../src");

const INVALID_REGISTRY_PATH = path.join(__dirname, "fixtures", "invalid_habits.json");
const VALIDATE_CLI_PATH = path.join(__dirname, "..", "src", "validate-registry-cli.js");

test("invalid registry files fail during load", () => {
  assert.throws(
    () => loadHabitsFromFile(INVALID_REGISTRY_PATH),
    /"scenario_bias" must be an array of strings/
  );
});

test("invalid injected rules fail before interpretation", () => {
  assert.throws(
    () => interpretHabit(
      { message: "anything" },
      {
        rules: [
          {
            phrase: "bad",
            normalized_intent: "bad_intent",
            scenario_bias: [],
            confidence: 2
          }
        ]
      }
    ),
    /"confidence" must be a number between 0 and 1/
  );
});

test("validator accepts the default registry shape", () => {
  const valid = validateHabitRules([
    {
      phrase: "归档一下",
      normalized_intent: "archive_current_thread",
      scenario_bias: ["general"],
      confidence: 0.9
    }
  ]);

  assert.equal(valid.length, 1);
});

test("validate-registry cli reports invalid files", () => {
  const result = spawnSync(process.execPath, [VALIDATE_CLI_PATH, INVALID_REGISTRY_PATH], {
    encoding: "utf8"
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /"scenario_bias" must be an array of strings/);
});

test("validate-registry cli reports valid files", () => {
  const result = spawnSync(
    process.execPath,
    [VALIDATE_CLI_PATH, path.join(__dirname, "fixtures", "alt_habits.json")],
    { encoding: "utf8" }
  );

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.rules, 2);
});
