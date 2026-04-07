#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const TMP_PREFIX = "user-habit-pipeline-package-install-";

function createNpmExecEnv(baseEnv = process.env) {
  const env = { ...baseEnv };

  // `npm publish --dry-run` forwards npm_config_dry_run into lifecycle scripts.
  // This smoke test needs a real tarball and real local install inside its temp dir.
  delete env.npm_config_dry_run;
  delete env.NPM_CONFIG_DRY_RUN;

  return env;
}

function run(command, args, options = {}) {
  const executable = process.platform === "win32" && !path.extname(command)
    ? `${command}.cmd`
    : command;

  const result = spawnSync(executable, args, {
    cwd: options.cwd || ROOT_DIR,
    env: options.env || process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const detail = [
      `Command failed: ${executable} ${args.join(" ")}`,
      result.stdout ? `stdout:\n${result.stdout}` : null,
      result.stderr ? `stderr:\n${result.stderr}` : null
    ].filter(Boolean).join("\n\n");
    throw new Error(detail);
  }

  return String(result.stdout || "").trim();
}

function resolveInstalledBin(consumerDir, binName) {
  const suffix = process.platform === "win32" ? ".cmd" : "";
  return path.join(consumerDir, "node_modules", ".bin", `${binName}${suffix}`);
}

function readJson(text, sourceLabel) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${sourceLabel} did not return valid JSON.\n\n${text}`);
  }
}

function runNodeEval(script, options = {}) {
  return run(process.execPath, ["-e", script], options);
}

function runWithInput(command, args, inputText, options = {}) {
  const executable = process.platform === "win32" && !path.extname(command)
    ? `${command}.cmd`
    : command;

  const result = spawnSync(executable, args, {
    cwd: options.cwd || ROOT_DIR,
    env: options.env || process.env,
    encoding: "utf8",
    input: inputText,
    stdio: ["pipe", "pipe", "pipe"]
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const detail = [
      `Command failed: ${executable} ${args.join(" ")}`,
      result.stdout ? `stdout:\n${result.stdout}` : null,
      result.stderr ? `stderr:\n${result.stderr}` : null
    ].filter(Boolean).join("\n\n");
    throw new Error(detail);
  }

  return String(result.stdout || "").trim();
}

function main() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), TMP_PREFIX));
  const packDir = path.join(tempRoot, "pack");
  const consumerDir = path.join(tempRoot, "consumer");
  const runtimeHome = path.join(tempRoot, "runtime-home");
  const npmEnv = createNpmExecEnv();

  fs.mkdirSync(packDir, { recursive: true });
  fs.mkdirSync(consumerDir, { recursive: true });
  fs.mkdirSync(runtimeHome, { recursive: true });

  try {
    const tarballName = run("npm", ["pack", "--pack-destination", packDir], { cwd: ROOT_DIR, env: npmEnv })
      .split(/\r?\n/u)
      .filter(Boolean)
      .at(-1);

    assert.ok(tarballName, "npm pack did not return a tarball name.");

    const tarballPath = path.join(packDir, tarballName);
    run("npm", ["init", "-y"], { cwd: consumerDir, env: npmEnv });
    run("npm", ["install", tarballPath], { cwd: consumerDir, env: npmEnv });

    const env = {
      ...process.env,
      USER_HABIT_PIPELINE_HOME: runtimeHome
    };

    const manageBin = resolveInstalledBin(consumerDir, "manage-user-habits");
    const interpretBin = resolveInstalledBin(consumerDir, "user-habit-pipeline");
    const codexBin = resolveInstalledBin(consumerDir, "codex-session-habits");

    const addOutput = readJson(
      run(manageBin, [
        "--add",
        "--phrase",
        "收尾一下",
        "--intent",
        "close_session",
        "--scenario",
        "session_close",
        "--confidence",
        "0.86"
      ], { cwd: consumerDir, env }),
      "manage-user-habits --add"
    );
    assert.equal(addOutput.action, "add");
    assert.equal(addOutput.added_rule.phrase, "收尾一下");

    const listOutput = readJson(
      run(manageBin, ["--list"], { cwd: consumerDir, env }),
      "manage-user-habits --list"
    );
    assert.equal(listOutput.action, "list");
    assert.equal(listOutput.additions.length, 1);
    assert.ok(
      path.normalize(listOutput.registry_path).startsWith(path.normalize(runtimeHome)),
      "User registry path should resolve inside the configured runtime home."
    );

    const interpretOutput = readJson(
      run(interpretBin, ["--message", "收尾一下", "--scenario", "session_close"], { cwd: consumerDir, env }),
      "user-habit-pipeline"
    );
    assert.equal(interpretOutput.normalized_intent, "close_session");
    assert.equal(interpretOutput.should_ask_clarifying_question, false);

    const stopOutput = readJson(
      run(codexBin, ["--request", "停"], { cwd: consumerDir, env }),
      "codex-session-habits"
    );
    assert.equal(stopOutput.action, "stop");

    const correctionScanOutput = readJson(
      runWithInput(
        codexBin,
        ["--request", "扫描这次会话里的习惯候选", "--thread-stdin"],
        [
          "user: 我这里的“收工啦”不是结束线程，是 close_session 场景=session_close",
          "assistant: 收到，我后面按 close_session 理解。",
          "user: 收工啦"
        ].join("\n"),
        { cwd: consumerDir, env }
      ),
      "codex-session-habits correction scan"
    );
    assert.equal(correctionScanOutput.action, "suggest");
    assert.equal(correctionScanOutput.candidate_count, 1);
    assert.equal(correctionScanOutput.candidates[0].phrase, "收工啦");
    assert.equal(correctionScanOutput.candidates[0].suggested_rule.normalized_intent, "close_session");
    assert.equal(correctionScanOutput.candidates[0].evidence.correction_count, 1);
    assert.match(correctionScanOutput.assistant_reply_markdown, /显式纠正式定义/u);
    assert.ok(
      path.normalize(correctionScanOutput.suggestions_cache_path).startsWith(path.normalize(runtimeHome)),
      "Suggestion cache path should resolve inside the configured runtime home."
    );

    const correctionApplyOutput = readJson(
      run(codexBin, ["--request", "添加第1条"], { cwd: consumerDir, env }),
      "codex-session-habits apply cached candidate"
    );
    assert.equal(correctionApplyOutput.action, "apply-candidate");
    assert.equal(correctionApplyOutput.applied_rule.phrase, "收工啦");
    assert.equal(correctionApplyOutput.applied_rule.normalized_intent, "close_session");

    const listAfterApplyOutput = readJson(
      run(manageBin, ["--list"], { cwd: consumerDir, env }),
      "manage-user-habits --list after cached apply"
    );
    assert.equal(listAfterApplyOutput.action, "list");
    assert.equal(listAfterApplyOutput.additions.length, 2);
    assert.ok(
      listAfterApplyOutput.additions.some((item) => item.phrase === "收工啦" && item.normalized_intent === "close_session"),
      "Expected cached candidate apply to persist 收工啦."
    );

    const libraryOutput = readJson(
      runNodeEval(
        [
          'const pkg = require("user-habit-pipeline");',
          'const result = pkg.interpretHabit({ message: "收尾一下", scenario: "session_close" });',
          'process.stdout.write(JSON.stringify({',
          '  package_name: pkg.PACKAGE_NAME,',
          '  home_env: pkg.USER_HOME_OVERRIDE_ENV,',
          '  normalized_intent: result.normalized_intent,',
          '  registry_path: pkg.resolveDefaultUserRegistryPath()',
          '}, null, 2));'
        ].join("\n"),
        { cwd: consumerDir, env }
      ),
      'require("user-habit-pipeline")'
    );
    assert.equal(libraryOutput.package_name, "user-habit-pipeline");
    assert.equal(libraryOutput.home_env, "USER_HABIT_PIPELINE_HOME");
    assert.equal(libraryOutput.normalized_intent, "close_session");
    assert.ok(
      path.normalize(libraryOutput.registry_path).startsWith(path.normalize(runtimeHome)),
      "Library export should resolve the default user registry path inside the configured runtime home."
    );

    process.stdout.write(
      `${JSON.stringify({
        ok: true,
        tarball: tarballName,
        temp_root: tempRoot,
        runtime_home: runtimeHome
      }, null, 2)}\n`
    );
  } finally {
    if (process.env.USER_HABIT_PIPELINE_KEEP_SMOKE_TMP !== "1") {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  }
}

if (require.main === module) {
  main();
}
