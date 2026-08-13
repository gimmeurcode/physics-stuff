# auditscan.ps1 — read audittext-dump.json and report what a student would see wrong.
#
# Two severities, because the two need different treatment:
#
#   HIGH   never legitimate in rendered output. A caret exponent, "sqrt", "hbar",
#          "<=", "->", a leaked <sub> tag, or the literal word undefined/NaN.
#   CHECK  legitimate in some contexts, wrong in others — a Greek word spelled out
#          ("beta decay" is English; "cos(theta)" is a notation miss), an ASCII *
#          between symbols. Reported with context so a human can judge.
#
# Expression INPUT fields are exempt: `src:` strings the reader types into the
# circuit's arbitrary source are parsed, so ASCII is correct there.
$ErrorActionPreference = 'Stop'
$dir = $PSScriptRoot
$dump = Join-Path $dir 'audittext-dump.json'
if (-not (Test-Path $dump)) { Write-Output 'no audittext-dump.json - run ./audittext.ps1 first'; exit 1 }

# The harvest is a separate file produced by ./audittext.ps1, and this script is
# perfectly happy to read one from last week. That is worse than no check at all:
# it reports a clean bill of health for a build it has never seen. Three sessions
# of work were scanned against a stale dump before anyone noticed the counts had
# stopped moving. Compare the two timestamps and refuse.
$built = Join-Path $dir 'vector-calculus.html'
if (Test-Path $built) {
  $dumpAge  = (Get-Item $dump).LastWriteTimeUtc
  $builtAge = (Get-Item $built).LastWriteTimeUtc
  if ($dumpAge -lt $builtAge) {
    Write-Output ('STALE HARVEST: audittext-dump.json was written ' +
      [Math]::Round(($builtAge - $dumpAge).TotalMinutes, 1) +
      ' minutes before the current build. Run ./audittext.ps1 first — scanning this')
    Write-Output 'would report on text the build no longer contains.'
    exit 1
  }
}

$data = Get-Content $dump -Raw -Encoding UTF8 | ConvertFrom-Json

# things that are genuinely fine and would otherwise shout every run
$exempt = @(
  'Sgr A\*',                       # a real astronomical object
  'sign\(sin\(tau\*f\*t\)\)',      # the circuit's typed-expression example
  'a\^n',                          # shown deliberately as parser input syntax
  'x\^2 \+ y\^2',                  # ditto: the expression-box placeholder
  'sqrt\(max\(0,',                 # the Type I/II region examples, meant to be copied
  'written phi and t',             # the spherical slots naming their own identifiers
  'written t'                      # ditto, for the polar-angle slots
)
function Exempted([string]$s) {
  foreach ($e in $exempt) { if ($s -match $e) { return $true } }
  return $false
}

$high = @(
  @{ n='caret exponent';   p='\^\s*[-+(]?\w' },
  @{ n='sqrt spelled out'; p='(?<![A-Za-z])sqrt\s*\(' },
  @{ n='hbar';             p='(?<![A-Za-z])hbar(?![A-Za-z])' },
  @{ n='theta/phi/psi';    p='(?<![A-Za-z])(theta|phi|psi)(?![A-Za-z])' },
  @{ n='omega';            p='(?<![A-Za-z])omega(?![A-Za-z])' },
  @{ n='+/-';              p='\+/-' },
  @{ n='<= or >=';         p='<=|>=' },
  @{ n='!=';               p='!=' },
  @{ n='-> arrow';         p='->' },
  @{ n='NaN';              p='(?<![A-Za-z])NaN(?![A-Za-z])' },
  @{ n='Infinity';         p='(?<![A-Za-z])Infinity(?![A-Za-z])' },
  @{ n='leaked markup';    p='<(sub|sup|span|i|b|div|br)\b[^>]*>' },
  @{ n='template residue'; p='\$\{' },
  @{ n='ASCII ket/bra';    p='\|(up|down|dn)>' }
)

