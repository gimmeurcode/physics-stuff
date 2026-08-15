# auditsize.ps1 — does every stage still draw properly when the window is not
# the size it was written on?
#
# Every stage lays its picture out from the canvas dimensions it is handed, and
# almost all of them do it with hardcoded margins: `mkPlot(80, 55, W - 170,
# H - 145, ...)`. That is fine at 1268x415, which is what a maximised window on
# the author's screen gives. It is not fine at 1900x320, where H - 145 leaves a
# 175px plot under a 90px readout chip; and it is broken outright below H = 145,
# where the height goes NEGATIVE, mkPlot's Y() inverts, and the stage draws
# itself upside down off the top of the canvas without raising anything.
#
# Nothing was checking that. runall.ps1 and auditcustom.ps1 both run at one
# fixed window size, so every layout bug that needs a different aspect ratio to
# appear was invisible to the whole test suite.
#
# This sweeps a set of realistic canvas sizes — ultrawide, laptop, small window,
# tall and narrow — and for each one enters every stage and records:
#
#   DEGEN   an mkPlot or ctBox was built with a non-positive width or height
#   TEXT    a label was drawn outside the canvas, where nobody will ever see it
#   BLANK   the frame drew nothing at all
#   THREW   the frame raised
#
# TEXT is the one that matters most in practice, because it is completely
# silent: the string is drawn, the canvas discards it, and no other check in the
# suite can tell the difference between a label off the edge and no label.
#
# Saved with a UTF-8 BOM — PowerShell 5.1 reads a BOM-less .ps1 as ANSI.

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
  var log = [], rows = [];
  // Realistic canvas areas, not window sizes: this is what the stage is handed
  // after the rail, the dock and the header have taken their share.
  var SIZES = [
    [1268, 415, 'the size everything else is tested at'],
    [1600, 700, 'a large desktop'],
    [1100, 560, 'a laptop'],
    [ 900, 480, 'a small laptop'],
    [ 700, 420, 'a narrow window'],
    [ 520, 340, 'a very small window'],
    [1900, 320, 'ultrawide and short'],
    [ 620, 820, 'tall and narrow']
  ];
  var cv  = document.getElementById('cv') || document.querySelector('canvas');
  var ctx = cv.getContext('2d');
  try { document.getElementById('home').classList.remove('open'); } catch(e){}
  // stageFrame reconciles R against the canvas ELEMENT before it draws, which is
  // what stops a stage being rendered at the wrong scale when a resize is missed
  // (see 60a-stage-core.js). Here that would immediately undo the size being
  // injected below and every stage would be measured at the one real element
  // size, reporting the whole laboratory as broken. The element cannot be
  // resized for real — it is a grid area, and the sizes swept here include ones
  // no window would produce — so the reconciliation is neutralised for the sweep.
  R.resize = function(){};

  // --- instrument the two layout builders, so a degenerate box is caught where
  //     it is MADE rather than guessed at from the pixels it later produces ---
  var degen = [], W = 0, H = 0;
  var origMk = window.mkPlot, origBox = window.ctBox;
  window.mkPlot = function(px, py, pw, ph){
    if (!(pw > 0) || !(ph > 0) || px < -1 || py < -1 || px + pw > W + 1 || py + ph > H + 1)
      degen.push('mkPlot(' + [px,py,pw,ph].map(function(v){ return Math.round(v); }).join(',') + ')');
    return origMk.apply(null, arguments);
  };
  window.ctBox = function(w, h){
    var P = origBox.apply(null, arguments);
    if (!(P.pw > 0) || !(P.ph > 0)) degen.push('ctBox pw=' + Math.round(P.pw) + ' ph=' + Math.round(P.ph));
    return P;
  };
  // --- and the text calls, which are where an off-canvas draw is truly silent.
  //
  // ctText now pulls a stray label back inside the canvas, which is the right
  // behaviour for the reader and exactly the wrong behaviour for this script:
  // measuring the coordinate AFTER the clamp would report every stage clean and
  // hide the layout bug that made the clamp fire. So ctText is wrapped at the
  // helper, where the coordinate is still the one the stage asked for, and
  // ctx.fillText is wrapped as well to catch the callers that bypass it.
  var offtext = [], drew = 0;
  var origCt = window.ctText;
  window.ctText = function(c, x, y, s){
    if (!Number.isFinite(x) || !Number.isFinite(y)) offtext.push('non-finite "' + String(s).slice(0,24) + '"');
    else if (x < -4 || y < -4 || x > W + 4 || y > H + 4)
      offtext.push('"' + String(s).slice(0,26) + '" at ' + Math.round(x) + ',' + Math.round(y));
    return origCt.apply(null, arguments);
  };
  var origText = ctx.fillText.bind(ctx);
  ctx.fillText = function(s, x, y){
    drew++;
    if (!Number.isFinite(x) || !Number.isFinite(y)) offtext.push('raw non-finite "' + String(s).slice(0,24) + '"');
    else if (x < -4 || y < -4 || x > W + 4 || y > H + 4)
      offtext.push('raw "' + String(s).slice(0,26) + '" at ' + Math.round(x) + ',' + Math.round(y));
    return origText.apply(null, arguments);
  };
  var origStroke = ctx.stroke.bind(ctx), origFill = ctx.fill.bind(ctx), origFR = ctx.fillRect.bind(ctx);
  ctx.stroke = function(){ drew++; return origStroke.apply(null, arguments); };
  ctx.fill   = function(){ drew++; return origFill.apply(null, arguments); };
  ctx.fillRect = function(){ drew++; return origFR.apply(null, arguments); };

  var ids = Object.keys(STAGES);
  for (var s = 0; s < SIZES.length; s++) {
    W = SIZES[s][0]; H = SIZES[s][1];
    // drive the renderer directly rather than through CSS: what is under test is
    // the drawing code's response to W and H, not the stylesheet
    R.W = W; R.H = H; R.dpr = 1; cv.width = W; cv.height = H;
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i], before = window.__errs.length;
      degen = []; offtext = []; drew = 0;
      var threw = '';
      try {
        stageEnter(id);
        for (var f = 0; f < 3; f++) stageFrame(0.05);
      } catch (ex) { threw = (ex && ex.message ? ex.message : String(ex)).slice(0, 90); }
      var notes = [];
      if (threw) notes.push('THREW ' + threw);
      if (!drew) notes.push('BLANK');
      if (degen.length) notes.push('DEGEN ' + degen.slice(0,2).join(' ; ') + (degen.length>2 ? ' (+'+(degen.length-2)+')' : ''));
      if (offtext.length) notes.push('TEXT ' + offtext.slice(0,2).join(' ; ') + (offtext.length>2 ? ' (+'+(offtext.length-2)+')' : ''));
      var errs = window.__errs.slice(before);
      if (errs.length) notes.push('JS ' + errs.join(' ;; ').slice(0,90));
      if (notes.length) rows.push([W+'x'+H, id, notes.join(' | ')].join('\t'));
    }
  }
  var t = document.createElement('div');
  t.id = 'REPORT';
  t.textContent = '@@' + rows.join('\n') + '\n#sizes=' + SIZES.length + ' stages=' + ids.length +
                  ' findings=' + rows.length + (rows.length ? ' REVIEW' : ' OK') + '@@';
  document.body.appendChild(t);
}, 900);
</script></body></html>
'@

