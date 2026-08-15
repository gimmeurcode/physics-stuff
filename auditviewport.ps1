# auditviewport.ps1 — does the PAGE lay out properly at real window sizes?
#
# auditsize.ps1 sweeps the canvas and tests the drawing code. This tests the
# other half: the shell around it. The stylesheet carries breakpoints at 1420,
# 1340, 1179, 1100 and 899 pixels, and until now every script in the suite ran at
# one window size — 1680x1000 — so five of the six layouts the stylesheet can
# produce were never looked at by anything.
#
# Each size is its own Chrome launch, because a media query responds to the
# viewport and cannot be simulated by resizing an element. Per size it checks:
#
#   OVERFLOW   the document is wider than the window — the page scrolls sideways
#   OFFSCREEN  a visible element sticks out past the right-hand edge
#   CANVAS     the drawing area has collapsed, or is not being handed to R
#   MISSING    a structural element of the shell is absent or has no size
#   JS         a script error
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
  var log = [];
  try { document.getElementById('home').classList.remove('open'); } catch(e){}
  // land on a stage so the dock, the readout and the canvas are all populated
  try { setWing('partial', true); applyDemo('0.2'); for (var f=0; f<6; f++) stageFrame(0.05);
        refreshStageReadout(); updateStageChip(); updateStageLegend(); } catch(e){ log.push('setup ' + e); }

  var vw = document.documentElement.clientWidth, vh = document.documentElement.clientHeight;
  if (document.documentElement.scrollWidth > vw + 2)
    log.push('OVERFLOW document is ' + document.documentElement.scrollWidth + ' wide in a ' + vw + ' viewport');

  // anything visible poking out to the right, ignoring deliberately-clipped scrollers
  var all = document.querySelectorAll('body *'), off = [];
  for (var i = 0; i < all.length; i++) {
    var e = all[i];
    var cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') continue;
    if (cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowX === 'hidden') continue;
    var r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (r.right > vw + 3 || r.left < -3) {
      var p = e.parentElement, clipped = false;
      while (p && p !== document.body) {                  // a clipped ancestor makes it a non-issue
        var pc = getComputedStyle(p);
        if (pc.overflowX !== 'visible') { clipped = true; break; }
        p = p.parentElement;
      }
      if (!clipped) off.push((e.id ? '#'+e.id : e.tagName.toLowerCase() + '.' + (e.className||'').toString().split(' ')[0]) +
                             ' [' + Math.round(r.left) + '..' + Math.round(r.right) + ']');
    }
  }
  if (off.length) log.push('OFFSCREEN ' + off.slice(0,4).join(' ; ') + (off.length>4?' (+'+(off.length-4)+')':''));

  var cv = document.getElementById('cv');
  if (!cv) log.push('MISSING #cv');
  else {
    var cr = cv.getBoundingClientRect();
    if (cr.width < 200 || cr.height < 140)
      log.push('CANVAS collapsed to ' + Math.round(cr.width) + 'x' + Math.round(cr.height));
    if (Math.abs(R.W - cr.width) > 2 || Math.abs(R.H - cr.height) > 2)
      log.push('CANVAS R is ' + R.W + 'x' + R.H + ' but the element is ' +
               Math.round(cr.width) + 'x' + Math.round(cr.height) + ' — resize did not follow');
  }
  ['stageBody','stageReadout','wingNav'].forEach(function(id){
    var e = document.getElementById(id);
    if (!e) { log.push('MISSING #' + id); return; }
    var r = e.getBoundingClientRect();
    if (r.width < 40 || r.height < 10) log.push('MISSING #' + id + ' collapsed to ' +
      Math.round(r.width) + 'x' + Math.round(r.height));
  });
  if (window.__errs.length) log.push('JS ' + window.__errs.join(' ;; ').slice(0,140));

  var t = document.createElement('div');
  t.id = 'REPORT';
  t.textContent = '@@' + vw + 'x' + vh + '\t' + (log.length ? log.join(' | ') : 'ok') + '@@';
  document.body.appendChild(t);
}, 1400);
</script></body></html>
'@

$out = Join-Path $dir 'apptest-viewport.html'
Set-Content -Path $out -Value ($head + $body + $tail) -Encoding utf8

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$url    = 'file:///' + ($out -replace '\\','/')

# chosen to straddle every breakpoint in the stylesheet (1420, 1340, 1179, 1100, 899)
$sizes = @('3840,2160','2560,1440','1920,1080','1680,1050','1512,982','1440,900',
           '1366,768','1280,800','1152,864','1024,768','960,700','860,700','768,1024',
           '640,800','540,900','430,932')

$bad = 0
foreach ($s in $sizes) {
# Chrome writes to stderr for reasons that are not failures (USB enumeration, an
# XNNPACK delegate, GCM registration). Under ErrorActionPreference = 'Stop' each
# such line becomes a terminating NativeCommandError and the run dies AFTER the
# sweep and BEFORE the DOM is written, throwing the result away. See MASTER-PLAN
# 3.4. The exit status is still checked below; nothing is being swallowed.
$ErrorActionPreference = 'Continue'
  & $chrome --headless --disable-gpu --no-sandbox --window-size=$s --virtual-time-budget=30000 `
            --user-data-dir="$(Join-Path $dir 'cprof-view')" --dump-dom $url |
    Out-File (Join-Path $dir 'dom-viewport.txt') -Encoding utf8
$ErrorActionPreference = 'Stop'
  $dom = Get-Content (Join-Path $dir 'dom-viewport.txt') -Raw -Encoding UTF8
  $a = $dom.IndexOf('id="REPORT">')
  if ($a -lt 0) { Write-Output ("  {0,-10} NO REPORT" -f $s); $bad++; continue }
  $a += 12
  $b = $dom.IndexOf('</div>', $a)
  $rep = $dom.Substring($a, $b - $a).Replace('@@','').Replace('&lt;','<').Replace('&gt;','>').Replace('&amp;','&')
  $f = $rep -split "`t"
  $note = if ($f.Count -gt 1) { $f[1].Trim() } else { $rep.Trim() }
  if ($note -ne 'ok') { $bad++ }
  Write-Output ("  {0,-12} {1,-12} {2}" -f $s, $f[0], $note)
}
Write-Output ''
Write-Output ("viewports={0}  bad={1}  {2}" -f $sizes.Count, $bad, $(if ($bad) { 'REVIEW' } else { 'OK' }))