# "undefined" is legitimate mathematical English in prose — "f is undefined at 0"
# is the correct thing to write. It is only a defect when it reaches a slot that
# is supposed to hold a VALUE, which is what the house rule actually forbids.
$valueOnly = @(
  @{ n='undefined as a value'; p='(?<![A-Za-z])undefined(?![A-Za-z])' }
)
$valueFields = 'readout','chip','legend','probe'

$check = @(
  @{ n='greek word in maths'; p='(?<![A-Za-z])(alpha|beta|gamma|lambda|sigma|epsilon|delta|mu|nu|rho|tau|kappa)\s*[=\(\)\/\^]|[=\(\/\^]\s*(alpha|beta|gamma|lambda|sigma|epsilon|delta|mu|nu|rho|tau|kappa)(?![A-Za-z])' },
  # A star is only suspect next to a DIGIT (2*x, x*3). Adjacent to letters it is
  # almost always correct notation the site uses deliberately — v* for a
  # conjugate transpose, x* for a root, f(x*ᵢ) for a sample point — and flagging
  # those buried the three real findings under thirty-one false ones.
  @{ n='ASCII * as times';    p='\d\s*\*\s*[A-Za-z0-9\(]|[A-Za-z0-9\)]\s*\*\s*\d' },
  @{ n='deg spelled out';     p='(?<![A-Za-z])deg(?![A-Za-z])' }
  # dy/dx is standard mathematical notation, not an ASCII stand-in. The rule that
  # flagged it produced 86 false positives and no true ones, so it is gone.
)

$findings = @()
function Scan($row, $field, $text, $sev, $rules) {
  if (-not $text) { return }
  if (Exempted $text) { return }
  foreach ($r in $rules) {
    $m = [regex]::Matches($text, $r.p)
    if ($m.Count -gt 0) {
      $i = [Math]::Max(0, $m[0].Index - 45)
      $len = [Math]::Min(110, $text.Length - $i)
      $script:findings += [pscustomobject]@{
        sev=$sev; rule=$r.n; wing=$row.wing; key=$row.key; name=$row.name
        field=$field; hits=$m.Count; context=$text.Substring($i, $len)
      }
    }
  }
}

# ---------- 1. notation and leakage, over every rendered panel ----------
$textFields = 'readout','chip','legend','derive','note','stageBody','probe','text'
foreach ($row in $data.rows) {
  foreach ($f in $textFields) {
    $v = $row.$f
    if ($v) {
      Scan $row $f $v 'HIGH' $high
      Scan $row $f $v 'CHECK' $check
      if ($valueFields -contains $f) { Scan $row $f $v 'HIGH' $valueOnly }
    }
  }
}

# ---------- 2. panels that render empty ----------
$emptyPanels = @()
$noLegend = @()
foreach ($row in $data.rows) {
  if ($row.kind -ne 'demo') { continue }
  if (-not $row.stage) { continue }                 # field demos have no stage panels
  # legend is deliberately absent on stages that draw their own key onto the
  # canvas — ckLab paints one with ckLegendRow — so it is reported separately
  # rather than failing the build.
  foreach ($p in @(@{f='readout';min=40}, @{f='derive';min=40}, @{f='chip';min=3})) {
    $v = $row.($p.f)
    if (-not $v -or $v.Length -lt $p.min) {
      $emptyPanels += [pscustomobject]@{ wing=$row.wing; key=$row.key; name=$row.name
                                         stage=$row.stage; panel=$p.f; len=($(if($v){$v.Length}else{0})) }
    }
  }
  if (-not $row.legend -or $row.legend.Length -lt 6) {
    $noLegend += [pscustomobject]@{ wing=$row.wing; key=$row.key; stage=$row.stage }
  }
}

