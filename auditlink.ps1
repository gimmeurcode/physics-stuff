# auditlink.ps1 -- does a permalink actually reproduce the view it was copied from?
#
# WHY THIS EXISTS. 82a-permalink.js encodes wing, demo and every control the
# reader has moved into the URL hash, and restores them by driving the real
# controls. Nothing else in the harness can see whether that round trip is
# faithful: `runall` visits each demo once with its defaults, `auditcustom`
# drives the typed boxes but never leaves and returns, and `smoke` only proves
# the bundle parses. A link that silently drops half its controls looks exactly
# like a link that had none.
#
# WHAT IS MEASURED, in three passes:
#
#   A -- IDENTITY AT REST. A demo nobody has touched must encode to a hash
#        carrying `w` and `d` and NOTHING ELSE. The encoder writes only the
#        difference from the baseline captured when the demo opened, so a stray
#        `c.` parameter here means some control's value is not stable between
#        one read and the next -- which would put noise in every link anyone
#        ever copied. This is the permalink's analogue of auditzoom's
#        identity-at-rest check, and for the same reason: the feature has to be
#        invisible until it is used.
#
#   B -- THE ROUND TRIP. For every demo carrying a control: move its sliders,
#        flip its checkboxes, step its segmented controls, parenthesise its
#        expression boxes, then read the whole panel (snapshot A) and the hash.
#        Navigate away to another wing entirely. Follow the hash back. Read the
#        panel again (snapshot B). Every control must agree. The comparison is
#        over the UNION of both key sets, so a control that vanishes on the way
#        back is a finding, not a silent pass.
#
#   C -- A COLD LOAD. Passes A and B never restart the page, so they never
#        exercise plInit() inside boot() -- the path every reader actually takes.
#        Pass A emits one real link; this pass launches a second browser at that
#        URL and checks the controls come back. That is the whole feature.
#
# Expression boxes are perturbed by wrapping what is already in them in
# parentheses. That is the one edit that is valid for every box in the
# laboratory whatever its variables -- `(a*cos(t))` parses wherever `a*cos(t)`
# did -- and it changes the stored string, which is what the round trip is
# about. Inventing content would fail on the bespoke formats instead.
#
# The View panel is deliberately NOT part of any of this: 82a excludes #pvPanel
# because pan and zoom describe whichever plot the reader last touched, and
# there is no stable identity for a link to name.
#
# Written ASCII-only so it does not depend on the .ps1 being read as UTF-8.

$ErrorActionPreference = 'Stop'
$dir  = $PSScriptRoot
$body = Get-Content (Join-Path $dir 'vector-calculus.html') -Raw -Encoding UTF8

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'

$head = @'
<!doctype html><html data-theme="dark"><head><meta charset="utf-8">
<script>window.__errs=[];window.addEventListener('error',function(e){window.__errs.push(e.message);});</script>
</head><body>
'@

