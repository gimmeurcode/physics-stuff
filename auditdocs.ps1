# auditdocs.ps1 -- do these documents still describe the program?
#
# WHY THIS EXISTS. SITE-RULES.md section 1.9: the documentation is part of the
# site, and moves with it. Nothing in this repository read a .md file, so a
# document could contradict the program indefinitely and every gate stayed
# green. On 2026-08-14 a hand sweep found eight such claims, several of them
# years of sessions old:
#
#   AI-GUIDE.md      said 4175 unit tests in one paragraph and 4207 in another
#   README.md        said 230 modules and 4175 unit tests
#   MASTER-PLAN.md   said 23 harness scripts, and its section 1.6 table -- the
#                    one that exists to say what each gate can see that no other
#                    can -- described 23 of the 25 scripts on disk. auditresid.ps1,
#                    written to enforce SITE-RULES 1.4, appeared in NO document.
#   README.md        documented 11 of the 25 scripts
#   MASTER-PLAN.md   said "all 21 scripts now have distinct profiles"
#
# None of that is cosmetic. The section 1.6 table is how a session decides which
# gate to run, so a gate missing from it is a gate nobody runs.
#
# WHAT IS MEASURED. Four independent questions, none of which any other script
# asks:
#
#   1. COUNTS.  Re-measure the site (smoke.ps1, measure.ps1, runtests.ps1, and a
#      directory listing for the script count), then read every LIVE document and
#      compare every numeric claim it makes against the measurement.
#   2. SCRIPT COVERAGE.  Every *.ps1 on disk must be described in MASTER-PLAN
#      section 1.6 (what it sees), listed in section 4.2 (when to run it), and
#      named in AI-GUIDE.md section 2. And nothing may be documented that does
#      not exist.
#   3. PATHS.  Every file a document names in backticks must exist.
#   4. GENERATED-DOC FRESHNESS.  MAP.md is generated; if a source file is newer
#      than it, it is stale and map.ps1 has not been run.
#
# THE DATED-RECORD RULE, AND WHY IT IS THE RIGHT ESCAPE HATCH. A line carrying a
# YYYY-MM-DD is a record of what was true then, not a claim about now, and is
# skipped. That is honest -- it says WHEN -- and it is the only exemption, so
# the way to silence this gate is to say when you measured, which is exactly the
# behaviour the rule wants. AUDIT.md is dated records throughout and is not
# scanned at all; MAP.md is generated and is checked for freshness instead.
#
# VOLATILE QUANTITIES ARE WARNINGS, NOT FAILURES. The artifact's byte size and
# the source line count change on every edit to any file, so a hard check on
# them would be red during all normal work and would train the reader to ignore
# the gate. They are reported, with drift, and only counted bad past 5%.
#
# PROVING IT CAN FAIL. Corrupt a count in any document -- change "231 modules"
# to "232 modules" in README.md -- and run this. It must report that line. A
# gate never seen to fail is not known to work (SITE-RULES 2.5).
#
# Written ASCII-only so it does not depend on the .ps1 being read as UTF-8.

param(
  [switch]$SkipTests,   # skip runtests.ps1 (~30 s) when it has just been run
  [switch]$Verbose_,    # list every claim checked, not only the bad ones
  [switch]$Fix          # rewrite stale counts in place, and report each one
)

# -Fix EXISTS BECAUSE A RULE NOBODY CAN AFFORD TO FOLLOW IS NOT ENFORCED. The
# eight defects above were not caused by anyone deciding the documents did not
# matter; they were caused by a count moving in one place and needing a hand
# edit in five. -Fix rewrites exactly the digits this script verified and
# nothing else -- never the volatile figures, never prose, never a dated record
# -- and prints every substitution so the diff is reviewable. Run it, read what
# it changed, then read the sentences around each change: a number can be
# corrected automatically, but whether the sentence still MEANS anything is a
# judgement, and SITE-RULES Part 4 is the list of things no machine holds.

$ErrorActionPreference = 'Stop'
$dir = $PSScriptRoot

# ---------------------------------------------------------------- 1. MEASURE

Write-Host "measuring the site..."

$m = @{}

