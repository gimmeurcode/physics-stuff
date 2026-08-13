# auditcontrast.ps1 — is every colour in the design system actually readable?
#
# Parses the real token blocks out of src/styles.css (so it can never drift from
# what ships) and checks each foreground against every background it can land on,
# in BOTH themes, using the WCAG 2.1 relative-luminance formula.
#
# Why this exists: --faint renders the help paragraphs, every readout key label
# and every demo's formula, and it sat at 3.2:1 in dark and 2.7:1 in light — below
# AA at 10-11.5px type. --c-warn was declared once in :root and never overridden
# per theme, so light mode inherited the dark yellow at 1.83:1, which is close to
# invisible. Neither is the kind of thing anyone notices by looking; both are
# arithmetic, so they get checked by arithmetic.
#
# Targets: 4.5:1 for anything that renders text (WCAG AA, normal size).
#          3:1 for --mid, which is canvas ink and never a CSS text colour.
# Exit code 1 if any token misses its target.
$ErrorActionPreference = 'Stop'
$css = Get-Content (Join-Path $PSScriptRoot 'src/styles.css') -Raw -Encoding UTF8

function Get-Lum([string]$hex){
  $h = $hex.TrimStart('#'); $ch = @()
  for($i = 0; $i -lt 6; $i += 2){
    $v = [Convert]::ToInt32($h.Substring($i,2),16) / 255.0
    if($v -le 0.03928){ $ch += $v / 12.92 } else { $ch += [Math]::Pow(($v + 0.055) / 1.055, 2.4) }
  }
  return 0.2126*$ch[0] + 0.7152*$ch[1] + 0.0722*$ch[2]
}
function Get-Ratio([string]$a, [string]$b){
  $la = Get-Lum $a; $lb = Get-Lum $b
  if($la -lt $lb){ $t = $la; $la = $lb; $lb = $t }
  return [Math]::Round(($la + 0.05) / ($lb + 0.05), 2)
}

# pull "--name:#RRGGBB" out of a named block
function Get-Tokens([string]$block){
  $t = @{}
  foreach($m in [regex]::Matches($block, '--([a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{6})')){
    $t[$m.Groups[1].Value] = $m.Groups[2].Value
  }
  return $t
}
function Get-Block([string]$selector){
  $i = $css.IndexOf($selector)
  if($i -lt 0){ throw "cannot find $selector in styles.css" }
  $o = $css.IndexOf('{', $i); $e = $css.IndexOf('}', $o)
  return $css.Substring($o, $e - $o)
}

$root  = Get-Tokens (Get-Block ':root{')
$dark  = Get-Tokens (Get-Block ':root[data-theme="dark"]')
$light = Get-Tokens (Get-Block ':root[data-theme="light"]')
# a theme inherits anything it does not override — the exact hole --c-warn fell
# through, so the check has to model inheritance rather than read the block alone
function Merge($base, $over){ $m = @{}; foreach($k in $base.Keys){ $m[$k] = $base[$k] }; foreach($k in $over.Keys){ $m[$k] = $over[$k] }; return $m }
$dark  = Merge $root $dark
$light = Merge $root $light

$backgrounds = 'bg','bg2','bg3','bg4'
$foregrounds = 'text','dim','faint','accent','mid','c-grad','c-pos','c-neg','c-curl','c-warn'
$looseTargets = @{ 'mid' = 3.0 }        # canvas ink, not text

$fails = 0
foreach($theme in @(@{ n='DARK'; t=$dark }, @{ n='LIGHT'; t=$light })){
  $p = $theme.t
  Write-Output "== $($theme.n) =="
  foreach($fg in $foregrounds){
    if(-not $p.ContainsKey($fg)){ Write-Output "  $fg — not defined"; $fails++; continue }
    $worst = 99.0; $where = ''
    foreach($bg in $backgrounds){
      if(-not $p.ContainsKey($bg)){ continue }
      $r = Get-Ratio $p[$fg] $p[$bg]
      if($r -lt $worst){ $worst = $r; $where = $bg }
    }
    $target = if($looseTargets.ContainsKey($fg)){ $looseTargets[$fg] } else { 4.5 }
    $verdict = 'ok'
    if($worst -lt $target){ $verdict = 'FAIL'; $fails++ }
    Write-Output ("  {0,-7} {1,-8} worst {2,5}:1 on --{3,-4} (target {4})  {5}" -f $fg, $p[$fg], $worst, $where, $target, $verdict)
  }
}

# the smallest type on the page — a teaching tool gets projected, and 10px of
# --faint at the back of a lecture room is not information
$small = [regex]::Matches($css, 'font-size:(\d+(?:\.\d+)?)px') |
         ForEach-Object { [double]$_.Groups[1].Value } | Where-Object { $_ -lt 12 } | Sort-Object -Unique
Write-Output ''
if($small.Count){ Write-Output ('type below the 12px floor: ' + ($small -join ', ')); $fails++ }
else            { Write-Output 'type scale: nothing below the 12px floor' }

Write-Output ''
if($fails){ Write-Output "CONTRAST AUDIT FAILED — $fails problem(s)"; exit 1 }
Write-Output 'CONTRAST AUDIT OK'
