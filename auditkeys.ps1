# auditkeys.ps1 — does the canvas keyboard layer actually act?
#
# The canvas advertises a keyboard contract in its aria-label: arrows move the
# probe or a visible cursor, Enter clicks it, +/− zooms, Ctrl+arrows orbit.
# Nothing else exercises a KeyboardEvent on the canvas — every other gate
# drives controls or the pointer — so a regression here is invisible to all of
# them and to a sighted tester with a mouse. This dispatches the real events
# and asserts the state they promise to change actually changed.
#
# Saved with a UTF-8 BOM — PowerShell 5.1 reads a BOM-less .ps1 as ANSI.
$ErrorActionPreference = 'Stop'
$dir  = $PSScriptRoot
$body = Get-Content (Join-Path $dir 'vector-calculus.html') -Raw -Encoding UTF8

$head = @'
<!doctype html><html data-theme="dark"><head><meta charset="utf-8">
<script>window.__errs=[];window.addEventListener('error',function(e){window.__errs.push(e.message+' @'+e.lineno);});</script>
</head><body>
'@
$tail = @'
<script>
setTimeout(function(){
  var bad = 0, log = [];
  var chk = function(name, ok){ log.push((ok?'ok   ':'BAD  ') + name); if(!ok) bad++; };
  var key = function(k, opts){
    document.getElementById('cv').dispatchEvent(
      new KeyboardEvent('keydown', Object.assign({key:k, bubbles:true, cancelable:true}, opts||{})));
  };
  try {
    document.getElementById('home').classList.remove('open');
    var cv = document.getElementById('cv');
    chk('canvas is focusable (tabindex 0)', cv.tabIndex === 0);

    var x0 = S.probe.x; key('ArrowRight');
    chk('ArrowRight moves the probe by extent/24', Math.abs(S.probe.x - x0 - S.extent/24) < 1e-9);
    var y0 = S.probe.y; key('ArrowUp', {shiftKey:true});
    chk('Shift+ArrowUp moves it by extent/6', Math.abs(S.probe.y - y0 - S.extent/6) < 1e-9);

    var az0 = R.cam.az; key('ArrowLeft', {ctrlKey:true});
    chk('Ctrl+ArrowLeft orbits', R.cam.az !== az0);
    var d0 = R.cam.dist; key('+');
    chk('+ dollies the camera in', R.cam.dist < d0);
    key('-');
    chk('- dollies it back out', Math.abs(R.cam.dist - d0) < 1e-9);

    stageEnter('gaVec'); for (var f = 0; f < 4; f++) stageFrame(0.05);
    key('ArrowRight'); key('ArrowDown');
    var kc = document.querySelector('.kb-cursor');
    chk('arrows on a stage raise the visible cursor', !!(kc && kc.style.display === 'block'));
    key('Enter');
    chk('Enter clicks without error', window.__errs.length === 0);

    stageExit(); stageEnter('emSandbox'); for (f = 0; f < 4; f++) stageFrame(0.05);
    key('ArrowLeft'); key('Enter');
    chk('Enter on a drag stage sends down+up without error', window.__errs.length === 0);
  } catch (ex) { log.push('THREW ' + ex); bad++; }
  if (window.__errs.length) { log.push('JS ' + window.__errs.join(';')); bad++; }
  var t = document.createElement('div'); t.id = 'REPORT';
  t.textContent = '@@' + log.join('\n') + '\nbad=' + bad + '@@';
  document.body.appendChild(t);
}, 900);
</script></body></html>
'@

$out = Join-Path $dir 'apptest-keys.html'
Set-Content -Path $out -Value ($head + $body + $tail) -Encoding utf8
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$url    = 'file:///' + ($out -replace '\\','/')

# Chrome writes to stderr for reasons that are not failures (USB enumeration, an
# XNNPACK delegate, GCM registration). Under ErrorActionPreference = 'Stop' each
# such line becomes a terminating NativeCommandError and the run dies AFTER the
# sweep and BEFORE the DOM is written, throwing the result away. See MASTER-PLAN
# 3.4. The exit status is still checked below; nothing is being swallowed.
$ErrorActionPreference = 'Continue'
& $chrome --headless --disable-gpu --no-sandbox --window-size=1280,900 --virtual-time-budget=9000 `
          --user-data-dir="$(Join-Path $dir 'cprof-keys')" --dump-dom $url |
  Out-File (Join-Path $dir 'dom-keys.txt') -Encoding utf8
$ErrorActionPreference = 'Stop'

$dom = Get-Content (Join-Path $dir 'dom-keys.txt') -Raw -Encoding UTF8
$a = $dom.IndexOf('id="REPORT">@@')
if ($a -lt 0) { Write-Output 'auditkeys: NO REPORT — the page never reached the probe script'; exit 1 }
$a += 14
$b = $dom.IndexOf('@@', $a)
$rep = $dom.Substring($a, $b - $a)
Write-Output $rep
if ($rep -match 'bad=0') { Write-Output 'auditkeys OK' } else { Write-Output 'auditkeys REVIEW'; exit 1 }
