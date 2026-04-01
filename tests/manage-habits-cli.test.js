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

test("manage-habits cli can export and import overlay files", () => {
  const sourceRegistryPath = createTempRegistryPath();
  const destinationRegistryPath = createTempRegistryPath();
  const exportPath = path.join(path.dirname(sourceRegistryPath), "exported_overlay.json");

  const addResult = spawnSync(process.execPath, [
    MANAGE_CLI_PATH,
    "--add",
    "--phrase",
    "收尾一下",
    "--intent",
    "close_session",
    "--scenario",
    "session_close",
    "--user-registry",
    sourceRegistryPath
  ], {
    encoding: "utf8"
  });
  assert.equal(addResult.status, 0);

  const exportResult = spawnSync(process.execPath, [
    MANAGE_CLI_PATH,
    "--export",
    exportPath,
    "--user-registry",
    sourceRegistryPath
  ], {
    encoding: "utf8"
  });
  assert.equal(exportResult.status, 0);
  const exported = JSON.parse(exportResult.stdout);
  assert.equal(exported.action, "export");

  const importResult = spawnSync(process.execPath, [
    MANAGE_CLI_PATH,
    "--import",
    exportPath,
    "--user-registry",
    destinationRegistryPath
  ], {
    encoding: "utf8"
  });
  assert.equal(importResult.status, 0);
  const imported = JSON.parse(importResult.stdout);
  assert.equal(imported.action, "import");
  assert.equal(imported.additions.length, 1);
  assert.equal(imported.additions[0].phrase, "收尾一下");
});

test("manage-habits cli respects prompt import mode=merge", () => {
  const sourceRegistryPath = createTempRegistryPath();
  const destinationRegistryPath = createTempRegistryPath();
  const exportPath = path.join(path.dirname(sourceRegistryPath), "merge_overlay.json");

  spawnSync(process.execPath, [
    MANAGE_CLI_PATH,
    "--add",
    "--phrase",
    "收尾一下",
    "--intent",
    "close_session",
    "--scenario",
    "session_close",
    "--user-registry",
    sourceRegistryPath
  ], { encoding: "utf8" });

  spawnSync(process.execPath, [
    MANAGE_CLI_PATH,
    "--export",
    exportPath,
    "--user-registry",
    sourceRegistryPath
  ], { encoding: "utf8" });

  spawnSync(process.execPath, [
    MANAGE_CLI_PATH,
    "--add",
    "--phrase",
    "复盘一下",
    "--intent",
    "close_session",
    "--scenario",
    "session_close",
    "--user-registry",
    destinationRegistryPath
  ], { encoding: "utf8" });

  const result = spawnSync(process.execPath, [
    MANAGE_CLI_PATH,
    "--request",
    `导入习惯短句 路径=${exportPath}; 模式=merge`,
    "--user-registry",
    destinationRegistryPath
  ], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.action, "import");
  assert.equal(parsed.mode, "merge");
  assert.deepEqual(
    parsed.additions.map((item) => item.phrase).sort(),
    ["复盘一下", "收尾一下"].sort()
  );
});

test("manage-habits cli can read a multiline prompt request from stdin", () => {
  const userRegistryPath = createTempRegistryPath();

  const result = spawnSync(process.execPath, [
    MANAGE_CLI_PATH,
    "--request-stdin",
    "--user-registry",
    userRegistryPath
  ], {
    input: "新增习惯短句 phrase=收尾一下\nintent=close_session\n场景=session_close\n置信度=0.86\n",
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.action, "add");
  assert.equal(parsed.added_rule.phrase, "收尾一下");
  assert.equal(parsed.added_rule.normalized_intent, "close_session");
  assert.deepEqual(parsed.added_rule.scenario_bias, ["session_close"]);
  assert.equal(parsed.added_rule.confidence, 0.86);
});

test("manage-habits cli prints help and exits zero", () => {
  const result = spawnSync(process.execPath, [MANAGE_CLI_PATH, "--help"], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: manage-user-habits/);
  assert.match(result.stdout, /--request <text>/);
  assert.match(result.stdout, /--request-stdin/);
  assert.match(result.stdout, /--export <path>/);
  assert.match(result.stdout, /--import <path>/);
});
