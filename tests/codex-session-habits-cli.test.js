const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const CODEX_SESSION_HABITS_CLI_PATH = path.join(__dirname, "..", "src", "codex-session-habits-cli.js");

function createTempRegistryPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "uhp-codex-session-cli-")), "user_habits.json");
}

test("codex-session-habits cli can scan the current session from stdin", () => {
  const userRegistryPath = createTempRegistryPath();

  const result = spawnSync(process.execPath, [
    CODEX_SESSION_HABITS_CLI_PATH,
    "--request",
    "扫描这次会话里的习惯候选",
    "--thread-stdin",
    "--user-registry",
    userRegistryPath
  ], {
    input: [
      "user: 以后我说“收尾一下”就是 close_session",
      "assistant: 收到。",
      "user: 收尾一下"
    ].join("\n"),
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.action, "suggest");
  assert.equal(parsed.candidate_count, 1);
  assert.equal(parsed.candidates[0].phrase, "收尾一下");
  assert.equal(parsed.candidates[0].confidence_details.domain, "session_suggestion");
  assert.equal(parsed.candidates[0].confidence_details.final_score, 0.84);
  assert.match(parsed.assistant_reply_markdown, /发现 1 条习惯候选/u);
  assert.match(parsed.assistant_reply_markdown, /添加第1条/u);
  assert.doesNotMatch(parsed.assistant_reply_markdown, /Explicit|Repeated|Structured/u);
  assert.equal(parsed.next_step_assessment.level, "actionable");
  assert.deepEqual(parsed.suggested_follow_ups, [
    "添加第1条",
    "忽略第1条",
    "把第1条加到 session_close 场景"
  ]);
});

test("codex-session-habits cli can apply the latest cached suggestion with a short follow-up request", () => {
  const userRegistryPath = createTempRegistryPath();

  const scanResult = spawnSync(process.execPath, [
    CODEX_SESSION_HABITS_CLI_PATH,
    "--request",
    "扫描这次会话里的习惯候选",
    "--thread-stdin",
    "--user-registry",
    userRegistryPath
  ], {
    input: [
      "user: 以后我说“收尾一下”就是 close_session",
      "assistant: 收到。",
      "user: 收尾一下"
    ].join("\n"),
    encoding: "utf8"
  });

  assert.equal(scanResult.status, 0);

  const applyResult = spawnSync(process.execPath, [
    CODEX_SESSION_HABITS_CLI_PATH,
    "--request",
    "把第1条加到 session_close 场景",
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });

  assert.equal(applyResult.status, 0);
  const parsed = JSON.parse(applyResult.stdout);
  assert.equal(parsed.action, "apply-candidate");
  assert.equal(parsed.applied_rule.phrase, "收尾一下");
  assert.deepEqual(parsed.applied_rule.scenario_bias, ["session_close"]);
  assert.match(parsed.assistant_reply_markdown, /已添加用户习惯短句/u);
  assert.match(parsed.assistant_reply_markdown, /收益不高/u);
  assert.equal(parsed.next_step_assessment.level, "low_roi");
  assert.deepEqual(parsed.suggested_follow_ups, [
    "停",
    "列出用户习惯短句",
    "删除用户习惯短句: 收尾一下"
  ]);
});

test("codex-session-habits cli returns chat-ready follow-ups for review-only candidates", () => {
  const userRegistryPath = createTempRegistryPath();

  const result = spawnSync(process.execPath, [
    CODEX_SESSION_HABITS_CLI_PATH,
    "--request",
    "扫描这次会话里的习惯候选",
    "--thread-stdin",
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
  assert.equal(parsed.candidates[0].action, "review_only");
  assert.match(parsed.assistant_reply_markdown, /复核候选/u);
  assert.doesNotMatch(parsed.assistant_reply_markdown, /Explicit|Repeated|Structured/u);
  assert.equal(parsed.next_step_assessment.level, "actionable");
  assert.deepEqual(parsed.suggested_follow_ups, [
    "添加第1条",
    "忽略第1条",
    "把第1条加到 session_close 场景; intent=close_session"
  ]);
});

test("codex-session-habits cli groups additions removals and ignored phrases in list replies", () => {
  const userRegistryPath = createTempRegistryPath();

  const addResult = spawnSync(process.execPath, [
    CODEX_SESSION_HABITS_CLI_PATH,
    "--request",
    "添加用户习惯短句: phrase=收尾一下; intent=close_session; 场景=session_close; 置信度=0.86",
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });
  assert.equal(addResult.status, 0);

  const removeResult = spawnSync(process.execPath, [
    CODEX_SESSION_HABITS_CLI_PATH,
    "--request",
    "删除用户习惯短句: 验收",
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });
  assert.equal(removeResult.status, 0);

  const ignoreResult = spawnSync(process.execPath, [
    CODEX_SESSION_HABITS_CLI_PATH,
    "--request",
    "以后别再建议这个短句: 收工啦",
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });
  assert.equal(ignoreResult.status, 0);

  const listResult = spawnSync(process.execPath, [
    CODEX_SESSION_HABITS_CLI_PATH,
    "--request",
    "列出用户习惯短句",
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });

  assert.equal(listResult.status, 0);
  const parsed = JSON.parse(listResult.stdout);
  assert.equal(parsed.action, "list");
  assert.match(parsed.assistant_reply_markdown, /新增短句/u);
  assert.match(parsed.assistant_reply_markdown, /已移除短句/u);
  assert.match(parsed.assistant_reply_markdown, /已忽略建议/u);
  assert.match(parsed.assistant_reply_markdown, /收尾一下/u);
  assert.match(parsed.assistant_reply_markdown, /验收/u);
  assert.match(parsed.assistant_reply_markdown, /收工啦/u);
  assert.match(parsed.assistant_reply_markdown, /收益不高/u);
  assert.equal(parsed.next_step_assessment.level, "low_roi");
  assert.deepEqual(parsed.suggested_follow_ups, [
    "停",
    "删除用户习惯短句: 收尾一下",
    "扫描这次会话里的习惯候选"
  ]);
});

test("codex-session-habits cli gives a clear empty-state list reply", () => {
  const userRegistryPath = createTempRegistryPath();

  const result = spawnSync(process.execPath, [
    CODEX_SESSION_HABITS_CLI_PATH,
    "--request",
    "列出用户习惯短句",
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.action, "list");
  assert.match(parsed.assistant_reply_markdown, /当前还没有任何用户习惯短句或忽略记录/u);
  assert.equal(parsed.next_step_assessment.level, "actionable");
  assert.deepEqual(parsed.suggested_follow_ups, [
    "扫描这次会话里的习惯候选"
  ]);
});

test("codex-session-habits cli accepts a one-word low-roi stop request", () => {
  const userRegistryPath = createTempRegistryPath();

  const result = spawnSync(process.execPath, [
    CODEX_SESSION_HABITS_CLI_PATH,
    "--request",
    "停",
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });

  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.action, "stop");
  assert.equal(parsed.stop_request, "停");
  assert.match(parsed.assistant_reply_markdown, /当前这个方向先停/u);
  assert.equal(parsed.next_step_assessment.level, "stopped");
  assert.deepEqual(parsed.suggested_follow_ups, []);
});

test("codex-session-habits cli requires a thread source for current-session scans", () => {
  const userRegistryPath = createTempRegistryPath();

  const result = spawnSync(process.execPath, [
    CODEX_SESSION_HABITS_CLI_PATH,
    "--request",
    "扫描这次会话里的习惯候选",
    "--user-registry",
    userRegistryPath
  ], {
    encoding: "utf8"
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Current-session suggestion scans require --thread <path> or --thread-stdin\./);
});
