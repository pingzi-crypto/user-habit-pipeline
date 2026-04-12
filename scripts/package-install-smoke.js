#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const net = require("node:net");
const os = require("node:os");
const path = require("node:path");
const { spawn, spawnSync } = require("node:child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const TMP_PREFIX = "user-habit-pipeline-package-install-";
const NPM_EXEC_PATH = process.env.npm_execpath && fs.existsSync(process.env.npm_execpath)
  ? process.env.npm_execpath
  : null;

function createNpmExecEnv(baseEnv = process.env) {
  const env = { ...baseEnv };

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

function runNpm(args, options = {}) {
  if (NPM_EXEC_PATH) {
    return run(process.execPath, [NPM_EXEC_PATH, ...args], options);
  }

  return run("npm", args, options);
}

function resolveInstalledBin(consumerDir, binName) {
  const suffix = process.platform === "win32" ? ".cmd" : "";
  return path.join(consumerDir, "node_modules", ".bin", `${binName}${suffix}`);
}

function resolveInstalledPackagePath(consumerDir, ...segments) {
  return path.join(consumerDir, "node_modules", "user-habit-pipeline", ...segments);
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

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(port);
      });
    });
  });
}

function requestJson(method, url, payload) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
    const body = payload === undefined ? null : JSON.stringify(payload);
    const request = http.request({
      method,
      hostname: target.hostname,
      port: target.port,
      path: `${target.pathname}${target.search}`,
      headers: body
        ? {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body)
        }
        : undefined
    }, (response) => {
      let responseText = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        responseText += chunk;
      });
      response.on("end", () => {
        const normalized = responseText.trim();
        const parsed = normalized ? readJson(normalized, `${method} ${url}`) : {};

        if ((response.statusCode || 500) < 200 || (response.statusCode || 500) >= 300) {
          reject(new Error(`${method} ${url} failed with ${response.statusCode}.\n\n${normalized}`));
          return;
        }

        resolve(parsed);
      });
    });

    request.once("error", reject);

    if (body) {
      request.write(body);
    }

    request.end();
  });
}

async function waitForHealth(url, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;

  while (Date.now() < deadline) {
    try {
      return await requestJson("GET", url);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw lastError || new Error(`Timed out waiting for ${url}`);
}

function spawnBackground(command, args, options = {}) {
  const executable = process.platform === "win32" && !path.extname(command)
    ? `${command}.cmd`
    : command;

  const child = spawn(executable, args, {
    cwd: options.cwd || ROOT_DIR,
    env: options.env || process.env,
    stdio: ["ignore", "pipe", "pipe"]
  });

  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  return {
    child,
    getStdout: () => stdout,
    getStderr: () => stderr
  };
}

async function stopBackground(processHandle) {
  if (!processHandle || processHandle.child.exitCode !== null) {
    return;
  }

  const child = processHandle.child;
  child.kill();

  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5000))
  ]);

  if (child.exitCode === null) {
    child.kill("SIGKILL");
  }
}