$out = Join-Path $dir 'apptest-size.html'
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
          --user-data-dir="$(Join-Path $dir 'cprof-size')" --dump-dom $url |
  Out-File (Join-Path $dir 'dom-size.txt') -Encoding utf8
$ErrorActionPreference = 'Stop'

$dom = Get-Content (Join-Path $dir 'dom-size.txt') -Raw -Encoding UTF8
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
  if ($f.Count -lt 3) { continue }
  $rows += [pscustomobject]@{ size = $f[0]; stage = $f[1]; note = $f[2] }
}
$rows | Export-Csv (Join-Path $dir 'audit-size.csv') -NoTypeInformation -Encoding UTF8

foreach ($k in @('THREW','BLANK','DEGEN','TEXT','JS')) {
  $n = ($rows | Where-Object { $_.note -like "*$k*" }).Count
  if ($n) { Write-Output ("  {0,-7} {1}" -f $k, $n) }
}
Write-Output ''
foreach ($g in ($rows | Group-Object stage | Sort-Object Count -Descending | Select-Object -First 40)) {
  Write-Output ("  {0,-20} {1,-2} sizes :: {2}" -f $g.Name, $g.Count, ($g.Group[0].note))
}
Write-Output ''
$tail2 = ($rep -split "`n") | Where-Object { $_.StartsWith('#') }
Write-Output $tail2
