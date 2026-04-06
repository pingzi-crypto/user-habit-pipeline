#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const TMP_PREFIX = "user-habit-pipeline-package-install-";

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

function main() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), TMP_PREFIX));
  const packDir = path.join(tempRoot, "pack");
  const consumerDir = path.join(tempRoot, "consumer");
  const runtimeHome = path.join(tempRoot, "runtime-home");

  fs.mkdirSync(packDir, { recursive: true });
  fs.mkdirSync(consumerDir, { recursive: true });
  fs.mkdirSync(runtimeHome, { recursive: true });

  try {
    const tarballName = run("npm", ["pack", "--pack-destination", packDir], { cwd: ROOT_DIR })
      .split(/\r?\n/u)
      .filter(Boolean)
      .at(-1);

    assert.ok(tarballName, "npm pack did not return a tarball name.");

    const tarballPath = path.join(packDir, tarballName);
    run("npm", ["init", "-y"], { cwd: consumerDir });
    run("npm", ["install", tarballPath], { cwd: consumerDir });

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
