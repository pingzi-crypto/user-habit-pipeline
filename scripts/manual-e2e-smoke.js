"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function parseArgs(argv) {
  const options = {
    userRegistryPath: null,
    tempRoot: null,
    includeSkillSmoke: false,
    skillRepoPath: null
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    switch (token) {
      case "--user-registry":
        index += 1;
        options.userRegistryPath = argv[index];
        break;
      case "--temp-root":
        index += 1;
        options.tempRoot = argv[index];
        break;
      case "--include-skill-smoke":
        options.includeSkillSmoke = true;
        break;
      case "--skill-repo-path":
        index += 1;
        options.skillRepoPath = argv[index];
        break;
      default:
        throw new Error(`Unknown option: ${token}`);
    }
  }

  return options;
}

function addResult(results, name, status, detail) {
  results.push({ name, status, detail: String(detail) });
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function runCommand(command, args, options = {}) {
  const executable = process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  const useWindowsShell = process.platform === "win32" && /\.(cmd|bat)$/iu.test(executable);
  const result = spawnSync(executable, args, {
    cwd: options.cwd,
    env: options.env,
    input: options.input,
    encoding: "utf8",
    shell: useWindowsShell
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const detail = [result.stderr, result.stdout].filter(Boolean).join("\n").trim();
    throw new Error(detail || `${command} exited with status ${result.status}`);
  }

  return result.stdout;
}

function invokeJsonCommand(executable, args, inputText) {
  const output = runCommand(executable, args, { input: inputText });
  const rawText = output.trim();
  if (!rawText) {
    throw new Error("Command returned empty output.");
  }

  return JSON.parse(rawText);
}

function testStep(results, name, action) {
  try {
    const detail = action();
    addResult(results, name, "pass", detail);
  } catch (error) {
    addResult(results, name, "fail", error.message);
    throw error;
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = path.resolve(__dirname, "..");
  const nodeCommand = process.execPath;
  const codexCliPath = path.join(repoRoot, "src", "codex-session-habits-cli.js");
  const interpretCliPath = path.join(repoRoot, "src", "cli.js");
  const projectPrinciplesPath = path.join(repoRoot, "docs", "project-principles.md");
  const workspaceRoot = path.dirname(repoRoot);
  const skillRepoPath = path.resolve(options.skillRepoPath || path.join(workspaceRoot, "manage-current-session-habits"));
  const tempRoot = path.resolve(options.tempRoot || path.join(os.tmpdir(), "uhp-e2e-smoke"));
  const userRegistryPath = path.resolve(options.userRegistryPath || path.join(tempRoot, "manual_e2e_user_habits.json"));
  const suggestionCachePath = path.join(path.dirname(userRegistryPath), ".last_session_habit_suggestions.json");

  fs.mkdirSync(tempRoot, { recursive: true });
  fs.rmSync(userRegistryPath, { force: true });
  fs.rmSync(suggestionCachePath, { force: true });

  const results = [];
  const sharedArgs = [codexCliPath, "--user-registry", userRegistryPath];

  try {
    testStep(results, "baseline_list_empty", () => {
      const parsed = invokeJsonCommand(nodeCommand, [...sharedArgs, "--request", "列出用户习惯短句"]);
      assertTrue(parsed.action === "list", "Expected list action.");
      assertTrue(
        /当前还没有任何用户习惯短句或忽略记录/u.test(parsed.assistant_reply_markdown),
        "Expected empty-state list summary."
      );
      assertTrue(parsed.suggested_follow_ups.includes("扫描这次会话里的习惯候选"), "Expected scan follow-up.");
      return "empty-state list reply verified";
    });

    testStep(results, "scan_explicit_definition", () => {
      const transcript = ['user: 以后我说“收尾一下”就是 close_session', "assistant: 收到。", "user: 收尾一下"].join("\n");
      const parsed = invokeJsonCommand(
        nodeCommand,
        [...sharedArgs, "--request", "扫描这次会话里的习惯候选", "--thread-stdin"],
        transcript
      );
      assertTrue(parsed.action === "suggest", "Expected suggest action.");
      assertTrue(parsed.candidate_count === 1, "Expected exactly one candidate.");
      assertTrue(parsed.candidates[0].phrase === "收尾一下", "Expected candidate phrase 收尾一下.");
      assertTrue(parsed.candidates[0].suggested_rule.normalized_intent === "close_session", "Expected close_session intent.");
      assertTrue(parsed.candidates[0].confidence_details != null, "Expected confidence_details.");
      assertTrue(parsed.suggested_follow_ups.includes("添加第1条"), "Expected apply follow-up.");
      return "definition scan verified";
    });

    testStep(results, "apply_cached_candidate", () => {
      const parsed = invokeJsonCommand(nodeCommand, [...sharedArgs, "--request", "把第1条加到 session_close 场景"]);
      assertTrue(parsed.action === "apply-candidate", "Expected apply-candidate action.");
      assertTrue(parsed.applied_rule.phrase === "收尾一下", "Expected applied phrase 收尾一下.");
      assertTrue(parsed.applied_rule.normalized_intent === "close_session", "Expected close_session applied intent.");
      assertTrue(parsed.applied_rule.scenario_bias.includes("session_close"), "Expected session_close scenario.");
      assertTrue(/已添加用户习惯短句/u.test(parsed.assistant_reply_markdown), "Expected apply confirmation markdown.");
      return "cached apply verified";
    });

    testStep(results, "interpret_added_phrase", () => {
      const parsed = invokeJsonCommand(nodeCommand, [
        interpretCliPath,
        "--message",
        "收尾一下",
        "--scenario",
        "session_close",
        "--user-registry",
        userRegistryPath
      ]);
      assertTrue(parsed.normalized_intent === "close_session", "Expected interpret result close_session.");
      assertTrue(!parsed.should_ask_clarifying_question, "Expected no clarifying question.");
      assertTrue(Number(parsed.confidence) > 0, "Expected positive confidence.");
      return "interpret flow verified";
    });

    testStep(results, "scan_correction_style_definition", () => {
      const transcript = [
        "user: 我这里的“收工啦”不是结束线程，是 close_session 场景=session_close",
        "assistant: 收到，我后面按 close_session 理解。",
        "user: 收工啦"
      ].join("\n");
      const parsed = invokeJsonCommand(
        nodeCommand,
        [...sharedArgs, "--request", "扫描这次会话里的习惯候选", "--thread-stdin"],
        transcript
      );
      assertTrue(parsed.action === "suggest", "Expected suggest action.");
      assertTrue(parsed.candidate_count === 1, "Expected exactly one candidate.");
      assertTrue(parsed.candidates[0].phrase === "收工啦", "Expected candidate phrase 收工啦.");
      assertTrue(parsed.candidates[0].suggested_rule.normalized_intent === "close_session", "Expected close_session intent.");
      assertTrue(parsed.candidates[0].evidence.correction_count === 1, "Expected correction evidence count 1.");
      assertTrue(/显式纠正式定义/u.test(parsed.assistant_reply_markdown), "Expected correction-style evidence in markdown.");
      return "correction-style definition scan verified";
    });

    testStep(results, "scan_review_only_phrase", () => {
      const transcript = ["user: 收工啦", "assistant: 你是想结束当前线程吗？", "user: 收工啦"].join("\n");
      const parsed = invokeJsonCommand(
        nodeCommand,
        [...sharedArgs, "--request", "扫描这次会话里的习惯候选", "--thread-stdin"],
        transcript
      );
      assertTrue(parsed.candidates[0].action === "review_only", "Expected review_only candidate.");
      assertTrue(parsed.candidates[0].suggested_rule === null, "Expected null suggested_rule.");
      assertTrue(parsed.candidates[0].risk_flags.includes("single_thread_only"), "Expected single_thread_only risk.");
      assertTrue(parsed.candidates[0].risk_flags.includes("missing_intent"), "Expected missing_intent risk.");
      assertTrue(parsed.suggested_follow_ups.includes("忽略第1条"), "Expected ignore follow-up.");
      return "review-only scan verified";
    });

    testStep(results, "ignore_noisy_candidate", () => {
      const parsed = invokeJsonCommand(nodeCommand, [...sharedArgs, "--request", "忽略第1条"]);
      assertTrue(parsed.action === "ignore-candidate", "Expected ignore-candidate action.");
      assertTrue(parsed.ignored_phrase === "收工啦", "Expected ignored phrase 收工啦.");
      assertTrue(/已忽略短句/u.test(parsed.assistant_reply_markdown), "Expected ignore confirmation markdown.");
      return "ignore flow verified";
    });

    testStep(results, "low_roi_stop_request", () => {
      const parsed = invokeJsonCommand(nodeCommand, [...sharedArgs, "--request", "停"]);
      assertTrue(parsed.action === "stop", "Expected stop action.");
      assertTrue(parsed.stop_request === "停", "Expected stop_request 停.");
      assertTrue(/当前这个方向先停/u.test(parsed.assistant_reply_markdown), "Expected local stop confirmation markdown.");
      assertTrue(parsed.next_step_assessment.level === "stopped", "Expected stopped assessment level.");
      return "one-word stop path verified";
    });

    testStep(results, "list_additions_and_ignored", () => {
      const parsed = invokeJsonCommand(nodeCommand, [...sharedArgs, "--request", "列出用户习惯短句"]);
      assertTrue(parsed.action === "list", "Expected list action.");
      assertTrue(/新增短句/u.test(parsed.assistant_reply_markdown), "Expected additions section.");
      assertTrue(/已忽略建议/u.test(parsed.assistant_reply_markdown), "Expected ignored suggestions section.");
      assertTrue(/收尾一下/u.test(parsed.assistant_reply_markdown), "Expected 收尾一下 in list.");
      assertTrue(/收工啦/u.test(parsed.assistant_reply_markdown), "Expected 收工啦 in list.");
      return "list additions/ignored verified";
    });

    testStep(results, "remove_and_relist", () => {
      const removeParsed = invokeJsonCommand(nodeCommand, [...sharedArgs, "--request", "删除用户习惯短句: 收尾一下"]);
      assertTrue(removeParsed.action === "remove", "Expected remove action.");
      const listParsed = invokeJsonCommand(nodeCommand, [...sharedArgs, "--request", "列出用户习惯短句"]);
      assertTrue(/已移除短句/u.test(listParsed.assistant_reply_markdown), "Expected removals section.");
      assertTrue(/收尾一下/u.test(listParsed.assistant_reply_markdown), "Expected 收尾一下 in removals.");
      return "remove and re-list verified";
    });

    testStep(results, "low_roi_guidance_present", () => {
      const projectPrinciples = fs.readFileSync(projectPrinciplesPath, "utf8");
      assertTrue(/停|跳过/u.test(projectPrinciples), "Expected stop word guidance in project principles.");
      assertTrue(/低 ROI|low ROI|不太划算/u.test(projectPrinciples), "Expected low-ROI wording in project principles.");

      if (fs.existsSync(skillRepoPath)) {
        const skillPath = path.join(skillRepoPath, "SKILL.md");
        const interactionPath = path.join(skillRepoPath, "references", "interaction-patterns.md");
        const skillText = fs.readFileSync(skillPath, "utf8");
        const interactionText = fs.readFileSync(interactionPath, "utf8");
        assertTrue(/停|跳过/u.test(skillText), "Expected stop word guidance in skill instructions.");
        assertTrue(/不太划算|低 ROI/u.test(interactionText), "Expected low-ROI template in interaction patterns.");
      }

      return "low-ROI guidance verified";
    });

    if (options.includeSkillSmoke) {
      testStep(results, "skill_smoke_test", () => {
        const checkInstallJsPath = path.join(skillRepoPath, "scripts", "check-install.js");
        const checkInstallPs1Path = path.join(skillRepoPath, "scripts", "check-install.ps1");

        if (fs.existsSync(checkInstallJsPath)) {
          const output = runCommand(nodeCommand, [checkInstallJsPath, "--smoke-test"]);
          assertTrue(/\[OK\] smoke_test/u.test(output), "Expected [OK] smoke_test output.");
          return "optional skill smoke verified";
        }

        if (fs.existsSync(checkInstallPs1Path)) {
          const output = runCommand("pwsh", ["-File", checkInstallPs1Path, "-SmokeTest"]);
          assertTrue(/\[OK\] smoke_test/u.test(output), "Expected [OK] smoke_test output.");
          return "optional skill smoke verified";
        }

        throw new Error(`Skill smoke script was not found under ${path.join(skillRepoPath, "scripts")}`);
      });
    }
  } finally {
    for (const result of results) {
      console.log(`[${result.status.toUpperCase()}] ${result.name} - ${result.detail}`);
    }
  }

  if (results.some((item) => item.status === "fail")) {
    process.exitCode = 1;
    return;
  }

  console.log(`[PASS] summary - ${results.length} acceptance checks passed.`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
