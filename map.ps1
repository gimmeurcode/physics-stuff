# Regenerates MAP.md — the mechanical index of the source tree.
#
# MAP.md is derived, never hand-edited: it lists every module, what each one
# defines, which stage lives where, and which file holds each wing's demos and
# prose. Run this after adding, splitting or renaming any module.
#
#   ./map.ps1
#
$ErrorActionPreference = 'Stop'
$dir = $PSScriptRoot
$js  = Join-Path $dir 'src\js'
$enc = New-Object System.Text.UTF8Encoding($false)
# backtick is PowerShell's escape character, so markdown code spans are built
# from this rather than written inline
$TICK = [string][char]96

$files = @(Get-ChildItem $js -Filter '*.js')
[Array]::Sort($files, [System.Comparison[System.IO.FileInfo]]{
  param($a, $b) [System.String]::CompareOrdinal($a.Name, $b.Name) })

function Symbols($text) {
  $out = New-Object System.Collections.Generic.List[string]
  foreach ($m in [regex]::Matches($text, '(?m)^(?:const|let|var)\s+([A-Za-z_$][\w$]*)')) { $out.Add($m.Groups[1].Value) }
  foreach ($m in [regex]::Matches($text, '(?m)^function\s+([A-Za-z_$][\w$]*)'))          { $out.Add($m.Groups[1].Value + '()') }
  $out
}

$rows    = New-Object System.Collections.Generic.List[object]
$stageAt = [ordered]@{}
$total   = 0

foreach ($f in $files) {
  $t = [System.IO.File]::ReadAllText($f.FullName, $enc)
  $lines = ($t -split "`n").Count
  $total += $lines
  $syms = Symbols $t
  $stages = @([regex]::Matches($t, '(?m)^STAGES\.([\w$]+)\s*=') | ForEach-Object { $_.Groups[1].Value })
  foreach ($s in $stages) { $stageAt[$s] = $f.Name }
  # the first comment line that is not a rule of equals signs describes the file
  $desc = ''
  foreach ($l in ($t -split "`n" | Select-Object -First 8)) {
    $c = $l.Trim(" `t/*")
    if ($c -and $c -notmatch '^=+$' -and $c -notmatch '^-+$') { $desc = $c.TrimEnd('*/ '); break }
  }
  $rows.Add([pscustomobject]@{
    Name = $f.Name; KB = [math]::Round($f.Length / 1KB, 1); Lines = $lines
    Desc = $desc; Stages = $stages; Syms = $syms
  })
}

# ---- wing registry ------------------------------------------------------
# Resolved from the data, not from filenames: a filename match on a short wing
# id like "em" also hits "d-em-os", which produced a wrong and confident table.
# Instead follow the real references — wing -> *_GROUPS const -> defining file,
# and wing -> THEORY_* const -> defining file.

# symbol -> file, from what each module actually declares
$declaredIn = @{}
foreach ($r in $rows) {
  foreach ($s in $r.Syms) { $name = $s.TrimEnd('()'); if (-not $declaredIn.ContainsKey($name)) { $declaredIn[$name] = $r.Name } }
}
# stage id -> file, collected above in $stageAt

