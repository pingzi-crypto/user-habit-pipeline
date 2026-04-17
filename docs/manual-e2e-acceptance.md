# Manual End-to-End Acceptance

This checklist is for manually validating the current end-to-end user flow of `user-habit-pipeline`.

If you want to turn one run into a reusable evaluation note instead of a pass/fail checklist only, also use:

- [manual-evaluation-template.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/manual-evaluation-template.md)

It is intentionally focused on the paths that matter most in real usage:

- scan the current session
- add a suggested habit
- ignore a noisy suggestion
- stop the current low-ROI direction with one word
- list current state
- verify the added phrase can be interpreted
- confirm the low-ROI stop rule wording exists in the project guidance

Use a temporary registry path so these checks do not disturb your normal local state.

If you want the shortest path, run the bundled smoke script first:

```bash
npm run manual-e2e-smoke
```

Then use the checklist below only when you need to inspect one step manually.

The bundled smoke script is now a Node-based cross-platform path.
The manual command-by-command examples below still use PowerShell because they are easier to read for multiline stdin cases.

---

## Scope

This checklist validates:

- `manage-habits-cli.js`
- `codex-session-habits-cli.js`
- suggestion cache reuse
- user overlay add/remove/ignore flows
- Codex-facing chat-ready output fields
- minimal ROI evidence capture for the current-session and pre-action flows

It does not validate:

- internal Codex host thread capture
- marketplace distribution
- external downstream workflow execution

---

## Prerequisites

Run from:

- repository root of this checkout

Required:

- Node.js on `PATH`
- npm available

Recommended:

- a clean working tree
- PowerShell when following the manual step-by-step examples below exactly

---

## Temporary Test State

Create an isolated registry path:

```powershell
$testRoot = Join-Path $env:TEMP "uhp-e2e-manual"
New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
$userRegistry = Join-Path $testRoot "manual_e2e_user_habits.json"
Remove-Item -LiteralPath $userRegistry -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath (Join-Path $testRoot ".last_session_habit_suggestions.json") -Force -ErrorAction SilentlyContinue
```

All commands below assume:

```powershell
$userRegistry
```

---

## 1. Baseline List Should Be Empty

Run:

```powershell
npm run codex-session-habits -- --request "列出用户习惯短句" --user-registry $userRegistry
```

Expected:

- command exits successfully
- JSON includes `action = "list"`
- `assistant_reply_markdown` says there is no current user habit or ignore record
- `suggested_follow_ups` includes `扫描这次会话里的习惯候选`

---

## 2. Scan An Explicit Definition

Run:

```powershell
@'
user: 以后我说“收尾一下”就是 close_session
assistant: 收到。
user: 收尾一下
'@ | npm run codex-session-habits -- --request "扫描这次会话里的习惯候选" --thread-stdin --user-registry $userRegistry
```

Expected:

- command exits successfully
- JSON includes `action = "suggest"`
- `candidate_count = 1`
- candidate `phrase = "收尾一下"`
- candidate `suggested_rule.normalized_intent = "close_session"`
- candidate includes `confidence_details`
- response includes `assistant_reply_markdown`
- response includes `suggested_follow_ups`
- follow-ups include `添加第1条`

---

## 2A. Scan A Correction-Style Explicit Definition

Run:

```powershell
@'
user: 我这里的“收工啦”不是结束线程，是 close_session 场景=session_close
assistant: 收到，我后面按 close_session 理解。
user: 收工啦
'@ | npm run codex-session-habits -- --request "扫描这次会话里的习惯候选" --thread-stdin --user-registry $userRegistry
```

Expected:

- command exits successfully
- JSON includes `action = "suggest"`
- first candidate `phrase = "收工啦"`
- first candidate `suggested_rule.normalized_intent = "close_session"`
- first candidate `evidence.correction_count = 1`
- `assistant_reply_markdown` explicitly mentions correction-style evidence, not only the score

---

## 3. Apply The Cached Candidate

Run:

```powershell
npm run codex-session-habits -- --request "把第1条加到 session_close 场景" --user-registry $userRegistry
```

Expected:

- command exits successfully
- JSON includes `action = "apply-candidate"`
- `applied_rule.phrase = "收尾一下"`
- `applied_rule.normalized_intent = "close_session"`
- `applied_rule.scenario_bias` includes `session_close`
- `assistant_reply_markdown` confirms the phrase, intent, scenario, and confidence

---

## 4. Verify Interpretation Uses The Added Phrase

Run:

```powershell
npm run interpret -- --message "收尾一下" --scenario session_close --user-registry $userRegistry
```

Expected:

- command exits successfully
- `normalized_intent = "close_session"`
- `should_ask_clarifying_question = false`
- `confidence` is greater than `0`

---

## 5. Scan A Repeated Review-Only Phrase

Run:

