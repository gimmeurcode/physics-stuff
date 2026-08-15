# auditsides.ps1 -- when a stage computes a quantity TWICE, do the two routes
# actually agree, on every preset the reader can select?
#
# WHY THIS EXISTS. MASTER-PLAN 3.4 item 2, the "both-sides audit", written after
# fourteen defects in one day that all had one shape:
#
#   > A preset whose value happens to be zero hides an error in the term it
#   > multiplies.
#
# The cylinder's side flux vanishes by symmetry for four of six preset fields,
# so an inward-pointing normal survived for as long as the stage existed. Every
# theorem stage prints the difference between its two routes -- 91 such verdicts
# across 64 of the 178 stages -- and until this script nothing ever READ one.
# ./auditresid.ps1 is the neighbouring gate and asks a different question: it
# checks the difference is printed WITH ITS SCALE. A row can pass that and still
# be reporting a 30% disagreement, because nothing looked at the number.
#
# WHAT IT READS. The text fmtGap/fmtAgree render -- "agreeing to N figures", or
# "they agree to every digit either route has". That is the EFFECT, on the five
# surfaces a reader sees, not a grep for the cause. A new helper that prints the
# same verdict is covered automatically; one that prints no verdict at all is
# invisible here and is auditresid's business.
#
# THE THREE VERDICTS, and why only two of them fail the build:
#
#   FALSE-SCALE (fails). The routes agree to round-off and the panel says they
#     disagree by ~100%. fmtAgree DERIVES its scale as max(|a|,|b|), which is
#     right until both routes legitimately vanish -- then the derived scale is
#     the round-off itself and a perfect result reads as total disagreement.
#     dyMoment at e = 1 printed "1.78x10^-15 (100% -- agreeing to 0 figures)"
#     directly beneath prose promising the two "match exactly". This is J9
#     inverted: there a real gap printed as 0, here a zero gap prints as 100%.
#     Both are a residual quoted against a scale that means nothing.
#
#   PRESET-GAP (fails). The SAME claim agrees to 9+ figures on one preset and 2
#     or fewer on another. The two routes are the same code either way, so the
#     preset cannot change how well they ought to agree -- where they stop
#     agreeing, something in the term that preset switched on is wrong. This is
#     the cylinder-normal detector, and it needs no tolerance chosen by hand:
#     the stage's own best preset sets the standard its worst is held to.
#
#   WEAK (reported, does not fail). Few figures on EVERY preset. That is what a
#     14-slice Riemann sum, 40 000 Monte Carlo darts or a saddle-point
#     asymptotic at N = 2 is supposed to look like, and those demos exist to
#     show the convergence. A gate that failed on them would be switched off.
#
# Written ASCII-only so it does not depend on the .ps1 being read as UTF-8; the
# app's Unicode (x10, superscript minus, em dash) is \u-escaped in the probe.

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

  /* ---- reading the app's own number format back ------------------------- */
  /* fmtSig renders 1.78e-15 as "1.78x10^-15" with a real multiplication sign
     and real superscripts. To ask "is this gap round-off?" the magnitude has to
     be recovered from that, so the superscript digits are mapped back. */
  var SUPD = {'\u2070':'0','\u00b9':'1','\u00b2':'2','\u00b3':'3','\u2074':'4',
              '\u2075':'5','\u2076':'6','\u2077':'7','\u2078':'8','\u2079':'9'};
  var SUPCLASS = '[\u2070\u00b9\u00b2\u00b3\u2074-\u2079]';
  var SCI = new RegExp('^\\s*[\u2212-]?([\\d.]+)\u00d710(\u207b)?(' + SUPCLASS + '+)');
  var PLAIN = /^\s*[\u2212-]?([\d.]+)/;

  function magnitude(s){
    var m = SCI.exec(s);
    if (m) {
      var digits = '';
      for (var i = 0; i < m[3].length; i++) digits += (SUPD[m[3].charAt(i)] || '');
      if (!digits) return NaN;
      return parseFloat(m[1]) * Math.pow(10, (m[2] ? -1 : 1) * parseInt(digits, 10));
    }
    var p = PLAIN.exec(s);
    return p ? parseFloat(p[1]) : NaN;
  }

  /* The verdict fmtGap prints, and nothing else prints. Group 1 is the absolute
     gap with its unit, group 2 the figures.
     Group 1 is deliberately NARROW -- one number token, then at most two short
     unit tokens. The first version allowed any run of non-bracket characters
     and, in a derive ladder where the verdict sits at the end of a paragraph,
     swallowed the whole paragraph back to the previous digit: it reported a
     Veneziano step's gap as "1968, and the object it turned out to describe...".
     Nothing failed on it -- the parsed magnitude was large, so the row landed in
     the advisory bucket -- which is exactly how a gate quietly stops measuring
     what it says it measures. */
  var GAPTOK = '[\u2212\\-]?[\\d.]+(?:\u00d710\u207b?' + SUPCLASS + '+)?';
  var VERDICT = new RegExp('(' + GAPTOK + '(?:\\s[^\\s()]{1,10}){0,2})\\s*\\(\\s*[^%]*%\\s*[^)]*?agreeing to (\\d+)\\s*figure', 'g');
  /* ...and the form it prints when there is nothing left to resolve. */
  var EXACT = /agree to every digit/;
  var EXACT_FIGS = 99;

  /* Honest exceptions, with the reason each is honest. A whitelist entry is a
     claim about the MATHEMATICS, so it names one and says why -- an entry
     without a reason is how a gate stops meaning anything.
     MASTER-PLAN 3.4 named this one in advance: "whitelist the one honest
     exception (an inverse-square field on a region containing its singularity)
     WITH ITS REASON". It turned out to be four, all the same theorem failing
     the same way, and each is the point of the preset rather than a defect.

     Green's and the divergence theorem both require the field to be defined on
     the WHOLE region, not merely on its boundary. Every field below has a
     singularity at the origin, which the region encloses, so the boundary
     integral is 2π or 4π while the area or volume integral of a curl or
     divergence that vanishes identically off that one point is 0. The gap IS
     the theorem's hypothesis failing, and it is exactly what the demo is for:
     it is where the residue theorem and Gauss's law come from. */
  var ALLOW = {
    'vcGreen|readout|difference':
      'vortex round a circle: curl = 0 off the origin, circulation = 2pi. The hypothesis fails at one point',
    'vcGreen|readout|difference #2':
      'source through a circle: div = 0 off the origin, flux = 2pi. Same puncture, flux form',
    'vcDiverg|readout|difference':
      'inverse-square through a sphere containing it: div = 0 everywhere it is defined, flux = 4pi. Gauss law',
    'vcDiverg|readout|difference #2':
      'the same field through the cylinder, 2pi. Same reason',
    /* Attributed 2026-08-15 from the PRESET-GAP backlog (13 rows measured
       2026-08-14). Each of these is the preset DESIGNED to fail the claim --
       the row is the demonstration, not a defect. The cxMap key carries the
       rendered Wirtinger row verbatim, Unicode and all, WHICH IS WHY THIS
       FILE NOW HAS A UTF-8 BOM -- PS 5.1 reads a BOM-less .ps1 as ANSI and
       the key would silently never match (MASTER-PLAN 1.6, bitten twice). */
    'cxMap|readout||∂f/∂x − (−i)∂f/∂y|':
      'the conj preset is f = z-bar, THE canonical non-holomorphic function: its Wirtinger derivative is 1, so the row reads exactly 2. Cauchy-Riemann failing is what the preset exists to show; every holomorphic preset gives ~0',
    'vcConserv|readout|difference':
      'the rot preset is a rotational field, and the difference between the two path integrals IS its non-conservativity -- curl does not vanish, no potential exists, and the demo is the counterexample the conservative presets are contrasted against',
    'igDoubleRect|readout|error at m':
      'a LOWER Riemann sum at m rectangles is exact only for f = 1 (the measured best preset) and deliberately inexact for f = x and f = xy -- the row is labelled "error" because watching it fall as m doubles is the demo',
    'igDoubleRect|readout|error at 2m':
      'the same error at twice the rectangles -- kept beside the first so the reader sees it roughly halve, which is the first-order convergence the stage teaches'
  };

  /* ---- collection --------------------------------------------------------- */
  /* claims[key] = {min, max, worstAt, bestAt, gapAt}, key = stage|surface|label */
  var claims = {}, rows = [], nRead = 0, nCombo = 0, nDemo = 0, capped = 0;
  var host = document.createElement('div');
  document.body.appendChild(host);

  function note(key, figs, gapTxt, at){
    var c = claims[key];
    if (!c) { c = claims[key] = { min: figs, max: figs, worstAt: at, bestAt: at, gapAt: gapTxt }; }
    if (figs < c.min) { c.min = figs; c.worstAt = at; c.gapAt = gapTxt; }
    if (figs > c.max) { c.max = figs; c.bestAt = at; }
  }

  function scan(id, where, html, at){
    if (!html) return;
    nRead++;
    host.innerHTML = html;
    /* labelled rows first: the label is what makes a claim the SAME claim
       across presets, which is the whole basis of the PRESET-GAP test */
    /* THE LABEL IS NOT A KEY ON ITS OWN, and assuming it was cost this script
       its first negative control. vcGreen's readout carries THREE rows labelled
       "difference" -- the circulation form, the flux form and the planimeter --
       so all three collapsed into one claim, and min/max were taken across
       quantities that have nothing to do with each other. Corrupting the
       planimeter by 5% changed nothing the gate reported, because the merged
       claim was already at min=0 from the circulation row beside it. The
       ordinal of the label WITHIN the surface separates them, and it is stable
       across presets because the card order is. */
    var kvs = host.querySelectorAll('.kv'), seenKv = 0, nth = {};
    for (var j = 0; j < kvs.length; j++) {
      var k = kvs[j].querySelector('.k'), v = kvs[j].querySelector('.v');
      if (!k || !v) continue;
      var lab = (k.textContent || '').trim().slice(0, 60);
      var val = (v.textContent || '').trim();
      VERDICT.lastIndex = 0;
      var m = VERDICT.exec(val);
      var hit = m || EXACT.test(val);
      if (!hit) continue;
      nth[lab] = (nth[lab] || 0) + 1;
      var key = id + '|' + where + '|' + lab + (nth[lab] > 1 ? ' #' + nth[lab] : '');
      seenKv++;
      if (m) note(key, parseInt(m[2], 10), m[1].trim(), at);
      else note(key, EXACT_FIGS, '0', at);
    }
    /* a chip is bare <div>s, and a derive ladder is prose -- neither has kv
       rows, and both print verdicts. Key those on the surface plus the position
       of the match, so the same claim lines up across presets. */
    var txt = (host.textContent || '').replace(/\s+/g, ' ');
    var mm, n = 0;
    VERDICT.lastIndex = 0;
    while ((mm = VERDICT.exec(txt)) !== null) {
      n++;
      if (seenKv >= n) continue;    /* already counted as a kv row */
      note(id + '|' + where + '|#' + n, parseInt(mm[2], 10), mm[1].trim(), at);
    }
  }

  function surfaces(id, at){
    var S = STAGES[id];
    if (!S) return;
    scan(id, 'readout', S.readout ? S.readout(ST) : '', at);
    scan(id, 'chip',    S.chip    ? S.chip(ST)    : '', at);
    try { scan(id, 'derive', S.derive ? drvRender(S.derive(ST)) : '', at); } catch (e) {}
    try { scan(id, 'legend', S.legend ? (S.legend(ST) || []).map(function(r){
            return '<div>' + (r && r[1] || '') + '</div>'; }).join('') : '', at); } catch (e) {}
  }

  /* ---- the preset space --------------------------------------------------- */
  /* A preset is a segmented control in the stage's own panel. They are what
     picks the surface, the field, the law, the lattice -- the choices the
     fourteen defects hid behind. The View panel is excluded: it changes the
     picture, never the arithmetic. */
  function segsNow(){
    var out = [], dock = document.getElementById('dock');
    if (!dock) return out;
    var segs = dock.querySelectorAll('.seg[id]');
    for (var i = 0; i < segs.length; i++) {
      if (segs[i].closest('#pvPanel')) continue;
      var bs = segs[i].querySelectorAll('button[data-v]');
      if (bs.length < 2) continue;
      var vals = [];
      for (var j = 0; j < bs.length; j++) vals.push(bs[j].dataset.v);
      out.push({ id: segs[i].id, vals: vals });
    }
    return out;
  }

  var COMBO_CAP = 48;   /* bounds the product; recorded when it bites */

  /* ---- the sweep ---------------------------------------------------------- */
  var wings = Object.keys(WINGS);
  for (var wi = 0; wi < wings.length; wi++) {
    var w = wings[wi];
    var groups = WINGS[w].groups || [];
    for (var gi = 0; gi < groups.length; gi++) {
      var items = groups[gi].items || [];
      for (var ii = 0; ii < items.length; ii++) {
        var key = gi + '.' + ii;
        try {
          plGo({ w: w, d: key, c: {} });
          if (!stageActive()) continue;
          var id = S.stage;

          /* PRUNE. Only a stage that prints a verdict at all is worth sweeping,
             and 114 of the 178 never do. Measured on the default view first. */
          var before = 0; for (var kk in claims) before++;
          surfaces(id, w + ' ' + key + ' (default)');
          var after = 0; for (var kk2 in claims) after++;
          if (after === before) continue;
          nDemo++;

          /* every combination of the stage's segmented presets */
          var segs = segsNow();
          if (!segs.length) continue;
          var total = 1;
          for (var s = 0; s < segs.length; s++) total *= segs[s].vals.length;
          if (total > COMBO_CAP) { capped++; total = COMBO_CAP; }

          for (var c = 0; c < total; c++) {
            var n2 = c, label = [], ok = true;
            for (var s2 = 0; s2 < segs.length; s2++) {
              var vals = segs[s2].vals;
              var pick = vals[n2 % vals.length];
              n2 = Math.floor(n2 / vals.length);
              /* a segmented click can rebuild the panel, so the control has to
                 be looked up again every time rather than held across the loop */
              try { plWrite(segs[s2].id, pick); } catch (e) { ok = false; }
              label.push(segs[s2].id + '=' + pick);
            }
            if (!ok) continue;
            nCombo++;
            surfaces(id, w + ' ' + key + ' ' + label.join(' '));
            /* the reader's own case is held to the same standard (SITE-RULES
               1.5), and 55 stages answer it with a different panel entirely */
            var Sx = STAGES[id];
            if (Sx && (Sx.readoutOwn || Sx.chipOwn || Sx.deriveOwn)) {
              var was = ST.own;
              try { ST.own = true; surfaces(id, w + ' ' + key + ' ' + label.join(' ') + ' own'); }
              catch (eo) {}
              ST.own = was;
            }
          }
          plGo({ w: w, d: key, c: {} });   /* leave it as we found it */
        } catch (ex) {
          rows.push('THREW\t' + w + ' ' + key + '\t' + String(ex && ex.message || ex).slice(0, 70));
        }
      }
    }
  }

  /* ---- the verdicts ------------------------------------------------------- */
  var nFalse = 0, nPreset = 0, nWeak = 0, nClaim = 0;
  for (var ck in claims) {
    if (!Object.prototype.hasOwnProperty.call(claims, ck)) continue;
    nClaim++;
    var c = claims[ck];
    if (ALLOW[ck]) continue;
    var mag = magnitude(c.gapAt);

    /* FALSE-SCALE: the routes agree to round-off, and the panel says otherwise */
    if (c.min <= 2 && isFinite(mag) && mag <= 1e-10) {
      nFalse++;
      rows.push('FALSE-SCALE\t' + ck + '\tfigs=' + c.min + ' gap=' + c.gapAt + '\tat ' + c.worstAt);
      continue;
    }
    /* PRESET-GAP: the same claim is exact somewhere and poor here */
    if (c.max >= 9 && c.min <= 2) {
      nPreset++;
      rows.push('PRESET-GAP\t' + ck + '\tbest=' + (c.max === 99 ? 'exact' : c.max) +
                ' at ' + c.bestAt + '\tworst=' + c.min + ' gap=' + c.gapAt + ' at ' + c.worstAt);
      continue;
    }
    if (c.min <= 2) {
      nWeak++;
      rows.push('weak\t' + ck + '\tfigs=' + c.min + ' gap=' + c.gapAt + '\tat ' + c.worstAt);
    }
  }

  var t = document.createElement('div');
  t.id = 'REPORT';
  t.textContent = rows.join('\n') +
    '\n#demos=' + nDemo + ' combos=' + nCombo + ' renders=' + nRead + ' claims=' + nClaim +
    ' falsescale=' + nFalse + ' presetgap=' + nPreset + ' weak=' + nWeak +
    ' capped=' + capped + ' errs=' + window.__errs.length;
  document.body.appendChild(t);
}, 900);
</script></body></html>
'@

