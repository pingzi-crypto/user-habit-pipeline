# Manual End-to-End Acceptance

This checklist is for manually validating the current end-to-end user flow of `user-habit-pipeline`.

It is intentionally focused on the paths that matter most in real usage:

- scan the current session
- add a suggested habit
- ignore a noisy suggestion
- list current state
- verify the added phrase can be interpreted
- confirm the low-ROI stop rule wording exists in the project guidance

Use a temporary registry path so these checks do not disturb your normal local state.

---

## Scope

This checklist validates:

- `manage-habits-cli.js`
- `codex-session-habits-cli.js`
- suggestion cache reuse
- user overlay add/remove/ignore flows
- Codex-facing chat-ready output fields

It does not validate:

- internal Codex host thread capture
- marketplace distribution
- external downstream workflow execution

---

## Prerequisites

Run from:

- repository root `E:\user-habit-pipeline`

Required:

- Node.js on `PATH`
- npm available
- PowerShell

Recommended:

- a clean working tree

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

## 8. Remove One Phrase And Re-List

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

## 9. Confirm Low-ROI Stop Guidance Exists

This is a documentation acceptance check.

Inspect:

- [project-principles.md](/E:/user-habit-pipeline/docs/project-principles.md)
- [SKILL.md](/E:/manage-current-session-habits/SKILL.md)
- [interaction-patterns.md](/E:/manage-current-session-habits/references/interaction-patterns.md)

Expected:

- the project guidance says low-ROI next steps should be challenged early
- the skill guidance includes a one-word stop path such as `停` or `跳过`
- the interaction patterns include a short wording template for that situation

---

## 10. Optional Skill-Level Smoke Check

If the local skill repo is installed and configured, you can also run:

```powershell
& E:\manage-current-session-habits\scripts\check-install.ps1 -SmokeTest
```

Expected:

- smoke test succeeds
- wrapper can reach the backend

---

## Pass Criteria

Treat the manual acceptance as passing when:

- all required commands complete successfully
- explicit-definition scan works
- cached apply works
- repeated review-only scan works
- ignore works
- list output reflects additions / removals / ignored suggestions clearly
- interpretation reflects the applied rule
- low-ROI stop guidance is present in both project and skill guidance

If any step fails, record:

- the exact command used
- the actual JSON fragment or error
- whether the failure is backend logic, bridge presentation, or skill/install related
