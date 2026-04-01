const test = require("node:test");
const assert = require("node:assert/strict");
const { interpretHabit, toGrowthHubHint } = require("../src");

test("growth-hub adapter only projects the interpretation result", () => {
  const interpreted = interpretHabit({ message: "验收", scenario: "reviewer" });
  const hint = toGrowthHubHint(interpreted);

  assert.deepEqual(hint, {
    hint_intent: "review_acceptance",
    hint_confidence: interpreted.confidence,
    hint_requires_confirmation: false,
    hint_terms: ["reviewer"],
    hint_notes: interpreted.notes
  });
});
