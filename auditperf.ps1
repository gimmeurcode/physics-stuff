# auditperf.ps1 -- where does a frame actually go?
#
# Programme E has always been a list of suspicions with one measurement behind it
# (vcConserv, since fixed). This measures all 178 stages and splits each frame
# into the two things that can cost: the DRAW, and the PANEL REBUILD that runs
# beside it four times a second whether or not anything changed.
#
# The split is the whole point. A stage that is slow to draw needs fewer
# primitives; a stage that is fast to draw but slow to refresh is paying for
# innerHTML on a derivation ladder that has not changed since the reader opened
# it (60a-stage-core.js:79 -> refreshStageReadout -> refreshDerive). Those want
# opposite fixes, and averaging them together hides which one you have.
#
# Also counts primitives per frame for the 17 mode:'3d' stages, because the
# depth-sorted renderer allocates one record per primitive and SORTS THE WHOLE
# ARRAY every frame (20-render.js:187) before issuing one canvas call each.
#
# Numbers are indicative, not absolute: headless Chrome on one machine. What
# transfers is the RANKING and the draw/refresh split, which is what tells you
# where to spend effort.
#
# -Where ATTRIBUTES the cost to the drawing helper that spent it, for the
# heaviest stages. Use it BEFORE optimising anything. The ranking above says
# which stage is expensive; it does not say which call is, and the two are not
# the same question. MASTER-PLAN 3.5 named "unbatched strokes on the
# multivariable stages" on the evidence of mvSurface's 25 450 path ops -- and
# was wrong: those ops are already inside 16 batched ctContour paths, and the
# real cost was ctHeat, which no one had named, on ten different stages.
# Path ops and paint calls are not the same currency.
#
# Written ASCII-only so it does not depend on the .ps1 being read as UTF-8.

