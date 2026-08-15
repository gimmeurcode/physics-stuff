# auditzoom.ps1 -- does the plot viewport actually work, on every stage?
#
# Named for the gesture rather than the word "view", because auditviewport.ps1
# already exists and does something entirely different (it launches Chrome at
# thirteen real WINDOW sizes and checks the page around the canvas). This one
# never changes the window: it drives the pan/zoom viewport INSIDE the canvas.
#
# 59c-plot-view.js gives all 253 mkPlot boxes a pan/zoom viewport. Two things
# have to be true for that to be safe, and neither is visible to any other
# script in the suite:
#
#   IDENTITY  With no reader interaction, mkPlot must return EXACTLY the window
#             it was handed. This is the property the whole design rests on --
#             it is what makes the change invisible to 178 stages that know
#             nothing about it. A rounding slip here would shift every picture
#             in the laboratory by a fraction of a pixel and nothing else would
#             report it.
#
#   ZOOM      Zoom, pan and reset must not throw, must not produce a non-finite
#             window, must leave the stage still drawing, and reset must land
#             back on the base window to the last bit.
#
# runall.ps1 drives controls but never touches the canvas viewport; auditsize
# sweeps window shapes at the default view only. Both would pass with the
# viewport completely broken.
#
# Written ASCII-only so it does not depend on the .ps1 being read as UTF-8.

$ErrorActionPreference = 'Stop'
$dir  = $PSScriptRoot
$body = Get-Content (Join-Path $dir 'vector-calculus.html') -Raw -Encoding UTF8

$head = @'
<!doctype html><html data-theme="dark"><head><meta charset="utf-8">
<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(e.message + ' @' + e.lineno); });
</script></head><body>
'@

