# Assembles src/ modules into the single self-contained vector-calculus.html.
# Order matters: engine modules (10-49) must precede 50-state.js so that
# runtests.ps1 can extract the pure-engine section between the "use strict";
# anchor and the APPLICATION STATE marker.
$ErrorActionPreference = 'Stop'
$dir = $PSScriptRoot
$enc = New-Object System.Text.UTF8Encoding($false)

function ReadSrc($rel) { [System.IO.File]::ReadAllText((Join-Path $dir "src\$rel"), $enc) }

$parts = New-Object System.Collections.Generic.List[string]
$parts.Add((ReadSrc 'head.html'))
$parts.Add("<style>`r`n")
$parts.Add((ReadSrc 'styles.css'))
$parts.Add("</style>`r`n`r`n")
$parts.Add((ReadSrc 'shell.html'))
$parts.Add("`r`n<script>`r`n""use strict"";`r`n")

# Ordinal sort, not the culture-aware default: the module names carry their load
# order in the filename ("60a-" before "60b-"), and a culture-aware comparison can
# ignore the hyphen and reorder siblings, which would silently break dependencies.
$js = @(Get-ChildItem (Join-Path $dir 'src\js') -Filter '*.js')
[Array]::Sort($js, [System.Comparison[System.IO.FileInfo]]{
  param($a, $b) [System.String]::CompareOrdinal($a.Name, $b.Name) })
foreach ($f in $js) {
  $parts.Add([System.IO.File]::ReadAllText($f.FullName, $enc))
}
$parts.Add("</script>`r`n")

$out = ($parts -join '')
[System.IO.File]::WriteAllText((Join-Path $dir 'vector-calculus.html'), $out, $enc)
$lines = ($out -split "`r`n").Count
Write-Output ("built vector-calculus.html : {0} modules, {1} lines, {2} bytes" -f $js.Count, $lines, $out.Length)
