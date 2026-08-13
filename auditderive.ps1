# auditderive.ps1 — measure the derivation ladders, stage by stage.
#
# AI-GUIDE is explicit that "a ladder that only restates the algebra is not worth
# adding — the drvSay rungs are the point, they carry what a textbook leaves to a
# lecturer." Every one of the 178 stages has a ladder, and until now nothing had
# checked whether that rule was actually being kept. Opinion does not scale to 178
# stages, so this measures instead.
#
# Per stage it reports: how many numbered steps, how many drvSay rungs, the total
# and shortest prose, and whether the ladder ends on a `note`. Four things are
# flagged, each with a reason:
#
#   NOSAY    no drvSay at all — the ladder is pure algebra by the guide's own test
#   THIN     fewer than two drvSay rungs, or under 150 words of prose in total
#   STUB     a drvSay under 18 words — too short to be carrying an idea
#   ECHO     a drvSay whose words are mostly already in its own label, i.e. it
#            restates the heading instead of saying anything the heading did not
#
# STUB was first set at 25 words and then at 30, and both were wrong. Reading the
# eleven rungs they caught settled it: "an antisymmetric 4×4 array has six
# independent entries, and electromagnetism has exactly six field components" is
# twenty-six words and is the best sentence on that stage. Brevity is not the
# defect the guide warns about — restating the algebra is, and ECHO is the flag
# that measures that. The threshold now sits where a rung is too short to contain
# a claim at all, and `shortest` is still reported as data either way.
#
# ECHO is the one worth explaining. A rung labelled "the sign change is what
# matters" followed by prose saying "the sign change is what matters here" has
# added nothing; measuring the fraction of the prose's distinct words that
# already appear in the label catches exactly that, and catches nothing else.
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
</script>
</head><body>
'@

$tail = @'
<script>
setTimeout(function(){
  var rows = [];
  // Every word, not only the long ones. Counting just the words over three
  // letters made a 260-word explanation read as "120", and the first run of this
  // script flagged all 178 ladders as thin on that arithmetic alone. The ECHO
  // test still uses the long words only, because "the", "and" and "is" appearing
  // in both a heading and its prose says nothing about either.
  function words(s){
    return String(s || '').replace(/<[^>]*>/g, ' ').toLowerCase()
      .replace(/[^a-z0-9\u00c0-\u024f ]+/g, ' ').split(/\s+/).filter(function(w){ return w.length > 0; });
  }
  function content(s){
    return words(s).filter(function(w){ return w.length > 4; });
  }
  var ids = Object.keys(STAGES);
  for (var i = 0; i < ids.length; i++) {
    var id = ids[i], d = null, err = '';
    try {
      stageEnter(id);
      stageFrame(0.05);
      d = STAGES[id].derive ? STAGES[id].derive(ST) : null;
    } catch (ex) { err = 'THREW ' + (ex && ex.message ? ex.message : ex); }
    if (err) { rows.push([id, 0, 0, 0, 0, 0, 0, err].join('\t')); continue; }
    if (!d || !d.steps) { rows.push([id, 0, 0, 0, 0, 0, 0, 'NO LADDER'].join('\t')); continue; }
    var steps = 0, says = 0, total = 0, shortest = 1e9, echo = 0;
    for (var k = 0; k < d.steps.length; k++) {
      var s = d.steps[k];
      if (s.prose) {
        says++;
        var w = words(s.prose);
        total += w.length;
        if (w.length < shortest) shortest = w.length;
        // how much of the prose is already in its own heading
        var cw = content(s.prose), lab = content(s.lbl);
        var uniq = {}, hit = 0, n = 0;
        for (var q = 0; q < cw.length; q++) if (!uniq[cw[q]]) { uniq[cw[q]] = 1; n++; if (lab.indexOf(cw[q]) >= 0) hit++; }
        if (n > 2 && hit / n > 0.5) echo++;
      } else steps++;
    }
    if (shortest > 1e8) shortest = 0;
    // The audit can only see the ladder the stage builds in its DEFAULT state.
    // Several derive() bodies branch on a mode the reader chooses, and the other
    // arms are invisible here — igFTC's two parts differ by ninety words and
    // only one of them was ever measured. Recorded rather than worked around:
    // the fix is to look at any stage whose derive() has more than one return.
    var flags = [];
    if (says === 0) flags.push('NOSAY');
    else if (says < 2 || total < 150) flags.push('THIN');
    if (says > 0 && shortest < 18) flags.push('STUB');
    if (echo > 0) flags.push('ECHO' + echo);
    if (!d.note) flags.push('NONOTE');
    rows.push([id, steps, says, total, shortest, echo, (d.note ? 1 : 0), flags.join(',')].join('\t'));
  }
  var t = document.createElement('div');
  t.id = 'REPORT';
  t.textContent = '@@' + rows.join('\n') + '@@';
  document.body.appendChild(t);
}, 700);
</script></body></html>
'@

