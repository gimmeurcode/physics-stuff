# auditcustom.ps1 — drive the "type your own" path on every stage that offers it.
#
# runall.ps1 proves each demo runs as the author set it up. This proves the
# reader can pose their own question: for every stage carrying a `custom` option
# it selects that option, types a real formula into every expression box and a
# real number into every bound, and then asserts the stage still computes.
#
# It exists because that path broke twice in one afternoon and neither break was
# visible to any other script: an accessor whose own table lookup had been
# rewritten into a call to itself recursed until the stack gave out, and a
# branch testing `st.key === 'disk'` silently took the wrong arm once `custom`
# became a possible key. Both throw or blank the panel the moment the option is
# actually exercised, and nothing was exercising it.
#
# Saved with a UTF-8 BOM — PowerShell 5.1 reads a BOM-less .ps1 as ANSI and the
# Unicode below becomes mojibake that fails to parse.

param([int]$From = 0, [int]$To = 99999)

$ErrorActionPreference = 'Stop'
$dir  = $PSScriptRoot
$body = Get-Content (Join-Path $dir 'vector-calculus.html') -Raw -Encoding UTF8

$head = @'
<!doctype html><html data-theme="dark"><head><meta charset="utf-8">
<script>
window.__errs = [];
window.addEventListener('error', function(e){ window.__errs.push(e.message + ' @' + e.lineno + ':' + e.colno); });
window.addEventListener('unhandledrejection', function(e){ window.__errs.push('promise: ' + e.reason); });
</script>
</head><body>
'@

