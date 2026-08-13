# auditartifact.ps1 -- does the app survive being published as a Claude artifact?
#
# WHY THIS EXISTS. Publishing wraps the file it is given in the host's own
# <!doctype html><html><head></head><body> skeleton, so the whole document ends
# up nested inside another one's body. MASTER-PLAN 3.9 named two risks and said
# explicitly: do not guess at either, build the variant and test it.
#
#   1. data-theme OWNERSHIP. The palette hangs off :root[data-theme="light"|
#      "dark"] (styles.css:39,49), the in-app toggle writes
#      document.documentElement.dataset.theme (82-ui-wings.js:297), and a
#      MutationObserver on that attribute re-themes the canvas (90-boot.js:261).
#      The HOST also stamps that attribute for the viewer's theme -- same
#      attribute, same two values. It may simply work; the failure mode is "the
#      theme button does not stick", which no other script looks at.
#
#      The viewer's theme has THREE states, and the third is the dangerous one:
#      an explicit choice stamps data-theme, but the default "system" setting
#      stamps NOTHING and leaves only prefers-color-scheme. A palette defined
#      only inside [data-theme] blocks would have no values at all in that
#      state. All three are tested here.
#
#   2. html,body{height:100%} and .app{height:100dvh} (styles.css:64,87) -- a
#      full-screen application layout placed inside a host container.
#
# WHAT MAKES IT A REAL CHECK. The theme is read back TWO independent ways: the
# CSS custom property --bg off the root, and TH.bg, which is what the canvas
# renderer actually paints with (it re-reads the tokens in readTheme()). A
# toggle that changed the CSS but not the canvas would leave every picture in
# the laboratory painted for the wrong theme, and comparing the two is the only
# thing that can see it.
#
# Written ASCII-only so it does not depend on the .ps1 being read as UTF-8.

$ErrorActionPreference = 'Stop'
$dir  = $PSScriptRoot
$body = Get-Content (Join-Path $dir 'vector-calculus.html') -Raw -Encoding UTF8

# The three viewer-theme states the host can produce.
$states = @(
  @{ name = 'system(no attribute)'; attr = '';                    want = '' },
  @{ name = 'dark';                 attr = ' data-theme="dark"';  want = 'dark' },
  @{ name = 'light';                attr = ' data-theme="light"'; want = 'light' }
)

$probe = @'
<script>
setTimeout(function(){
  var out = [];
  function say(k, v){ out.push(k + '=' + v); }
  try {
    try { document.getElementById('home').classList.remove('open'); } catch(e){}
    var root = document.documentElement;
    var cs   = function(){ return getComputedStyle(root).getPropertyValue('--bg').trim(); };
    var thbg = function(){ return (typeof TH !== 'undefined' && TH.bg) ? TH.bg.join(',') : 'NONE'; };

    // ---- did it boot at all, nested inside another document? ----
    say('wings',    (typeof WINGS !== 'undefined') ? Object.keys(WINGS).length : -1);
    say('stages',   (typeof STAGES !== 'undefined') ? Object.keys(STAGES).length : -1);
    say('navbtns',  document.querySelectorAll('#wingNav button[data-w]').length);

    // ---- 2. layout: a full-screen app inside a host container ----
    var app = document.querySelector('.app');
    var r   = app ? app.getBoundingClientRect() : {width:0,height:0};
    say('appW', Math.round(r.width));
    say('appH', Math.round(r.height));
    say('viewW', window.innerWidth);
    say('viewH', window.innerHeight);
    // the page must not scroll sideways: that is the failure this catches
    say('docScrollW', document.documentElement.scrollWidth);
    say('docClientW', document.documentElement.clientWidth);
    var cv = document.getElementById('cv');
    say('canvasW', cv ? Math.round(cv.getBoundingClientRect().width) : 0);
    say('canvasH', cv ? Math.round(cv.getBoundingClientRect().height) : 0);

    // ---- 1. the palette, in whatever state the host left the attribute ----
    say('attrBefore', root.getAttribute('data-theme') || 'NONE');
    say('bgBefore',   cs());
    say('thBefore',   thbg());

    // ---- and the toggle: does the button stick, and does the CANVAS follow? ----
    //
    // ASYNCHRONOUSLY. The canvas is re-themed by a MutationObserver on
    // data-theme (90-boot.js:261), and observer callbacks are delivered as
    // MICROTASKS after the current script finishes -- so reading TH.bg on the
    // line after btn.click() reads the value from before the click, every
    // time, and reports a working toggle as broken. The first version of this
    // check did exactly that and failed all three states.
    var btn = document.getElementById('btnTheme');
    say('btnPresent', btn ? 1 : 0);
    if (!btn) { return finish(); }

    btn.click();
    setTimeout(function(){
      say('attrAfter1', root.getAttribute('data-theme') || 'NONE');
      say('bgAfter1',   cs());
      say('thAfter1',   thbg());
      btn.click();                       // and back again
      setTimeout(function(){
        say('attrAfter2', root.getAttribute('data-theme') || 'NONE');
        say('bgAfter2',   cs());
        say('thAfter2',   thbg());
        finish();
      }, 120);
    }, 120);
    return;
  } catch (ex) {
    say('THREW', String(ex && ex.message || ex).slice(0, 120));
  }
  finish();

  function finish(){
    say('errs', window.__errs.length);
    if (window.__errs.length) say('firstErr', String(window.__errs[0]).slice(0, 90));
    var t = document.createElement('div');
    t.id = 'REPORT';
    t.textContent = out.join('\n');
    document.body.appendChild(t);
  }
}, 1200);
</script></body></html>
'@

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$bad = 0
$results = @()

