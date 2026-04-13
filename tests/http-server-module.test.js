const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const {
  DEFAULT_HTTP_HOST,
  DEFAULT_HTTP_MAX_BODY_BYTES,
  DEFAULT_HTTP_PORT,
  createHttpServer,
  startHttpServer
} = require("../src");

function requestJson(method, baseUrl, pathname, payload) {
  return new Promise((resolve, reject) => {
    const target = new URL(pathname, baseUrl);
    const body = payload === undefined ? null : JSON.stringify(payload);
    const request = http.request({
      method,
      hostname: target.hostname,
      port: target.port,
      path: target.pathname,
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
        resolve({
          statusCode: response.statusCode,
          body: responseText.trim() ? JSON.parse(responseText) : {}
        });
      });
    });

    request.once("error", reject);

    if (body) {
      request.write(body);
    }

    request.end();
  });
}

test("library exports the embedded http server surface", () => {
  assert.equal(typeof createHttpServer, "function");
  assert.equal(typeof startHttpServer, "function");
  assert.equal(DEFAULT_HTTP_HOST, "127.0.0.1");
  assert.equal(DEFAULT_HTTP_PORT, 4848);
  assert.ok(DEFAULT_HTTP_MAX_BODY_BYTES >= 1024);
});

test("embedded http server can be started from the library entrypoint", async () => {
  const registryPath = path.join(os.tmpdir(), `uhp-http-module-${process.pid}.json`);
  const started = await startHttpServer({
    host: "127.0.0.1",
    port: 0,
    registryPath,
    maxBodyBytes: 2048
  });

  try {
    assert.equal(typeof started.url, "string");
    assert.match(started.url, /^http:\/\/127\.0\.0\.1:\d+$/u);
    assert.equal(started.registryPath, registryPath);
    assert.equal(started.maxBodyBytes, 2048);

    const health = await requestJson("GET", started.url, "/health");
    assert.equal(health.statusCode, 200);
    assert.equal(path.normalize(health.body.user_registry_path), path.normalize(registryPath));

    const interpret = await requestJson("POST", started.url, "/interpret", {
      message: "继续",
      scenario: "general",
      external_memory_signal: {
        normalized_intent: "resume_last_task",
        source_label: "host_local_memory",
        confidence: 0.84
      }
    });
    assert.equal(interpret.statusCode, 200);
    assert.equal(interpret.body.result.normalized_intent, "continue_current_track");
    assert.equal(interpret.body.pre_action_decision.next_action, "ask_clarifying_question");
    assert.equal(interpret.body.pre_action_decision.decision_basis, "clarification_required");
    assert.equal(interpret.body.memory_conflict_decision.memory_conflict_detected, true);
    assert.equal(interpret.body.memory_conflict_decision.final_next_action, "ask_clarifying_question");
  } finally {
    await new Promise((resolve, reject) => (
      started.server.close((error) => (error ? reject(error) : resolve()))
    ));
  }
});
