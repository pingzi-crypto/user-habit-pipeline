const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.join(__dirname, "..");
const directDemoPath = path.join(rootDir, "examples", "external-consumer-node", "direct-library-demo.js");
const cliDemoPath = path.join(rootDir, "examples", "external-consumer-node", "cli-subprocess-demo.js");
const httpDemoPath = path.join(rootDir, "examples", "external-consumer-node", "embedded-http-demo.js");
const preActionGateDemoPath = path.join(rootDir, "examples", "external-consumer-node", "pre-action-gate-demo.js");
const hostRouterDemoPath = path.join(rootDir, "examples", "external-consumer-node", "host-router-demo.js");
const memoryConflictDemoPath = path.join(rootDir, "examples", "external-consumer-node", "memory-conflict-demo.js");
const controlHubHostContractDemoPath = path.join(rootDir, "examples", "control-hub", "host-contract-demo.js");

function runNodeScript(scriptPath) {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error([
      `Script failed: ${scriptPath}`,
      result.stdout ? `stdout:\n${result.stdout}` : null,
      result.stderr ? `stderr:\n${result.stderr}` : null
    ].filter(Boolean).join("\n\n"));
  }

  return JSON.parse(result.stdout);
}

test("external consumer direct-library demo runs successfully", () => {
  const output = runNodeScript(directDemoPath);
  assert.equal(output.integration_path, "direct-library");
  assert.equal(output.normalized_intent, "continue_current_track");
  assert.equal(typeof output.confidence, "number");
});

test("external consumer cli-subprocess demo runs successfully", () => {
  const output = runNodeScript(cliDemoPath);
  assert.equal(output.integration_path, "cli-subprocess");
  assert.equal(output.normalized_intent, "continue_current_track");
  assert.equal(typeof output.confidence, "number");
});

test("external consumer embedded-http demo runs successfully", () => {
  const output = runNodeScript(httpDemoPath);
  assert.equal(output.integration_path, "embedded-http");
  assert.match(output.url, /^http:\/\/127\.0\.0\.1:\d+$/u);
  assert.equal(output.normalized_intent, "continue_current_track");
  assert.equal(typeof output.confidence, "number");
  assert.equal(output.pre_action_next_action, "ask_clarifying_question");
});

test("external consumer pre-action-gate demo runs successfully", () => {
  const output = runNodeScript(preActionGateDemoPath);
  assert.equal(output.integration_path, "pre-action-gate");
  assert.equal(Array.isArray(output.cases), true);
  assert.equal(output.cases.length, 2);
  assert.equal(output.cases[0].next_action, "ask_clarifying_question");
  assert.equal(output.cases[0].decision_basis, "clarification_required");
  assert.equal(output.cases[1].next_action, "proceed");
  assert.equal(output.cases[1].normalized_intent, "refresh_latest_board_state");
});

test("external consumer host-router demo runs successfully", () => {
  const output = runNodeScript(hostRouterDemoPath);
  assert.equal(output.integration_path, "host-router");
  assert.equal(Array.isArray(output.cases), true);
  assert.equal(output.cases.length, 3);
  assert.equal(output.cases[0].host_route.host_action, "ask_clarifying_question");
  assert.equal(output.cases[1].host_route.host_action, "route_to_downstream_handler");
  assert.equal(output.cases[1].host_route.target, "status-board.refresh");
  assert.equal(output.cases[2].host_route.target, "session.close");
  assert.equal(output.roi_metrics.ambiguous_action_prevented_count, 1);
  assert.equal(output.roi_metrics.clear_action_proceed_count, 2);
});

test("external consumer memory-conflict demo runs successfully", () => {
  const output = runNodeScript(memoryConflictDemoPath);
  assert.equal(output.integration_path, "memory-conflict-boundary");
  assert.equal(Array.isArray(output.cases), true);
  assert.equal(output.cases.length, 2);
  assert.equal(output.cases[0].memory_conflict_detected, false);
  assert.equal(output.cases[0].final_next_action, "proceed");
  assert.equal(output.cases[1].memory_conflict_detected, true);
  assert.equal(output.cases[1].final_next_action, "ask_clarifying_question");
  assert.equal(output.cases[1].recommended_resolution, "ask_clarifying_question");
});

test("control-hub host-contract demo runs successfully", () => {
  const output = runNodeScript(controlHubHostContractDemoPath);
  assert.equal(output.integration_path, "control-hub-host-contract");
  assert.equal(output.contract_boundary.adapter_is_optional, true);
  assert.equal(output.contract_boundary.host_owns_execution, true);
  assert.equal(Array.isArray(output.cases), true);
  assert.equal(output.cases.length, 3);
  assert.equal(output.cases[0].host_decision.host_action, "apply_interpretation");
  assert.equal(output.cases[1].host_decision.host_action, "ask_clarifying_question");
  assert.equal(output.cases[2].host_decision.host_action, "ignore_adapter");
  assert.equal(output.summary.apply_count, 1);
  assert.equal(output.summary.clarify_count, 1);
  assert.equal(output.summary.ignore_count, 1);
});
