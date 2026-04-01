const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const MANAGE_CLI_PATH = path.join(__dirname, "..", "src", "manage-habits-cli.js");

function createTempRegistryPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "uhp-manage-cli-")), "user_habits.json");
}

test("manage-habits cli can add and list habits through prompt requests", () => {
  const userRegistryPath = createTempRegistryPath();

  const addResult = spawnSync(process.execPath, [
    MANAGE_CLI_PATH,
    "--request",
    "添加用户习惯短句: phrase=收尾一下; intent=close_session; 场景=session_close; 置信度=0.86",
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });

  assert.equal(addResult.status, 0);
  const added = JSON.parse(addResult.stdout);
  assert.equal(added.action, "add");
  assert.equal(added.added_rule.phrase, "收尾一下");

  const listResult = spawnSync(process.execPath, [
    MANAGE_CLI_PATH,
    "--list",
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });

  assert.equal(listResult.status, 0);
  const listed = JSON.parse(listResult.stdout);
  assert.equal(listed.action, "list");
  assert.equal(listed.additions.length, 1);
});

test("manage-habits cli can remove a phrase through a prompt request", () => {
  const userRegistryPath = createTempRegistryPath();

  const result = spawnSync(process.execPath, [
    MANAGE_CLI_PATH,
    "--request",
    "删除用户习惯短句: 验收",
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.action, "remove");
  assert.deepEqual(parsed.removals, ["验收"]);
});

test("manage-habits cli prints help and exits zero", () => {
  const result = spawnSync(process.execPath, [MANAGE_CLI_PATH, "--help"], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: manage-user-habits/);
  assert.match(result.stdout, /--request <text>/);
});
