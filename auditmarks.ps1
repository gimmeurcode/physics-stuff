# auditmarks.ps1 -- are the "key points" drawn on a plot real?
#
# WHY THIS EXISTS. pvFeatures (59c-plot-view.js) reads zeros, extrema and
# discontinuities off a sampled curve and pvDrawFeatures paints them: circles on
# the curve, and a dashed vertical line for each break. Nothing measured whether
# any of them were TRUE. The break test compared a step against 12x the MEDIAN
# step of the whole curve, which asks whether this part of the curve is steeper
# than the rest of it rather than whether the curve is broken there -- so every
# curve with a long flat tail and a short steep head grew a picket fence of
# dashed "pole" markers across a perfectly continuous stretch. Four of the
# forty screenshots in Programme J are that fence.
#
# WHAT IS MEASURED. Every live plot on all 178 stages, every curve on it. For
# each candidate break this counts the verdict under BOTH rules:
#
#   OLD   |step| > 12 x median step            (what shipped)
#   NEW   the same, AND refinement says the curve diverges in the interval
#         -- the midpoint leaves the endpoints' range by more than the gap
#         itself -- or, with no fn to refine with, the step dwarfs its own
#         immediate neighbours by 8x
#
# A drop in the count is only half the evidence. The other half is that the real
# poles SURVIVE, so the script also reports the stages that keep breaks, and a
# control curve with a known pole (tan) and one with none (a steep gaussian)
# are checked by name.
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