# ---------------------------------------------------------------- passes A + B
$probe = @'
<script>
setTimeout(function(){
  var rows = [], findings = 0, restAt = 0, trips = 0, ctlSeen = 0, stoch = 0;
  var link = '', linkSnap = '', linkTxt = '';

  function snap(){ return plRead(); }
  function keysOf(o){ return Object.keys(o || {}); }

  // The engine-side vectors behind the readouts, so a difference can be pinned
  // on the state rather than on the formatting of it.
  function vecState(){
    function v(a){ return a ? ('(' + (+a.x).toFixed(8) + ',' + (+a.y).toFixed(8) + ',' + (+a.z).toFixed(8) + ')') : 'none'; }
    return 'dirU' + v(S.dirU) + ' probe' + v(S.probe) + ' circN' + v(S.circ && S.circ.n) +
           ' mode=' + S.mode + ' view=' + S.view + ' dim=' + S.dim + ' ext=' + S.extent +
           ' t=' + (typeof CLOCK !== 'undefined' ? CLOCK.t : '?') +
           ' anim=' + (S.field ? !!S.field.animated : '?') +
           ' f=' + (S.src ? S.src.f : '') + ' P=' + (S.src ? S.src.P : '') +
           ' Q=' + (S.src ? S.src.Q : '') + ' R=' + (S.src ? S.src.R : '') +
           ' Du=' + (function(){ try { return dirData().value.toFixed(10); } catch(e){ return 'ex'; } })() +
           ' fp=' + (function(){
               try {
                 var F = S.field; if (!F) return 'nofield';
                 if (F.f) return F.f.ev(0.31, 0.42, 0.53).toFixed(10);
                 var a = F.at(0.31, 0.42, 0.53);
                 return a.x.toFixed(8) + ',' + a.y.toFixed(8) + ',' + a.z.toFixed(8);
               } catch(e){ return 'ex'; }
             })();
  }

  // THE SECOND ROUTE. plRead() reads the controls, and the controls are exactly
  // what the restore writes -- so on its own it can only prove that what was
  // set stayed set. Neutering plNotify (assign the boxes, tell nothing) left
  // 586 of 593 round trips still "passing" that comparison while no stage had
  // been told anything at all.
  //
  // The dock's TEXT is the independent route. Nothing here is an input value:
  // an <input>'s contents live in a property, not a text node. What is left is
  // the formatted reading beside every slider, the readout, the chip and the
  // whole derivation ladder -- every one of them printed by the stage FROM ITS
  // OWN STATE. If the boxes say 0.99 and the ladder still says 0.5, the state
  // never moved, and this catches it where the control comparison cannot.
  function stateText(){
    // ONLY WHAT THE READER CAN SEE. applyWingSections() hides the panels a
    // wing does not use by setting style.display on each .sec -- it does not
    // empty them. So #dock.textContent still carries the directional
    // derivative and the gradient-descent walker left behind by whatever FIELD
    // demo ran last, under 178 stage demos that never touch either. Comparing
    // that is comparing history, not the link: it reported 119 differences
    // that no permalink could ever restore and that no reader could ever see.
    var d = document.getElementById('dock'), c = document.getElementById('chip');
    // #ddAngv is left out, and only #ddAngv. It is the counter belonging to the
    // angle slider, which 82a deliberately does not encode: u-hat is the state
    // and the angle is the device that moves it. A restored view therefore has
    // the same DIRECTION -- du/dv/dw agree, and so does the directional
    // derivative printed from them -- while the counter reads 0 rather than
    // "134 degrees from wherever you last started turning". Excluding a device
    // without excluding its own dial would be marking our own homework, so
    // nothing else here is exempt.
    var dial = document.getElementById('ddAngv'), keep = null;
    if (dial) { keep = dial.textContent; dial.textContent = ''; }
    var parts = [];
    if (d && !d.hidden) {
      for (var i = 0; i < d.children.length; i++) {
        var k = d.children[i];
        if (k.hidden) continue;
        if (k.style && k.style.display === 'none') continue;
        parts.push(k.textContent);
      }
    }
    if (c) parts.push(c.textContent);
    var s = parts.join(' ').replace(/\s+/g, ' ');
    if (dial) dial.textContent = keep;
    return s;
  }

  // Somewhere to navigate to between copying a link and following it, so the
  // restore cannot pass by having simply never left. Deliberately a wing with
  // its own controls, so the panel really is torn down and rebuilt.
  var AWAY_W = 'algebra', AWAY_D = '0.0';

  // ---- perturbation -------------------------------------------------------
  // Returns the number of controls actually moved.
  function perturb(){
    var moved = 0;
    var dock = document.getElementById('dock');
    if (!dock) return 0;

    // segmented controls first: they decide which other controls exist
    var segs = dock.querySelectorAll('.seg[id]');
    for (var i = 0; i < segs.length; i++) {
      if (segs[i].closest('#pvPanel')) continue;
      var bs = segs[i].querySelectorAll('button[data-v]');
      if (bs.length < 2) continue;
      var at = -1;
      for (var j = 0; j < bs.length; j++) if (bs[j].getAttribute('aria-pressed') === 'true') at = j;
      var next = bs[(at + 1 + bs.length) % bs.length];
      if (next && next.getAttribute('aria-pressed') !== 'true') { next.click(); moved++; break; }
    }

    // one pass over everything else, re-queried because the click above may
    // have rebuilt the panel
    dock = document.getElementById('dock');
    var ranges = dock.querySelectorAll('input[type=range][id]');
    for (var r = 0; r < ranges.length; r++) {
      var e = ranges[r];
      if (e.closest('#pvPanel')) continue;
      var lo = parseFloat(e.min), hi = parseFloat(e.max), st = parseFloat(e.step);
      if (!isFinite(lo) || !isFinite(hi) || hi <= lo) continue;
      var v = lo + (hi - lo) * 0.371;
      if (isFinite(st) && st > 0) v = lo + Math.round((v - lo) / st) * st;
      v = +v.toPrecision(12);
      if (String(v) === String(parseFloat(e.value))) continue;
      // The same contract 82a follows: `<id>n` is a ctlSlider's exact-value box
      // ONLY when it carries .sldnum, and only then does it commit on blur.
      // The probe panel hand-builds pbx beside pbxn, an ordinary .num box that
      // commits on change -- driving that one with a blur moved nothing, and
      // left a "copied" state where the slider and its box disagreed, which is
      // not a state any reader can produce.
      var box = document.getElementById(e.id + 'n');
      if (box && !box.classList.contains('sldnum')) box = null;
      if (box) { box.value = String(v); box.dispatchEvent(new Event('blur')); }
      else { e.value = String(v); e.dispatchEvent(new Event('input')); }
      moved++;
    }

    dock = document.getElementById('dock');
    var cks = dock.querySelectorAll('input[type=checkbox][id]');
    for (var c = 0; c < cks.length; c++) {
      if (cks[c].closest('#pvPanel')) continue;
      cks[c].checked = !cks[c].checked;
      cks[c].dispatchEvent(new Event('change'));
      moved++;
    }

    // expression and bound boxes: parenthesise what is there
    dock = document.getElementById('dock');
    var txt = dock.querySelectorAll('#stageBody input:not([type=range]):not([type=checkbox]):not(.sldnum)');
    for (var t = 0; t < txt.length; t++) {
      var b = txt[t];
      if (!b.id || b.closest('#pvPanel')) continue;
      var val = String(b.value || '').trim();
      if (!val || val.charAt(0) === '(') continue;
      b.value = '(' + val + ')';
      b.dispatchEvent(new Event('change'));
      moved++;
    }
    return moved;
  }

  // ---- the sweep ----------------------------------------------------------
  var wings = Object.keys(WINGS);
  for (var wi = 0; wi < wings.length; wi++) {
    var w = wings[wi];
    var groups = WINGS[w].groups || [];
    for (var gi = 0; gi < groups.length; gi++) {
      var items = groups[gi].items || [];
      for (var ii = 0; ii < items.length; ii++) {
        var key = gi + '.' + ii;
        var where = w + ' ' + key;
        try {
          // ---- pass A: identity at rest ----
          plGo({ w: w, d: key, c: {} });
          var h0 = plEncode();
          var extra = h0.split('&').filter(function(p){ return p.indexOf('c.') === 0; });
          if (extra.length) {
            findings++;
            rows.push(where + '\tREST-NOT-IDENTITY\t' + extra.slice(0, 4).join(' '));
          }

          // ---- an element id must name ONE control ----
          // A permalink's keys ARE element ids, so a duplicate makes a key
          // ambiguous: getElementById is first-wins, and the reader's slider and
          // the one the link writes need not be the same object. This found the
          // complex wing's contour radius sharing `ciR` with the circulation
          // loop's radius, which also meant a wireSlider call could have
          // attached to the wrong element entirely.
          var seenId = {}, dups = [];
          var withId = document.querySelectorAll('#dock [id]');
          for (var q = 0; q < withId.length; q++) {
            var qi = withId[q].id;
            if (seenId[qi]) { if (dups.indexOf(qi) < 0) dups.push(qi); }
            seenId[qi] = 1;
          }
          if (dups.length) {
            findings++;
            rows.push(where + '\tDUPLICATE-ID\t' + dups.slice(0, 6).join(' '));
          }

          // ---- is this demo deterministic at all? ----
          // Some experiments ARE random: a sample of size n, a least-squares fit
          // to that sample, an Ising lattice. No link can carry a draw from an
          // RNG, and none should -- following one re-runs the experiment, which
          // is the honest thing for it to do. Rather than keep a hand-written
          // list of which those are, MEASURE it: enter the demo twice with no
          // link involved at all and see whether it says the same thing. If it
          // does not, the control comparison still applies but the state text
          // cannot, and the demo is counted as stochastic in the summary.
          var det0 = stateText();
          plGo({ w: AWAY_W, d: AWAY_D, c: {} });
          plGo({ w: w, d: key, c: {} });
          var deterministic = (det0 === stateText());
          if (!deterministic) stoch++;

          // ---- pass B: the round trip ----
          var n = perturb();
          ctlSeen += n;
          if (!n) continue;
          trips++;

          var a = snap(), aTxt = stateText(), aVec = vecState();
          var h = plEncode();
          var cn = h.split('&').filter(function(p){ return p.indexOf('c.') === 0; }).length;
          if (!cn) {
            findings++;
            rows.push(where + '\tNOTHING-ENCODED\tmoved ' + n + ' control(s), hash carries none');
            continue;
          }
          // The cold-load pass compares text across two browser processes, so
          // the link it uses must come from a demo measured deterministic here.
          if (!link && deterministic) { link = h; linkSnap = JSON.stringify(a); linkTxt = aTxt; }

          plGo({ w: AWAY_W, d: AWAY_D, c: {} });   // leave, as a reader does
          var parsed = plParse(h);
          if (!parsed) {
            findings++;
            rows.push(where + '\tHASH-UNPARSEABLE\t' + h.slice(0, 80));
            continue;
          }
          plGo(parsed);                             // and follow the link back
          var b2 = snap(), bTxt = stateText(), bVec = vecState();

          var seen = {}, ks = keysOf(a).concat(keysOf(b2)), diff = [];
          for (var k = 0; k < ks.length; k++) {
            var id = ks[k];
            if (seen[id]) continue;
            seen[id] = 1;
            var va = a[id], vb = b2[id];
            if (va === vb) continue;
            diff.push(id + ' copied=' + (va === undefined ? '(gone)' : va) +
                          ' restored=' + (vb === undefined ? '(gone)' : vb));
          }
          if (diff.length) {
            findings++;
            rows.push(where + '\tNOT-RESTORED\t' + diff.slice(0, 3).join(' | ') +
                      (aVec === bVec ? '' : '\n    S: ' + aVec + '\n    S: ' + bVec));
          } else if (deterministic && aTxt !== bTxt) {
            // the controls agree but what the stage PRINTS from them does not
            var at = 0;
            while (at < aTxt.length && aTxt.charAt(at) === bTxt.charAt(at)) at++;
            findings++;
            rows.push(where + '\tSTATE-NOT-RESTORED\tat char ' + at +
                      ' copied="' + aTxt.substr(Math.max(0, at - 24), 60) +
                      '" restored="' + bTxt.substr(Math.max(0, at - 24), 60) + '"' +
                      (aVec === bVec ? '' : '\n    S: ' + aVec + '\n    S: ' + bVec));
          } else restAt++;
        } catch (ex) {
          findings++;
          rows.push(where + '\tTHREW\t' + String(ex && ex.message || ex).slice(0, 80));
        }
      }
    }
  }

  var t = document.createElement('div');
  t.id = 'REPORT';
  t.textContent = rows.join('\n') +
    '\nLINK\t' + link +
    '\nLINKSNAP\t' + linkSnap +
    '\nLINKTEXT\t' + linkTxt +
    '\n#trips=' + trips + ' restored=' + restAt + ' controlsmoved=' + ctlSeen +
    ' stochastic=' + stoch + ' findings=' + findings + ' errs=' + window.__errs.length;
  document.body.appendChild(t);
}, 1200);
</script></body></html>
'@

