# Installs this tier of the agent framework into ~/.claude.
#   powershell -ExecutionPolicy Bypass -File install.ps1
$ErrorActionPreference = 'Stop'

$src = $PSScriptRoot
$dest = Join-Path $HOME '.claude'
$agents = Join-Path $dest 'agents'
$commands = Join-Path $dest 'commands'
New-Item -ItemType Directory -Force -Path $agents, $commands | Out-Null

Copy-Item (Join-Path $src 'commands\*.md') $commands -Force
Copy-Item (Join-Path $src 'AGENTS_FRAMEWORK.md') $dest -Force
Copy-Item (Join-Path $src 'agents\*.md') $agents -Force
Copy-Item (Join-Path $src 'KICKOFF.md') $dest -Force

# Append the auto-role block to ~/.claude/CLAUDE.md (idempotent).
$claude = Join-Path $dest 'CLAUDE.md'
$marker = '## Agent framework — automatic worktree roles'
if (-not (Test-Path $claude)) { New-Item -ItemType File -Path $claude | Out-Null }
if (-not (Select-String -Path $claude -SimpleMatch $marker -Quiet)) {
  Add-Content $claude "`n"
  Get-Content (Join-Path $src 'CLAUDE-autorole.md') | Add-Content $claude
  Write-Host "Appended auto-role block to $claude"
}
else { Write-Host "Auto-role block already present in $claude (skipped)" }

Write-Host ""
Write-Host "Installed into $dest"
Write-Host "Agents: $agents  |  Commands: $commands  |  KICKOFF.md + AGENTS_FRAMEWORK.md in $dest"
Write-Host ""
Write-Host "NEXT (manual, so your existing settings aren't clobbered):"
Write-Host "  Merge $src\settings.snippet.json into $dest\settings.json"
Write-Host "  Optional HTML docs: see kb\KB-INTEGRATION.md"
Write-Host "  New project? Open a repo and run /bootstrap <idea>. Customizing? Read ADAPT-FOR-NEW-PROJECT.md"