$out = Join-Path $dir 'apptest-sides.html'
Set-Content -Path $out -Value ($head + $body + $tail) -Encoding utf8

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$url    = 'file:///' + ($out -replace '\\','/')
# Chrome logs benign device-enumeration noise to stderr on some machines, and
# under ErrorActionPreference=Stop that kills the pipeline before the DOM is
# saved -- which reads as "the gate passed" if nobody looks. Hence the window.
$ErrorActionPreference = 'Continue'
& $chrome --headless --disable-gpu --no-sandbox --window-size=1680,1000 --virtual-time-budget=900000 `
          --user-data-dir="$(Join-Path $dir 'cprof-sides')" --dump-dom $url |
  Out-File (Join-Path $dir 'dom-sides.txt') -Encoding utf8
$ErrorActionPreference = 'Stop'

$dom = Get-Content (Join-Path $dir 'dom-sides.txt') -Raw -Encoding UTF8
$marker = 'id="REPORT">'
$a = $dom.IndexOf($marker)
if ($a -lt 0) { Write-Output 'NO REPORT - the page never reached the probe.'; exit 1 }
$a += $marker.Length
$b = $dom.IndexOf('</div>', $a)
$rep = $dom.Substring($a, $b - $a).Replace('&lt;','<').Replace('&gt;','>').Replace('&amp;','&')

# THE BASELINE, AND WHY THIS IS A RATCHET RATHER THAN A BARE THRESHOLD.
#
# The first run found 10 FALSE-SCALE and 14 PRESET-GAP over 791 preset
# combinations. FALSE-SCALE is now 0: the whole class was fixed the same day by
# fmtAgreeGross plus a gross for each vanishing integral, and the baseline is
# set to 0 so a single new one fails the build.
#
# PRESET-GAP stays a ratchet. Failing on all fourteen would leave the build red
# until every one had been attributed -- and attribution is the expensive half:
# a PRESET-GAP is equally the signature of a REAL defect and of a demo
# deliberately showing where a theorem's hypothesis fails. cxMap's conjugate
# preset MUST break Cauchy-Riemann, and vcConserv's rotational field MUST fail
# to have a potential; those are the lesson, not a bug. Whitelisting sixteen
# rows unattributed would have been worse than measuring none of them.
#
# So the numbers below are what was on the site the day this script was written,
# and the gate fails on any INCREASE. A new defect of either class is caught the
# moment it lands, which is what a gate is for; the standing backlog is
# MASTER-PLAN 3.4, and each row comes off it as it is attributed and fixed.
# LOWER THESE as they are cleared -- a baseline that is never tightened is a
# backlog with a nice name.
$BASE_FALSE  = 0
$BASE_PRESET = 9

$false_ = -1; $preset = -1
foreach ($line in ($rep -split "`n")) {
  $line = $line.TrimEnd()
  if (-not $line) { continue }
  if ($line.StartsWith('#')) {
    Write-Output $line
    if ($line -match 'falsescale=(\d+)') { $false_ = [int]$Matches[1] }
    if ($line -match 'presetgap=(\d+)')  { $preset = [int]$Matches[1] }
    continue
  }
  Write-Output ('  ' + ($line -replace "`t", '  '))
}