param([switch]$Where)

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
  var rows = [];
  try { document.getElementById('home').classList.remove('open'); } catch(e){}

  /* WHY WORK AND NOT MILLISECONDS.
     --virtual-time-budget runs Chrome on a virtual clock, so performance.now()
     does not advance inside a synchronous loop and every stage times as 0.00 ms.
     Counting operations instead is not a workaround, it is the better measure:
     it is deterministic, it is identical on every machine, and for this renderer
     the cost IS the call count -- each stroke/fill is a separate rasterisation
     and each 3D primitive is an object allocated, depth-sorted and painted. */
  var OPS = { paint:0, path:0, text:0 };
  var PAINT = ['stroke','fill','fillRect','strokeRect','drawImage','putImageData'];
  var PATH  = ['moveTo','lineTo','arc','arcTo','bezierCurveTo','quadraticCurveTo','rect','ellipse'];
  var TEXT  = ['fillText','strokeText'];
  function wrap(list, bucket){
    list.forEach(function(m){
      var proto = CanvasRenderingContext2D.prototype, orig = proto[m];
      if (typeof orig !== 'function') return;
      proto[m] = function(){ OPS[bucket]++; return orig.apply(this, arguments); };
    });
  }
  wrap(PAINT, 'paint'); wrap(PATH, 'path'); wrap(TEXT, 'text');

  // ---- attribution: which HELPER spent the calls (-Where only) ----
  // Each shared drawing helper is wrapped so the paint/path delta ACROSS the
  // call is charged to it. Nested helpers double-count into their caller, which
  // is what you want: it tells you which layer to fix.
  var ATTRIB = __WHERE__;
  var TALLY = {};
  if (ATTRIB) {
    ['ctHeat','ctContour','ctPath','ctFill','ctParam','ctDot','ctArrow','ctText',
     'ctGrid','ctSurf3','plotCurve','cxPaint','ctBar','ctArcAngle','ctVecField',
     'lpPaint','skPaint','em3dBegin','R.flush'].forEach(function(name){
      var orig = window[name];
      if (typeof orig !== 'function') return;
      window[name] = function(){
        var p0 = OPS.paint, q0 = OPS.path;
        var r = orig.apply(this, arguments);
        var t = TALLY[name] || (TALLY[name] = {n:0, paint:0, path:0});
        t.n++; t.paint += OPS.paint - p0; t.path += OPS.path - q0;
        return r;
      };
    });
  }

  // The 3D renderer clears its array inside flush(), so the count has to be
  // taken on the way in.
  var lastPrims = 0;
  if (typeof R !== 'undefined' && R && typeof R.flush === 'function') {
    var origFlush = R.flush.bind(R);
    R.flush = function(){ lastPrims = Math.max(lastPrims, R.items ? R.items.length : 0); return origFlush.apply(null, arguments); };
  }

  var ids = Object.keys(STAGES);
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i], paint = 0, path = 0, text = 0, prims = 0, roBytes = 0, note = '', where = '';
    try {
      stageEnter(id);
      for (var w = 0; w < 3; w++) stageFrame(0.016);      // warm up caches

      // ---- one frame's drawing work. Reset per stage: lastPrims used to carry
      //      over from the previous stage and reported 792 primitives for 2D
      //      stages that never touch the 3D renderer at all.
      lastPrims = 0; OPS.paint = 0; OPS.path = 0; OPS.text = 0;
      if (ATTRIB) TALLY = {};
      var FR = 3;
      for (var n = 0; n < FR; n++) stageFrame(0.016);
      paint = Math.round(OPS.paint / FR); path = Math.round(OPS.path / FR); text = Math.round(OPS.text / FR);
      prims = lastPrims;
      if (ATTRIB) {
        var parts = [];
        Object.keys(TALLY).forEach(function(k){
          var t = TALLY[k];
          if (t.paint >= 30 || t.path >= 300)
            parts.push({ k:k, n:Math.round(t.n/FR), paint:Math.round(t.paint/FR), path:Math.round(t.path/FR) });
        });
        parts.sort(function(a,b){ return b.paint - a.paint; });
        where = parts.map(function(p){
          return p.k + ' n=' + p.n + ' paint=' + p.paint + ' path=' + p.path; }).join(' | ');
      }

      // ---- the panel rebuild that runs ~4x/second whether or not anything
      //      changed.
      //
      // This used to measure the SIZE of the panel after a refresh, which is
      // not the cost -- it is the cost only if the refresh actually writes.
      // Since uiSetHtml() skips a write whose HTML is identical to what is
      // already there, a column of panel sizes could not see its own fix and
      // went on reporting 2.8 MB/s after the writes had stopped.
      //
      // What is measured now is the bytes WRITTEN by a refresh that follows an
      // identical one with no state change in between -- i.e. the waste. Zero
      // is the expected answer. A stage that still writes has a readout that is
      // not a pure function of its state, which is worth knowing on its own.
      refreshStageReadout();
      if (typeof updateStageChip === 'function') updateStageChip();
      var wrote = 0;
      var realSet = uiSetHtml;
      uiSetHtml = function(el, html){
        var did = realSet(el, html);
        if (did) wrote += (html || '').length;
        return did;
      };
      refreshStageReadout();
      if (typeof updateStageChip === 'function') updateStageChip();
      uiSetHtml = realSet;
      roBytes = wrote;
    } catch (ex) { note = 'THREW ' + String(ex && ex.message || ex).slice(0, 60); }
    var is3d = !!(STAGES[id] && STAGES[id].mode === '3d');
    rows.push([id, (is3d ? '3d' : '2d'), paint, path, text, prims, roBytes, note, where].join('\t'));
  }

  var t = document.createElement('div');
  t.id = 'REPORT';
  t.textContent = rows.join('\n') + '\n#stages=' + ids.length + ' jserrors=' + window.__errs.length;
  document.body.appendChild(t);
}, 900);
</script></body></html>
'@

$tail = $tail.Replace('__WHERE__', $(if ($Where) { 'true' } else { 'false' }))

$out = Join-Path $dir 'apptest-perf.html'
Set-Content -Path $out -Value ($head + $body + $tail) -Encoding utf8

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$url    = 'file:///' + ($out -replace '\\','/')
& $chrome --headless --disable-gpu --no-sandbox --window-size=1680,1000 --virtual-time-budget=600000 `
          --user-data-dir="$(Join-Path $dir 'cprof-perf')" --dump-dom $url |
  Out-File (Join-Path $dir 'dom-perf.txt') -Encoding utf8

$dom = Get-Content (Join-Path $dir 'dom-perf.txt') -Raw -Encoding UTF8
$marker = 'id="REPORT">'
$a = $dom.IndexOf($marker)
if ($a -lt 0) { Write-Output 'NO REPORT - the page never reached the probe.'; exit 1 }
$a += $marker.Length
$b = $dom.IndexOf('</div>', $a)
$rep = $dom.Substring($a, $b - $a).Replace('&lt;','<').Replace('&gt;','>').Replace('&amp;','&')

$rows = @()
foreach ($line in ($rep -split "`n")) {
  if (-not $line.Trim() -or $line.StartsWith('#')) { continue }
  $f = $line -split "`t"
  if ($f.Count -lt 7) { continue }
  $rows += [pscustomobject]@{
    stage = $f[0]; kind = $f[1]
    paint = [int]$f[2]; path = [int]$f[3]; text = [int]$f[4]
    prims = [int]$f[5]; panelBytes = [int]$f[6]
    note = $(if ($f.Count -gt 7) { $f[7] } else { '' })
    # .Trim() matters: the report is split on "`n", so every last field keeps a
    # trailing "`r" -- which is a NON-EMPTY string, so `if ($r.where)` was true
    # for stages with no attribution and printed a blank line instead of saying
    # that the stage draws with its own calls.
    where = $(if ($f.Count -gt 8) { $f[8].Trim() } else { '' })
  }
}
$rows | Sort-Object paint -Descending | Export-Csv (Join-Path $dir 'audit-perf.csv') -NoTypeInformation -Encoding UTF8

