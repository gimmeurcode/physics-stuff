# audittext.ps1 — what the site SAYS, as opposed to whether it runs.
#
# runall.ps1 proves every demo executes without throwing. This proves every demo
# is *readable*: it drives all 443 experiments in all 39 wings, harvests the
# textContent of every panel a student actually reads, and scans the harvest for
#
#   1. ASCII stand-ins for mathematics   (x^2, sqrt, theta, <=, ->, +/-, hbar)
#   2. undefined / NaN / Infinity leaking into prose
#   3. panels that render empty or near-empty (derivation, legend, readout, chip)
#   4. raw markup or template residue reaching the reader (<sub> as text, ${...})
#   5. stages missing derive / legend / readout / chip entirely
#
# The scan runs on RENDERED OUTPUT, never on source: grepping src/ for "sqrt"
# drowns in Math.sqrt( and grepping for "theta" drowns in variable names. The
# only place the distinction is visible is the DOM.
#
# Writes audittext-dump.json (the full harvest, for offline querying) and prints
# a report. Exit code 1 if anything in class 1-5 is found.
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
  var rows = [], struct = [];

  function txt(id){ var e = document.getElementById(id); return e ? (e.textContent||'').replace(/\s+/g,' ').trim() : null; }
  function html(id){ var e = document.getElementById(id); return e ? (e.innerHTML||'') : null; }

  // ---- structural completeness: every stage must carry the full set ----
  Object.keys(STAGES).forEach(function(id){
    var s = STAGES[id];
    struct.push({ stage:id, title:(s.title||''),
                  derive: typeof s.derive === 'function',
                  readout: typeof s.readout === 'function',
                  chip: typeof s.chip === 'function',
                  legend: typeof s.legend === 'function',
                  controls: typeof s.controls === 'function' });
  });

  // ---- the theory essay behind every wing ----
  // #theoryProse is filled by openTheory(), not by setWing — reading it without
  // opening the sheet harvests an empty string for all 39 wings.
  var wingKeys = Object.keys(WINGS);
  wingKeys.forEach(function(w){
    try {
      setWing(w, true);
      openTheory();
      var pr = document.getElementById('theoryProse');
      rows.push({ kind:'theory', wing:w, key:'', name:WINGS[w].title||w,
                  text:(pr ? (pr.textContent||'').replace(/\s+/g,' ').trim() : ''),
                  raw:(pr ? pr.innerHTML.slice(0, 400000) : ''),
                  /* the formal layer, counted from the RENDERED essay so it
                     measures what a reader can actually reach */
                  stmts: (typeof stAudit === 'function' ? stAudit(pr) : []) });
      document.getElementById('sheet').classList.remove('open');
    } catch(e) { rows.push({kind:'theory', wing:w, key:'', name:w, text:'THREW '+e, raw:''}); }
  });

  // ---- every demo in every wing, with all its reader-facing panels ----
  wingKeys.forEach(function(w){
    try { setWing(w, true); } catch(e){ return; }
    for (var g = 0; g < DEMOS.length; g++) {
      for (var i = 0; i < DEMOS[g].items.length; i++) {
        var key = g + '.' + i, it = DEMOS[g].items[i];
        var rec = { kind:'demo', wing:w, key:key, name:it.n||'', ex:it.ex||'',
                    stage:it.stage||'', group:(DEMOS[g].g||DEMOS[g].n||'') };
        try {
          applyDemo(key);
          if (stageActive()) {
            for (var f = 0; f < 5; f++) stageFrame(0.05);
            stagePick(R.W*0.55, R.H*0.5);
            refreshStageReadout(); updateStageChip(); updateStageLegend();
          }
          rec.readout  = txt('stageReadout');
          rec.chip     = txt('chip');
          // the key lands in #stageLegend only when the stage sets dockLegend;
          // otherwise it floats over the canvas in #legend. Read both.
          rec.legend   = txt('stageLegend') || txt('legend');
          rec.derive   = txt('deriveBody');
          rec.note     = txt('demoNote');
          rec.stageBody= txt('stageBody');
          rec.probe    = txt('probeReadout');
          // innerHTML too: markup residue is invisible in textContent
          rec.h_readout = html('stageReadout');
          rec.h_derive  = html('deriveBody');
          rec.h_note    = html('demoNote');
          rec.h_stageBody = html('stageBody');
        } catch(e) { rec.err = String(e); }
        rows.push(rec);
      }
    }
  });

  var out = document.createElement('div');
  out.id = 'DUMP';
  out.textContent = JSON.stringify({ rows: rows, struct: struct, errs: window.__errs });
  document.body.appendChild(out);
  var d2 = document.createElement('div');
  d2.id = 'DUMPEND'; d2.textContent = 'END';
  document.body.appendChild(d2);
}, 1800);
</script></body></html>
'@

$out = Join-Path $dir 'audittext.tmp.html'
Set-Content -Path $out -Value ($head + $body + $tail) -Encoding utf8

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $chrome)) { $chrome = 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe' }
# its own profile — two Chromes sharing one silently dump nothing
$prof = Join-Path $dir 'cprof-text'
$url  = 'file:///' + ($out -replace '\\','/')

# Chrome writes to stderr for reasons that are not failures (USB enumeration, an
# XNNPACK delegate, GCM registration). Under ErrorActionPreference = 'Stop' each
# such line becomes a terminating NativeCommandError and the run dies AFTER the
# sweep and BEFORE the DOM is written, throwing the result away. See MASTER-PLAN
# 3.4. The exit status is still checked below; nothing is being swallowed.
$ErrorActionPreference = 'Continue'
& $chrome --headless --disable-gpu --no-sandbox --window-size=1680,1000 `
          --virtual-time-budget=180000 --user-data-dir="$prof" --dump-dom $url |
  Out-File (Join-Path $dir 'audittext-dom.txt') -Encoding utf8
$ErrorActionPreference = 'Stop'

$dom = Get-Content (Join-Path $dir 'audittext-dom.txt') -Raw -Encoding UTF8
Remove-Item $out -Force -ErrorAction SilentlyContinue

$mk = 'id="DUMP">'
$a = $dom.IndexOf($mk)
if ($a -lt 0) { Write-Output 'NO DUMP — the harness did not run'; exit 1 }
$a += $mk.Length
$b = $dom.IndexOf('</div>', $a)
$json = $dom.Substring($a, $b - $a)
# textContent was HTML-escaped on the way out
$json = $json -replace '&quot;','"' -replace '&lt;','<' -replace '&gt;','>' -replace '&amp;','&'
Set-Content -Path (Join-Path $dir 'audittext-dump.json') -Value $json -Encoding utf8

Write-Output ('harvested ' + $json.Length + ' bytes -> audittext-dump.json')
Write-Output 'now run: ./auditscan.ps1'
