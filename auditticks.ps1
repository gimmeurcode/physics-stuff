# auditticks.ps1 -- can every axis on the site be read as a scale?
#
# WHY THIS EXISTS. ctGrid (61a) and pvDrawAxes (59c) labelled ticks with
# fmtNum(v, 3|4), whose precision is a CONSTANT -- and below 1 fmtNum counts
# decimals, not figures (the J9 clamp). Any axis whose span is ~0.01 or less
# therefore collapsed adjacent ticks into one string: the statmech speed
# distribution's density axis read 0.002, 0.002, 0.002, 0.002, 0.001 ... on
# screen, ten ticks with three distinct labels. This lives in canvas text,
# which no other gate can read -- auditsize sweeps shapes, auditscan reads the
# HTML harvest, runall reads panels. Only a screenshot showed it (2026-08-15).
#
# THE FIX IT GUARDS. fmtTick(v, step) in 10-math.js derives the label's
# precision from the step between ticks, so adjacent ticks cannot print the
# same string; both axis owners use it and nothing else may label a tick.
#
# WHAT IS MEASURED -- the EFFECT, not the cause. fillText is wrapped on the
# canvas prototype, every string drawn in the 10px tick font is recorded with
# its alignment and position, over every stage's live frame. Right-aligned
# strings at one x form a y-axis column; centred strings at one y form an
# x-axis row. The same string twice in one column or row, at positions more
# than 3px apart, is a defect: two ticks one label. Legends and canvas tables
# use larger fonts and are invisible here by construction.
#
# TWO CONTROLS IN EVERY RUN, per MASTER-PLAN 3.10 rule 3:
#   good : the real ctGrid on a 0..0.0025 window must produce no duplicate
#   bad  : the OLD labelling (fmtNum(v,3)) replayed on that window must be
#          flagged -- a gate never seen to fail is not known to work
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

