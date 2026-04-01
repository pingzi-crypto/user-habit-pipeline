const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const SCHEMA_PATH = path.join(__dirname, "..", "docs", "registry.schema.json");

function loadSchema() {
  return JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
}

test("registry schema parses and declares the expected top-level shape", () => {
  const schema = loadSchema();

  assert.equal(schema.type, "array");
  assert.equal(schema.items.type, "object");
  assert.equal(schema.items.additionalProperties, false);
});

test("registry schema requires the core rule fields", () => {
  const schema = loadSchema();

  assert.deepEqual(schema.items.required, [
    "phrase",
    "normalized_intent",
    "scenario_bias",
    "confidence"
  ]);
});

test("registry schema includes optional properties used by the runtime", () => {
  const schema = loadSchema();
  const propertyNames = Object.keys(schema.items.properties).sort();

  assert.deepEqual(propertyNames, [
    "clarify_below",
    "confidence",
    "disambiguation_hints",
    "match_type",
    "normalized_intent",
    "notes",
    "phrase",
    "preferred_terms",
    "scenario_bias"
  ]);
});
