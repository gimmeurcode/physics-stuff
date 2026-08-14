# auditresid.ps1 -- is any RESIDUAL printed as though it were a measurement?
#
# WHY THIS EXISTS. MASTER-PLAN section 2.1: "A claim that two quantities are
# equal is only made after computing BOTH independently and printing the
# difference." 110 rows across the wings do exactly that. Nothing checked what
# those rows actually SAY, and two ways of saying it are wrong:
#
#   1. A REAL DISAGREEMENT PRINTED AS ZERO. fmtNum's exponent term is clamped at
#      zero, so below 1 its `sig` counts DECIMALS, not FIGURES. Swept, the dead
#      zone is exactly [1e-4, 5x10^-sig) -- bounded below only because the
#      scientific branch takes over at 1e-4, which is why sig >= 4 is safe by
#      luck rather than by design. dyForce's work-energy row printed a genuine
#      1.4988e-4 J gap -- SEVEN POINT EIGHT PER CENT of the number beside it --
#      as "difference 0 J", and its chip said "they differ by 0" in --c-pos, the
#      affirmative colour. On another preset the two routes disagreed by 100%
#      and it still said 0. That is J9.
#
#   2. ROUND-OFF PRINTED AS A MEASUREMENT. The other half of the same rule.
#      "difference 2.13x10^-14 J" is not a measurement of anything; it is the
#      last bits of a double. A circuit at its steady state read 29.7 fA, 148 fW
#      and 29.7 pV the same way.
#
# THE RULE, AND WHY IT IS GENERAL. A residual is meaningless without the scale
# it must be read against -- 1e-4 J is a triumph beside 1 J and a catastrophe
# beside 1e-3 J -- so a row that promises a difference must print one of:
#   * a relative figure (a % or an "agreeing to N figures" verdict), or
#   * a statement that the two agree to the resolution the routes have.
# fmtGap/fmtSig (10-math.js) and ckGap/ckEngF (48a) do this; a bare fmtNum
# cannot. This gate does not care which helper was used -- it reads the RENDERED
# TEXT of every panel on every stage, so a new way of getting it wrong is caught
# too.
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