$reg = Join-Path $js '72zz-wings-registry.js'
$wings = New-Object System.Collections.Generic.List[object]
if (Test-Path $reg) {
  $rt = [System.IO.File]::ReadAllText($reg, $enc)
  # titles may be single- or double-quoted: the em wing's contains an apostrophe
  $pat = "(?m)^\s{2}(\w+):\s*\{\s*\r?\n\s*glyph:\s*'([^']*)',\s*title:\s*(?:'([^']*)'|""([^""]*)"")"
  foreach ($m in [regex]::Matches($rt, $pat)) {
    $id    = $m.Groups[1].Value
    $title = if ($m.Groups[3].Success) { $m.Groups[3].Value } else { $m.Groups[4].Value }

    # the wing's block runs to the next wing key or the closing brace
    $blk = $rt.Substring($m.Index)
    $nxt = [regex]::Match($blk.Substring(1), "(?m)^\s{2}\w+:\s*\{|^\};")
    if ($nxt.Success) { $blk = $blk.Substring(0, $nxt.Index + 1) }

    # groups: LIMIT_GROUPS   or   groups: [...A_GROUPS, ...B_GROUPS]
    $gnames = @([regex]::Matches($blk, '\b([A-Z][A-Z0-9_]*_GROUPS?)\b') | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique)
    $gfiles = @($gnames | ForEach-Object { $declaredIn[$_] } | Where-Object { $_ } | Select-Object -Unique)

    # stages the wing uses: read them out of the files that define its groups
    $sfiles = New-Object System.Collections.Generic.List[string]
    foreach ($gf in $gfiles) {
      $gt = [System.IO.File]::ReadAllText((Join-Path $js $gf), $enc)
      foreach ($sm in [regex]::Matches($gt, "stage:\s*'([\w$]+)'")) {
        $sid = $sm.Groups[1].Value
        if ($stageAt.Contains($sid) -and -not $sfiles.Contains($stageAt[$sid])) { $sfiles.Add($stageAt[$sid]) }
      }
    }
    $wings.Add([pscustomobject]@{
      Id = $id; Glyph = $m.Groups[2].Value; Title = $title
      Demos = ($gfiles -join ', '); Stages = (($sfiles | Sort-Object) -join ', '); Prose = ''
    })
  }
}
# prose: THEORY_BY_WING in 82-ui-wings.js maps each wing to its essay constant
$uw = Join-Path $js '82-ui-wings.js'
if (Test-Path $uw) {
  $ut = [System.IO.File]::ReadAllText($uw, $enc)
  foreach ($m in [regex]::Matches($ut, '(?m)^\s*(\w+):\s*\(\)\s*=>\s*\[\s*(THEORY[\w]*)')) {
    $w = $wings | Where-Object { $_.Id -eq $m.Groups[1].Value }
    if ($w) { $w.Prose = $declaredIn[$m.Groups[2].Value] }
  }
}
# openTheory() falls back to the bare THEORY constant for any wing not listed in
# THEORY_BY_WING — that is how the vector wing gets its essay
foreach ($w in $wings) {
  if (-not $w.Prose) { $w.Prose = $declaredIn['THEORY'] + ' (default)' }
}

# ---- emit ---------------------------------------------------------------
$sb = New-Object System.Text.StringBuilder
function W($s) { [void]$sb.AppendLine($s) }

W '<!-- GENERATED BY map.ps1 — DO NOT EDIT BY HAND. Run ./map.ps1 to refresh. -->'
W '# MAP — where everything lives'
W ''
W ("Generated {0} from {1} modules, {2} source lines." -f (Get-Date -Format 'yyyy-MM-dd'), $files.Count, $total)
W ''
W 'Read `AI-GUIDE.md` first for how to change things; this file only says where they are.'
W ''
W '## Wings'
W ''
W '| wing id | glyph | title | demos in | stages in | prose in |'
W '|---|---|---|---|---|---|'
foreach ($w in $wings) {
  W ('| {6}{0}{6} | {1} | {2} | {3} | {4} | {5} |' -f $w.Id, $w.Glyph, $w.Title, $w.Demos, $w.Stages, $w.Prose, $TICK)
}
W ''
W '> Resolved by following real references — the wing''s `groups:` constants to the'
W '> modules that declare them, each demo''s `stage:` id to the module that defines'
W '> it, and `THEORY_BY_WING` to the essay module. Wings with no `stages in` entry'
W '> are driven by the field engine rather than by canvas stages.'
W ''
W '## Stages'
W ''
W ("{0} canvas experiments, by id." -f $stageAt.Count)
W ''
W '| stage id | file |'
W '|---|---|'
foreach ($k in ($stageAt.Keys | Sort-Object)) { W ('| {2}{0}{2} | {1} |' -f $k, $stageAt[$k], $TICK) }
W ''
W '## Modules'
W ''
W 'Every module in load order — `build.ps1` concatenates them by ordinal filename sort, so the numeric prefix *is* the dependency order.'
W ''
foreach ($r in $rows) {
  W ('### {3}{0}{3} — {1} KB, {2} lines' -f $r.Name, $r.KB, $r.Lines, $TICK)
  if ($r.Desc) { W ('' + $r.Desc) }
  if ($r.Stages.Count) { W ('' ) ; W ('Stages: ' + (($r.Stages | ForEach-Object { '`' + $_ + '`' }) -join ', ')) }
  if ($r.Syms.Count) {
    W ''
    $shown = $r.Syms | Select-Object -First 40
    W ('Defines: ' + (($shown | ForEach-Object { '`' + $_ + '`' }) -join ', ') +
       $(if ($r.Syms.Count -gt 40) { " …and $($r.Syms.Count - 40) more" } else { '' }))
  }
  W ''
}

[System.IO.File]::WriteAllText((Join-Path $dir 'MAP.md'), $sb.ToString(), $enc)
Write-Output ("wrote MAP.md : {0} modules, {1} stages, {2} wings" -f $files.Count, $stageAt.Count, $wings.Count)
