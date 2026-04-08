const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { loadHabitsFromFile, interpretHabit } = require("../src");

const registryPath = path.join(__dirname, "..", "examples", "project-registry", "custom-habits.json");

test("project registry example validates and interprets its sample phrase", () => {
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
});