$smokeOut = & (Join-Path $dir 'smoke.ps1')
$smokeTxt = ($smokeOut | Out-String)
foreach($k in 'wings','stages','seelinks','homecards'){
  if($smokeTxt -match ("{0}=(\d+)" -f $k)){ $m[$k] = [int]$Matches[1] }
}

$measureOut = & (Join-Path $dir 'measure.ps1')
$measureTxt = ($measureOut | Out-String)
foreach($pair in @(
    @('groups',      'groups\s+(\d+)'),
    @('experiments', 'experiments\s+(\d+)'),
    @('stagedriven', 'stagedriven\s+(\d+)'),
    @('modules',     'modules\s+(\d+)'),
    @('sourcelines', 'source lines\s+(\d+)'),
    @('mkplot',      'mkPlot sites\s+(\d+)'),
    @('bytes',       'artifact\s+([\d,]+) bytes'))){
  if($measureTxt -match $pair[1]){
    $m[$pair[0]] = [int](($Matches[1]) -replace '[, ]','')
  }
}

if(-not $SkipTests){
  $testsTxt = (& (Join-Path $dir 'runtests.ps1') | Out-String)
  if($testsTxt -match '(\d+) passed'){ $m['tests'] = [int]$Matches[1] }
}

$scriptFiles = @(Get-ChildItem -Path $dir -Filter '*.ps1' | Sort-Object Name)
$m['scripts'] = $scriptFiles.Count

foreach($k in ($m.Keys | Sort-Object)){ Write-Host ("  {0,-12} {1}" -f $k, $m[$k]) }

# ---------------------------------------------------------------- 2. THE DOCS

# LIVE documents -- every undated claim in these must be true today.
# AUDIT.md is deliberately absent: it is an append-only record of dated entries.
# MAP.md is deliberately absent: it is generated, and checked for freshness below.
$live = @(
  'CLAUDE.md', 'AI-GUIDE.md', 'MASTER-PLAN.md', 'README.md', 'SITE-RULES.md',
  'src/js/CLAUDE.md'
) | Where-Object { Test-Path (Join-Path $dir $_) }

# Each claim: a regex whose first group is the number, and the measured key it
# must equal. Patterns are deliberately anchored on TOTAL phrasing -- "103
# stages" inside "161 live plots across 103 stages" is a subset, not a total,
# and must not be flagged. Where a subset reads like a total, date the line.
#
# EVERY PATTERN IS ANCHORED ON *TOTAL* PHRASING. This is the whole craft of the
# check, and the first version got it wrong in seven places. "22 wings" is
# Programme C's backlog, "0 wings without one" is a coverage result, "8-20
# guided experiments" is a per-wing target, "465 call sites" belongs to ctPath
# rather than mkPlot, and "2 862 160 bytes/s" is DOM churn, not the artifact.
# None of them is a claim about a total, and a gate that cries wolf on them
# would be switched off within a session. When in doubt, match less: a missed
# claim is a gap, a false one is a reason to stop trusting the gate.
$claims = @(
  @{ key='wings';       rx='\bwings=(\d+)';                                      what='wings' },
  @{ key='wings';       rx='\ball\s+(?:of\s+)?(\d+)\s+wings\b';                  what='wings' },
  @{ key='wings';       rx='\b(\d+)\s+wings,\s+\d+\s+guided experiments';        what='wings (headline)' },
  @{ key='stages';      rx='\ball\s+(\d+)\s+stages\b';                           what='stages' },
  @{ key='stages';      rx='\b(\d+)\s+canvas stages\b';                          what='canvas stages' },
  @{ key='stages';      rx='\bof\s+(?:the\s+)?(\d+)\s+stages\b';                 what='stages' },
  @{ key='stages';      rx='\bstages=(\d+)';                                     what='stages' },
  # U+2013 (en dash) is written as a regex escape, never typed: this file has no
  # BOM, PowerShell 5.1 reads a BOM-less .ps1 as ANSI, and a typed one arrives
  # as mojibake that silently never matches. "8-20 guided experiments" is a
  # per-wing target, not a total, and the lookbehind is what excludes it.
  @{ key='experiments'; rx='(?<![-\u2013])\b(\d+)\s+guided experiments\b'; what='guided experiments' },
  @{ key='experiments'; rx='\ball\s+(\d+)\s+experiments\b';                      what='experiments' },
  @{ key='groups';      rx='\b(\d+)\s+demo groups\b';                            what='demo groups' },
  @{ key='modules';     rx='\b(\d+)\s+(?:source\s+)?modules\b';                  what='modules' },
  @{ key='modules';     rx='\bThere are (\d+) of them\b';                        what='modules' },
  @{ key='tests';       rx='\b(\d+)\s+(?:engine\s+)?unit tests\b';               what='unit tests' },
  @{ key='tests';       rx='\b(\d+)\s+passed\b';                                 what='tests passed' },
  @{ key='scripts';     rx='\b(\d+)\s+(?:harness\s+)?scripts\b';                 what='harness scripts' },
  @{ key='seelinks';    rx='\bseelinks=(\d+)';                                   what='see-links' },
  @{ key='mkplot';      rx='\b(\d+)\s+call sites\**\s+in\b';                     what='mkPlot call sites' },
  @{ key='mkplot';      rx='\b(\d+)\s+calls to it\b';                            what='mkPlot call sites' }
)