$out = Join-Path $dir 'apptest-link.html'
Set-Content -Path $out -Value ($head + $body + $probe) -Encoding utf8

$url = 'file:///' + ($out -replace '\\','/')
& $chrome --headless --disable-gpu --no-sandbox --window-size=1680,1000 --virtual-time-budget=900000 `
          --user-data-dir="$(Join-Path $dir 'cprof-link')" --dump-dom $url |
  Out-File (Join-Path $dir 'dom-link.txt') -Encoding utf8

function Get-Report($file) {
  $dom = Get-Content $file -Raw -Encoding UTF8
  $marker = 'id="REPORT">'
  $a = $dom.IndexOf($marker)
  if ($a -lt 0) { return $null }
  $a += $marker.Length
  $b = $dom.IndexOf('</div>', $a)
  return $dom.Substring($a, $b - $a).Replace('&lt;','<').Replace('&gt;','>').Replace('&amp;','&')
}

$rep = Get-Report (Join-Path $dir 'dom-link.txt')
if (-not $rep) { Write-Output 'NO REPORT - the page never reached the probe.'; exit 1 }

$findings = 0
$link = ''
$linkSnap = ''
foreach ($line in ($rep -split "`n")) {
  $line = $line.TrimEnd()
  if (-not $line) { continue }
  if ($line.StartsWith('LINK' + "`t"))     { $link = $line.Substring(5); continue }
  if ($line.StartsWith('LINKSNAP' + "`t")) { $linkSnap = $line.Substring(9); continue }
  if ($line.StartsWith('LINKTEXT' + "`t")) { $linkTxt = $line.Substring(9); continue }
  if ($line.StartsWith('#')) {
    Write-Output $line
    if ($line -match 'findings=(\d+)') { $findings = [int]$Matches[1] }
    continue
  }
  Write-Output ('  ' + ($line -replace "`t", '  '))
}

