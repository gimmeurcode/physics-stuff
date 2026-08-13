# auditframe.ps1 -- is the curve actually inside the window it is drawn in?
#
# "Every function should come with the curve fully shown in the plot." Before
# this script there was no way to know which plots fail that, because a curve
# leaving its window is silent: plotCurve used to clamp the stray samples into
# a band outside the box, so the picture showed a flat line ruled across the
# axis labels and nothing reported anything. It now clips instead, which is
# honest but still leaves the reader looking at a curve with its top cut off.
#
# So: wrap plotCurve, sample what it was asked to draw, and measure the
# fraction of finite samples whose y falls outside [y0, y1].
#
# Not every overflow is a defect, and the script does not pretend otherwise:
#
#   POLE    the curve genuinely runs to infinity (tan, 1/x, a resonance peak).
#           No window contains it and clipping is the correct picture.
#   MINOR   under 5% outside -- a peak just brushing the top of the frame.
#   CUT     5% or more of the curve is off-frame with no pole to explain it.
#           This is the one to look at: the window is simply too small.
#
# It reports rather than fails, because which of those a given plot is cannot
# be decided from the numbers alone.
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
  try { document.getElementById('home').classList.remove('open'); } catch(e){}

  var hits = [];
  var origCurve = window.plotCurve;
  window.plotCurve = function(ctx, P, fn, n, col, w, fill){
    var r = origCurve.apply(null, arguments);
    try {
      if (!fill && P && typeof fn === 'function' && isFinite(P.y0) && isFinite(P.y1)) {
        var N = 240, out = 0, tot = 0, huge = 0, ys = [];
        var lo = Math.min(P.y0, P.y1), hi = Math.max(P.y0, P.y1), span = hi - lo;
        for (var i = 0; i <= N; i++) {
          var y = fn(P.x0 + (P.x1 - P.x0) * i / N);
          ys.push(y);
          if (!isFinite(y)) { huge++; continue; }
          tot++;
          if (y < lo || y > hi) {
            out++;
            // a sample more than 20 windows away is a pole, not a tall peak
            if (Math.abs(y - (lo + hi) / 2) > span * 20) huge++;
          }
        }
        // A STRAIGHT LINE that leaves the frame is not a framing defect. Half
        // the flagged stages draw a tangent, an asymptote or a linear-fit line
        // deliberately running off the picture -- clipping is exactly what
        // should happen to those, and widening the window to contain one would
        // squash the curve it was drawn to touch. Detected by second
        // difference rather than assumed, so a curve that merely looks
        // straight over part of its range is not excused.
        var lin = tot > 20, d2max = 0, d2n = 0;
        for (var j = 1; j < ys.length - 1 && lin; j++) {
          if (!isFinite(ys[j-1]) || !isFinite(ys[j]) || !isFinite(ys[j+1])) continue;
          d2max = Math.max(d2max, Math.abs(ys[j+1] - 2 * ys[j] + ys[j-1]));
          d2n++;
        }
        var rise = 0;
        for (var j2 = 1; j2 < ys.length; j2++)
          if (isFinite(ys[j2]) && isFinite(ys[j2-1])) rise = Math.max(rise, Math.abs(ys[j2] - ys[j2-1]));
        lin = lin && d2n > 20 && d2max <= Math.max(rise * 1e-6, 1e-12);
        if (tot > 20 && out > 0) hits.push({ f: out / tot, pole: huge > 0, line: lin, lo: lo, hi: hi });
      }
    } catch (e) {}
    return r;
  };

  var ids = Object.keys(STAGES);
  var nCut = 0, nMinor = 0, nPole = 0, nLine = 0;
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    hits = [];
    try {
      stageEnter(id);
      for (var f = 0; f < 3; f++) stageFrame(0.05);
    } catch (ex) { rows.push(id + '\tTHREW ' + (ex && ex.message ? ex.message : String(ex)).slice(0, 70)); continue; }
    if (!hits.length) continue;
    // The worst curve that is NOT explained away decides how the stage reads;
    // a stage whose only overflow is a tangent line is not a finding at all.
    var real = hits.filter(function(h){ return !h.line && !h.pole; });
    var kind, worst;
    if (real.length) {
      worst = real[0];
      for (var h = 1; h < real.length; h++) if (real[h].f > worst.f) worst = real[h];
      kind = worst.f < 0.05 ? 'MINOR' : 'CUT';
    } else {
      worst = hits[0];
      for (var h2 = 1; h2 < hits.length; h2++) if (hits[h2].f > worst.f) worst = hits[h2];
      kind = worst.line ? 'LINE' : 'POLE';
    }
    var pct = Math.round(worst.f * 100);
    if (kind === 'CUT') nCut++; else if (kind === 'MINOR') nMinor++;
    else if (kind === 'LINE') nLine++; else nPole++;
    rows.push(id + '\t' + kind + '\t' + pct + '\t' +
              'y window ' + (+worst.lo.toPrecision(4)) + ' to ' + (+worst.hi.toPrecision(4)) +
              ' , ' + hits.length + ' curve(s)');
  }

  var t = document.createElement('div');
  t.id = 'REPORT';
  t.textContent = '@@' + rows.join('\n') +
    '\n#stages=' + ids.length + ' cut=' + nCut + ' minor=' + nMinor + ' line=' + nLine + ' pole=' + nPole + '@@';
  document.body.appendChild(t);
}, 900);
</script></body></html>
'@

$out = Join-Path $dir 'apptest-frame.html'
Set-Content -Path $out -Value ($head + $body + $tail) -Encoding utf8

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$url    = 'file:///' + ($out -replace '\\','/')
& $chrome --headless --disable-gpu --no-sandbox --window-size=1680,1000 --virtual-time-budget=240000 `
          --user-data-dir="$(Join-Path $dir 'cprof-frame')" --dump-dom $url |
  Out-File (Join-Path $dir 'dom-frame.txt') -Encoding utf8

$dom = Get-Content (Join-Path $dir 'dom-frame.txt') -Raw -Encoding UTF8
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
  if ($f.Count -lt 4) { continue }
  $rows += [pscustomobject]@{ stage = $f[0]; kind = $f[1]; pct = [int]$f[2]; detail = $f[3] }
}
$rows | Sort-Object @{e='kind';Descending=$false}, @{e='pct';Descending=$true} |
  Export-Csv (Join-Path $dir 'audit-frame.csv') -NoTypeInformation -Encoding UTF8

Write-Output 'Curves running outside their own window, worst first:'
Write-Output ''
foreach ($r in ($rows | Where-Object kind -eq 'CUT' | Sort-Object pct -Descending)) {
  Write-Output ("  CUT   {0,-22} {1,3}% outside   {2}" -f $r.stage, $r.pct, $r.detail)
}
Write-Output ''
foreach ($r in ($rows | Where-Object kind -eq 'MINOR' | Sort-Object pct -Descending)) {
  Write-Output ("  minor {0,-22} {1,3}% outside   {2}" -f $r.stage, $r.pct, $r.detail)
}
Write-Output ''
Write-Output (($rep -split "`n") | Where-Object { $_.StartsWith('#') })

