const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  evaluateControlHubPolicyOverride
} = require("../src/adapters/control_hub/policy_override.js");
const {
  CONTROL_HUB_POLICY_OVERRIDE_GOLDSET
} = require("../src/adapters/control_hub/policy_override_goldset.js");

const REALISTIC_GOLDSET_PATH = path.join(
  __dirname,
  "fixtures",
  "control_hub_policy_override_goldset.json"
);
const realisticGoldset = JSON.parse(fs.readFileSync(REALISTIC_GOLDSET_PATH, "utf8"));

for (const fixture of realisticGoldset) {
  test(`control hub goldset fixture: ${fixture.name}`, () => {
    const result = evaluateControlHubPolicyOverride(fixture.input);

    assert.equal(result.match_status, fixture.expected.match_status);
    assert.equal(result.interpreted_intent, fixture.expected.interpreted_intent);
    assert.equal(result.scope, fixture.expected.scope);
    assert.equal(result.override_mode, fixture.expected.override_mode);
    assert.equal(
      result.should_ask_clarifying_question,
      fixture.expected.should_ask_clarifying_question
    );
    assert.equal(result.matched_phrase, fixture.expected.matched_phrase);
    assert.deepEqual(result.suggested_preference_write, fixture.expected.suggested_preference_write);

    if (typeof fixture.expected.clarifying_question_includes === "string") {
      assert.match(result.clarifying_question || "", new RegExp(fixture.expected.clarifying_question_includes, "u"));
    }

    if (typeof fixture.expected.confidence_gte === "number") {
      assert.ok(result.confidence >= fixture.expected.confidence_gte);
    }

    if (typeof fixture.expected.confidence_eq === "number") {
      assert.equal(result.confidence, fixture.expected.confidence_eq);
    }
  });
}

test("control hub goldset stays scoped to policy_override only", () => {
  assert.ok(CONTROL_HUB_POLICY_OVERRIDE_GOLDSET.length >= 5);
  assert.ok(
    CONTROL_HUB_POLICY_OVERRIDE_GOLDSET.every((entry) => entry.context_type === "policy_override")
  );
});

test("realistic control hub fixture covers all intended boundary classes", () => {
  const matchStatuses = new Set(realisticGoldset.map((fixture) => fixture.expected.match_status));
  const scopes = new Set(realisticGoldset.map((fixture) => fixture.expected.scope));

  assert.deepEqual(Array.from(matchStatuses).sort(), ["ambiguous", "matched", "no_match"]);
  assert.ok(scopes.has("current_item"));
  assert.ok(scopes.has("current_project"));
  assert.ok(scopes.has("global"));
  assert.ok(scopes.has("unknown"));
});
