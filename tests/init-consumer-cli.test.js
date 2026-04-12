const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const INIT_CONSUMER_CLI_PATH = path.join(__dirname, "..", "src", "init-consumer-cli.js");

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "uhp-init-consumer-"));
}

test("init-consumer cli generates node starter files", () => {
  const tempDir = createTempDir();
  const outDir = path.join(tempDir, "node-starter");

  const result = spawnSync(process.execPath, [
    INIT_CONSUMER_CLI_PATH,
    "--host",
    "node",
    "--out",
    outDir
  ], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.host, "node");
  assert.equal(path.normalize(parsed.out_dir), path.normalize(outDir));
  assert.ok(fs.existsSync(path.join(outDir, "README.md")));
  assert.ok(fs.existsSync(path.join(outDir, "direct-library-demo.js")));
  assert.ok(fs.existsSync(path.join(outDir, "cli-subprocess-demo.js")));
  assert.ok(fs.existsSync(path.join(outDir, "embedded-http-demo.js")));
});

test("init-consumer cli generates python starter files", () => {
  const tempDir = createTempDir();
  const outDir = path.join(tempDir, "python-starter");

  const result = spawnSync(process.execPath, [
    INIT_CONSUMER_CLI_PATH,
    "--host",
    "python",
    "--out",
    outDir
  ], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.host, "python");
  assert.equal(path.normalize(parsed.out_dir), path.normalize(outDir));
  assert.ok(fs.existsSync(path.join(outDir, "README.md")));
  assert.ok(fs.existsSync(path.join(outDir, "cli-demo.py")));
  assert.ok(fs.existsSync(path.join(outDir, "http-client-demo.py")));
});

test("init-consumer cli refuses to overwrite existing files without force", () => {
  const tempDir = createTempDir();
  const outDir = path.join(tempDir, "starter");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "README.md"), "# existing\n", "utf8");

  const result = spawnSync(process.execPath, [
    INIT_CONSUMER_CLI_PATH,
    "--host",
    "node",
    "--out",
    outDir
  ], {
    encoding: "utf8"
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /--force|overwrite existing file/u);
});

test("init-consumer cli prints help and exits zero", () => {
  const result = spawnSync(process.execPath, [INIT_CONSUMER_CLI_PATH, "--help"], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /user-habit-pipeline-init-consumer/u);
  assert.match(result.stdout, /--host <node\|python>/u);
  assert.match(result.stdout, /--out <directory>/u);
});