if ($false_ -lt 0 -or $preset -lt 0) {
  Write-Output ''
  Write-Output 'auditsides FAILED: the probe produced no counts, so nothing was measured.'
  exit 1
}

Write-Output ''
Write-Output "baseline: falsescale $false_/$BASE_FALSE  presetgap $preset/$BASE_PRESET"

if ($false_ -gt $BASE_FALSE -or $preset -gt $BASE_PRESET) {
  # each term clamped at zero: an IMPROVEMENT in one class must not net off a
  # regression in the other, which once printed "FAILED: 0 claim(s) MORE"
  $bad = [Math]::Max(0, $false_ - $BASE_FALSE) + [Math]::Max(0, $preset - $BASE_PRESET)
  Write-Output ''
  Write-Output "auditsides FAILED: $bad claim(s) MORE than the recorded baseline."
  Write-Output '  FALSE-SCALE - the two routes agree to round-off and the panel reports a large'
  Write-Output '                RELATIVE gap, because fmtAgree derives its scale as max(|a|,|b|)'
  Write-Output '                and both routes vanished. Give the site the scale the cancellation'
  Write-Output '                came from -- section 2.1: a ratio of two small numbers is not a'
  Write-Output '                measurement, and needs a floor tied to the physics.'
  Write-Output '  PRESET-GAP  - the same claim is exact on one preset and poor on another. The'
  Write-Output '                routes are the same code either way, so attribute the difference'
  Write-Output '                before whitelisting it. Add it to ALLOW only WITH ITS REASON.'
  exit 1
}
Write-Output 'auditsides OK'
Write-Output ''
Write-Output 'The `weak` rows above are ADVISORY. A claim that agrees to few figures on EVERY'
Write-Output 'preset is usually the point of the demo -- a 14-slice Riemann sum, 40 000 Monte'
Write-Output 'Carlo darts, a saddle point at N = 2 -- and failing on those would teach the'
Write-Output 'reader to ignore this gate. Read them by hand when the list changes.'
