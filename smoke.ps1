# Fast sanity check on the built app: does it parse and boot at all?
#
# A single stray character can take the whole bundle down — all 230 modules share
# one script scope, so one syntax error means nothing runs. runall.ps1 catches
# that, but it takes twenty minutes. This takes about ten seconds, and it is
# meant to be the thing you run after every build, before anything longer.
#
# It checks three things:
#   1. the script parses and the boot code ran (the wing registry exists)
#   2. no uncaught error reached the console
#   3. every wing in the registry has a nav button, and vice versa
#
# Exit code 0 means "worth running the real suites on". It is not a substitute
# for runtests.ps1 or runall.ps1.
$ErrorActionPreference = 'Stop'
$dir = $PSScriptRoot
$enc = New-Object System.Text.UTF8Encoding($false)

$app = Join-Path $dir 'vector-calculus.html'
if (-not (Test-Path $app)) { Write-Output 'no vector-calculus.html - run ./build.ps1 first'; exit 1 }

$html = [System.IO.File]::ReadAllText($app, $enc)

# The probe runs after boot and writes its verdict where --dump-dom will show it.
$probe = @'
<script>
window.addEventListener('error', function(e){
  var d = document.createElement('div');
  d.id = 'smokeErr';
  d.textContent = ['SMOKE','ERR'].join('-') + ' ' + e.message + ' @line ' + e.lineno;
  document.body.appendChild(d);
});
setTimeout(function(){
  var out = [];
  try {
    if (typeof WINGS === 'undefined') { out.push('WINGS is not defined - the script did not finish'); }
    else {
      var keys = Object.keys(WINGS);
      out.push('wings=' + keys.length);
      var navd = {}, missingBtn = [], orphanBtn = [];
      document.querySelectorAll('#wingNav button[data-w]').forEach(function(b){ navd[b.dataset.w] = 1; });
      keys.forEach(function(k){ if (!navd[k]) missingBtn.push(k); });
      Object.keys(navd).forEach(function(k){ if (k !== 'home' && !WINGS[k]) orphanBtn.push(k); });
      out.push('navbuttons=' + Object.keys(navd).length);
      if (missingBtn.length) out.push('WING-WITHOUT-BUTTON ' + missingBtn.join(','));
      if (orphanBtn.length)  out.push('BUTTON-WITHOUT-WING ' + orphanBtn.join(','));
      // The top bar, the home page and NAV_GROUP_OF are three separate lists of
      // the same forty wings, and they drifted: the home page was still showing
      // thirty-one cards, nine wings had no card at all, and Differential
      // Equations had two. Nothing reported it, because each list is valid on
      // its own. These three must agree on membership AND on order, because the
      // order is the curriculum — a wing is placed where its prerequisites are
      // already behind it, and a card in the wrong section says otherwise.
      var navOrder = [], cardOrder = [], groupBad = [];
      document.querySelectorAll('#wingNav button[data-w]').forEach(function(b){
        if (b.dataset.w === 'home') return;
        navOrder.push(b.dataset.w);
        var grp = b.closest('.navgroup');
        var want = (typeof NAV_GROUP_OF !== 'undefined') ? NAV_GROUP_OF[b.dataset.w] : null;
        if (grp && want && grp.dataset.g !== want)
          groupBad.push(b.dataset.w + ' is in menu ' + grp.dataset.g + ' but NAV_GROUP_OF says ' + want);
      });
      document.querySelectorAll('#home button.home-card[data-w]').forEach(function(b){ cardOrder.push(b.dataset.w); });
      out.push('homecards=' + cardOrder.length);
      if (groupBad.length) out.push('NAV-GROUP-MISMATCH ' + groupBad.join('; '));
      var seenCard = {}, dupCard = [];
      cardOrder.forEach(function(k){ if (seenCard[k]) dupCard.push(k); seenCard[k] = 1; });
      if (dupCard.length) out.push('HOME-CARD-DUPLICATED ' + dupCard.join(','));
      var noCard = navOrder.filter(function(k){ return !seenCard[k]; });
      if (noCard.length) out.push('WING-WITHOUT-HOME-CARD ' + noCard.join(','));
      var noWing = cardOrder.filter(function(k){ return !WINGS[k]; });
      if (noWing.length) out.push('HOME-CARD-WITHOUT-WING ' + noWing.join(','));
      if (!dupCard.length && !noCard.length && !noWing.length) {
        var orderBad = [];
        for (var oi = 0; oi < navOrder.length; oi++)
          if (navOrder[oi] !== cardOrder[oi])
            orderBad.push('#' + oi + ' topbar=' + navOrder[oi] + ' home=' + cardOrder[oi]);
        if (orderBad.length) out.push('HOME-ORDER-DIFFERS-FROM-TOPBAR ' + orderBad.join('; '));
      }
      // every wing must name demo groups that actually exist and hold items
      var emptyGroups = [];
      keys.forEach(function(k){
        var g = WINGS[k].groups;
        if (!g || !g.length) { emptyGroups.push(k); return; }
        var n = 0;
        g.forEach(function(grp){ n += (grp && grp.items ? grp.items.length : 0); });
        if (!n) emptyGroups.push(k);
      });
      if (emptyGroups.length) out.push('WING-WITH-NO-DEMOS ' + emptyGroups.join(','));
      // every demo naming a stage must name one that exists
      var badStage = [];
      keys.forEach(function(k){
        (WINGS[k].groups || []).forEach(function(grp){
          (grp.items || []).forEach(function(it){
            if (it.stage && !STAGES[it.stage]) badStage.push(k + '/' + it.stage);
          });
        });
      });
      if (badStage.length) out.push('DEMO-NAMES-MISSING-STAGE ' + badStage.join(','));
      out.push('stages=' + Object.keys(STAGES).length);
      // Every stage carries the full set. A missing legend or chip is not an
      // error at load — it is a stage that quietly renders without a key, or a
      // dock that stays empty, and only shows up when someone opens that one
      // experiment. The audit that found eleven missing legends was a one-liner;
      // this is that one-liner, run on every build.
      var missing = [];
      Object.keys(STAGES).forEach(function(k){
        ['enter','controls','wire','frame','readout','chip','legend','derive'].forEach(function(m){
          if (typeof STAGES[k][m] !== 'function') missing.push(k + '.' + m);
        });
      });
      if (missing.length) out.push('STAGE-MISSING-METHOD ' + missing.join(','));
      // Every "See it in the laboratory" button must land on an experiment that
      // exists. The targets are positions in a demo list -- `em:1.4` -- and
      // inserting a demo into the middle of a group silently renumbers every
      // link below it. Three of them had been pointing at nothing for some time
      // (Cramer's rule, Fubini, Tellegen) and two more at the wrong experiment,
      // because a wrong-but-valid index is indistinguishable from a right one
      // and nothing was checking. This walks every wing's essay and resolves
      // each target the way the button does.
      var seeBad = [], seeN = 0, prose = document.getElementById('theoryProse');
      if (prose && typeof openTheory === 'function') {
        var here = WING;
        keys.forEach(function(k){
          try { setWing(k, true); openTheory(); } catch (e) { seeBad.push(k + '/THREW'); return; }
          prose.querySelectorAll('.st-go[data-see]').forEach(function(b){
            var t = String(b.dataset.see || ''), c = t.indexOf(':');
            if (c < 0) { seeBad.push(t + '/malformed'); return; }
            seeN++;
            var wing = t.slice(0, c), key = t.slice(c + 1);
            if (!WINGS[wing]) { seeBad.push(t + '/no-such-wing'); return; }
            var groups = WINGS[wing].groups || [];
            if (/^\d+\.\d+$/.test(key)) {
              var gi = Number(key.split('.')[0]), ii = Number(key.split('.')[1]);
              var grp = groups[gi];
              if (!grp || !grp.items || !grp.items[ii]) seeBad.push(t + '/no-such-demo');
            } else {
              var hit = 0;
              groups.forEach(function(g2){ (g2.items || []).forEach(function(it){ if (it.stage === key) hit++; }); });
              if (!hit) seeBad.push(t + '/no-demo-uses-that-stage');
            }
          });
        });
        try { document.getElementById('sheet').classList.remove('open'); setWing(here, true); } catch (e) {}
      }
      out.push('seelinks=' + seeN);
      if (seeBad.length) out.push('SEE-LINK-BROKEN ' + seeBad.join(','));
    }
  } catch (err) { out.push(['SMOKE','THREW'].join('-') + ' ' + err.message); }
  var d = document.createElement('div');
  d.id = 'smokeOut';
  d.textContent = ['SMOKE','GO'].join('-') + ' ' + out.join(' | ') + ' ' + ['SMOKE','STOP'].join('-');
  document.body.appendChild(d);
}, 900);
</script>
'@