$tail = @'
<script>
setTimeout(function(){
  var log = [], stages = 0, pickers = 0, boxes = 0, bad = 0;
  // DO NOT ADD A WALL-CLOCK BUDGET HERE. Chrome runs this page under
  // --virtual-time-budget, which VIRTUALISES the clock: time advances only
  // while the page is idle, so Date.now() returns the same value throughout a
  // synchronous sweep, every deadline test is dead code that reads like a
  // safeguard, and every stage is reported as taking 0 ms. One was written
  // that way on 2026-08-19 and never fired. The bound that does work is a
  // bound on the WORK -- the pass cap in the mode loop below -- and the way to
  // locate a hang is -From/-To, which found one in a single run.
  function txt(id){ var e = document.getElementById(id); return e ? e.textContent.replace(/\s+/g,' ') : ''; }
  // one formula per variable set the boxes might declare
  // Deliberately odd constants: the formula typed must not coincide with any
  // stage's own default, or "nothing changed" would be true for the innocent
  // reason that nothing was asked to change.
  //
  // Four sets rather than one, cycled across the boxes of a stage, because
  // paired slots given identical text degenerate: an inner and an outer radius
  // that are the same function bound an EMPTY region, and then changing the
  // density really does change nothing and the check fires on an innocent
  // stage. x(t) and y(t) given the same formula collapse to the line y = x for
  // the same reason. The sets are structurally different, not merely rescaled,
  // so no pair of them is proportional either.
  var FORMS = [
    { x:'0.37*x^2 + sin(1.7*x)',   y:'0.37*sin(1.7*x)*cos(y)',    z:'0.37*x*y + 1.3*z^2',      t:'1.3*cos(t) + 0.37*t' },
    { x:'0.9 + 0.3*cos(x)',        y:'0.8 + 0.25*x*cos(y)',       z:'0.6 + 0.2*x*y*z',         t:'0.8*sin(1.4*t) - 0.2*t' },
    { x:'1.1*x - 0.4',             y:'1.1*x - 0.4*y',             z:'x + 0.5*y - 0.3*z',       t:'0.5*t^2 - 1.1' },
    { x:'exp(-0.5*x^2) + 0.2',     y:'exp(-0.5*(x^2+y^2)) + 0.2', z:'exp(-0.3*(x^2+y^2+z^2))', t:'exp(-0.2*t)*cos(t)' }
  ];
  function formulaFor(el, k){
    var F = FORMS[k % FORMS.length];
    // A box may say what it will accept, exactly as a textarea does. A box that
    // takes a complex number, a list, a netlist -- anything that is not an
    // expression -- correctly REJECTS the formulas above, and a rejected edit is
    // indistinguishable here from a box nobody wired. Three read as unwired on
    // 2026-08-19 for that reason alone, all in one new wing.
    var da = el.getAttribute('data-audit');
    if (da) return da;
    var hint = (el.getAttribute('aria-label') || '') + ' ' + (el.id || '');
    // Not every box takes an expression. The least-squares stage takes a list of
    // data points, and typing a formula into it is correctly rejected — which
    // looked exactly like an unwired box until the harness learned to read the
    // field's own label and offer it something it can accept.
    if (/points/i.test(hint)) return '0.2,1.1  1.4,2.4  2.6,2.9  3.8,4.7  4.9,5.1';
    if (/z/.test(hint) && /y/.test(hint)) return F.z;
    if (/y/.test(hint)) return F.y;
    if (/\bt\b/.test(hint)) return F.t;
    return F.x;
  }
  // Every segmented control on the panel that offers a "type your own" option,
  // identified by its OWN id rather than by the button. Two picker shapes offer
  // the same thing: a table-backed picker carries the literal value `custom`,
  // and a source-backed one carries a formula as its value, because that is what
  // choosing it assigns. Both label the chip identically, so match on either.
  //
  // The id is what matters. Choosing an option rebuilds the whole panel, so any
  // element captured beforehand is detached by the time the next one is wanted;
  // the ids survive the rebuild and can be re-found.
  function customSegs(){
    var out = [], segs = document.querySelectorAll('#stageBody .seg');
    for (var i = 0; i < segs.length; i++) {
      if (!segs[i].id) continue;
      var bs = segs[i].querySelectorAll('[data-v]');
      for (var j = 0; j < bs.length; j++) {
        if (bs[j].getAttribute('data-v') === 'custom' ||
            /your own/i.test(bs[j].textContent || '')) { out.push(segs[i].id); break; }
      }
    }
    return out;
  }
  function customBtn(segId){
    var seg = document.getElementById(segId);
    if (!seg) return null;
    var bs = seg.querySelectorAll('[data-v]');
    for (var j = 0; j < bs.length; j++)
      if (bs[j].getAttribute('data-v') === 'custom' ||
          /your own/i.test(bs[j].textContent || '')) return bs[j];
    return null;
  }
  // Every segmented control that is NOT one of those pickers is a MODE switch,
  // and the value is packed into the key rather than looked up in a selector: a
  // source-backed option carries a whole formula as its `data-v`, which is not
  // safe to interpolate into one. MODESEP cannot occur in either half.
  var MODESEP = String.fromCharCode(1);
  function modeSegs(){
    var out = [], segs = document.querySelectorAll('#stageBody .seg');
    var cust = {}, cs = customSegs();
    for (var c = 0; c < cs.length; c++) cust[cs[c]] = 1;
    for (var i2 = 0; i2 < segs.length; i2++) {
      if (!segs[i2].id || cust[segs[i2].id]) continue;
      var bs = segs[i2].querySelectorAll('[data-v]');
      for (var j2 = 0; j2 < bs.length; j2++)
        out.push(segs[i2].id + MODESEP + bs[j2].getAttribute('data-v'));
    }
    return out;
  }
  function modeBtn(key){
    var p = key.split(MODESEP), seg = document.getElementById(p[0]);
    if (!seg) return null;
    var bs = seg.querySelectorAll('[data-v]');
    for (var j3 = 0; j3 < bs.length; j3++)
      if (bs[j3].getAttribute('data-v') === p[1]) return bs[j3];
    return null;
  }
  function mlabel(key){ return (key === null) ? '' : '[' + key.split(MODESEP).join('=') + '] '; }
  try {
    document.getElementById('home').classList.remove('open');
    var ids = Object.keys(STAGES);
    ids = ids.slice(__FROM__, __TO__);   // a slice, for bisecting a hang
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i], before = window.__errs.length, notes = [];
      try {
        stageEnter(id);
        for (var f = 0; f < 3; f++) stageFrame(0.05);
        // ...in every MODE the stage can be put into, breadth-first, because a
        // switch can reveal a picker that reveals another switch. `stageEnter`
        // opens a stage in its DEFAULT mode, so a typed box living behind a mode
        // switch — sixteen of the relativity editors are built that way — was
        // rendered by no pass here and audited by nothing at all. The cap stops a
        // stage with several independent switches becoming a combinatorial sweep.
        var queue = [null], qseen = {}, qi = 0;
        var seen = {}, kf = 0, seenSeg = {}, counted = false, mkey = null;
        while (qi < queue.length && qi < 10) {
          mkey = queue[qi++];
          if (mkey !== null) {
            var mb = modeBtn(mkey);            // from wherever the last pass left it:
            if (!mb) continue;                 // a compound state is MORE coverage, not less,
            mb.click();                        // and re-entering 185 stages per mode is minutes
            stageFrame(0.05);
          }
          var ms = modeSegs();
          for (var mm = 0; mm < ms.length; mm++)
            if (!qseen[ms[mm]]) { qseen[ms[mm]] = 1; queue.push(ms[mm]); }
          // A stage may carry more than one — the general-regions stage has a
          // region picker AND an integrand picker — and taking only the first left
          // the others completely unexercised, which is the same blind spot this
          // script was written to close, one level down.
          var segIds = customSegs();
          // A stage may put its expression box on the panel permanently rather than
          // behind a picker — the least-squares stage takes a typed list of data
          // points that way, and it is the keyboard route into a stage that is
          // otherwise pointer-only. No picker means no click, but the box still has
          // to be wired, so it is exercised through the same path with no chip to
          // press first.
          // Not every reader-supplied thing fits on one line. The circuit bench
          // takes a netlist — several lines of text — in a textarea, which is not
          // a `.fld input` and was therefore invisible to every check here. A
          // textarea says what it wants typed into it with `data-audit`, because
          // no generic formula could possibly be valid for a format that is not
          // an expression.
          var areas = document.querySelectorAll('#stageBody textarea[data-audit]');
          var bare = !segIds.length &&
                     (document.querySelectorAll('#stageBody .fld input').length > 0 || areas.length > 0);
          if (!segIds.length && !bare) continue;    // this stage offers no custom path
          if (bare) segIds = [null];
          if (!counted) { counted = true; stages++; }
          for (var sg = 0; sg < segIds.length; sg++) {
            var sk2 = (segIds[sg] === null) ? '(bare)' : segIds[sg];
            if (!seenSeg[sk2]) { seenSeg[sk2] = 1; pickers++; }
          }
          for (var s = 0; s < segIds.length; s++) {
            if (segIds[s] !== null) {
              var opt = customBtn(segIds[s]);
              if (!opt) continue;                   // an earlier choice removed this picker
              opt.click();
            }
            for (var f2 = 0; f2 < 3; f2++) stageFrame(0.05);
            // What the stage reported before anything was typed. A box that is
            // rendered but never wired accepts the text and changes nothing — the
            // picture silently stays on the default formula, which no crash test
            // can see. Comparing the readout across the edit is what catches it.
            refreshStageReadout();
            var was = txt('stageReadout') + '|' + txt('chip');
            // only the boxes this choice newly revealed: retyping the ones an
            // earlier picker already holds would change nothing for an innocent
            // reason and report every second picker as unwired
            var all = document.querySelectorAll('#stageBody .fld input'), fresh = [];
            for (var b = 0; b < all.length; b++)
              if (all[b].id && !seen[all[b].id]) { seen[all[b].id] = 1; fresh.push(all[b]); }
            for (var b2 = 0; b2 < fresh.length; b2++) {
              var want = formulaFor(fresh[b2], kf++);
              if (fresh[b2].value === want) {
                notes.push(mlabel(mkey) + (fresh[b2].id || 'a box') +
                           ': its data-audit repeats what the box already shows, so nothing is tested');
                continue;
              }
              fresh[b2].value = want;
              fresh[b2].dispatchEvent(new Event('change'));
              boxes++;
              for (var f3 = 0; f3 < 2; f3++) stageFrame(0.05);
            }
            var ta = document.querySelectorAll('#stageBody textarea[data-audit]'), taN = 0;
            for (var b3 = 0; b3 < ta.length; b3++) {
              if (ta[b3].id && seen[ta[b3].id]) continue;
              if (ta[b3].id) seen[ta[b3].id] = 1;
              // A data-audit that repeats what the box ALREADY shows cannot test
              // anything: typing it changes no state, the readout is identical,
              // and the wiring check below reports a correctly wired box as
              // broken. Two of them did exactly that on 2026-08-19, both because
              // the attribute had been copied from the stage's default preset.
              // Reported rather than silently skipped, because the alternative
              // is a box that no gate exercises and nobody knows it.
              if (ta[b3].value === ta[b3].getAttribute('data-audit')) {
                notes.push(mlabel(mkey) + (ta[b3].id || 'a textarea') +
                           ': data-audit repeats what the box already shows, so nothing here is tested ' +
                           '— give it different (still valid) content');
                continue;
              }
              ta[b3].value = ta[b3].getAttribute('data-audit');
              ta[b3].dispatchEvent(new Event('change'));
              boxes++; taN++;
              for (var f6 = 0; f6 < 2; f6++) stageFrame(0.05);
            }
            if (fresh.length + taN) {
              refreshStageReadout();
              if ((txt('stageReadout') + '|' + txt('chip')) === was)
                notes.push(mlabel(mkey) + (segIds[s] || 'always-visible box') + ': typing changed nothing — ' +
                           (fresh.length + taN) + ' box(es) rendered but apparently not wired');
            }
          }
        }
        if (!counted) continue;                 // no mode of it offers a custom path
        // every bound
        var nums = document.querySelectorAll('#stageBody input.num:not(.sldnum)');
        for (var n = 0; n < nums.length; n++) {
          var q = nums[n];
          q.value = (n % 2) ? '2' : '0';
          q.dispatchEvent(new Event('change'));
          for (var f4 = 0; f4 < 2; f4++) stageFrame(0.05);
        }
        var exprs = document.querySelectorAll('#stageBody .fld input');
        // a formula that does not parse must leave the picture alone, not blank it
        if (exprs.length) {
          var e0 = document.querySelectorAll('#stageBody .fld input')[0];
          if (e0) { e0.value = 'sin('; e0.dispatchEvent(new Event('change')); }
          for (var f5 = 0; f5 < 2; f5++) stageFrame(0.05);
        }
        refreshStageReadout(); updateStageChip(); updateStageLegend();
        var r = txt('stageReadout'), c = txt('chip');
        if (r.length < 20) notes.push('readout collapsed to ' + r.length + ' chars');
        var m = (r + ' ' + c).match(/\b(NaN|undefined|Infinity)\b/);
        if (m) notes.push('non-finite in readout — ' + (r + ' ' + c).match(/.{0,50}(NaN|undefined|Infinity).{0,25}/)[0]);
      } catch (ex) {
        notes.push('THREW ' + (ex && ex.message ? ex.message : ex));
      }
      var errs = window.__errs.slice(before);
      if (errs.length) notes.push('JS error — ' + errs.join(' ;; ').slice(0, 200));
      if (notes.length) { bad++; log.push(id + ' :: ' + notes.join(' | ')); }
    }
  } catch (ex) { log.push('HARNESS :: ' + (ex && ex.stack ? ex.stack : ex)); bad++; }
  var t = document.createElement('div');
  t.id = 'REPORT';
  t.textContent = '@@' + log.join('\n') +
    '\nstages=' + stages + ' pickers=' + pickers + ' boxes=' + boxes +
    ' bad=' + bad + (bad ? ' FAIL' : ' OK') + '@@';
  document.body.appendChild(t);
}, 700);
</script></body></html>
'@