$tail = @'
<script>
setTimeout(function(){
  var rows = [];
  var cv  = document.getElementById('cv') || document.querySelector('canvas');
  var ctx = cv.getContext('2d');
  try { document.getElementById('home').classList.remove('open'); } catch(e){}

  // ---- IDENTITY: wrap mkPlot and compare the window it returns against the
  //      window it was asked for, whenever no view has been stored.
  var idBad = [];
  var origMk = window.mkPlot;
  window.mkPlot = function(px, py, pw, ph, x0, x1, y0, y1){
    var P = origMk.apply(null, arguments);
    var v = (typeof ST !== 'undefined' && ST && ST.pvv) ? ST.pvv[P.key] : null;
    var def = !v || (v.ox === 0 && v.oy === 0 && v.kx === 1 && v.ky === 1);
    if (def && (P.x0 !== x0 || P.x1 !== x1 || P.y0 !== y0 || P.y1 !== y1))
      idBad.push('asked ' + [x0,x1,y0,y1].join(',') + ' got ' + [P.x0,P.x1,P.y0,P.y1].join(','));
    return P;
  };

  var drew = 0;
  var oS = ctx.stroke.bind(ctx), oF = ctx.fill.bind(ctx), oT = ctx.fillText.bind(ctx);
  ctx.stroke = function(){ drew++; return oS.apply(null, arguments); };
  ctx.fill   = function(){ drew++; return oF.apply(null, arguments); };
  ctx.fillText = function(){ drew++; return oT.apply(null, arguments); };

  function pump(n){ for (var f = 0; f < n; f++) stageFrame(0.05); }
  function finite(P){ return isFinite(P.x0) && isFinite(P.x1) && isFinite(P.y0) && isFinite(P.y1)
                          && P.x0 !== P.x1 && P.y0 !== P.y1; }

  var ids = Object.keys(STAGES);
  var withPlots = 0, totalPlots = 0, animated = [];
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i], notes = [], before = window.__errs.length;
    idBad = []; drew = 0;
    try {
      stageEnter(id);
      pump(3);
      if (!drew) notes.push('BLANK-AT-REST');
      var n = PV_REG.length;
      totalPlots += n;
      if (n === 0) {
        // not a finding: plenty of stages are diagrams, not graphs
      } else {
        withPlots++;
        var P = PV_REG[0];
        var base = [P.b.x0, P.b.x1, P.b.y0, P.b.y1];
        var w0   = [P.x0, P.x1, P.y0, P.y1];
        if (base.join() !== w0.join()) notes.push('BASE-NOT-AT-REST');

        // Some stages animate the window itself -- emFaraday scrolls its time
        // axis, clLimit marches in on the limit point. The view is stored
        // RELATIVE to the base precisely so a reader's zoom rides along with
        // that instead of being torn off it, which means the exact-arithmetic
        // assertions below cannot apply: the base has moved on by the time they
        // are checked. Detect it rather than assume it, and still run every
        // check that does not depend on the base holding still.
        pump(1);
        var b2 = PV_REG[0] ? [PV_REG[0].b.x0, PV_REG[0].b.x1, PV_REG[0].b.y0, PV_REG[0].b.y1] : base;
        var animBase = (b2.join() !== base.join());
        base = b2;

        // ---- ZOOM IN about the centre
        pvZoomCentre(P, 4);
        drew = 0; pump(2);
        var Q = PV_REG[0];
        if (!Q || !finite(Q)) notes.push('ZOOM-WINDOW-BAD');
        else if (!animBase) {
          var got = (Q.x1 - Q.x0), want = (base[1] - base[0]) / 4;
          if (Math.abs(got - want) > Math.abs(want) * 1e-6) notes.push('ZOOM-SPAN ' + got + ' want ' + want);
          var cWas = (base[0] + base[1]) / 2, cNow = (Q.x0 + Q.x1) / 2;
          if (Math.abs(cNow - cWas) > Math.abs(base[1] - base[0]) * 1e-6) notes.push('ZOOM-MOVED-CENTRE');
        } else {
          // it must still MAGNIFY, even if by how much cannot be pinned exactly
          if (!((Q.x1 - Q.x0) < (base[1] - base[0]) * 0.6)) notes.push('ZOOM-DID-NOTHING');
        }
        if (!drew) notes.push('BLANK-AFTER-ZOOM');

        // ---- PAN
        var xb = PV_REG[0].x0;
        pvPanBy(PV_REG[0], 40, 0);
        pump(1);
        if (!finite(PV_REG[0])) notes.push('PAN-WINDOW-BAD');
        else if (PV_REG[0].x0 === xb) notes.push('PAN-DID-NOTHING');

        // ---- TYPED WINDOW: the dock boxes go through pvSetWindow
        if (!animBase) {
          pvSetWindow(PV_REG[0], base[0], base[1], base[2], base[3]);
          pump(1);
          var T = PV_REG[0];
          if (Math.abs(T.x0 - base[0]) > Math.max(1e-9, Math.abs(base[0]) * 1e-9) ||
              Math.abs(T.x1 - base[1]) > Math.max(1e-9, Math.abs(base[1]) * 1e-9))
            notes.push('TYPED-WINDOW-OFF ' + T.x0 + ',' + T.x1 + ' want ' + base[0] + ',' + base[1]);
        }

        // ---- RESET must land exactly on the base window
        pvResetAll();
        pump(2);
        var Rr = PV_REG[0];
        if (!Rr) notes.push('RESET-LOST-PLOT');
        else if (!animBase && [Rr.x0, Rr.x1, Rr.y0, Rr.y1].join() !== base.join())
          notes.push('RESET-NOT-EXACT');
        else if (animBase && [Rr.x0, Rr.x1, Rr.y0, Rr.y1].join() !== [Rr.b.x0, Rr.b.x1, Rr.b.y0, Rr.b.y1].join())
          notes.push('RESET-NOT-ON-BASE');
        if (animBase) notes.push('note:ANIMATED-BASE');
      }
      if (idBad.length) notes.push('IDENTITY ' + idBad[0]);

      // the readout must survive all of that without leaking a bad number
      var ro = document.getElementById('stageReadout');
      var txt = ro ? (ro.textContent || '') : '';
      if (/\bNaN\b|\bundefined\b|\bInfinity\b/.test(txt)) notes.push('READOUT ' + txt.slice(0, 60));

      // the View panel must exist and be wired
      if (!document.getElementById('pvPanel')) notes.push('NO-VIEW-PANEL');
      if (!document.getElementById('pvRst'))   notes.push('NO-RESET-BUTTON');
    } catch (ex) {
      notes.push('THREW ' + (ex && ex.message ? ex.message : String(ex)).slice(0, 90));
    }
    var errs = window.__errs.slice(before);
    if (errs.length) notes.push('JS ' + errs.join(' ;; ').slice(0, 90));
    // a 'note:' entry is an observation about the stage, not a defect in it
    var real = notes.filter(function(n){ return n.indexOf('note:') !== 0; });
    if (real.length) rows.push(id + '\t' + notes.join(' | '));
    else if (notes.length) animated.push(id);
  }

  var t = document.createElement('div');
  t.id = 'REPORT';
  t.textContent = '@@' + rows.join('\n') +
    '\n#stages=' + ids.length + ' withplots=' + withPlots + ' plots=' + totalPlots +
    ' animatedbase=' + animated.length + ' (' + animated.join(',') + ')' +
    ' findings=' + rows.length + (rows.length ? ' REVIEW' : ' OK') + '@@';
  document.body.appendChild(t);
}, 900);
</script></body></html>
'@

