const http = require("node:http");
const { startHttpServer } = require("user-habit-pipeline");

function requestJson(method, url, payload) {
  return new Promise((resolve, reject) => {
    const target = new URL(url);
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
        resolve(JSON.parse(responseText));
      });
    });

    request.once("error", reject);

    if (body) {
      request.write(body);
    }

    request.end();
  });
}

async function main() {
  const { url, server } = await startHttpServer({
    host: "127.0.0.1",
    port: 0
  });

  try {
    const interpret = await requestJson("POST", `${url}/interpret`, {
      message: "继续",
      scenario: "general"
    });

    process.stdout.write(`${JSON.stringify({
      integration_path: "embedded-http",
      url,
      normalized_intent: interpret.result.normalized_intent,
      confidence: interpret.result.confidence,
      should_ask_clarifying_question: interpret.result.should_ask_clarifying_question,
      pre_action_next_action: interpret.pre_action_decision.next_action
    }, null, 2)}\n`);
  } finally {
    await new Promise((resolve, reject) => (
      server.close((error) => (error ? reject(error) : resolve()))
    ));
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message || String(error)}\n`);
  process.exit(1);
});
