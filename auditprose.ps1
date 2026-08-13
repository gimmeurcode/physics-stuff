# auditprose.ps1 — the inventory of results the essays ASSERT rather than derive.
#
# The roadmap listed this as "no inventory exists", and an inventory is what it
# needs to be: a list with locations, not a verdict. The essays are allowed to
# assert things — an introductory paragraph that promises what is coming, a
# forward reference to a wing that has not been written yet — and deciding which
# assertions are acceptable is a judgement. What can be automated is finding them
# all and putting them in one place, and that is what this does.
#
# It reads the harvest `audittext.ps1` already produces, so it costs a second and
# needs no browser of its own. Run audittext first if the build has changed.
#
# Three kinds of hit, all phrase-based:
#
#   HANDWAVE   "it can be shown", "one can prove", "it turns out that", "beyond
#              the scope", "we shall not prove" — the essay is explicitly
#              declining to justify something. These are the real inventory.
#   BARE       "clearly", "obviously", "it is easy to see", "trivially" — the
#              reader is being told a step is easy instead of being shown it,
#              which is the single most reliable way to lose one.
#   NAKED      a named theorem invoked with no statement card anywhere in that
#              wing's essay. The formal layer exists precisely so a named result
#              can be pointed at; a name with nothing behind it is a gap.
#
# NAKED is the one worth explaining. auditscan already counts how many statement
# cards each wing carries. This asks a different question — whether the *specific*
# results the prose leans on are among them — by looking for "<Name>'s theorem",
# "the <Name> theorem" and similar, and checking the wing's cards for that name.
#
# Saved with a UTF-8 BOM — PowerShell 5.1 reads a BOM-less .ps1 as ANSI.

$ErrorActionPreference = 'Stop'
$dir = $PSScriptRoot
$dumpPath = Join-Path $dir 'audittext-dump.json'
if (-not (Test-Path $dumpPath)) { Write-Output 'no audittext-dump.json — run ./audittext.ps1 first'; exit 1 }
$data = Get-Content $dumpPath -Raw -Encoding UTF8 | ConvertFrom-Json

$handwave = @(
  'it can be shown', 'it may be shown', 'can be shown that', 'one can show',
  'one can prove', 'it can be proved', 'it turns out', 'it happens that',
  'beyond the scope', 'outside the scope', 'we shall not prove', 'without proof',
  'we omit the proof', 'the proof is omitted', 'a longer argument', 'take it on trust',
  'accept this for now', 'is left to the reader', 'as an exercise'
)
$bare = @(
  'clearly', 'obviously', 'evidently', 'it is easy to see', 'easy to check',
  'trivially', 'it is immediate', 'it follows at once', 'plainly', 'of course'
)

# Every statement card in the whole site, so a name invoked in one wing can be
# distinguished from a name nothing anywhere states. A wing mentioning Gauss's law
# in passing does not need its own card for it — the em wing has one, and that is
# a cross-reference rather than a gap. A name with no card ANYWHERE is the gap.
$allCards = ''
foreach ($row in $data.rows) {
  if ($row.kind -ne 'theory') { continue }
  foreach ($s in @($row.stmts)) { $allCards += ' ' + [string]$s.title }
}
$allCards = $allCards.ToLower()

$rows = @()
foreach ($row in $data.rows) {
  if ($row.kind -ne 'theory') { continue }
  $t = [string]$row.text
  if (-not $t) { continue }
  $lower = $t.ToLower()
  foreach ($grp in @(@{ n='HANDWAVE'; p=$handwave }, @{ n='BARE'; p=$bare })) {
    foreach ($phrase in $grp.p) {
      $from = 0
      while ($true) {
        $i = $lower.IndexOf($phrase, $from)
        if ($i -lt 0) { break }
        $s = [Math]::Max(0, $i - 90)
        $len = [Math]::Min($t.Length - $s, 210)
        $rows += [pscustomobject]@{
          wing = $row.wing; kind = $grp.n; phrase = $phrase
          context = ($t.Substring($s, $len) -replace '\s+', ' ')
        }
        $from = $i + $phrase.Length
      }
    }
  }
  # ---- NAKED: a named result the essay leans on, with no card carrying its name
  $names = @{}
  # ASCII only in the pattern. An en dash written literally here becomes mojibake
  # the moment PowerShell reads this file as ANSI, and a mojibake regex is a parse
  # error rather than a wrong answer - so hyphens and en dashes go in as escapes.
  $namePat = "(?:the\s+)?([A-Z][a-zA-Z']+(?:[–−-]\s?[A-Z][a-zA-Z']+)?)(?:'s)?\s+(theorem|law|principle|identity|inequality|lemma|rule|criterion)"
  foreach ($m in [regex]::Matches($t, $namePat)) {
    $nm = ($m.Groups[1].Value + ' ' + $m.Groups[2].Value)
    if ($m.Groups[1].Value -in @('The','This','That','A','An','Its','His','Her','Their','It','And','But','So','If','When','One','Every','Each','Same','Second','First','Third','Both','Two','Three','Not','No')) { continue }
    if (-not $names.ContainsKey($nm)) { $names[$nm] = 0 }
    $names[$nm]++
  }
  $cardText = ''
  foreach ($s in @($row.stmts)) { $cardText += ' ' + [string]$s.title + ' ' + [string]$s.kind }
  $cardLower = $cardText.ToLower()
  foreach ($nm in $names.Keys) {
    $key = ($nm -split '\s+')[0].ToLower().TrimEnd("'s")
    if ($key.Length -lt 4) { continue }
    if ($cardLower.Contains($key)) { continue }
    # a card somewhere else in the site is a cross-reference, not a gap
    $kind = if ($allCards.Contains($key)) { 'ELSEWHERE' } else { 'NAKED' }
    $rows += [pscustomobject]@{
      wing = $row.wing; kind = $kind; phrase = $nm
      context = if ($kind -eq 'NAKED') { "invoked $($names[$nm])x; no statement card anywhere in the site carries that name" }
                else { "invoked $($names[$nm])x here; a card for it exists in another wing, so this is a cross-reference" }
    }
  }
}

$rows | Export-Csv (Join-Path $dir 'audit-prose.csv') -NoTypeInformation -Encoding UTF8

$byKind = $rows | Group-Object kind | Sort-Object Name
Write-Output ("essays scanned : {0}" -f (@($data.rows | Where-Object { $_.kind -eq 'theory' })).Count)
foreach ($g in $byKind) { Write-Output ("  {0,-9} {1}" -f $g.Name, $g.Count) }
Write-Output ''
foreach ($g in $byKind) {
  Write-Output ("=== {0} ===" -f $g.Name)
  foreach ($r in ($g.Group | Sort-Object wing)) {
    Write-Output ("  {0,-14} {1}" -f $r.wing, $r.phrase)
    if ($r.kind -ne 'NAKED') { Write-Output ("                 …{0}…" -f $r.context) }
  }
  Write-Output ''
}
Write-Output ("total = {0}   -> audit-prose.csv" -f $rows.Count)
