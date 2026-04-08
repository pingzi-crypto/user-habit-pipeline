const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const INIT_REGISTRY_CLI_PATH = path.join(__dirname, "..", "src", "init-registry-cli.js");

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "uhp-init-registry-"));
}

test("init-registry cli generates starter files", () => {
  const tempDir = createTempDir();
  const outDir = path.join(tempDir, "starter");

  const result = spawnSync(process.execPath, [
    INIT_REGISTRY_CLI_PATH,
    "--out",
    outDir
  ], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(path.normalize(parsed.out_dir), path.normalize(outDir));
  assert.ok(fs.existsSync(path.join(outDir, "custom-habits.json")));
  assert.ok(fs.existsSync(path.join(outDir, "README.md")));
  assert.ok(fs.existsSync(path.join(outDir, "smoke-test.js")));
});

test("init-registry cli refuses to overwrite existing files without force", () => {
  const tempDir = createTempDir();
  const outDir = path.join(tempDir, "starter");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "README.md"), "# existing\n", "utf8");

  const result = spawnSync(process.execPath, [
    INIT_REGISTRY_CLI_PATH,
    "--out",
    outDir
  ], {
    encoding: "utf8"
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /--force|overwrite existing file/u);
});

test("init-registry cli prints help and exits zero", () => {
  const result = spawnSync(process.execPath, [INIT_REGISTRY_CLI_PATH, "--help"], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /user-habit-pipeline-init-registry/u);
  assert.match(result.stdout, /--out <directory>/u);
});
