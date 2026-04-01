const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const VALIDATE_CLI_PATH = path.join(__dirname, "..", "src", "validate-registry-cli.js");

test("validate-registry cli prints help and exits zero", () => {
  const result = spawnSync(process.execPath, [VALIDATE_CLI_PATH, "--help"], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: validate-registry/);
  assert.match(result.stdout, /Validate a habit registry file/);
});