$tail = @'
<script>
setTimeout(function(){
  try { document.getElementById('home').classList.remove('open'); } catch(e){}

  /* a label that PROMISES a difference between two independently computed
     things. Kept deliberately tight: "error function", "standard error" and
     "margin of error" are not residuals, and a percentage error already
     carries its own scale. */
  /* \u0394 is a literal delta. It is written escaped, not typed, because this
     file is read as ANSI unless it carries a BOM -- a typed one arrives as
     mojibake and the alternative silently never matches. */
  var PROMISE = /(difference|residual|discrepan|mismatch|drift|gap between|how far apart|disagree|differ by|departure from|deviation|max\s*\u0394|largest\s*\u0394|worst\s*\u0394)/i;
  /* NOT residuals: a differencing METHOD named in the label, a fit statistic
     that is a real number in its own right, and anything already relative.
     The last four were added on 2026-08-14 after a sweep of every PROMISE row
     on the site: each is a PHYSICAL quantity whose name happens to contain a
     residual word, and flagging them would teach the reader to ignore the gate.
     "standard deviation" is a distribution's width (pbDist, pbCLT, smCount);
     "drift v" is the electrons' drift VELOCITY in rlWire, not a drift in a
     conserved quantity; "residual length" is the norm of the orthogonal
     component in Gram-Schmidt; "strong (residual)" is the residual strong
     force, a force with a name, not a leftover.
     "worst residual"/"residual of that fit" join "rms residual" and "residual
     sum" as FIT STATISTICS: they are quoted in decades or in ln, i.e. already
     in log units, where the number IS its own relative measure -- 0.002 decades
     is 0.46%, and dividing it by something would say less, not more. They are
     still required to print through fmtSig rather than toFixed, because
     toFixed(5) rendered a perfect Debye fit as "0.00000 decades", which is J9
     in the third spelling. */
  var EXEMPT  = /(error function|erf|standard error|margin of error|error bar|relative|percent|per cent|%|finite[- ]difference|central difference|forward difference|backward difference|difference quotient|divided difference|by finite|sum of squared|squared residual|rms residual|residual sum|residual in|standard deviation|drift v|residual length|\(residual\)|worst residual|residual of that fit)/i;

  /* a value that carries its own scale, and is therefore readable */
  var SCALED  = /(%|agreeing to|every digit|resolution|relative|out of|of\s|per)/i;
  /* bare zero, in any unit -- "0", "0 J", "0.00 N". Must NOT match "0.03":
     after the zeros the next character has to be whitespace, or nothing. */
  var BAREZERO = /^[\u2212-]?0(\.0+)?(\s.*)?$/;
  /* round-off: a magnitude at or below 1e-10 in this app's scientific form */
  var TINY = /\u00d710\u207b(\u00b9[\u2070-\u2079]|[\u00b2-\u00b9\u2070-\u2079]{2,})/;
  /* ...and the SAME magnitude written the other way. Number.toExponential()
     emits ASCII "8.10e-11", which the superscript form above cannot match at
     all -- so every residual printed through toExponential was invisible to
     this gate, and eighteen of them were, in the statistical-mechanics wing
     alone. Matches 1e-10 and smaller only. */
  var TINYASCII = /e[-\u2212](1[0-9]|[2-9][0-9])\b/;

  var rows = [], nRows = 0, nPromise = 0, findings = 0, noscale = 0, nOwn = 0;
  var ids = Object.keys(STAGES);
  var host = document.createElement('div');
  document.body.appendChild(host);

  var scan = function(id, where, html){
    if (!html) return;
    host.innerHTML = html;
    /* the kv rows */
    var kvs = host.querySelectorAll('.kv');
    for (var j = 0; j < kvs.length; j++) {
      var k = kvs[j].querySelector('.k'), v = kvs[j].querySelector('.v');
      if (!k || !v) continue;
      nRows++;
      var lab = (k.textContent || '').trim();
      var val = (v.textContent || '').trim();
      if (!PROMISE.test(lab) || EXEMPT.test(lab)) continue;
      nPromise++;
      if (SCALED.test(val)) continue;
      if (BAREZERO.test(val)) {
        findings++;
        rows.push(id + '\t' + where + '\tZERO\t' + lab + '\t=\t' + val);
      } else if (TINY.test(val) || TINYASCII.test(val)) {
        findings++;
        rows.push(id + '\t' + where + '\tROUNDOFF\t' + lab + '\t=\t' + val);
      } else {
        /* Everything else: a row that promises a difference and prints a
           number with no scale beside it. SITE-RULES 1.4 asks for one, but a
           regex cannot tell a two-route RESIDUAL from a physical DIFFERENCE --
           "difference = 4 yr" between two twins' ages is an answer, and
           "difference = 2.30x10^-6" between two routes to a contour integral
           is a residual, and they are the same shape. So these are REPORTED
           for a human to read and do NOT fail the build. See SITE-RULES Part 4. */
        noscale++;
        rows.push(id + '\t' + where + '\tnoscale\t' + lab + '\t=\t' + val);
      }
    }
    /* And free text that makes the same promise outside a kv row. A CHIP is not
       built from kv rows at all -- it is bare <div>s -- so without this the
       whole chip surface is invisible to the gate, which is exactly where
       "they differ by 0" and "max \u0394 = 6.66\u00d710\u207b\u00b9\u2076" both lived. */
    var txt = (host.textContent || '').replace(/\s+/g, ' ');
    /* the value class must NOT exclude '.', or "6.66x10^-16" captures as "6"
       and every roundoff in a chip passes silently. A trailing sentence stop is
       trimmed afterwards instead. */
    var pats = [/(differ by|differs by|disagree by|apart by)\s*([^\s,;]+)/i,
                /(max\s*\u0394|largest\s*\u0394|worst\s*\u0394|residual|difference)\s*=\s*([^\s,;]+)/i];
    for (var pi = 0; pi < pats.length; pi++) {
      var m = txt.match(pats[pi]);
      if (!m) continue;
      var val = m[2].replace(/\.$/, '');
      /* the capture must actually be a NUMBER. "the two differ by a factor of
         three" and "they differ by where the cut is" are prose, and reporting
         them is how a gate gets switched off. */
      if (!/^[−\-]?[.\d]/.test(val)) continue;
      /* Is the scale printed WHERE THE NUMBER IS? The old test was
         SCALED.test(txt) across the whole surface -- and SCALED contains
         /of\s/, so any panel containing the word "of" exempted itself
         entirely. On a 4000-character derive ladder that is every one of them.
         A 60-character window after the match is the honest question, and it
         is what caught smBoltz printing 8.10x10^-11 as a measurement. */
      var at = txt.indexOf(m[0]);
      if (SCALED.test(txt.slice(at, at + m[0].length + 60))) continue;
      if (BAREZERO.test(val)) {
        findings++; rows.push(id + '\t' + where + '\tZERO-TEXT\t' + m[0]);
      } else if (TINY.test(val) || TINYASCII.test(val)) {
        findings++; rows.push(id + '\t' + where + '\tROUNDOFF-TEXT\t' + m[0]);
      }
    }
  };

  for (var i = 0; i < ids.length; i++) {
    var id = ids[i];
    try {
      stageEnter(id); stageFrame(0.016);
      var S = STAGES[id];
      scan(id, 'readout', S.readout ? S.readout(ST) : '');
      scan(id, 'chip',    S.chip    ? S.chip(ST)    : '');
      /* The DERIVE LADDER and the LEGEND are panels too, and until 2026-08-14
         neither was read: the ladder alone is ~717 000 characters of rendered
         text across the 178 stages, and seven wings were printing a residual
         in derive prose while their readout beside it had been converted to
         fmtAgree. A fix that reaches one surface and not its siblings is
         SITE-RULES Part 2, and this is where it was hiding.
         drvRender is the same function refreshDerive() uses. */
      try { scan(id, 'derive', S.derive ? drvRender(S.derive(ST)) : ''); }
      catch (eD) { rows.push(id + '\tderive\tTHREW\t' + String(eD && eD.message || eD).slice(0, 60)); }
      try { scan(id, 'legend', S.legend ? (S.legend(ST) || []).map(function(r){
              return '<div>' + (r && r[1] || '') + '</div>'; }).join('') : ''); }
      catch (eL) { rows.push(id + '\tlegend\tTHREW\t' + String(eL && eL.message || eL).slice(0, 60)); }

      /* THE READER'S OWN CASE. 55 stages answer `if (st.own) return
         STAGES.x.readoutOwn(st)`, and with st.own false at entry NONE of those
         surfaces had ever been read by this gate -- which is where a corrupted
         smBoltz row sat printing 8.100e-11 while the gate reported bad=0.
         SITE-RULES 1.5 holds the reader's own case to the same standard as the
         author's, so it gets the same scan. The stage's own defaults (st.sheet,
         st.src, ...) are already in ST from enter(), so flipping the flag
         renders the panel the reader would actually see. Each surface is
         guarded separately: a stage that cannot build an own-case must not cost
         us the other three. */
      if (S.readoutOwn || S.chipOwn || S.deriveOwn || S.legendOwn) {
        var wasOwn = ST.own;
        try {
          ST.own = true;
          nOwn++;
          try { scan(id, 'readout:own', S.readout ? S.readout(ST) : ''); } catch (o1) {}
          try { scan(id, 'chip:own',    S.chip    ? S.chip(ST)    : ''); } catch (o2) {}
          try { scan(id, 'derive:own',  S.derive  ? drvRender(S.derive(ST)) : ''); } catch (o3) {}
        } catch (oX) { rows.push(id + '\town\tTHREW\t' + String(oX && oX.message || oX).slice(0, 60)); }
        ST.own = wasOwn;
      }
      /* every scene / preset the stage offers, not just the one it opens on --
         dyForce's 100% case is on a preset the default never selects */
      var keys = ['scene', 'mode', 'preset', 'key', 'which', 'view'];
      for (var q = 0; q < keys.length; q++) {
        var kn = keys[q];
        if (typeof ST[kn] !== 'string') continue;
        var was = ST[kn], seen = {};
        seen[was] = 1;
        var pool = (S.scenes && Object.keys(S.scenes)) || [];
        for (var p = 0; p < pool.length; p++) {
          if (seen[pool[p]]) continue;
          seen[pool[p]] = 1;
          try {
            ST[kn] = pool[p];
            scan(id, 'readout:' + kn + '=' + pool[p], S.readout ? S.readout(ST) : '');
            scan(id, 'chip:' + kn + '=' + pool[p], S.chip ? S.chip(ST) : '');
            try { scan(id, 'derive:' + kn + '=' + pool[p], S.derive ? drvRender(S.derive(ST)) : ''); } catch (eD2) {}
          } catch (e2) {}
        }
        ST[kn] = was;
      }
      stageExit();
    } catch (ex) {
      rows.push(id + '\tTHREW\t' + String(ex && ex.message || ex).slice(0, 70));
    }
  }

  var t = document.createElement('div');
  t.id = 'REPORT';
  t.textContent = rows.join('\n') + '\n#stages=' + ids.length + ' rows=' + nRows +
                  ' residualrows=' + nPromise + ' findings=' + findings +
                  ' noscale=' + noscale + ' ownsurfaces=' + nOwn +
                  ' errs=' + window.__errs.length;
  document.body.appendChild(t);
}, 900);
</script></body></html>
'@

