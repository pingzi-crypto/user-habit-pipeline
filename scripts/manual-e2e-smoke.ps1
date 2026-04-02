param(
  [string]$UserRegistryPath,
  [string]$TempRoot,
  [switch]$IncludeSkillSmoke,
  [string]$SkillRepoPath = "E:\manage-current-session-habits"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Add-Result {
  param(
    [System.Collections.Generic.List[object]]$Results,
    [string]$Name,
    [string]$Status,
    [string]$Detail
  )

  $Results.Add([pscustomobject]@{
    name = $Name
    status = $Status
    detail = $Detail
  }) | Out-Null
}

function Assert-True {
  param(
    [bool]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    throw $Message
  }
}

function Invoke-JsonCommand {
  param(
    [string]$Executable,
    [string[]]$Arguments,
    [string]$InputText
  )

  $result = if ($PSBoundParameters.ContainsKey("InputText")) {
    $InputText | & $Executable @Arguments 2>&1
  } else {
    & $Executable @Arguments 2>&1
  }

  if ($LASTEXITCODE -ne 0) {
    throw ($result -join [Environment]::NewLine)
  }

  $rawText = ($result -join [Environment]::NewLine).Trim()
  if ([string]::IsNullOrWhiteSpace($rawText)) {
    throw "Command returned empty output."
  }

  return $rawText | ConvertFrom-Json
}

function Test-Step {
  param(
    [System.Collections.Generic.List[object]]$Results,
    [string]$Name,
    [scriptblock]$Action
  )

  try {
    $detail = & $Action
    Add-Result -Results $Results -Name $Name -Status "pass" -Detail ([string]$detail)
  } catch {
    Add-Result -Results $Results -Name $Name -Status "fail" -Detail $_.Exception.Message
    throw
  }
}

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$nodeCommand = (Get-Command node -ErrorAction Stop).Source
$codexCliPath = Join-Path $repoRoot "src\codex-session-habits-cli.js"
$interpretCliPath = Join-Path $repoRoot "src\cli.js"
$projectPrinciplesPath = Join-Path $repoRoot "docs\project-principles.md"

if (-not $TempRoot) {
  $TempRoot = Join-Path $env:TEMP "uhp-e2e-smoke"
}

New-Item -ItemType Directory -Path $TempRoot -Force | Out-Null

if (-not $UserRegistryPath) {
  $UserRegistryPath = Join-Path $TempRoot "manual_e2e_user_habits.json"
}

$suggestionCachePath = Join-Path (Split-Path -Path $UserRegistryPath -Parent) ".last_session_habit_suggestions.json"
Remove-Item -LiteralPath $UserRegistryPath -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $suggestionCachePath -Force -ErrorAction SilentlyContinue

$results = New-Object 'System.Collections.Generic.List[object]'

$sharedArgs = @(
  $codexCliPath,
  "--user-registry",
  $UserRegistryPath
)

try {
  Test-Step -Results $results -Name "baseline_list_empty" -Action {
    $parsed = Invoke-JsonCommand -Executable $nodeCommand -Arguments ($sharedArgs + @("--request", "列出用户习惯短句"))
    Assert-True ($parsed.action -eq "list") "Expected list action."
    Assert-True ($parsed.assistant_reply_markdown -match "当前还没有任何用户习惯短句或忽略记录") "Expected empty-state list summary."
    Assert-True ($parsed.suggested_follow_ups -contains "扫描这次会话里的习惯候选") "Expected scan follow-up."
    "empty-state list reply verified"
  }

  Test-Step -Results $results -Name "scan_explicit_definition" -Action {
    $transcript = @"
user: 以后我说“收尾一下”就是 close_session
assistant: 收到。
user: 收尾一下
"@
    $parsed = Invoke-JsonCommand -Executable $nodeCommand -Arguments ($sharedArgs + @("--request", "扫描这次会话里的习惯候选", "--thread-stdin")) -InputText $transcript
    Assert-True ($parsed.action -eq "suggest") "Expected suggest action."
    Assert-True ($parsed.candidate_count -eq 1) "Expected exactly one candidate."
    Assert-True ($parsed.candidates[0].phrase -eq "收尾一下") "Expected candidate phrase 收尾一下."
    Assert-True ($parsed.candidates[0].suggested_rule.normalized_intent -eq "close_session") "Expected close_session intent."
    Assert-True ($null -ne $parsed.candidates[0].confidence_details) "Expected confidence_details."
    Assert-True ($parsed.suggested_follow_ups -contains "添加第1条") "Expected apply follow-up."
    "definition scan verified"
  }

  Test-Step -Results $results -Name "apply_cached_candidate" -Action {
    $parsed = Invoke-JsonCommand -Executable $nodeCommand -Arguments ($sharedArgs + @("--request", "把第1条加到 session_close 场景"))
    Assert-True ($parsed.action -eq "apply-candidate") "Expected apply-candidate action."
    Assert-True ($parsed.applied_rule.phrase -eq "收尾一下") "Expected applied phrase 收尾一下."
    Assert-True ($parsed.applied_rule.normalized_intent -eq "close_session") "Expected close_session applied intent."
    Assert-True ($parsed.applied_rule.scenario_bias -contains "session_close") "Expected session_close scenario."
    Assert-True ($parsed.assistant_reply_markdown -match "已添加用户习惯短句") "Expected apply confirmation markdown."
    "cached apply verified"
  }

  Test-Step -Results $results -Name "interpret_added_phrase" -Action {
    $parsed = Invoke-JsonCommand -Executable $nodeCommand -Arguments @(
      $interpretCliPath,
      "--message",
      "收尾一下",
      "--scenario",
      "session_close",
      "--user-registry",
      $UserRegistryPath
    )
    Assert-True ($parsed.normalized_intent -eq "close_session") "Expected interpret result close_session."
    Assert-True (-not $parsed.should_ask_clarifying_question) "Expected no clarifying question."
    Assert-True ([double]$parsed.confidence -gt 0) "Expected positive confidence."
    "interpret flow verified"
  }

  Test-Step -Results $results -Name "scan_review_only_phrase" -Action {
    $transcript = @"
user: 收工啦
assistant: 你是想结束当前线程吗？
user: 收工啦
"@
    $parsed = Invoke-JsonCommand -Executable $nodeCommand -Arguments ($sharedArgs + @("--request", "扫描这次会话里的习惯候选", "--thread-stdin")) -InputText $transcript
    Assert-True ($parsed.candidates[0].action -eq "review_only") "Expected review_only candidate."
    Assert-True ($null -eq $parsed.candidates[0].suggested_rule) "Expected null suggested_rule."
    Assert-True ($parsed.candidates[0].risk_flags -contains "single_thread_only") "Expected single_thread_only risk."
    Assert-True ($parsed.candidates[0].risk_flags -contains "missing_intent") "Expected missing_intent risk."
    Assert-True ($parsed.suggested_follow_ups -contains "忽略第1条") "Expected ignore follow-up."
    "review-only scan verified"
  }

  Test-Step -Results $results -Name "ignore_noisy_candidate" -Action {
    $parsed = Invoke-JsonCommand -Executable $nodeCommand -Arguments ($sharedArgs + @("--request", "忽略第1条"))
    Assert-True ($parsed.action -eq "ignore-candidate") "Expected ignore-candidate action."
    Assert-True ($parsed.ignored_phrase -eq "收工啦") "Expected ignored phrase 收工啦."
    Assert-True ($parsed.assistant_reply_markdown -match "已忽略短句") "Expected ignore confirmation markdown."
    "ignore flow verified"
  }

  Test-Step -Results $results -Name "list_additions_and_ignored" -Action {
    $parsed = Invoke-JsonCommand -Executable $nodeCommand -Arguments ($sharedArgs + @("--request", "列出用户习惯短句"))
    Assert-True ($parsed.action -eq "list") "Expected list action."
    Assert-True ($parsed.assistant_reply_markdown -match "新增短句") "Expected additions section."
    Assert-True ($parsed.assistant_reply_markdown -match "已忽略建议") "Expected ignored suggestions section."
    Assert-True ($parsed.assistant_reply_markdown -match "收尾一下") "Expected 收尾一下 in list."
    Assert-True ($parsed.assistant_reply_markdown -match "收工啦") "Expected 收工啦 in list."
    "list additions/ignored verified"
  }

  Test-Step -Results $results -Name "remove_and_relist" -Action {
    $removeParsed = Invoke-JsonCommand -Executable $nodeCommand -Arguments ($sharedArgs + @("--request", "删除用户习惯短句: 收尾一下"))
    Assert-True ($removeParsed.action -eq "remove") "Expected remove action."
    $listParsed = Invoke-JsonCommand -Executable $nodeCommand -Arguments ($sharedArgs + @("--request", "列出用户习惯短句"))
    Assert-True ($listParsed.assistant_reply_markdown -match "已移除短句") "Expected removals section."
    Assert-True ($listParsed.assistant_reply_markdown -match "收尾一下") "Expected 收尾一下 in removals."
    "remove and re-list verified"
  }

  Test-Step -Results $results -Name "low_roi_guidance_present" -Action {
    $projectPrinciples = Get-Content -Raw -LiteralPath $projectPrinciplesPath
    Assert-True ($projectPrinciples -match "停|跳过") "Expected stop word guidance in project principles."
    Assert-True ($projectPrinciples -match "低 ROI|low ROI|不太划算") "Expected low-ROI wording in project principles."

    if (Test-Path -LiteralPath $SkillRepoPath) {
      $skillPath = Join-Path $SkillRepoPath "SKILL.md"
      $interactionPath = Join-Path $SkillRepoPath "references\interaction-patterns.md"
      $skillText = Get-Content -Raw -LiteralPath $skillPath
      $interactionText = Get-Content -Raw -LiteralPath $interactionPath
      Assert-True ($skillText -match "停|跳过") "Expected stop word guidance in skill instructions."
      Assert-True ($interactionText -match "不太划算|低 ROI") "Expected low-ROI template in interaction patterns."
    }

    "low-ROI guidance verified"
  }

  if ($IncludeSkillSmoke) {
    Test-Step -Results $results -Name "skill_smoke_test" -Action {
      $checkInstallPath = Join-Path $SkillRepoPath "scripts\check-install.ps1"
      if (-not (Test-Path -LiteralPath $checkInstallPath)) {
        throw "Skill smoke script was not found at $checkInstallPath"
      }

      $smokeOutput = & $checkInstallPath -SmokeTest 2>&1
      if ($LASTEXITCODE -ne 0) {
        throw ($smokeOutput -join [Environment]::NewLine)
      }

      $smokeText = ($smokeOutput -join [Environment]::NewLine)
      Assert-True ($smokeText -match "\[OK\] smoke_test") "Expected [OK] smoke_test output."
      "optional skill smoke verified"
    }
  }
} finally {
  $results | ForEach-Object {
    Write-Output ("[{0}] {1} - {2}" -f $_.status.ToUpperInvariant(), $_.name, $_.detail)
  }
}

if ($results.Exists({ param($item) $item.status -eq "fail" })) {
  exit 1
}

Write-Output ("[PASS] summary - {0} acceptance checks passed." -f $results.Count)
