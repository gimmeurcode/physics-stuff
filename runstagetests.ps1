# runstagetests.ps1 -- the stage-level two-route suite (Programme D item 3).
#
# WHY THIS EXISTS. runtests.ps1 extracts modules 21-49 only, so none of the
# 178 stages' own arithmetic was unit-tested: igTriple.volume() returned 471%
# of a tetrahedron and NaN for a box on a switch any reader could flip, and
# runtests, auditclaims and runall were all blind to it by construction
# (MASTER-PLAN 3.4 item 3). auditsides reads what the panels RENDER; this
# suite calls the stage helpers DIRECTLY with synthetic states, inside the
# real booted bundle, so a two-route disagreement is a number compared with a
# number rather than a regex over prose.
#
# WHAT IT RUNS. tests-stages.js -- the corpus of two-route assertions. The
# rule for membership: a helper with two routes to the same answer, tolerance
# set from the routes' own measured error. The suite carries an in-run corrupt
# control (the pre-fix box clip) so a run that cannot fail is itself a failure.
#
# Must print:  ===STAGETESTS=== N passed, 0 failed
#
# Written ASCII-only so it does not depend on the .ps1 being read as UTF-8.

$ErrorActionPreference = 'Stop'
$dir   = $PSScriptRoot
$body  = Get-Content (Join-Path $dir 'vector-calculus.html') -Raw -Encoding UTF8
$suite = Get-Content (Join-Path $dir 'tests-stages.js') -Raw -Encoding UTF8

$head = @'
<!doctype html><html data-theme="dark"><head><meta charset="utf-8">
<script>window.__errs=[];window.addEventListener('error',function(e){window.__errs.push(e.message);});</script>
</head><body>
'@

$mid = @'
<script>
setTimeout(function(){
  try {
'@

$tail = @'
  } catch (ex) {
    var t = document.createElement('div');
    t.id = 'STAGEREPORT';
    t.textContent = 'THREW ' + String(ex && ex.message || ex) +
      '\n===STAGETESTS=== 0 passed, 1 failed';
    document.body.appendChild(t);
  }
}, 900);
</script></body></html>
'@

$out = Join-Path $dir 'apptest-stagetests.html'
Set-Content -Path $out -Value ($head + $body + $mid + $suite + $tail) -Encoding utf8

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$url    = 'file:///' + ($out -replace '\\','/')
# Chrome writes to stderr for reasons that are not failures; under
# ErrorActionPreference = 'Stop' each line becomes a terminating
# NativeCommandError and kills the run after the sweep and before the DOM is
# written (MASTER-PLAN 3.4). The verdict below is still checked.
$ErrorActionPreference = 'Continue'
& $chrome --headless --disable-gpu --no-sandbox --window-size=1680,1000 --virtual-time-budget=600000 `
          --user-data-dir="$(Join-Path $dir 'cprof-stagetests')" --dump-dom $url |
  Out-File (Join-Path $dir 'dom-stagetests.txt') -Encoding utf8
$ErrorActionPreference = 'Stop'

$dom = Get-Content (Join-Path $dir 'dom-stagetests.txt') -Raw -Encoding UTF8
$marker = 'id="STAGEREPORT">'
$a = $dom.IndexOf($marker)
if ($a -lt 0) { Write-Output 'NO REPORT - the page never reached the suite.'; exit 1 }
$a += $marker.Length
$b = $dom.IndexOf('</div>', $a)
$rep = $dom.Substring($a, $b - $a).Replace('&lt;','<').Replace('&gt;','>').Replace('&amp;','&')

$failed = -1
foreach ($line in ($rep -split "`n")) {
  $line = $line.TrimEnd()
  if (-not $line) { continue }
  Write-Output $line
  if ($line -match '===STAGETESTS=== (\d+) passed, (\d+) failed') { $failed = [int]$Matches[2] }
}

if ($failed -lt 0) { Write-Output 'runstagetests: no verdict line - treat as red.'; exit 1 }
if ($failed -gt 0) {
  Write-Output ''
  Write-Output "runstagetests FAILED: $failed assertion(s). A stage helper's two routes disagree"
  Write-Output '  beyond the tolerance its own measured error set. Attribute before touching the'
  Write-Output '  tolerance -- MASTER-PLAN 2.1: the difference is the evidence.'
  exit 1
}
Write-Output 'runstagetests OK'
