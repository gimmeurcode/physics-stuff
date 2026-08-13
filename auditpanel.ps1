# auditpanel.ps1 -- do the panels survive leaving a stage and coming back?
#
# WHY THIS EXISTS. refreshStageReadout/refreshDerive/updateStageChip write
# through uiSetHtml (80a-ui-core.js), which SKIPS a write whose HTML matches
# what it last wrote. That is worth ~2.8 MB/s of DOM churn, and it makes the
# panels stateful: the cache marker must always describe what is actually in
# the element. Anything that writes one of those elements directly leaves the
# marker describing a DOM that is gone, and the next identical refresh is then
# skipped as a no-op -- so the panel keeps content that is stale, or none.
#
# WHAT NOTHING ELSE SEES. On the build that introduced it, stageExit() cleared
# #stageReadout directly and 145 OF 178 STAGES came back BLANK on re-entry.
# `runall.ps1` reported `caught=0 OK` on that same build, because it visits each
# demo once and never returns to one; `smoke.ps1` checked that every stage
# carries its nine methods, not that calling them twice works. Nothing raises,
# no number changes, and no text goes NaN -- the panel is simply empty.
#
# smoke.ps1 greps for the CAUSE (a direct .innerHTML on those three elements).
# This measures the EFFECT, so a future caching change that goes wrong some
# other way is still caught.
#
# Written ASCII-only so it does not depend on the .ps1 being read as UTF-8.

$ErrorActionPreference = 'Stop'
$dir  = $PSScriptRoot
$body = Get-Content (Join-Path $dir 'vector-calculus.html') -Raw -Encoding UTF8

$head = @'
<!doctype html><html data-theme="dark"><head><meta charset="utf-8">
<script>window.__errs=[];window.addEventListener('error',function(e){window.__errs.push(e.message);});</script>
</head><body>
'@

$tail = @'
<script>
setTimeout(function(){
  try { document.getElementById('home').classList.remove('open'); } catch(e){}
  var rows = [], blank = 0;
  var ids = Object.keys(STAGES);
  var get = function(id){ var e = document.getElementById(id); return (e && e.innerHTML) || ''; };

  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    try {
      stageEnter(id); stageFrame(0.016);
      refreshStageReadout(); updateStageChip();
      var r1 = get('stageReadout'), d1 = get('deriveBody'), c1 = get('chip');

      stageExit();                       // leave, as the reader does

      stageEnter(id); stageFrame(0.016); // and come straight back
      refreshStageReadout(); updateStageChip();
      var r2 = get('stageReadout'), d2 = get('deriveBody'), c2 = get('chip');

      var bad = [];
      if (r1.length && !r2.length) bad.push('READOUT-BLANK');
      if (d1.length && !d2.length) bad.push('DERIVE-BLANK');
      if (c1.length && !c2.length) bad.push('CHIP-BLANK');
      if (bad.length) {
        blank++;
        rows.push(id + '\t' + bad.join(' ') + '\tfirst=' + r1.length + ' second=' + r2.length);
      }
    } catch (ex) {
      blank++;
      rows.push(id + '\tTHREW ' + String(ex && ex.message || ex).slice(0, 70));
    }
  }

  var t = document.createElement('div');
  t.id = 'REPORT';
  t.textContent = rows.join('\n') + '\n#stages=' + ids.length + ' bad=' + blank +
                  ' errs=' + window.__errs.length;
  document.body.appendChild(t);
}, 900);
</script></body></html>
'@

$out = Join-Path $dir 'apptest-panel.html'
Set-Content -Path $out -Value ($head + $body + $tail) -Encoding utf8

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$url    = 'file:///' + ($out -replace '\\','/')
& $chrome --headless --disable-gpu --no-sandbox --window-size=1680,1000 --virtual-time-budget=600000 `
          --user-data-dir="$(Join-Path $dir 'cprof-panel')" --dump-dom $url |
  Out-File (Join-Path $dir 'dom-panel.txt') -Encoding utf8

$dom = Get-Content (Join-Path $dir 'dom-panel.txt') -Raw -Encoding UTF8
$marker = 'id="REPORT">'
$a = $dom.IndexOf($marker)
if ($a -lt 0) { Write-Output 'NO REPORT - the page never reached the probe.'; exit 1 }
$a += $marker.Length
$b = $dom.IndexOf('</div>', $a)
$rep = $dom.Substring($a, $b - $a).Replace('&lt;','<').Replace('&gt;','>').Replace('&amp;','&')

$bad = 0
foreach ($line in ($rep -split "`n")) {
  $line = $line.TrimEnd()
  if (-not $line) { continue }
  if ($line.StartsWith('#')) {
    Write-Output $line
    if ($line -match 'bad=(\d+)') { $bad = [int]$Matches[1] }
    continue
  }
  Write-Output ('  ' + ($line -replace "`t", '  '))
}

if ($bad -gt 0) {
  Write-Output ''
  Write-Output "auditpanel FAILED: $bad stage(s) lost a panel after being left and reopened."
  Write-Output '  Look for a direct .innerHTML write to #stageReadout, #deriveBody or #chip'
  Write-Output '  -- it leaves uiSetHtml''s cache marker describing a DOM that is gone.'
  exit 1
}
Write-Output 'auditpanel OK'