# A rasterising call every ~60 ops is comfortable at 60 fps on a modern machine;
# past a few thousand per frame the main thread is the bottleneck, and that is
# exactly where a shared tab (an artifact page, a laptop on battery) shows it.
function Verdict($n) { if ($n -lt 400) { 'light' } elseif ($n -lt 1200) { 'moderate' } elseif ($n -lt 2500) { 'HEAVY' } else { 'VERY HEAVY' } }

Write-Output ''
Write-Output '  Most drawing work per frame -- paint = rasterising calls (stroke/fill/drawImage)'
Write-Output ''
Write-Output ('    {0,-20} {1,-4} {2,7} {3,7} {4,7} {5,7} {6,7}  {7}' -f 'stage','kind','paint','path','text','prims','panelB','verdict')
foreach ($r in ($rows | Sort-Object paint -Descending | Select-Object -First 20)) {
  Write-Output ('    {0,-20} {1,-4} {2,7} {3,7} {4,7} {5,7} {6,7}  {7}' -f $r.stage, $r.kind, $r.paint, $r.path, $r.text, $r.prims, $r.panelBytes, (Verdict $r.paint))
}
if ($Where) {
  Write-Output ''
  Write-Output '  WHERE IT GOES -- paint/path charged to the helper that issued it'
  Write-Output '  (a nested helper also counts into its caller: that shows you which layer to fix)'
  Write-Output ''
  foreach ($r in ($rows | Sort-Object paint -Descending | Select-Object -First 12)) {
    Write-Output ('    {0,-18} total paint={1} path={2}' -f $r.stage, $r.paint, $r.path)
    if ($r.where) { foreach ($p in ($r.where -split ' \| ')) { Write-Output ('        ' + $p) } }
    else          { Write-Output '        (nothing attributable -- the stage draws with its own calls)' }
  }
}

Write-Output ''
Write-Output '  WASTED PANEL WRITES -- bytes rewritten by a refresh when NOTHING had changed'
Write-Output ''
$waste = @($rows | Where-Object { $_.panelBytes -gt 0 })
if ($waste.Count -eq 0) {
  Write-Output '    none -- every stage skipped its unchanged refresh'
} else {
  foreach ($r in ($waste | Sort-Object panelBytes -Descending | Select-Object -First 8)) {
    Write-Output ('    {0,-20} {1,7:N0} bytes rewritten with no state change' -f $r.stage, $r.panelBytes)
  }
}
Write-Output ''
$heavy = @($rows | Where-Object { $_.paint -ge 1200 })
$d3 = @($rows | Where-Object { $_.kind -eq '3d' })
$d2 = @($rows | Where-Object { $_.kind -eq '2d' })
Write-Output ("  stages={0}   heavy (>=1200 paint calls/frame)={1}   3d={2}" -f $rows.Count, $heavy.Count, $d3.Count)
Write-Output ("  3d stages: mean {0:N0} paint calls, mean {1:N0} primitives sorted per frame (max {2:N0})" -f
  (($d3 | Measure-Object paint -Average).Average), (($d3 | Measure-Object prims -Average).Average), (($d3 | Measure-Object prims -Maximum).Maximum))
Write-Output ("  2d stages: mean {0:N0} paint calls per frame" -f (($d2 | Measure-Object paint -Average).Average))
Write-Output ("  panel writes: {0} of {1} stages rewrite an unchanged panel, {2:N0} bytes/s wasted across all stages" -f
  $waste.Count, $rows.Count, (($rows | Measure-Object panelBytes -Sum).Sum * 2.5))
Write-Output ''
Write-Output (($rep -split "`n") | Where-Object { $_.StartsWith('#') })
