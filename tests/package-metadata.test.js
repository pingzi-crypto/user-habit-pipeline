const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const PACKAGE_JSON_PATH = path.join(__dirname, "..", "package.json");

function loadPackageJson() {
  return JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));
}

test("package metadata exposes the expected entrypoints and scripts", () => {
  const pkg = loadPackageJson();

  assert.equal(pkg.main, "src/index.js");
  assert.deepEqual(pkg.exports, {
    ".": "./src/index.js"
  });
  assert.equal(pkg.bin["user-habit-pipeline"], "./src/cli.js");
  assert.equal(pkg.bin["validate-habit-registry"], "./src/validate-registry-cli.js");
  assert.equal(pkg.bin["manage-user-habits"], "./src/manage-habits-cli.js");
  assert.equal(pkg.scripts.check, "npm run check-examples-doc && npm test");
  assert.equal(
    pkg.scripts["release-check"],
    "npm run check && npm run package-smoke && npm run validate-registry -- .\\src\\habit_registry\\default_habits.json"
  );
  assert.equal(pkg.scripts.demo, "node ./src/demo.js");
  assert.equal(pkg.scripts["manual-e2e-smoke"], "pwsh -File ./scripts/manual-e2e-smoke.ps1");
  assert.equal(pkg.scripts["manage-habits"], "node ./src/manage-habits-cli.js");
  assert.equal(pkg.scripts["package-smoke"], "npm pack --dry-run");
});

test("package metadata documents the expected engine and packaged files", () => {
  const pkg = loadPackageJson();

  assert.equal(pkg.license, "UNLICENSED");
  assert.equal(pkg.engines.node, ">=18.8.0");
  assert.ok(Array.isArray(pkg.files));
  assert.ok(pkg.files.includes("src"));
  assert.ok(pkg.files.includes("scripts/manual-e2e-smoke.ps1"));
  assert.ok(pkg.files.includes("data/.gitkeep"));
  assert.ok(pkg.files.includes("CHANGELOG.md"));
  assert.ok(pkg.files.includes("docs/registry.schema.json"));
  assert.ok(pkg.files.includes("docs/api-reference.md"));
  assert.ok(pkg.files.includes("docs/versioning.md"));
  assert.ok(pkg.files.includes("docs/release-checklist.md"));
  assert.ok(pkg.files.includes("docs/cross-repo-release-checklist.md"));
  assert.ok(pkg.files.includes("docs/release-notes-v0.4.0.md"));
  assert.ok(pkg.files.includes("docs/session-habit-suggestions.md"));
  assert.ok(pkg.files.includes("docs/codex-current-session-contract.md"));
  assert.ok(pkg.files.includes("docs/freeze-assessment-0.1.0.md"));
  assert.ok(pkg.files.includes("docs/user-habit-management.md"));
});
