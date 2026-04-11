const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const PACKAGE_JSON_PATH = path.join(__dirname, "..", "package.json");
const PACKAGE_TYPES_PATH = path.join(__dirname, "..", "src", "index.d.ts");

function loadPackageJson() {
  return JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, "utf8"));
}

function loadPackageTypes() {
  return fs.readFileSync(PACKAGE_TYPES_PATH, "utf8");
}

test("package metadata exposes the expected entrypoints and scripts", () => {
  const pkg = loadPackageJson();

  assert.equal(pkg.private, false);
  assert.equal(pkg.main, "src/index.js");
  assert.equal(pkg.types, "src/index.d.ts");
  assert.deepEqual(pkg.exports, {
    ".": "./src/index.js"
  });
  assert.equal(pkg.bin["user-habit-pipeline"], "./src/cli.js");
  assert.equal(pkg.bin["user-habit-pipeline-init-registry"], "./src/init-registry-cli.js");
  assert.equal(pkg.bin["validate-habit-registry"], "./src/validate-registry-cli.js");
  assert.equal(pkg.bin["manage-user-habits"], "./src/manage-habits-cli.js");
  assert.equal(pkg.bin["codex-session-habits"], "./src/codex-session-habits-cli.js");
  assert.equal(pkg.bin["user-habit-pipeline-http"], "./src/http-server-cli.js");
  assert.equal(pkg.scripts.build, "tsc -p ./tsconfig.json");
  assert.equal(pkg.scripts.check, "npm run check-examples-doc && npm test");
  assert.equal(pkg.scripts["http-server"], "node ./src/http-server-cli.js");
  assert.equal(pkg.scripts["init-registry"], "node ./src/init-registry-cli.js");
  assert.equal(
    pkg.scripts["release-check"],
    "npm run check && npm run manual-e2e-smoke && npm run package-smoke && npm run package-install-smoke && npm run validate-registry -- .\\src\\habit_registry\\default_habits.json"
  );
  assert.equal(pkg.scripts.test, "npm run build && node --test");
  assert.equal(pkg.scripts.demo, "node ./src/demo.js");
  assert.equal(pkg.scripts["manual-e2e-smoke"], "pwsh -File ./scripts/manual-e2e-smoke.ps1");
  assert.equal(pkg.scripts["manage-habits"], "node ./src/manage-habits-cli.js");
  assert.equal(pkg.scripts.prepublishOnly, "npm run release-check");
  assert.equal(pkg.scripts["package-smoke"], "npm pack --dry-run");
  assert.equal(pkg.scripts["package-install-smoke"], "node ./scripts/package-install-smoke.js");
});

test("package metadata documents the expected engine and packaged files", () => {
  const pkg = loadPackageJson();

  assert.equal(pkg.license, "Apache-2.0");
  assert.equal(pkg.homepage, "https://github.com/pingzi-crypto/user-habit-pipeline#readme");
  assert.equal(pkg.repository.type, "git");
  assert.equal(pkg.repository.url, "https://github.com/pingzi-crypto/user-habit-pipeline.git");
  assert.equal(pkg.bugs.url, "https://github.com/pingzi-crypto/user-habit-pipeline/issues");
  assert.equal(pkg.engines.node, ">=18.8.0");
  assert.equal(typeof pkg.devDependencies.typescript, "string");
  assert.equal(typeof pkg.devDependencies["@types/node"], "string");
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
  assert.ok(pkg.files.includes("docs/cross-repo-release-runbook.md"));
  assert.ok(pkg.files.includes("docs/release-notes-v0.4.0.md"));
  assert.ok(pkg.files.includes("docs/release-notes-v0.4.3.md"));
  assert.ok(pkg.files.includes("docs/session-habit-suggestions.md"));
  assert.ok(pkg.files.includes("docs/codex-current-session-contract.md"));
  assert.ok(pkg.files.includes("docs/freeze-assessment-0.1.0.md"));
  assert.ok(pkg.files.includes("docs/user-habit-management.md"));
  assert.ok(pkg.files.includes("examples/project-registry/custom-habits.json"));
  assert.ok(pkg.files.includes("examples/project-registry/README.md"));
  assert.ok(pkg.files.includes("examples/project-registry/smoke-test.js"));
});

test("package types expose the public API surface", () => {
  const declaration = loadPackageTypes();

  assert.match(declaration, /USER_REGISTRY_PATH/u);
  assert.match(declaration, /interpretHabit/u);
  assert.match(declaration, /validateHabitRules/u);
  assert.doesNotMatch(declaration.trim(), /^export \{\};?$/u);
});

test("typescript source files do not rely on ts-nocheck", () => {
  let output = "";

  try {
    output = execFileSync(
      "rg",
      ["-n", "@ts-nocheck", "src", "-g", "*.ts"],
      {
        cwd: path.join(__dirname, ".."),
        encoding: "utf8"
      }
    ).trim();
  } catch (error) {
    assert.equal(error.status, 1);
    output = String(error.stdout || "").trim();
  }

  assert.equal(output, "");
});