foreach ($s in $states) {
  $head = "<!doctype html><html$($s.attr)><head><meta charset=`"utf-8`">" +
          "<script>window.__errs=[];window.addEventListener('error',function(e){window.__errs.push(e.message);});</script>" +
          "</head><body>"

  $out = Join-Path $dir 'apptest-artifact.html'
  Set-Content -Path $out -Value ($head + $body + $probe) -Encoding utf8
  $url = 'file:///' + ($out -replace '\\','/')

  & $chrome --headless --disable-gpu --no-sandbox --window-size=1680,1000 --virtual-time-budget=600000 `
            --user-data-dir="$(Join-Path $dir 'cprof-artifact')" --dump-dom $url |
    Out-File (Join-Path $dir 'dom-artifact.txt') -Encoding utf8

  $dom = Get-Content (Join-Path $dir 'dom-artifact.txt') -Raw -Encoding UTF8
  $marker = 'id="REPORT">'
  $a = $dom.IndexOf($marker)
  if ($a -lt 0) {
    Write-Output "  [$($s.name)] NO REPORT -- the page never reached the probe."
    $bad++; continue
  }
  $a += $marker.Length
  $b = $dom.IndexOf('</div>', $a)
  $rep = $dom.Substring($a, $b - $a).Replace('&lt;','<').Replace('&gt;','>').Replace('&amp;','&')

  $kv = @{}
  foreach ($line in ($rep -split "`n")) {
    $line = $line.Trim()
    if (-not $line) { continue }
    $i = $line.IndexOf('=')
    if ($i -gt 0) { $kv[$line.Substring(0,$i)] = $line.Substring($i+1) }
  }

  Write-Output ''
  Write-Output "  --- viewer theme: $($s.name) ---"
  Write-Output ("    booted: wings={0} stages={1} navbtns={2} errs={3}" -f $kv['wings'], $kv['stages'], $kv['navbtns'], $kv['errs'])
  Write-Output ("    layout: app {0}x{1} in viewport {2}x{3}, canvas {4}x{5}" -f
                 $kv['appW'], $kv['appH'], $kv['viewW'], $kv['viewH'], $kv['canvasW'], $kv['canvasH'])
  Write-Output ("    theme : attr={0} --bg={1} canvas TH.bg={2}" -f $kv['attrBefore'], $kv['bgBefore'], $kv['thBefore'])
  Write-Output ("    toggle: {0} -> {1} -> {2}" -f $kv['attrBefore'], $kv['attrAfter1'], $kv['attrAfter2'])
  Write-Output ("            --bg {0} -> {1} -> {2}" -f $kv['bgBefore'], $kv['bgAfter1'], $kv['bgAfter2'])

  # ---- the assertions ----
  $fail = @()
  if ([int]$kv['wings']   -lt 40)  { $fail += 'did not boot (wings)' }
  if ([int]$kv['stages']  -lt 178) { $fail += 'did not boot (stages)' }
  if ([int]$kv['navbtns'] -lt 40)  { $fail += 'nav did not build' }
  if ([int]$kv['errs']    -ne 0)   { $fail += "js errors: $($kv['firstErr'])" }
  if ([int]$kv['canvasW'] -lt 200 -or [int]$kv['canvasH'] -lt 150) { $fail += 'canvas collapsed' }
  # a full-screen layout must fill the viewport height, not overflow it
  $dh = [Math]::Abs([int]$kv['appH'] - [int]$kv['viewH'])
  if ($dh -gt 2) { $fail += "app height $($kv['appH']) != viewport $($kv['viewH'])" }
  # and the document must not scroll sideways
  if ([int]$kv['docScrollW'] -gt [int]$kv['docClientW']) { $fail += 'document scrolls horizontally' }
  # the palette must exist in EVERY state, including "system"
  if (-not $kv['bgBefore']) { $fail += 'no --bg: the palette has no value in this state' }
  # the toggle must move the attribute, the CSS AND the canvas
  if ($kv['attrAfter1'] -eq $kv['attrBefore']) { $fail += 'toggle did not change data-theme' }
  if ($kv['bgAfter1']   -eq $kv['bgBefore'])   { $fail += 'toggle did not change --bg' }
  if ($kv['thAfter1']   -eq $kv['thBefore'])   { $fail += 'toggle did not re-theme the CANVAS' }
  if ($kv['bgAfter2']   -ne $kv['bgAfter1']) { } else { $fail += 'second toggle did nothing' }

  if ($fail.Count) {
    $bad += $fail.Count
    foreach ($f in $fail) { Write-Output "    FAIL: $f" }
  } else {
    Write-Output '    OK'
  }
  $results += [pscustomobject]@{ state = $s.name; fails = $fail.Count }
}

Write-Output ''
Write-Output ("states=$($states.Count)  bad=$bad")
if ($bad -gt 0) { Write-Output 'auditartifact FAILED'; exit 1 }
Write-Output 'auditartifact OK -- the standalone build is publishable as-is'