$out = Join-Path $dir 'apptest-resid.html'
Set-Content -Path $out -Value ($head + $body + $tail) -Encoding utf8

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$url    = 'file:///' + ($out -replace '\\','/')
& $chrome --headless --disable-gpu --no-sandbox --window-size=1680,1000 --virtual-time-budget=600000 `
          --user-data-dir="$(Join-Path $dir 'cprof-resid')" --dump-dom $url |
  Out-File (Join-Path $dir 'dom-resid.txt') -Encoding utf8

$dom = Get-Content (Join-Path $dir 'dom-resid.txt') -Raw -Encoding UTF8
$marker = 'id="REPORT">'
$a = $dom.IndexOf($marker)
if ($a -lt 0) { Write-Output 'NO REPORT - the page never reached the probe.'; exit 1 }
$a += $marker.Length
$b = $dom.IndexOf('</div>', $a)
$rep = $dom.Substring($a, $b - $a).Replace('&lt;','<').Replace('&gt;','>').Replace('&amp;','&')

$findings = 0
foreach ($line in ($rep -split "`n")) {
  $line = $line.TrimEnd()
  if (-not $line) { continue }
  if ($line.StartsWith('#')) {
    Write-Output $line
    if ($line -match 'findings=(\d+)') { $findings = [int]$Matches[1] }
    continue
  }
  Write-Output ('  ' + ($line -replace "`t", '  '))
}

