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

test("manage-habits cli can suggest habit candidates from a transcript file", () => {
  const userRegistryPath = createTempRegistryPath();
  const transcriptPath = path.join(path.dirname(userRegistryPath), "thread.txt");
  fs.writeFileSync(transcriptPath, [
    "user: 以后我说“收尾一下”就是 close_session",
    "assistant: 收到。",
    "user: 收尾一下"
  ].join("\n"), "utf8");

  const result = spawnSync(process.execPath, [
    MANAGE_CLI_PATH,
    "--suggest",
    "--transcript",
    transcriptPath,
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.action, "suggest");
  assert.equal(parsed.candidate_count, 1);
  assert.equal(parsed.candidates[0].phrase, "收尾一下");
  assert.equal(parsed.candidates[0].suggested_rule.normalized_intent, "close_session");
});

test("manage-habits cli can trigger session suggestion scans through a prompt request", () => {
  const userRegistryPath = createTempRegistryPath();

  const result = spawnSync(process.execPath, [
    MANAGE_CLI_PATH,
    "--request",
    "扫描这次会话里的习惯候选",
    "--transcript-stdin",
    "--user-registry",
    userRegistryPath
  ], {
    input: [
      "user: 收工啦",
      "assistant: 你是想结束当前线程吗？",
      "user: 收工啦"
    ].join("\n"),
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.action, "suggest");
  assert.equal(parsed.scope, "current_session");
  assert.equal(parsed.candidates[0].phrase, "收工啦");
});

test("manage-habits cli can apply a suggested candidate from a snapshot file", () => {
  const userRegistryPath = createTempRegistryPath();
  const transcriptPath = path.join(path.dirname(userRegistryPath), "apply_thread.txt");
  const suggestionsPath = path.join(path.dirname(userRegistryPath), "suggestions.json");
  fs.writeFileSync(transcriptPath, [
    "user: 以后我说“收尾一下”就是 close_session",
    "assistant: 收到。",
    "user: 收尾一下"
  ].join("\n"), "utf8");

  const suggestResult = spawnSync(process.execPath, [
    MANAGE_CLI_PATH,
    "--suggest",
    "--transcript",
    transcriptPath,
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });
  assert.equal(suggestResult.status, 0);
  fs.writeFileSync(suggestionsPath, suggestResult.stdout, "utf8");

  const applyResult = spawnSync(process.execPath, [
    MANAGE_CLI_PATH,
    "--apply-candidate",
    "c1",
    "--suggestions",
    suggestionsPath,
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });

  assert.equal(applyResult.status, 0);
  const parsed = JSON.parse(applyResult.stdout);
  assert.equal(parsed.action, "apply-candidate");
  assert.equal(parsed.candidate_id, "c1");
  assert.equal(parsed.applied_rule.phrase, "收尾一下");
  assert.equal(parsed.additions.length, 1);
});

test("manage-habits cli can apply a suggested candidate through a prompt request", () => {
  const userRegistryPath = createTempRegistryPath();
  const suggestions = {
    candidates: [
      {
        candidate_id: "c1",
        phrase: "收尾一下",
        suggested_rule: {
          phrase: "收尾一下",
          normalized_intent: "close_session",
          scenario_bias: ["general"],
          confidence: 0.84
        }
      }
    ]
  };

  const result = spawnSync(process.execPath, [
    MANAGE_CLI_PATH,
    "--request",
    "添加第1条",
    "--suggestions-stdin",
    "--user-registry",
    userRegistryPath
  ], {
    input: JSON.stringify(suggestions),
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.action, "apply-candidate");
  assert.equal(parsed.candidate_id, "c1");
  assert.equal(parsed.applied_rule.normalized_intent, "close_session");
});

test("manage-habits cli can apply a candidate from a noisy npm-style snapshot file", () => {
  const userRegistryPath = createTempRegistryPath();
  const suggestionsPath = path.join(path.dirname(userRegistryPath), "noisy_suggestions.json");
  fs.writeFileSync(suggestionsPath, [
    "> user-habit-pipeline@0.3.0 manage-habits",
    "> node ./src/manage-habits-cli.js --suggest --transcript .\\data\\thread.txt",
    "",
    JSON.stringify({
      action: "suggest",
      candidates: [
        {
          candidate_id: "c1",
          phrase: "收尾一下",
          suggested_rule: {
            phrase: "收尾一下",
            normalized_intent: "close_session",
            scenario_bias: ["general"],
            confidence: 0.84
          }
        }
      ]
    }, null, 2)
  ].join("\n"), "utf8");

  const result = spawnSync(process.execPath, [
    MANAGE_CLI_PATH,
    "--apply-candidate",
    "1",
    "--suggestions",
    suggestionsPath,
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.action, "apply-candidate");
  assert.equal(parsed.applied_rule.phrase, "收尾一下");
});

test("manage-habits cli prints help and exits zero", () => {
  const result = spawnSync(process.execPath, [MANAGE_CLI_PATH, "--help"], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: manage-user-habits/);
  assert.match(result.stdout, /--request <text>/);
  assert.match(result.stdout, /--request-stdin/);
  assert.match(result.stdout, /--suggest/);
  assert.match(result.stdout, /--apply-candidate/);
  assert.match(result.stdout, /--transcript-stdin/);
  assert.match(result.stdout, /--suggestions-stdin/);
  assert.match(result.stdout, /--export <path>/);
  assert.match(result.stdout, /--import <path>/);
});