$out = Join-Path $dir 'apptest-derive.html'
Set-Content -Path $out -Value ($head + $body + $tail) -Encoding utf8

$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$url    = 'file:///' + ($out -replace '\\','/')
& $chrome --headless --disable-gpu --no-sandbox --window-size=1680,1000 --virtual-time-budget=120000 `
          --user-data-dir="$(Join-Path $dir 'cprof-derive')" --dump-dom $url |
  Out-File (Join-Path $dir 'dom-derive.txt') -Encoding utf8

$dom = Get-Content (Join-Path $dir 'dom-derive.txt') -Raw -Encoding UTF8
$a = $dom.IndexOf('id="REPORT">')
if ($a -lt 0) { Write-Output 'NO REPORT — the page never reached the probe.'; exit 1 }
$a += 12
$b = $dom.IndexOf('</div>', $a)
$rep = $dom.Substring($a, $b - $a).Replace('@@','').Replace('&lt;','<').Replace('&gt;','>').Replace('&amp;','&')

$rows = @()
foreach ($line in ($rep -split "`n")) {
  if (-not $line.Trim()) { continue }
  $f = $line -split "`t"
  $rows += [pscustomobject]@{
    stage = $f[0]; steps = [int]$f[1]; says = [int]$f[2]; words = [int]$f[3]
    shortest = [int]$f[4]; echo = [int]$f[5]; note = [int]$f[6]
    # Trim: the report arrives through a file that may carry CRLF, and a lone
    # carriage return left on the end of an empty flags field is a truthy string,
    # so every clean ladder was being listed as a problem.
    flags = ($f[7] -replace '\s','')
  }
}
$rows | Export-Csv (Join-Path $dir 'audit-derive.csv') -NoTypeInformation -Encoding UTF8

$bad = $rows | Where-Object { $_.flags }
Write-Output ("ladders={0}  steps={1}  says={2}  prose words={3}" -f $rows.Count,
  ($rows | Measure-Object steps -Sum).Sum, ($rows | Measure-Object says -Sum).Sum,
  ($rows | Measure-Object words -Sum).Sum)
Write-Output ("median says/ladder = {0}   median words/ladder = {1}" -f
  ($rows | Sort-Object says)[[int]($rows.Count/2)].says,
  ($rows | Sort-Object words)[[int]($rows.Count/2)].words)
foreach ($k in @('NOSAY','THIN','STUB','ECHO','NONOTE','THREW','NO LADDER')) {
  $n = ($rows | Where-Object { $_.flags -like "*$k*" }).Count
  if ($n) { Write-Output ("  {0,-10} {1}" -f $k, $n) }
}
if ($bad) {
  Write-Output ''
  foreach ($r in ($bad | Sort-Object words)) {
    Write-Output ("  {0,-22} steps={1,-3} says={2,-3} words={3,-5} shortest={4,-4} {5}" -f
      $r.stage, $r.steps, $r.says, $r.words, $r.shortest, $r.flags)
  }
}
Write-Output ''
Write-Output ("flagged={0}  {1}" -f $bad.Count, $(if ($bad.Count) { 'REVIEW' } else { 'OK' }))