# ------------------------------------------------------------------- pass C
# A cold load. Everything above ran inside one page; this is the path a reader
# takes, through plInit() inside boot().
if (-not $link) {
  Write-Output 'no link was produced, so the cold-load pass could not run'
  $findings++
} else {
  $coldProbe = @'
<script>
setTimeout(function(){
  // Both routes, exactly as in pass B: the controls, and the text the visible
  // panels print FROM those controls. Without the second one this pass passed
  // on a build where plNotify dispatched nothing at all -- the boxes were
  // filled and no stage had been told a thing.
  function coldText(){
    var d = document.getElementById('dock'), c = document.getElementById('chip');
    var dial = document.getElementById('ddAngv'), keep = null;
    if (dial) { keep = dial.textContent; dial.textContent = ''; }
    var parts = [];
    if (d && !d.hidden) {
      for (var i = 0; i < d.children.length; i++) {
        var k = d.children[i];
        if (k.hidden) continue;
        if (k.style && k.style.display === 'none') continue;
        parts.push(k.textContent);
      }
    }
    if (c) parts.push(c.textContent);
    var s = parts.join(' ').replace(/\s+/g, ' ');
    if (dial) dial.textContent = keep;
    return s;
  }
  var t = document.createElement('div');
  t.id = 'REPORT';
  try { t.textContent = 'COLD\t' + JSON.stringify(plRead()) + '\t' + coldText() + '\terrs=' + window.__errs.length; }
  catch (ex) { t.textContent = 'COLD\tTHREW ' + String(ex && ex.message || ex); }
  document.body.appendChild(t);
}, 1500);
</script></body></html>
'@
  $coldOut = Join-Path $dir 'apptest-linkcold.html'
  Set-Content -Path $coldOut -Value ($head + $body + $coldProbe) -Encoding utf8
  $coldUrl = 'file:///' + ($coldOut -replace '\\','/') + $link
  & $chrome --headless --disable-gpu --no-sandbox --window-size=1680,1000 --virtual-time-budget=600000 `
            --user-data-dir="$(Join-Path $dir 'cprof-linkcold')" --dump-dom $coldUrl |
    Out-File (Join-Path $dir 'dom-linkcold.txt') -Encoding utf8

  $crep = Get-Report (Join-Path $dir 'dom-linkcold.txt')
  Write-Output ''
  Write-Output ('cold load: ' + $link)
  if (-not $crep) {
    Write-Output '  NO REPORT - the page never reached the probe.'
    $findings++
  } else {
    $coldParts = $crep -split "`t"
    $cold    = $coldParts[1]
    $coldTxt = if ($coldParts.Count -gt 2) { $coldParts[2] } else { '' }
    if (-not $cold -or $cold.StartsWith('THREW')) {
      Write-Output ('  ' + $crep)
      $findings++
    } else {
      $want = $linkSnap | ConvertFrom-Json
      $got  = $cold     | ConvertFrom-Json
      $bad = 0
      foreach ($p in $want.PSObject.Properties) {
        $g = $got.PSObject.Properties[$p.Name]
        if (-not $g) { Write-Output ("  MISSING  " + $p.Name + " expected=" + $p.Value); $bad++; continue }
        if ([string]$g.Value -ne [string]$p.Value) {
          Write-Output ("  DIFFERS  " + $p.Name + " expected=" + $p.Value + " got=" + $g.Value); $bad++
        }
      }
      if ($bad -gt 0) { Write-Output "  $bad control(s) did not survive a cold load"; $findings += $bad }
      else { Write-Output ("  " + @($want.PSObject.Properties).Count + " controls all restored from a cold start") }

      # ...and the second route, which is what makes this pass mean anything:
      # the visible panels must PRINT what the link said, not merely hold it.
      if ($linkTxt -and $coldTxt) {
        if ($coldTxt -eq $linkTxt) {
          Write-Output ("  and the panels print the same " + $linkTxt.Length + " characters as when it was copied")
        } else {
          $at = 0
          while ($at -lt $linkTxt.Length -and $at -lt $coldTxt.Length -and $linkTxt[$at] -eq $coldTxt[$at]) { $at++ }
          $from = [Math]::Max(0, $at - 24)
          Write-Output ("  STATE DIFFERS at char " + $at)
          Write-Output ("    copied  : " + $linkTxt.Substring($from, [Math]::Min(60, $linkTxt.Length - $from)))
          Write-Output ("    restored: " + $coldTxt.Substring($from, [Math]::Min(60, $coldTxt.Length - $from)))
          $findings++
        }
      } else {
        Write-Output '  no state text to compare -- the cold pass proved only the controls'
        $findings++
      }
    }
  }
}

Write-Output ''
if ($findings -gt 0) {
  Write-Output "auditlink FAILED: findings=$findings"
  exit 1
}
Write-Output 'auditlink OK'
