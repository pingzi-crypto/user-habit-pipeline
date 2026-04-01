const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const SETTINGS_PATH = path.join(__dirname, "..", ".vscode", "settings.json");

function loadSettings() {
  return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
}

test("workspace settings declare a registry schema association", () => {
  const settings = loadSettings();

  assert.ok(Array.isArray(settings["json.schemas"]));
  assert.equal(settings["json.schemas"].length, 1);

  const [schemaConfig] = settings["json.schemas"];
  assert.equal(schemaConfig.url, "./docs/registry.schema.json");
  assert.deepEqual(schemaConfig.fileMatch, [
    "/src/habit_registry/*.json",
    "/tests/fixtures/*habits.json"
  ]);
});
