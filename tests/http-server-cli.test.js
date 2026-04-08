const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const {
  createServer,
  getUsageText,
  parseArgs,
  validateArgs
} = require("../src/http-server-cli");

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

test("http server cli parses host port and registry flags", () => {
  const args = parseArgs([
    "--host",
    "0.0.0.0",
    "--port",
    "5123",
    "--user-registry",
    "C:\\temp\\user_habits.json",
    "--max-body-bytes",
    "4096"
  ]);

  assert.equal(args.host, "0.0.0.0");
  assert.equal(args.port, 5123);
  assert.equal(args.registryPath, "C:\\temp\\user_habits.json");
  assert.equal(args.maxBodyBytes, 4096);
});

test("http server cli validates args and prints usage text", () => {
  assert.match(getUsageText(), /user-habit-pipeline-http/);
  assert.doesNotThrow(() => validateArgs(parseArgs([])));
  assert.throws(() => validateArgs({ host: "", port: 4848, registryPath: "a.json", maxBodyBytes: 1024 }), /--host/u);
  assert.throws(() => validateArgs({ host: "127.0.0.1", port: 0, registryPath: "a.json", maxBodyBytes: 1024 }), /--port/u);
  assert.throws(() => validateArgs({ host: "127.0.0.1", port: 4848, registryPath: "", maxBodyBytes: 1024 }), /--user-registry/u);
});

test("http server exposes health and interpret endpoints", async () => {
  const registryPath = path.join(os.tmpdir(), `uhp-http-test-${process.pid}.json`);
  const server = createServer({
    host: "127.0.0.1",
    port: 0,
    registryPath,
    maxBodyBytes: 1024 * 1024
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    const address = server.address();
    assert.equal(typeof address, "object");
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const health = await requestJson("GET", baseUrl, "/health");
    assert.equal(health.statusCode, 200);
    assert.equal(health.body.service, "user-habit-pipeline-http");
    assert.equal(path.normalize(health.body.user_registry_path), path.normalize(registryPath));

    const interpret = await requestJson("POST", baseUrl, "/interpret", {
      message: "继续",
      scenario: "general"
    });
    assert.equal(interpret.statusCode, 200);
    assert.equal(interpret.body.ok, true);
    assert.equal(interpret.body.result.normalized_intent, "continue_current_track");
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