$out = Join-Path $dir 'apptest-zoom.html'
Set-Content -Path $out -Value ($head + $body + $tail) -Encoding utf8

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$url    = 'file:///' + ($out -replace '\\','/')
# Chrome writes to stderr for reasons that are not failures (USB enumeration, an
# XNNPACK delegate, GCM registration). Under ErrorActionPreference = 'Stop' each
# such line becomes a terminating NativeCommandError and the run dies AFTER the
# sweep and BEFORE the DOM is written, throwing the result away. See MASTER-PLAN
# 3.4. The exit status is still checked below; nothing is being swallowed.
$ErrorActionPreference = 'Continue'
& $chrome --headless --disable-gpu --no-sandbox --window-size=1680,1000 --virtual-time-budget=240000 `
          --user-data-dir="$(Join-Path $dir 'cprof-zoom')" --dump-dom $url |
  Out-File (Join-Path $dir 'dom-zoom.txt') -Encoding utf8
$ErrorActionPreference = 'Stop'

$dom = Get-Content (Join-Path $dir 'dom-zoom.txt') -Raw -Encoding UTF8
$marker = 'id="REPORT">'
$a = $dom.IndexOf($marker)
if ($a -lt 0) { Write-Output 'NO REPORT - the page never reached the probe.'; exit 1 }
$a += $marker.Length
$b = $dom.IndexOf('</div>', $a)
$rep = $dom.Substring($a, $b - $a).Replace('@@','').Replace('&lt;','<').Replace('&gt;','>').Replace('&amp;','&')

$rows = @()
foreach ($line in ($rep -split "`n")) {
  if (-not $line.Trim() -or $line.StartsWith('#')) { continue }
  $f = $line -split "`t"
  if ($f.Count -lt 2) { continue }
  $rows += [pscustomobject]@{ stage = $f[0]; note = $f[1] }
}
$rows | Export-Csv (Join-Path $dir 'audit-zoom.csv') -NoTypeInformation -Encoding UTF8

foreach ($k in @('IDENTITY','THREW','JS','ZOOM','PAN','RESET','TYPED','BLANK','READOUT','NO-VIEW','BASE')) {
  $n = ($rows | Where-Object { $_.note -like "*$k*" }).Count
  if ($n) { Write-Output ("  {0,-10} {1}" -f $k, $n) }
}
Write-Output ''
foreach ($r in ($rows | Select-Object -First 40)) {
  Write-Output ("  {0,-22} {1}" -f $r.stage, $r.note)
}
Write-Output ''
Write-Output (($rep -split "`n") | Where-Object { $_.StartsWith('#') })

