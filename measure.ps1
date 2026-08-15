# measure.ps1 -- the headline numbers, measured rather than quoted.
#
# MASTER-PLAN Part 0 is a table of counts, and the rule beside it is "a count in
# prose goes stale within a session -- measure before quoting". Until this script
# existed, several of those numbers had no tool behind them: the wing, group and
# experiment counts were described as "counted from WINGS[*].groups[*].items in
# the booted app", which is a thing a person did once by hand.
#
# Every number below is measured here, and the ones that need the app booted are
# read out of the running page rather than grepped. That distinction matters:
# static greps over src/ for the group count returned 89 and 105 depending on the
# pattern, because group objects are formatted several ways. The booted app says
# 118, and the booted app is the thing that is true.
#
# The artifact size is reported in real bytes. build.ps1 prints a CHARACTER
# count, which is ~57 KB smaller because the Unicode maths symbols are multi-byte
# in UTF-8 -- and that difference had been carried into the documentation as the
# deployable size.
#
# Written ASCII-only so it does not depend on the .ps1 being read as UTF-8.

$ErrorActionPreference = 'Stop'
$dir  = $PSScriptRoot
$app  = Join-Path $dir 'vector-calculus.html'
$body = Get-Content $app -Raw -Encoding UTF8

$head = '<!doctype html><html data-theme="dark"><head><meta charset="utf-8"></head><body>'
$tail = @'
<script>
setTimeout(function(){
  var wings = Object.keys(WINGS), groups = 0, items = 0, staged = 0, field = 0, own = 0;
  wings.forEach(function(w){
    var gs = WINGS[w].groups || [];
    groups += gs.length;
    gs.forEach(function(g){
      (g.items || []).forEach(function(it){
        items++;
        if (it.stage) staged++; else field++;
        if (it.opts && it.opts.own) own++;
      });
    });
  });
  var reachable = {}, unreachable = [];
  wings.forEach(function(w){
    ((WINGS[w].groups) || []).forEach(function(g){
      (g.items || []).forEach(function(it){ if (it.stage) reachable[it.stage] = 1; });
    });
  });
  Object.keys(STAGES).forEach(function(s){ if (!reachable[s]) unreachable.push(s); });
  var t = document.createElement('div');
  t.id = 'REPORT';
  t.textContent = 'wings=' + wings.length + '|groups=' + groups + '|experiments=' + items +
    '|stagedriven=' + staged + '|fieldpipeline=' + field + '|ownflag=' + own +
    '|stages=' + Object.keys(STAGES).length +
    '|unreachablestages=' + (unreachable.length ? unreachable.join(',') : 'none');
  document.body.appendChild(t);
}, 700);
</script></body></html>
'@

$out = Join-Path $dir 'apptest-measure.html'
Set-Content -Path $out -Value ($head + $body + $tail) -Encoding utf8

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$url    = 'file:///' + ($out -replace '\\','/')
# Chrome writes to stderr for reasons that are not failures (USB enumeration, an
# XNNPACK delegate, GCM registration). Under ErrorActionPreference = 'Stop' each
# such line becomes a terminating NativeCommandError and the run dies AFTER the
# sweep and BEFORE the DOM is written, throwing the result away. See MASTER-PLAN
# 3.4. The exit status is still checked below; nothing is being swallowed.
$ErrorActionPreference = 'Continue'
& $chrome --headless --disable-gpu --no-sandbox --window-size=1400,900 --virtual-time-budget=90000 `
          --user-data-dir="$(Join-Path $dir 'cprof-measure')" --dump-dom $url |
  Out-File (Join-Path $dir 'dom-measure.txt') -Encoding utf8
$ErrorActionPreference = 'Stop'

$dom = Get-Content (Join-Path $dir 'dom-measure.txt') -Raw -Encoding UTF8
# Anchor on the rendered element: the dump contains this script's own source, so
# searching for a marker string would find the literal in the <script> above it.
$marker = 'id="REPORT">'
$a = $dom.IndexOf($marker)
if ($a -lt 0) { Write-Output 'NO REPORT - the page never booted.'; exit 1 }
$a += $marker.Length
$b = $dom.IndexOf('</div>', $a)
$fields = @{}
foreach ($kv in ($dom.Substring($a, $b - $a) -split '\|')) {
  $p = $kv -split '=', 2
  if ($p.Count -eq 2) { $fields[$p[0]] = $p[1] }
}

# --- measured off the filesystem, not the page -------------------------------
$mods  = @(Get-ChildItem (Join-Path $dir 'src\js') -Filter '*.js').Count
$bytes = (Get-Item $app).Length
$srcLines = 0
foreach ($f in (Get-ChildItem (Join-Path $dir 'src') -Recurse -File)) {
  $srcLines += @(Get-Content $f.FullName).Count
}
$mkplot = 0
foreach ($f in (Get-ChildItem (Join-Path $dir 'src\js') -Filter '*.js')) {
  $mkplot += ([regex]::Matches((Get-Content $f.FullName -Raw), '\bmkPlot\s*\(')).Count
}

Write-Output ''
Write-Output '  measured now, from the booted app:'
foreach ($k in @('wings','groups','experiments','stagedriven','fieldpipeline','stages','ownflag','unreachablestages')) {
  if ($fields.ContainsKey($k)) { Write-Output ("    {0,-20} {1}" -f $k, $fields[$k]) }
}
Write-Output ''
Write-Output '  measured now, from the source tree:'
Write-Output ("    {0,-20} {1}" -f 'modules',      $mods)
# map.ps1 reports ~74 148 for src/js alone; this counts all of src/ including
# shell.html, head.html and styles.css, so the two are meant to differ.
Write-Output ("    {0,-20} {1}  (all of src/; map.ps1 reports src/js alone)" -f 'source lines', $srcLines)
Write-Output ("    {0,-20} {1}" -f 'mkPlot sites', $mkplot)
Write-Output ("    {0,-20} {1:N0} bytes = {2} MB decimal / {3} MiB" -f 'artifact', $bytes,
              [Math]::Round($bytes / 1e6, 2), [Math]::Round($bytes / 1MB, 2))
Write-Output ''
Write-Output '  the rest come from the gate that owns them:'
Write-Output '    unit tests        ./runtests.ps1     table claims      ./auditclaims.ps1'
Write-Output '    see-links         ./smoke.ps1        derivation rungs  ./auditderive.ps1'
Write-Output '    statement cards   ./auditscan.ps1    guided experiments run above'
