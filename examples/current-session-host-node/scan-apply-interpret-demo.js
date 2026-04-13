const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { interpretHabitForPreAction } = require("user-habit-pipeline");

function resolveCodexSessionInvocation() {
  const installedBin = path.join(
    process.cwd(),
    "node_modules",
    ".bin",
    process.platform === "win32" ? "codex-session-habits.cmd" : "codex-session-habits"
  );

  if (fs.existsSync(installedBin)) {
    return {
      command: installedBin,
      args: [],
      shell: process.platform === "win32"
    };
  }

  return {
    command: process.execPath,
    args: [path.join(__dirname, "..", "..", "src", "codex-session-habits-cli.js")],
    shell: false
  };
}

function runCodexSessionRequest(request, userRegistryPath, transcript) {
  const invocation = resolveCodexSessionInvocation();
  const args = [
    ...invocation.args,
    "--request",
    request,
    ...(userRegistryPath ? ["--user-registry", userRegistryPath] : [])
  ];

  if (typeof transcript === "string") {
    args.push("--thread-stdin");
  }

  const result = spawnSync(
    invocation.command,
    args,
    {
      cwd: process.cwd(),
      encoding: "utf8",
      input: transcript,
      stdio: ["pipe", "pipe", "pipe"],
      shell: invocation.shell
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error([
      `Current-session request failed: ${request}`,
      result.stdout ? `stdout:\n${result.stdout}` : null,
      result.stderr ? `stderr:\n${result.stderr}` : null
    ].filter(Boolean).join("\n\n"));
  }

  return JSON.parse(result.stdout);
}

function summarizePreAction(message, scenario, userRegistryPath) {
  const { result, pre_action_decision } = interpretHabitForPreAction(
    {
      message,
      scenario,
      recent_context: []
    },
    userRegistryPath ? { userRegistryPath } : {}
  );

  return {
    normalized_intent: result.normalized_intent,
    confidence: result.confidence,
    next_action: pre_action_decision.next_action,
    decision_basis: pre_action_decision.decision_basis,
    matched_phrase: pre_action_decision.matched_phrase
  };
}

function main() {
  const transcript = [
    "user: 以后我说“收个尾”就是 close_session",
    "assistant: 收到，我后面按 close_session 理解。",
    "user: 收个尾"
  ].join("\n");
  const message = "收个尾";
  const scenario = "session_close";
  const userRegistryPath = process.env.USER_HABIT_PIPELINE_HOME
    ? path.join(process.env.USER_HABIT_PIPELINE_HOME, "user_habits.json")
    : null;

  const before = summarizePreAction(message, scenario, userRegistryPath);
  const scan = runCodexSessionRequest("扫描这次会话里的习惯候选", userRegistryPath, transcript);
  const apply = runCodexSessionRequest("把第1条加到 session_close 场景", userRegistryPath);
  const after = summarizePreAction(message, scenario, userRegistryPath);

  process.stdout.write(`${JSON.stringify({
    integration_path: "current-session-scan-apply-interpret",
    before,
    scan: {
      action: scan.action,
      candidate_count: scan.candidate_count,
      top_phrase: scan.candidates?.[0]?.phrase || null
    },
    apply: {
      action: apply.action,
      phrase: apply.applied_rule?.phrase || null,
      normalized_intent: apply.applied_rule?.normalized_intent || null
    },
    after,
    roi_comparison: {
      interpretation_improved: before.next_action === "ask_clarifying_question" && after.next_action === "proceed",
      accepted_candidate_count: apply.action === "apply-candidate" ? 1 : 0,
      ambiguous_before_count: before.next_action === "ask_clarifying_question" ? 1 : 0,
      ambiguous_after_count: after.next_action === "ask_clarifying_question" ? 1 : 0,
      resolved_by_explicit_habit_write_count:
        before.next_action === "ask_clarifying_question" && after.next_action === "proceed" ? 1 : 0
    }
  }, null, 2)}\n`);
}

main();