# build.ps1 emits head + style + shell + script and never closes <body>, so
# there is no </body> to inject before — append instead.
if ($html -match '(?i)</body>') { $probed = $html -replace '(?i)</body>', ($probe + '</body>') }
else                            { $probed = $html + "`r`n" + $probe }
$tmp = Join-Path $dir 'smoke.tmp.html'
[System.IO.File]::WriteAllText($tmp, $probed, $enc)

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $chrome)) { $chrome = 'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe' }
# Its own profile: runtests uses ./cprof-tests and runall ./cprof, and two Chrome
# instances sharing a user-data-dir silently produce an EMPTY dump, not an error.
$prof = Join-Path $dir 'cprof-smoke'
$url  = 'file:///' + ($tmp -replace '\\','/')

# No 2>&1 and no 2>$null: in PowerShell 5.1 redirecting a native command's stderr
# wraps each line as an ErrorRecord and reports failure on success.
& $chrome --headless --disable-gpu --no-sandbox --virtual-time-budget=8000 `
          --user-data-dir="$prof" --dump-dom $url |
  Out-File -FilePath (Join-Path $dir 'smokedom.txt') -Encoding utf8

$dom = Get-Content (Join-Path $dir 'smokedom.txt') -Raw
Remove-Item $tmp -Force -ErrorAction SilentlyContinue

if (-not $dom) {
  Write-Output 'smoke FAILED: empty dump (is another Chrome using this profile?)'
  exit 1
}

$bad = 0
if ($dom -match 'SMOKE-ERR ([^<]*)') {
  Write-Output ('smoke FAILED: uncaught error - ' + $Matches[1])
  $bad = 1
}
if ($dom -match 'SMOKE-GO (.*?) SMOKE-STOP') {
  $verdict = $Matches[1]
  Write-Output ('smoke: ' + $verdict)
  foreach ($flag in @('WING-WITHOUT-BUTTON','BUTTON-WITHOUT-WING','WING-WITH-NO-DEMOS',
                      'DEMO-NAMES-MISSING-STAGE','STAGE-MISSING-METHOD','SEE-LINK-BROKEN',
                      'NAV-GROUP-MISMATCH','HOME-CARD-DUPLICATED','WING-WITHOUT-HOME-CARD',
                      'HOME-CARD-WITHOUT-WING','HOME-ORDER-DIFFERS-FROM-TOPBAR',
                      'SMOKE-THREW','is not defined')) {
    if ($verdict -match [regex]::Escape($flag)) { $bad = 1 }
  }
} else {
  Write-Output 'smoke FAILED: the probe never ran - the script almost certainly did not parse'
  $bad = 1
}

# ---- a static check, because this one fails SILENTLY -------------------------
# ctText's signature is (ctx, x, y, text, colour, font). Calling it with the text
# first draws nothing at all: the string lands in the x slot, the canvas takes a
# non-numeric coordinate, and the label simply never appears. No error, no NaN,
# nothing for runall or auditscan to catch — twenty-four labels across the Modern
# wings were invisible for exactly this reason and nobody noticed. A grep is the
# only thing that can see it, so it runs on every build.
#
# The original grep matched a string literal in the x slot. It could not see
# `ctText(ctx, N.s, P.X(...), ...)` — a bare identifier is indistinguishable from
# a coordinate — and that is exactly the form the binding-energy stage had, so
# the labels on its measured-nuclide dots were never drawn and this check passed
# on every build for months.
#
# The reliable discriminator is not the x slot but the FOURTH argument. In a
# correct call it is the text; in a shifted one it holds what should have been
# the colour, so it starts with rgbCss( or TH. — which no piece of text ever
# does. The sixth argument is checked too: it is a font STRING, and a bare number
# there sets no font at all.
$srcFiles = Get-ChildItem (Join-Path $dir 'src\js') -Filter '*.js'
function Split-CallArgs([string]$s) {
  $out = @(); $depth = 0; $cur = ''; $q = $null
  for ($i = 0; $i -lt $s.Length; $i++) {
    $c = $s[$i]
    if ($q) { $cur += $c; if ($c -eq $q -and $s[$i-1] -ne '\') { $q = $null }; continue }
    if ($c -eq "'" -or $c -eq '"' -or $c -eq '`') { $q = $c; $cur += $c; continue }
    if ($c -eq '(' -or $c -eq '[' -or $c -eq '{') { $depth++ }
    if ($c -eq ')' -or $c -eq ']' -or $c -eq '}') { if ($depth -eq 0) { break }; $depth-- }
    if ($c -eq ',' -and $depth -eq 0) { $out += $cur.Trim(); $cur = ''; continue }
    $cur += $c
  }
  if ($cur.Trim()) { $out += $cur.Trim() }
  return $out
}
$ctBad = @()
foreach ($f in $srcFiles) {
  $lines = [IO.File]::ReadAllLines($f.FullName, [Text.Encoding]::UTF8)
  for ($i = 0; $i -lt $lines.Count; $i++) {
    foreach ($fn in @('ctText','rlText')) {
      $idx = $lines[$i].IndexOf($fn + '(')
      if ($idx -lt 0) { continue }
      $a = Split-CallArgs $lines[$i].Substring($idx + $fn.Length + 1)
      if ($a.Count -lt 4) { continue }
      $why = ''
      if ($a[3] -match '^(rgbCss\(|TH\.)')            { $why = 'the colour is in the text slot — arguments are shifted' }
      elseif ($a[3] -match '^[A-Za-z_$][\w$]*\.(X|Y)\(') { $why = 'a plot coordinate is in the text slot — arguments are shifted' }
      elseif ($a[1] -match "^['`"]" -or $a[2] -match "^['`"]") { $why = 'a string is in a coordinate slot' }
      elseif ($a.Count -ge 6 -and $a[5] -match '^\d+(\.\d+)?$') { $why = 'the font is a bare number, not a font string' }
      if ($why) { $ctBad += ('  ' + $f.Name + ':' + ($i + 1) + '  ' + $why + "`r`n      " + $lines[$i].Trim()) }
    }
  }
}
if ($ctBad.Count) {
  Write-Output 'smoke FAILED: ctText/rlText take (ctx, x, y, text, colour, font) — these draw nothing at all:'
  $ctBad | ForEach-Object { Write-Output $_ }
  $bad = 1
}

# ---- markup in canvas text, which is DRAWN LITERALLY -------------------------
# The canvas has no markup: a <sub> handed to fillText is painted as the six
# characters "<sub>". Two shipped this way — vcGreen drew
# "∬ (Q<sub>x</sub> − P<sub>y</sub>) dA" across the top of Green's theorem, and
# the Carnot stage drew "Q<sub>c</sub> can never be zero" — and NOTHING could
# see them: they are finite strings, they raise nothing, runall greps prose for
# NaN rather than tags, and auditscan harvests the HTML panels, not the canvas.
# Only a screenshot showed it, which is not a gate.
#
# The HTML side is deliberately untouched: kv(), help prose and legends are
# supify()'d and <sub> is correct there. This looks only at the calls that end
# in fillText.
#
# THE CALL IS READ WHOLE, NOT LINE BY LINE. The first version of this check
# tested one line at a time and did not catch the vcGreen title that prompted
# it: `ctFrame(` sat on one line and the tag on the continuation. Restoring the
# defect and watching the check still pass is the only reason that is known.
#
# -cmatch and the closing '>' also both matter: a case-insensitive match on the
# tag NAME alone read `st.E < B.Vmax` as an opening <b> and failed the build on
# correct code. A tag is lower case and it is closed.
function Get-CallBody([string]$s) {
  $depth = 0; $q = $null; $sb = New-Object Text.StringBuilder
  for ($i = 0; $i -lt $s.Length; $i++) {
    $c = $s[$i]
    if ($q) { [void]$sb.Append($c); if ($c -eq $q -and $s[$i - 1] -ne '\') { $q = $null }; continue }
    if ($c -eq "'" -or $c -eq '"' -or $c -eq '`') { $q = $c; [void]$sb.Append($c); continue }
    if ($c -eq '(' -or $c -eq '[' -or $c -eq '{') { $depth++ }
    if ($c -eq ')' -or $c -eq ']' -or $c -eq '}') { if ($depth -eq 0) { break }; $depth-- }
    [void]$sb.Append($c)
  }
  return $sb.ToString()
}
$mkBad = @()
$mkFns = 'ctFrame|ctText|rlText|stageNote|fillText|em3dCaption|wsTitle|wsSub'
foreach ($f in $srcFiles) {
  $text = [IO.File]::ReadAllText($f.FullName, [Text.Encoding]::UTF8)
  foreach ($m in [regex]::Matches($text, "\b($mkFns)\s*\(")) {
    $body = Get-CallBody $text.Substring($m.Index + $m.Length)
    if ($body -cmatch '</?(sub|sup|b|i|br|span|div)\s*/?>') {
      $line = ($text.Substring(0, $m.Index) -split "`n").Count
      $mkBad += ('  ' + $f.Name + ':' + $line + '  ' + $m.Groups[1].Value +
                 ' draws ' + $Matches[0] + " literally`r`n      " +
                 (($body -split "`n")[0]).Trim())
    }
  }
}
if ($mkBad.Count) {
  Write-Output 'smoke FAILED: canvas text is drawn literally — these paint their own tags:'
  $mkBad | ForEach-Object { Write-Output $_ }
  $bad = 1
}

# ---- the three cached panels may only be written through uiSetHtml ----------
# uiSetHtml skips a write whose HTML matches what it last wrote, and keeps that
# marker on the element. A direct `.innerHTML =` on one of these three elements
# therefore leaves the marker describing a DOM that no longer exists, and the
# NEXT identical refresh is skipped as a no-op — leaving stale content on
# screen until the reader happens to change a control.
#
# Both of the ways this can happen were shipped and then found by reading:
# stageExit() cleared #stageReadout directly, so reopening the same stage in
# the same state showed a BLANK readout; and updateChip() wrote #chip directly,
# so returning to a stage showed the FIELD's chip. Neither raises anything and
# neither changes a number, so runall cannot see them.
$ownBad = @()
foreach ($f in $srcFiles) {
  $lines = [IO.File]::ReadAllLines($f.FullName, [Text.Encoding]::UTF8)
  for ($i = 0; $i -lt $lines.Count; $i++) {
    # `=(?!=)` and NOT `=[^=]`. Requiring a character after the `=` missed
    # `$('chip').innerHTML =` with its value on the next line — which is exactly
    # how the real defect was written. The lookahead keeps `==`/`===` out
    # without demanding anything follow the assignment on the same line.
    if ($lines[$i] -cmatch "(stageReadout|deriveBody|'chip'|`"chip`")[^\r\n]*\.innerHTML\s*=(?!=)") {
      $ownBad += ('  ' + $f.Name + ':' + ($i + 1) + "`r`n      " + $lines[$i].Trim())
    }
  }
}
if ($ownBad.Count) {
  Write-Output 'smoke FAILED: #stageReadout / #deriveBody / #chip must be written through uiSetHtml,'
  Write-Output '              or its cache marker goes stale and the NEXT refresh is skipped:'
  $ownBad | ForEach-Object { Write-Output $_ }
  $bad = 1
}

if ($bad) { Write-Output 'smoke FAILED'; exit 1 }
Write-Output 'smoke OK'