if ($findings -gt 0) {
  Write-Output ''
  Write-Output "auditresid FAILED: $findings row(s) print a residual with no scale to read it against."
  Write-Output '  ZERO     - a difference rendered as bare 0. fmtNum below 1 counts DECIMALS,'
  Write-Output '             not figures, so a real gap in [1e-4, 5x10^-sig) prints as "0".'
  Write-Output '  ROUNDOFF - a difference quoted at 1e-10 or below with no scale: that is the'
  Write-Output '             last bits of a double, not a measurement of anything.'
  Write-Output '  Route it through fmtAgree(a, b, unit) where both routes are in scope -- it'
  Write-Output '  DERIVES the scale, so it cannot be passed the wrong one -- or fmtGap(gap,'
  Write-Output '  scale, unit) where only the gap is, fmtAgreeTight/fmtGapTight on a canvas,'
  Write-Output '  or ckGap/ckEngF inside a circuit.'
  exit 1
}
Write-Output 'auditresid OK'
Write-Output ''
Write-Output 'The `noscale` count above is ADVISORY and is not a failure. Those rows promise a'
Write-Output 'difference and print a number with no scale, but no regex can tell a two-route'
Write-Output 'RESIDUAL from a physical DIFFERENCE -- rlTwin''s "difference = 4 yr" between two'
Write-Output 'twins is an answer; cxContourInt''s "difference = 2.30x10^-6" between two routes'
Write-Output 'to one integral is a residual, and they are the same shape. Read them by hand;'
Write-Output 'SITE-RULES Part 4 records why this one cannot be automated.'
