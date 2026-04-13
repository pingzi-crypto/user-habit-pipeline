const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const rootDir = path.join(__dirname, "..");
const scanDemoPath = path.join(rootDir, "examples", "current-session-host-node", "scan-current-session-demo.js");
const applyDemoPath = path.join(rootDir, "examples", "current-session-host-node", "apply-first-candidate-demo.js");
const compareDemoPath = path.join(rootDir, "examples", "current-session-host-node", "scan-apply-interpret-demo.js");
const happyPathDemoPath = path.join(rootDir, "examples", "current-session-host-node", "happy-path-demo.js");

function createRuntimeHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "uhp-current-session-host-demo-"));
}

function runNodeScript(scriptPath, env) {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: rootDir,
    env,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    throw new Error([
      `Script failed: ${scriptPath}`,
      result.stdout ? `stdout:\n${result.stdout}` : null,
      result.stderr ? `stderr:\n${result.stderr}` : null
    ].filter(Boolean).join("\n\n"));
  }

  return JSON.parse(result.stdout);
}

test("current-session host node demos run successfully in sequence", () => {
  const runtimeHome = createRuntimeHome();
  const env = {
    ...process.env,
    USER_HABIT_PIPELINE_HOME: runtimeHome
  };

  const scanOutput = runNodeScript(scanDemoPath, env);
  assert.equal(scanOutput.integration_path, "current-session-scan");
  assert.equal(scanOutput.action, "suggest");
  assert.equal(scanOutput.candidate_count, 1);
  assert.equal(scanOutput.top_phrase, "收个尾");
  assert.equal(scanOutput.roi_event.event_type, "candidate_scan_completed");
  assert.equal(scanOutput.roi_event.scan_runs_with_candidates, 1);

  const applyOutput = runNodeScript(applyDemoPath, env);
  assert.equal(applyOutput.integration_path, "current-session-apply");
  assert.equal(applyOutput.action, "apply-candidate");
  assert.equal(applyOutput.phrase, "收个尾");
  assert.equal(applyOutput.normalized_intent, "close_session");
  assert.equal(applyOutput.next_step_level, "low_roi");
  assert.equal(applyOutput.roi_event.event_type, "candidate_accepted");
  assert.equal(applyOutput.roi_event.accepted_candidate_count, 1);
});

test("current-session scan/apply/interpret comparison demo shows before-after improvement", () => {
  const runtimeHome = createRuntimeHome();
  const env = {
    ...process.env,
    USER_HABIT_PIPELINE_HOME: runtimeHome
  };

  const output = runNodeScript(compareDemoPath, env);
  assert.equal(output.integration_path, "current-session-scan-apply-interpret");
  assert.equal(output.before.next_action, "ask_clarifying_question");
  assert.equal(output.before.decision_basis, "no_match");
  assert.equal(output.scan.candidate_count, 1);
  assert.equal(output.apply.action, "apply-candidate");
  assert.equal(output.after.next_action, "proceed");
  assert.equal(output.after.normalized_intent, "close_session");
  assert.equal(output.roi_comparison.interpretation_improved, true);
  assert.equal(output.roi_comparison.resolved_by_explicit_habit_write_count, 1);
});

test("current-session happy-path demo provides a compact outward-facing story", () => {
  const runtimeHome = createRuntimeHome();
  const env = {
    ...process.env,
    USER_HABIT_PIPELINE_HOME: runtimeHome
  };

  const output = runNodeScript(happyPathDemoPath, env);
  assert.equal(output.integration_path, "current-session-happy-path");
  assert.equal(Array.isArray(output.story), true);
  assert.equal(output.story.length, 4);
  assert.equal(output.story[0].label, "before_apply");
  assert.equal(output.story[3].label, "after_apply");
  assert.equal(output.roi_summary.interpretation_improved, true);
  assert.equal(output.roi_summary.accepted_candidate_count, 1);
  assert.equal(output.roi_summary.clarification_before_count, 1);
  assert.equal(output.roi_summary.clarification_after_count, 0);
});