async function removeWithRetry(targetPath, attempts = 20, delayMs = 250) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      fs.rmSync(targetPath, { recursive: true, force: true });
      return;
    } catch (error) {
      if (
        index === attempts - 1
        || !error
        || !["EBUSY", "EPERM", "ENOTEMPTY"].includes(error.code)
      ) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function main() {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), TMP_PREFIX));
  const packDir = path.join(tempRoot, "pack");
  const consumerDir = path.join(tempRoot, "consumer");
  const runtimeHome = path.join(tempRoot, "runtime-home");
  const npmEnv = createNpmExecEnv();
  let httpProcessHandle = null;

  fs.mkdirSync(packDir, { recursive: true });
  fs.mkdirSync(consumerDir, { recursive: true });
  fs.mkdirSync(runtimeHome, { recursive: true });

  try {
    const tarballName = runNpm(["pack", "--pack-destination", packDir], { cwd: ROOT_DIR, env: npmEnv })
      .split(/\r?\n/u)
      .filter(Boolean)
      .at(-1);

    assert.ok(tarballName, "npm pack did not return a tarball name.");

    const tarballPath = path.join(packDir, tarballName);
    runNpm(["init", "-y"], { cwd: consumerDir, env: npmEnv });
    runNpm(["install", tarballPath], { cwd: consumerDir, env: npmEnv });

    const env = {
      ...process.env,
      USER_HABIT_PIPELINE_HOME: runtimeHome
    };

    const manageBin = resolveInstalledBin(consumerDir, "manage-user-habits");
    const interpretBin = resolveInstalledBin(consumerDir, "user-habit-pipeline");
    const initRegistryBin = resolveInstalledBin(consumerDir, "user-habit-pipeline-init-registry");
    const codexBin = resolveInstalledBin(consumerDir, "codex-session-habits");
    const httpBin = resolveInstalledBin(consumerDir, "user-habit-pipeline-http");
    const httpCliPath = resolveInstalledPackagePath(consumerDir, "src", "http-server-cli.js");

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

    const httpHelpOutput = run(httpBin, ["--help"], { cwd: consumerDir, env });
    assert.match(httpHelpOutput, /Usage: user-habit-pipeline-http/u);

    const httpRegistryPath = path.join(runtimeHome, "http-user-habits.json");
    const httpPort = await getAvailablePort();
    const httpBaseUrl = `http://127.0.0.1:${httpPort}`;

    httpProcessHandle = spawnBackground(process.execPath, [
      httpCliPath,
      "--host",
      "127.0.0.1",
      "--port",
      String(httpPort),
      "--user-registry",
      httpRegistryPath
    ], {
      cwd: consumerDir,
      env
    });

    const healthOutput = await waitForHealth(`${httpBaseUrl}/health`);
    assert.equal(healthOutput.ok, true);
    assert.equal(healthOutput.service, "user-habit-pipeline-http");
    assert.equal(healthOutput.port, httpPort);
    assert.equal(path.normalize(healthOutput.user_registry_path), path.normalize(httpRegistryPath));

    const httpManageOutput = await requestJson("POST", `${httpBaseUrl}/manage`, {
      request: "添加用户习惯短句: phrase=收尾一下; intent=close_session; 场景=session_close; 置信度=0.86"
    });
    assert.equal(httpManageOutput.ok, true);
    assert.equal(httpManageOutput.result.action, "add");
    assert.equal(httpManageOutput.result.added_rule.phrase, "收尾一下");
    assert.equal(path.normalize(httpManageOutput.result.registry_path), path.normalize(httpRegistryPath));

    const httpInterpretOutput = await requestJson("POST", `${httpBaseUrl}/interpret`, {
      message: "收尾一下",
      scenario: "session_close"
    });
    assert.equal(httpInterpretOutput.ok, true);
    assert.equal(httpInterpretOutput.result.normalized_intent, "close_session");

    const httpSuggestOutput = await requestJson("POST", `${httpBaseUrl}/suggest`, {
      transcript: [
        "user: 我这里的“收工啦”不是结束线程，是 close_session 场景=session_close",
        "assistant: 收到，我后面按 close_session 理解。",
        "user: 收工啦"
      ].join("\n"),
      max_candidates: 3
    });
    assert.equal(httpSuggestOutput.ok, true);
    assert.equal(httpSuggestOutput.action, "suggest");
    assert.equal(httpSuggestOutput.candidate_count, 1);
    assert.equal(httpSuggestOutput.candidates[0].phrase, "收工啦");
    assert.equal(path.normalize(httpSuggestOutput.registry_path), path.normalize(httpRegistryPath));

    const generatedRegistryDir = path.join(tempRoot, "generated-project-registry");
    const initRegistryOutput = readJson(
      run(initRegistryBin, ["--out", generatedRegistryDir], { cwd: consumerDir, env }),
      "user-habit-pipeline-init-registry"
    );
    assert.equal(initRegistryOutput.ok, true);
    assert.equal(path.normalize(initRegistryOutput.out_dir), path.normalize(generatedRegistryDir));
    assert.ok(fs.existsSync(path.join(generatedRegistryDir, "custom-habits.json")));
    assert.ok(fs.existsSync(path.join(generatedRegistryDir, "README.md")));
    assert.ok(fs.existsSync(path.join(generatedRegistryDir, "smoke-test.js")));

    const installedProjectRegistryPath = resolveInstalledPackagePath(
      consumerDir,
      "examples",
      "project-registry",
      "custom-habits.json"
    );

    const installedProjectRegistryValidation = readJson(
      run(resolveInstalledBin(consumerDir, "validate-habit-registry"), [installedProjectRegistryPath], { cwd: consumerDir, env }),
      "validate-registry installed project registry example"
    );
    assert.equal(installedProjectRegistryValidation.ok, true);
    assert.equal(installedProjectRegistryValidation.rules, 2);

    const installedProjectRegistryInterpretation = readJson(
      run(interpretBin, [
        "--message",
        "收口一下",
        "--scenario",
        "session_close",
        "--registry",
        installedProjectRegistryPath
      ], { cwd: consumerDir, env }),
      "user-habit-pipeline installed project registry example"
    );
    assert.equal(installedProjectRegistryInterpretation.normalized_intent, "close_session");
    assert.equal(installedProjectRegistryInterpretation.should_ask_clarifying_question, false);

    const generatedProjectRegistryInterpretation = readJson(
      run(interpretBin, [
        "--message",
        "收口一下",
        "--scenario",
        "session_close",
        "--registry",
        path.join(generatedRegistryDir, "custom-habits.json")
      ], { cwd: consumerDir, env }),
      "user-habit-pipeline generated project registry example"
    );
    assert.equal(generatedProjectRegistryInterpretation.normalized_intent, "close_session");
    assert.equal(generatedProjectRegistryInterpretation.should_ask_clarifying_question, false);

    process.stdout.write(
      `${JSON.stringify({
        ok: true,
        tarball: tarballName,
        temp_root: tempRoot,
        runtime_home: runtimeHome
      }, null, 2)}\n`
    );
  } finally {
    await stopBackground(httpProcessHandle);

    if (process.env.USER_HABIT_PIPELINE_KEEP_SMOKE_TMP !== "1") {
      await removeWithRetry(tempRoot);
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message || String(error)}\n`);
    process.exit(1);
  });
}