$out = Join-Path $dir 'apptest-custom.html'
Set-Content -Path $out -Value ($head + $body + $tail.Replace('__FROM__', $From).Replace('__TO__', $To)) -Encoding utf8

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$url    = 'file:///' + ($out -replace '\\','/')

# Chrome writes to stderr for reasons that are not failures (USB enumeration, an
# XNNPACK delegate, GCM registration). Under ErrorActionPreference = 'Stop' each
# such line becomes a terminating NativeCommandError and the run dies AFTER the
# sweep and BEFORE the DOM is written, throwing the result away. See MASTER-PLAN
# 3.4. The exit status is still checked below; nothing is being swallowed.
$ErrorActionPreference = 'Continue'
& $chrome --headless --disable-gpu --no-sandbox --window-size=1680,1000 --virtual-time-budget=120000 `
          --user-data-dir="$(Join-Path $dir 'cprof-custom')" --dump-dom $url |
  Out-File (Join-Path $dir 'dom-custom.txt') -Encoding utf8
$ErrorActionPreference = 'Stop'

$dom = Get-Content (Join-Path $dir 'dom-custom.txt') -Raw -Encoding UTF8
$marker = 'id="REPORT">'
$a = $dom.IndexOf($marker)
if ($a -lt 0) { Write-Output 'NO REPORT — the page never reached the probe.'; exit 1 }
$a += $marker.Length
$b = $dom.IndexOf('</div>', $a)
$rep = $dom.Substring($a, $b - $a).Replace('@@','')
Write-Output $rep
if ($rep -match 'FAIL') { exit 1 }