$probe = @'
<script>
setTimeout(function(){
  var rows = [], oldTot = 0, newTot = 0, curves = 0, plots = 0, withFn = 0;
  var keep = {};

  // the OLD rule, kept here so both verdicts come from one run
  function oldBreaks(xs, ys){
    var n = xs.length, steps = [], i;
    if (n < 3) return 0;
    for (i = 1; i < n; i++)
      if (isFinite(ys[i]) && isFinite(ys[i-1])) steps.push(Math.abs(ys[i] - ys[i-1]));
    if (!steps.length) return 0;
    steps.sort(function(a,b){ return a - b; });
    var med = steps[Math.floor(steps.length/2)] || 0;
    var big = Math.max(med * 12, 1e-12), c = 0;
    for (i = 1; i < n; i++) {
      var a = ys[i-1], b = ys[i], fa = isFinite(a), fb = isFinite(b);
      if (fa !== fb) { c++; continue; }
      if (!fa) continue;
      if (Math.abs(b - a) > big && steps.length > 8) c++;
    }
    return c;
  }
  function newBreaks(xs, ys, fn){
    var f = pvFeatures(xs, ys, fn), c = 0;
    for (var i = 0; i < f.length; i++) if (f[i].t === 'break') c++;
    return c;
  }

  var ids = Object.keys(STAGES);
  for (var s = 0; s < ids.length; s++) {
    var id = ids[s];
    try {
      stageEnter(id);
      stageFrame(0.016);                    // PV_REG is filled by drawing
      var so = 0, sn = 0;
      for (var p = 0; p < PV_REG.length; p++) {
        var P = PV_REG[p];
        if (!P.curves || !P.curves.length) continue;
        plots++;
        for (var c = 0; c < P.curves.length; c++) {
          var cv = P.curves[c];
          if (!cv.xs || cv.xs.length < 3) continue;
          curves++;
          if (typeof cv.fn === 'function') withFn++;
          so += oldBreaks(cv.xs, cv.ys);
          sn += newBreaks(cv.xs, cv.ys, cv.fn);
        }
      }
      oldTot += so; newTot += sn;
      if (so !== sn || sn > 0) rows.push(id + '\t' + so + '\t' + sn);
      if (sn > 0) keep[id] = sn;
      stageExit();
    } catch (ex) {
      rows.push(id + '\tTHREW\t' + String(ex && ex.message || ex).slice(0, 60));
      try { stageExit(); } catch (e2) {}
    }
  }

  // ---- named controls: a real pole must survive, a steep smooth curve must not
  // produce one. Both are sampled the way a stage samples: evenly, 240 points.
  function sample(f, x0, x1){
    var xs = [], ys = [], N = 240;
    for (var i = 0; i <= N; i++) { var x = x0 + (x1 - x0) * i / N; xs.push(x); ys.push(f(x)); }
    return { xs:xs, ys:ys, fn:f };
  }
  var ctl = [];
  // ONE pole in this window, not two: pi/2 = 1.5708 is inside, 3pi/2 = 4.712 is
  // past the right end. The first version of this line said two, and made a
  // correct answer look like a miss -- a control has to be right about what it
  // is controlling for.
  var polE = sample(function(x){ return Math.tan(x); }, -1.4, 4.6);
  ctl.push('tan(x) over -1.4..4.6 (1 real pole, at pi/2): old=' + oldBreaks(polE.xs, polE.ys) +
           ' new=' + newBreaks(polE.xs, polE.ys, polE.fn));
  var spike = sample(function(x){ return Math.exp(-x*x*400); }, -1, 1);  // steep, continuous
  ctl.push('exp(-400x^2), steep but continuous: old=' + oldBreaks(spike.xs, spike.ys) +
           ' new=' + newBreaks(spike.xs, spike.ys, spike.fn));
  var decay = sample(function(x){ return Math.exp(-30*x); }, 0, 8);      // the shape that failed
  ctl.push('exp(-30x), long tail short head: old=' + oldBreaks(decay.xs, decay.ys) +
           ' new=' + newBreaks(decay.xs, decay.ys, decay.fn));
  // 240 samples over [-2,2] land one exactly on 0, so the pole is flagged from
  // both sides -- two markers a pixel apart for one pole. That is the
  // finite-beside-non-finite branch doing its job, not a false positive.
  var inv = sample(function(x){ return 1 / x; }, -2, 2);
  ctl.push('1/x over -2..2 (1 real pole, sampled ON it, so 2 marks): old=' + oldBreaks(inv.xs, inv.ys) +
           ' new=' + newBreaks(inv.xs, inv.ys, inv.fn));

  var t = document.createElement('div');
  t.id = 'REPORT';
  t.textContent = rows.join('\n') + '\nCTL\t' + ctl.join('\nCTL\t') +
    '\n#stages=' + ids.length + ' plots=' + plots + ' curves=' + curves +
    ' withfn=' + withFn + ' oldbreaks=' + oldTot + ' newbreaks=' + newTot +
    ' stageskeeping=' + Object.keys(keep).length + ' errs=' + window.__errs.length;
  document.body.appendChild(t);
}, 1200);
</script></body></html>
'@

$out = Join-Path $dir 'apptest-marks.html'
Set-Content -Path $out -Value ($head + $body + $probe) -Encoding utf8
$url = 'file:///' + ($out -replace '\\','/')
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless --disable-gpu --no-sandbox `
  --window-size=1680,1000 --virtual-time-budget=600000 `
  --user-data-dir="$(Join-Path $dir 'cprof-marks')" --dump-dom $url |
  Out-File (Join-Path $dir 'dom-marks.txt') -Encoding utf8

$dom = Get-Content (Join-Path $dir 'dom-marks.txt') -Raw -Encoding UTF8
$m = 'id="REPORT">'
$a = $dom.IndexOf($m)
if ($a -lt 0) { Write-Output 'NO REPORT - the page never reached the probe.'; exit 1 }
$a += $m.Length
$b = $dom.IndexOf('</div>', $a)
$rep = $dom.Substring($a, $b - $a).Replace('&lt;','<').Replace('&gt;','>').Replace('&amp;','&')

foreach ($line in ($rep -split "`n")) {
  $line = $line.TrimEnd()
  if (-not $line) { continue }
  if ($line.StartsWith('CTL' + "`t")) { Write-Output ('  control: ' + $line.Substring(4)); continue }
  if ($line.StartsWith('#')) { Write-Output ''; Write-Output $line; continue }
  Write-Output ('  ' + ($line -replace "`t", '  '))
}
