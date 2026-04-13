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

  const result = spawnSync(invocation.command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    input: transcript,
    stdio: ["pipe", "pipe", "pipe"],
    shell: invocation.shell
  });

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
    { message, scenario, recent_context: [] },
    userRegistryPath ? { userRegistryPath } : {}
  );

  return {
    normalized_intent: result.normalized_intent,
    confidence: result.confidence,
    next_action: pre_action_decision.next_action,
    decision_basis: pre_action_decision.decision_basis
  };
}

function main() {
  const transcript = [
    "user: 以后我说“收个尾”就是 close_session",
    "assistant: 收到，我后面按 close_session 理解。",
    "user: 收个尾"
  ].join("\n");
  const userRegistryPath = process.env.USER_HABIT_PIPELINE_HOME
    ? path.join(process.env.USER_HABIT_PIPELINE_HOME, "user_habits.json")
    : null;

  const before = summarizePreAction("收个尾", "session_close", userRegistryPath);
  const scan = runCodexSessionRequest("扫描这次会话里的习惯候选", userRegistryPath, transcript);
  const apply = runCodexSessionRequest("把第1条加到 session_close 场景", userRegistryPath);
  const after = summarizePreAction("收个尾", "session_close", userRegistryPath);

  process.stdout.write(`${JSON.stringify({
    integration_path: "current-session-happy-path",
    story: [
      {
        step: 1,
        label: "before_apply",
        outcome: "same shorthand still needs clarification",
        next_action: before.next_action
      },
      {
        step: 2,
        label: "scan_current_session",
        outcome: "candidate surfaced from visible transcript",
        candidate_count: scan.candidate_count,
        phrase: scan.candidates?.[0]?.phrase || null
      },
      {
        step: 3,
        label: "apply_candidate",
        outcome: "durable habit write happened only after explicit confirmation",
        action: apply.action,
        phrase: apply.applied_rule?.phrase || null
      },
      {
        step: 4,
        label: "after_apply",
        outcome: "same shorthand is now clear enough to proceed",
        next_action: after.next_action,
        normalized_intent: after.normalized_intent
      }
    ],
    roi_summary: {
      interpretation_improved: before.next_action === "ask_clarifying_question" && after.next_action === "proceed",
      candidate_surfaced_count: scan.candidate_count > 0 ? 1 : 0,
      accepted_candidate_count: apply.action === "apply-candidate" ? 1 : 0,
      clarification_before_count: before.next_action === "ask_clarifying_question" ? 1 : 0,
      clarification_after_count: after.next_action === "ask_clarifying_question" ? 1 : 0
    }
  }, null, 2)}\n`);
}

main();