# ---------- 3. theory essays: present, and long enough to be an essay ----------
$thinTheory = @()
foreach ($row in $data.rows) {
  if ($row.kind -ne 'theory') { continue }
  if (-not $row.text -or $row.text.Length -lt 1200) {
    $thinTheory += [pscustomobject]@{ wing=$row.wing; name=$row.name; len=($(if($row.text){$row.text.Length}else{0})) }
  }
}

# ---------- 4. structural: every stage carries the full set ----------
$missing = @()
foreach ($s in $data.struct) {
  $lack = @()
  foreach ($k in 'derive','readout','chip','legend','controls') { if (-not $s.$k) { $lack += $k } }
  if ($lack.Count) { $missing += [pscustomobject]@{ stage=$s.stage; missing=($lack -join ',') } }
}

# ---------- 5. canvas text, which the DOM harvest structurally cannot see ----------
# ctx.fillText draws markup literally, so anything reaching a canvas primitive has
# to be Unicode already. uniSup() converts caret exponents at the primitives, but
# it deliberately gives up when a character has no superscript form rather than
# emitting a half-converted exponent — those are the ones that need rewording.
$canvasBad = @()
$srcDir = Join-Path $dir 'src/js'
foreach ($f in Get-ChildItem $srcDir -Filter *.js) {
  $lines = Get-Content $f.FullName -Encoding UTF8
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $l = $lines[$i]
    if ($l -notmatch '(stageNote|ctText|ctx\.fillText|R\.label)\s*\(') { continue }
    # a caret whose exponent uniSup cannot fully lift: anything outside its map
    foreach ($m in [regex]::Matches($l, '\^\(([^()]*)\)')) {
      if ($m.Groups[1].Value -match '[^0-9A-Za-z+\-−=/²³¹⁰⁴⁵⁶⁷⁸⁹βγδθφχ]') {
        $canvasBad += [pscustomobject]@{ file=$f.Name; line=$i+1; frag=$m.Value }
      }
    }
    if ($l -match '<(sub|sup|b|i)>') {
      $canvasBad += [pscustomobject]@{ file=$f.Name; line=$i+1; frag='markup in canvas text' }
    }
  }
}

# ---------- 6. curriculum coverage: the formal layer, per wing ----------
# The site's essays explain superbly and, before the statement layer, stated no
# theorem formally and proved none. This counts what a reader can actually reach:
# definitions, theorems, how many carry a proof, and how many link to the
# experiment that demonstrates them.
$coverage = @()
foreach ($row in $data.rows) {
  if ($row.kind -ne 'theory') { continue }
  $s = @($row.stmts)
  $coverage += [pscustomobject]@{
    wing    = $row.wing
    defs    = @($s | Where-Object { $_.kind -eq 'Definition' }).Count
    thms    = @($s | Where-Object { $_.kind -ne 'Definition' }).Count
    proved  = @($s | Where-Object { $_.proved }).Count
    linked  = @($s | Where-Object { $_.see }).Count
    total   = $s.Count
  }
}
$withNone = @($coverage | Where-Object { $_.total -eq 0 })

# ---------- report ----------
$hi = @($findings | Where-Object { $_.sev -eq 'HIGH' })
$ck = @($findings | Where-Object { $_.sev -eq 'CHECK' })

Write-Output ('demos+theory harvested : ' + $data.rows.Count)
Write-Output ('stages inspected       : ' + $data.struct.Count)
Write-Output ('js errors during run   : ' + $data.errs.Count)
Write-Output ''
Write-Output ('HIGH notation/leakage  : ' + $hi.Count)
Write-Output ('CHECK (judgement)      : ' + $ck.Count)
Write-Output ('empty panels           : ' + $emptyPanels.Count)
Write-Output ('thin theory essays     : ' + $thinTheory.Count)
Write-Output ('stages missing a part  : ' + $missing.Count)
Write-Output ('canvas text needing a reword : ' + $canvasBad.Count)
Write-Output ''
if ($noLegend.Count) {
  Write-Output ('note: ' + $noLegend.Count + ' demo(s) show no dock legend, on ' +
                (@($noLegend | Group-Object stage).Count) + ' stage(s): ' +
                ((@($noLegend | Group-Object stage) | ForEach-Object { $_.Name }) -join ', ') +
                ' — legitimate where the stage paints its own key onto the canvas.')
  Write-Output ''
}
if ($canvasBad.Count) {
  Write-Output '=== CANVAS TEXT (markup cannot render here) ==='
  $canvasBad | ForEach-Object { Write-Output ('  ' + $_.file + ':' + $_.line + '  ' + $_.frag) }
  Write-Output ''
}