# Volatile: reported with drift, bad only past this fraction. "bytes/s" is
# excluded by the trailing boundary -- it is a rate, not a size.
$volatile = @(
  @{ key='bytes';       rx='\b(\d[\d, ]{5,}\d)\s+bytes(?![/\w])'; what='artifact bytes'; tol=0.05 },
  @{ key='sourcelines'; rx='~\s*(\d[\d, ]{4,}\d)\s+\(all';        what='source lines';   tol=0.05 }
)

# Documents legitimately name files that were deleted on purpose, and saying so
# is the point of the sentence. These three were folded into MASTER-PLAN.md on
# 2026-08-12; naming them is history, not a broken reference.
$goneOnPurpose = @('ROADMAP.md', 'TIER-THREE-ITEMS.md', 'SYLLABUS.md')

$bad  = @()
$warn = @()
$nChecked = 0

$DATE = '\b20\d\d-\d\d-\d\d\b'

foreach($rel in $live){
  $path  = Join-Path $dir $rel
  $lines = Get-Content $path -Encoding UTF8
  $headingDated = $false     # is the nearest preceding heading a dated one?

  for($i = 0; $i -lt $lines.Count; $i++){
    $line = $lines[$i]

    # A heading carrying a date makes its whole section a dated record -- that
    # is how the before/after tables in sections 3.5 and 3.9 are written, and
    # their rows are single lines that could not carry the date themselves.
    # Any later heading, dated or not, ends the exemption.
    if($line -match '^#{1,6}\s'){ $headingDated = ($line -match $DATE); continue }

    # THE ONLY EXEMPTION: a dated line, or a line inside a dated section, is a
    # record of what was true then rather than a claim about now.
    if($headingDated){ continue }
    if($line -match $DATE){ continue }

    foreach($c in $claims){
      if(-not $m.ContainsKey($c.key)){ continue }
      foreach($hit in [regex]::Matches($line, $c.rx)){
        $nChecked++
        $said = [int]($hit.Groups[1].Value -replace '[, ]','')
        if($said -ne $m[$c.key]){
          $bad += [pscustomobject]@{
            file=$rel; line=($i+1); kind=$c.what
            said=$said; actual=$m[$c.key]; text=$hit.Value
            # -Fix needs the exact span of the DIGITS, not of the whole match,
            # so the surrounding words are never touched.
            pos=$hit.Groups[1].Index; len=$hit.Groups[1].Length; fixable=$true
          }
        } elseif($Verbose_){
          Write-Host ("  ok  {0}:{1}  {2} = {3}" -f $rel,($i+1),$c.what,$said)
        }
      }
    }

    foreach($c in $volatile){
      if(-not $m.ContainsKey($c.key)){ continue }
      foreach($hit in [regex]::Matches($line, $c.rx)){
        $said = [double](($hit.Groups[1].Value) -replace '[, ]','')
        $real = [double]$m[$c.key]
        if($real -le 0){ continue }
        $drift = [Math]::Abs($said - $real) / $real
        if($drift -gt $c.tol){
          $bad += [pscustomobject]@{
            file=$rel; line=($i+1); kind=($c.what + (" (drift {0:P1})" -f $drift))
            said=[int]$said; actual=[int]$real; text=$hit.Value
          }
        } elseif($drift -gt 0){
          $warn += ("{0}:{1}  {2} says {3}, now {4} ({5:P1} drift -- inside tolerance)" -f `
                    $rel,($i+1),$c.what,[int]$said,[int]$real,$drift)
        }
      }
    }
  }
}

# ------------------------------------------------- 3. SCRIPT COVERAGE

# A gate missing from the section 1.6 table is a gate nobody runs, so each
# script must appear in all three places that route a reader to it.
$mpTxt   = Get-Content (Join-Path $dir 'MASTER-PLAN.md') -Raw -Encoding UTF8
$aiTxt   = Get-Content (Join-Path $dir 'AI-GUIDE.md')    -Raw -Encoding UTF8

function Section([string]$text, [string]$from, [string]$to){
  $a = $text.IndexOf($from)
  if($a -lt 0){ return '' }
  $b = $text.IndexOf($to, $a + $from.Length)
  if($b -lt 0){ $b = $text.Length }
  return $text.Substring($a, $b - $a)
}

$sec16 = Section $mpTxt '## 1.6' '## 1.7'
$sec42 = Section $mpTxt '## 4.2' '## 4.3'
if($sec16 -eq ''){ $bad += [pscustomobject]@{ file='MASTER-PLAN.md'; line=0; kind='structure'; said=0; actual=0; text='section 1.6 not found -- the gate table moved or was renamed' } }
if($sec42 -eq ''){ $bad += [pscustomobject]@{ file='MASTER-PLAN.md'; line=0; kind='structure'; said=0; actual=0; text='section 4.2 not found -- the when-to-run table moved or was renamed' } }

foreach($s in $scriptFiles){
  $n = $s.Name
  if($sec16 -notmatch [regex]::Escape($n)){
    $bad += [pscustomobject]@{ file='MASTER-PLAN.md'; line=0; kind='undocumented script'
      said=0; actual=0; text=("{0} is not in the section 1.6 table (what it sees that nothing else can)" -f $n) }
  }
  if($sec42 -notmatch [regex]::Escape($n)){
    $bad += [pscustomobject]@{ file='MASTER-PLAN.md'; line=0; kind='unrouted script'
      said=0; actual=0; text=("{0} is not in the section 4.2 table (when to run it)" -f $n) }
  }
  if($aiTxt -notmatch [regex]::Escape($n)){
    $bad += [pscustomobject]@{ file='AI-GUIDE.md'; line=0; kind='unlisted script'
      said=0; actual=0; text=("{0} is not in the AI-GUIDE.md loop" -f $n) }
  }
}

# ------------------------------------------------- 4. PATHS THAT MUST EXIST

# Every file a document names in backticks. Function names, ids and prose are
# not paths, so this matches only tokens carrying a known extension.
$srcJs = @{}
foreach($f in (Get-ChildItem -Path (Join-Path $dir 'src') -Recurse -File)){ $srcJs[$f.Name] = $true }

$missing = @{}
foreach($rel in ($live + @('AUDIT.md'))){
  $path = Join-Path $dir $rel
  if(-not (Test-Path $path)){ continue }
  $lines = Get-Content $path -Encoding UTF8
  for($i = 0; $i -lt $lines.Count; $i++){
    foreach($hit in [regex]::Matches($lines[$i], '`([A-Za-z0-9_./-]+\.(?:ps1|md|js|css|html|json))`')){
      $name = $hit.Groups[1].Value
      $leaf = [System.IO.Path]::GetFileName($name)
      $ok = (Test-Path (Join-Path $dir $name)) -or
            $srcJs.ContainsKey($leaf) -or
            (Test-Path (Join-Path $dir ("src/" + $name))) -or
            # relative to the document's own directory: src/js/CLAUDE.md says `../../AI-GUIDE.md`
            (Test-Path (Join-Path (Split-Path (Join-Path $dir $rel) -Parent) $name)) -or
            ($goneOnPurpose -contains $leaf)
      # apptest-*/dom-* are harness scratch files, regenerated on demand
      if($name -match '^(apptest|dom|shot|audit|smokedom)' -and $name -notmatch '\.ps1$'){ $ok = $true }
      if(-not $ok){
        $key = "$rel|$name"
        if(-not $missing.ContainsKey($key)){
          $missing[$key] = $true
          $bad += [pscustomobject]@{ file=$rel; line=($i+1); kind='missing file'
            said=0; actual=0; text=("names ``{0}``, which does not exist" -f $name) }
        }
      }
    }
  }
}

# ------------------------------------------------- 5. GENERATED-DOC FRESHNESS

$mapPath = Join-Path $dir 'MAP.md'
if(Test-Path $mapPath){
  $mapAge  = (Get-Item $mapPath).LastWriteTimeUtc
  $newer = @(Get-ChildItem -Path (Join-Path $dir 'src') -Recurse -File |
             Where-Object { $_.LastWriteTimeUtc -gt $mapAge })
  if($newer.Count -gt 0){
    $bad += [pscustomobject]@{ file='MAP.md'; line=0; kind='stale generated doc'
      said=$newer.Count; actual=0
      text=("{0} source file(s) are newer than MAP.md -- run ./map.ps1 (newest: {1})" -f `
            $newer.Count, ($newer | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1).Name) }
  }
}

# ------------------------------------------------- FIX (optional)

if($Fix){
  $fixable = @($bad | Where-Object { $_.fixable })
  if($fixable.Count -eq 0){
    Write-Host "nothing to fix -- every count claim already agrees with the site."
  } else {
    Write-Host "rewriting stale counts:"
    foreach($grp in ($fixable | Group-Object file)){
      $path  = Join-Path $dir $grp.Name
      $lines = Get-Content $path -Encoding UTF8
      # Apply right-to-left within each line so earlier spans keep their offsets.
      foreach($f in ($grp.Group | Sort-Object line, @{Expression='pos'; Descending=$true})){
        $idx = $f.line - 1
        $old = $lines[$idx]
        $lines[$idx] = $old.Substring(0, $f.pos) + [string]$f.actual + $old.Substring($f.pos + $f.len)
        Write-Host ("  {0}:{1}  {2}: {3} -> {4}" -f $grp.Name, $f.line, $f.kind, $f.said, $f.actual)
      }
      Set-Content -Path $path -Value $lines -Encoding UTF8
    }
    Write-Host ""
    Write-Host "READ THE DIFF. A corrected number in a sentence that no longer means"
    Write-Host "anything is still a defect -- see SITE-RULES.md Part 4."
    $bad = @($bad | Where-Object { -not $_.fixable })
  }
}

# ------------------------------------------------- REPORT

Write-Host ""
if($warn.Count -gt 0){
  Write-Host "within tolerance:"
  foreach($w in $warn){ Write-Host ("  ~ " + $w) }
  Write-Host ""
}

if($bad.Count -gt 0){
  Write-Host "FINDINGS:"
  foreach($b in ($bad | Sort-Object file, line)){
    if($b.said -ne 0 -and $b.actual -ne 0){
      Write-Host ("  {0}:{1}  {2}: document says {3}, the site says {4}   [{5}]" -f `
                  $b.file, $b.line, $b.kind, $b.said, $b.actual, $b.text)
    } else {
      Write-Host ("  {0}:{1}  {2}: {3}" -f $b.file, $b.line, $b.kind, $b.text)
    }
  }
  Write-Host ""
}

# A GREEN THAT DID NOT CHECK EVERYTHING MUST SAY SO. -SkipTests leaves the unit
# count unmeasured, so claims about it are skipped silently -- and a run that
# printed "bad=0 OK" while a document said 4111 tests would be worse than no
# gate at all. This was found by corrupting three counts and watching only two
# be reported.
$unmeasured = @()
foreach($c in $claims){ if(-not $m.ContainsKey($c.key)){ $unmeasured += $c.key } }
$unmeasured = @($unmeasured | Sort-Object -Unique)
if($unmeasured.Count -gt 0){
  Write-Host ("NOT CHECKED (unmeasured this run): {0}" -f ($unmeasured -join ', '))
  Write-Host  "  run without -SkipTests for a complete pass."
  Write-Host ""
}

Write-Host ("auditdocs: docs={0} claims={1} bad={2}{3}{4}" -f `
            $live.Count, $nChecked, $bad.Count,
            $(if($unmeasured.Count -gt 0){' partial'}else{''}),
            $(if($bad.Count -eq 0){' OK'}else{''}))
if($bad.Count -gt 0){ exit 1 }
