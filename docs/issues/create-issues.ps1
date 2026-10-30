# create-issues.ps1: create the task issues from docs/issues/*.md, in dependency order, with links
#
# usage, from the repo folder (Windows PowerShell 5.1):
#   powershell -ExecutionPolicy Bypass -File docs\issues\create-issues.ps1 -DryRun   # only print
#   powershell -ExecutionPolicy Bypass -File docs\issues\create-issues.ps1           # create
#
# safe to run again: issues whose [ID] already exists on GitHub are skipped, not duplicated.

param([switch]$DryRun)

$ErrorActionPreference = "Stop"

# the stage issues already on GitHub: each task becomes a sub-issue of its stage
$stages = @{
    "S2" = @{ Number = 5; Milestone = "Stage 2: voice agent in the terminal" }
    "S3" = @{ Number = 6; Milestone = "Stage 3: usage and local data" }
    "S4" = @{ Number = 7; Milestone = "Stage 4: server and sync" }
    "S5" = @{ Number = 8; Milestone = "Stage 5: web app" }
    "S6" = @{ Number = 9; Milestone = "Stage 6: later" }
}

# every issue that already exists, by our ID: "[S2-01] ..." -> its GitHub number
$known = @{}
$all = gh issue list --state all --limit 500 --json number,title | ConvertFrom-Json
foreach ($issue in $all) {
    if ($issue.title -match '^\[([A-Z0-9-]+)\]') { $known[$Matches[1]] = $issue.number }
}
Write-Host "Already on GitHub: $($known.Count) issues"

# task files sorted by name: s2-01 ... s6-05 (every task depends only on smaller IDs)
$files = Get-ChildItem docs\issues -Filter "s?-??-*.md" | Sort-Object Name

foreach ($file in $files) {
    $text = Get-Content $file.FullName -Raw -Encoding UTF8

    # read our ID, title, labels and dependencies from the file's first lines
    if ($text -notmatch '(?m)^# \[([A-Z0-9-]+)\] (.+)$') { throw "no title line in $($file.Name)" }
    $id = $Matches[1]
    # double quotes and backticks removed: Windows PowerShell 5.1 mangles them when calling gh
    $title = "[$id] " + ($Matches[2].Trim() -replace '["`]', '')
    if ($text -notmatch '\| Labels \| (.+?) \|') { throw "no Labels line in $($file.Name)" }
    $labels = $Matches[1] -split ',\s*'
    if ($text -notmatch '\| Depends on \| (.+?) \|') { throw "no Depends on line in $($file.Name)" }
    $deps = [regex]::Matches($Matches[1], '\b(S\d-\d\d|M\d)\b') | ForEach-Object { $_.Value }

    if ($known.ContainsKey($id)) {
        Write-Host "skip   $id   already #$($known[$id])"
        continue
    }

    # every dependency must already have a number, otherwise the order is wrong: stop
    $blockers = @()
    foreach ($dep in $deps) {
        if (-not $known.ContainsKey($dep)) { throw "$id depends on $dep, which has no issue yet" }
        $blockers += $known[$dep]
    }

    $stage = $stages[$id.Substring(0, 2)]
    $ghArgs = @("issue", "create", "--title", $title, "--body-file", $file.FullName,
                "--milestone", $stage.Milestone, "--parent", $stage.Number)
    foreach ($label in $labels) { $ghArgs += @("--label", $label.Trim()) }
    if ($blockers.Count -gt 0) { $ghArgs += @("--blocked-by", ($blockers -join ",")) }

    if ($DryRun) {
        Write-Host "would  $title   parent #$($stage.Number)   labels $($labels -join ',')   blocked by $($blockers -join ',')"
        $known[$id] = "new-$id"   # a stand-in, so later tasks can refer to it
        continue
    }

    $url = & gh @ghArgs
    if ($LASTEXITCODE -ne 0) { throw "gh failed while creating $id" }
    $number = [int](($url -split '/')[-1])
    $known[$id] = $number
    Write-Host "made   $id   #$number   blocked by $($blockers -join ',')"
    Start-Sleep -Milliseconds 1500   # be gentle with GitHub's limits on creating content
}

Write-Host "Done."