```powershell
@'
user: 收工啦
assistant: 你是想结束当前线程吗？
user: 收工啦
'@ | npm run codex-session-habits -- --request "扫描这次会话里的习惯候选" --thread-stdin --user-registry $userRegistry
```

Expected:

- command exits successfully
- first candidate has `action = "review_only"`
- first candidate has `suggested_rule = null`
- `risk_flags` include:
  - `single_thread_only`
  - `missing_intent`
- `assistant_reply_markdown` mentions this is a review candidate
- follow-ups include:
  - `忽略第1条`
  - `把第1条加到 session_close 场景; intent=close_session`

---

## 6. Ignore The Noisy Candidate

Run:

```powershell
npm run codex-session-habits -- --request "忽略第1条" --user-registry $userRegistry
```

Expected:

- command exits successfully
- JSON includes `action = "ignore-candidate"`
- `ignored_phrase = "收工啦"`
- `assistant_reply_markdown` says the phrase will not be suggested again

---

## 7. List Should Show Additions And Ignored Suggestions

Run:

```powershell
npm run codex-session-habits -- --request "列出用户习惯短句" --user-registry $userRegistry
```

Expected:

- command exits successfully
- `assistant_reply_markdown` includes:
  - summary counts
  - `新增短句`
  - `已忽略建议`
- text includes:
  - `收尾一下`
  - `收工啦`
- if no removals were recorded yet, `已移除短句` may be absent

---

## 8. Verify The One-Word Stop Path

Run:

```powershell
npm run codex-session-habits -- --request "停" --user-registry $userRegistry
```

Expected:

- command exits successfully
- JSON includes `action = "stop"`
- `stop_request = "停"`
- `assistant_reply_markdown` confirms the current direction has stopped
- `next_step_assessment.level = "stopped"`

---

## 9. Remove One Phrase And Re-List

Run:

```powershell
npm run codex-session-habits -- --request "删除用户习惯短句: 收尾一下" --user-registry $userRegistry
npm run codex-session-habits -- --request "列出用户习惯短句" --user-registry $userRegistry
```

Expected:

- remove command exits successfully
- remove result has `action = "remove"`
- re-list output includes:
  - `已移除短句`
  - `收尾一下`

---

## 10. Confirm Low-ROI Stop Guidance Exists

This is a documentation acceptance check.

Inspect:

- [project-principles.md](https://github.com/pingzi-crypto/user-habit-pipeline/blob/main/docs/project-principles.md)
- [SKILL.md](https://github.com/pingzi-crypto/manage-current-session-habits/blob/main/SKILL.md)
- [README.md](https://github.com/pingzi-crypto/manage-current-session-habits/blob/main/README.md)

Expected:

- the project guidance says low-ROI next steps should be challenged early
- the skill guidance includes a one-word stop path such as `停` or `跳过`
- the public skill docs keep the stop behavior consistent with the backend-facing guidance

---

## 11. Optional Skill-Level Smoke Check

If the local skill repo is installed and configured, you can also run:

```powershell
& <path-to-manage-current-session-habits>\scripts\check-install.ps1 -SmokeTest
```

or on a shell-first path:

```bash
node <path-to-manage-current-session-habits>/scripts/check-install.js --smoke-test
```

Expected:

- smoke test succeeds
- wrapper can reach the backend

---

## 12. ROI Evidence Capture

For at least one realistic evaluation pass, record these yes/no signals:

- `ambiguous_action_prevented`
  - Did the host or demo stop an ambiguous shorthand from routing directly into a downstream action?
- `clarification_triggered`
  - Did a phrase such as `继续` or `收口` correctly result in clarification instead of confident action?
- `candidate_surfaced`
  - Did current-session scan return at least one credible candidate worth review?
- `candidate_accepted`
  - Did one candidate become an active habit through explicit confirmation?
- `candidate_ignored`
  - Did one noisy candidate get suppressed explicitly?
- `candidate_removed_after_accept`
  - If you tested a correction path, could an accepted habit be removed cheaply afterward?

Recommended lightweight capture format:

```json
{
  "ambiguous_action_prevented": true,
  "clarification_triggered": true,
  "candidate_surfaced": true,
  "candidate_accepted": true,
  "candidate_ignored": true,
  "candidate_removed_after_accept": false
}
```

This should stay local to the test run.
Do not turn it into hidden background telemetry.

---

## Pass Criteria

Treat the manual acceptance as passing when:

- all required commands complete successfully
- explicit-definition scan works
- cached apply works
- repeated review-only scan works
- ignore works
- one-word stop works
- list output reflects additions / removals / ignored suggestions clearly
- interpretation reflects the applied rule
- low-ROI stop guidance is present in both project and skill guidance
- the run captures enough evidence to answer whether ambiguity was reduced and review flow value was real

If any step fails, record:

- the exact command used
- the actual JSON fragment or error
- whether the failure is backend logic, bridge presentation, or skill/install related
