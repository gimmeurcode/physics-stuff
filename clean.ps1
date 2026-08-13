# clean.ps1 - delete every artifact a harness script regenerates.
#
# Nothing here is source. Each pattern below is written by a script on every run
# and read only by that same script, in that same run. Left alone they reached
# 1.57 GB, which is 280x the deployable app, and made "sort the directory by
# size to find the artifact" give the wrong answer - several apptest-*.html
# wrappers are LARGER than vector-calculus.html itself.
#
# What is NOT touched, and why:
#   src/                  the source
#   *.ps1, *.md, tests.js the tooling, the documentation, the unit suite
#   vector-calculus.html  the deployable (regenerable by ./build.ps1 in ~1 s,
#                         but it is the thing being shipped, so it stays)
#
# Cost of the deletion, per category, if you need any of it back:
#   cprof-*/              free - Chrome recreates the profile on next launch
#   dom-*.txt, apptest-*  free - rewritten by whichever script you next run
#   dom/smokedom/probedom free - same
#   enginetest.html       free - ./runtests.ps1 rebuilds it every run
#   audit-*.csv           20 s to 4 min - re-run the audit that writes it
#   audittext-dump.json   ~4 min - ./audittext.ps1, and auditscan/auditprose
#                         both read it rather than driving a browser themselves
#   shot-*.png            ~20 s each - ./runapp.ps1 -Wing w -Demo d -Tag t
#
# Usage:  ./clean.ps1          delete
#         ./clean.ps1 -WhatIf  list what would go, delete nothing
param([switch]$WhatIf)

$ErrorActionPreference = 'Stop'
$dir = $PSScriptRoot

$patterns = @(
  'apptest-*.html',      # the app plus an injected probe, one copy per harness
  'dom-*.txt',           # --dump-dom output, one per harness run
  'dom.txt',             # runtests
  'smokedom.txt',        # smoke
  'probedom.txt',        # the probe harness
  'audittext-dom.txt',   # the text harvest's raw dump
  'audittext-dump.json', # the harvest itself (audittext.ps1, ~4 min)
  'audit-*.csv',         # findings tables from the audit scripts
  'audittext-findings.csv',
  'enginetest.html',     # rebuilt by runtests.ps1 on every run
  'shot-*.png',          # screenshots from runapp.ps1
  'smoke.tmp.html'       # smoke.ps1 removes this itself; catch a crashed run
)

$files = @()
foreach ($p in $patterns) {
  $files += @(Get-ChildItem -Path $dir -Filter $p -File -ErrorAction SilentlyContinue)
}
$profiles = @(Get-ChildItem -Path $dir -Filter 'cprof*' -Directory -ErrorAction SilentlyContinue)

$fileBytes = 0
if ($files.Count) { $fileBytes = ($files | Measure-Object Length -Sum).Sum }
$profBytes = 0
foreach ($d in $profiles) {
  $inner = @(Get-ChildItem $d.FullName -Recurse -File -ErrorAction SilentlyContinue)
  if ($inner.Count) { $profBytes += ($inner | Measure-Object Length -Sum).Sum }
}
$total = $fileBytes + $profBytes

if ($WhatIf) {
  Write-Output ("would delete {0} files ({1:N1} MB) and {2} Chrome profile dirs ({3:N1} MB)" -f
    $files.Count, ($fileBytes / 1MB), $profiles.Count, ($profBytes / 1MB))
  $files | ForEach-Object { Write-Output ('  ' + $_.Name) }
  $profiles | ForEach-Object { Write-Output ('  ' + $_.Name + '\') }
  Write-Output ("total {0:N2} GB" -f ($total / 1GB))
  exit 0
}

foreach ($f in $files)    { Remove-Item $f.FullName -Force -ErrorAction SilentlyContinue }
foreach ($d in $profiles) { Remove-Item $d.FullName -Recurse -Force -ErrorAction SilentlyContinue }

Write-Output ("cleaned: {0} files + {1} Chrome profile dirs, {2:N2} GB freed" -f
  $files.Count, $profiles.Count, ($total / 1GB))
Write-Output 'nothing deleted here is source - see the header for what each category cost to regenerate'
