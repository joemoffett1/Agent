# Install the agent framework into ~/.claude (Windows PowerShell).
#
#   powershell -ExecutionPolicy Bypass -File install.ps1
#   (or double-click install.cmd)
#
# Copies the role files + commands + reference docs, and installs (or UPGRADES) the
# automatic-worktree-role block in ~/.claude/CLAUDE.md. Safe to re-run: it never
# clobbers your other settings, and a re-run replaces an older framework block in
# place so you always get the current mindset (reviewer runs in the feature's own
# worktree — there is no dedicated reviewer branch/worktree).
$ErrorActionPreference = 'Stop'

$src      = $PSScriptRoot
$dest     = Join-Path $HOME '.claude'
$agents   = Join-Path $dest 'agents'
$commands = Join-Path $dest 'commands'
New-Item -ItemType Directory -Force -Path $agents, $commands | Out-Null

Copy-Item (Join-Path $src 'agents\*.md')   $agents   -Force
Copy-Item (Join-Path $src 'commands\*.md') $commands -Force
Copy-Item (Join-Path $src 'AGENTS_FRAMEWORK.md') $dest -Force
Copy-Item (Join-Path $src 'KICKOFF.md')          $dest -Force

$claude = Join-Path $dest 'CLAUDE.md'
if (-not (Test-Path $claude)) { New-Item -ItemType File -Path $claude | Out-Null }

$begin = '<!-- BEGIN agent-framework autorole (managed by install — edits between the markers are overwritten on reinstall) -->'
$end   = '<!-- END agent-framework autorole -->'
$autorole = (Get-Content (Join-Path $src 'CLAUDE-autorole.md') -Raw)
$block = "$begin`n$autorole`n$end`n"

$content = Get-Content $claude -Raw
if ($null -eq $content) { $content = '' }

# Use a MatchEvaluator so '$' in the block is never treated as a substitution token.
$eval = [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $block }
$reOpts = [System.Text.RegularExpressions.RegexOptions]

if ($content.Contains($begin)) {
  $pat = [regex]::Escape($begin) + '.*?' + [regex]::Escape($end) + '(\r?\n)?'
  $content = [regex]::Replace($content, $pat, $eval, $reOpts::Singleline)
  Write-Host "Updated the autorole block in $claude"
}
elseif ($content -match '(?m)^## Agent framework') {
  $pat = '(?ms)^## Agent framework.*?^Ignore this block[^\r\n]*(\r?\n)?'
  $content = [regex]::Replace($content, $pat, $eval, ($reOpts::Multiline -bor $reOpts::Singleline))
  Write-Host "Replaced the legacy autorole block in $claude"
}
else {
  if ($content.Length -gt 0 -and -not $content.EndsWith("`n")) { $content += "`n" }
  $content += "`n$block"
  Write-Host "Appended the autorole block to $claude"
}
Set-Content -Path $claude -Value $content -NoNewline

Write-Host ""
Write-Host "Installed into $dest"
Write-Host "  agents\ + commands\ + AGENTS_FRAMEWORK.md + KICKOFF.md + the autorole block in CLAUDE.md"
Write-Host ""
Write-Host "Optional next steps (nothing here is required):"
Write-Host "  - Fewer prompts: merge $src\settings.snippet.json into $dest\settings.json (permissions only)."
Write-Host "  - New project? Open the repo and run /bootstrap <idea> (copies the kb\ KB starter in)."
Write-Host "  - Customizing for a non-Magic repo? Read ADAPT-FOR-NEW-PROJECT.md."
Write-Host ""
Write-Host "The reviewer now runs inside each feature's own worktree (/role reviewer there);"
Write-Host "there is no dedicated reviewer branch or worktree."
