param(
  [string]$UserRegistryPath,
  [string]$TempRoot,
  [switch]$IncludeSkillSmoke,
  [string]$SkillRepoPath
)

$ErrorActionPreference = "Stop"
$nodeCommand = (Get-Command node -ErrorAction Stop).Source
$scriptPath = Join-Path $PSScriptRoot "manual-e2e-smoke.js"

$arguments = @($scriptPath)
if ($UserRegistryPath) {
  $arguments += @("--user-registry", $UserRegistryPath)
}
if ($TempRoot) {
  $arguments += @("--temp-root", $TempRoot)
}
if ($IncludeSkillSmoke) {
  $arguments += "--include-skill-smoke"
}
if ($SkillRepoPath) {
  $arguments += @("--skill-repo-path", $SkillRepoPath)
}

& $nodeCommand @arguments
exit $LASTEXITCODE
