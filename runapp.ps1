param([string]$Theme = 'dark', [string]$Demo = '', [string]$View = '', [string]$Tag = '', [string]$Wing = '', [string]$Dim = '', [switch]$ShowHome)
$ErrorActionPreference = 'Stop'
$dir  = $PSScriptRoot
$app  = Join-Path $dir 'vector-calculus.html'
$body = Get-Content $app -Raw -Encoding UTF8

# Wrap the artifact content the way the publisher does, and add an error trap
# plus a probe that reports whether the panels actually rendered.
$head = @'
<!doctype html><html data-theme="__THEME__"><head><meta charset="utf-8">
<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(e.message + ' @' + e.lineno + ':' + e.colno); });
window.addEventListener('unhandledrejection', function(e){ window.__errs.push('promise: ' + e.reason); });
</script>
<style>*{margin:0}</style>
</head><body>
'@
$tail = @'
<script>
setTimeout(function(){
  try {
    if ('__HOME__' !== '1') document.getElementById('home').classList.remove('open');
    if ('__WING__'.length) setWing('__WING__', true);
    if ('__DEMO__'.length) applyDemo('__DEMO__');
    if ('__VIEW__'.length) setView('__VIEW__');
    // headless Chrome fires requestAnimationFrame only a couple of times, so
    // animated stages would never paint. Drive the same frame path by hand.
    if (stageActive()) {
      if ('__DIM__' === '3d') {
        var dseg = document.getElementById('emDim');
        if (dseg) dseg.querySelector('[data-d="3d"]').click();
      }
      for (var sf = 0; sf < 40; sf++) stageFrame(0.05);
      refreshStageReadout(); updateStageChip(); updateStageLegend();
    }
  } catch (e) { window.__errs.push('setup: ' + (e && e.stack ? e.stack : e)); }
}, 600);
// A canvas resize clears what was painted, and headless Chrome fires almost no
// animation frames, so a stage can be blank at capture time through no fault of
// its own. Keep repainting instead.
//
// The screenshot is a SEPARATE Chrome run from the DOM dump, and nothing in it
// tells Chrome when the picture is ready: the capture happens when the virtual
// time budget runs out, wherever that lands. An 80ms timer left an 80ms window
// in which the last thing to touch the canvas could have been a resize — which
// clears it — and mvPartial in particular came out blank perhaps half the time,
// which reads exactly like a stage that does not draw. Repaint on both a short
// timer and every animation frame, so whenever the capture lands, a complete
// stage paint is the most recent thing that happened to the canvas.
setInterval(function(){
  try { if (stageActive()) stageFrame(0.05); } catch (e) {}
}, 16);
(function raf(){
  try { if (stageActive()) stageFrame(0.016); } catch (e) {}
  requestAnimationFrame(raf);
})();
setTimeout(function(){
  try { if (stageActive()) { for (var lf = 0; lf < 4; lf++) stageFrame(0.05); } } catch (e) { window.__errs.push('repaint: ' + e); }
  var ids = ['chip','legend','probeReadout','derivBody','fluxReadout','circReadout','jacTable','theoryProse','dispBody','ddReadout','ddSweep'];
  var rep = [];
  for (var i=0;i<ids.length;i++){
    var el = document.getElementById(ids[i]);
    rep.push(ids[i] + '=' + (el ? String(el.textContent.replace(/\s+/g,' ').length) : 'MISSING'));
  }
  var cv = document.getElementById('cv');
  rep.push('canvas=' + (cv ? cv.width + 'x' + cv.height : 'MISSING'));
  rep.push('perf=' + (document.getElementById('perf')||{textContent:'?'}).textContent);
  var t = document.createElement('div');
  t.id = 'REPORT';
  t.textContent = '@@' + (window.__errs.length ? 'ERRORS: ' + window.__errs.join(' ;; ') : 'no-errors') + ' || ' + rep.join(' | ') + '@@';
  document.body.appendChild(t);
}, 2200);
</script>
</body></html>
'@

if ($Tag -eq '') { $Tag = $Theme }
$page = $head.Replace('__THEME__', $Theme) + $body + $tail.Replace('__DEMO__', $Demo).Replace('__VIEW__', $View).Replace('__WING__', $Wing).Replace('__HOME__', $(if($ShowHome){'1'}else{'0'})).Replace('__DIM__', $Dim)
$out  = Join-Path $dir "apptest-$Tag.html"
Set-Content -Path $out -Value $page -Encoding utf8

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
# 'cprof-app', NOT 'cprof'. This shared runall.ps1's profile, and two Chrome
# instances sharing a --user-data-dir silently produce an EMPTY dump rather than
# an error. runall takes ~18 minutes and is meant to be backgrounded, so the
# natural move -- grab a screenshot while it runs -- was exactly the collision,
# and it failed quietly. Every harness script now has its own profile.
$prof   = Join-Path $dir 'cprof-app'
$url    = 'file:///' + ($out -replace '\\','/')

& $chrome --headless --disable-gpu --no-sandbox --window-size=1680,1000 --virtual-time-budget=9000 `
          --user-data-dir="$prof" --dump-dom $url | Out-File (Join-Path $dir "dom-$Tag.txt") -Encoding utf8

$dom = Get-Content (Join-Path $dir "dom-$Tag.txt") -Raw -Encoding UTF8
$marker = 'id="REPORT">'
$a = $dom.IndexOf($marker)
if ($a -ge 0) {
  $a += $marker.Length
  $b = $dom.IndexOf('</div>', $a)
  Write-Output ("[" + $Tag + "] " + $dom.Substring($a, $b - $a).Replace('@@',''))
} else {
  Write-Output "[$Tag] NO REPORT - the page never reached the probe script."
  Write-Output $dom.Substring(0,[Math]::Min(1200,$dom.Length))
}

# --run-all-compositor-stages-before-draw is what makes a headless screenshot
# deterministic: without it the capture can be taken before the frame that was
# just painted has been composited, which is the other half of the blank-canvas
# problem the repaint loop above addresses.
$shot = Join-Path $dir "shot-$Tag.png"
& $chrome --headless --disable-gpu --no-sandbox --window-size=1680,1000 --virtual-time-budget=9000 `
          --run-all-compositor-stages-before-draw --hide-scrollbars `
          --user-data-dir="$prof" --screenshot="$shot" $url | Out-Null
if (Test-Path $shot) { Write-Output "screenshot: $shot" }


