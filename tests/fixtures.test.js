const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { interpretHabit } = require("../src");
const { EXAMPLES_DOC_PATH, renderExamplesDoc } = require("../src/generate-examples-doc");

const EXAMPLES_PATH = path.join(__dirname, "fixtures", "examples.json");
const ALT_HABITS_PATH = path.join(__dirname, "fixtures", "alt_habits.json");

const exampleFixtures = JSON.parse(fs.readFileSync(EXAMPLES_PATH, "utf8"));

for (const fixture of exampleFixtures) {
  test(`fixture: ${fixture.name || fixture.title}`, () => {
    const result = interpretHabit(fixture.input, { includeUserRegistry: false });

    assert.equal(result.normalized_intent, fixture.expected.normalized_intent);
    assert.equal(
      result.should_ask_clarifying_question,
      fixture.expected.should_ask_clarifying_question
    );

    if (typeof fixture.expected.top_phrase === "string") {
      assert.equal(result.habit_matches[0].phrase, fixture.expected.top_phrase);
    }

    if (typeof fixture.expected.confidence_lt === "number") {
      assert.ok(result.confidence < fixture.expected.confidence_lt);
    }

    if (typeof fixture.expected.confidence_gt === "number") {
      assert.ok(result.confidence > fixture.expected.confidence_gt);
    }
  });
}

test("examples doc stays in sync with the fixture source", () => {
  const rendered = renderExamplesDoc(exampleFixtures);
  const current = fs.readFileSync(EXAMPLES_DOC_PATH, "utf8");

  assert.equal(current, rendered);
});

test("custom registry path can replace the default habit set", () => {
  const result = interpretHabit(
    { message: "归档一下", scenario: "session_close" },
    { registryPath: ALT_HABITS_PATH }
  );

  assert.equal(result.normalized_intent, "archive_current_thread");
  assert.equal(result.should_ask_clarifying_question, false);
  assert.deepEqual(result.preferred_terms, ["archive"]);
});

test("custom rules array can be injected directly", () => {
  const rules = JSON.parse(fs.readFileSync(ALT_HABITS_PATH, "utf8"));
  const result = interpretHabit(
    { message: "下一个卡片", scenario: "learning" },
    { rules }
  );

  assert.equal(result.normalized_intent, "move_to_next_learning_card");
  assert.equal(result.should_ask_clarifying_question, false);
  assert.equal(result.habit_matches[0].phrase, "下一个卡片");
});
