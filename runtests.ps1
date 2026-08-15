$ErrorActionPreference = 'Stop'
$dir  = $PSScriptRoot
$html = Get-Content (Join-Path $dir 'vector-calculus.html') -Raw -Encoding UTF8

$anchor = '"use strict";'
$start  = $html.IndexOf($anchor) + $anchor.Length
$mark   = $html.IndexOf('APPLICATION STATE')
if ($mark -lt 0) { throw "could not locate the end-of-field-section marker" }
$end    = $html.LastIndexOf('/* ==', $mark)
if ($start -lt $anchor.Length -or $end -lt 0) { throw "could not locate section markers" }
$src = $html.Substring($start, $end - $start)
$src = $src -replace '/\*\[\[[A-Z]+\]\]\*/', ''

$tests = Get-Content (Join-Path $dir 'tests.js') -Raw -Encoding UTF8

$tpl = @'
<!doctype html><meta charset="utf-8"><body><pre id="out">no output</pre>
<script>
window.addEventListener('error', function(ev){
  document.getElementById('out').textContent =
    '===TESTS=== HARD ERROR : ' + ev.message + '  (line ' + ev.lineno + ':' + ev.colno + ')';
  ev.preventDefault();
});
</script>
<script>
"use strict";
__SRC__
const SOURCE_TEXT = document.currentScript.textContent;
try {
__TESTS__
} catch (e) {
  document.getElementById('out').textContent = '===TESTS=== THREW : ' + (e && e.stack ? e.stack : e);
}
</script></body>
'@

$page = $tpl.Replace('__SRC__', $src).Replace('__TESTS__', $tests)

$testPath = Join-Path $dir 'enginetest.html'
Set-Content -Path $testPath -Value $page -Encoding utf8

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
# Its own profile, not the shared ./cprof: runall.ps1 uses that one, and two
# Chrome instances sharing a user-data-dir silently corrupt each other's output
# — which shows up here as an empty dom.txt rather than as an error.
$prof   = Join-Path $dir 'cprof-tests'
$url    = 'file:///' + ($testPath -replace '\\','/')
# Chrome writes to stderr for reasons that are not failures (USB enumeration, an
# XNNPACK delegate, GCM registration). Under ErrorActionPreference = 'Stop' each
# such line becomes a terminating NativeCommandError and the run dies AFTER the
# sweep and BEFORE the DOM is written, throwing the result away. See MASTER-PLAN
# 3.4. The exit status is still checked below; nothing is being swallowed.
$ErrorActionPreference = 'Continue'
& $chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=15000 --user-data-dir="$prof" --dump-dom $url |
  Out-File -FilePath (Join-Path $dir 'dom.txt') -Encoding utf8
$ErrorActionPreference = 'Stop'

$dom = Get-Content (Join-Path $dir 'dom.txt') -Raw
$open = $dom.IndexOf('<pre id="out">')
$i = if ($open -ge 0) { $open + 14 } else { -1 }
$j = if ($i -ge 0) { $dom.IndexOf('</pre>', $i) } else { -1 }
if ($i -lt 0 -or $j -lt 0) {
  Write-Output "NO TEST OUTPUT. First 2000 chars of DOM:"
  Write-Output $dom.Substring(0, [Math]::Min(2000, $dom.Length))
} else {
  $body = $dom.Substring($i, $j - $i)
  $body = $body.Replace('&lt;','<').Replace('&gt;','>').Replace('&amp;','&')
  $lines = $body -split "[\r\n]+"
  Write-Output $lines[0]
  $bad = $lines | Where-Object { $_ -match '^(FAIL|.*HARD ERROR|.*THREW)' }
  if ($bad) { Write-Output $bad } else { Write-Output "no failures" }
}