$probe = @'
<script>
setTimeout(function(){
  var REC = null;
  var origFill = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function(text, x, y){
    if (REC) {
      var p = { x:x, y:y };
      try { p = this.getTransform().transformPoint({ x:x, y:y }); } catch (e) {}
      REC.push({ t:String(text), x:p.x, y:p.y, a:this.textAlign, f:String(this.font || '') });
    }
    return origFill.apply(this, arguments);
  };

  // Duplicates within ONE axis. Naive column-matching drowned in false
  // positives: two stacked plots share a label column, two side-by-side plots
  // share a row, and diagram annotations reuse the 10px font. Three filters
  // recover the real signal:
  //   numeric   only strings that read as numbers are tick labels
  //   adjacent  ticks are monotone, so a precision collapse produces EQUAL
  //             NEIGHBOURS -- equal strings far apart are different plots
  //   near      the pair must sit one tick apart (under 2.5x the column's
  //             median spacing, or 60px when the column is too short to vote)
  var NUM = /^[−-]?\d+(\.\d+)?(×10.*)?$/;
  function dupes(rec){
    var out = [], by = {}, i, k, r;
    for (i = 0; i < rec.length; i++) {
      r = rec[i];
      if (r.f.indexOf('10px') !== 0) continue;
      if (!NUM.test(r.t)) continue;
      if (r.a === 'right')       k = 'y@' + Math.round(r.x);
      else if (r.a === 'center') k = 'x@' + Math.round(r.y);
      else continue;
      (by[k] = by[k] || []).push(r);
    }
    for (k in by) {
      var col = by[k], vert = k.charAt(0) === 'y';
      col.sort(function(a, b){ return vert ? a.y - b.y : a.x - b.x; });
      var seps = [];
      for (i = 1; i < col.length; i++)
        seps.push(Math.abs(vert ? col[i].y - col[i-1].y : col[i].x - col[i-1].x));
      seps.sort(function(a, b){ return a - b; });
      var med = seps.length >= 3 ? seps[Math.floor(seps.length / 2)] : 0;
      var near = med > 0 ? med * 2.5 : 60;
      for (i = 1; i < col.length; i++) {
        var d = Math.abs(vert ? col[i].y - col[i-1].y : col[i].x - col[i-1].x);
        if (col[i].t === col[i-1].t && d > 3 && d < near)
          out.push(k + ' adjacent ticks both "' + col[i].t + '"');
      }
    }
    return out;
  }

  // J6: the readout chip floats over the canvas top-left, and a stage heading
  // drawn under it is illegible -- the rule in src/js/CLAUDE.md ("centre it,
  // or start below it") had no gate. Any recorded text whose anchor falls
  // inside the visible chip's rectangle (in canvas coordinates) is a finding.
  function underChip(rec){
    var chip = document.getElementById('chip');
    var cv = document.getElementById('cv');
    if (!chip || !cv || !chip.offsetParent || !(chip.textContent || '').trim()) return [];
    var cr = chip.getBoundingClientRect(), vr = cv.getBoundingClientRect();
    var scale = cv.width / vr.width;   // canvas backing pixels per CSS pixel
    var L = (cr.left - vr.left) * scale, T = (cr.top - vr.top) * scale;
    var R = (cr.right - vr.left) * scale, B = (cr.bottom - vr.top) * scale;
    // Headings and captions only (>= 11px): the 10px tick/annotation layer
    // brushes the chip zone on a third of the site and always has -- the rule
    // in src/js/CLAUDE.md governs HEADINGS ("centre it, or start below it").
    var out = [], seen = {};
    for (var i = 0; i < rec.length; i++) {
      var r = rec[i];
      if (/^(9|10)(\.\d+)?px/.test(r.f.replace(/^\d+ /, ''))) continue;
      if (r.x > L + 4 && r.x < R - 4 && r.y > T + 4 && r.y < B - 4) {
        if (seen[r.t]) continue;
        seen[r.t] = 1;
        out.push('under chip: "' + r.t.slice(0, 40) + '"');
      }
    }
    return out;
  }

  var rows = [], findings = 0, stagesBad = 0, labels = 0;
  var ids = Object.keys(STAGES);
  for (var s = 0; s < ids.length; s++) {
    var id = ids[s];
    try {
      stageEnter(id);
      // steady state first: one unrecorded frame computes the stage's numbers,
      // the chip refresh writes them, and only then are frames recorded --
      // recording against the pre-compute chip flagged titles that self-correct
      // within one live chip refresh.
      stageFrame(0.016);
      try { updateStageChip(); } catch (e3) {}
      REC = [];
      stageFrame(0.016); stageFrame(0.016);
      var f = dupes(REC).concat(underChip(REC));
      labels += REC.length;
      REC = null;
      if (f.length) {
        findings += f.length; stagesBad++;
        rows.push(id + '\t' + f.slice(0, 4).join(' ; ') + (f.length > 4 ? ' ; +' + (f.length - 4) : ''));
      }
      stageExit();
    } catch (ex) {
      REC = null;
      rows.push(id + '\tTHREW\t' + String(ex && ex.message || ex).slice(0, 60));
      findings++;
      try { stageExit(); } catch (e2) {}
    }
  }

  // ---- controls: the real renderer must pass, the old rule must fail ----
  var cv = document.getElementById('cv');
  var ctx = cv.getContext('2d');
  var P = mkPlot(60, 40, 400, 300, 0, 1400, 0, 0.0025);
  REC = [];
  ctGrid(ctx, P);
  var ctlGood = dupes(REC).length;
  REC = [];
  (function(){                       // the labelling that shipped before fmtTick
    var sy = ctNiceStep(P.y1 - P.y0);
    ctx.save(); ctx.font = '10px ' + FONT_MONO; ctx.textAlign = 'right';
    for (var y = Math.ceil(P.y0 / sy) * sy; y <= P.y1; y += sy)
      if (Math.abs(y) > 1e-9) ctx.fillText(fmtNum(y, 3), P.px - 6, P.Y(y));
    ctx.restore();
  })();
  var ctlBad = dupes(REC).length;
  REC = null;

  // control for the chip half: a heading drawn dead centre of the visible
  // chip must be flagged, or that check is blind too.
  var ctlChip = 0;
  try {
    stageEnter(ids[0]);
    stageFrame(0.016);
    try { updateStageChip(); } catch (e4) {}
    var chip = document.getElementById('chip'), vr = cv.getBoundingClientRect();
    if (chip && chip.offsetParent) {
      var cr = chip.getBoundingClientRect(), sc = cv.width / vr.width;
      REC = [];
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.font = '600 12.5px x';
      ctx.fillText('control heading', ((cr.left + cr.right) / 2 - vr.left) * sc,
                                      ((cr.top + cr.bottom) / 2 - vr.top) * sc);
      ctx.restore();
      ctlChip = underChip(REC).length;
      REC = null;
    }
    stageExit();
  } catch (e5) { REC = null; try { stageExit(); } catch (e6) {} }

  var t = document.createElement('div');
  t.id = 'REPORT';
  t.textContent = rows.join('\n') +
    '\nCTL\treal ctGrid on a 0..0.0025 window: duplicates=' + ctlGood + ' (want 0)' +
    '\nCTL\told fmtNum(v,3) labels on the same window: duplicates=' + ctlBad + ' (must be >0 or the gate is blind)' +
    '\nCTL\ta heading drawn at the chip centre: flagged=' + ctlChip + ' (must be >0 or the chip check is blind)' +
    '\n#stages=' + ids.length + ' ticklabels=' + labels + ' findings=' + findings +
    ' stagesbad=' + stagesBad + ' ctlgood=' + ctlGood + ' ctlbad=' + ctlBad +
    ' ctlchip=' + ctlChip + ' errs=' + window.__errs.length;
  document.body.appendChild(t);
}, 1200);
</script></body></html>
'@