if ($hi.Count) {
  Write-Output '=== HIGH ==='
  $hi | Group-Object rule | Sort-Object Count -Descending | ForEach-Object {
    Write-Output ('  ' + $_.Name + '  x' + $_.Count)
    $_.Group | Select-Object -First 8 | ForEach-Object {
      Write-Output ('     [' + $_.wing + ' ' + $_.key + ' ' + $_.field + '] ' + $_.name + ' :: ' + $_.context)
    }
  }
  Write-Output ''
}
if ($emptyPanels.Count) {
  Write-Output '=== EMPTY PANELS ==='
  $emptyPanels | Group-Object panel | ForEach-Object {
    Write-Output ('  ' + $_.Name + '  x' + $_.Count)
    $_.Group | Select-Object -First 10 | ForEach-Object {
      Write-Output ('     [' + $_.wing + ' ' + $_.key + '] ' + $_.stage + ' — ' + $_.name + ' (len ' + $_.len + ')')
    }
  }
  Write-Output ''
}
if ($missing.Count) { Write-Output '=== STAGES MISSING A PART ==='; $missing | ForEach-Object { Write-Output ('  ' + $_.stage + ' lacks ' + $_.missing) }; Write-Output '' }
if ($thinTheory.Count) { Write-Output '=== THIN THEORY ==='; $thinTheory | ForEach-Object { Write-Output ('  ' + $_.wing + ' (' + $_.len + ' chars)') }; Write-Output '' }

Write-Output '=== CURRICULUM COVERAGE (formal layer, per wing) ==='
Write-Output ('  {0,-11} {1,5} {2,5} {3,7} {4,7}' -f 'wing','defs','thms','proved','linked')
foreach ($c in ($coverage | Sort-Object -Property @{e='total';d=$true}, wing)) {
  Write-Output ('  {0,-11} {1,5} {2,5} {3,7} {4,7}' -f $c.wing, $c.defs, $c.thms, $c.proved, $c.linked)
}
$withNone = @($coverage | Where-Object { $_.total -eq 0 })
$totStmt  = ($coverage | Measure-Object -Property total  -Sum).Sum
$totProof = ($coverage | Measure-Object -Property proved -Sum).Sum
$totLink  = ($coverage | Measure-Object -Property linked -Sum).Sum
Write-Output ''
Write-Output ("  statements: $totStmt   with proofs: $totProof   linked to an experiment: $totLink")
Write-Output ("  wings with no formal layer yet: " + $withNone.Count + " of " + $coverage.Count)
if ($withNone.Count) { Write-Output ('    ' + (($withNone | ForEach-Object { $_.wing }) -join ', ')) }
Write-Output ''

$findings | Export-Csv -Path (Join-Path $dir 'audittext-findings.csv') -NoTypeInformation -Encoding UTF8
$coverage | Export-Csv -Path (Join-Path $dir 'audit-coverage.csv') -NoTypeInformation -Encoding UTF8
Write-Output 'full findings -> audittext-findings.csv ; coverage -> audit-coverage.csv'

if ($hi.Count -or $emptyPanels.Count -or $missing.Count) { Write-Output 'AUDIT FAILED'; exit 1 }
Write-Output 'AUDIT OK'