$out = Join-Path $dir 'apptest-ticks.html'
Set-Content -Path $out -Value ($head + $body + $probe) -Encoding utf8
$url = 'file:///' + ($out -replace '\\','/')
# Chrome writes to stderr for reasons that are not failures; see MASTER-PLAN 3.4.
$ErrorActionPreference = 'Continue'
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless --disable-gpu --no-sandbox `
  --window-size=1680,1000 --virtual-time-budget=600000 `
  --user-data-dir="$(Join-Path $dir 'cprof-ticks')" --dump-dom $url |
  Out-File (Join-Path $dir 'dom-ticks.txt') -Encoding utf8
$ErrorActionPreference = 'Stop'

$dom = Get-Content (Join-Path $dir 'dom-ticks.txt') -Raw -Encoding UTF8
$m = 'id="REPORT">'
$a = $dom.IndexOf($m)
if ($a -lt 0) { Write-Output 'NO REPORT - the page never reached the probe.'; exit 1 }
$a += $m.Length
$b = $dom.IndexOf('</div>', $a)
$rep = $dom.Substring($a, $b - $a).Replace('&lt;','<').Replace('&gt;','>').Replace('&amp;','&')

$summary = ''
foreach ($line in ($rep -split "`n")) {
  $line = $line.TrimEnd()
  if (-not $line) { continue }
  if ($line.StartsWith('CTL' + "`t")) { Write-Output ('  control: ' + $line.Substring(4)); continue }
  if ($line.StartsWith('#')) { Write-Output ''; Write-Output $line; $summary = $line; continue }
  Write-Output ('  ' + ($line -replace "`t", '  '))
}

if ($summary -match 'findings=(\d+).*ctlgood=(\d+).*ctlbad=(\d+).*ctlchip=(\d+)') {
  $f = [int]$Matches[1]; $cg = [int]$Matches[2]; $cb = [int]$Matches[3]; $cc = [int]$Matches[4]
  if ($f -eq 0 -and $cg -eq 0 -and $cb -gt 0 -and $cc -gt 0) { Write-Output 'auditticks OK'; exit 0 }
  if ($cb -eq 0) { Write-Output 'auditticks FAILED: the duplicate-label control was not flagged - that check is blind' }
  elseif ($cc -eq 0) { Write-Output 'auditticks FAILED: the under-chip control was not flagged - that check is blind' }
  else { Write-Output 'auditticks FAILED' }
  exit 1
}
Write-Output 'auditticks FAILED: no summary line'
exit 1
