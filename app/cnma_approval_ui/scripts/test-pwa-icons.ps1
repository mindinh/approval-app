$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$publicPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../public'))
$icons = @(
    @{ Name = 'sap-logo.png'; Size = 0; Source = $true },
    @{ Name = 'sap-pwa-icon-192-v4.png'; Size = 192; Transparent = $true },
    @{ Name = 'sap-pwa-icon-512-v4.png'; Size = 512; Transparent = $true },
    @{ Name = 'sap-pwa-icon-maskable-512-v3.png'; Size = 512 },
    @{ Name = 'sap-apple-touch-icon-v3.png'; Size = 180 },
    @{ Name = 'sap-favicon-v4.png'; Size = 32; Transparent = $true }
)

foreach ($icon in $icons) {
    $iconPath = if ($icon.Source) { Join-Path $PSScriptRoot $icon.Name } else { Join-Path $publicPath $icon.Name }
    $bitmap = [Drawing.Bitmap]::FromFile($iconPath)
    try {
        if ($icon.Size -gt 0 -and ($bitmap.Width -ne $icon.Size -or $bitmap.Height -ne $icon.Size)) {
            throw "$($icon.Name): unexpected dimensions"
        }
        $gridPixels = 0
        $transparentPixels = 0
        $whitePixels = 0
        for ($y = 0; $y -lt $bitmap.Height; $y++) {
            for ($x = 0; $x -lt $bitmap.Width; $x++) {
                $pixel = $bitmap.GetPixel($x, $y)
                if ($pixel.A -eq 0) {
                    if (!$icon.Transparent) { throw "$($icon.Name): maskable/Apple artwork must stay opaque" }
                    $transparentPixels++
                    continue
                }
                if (!$icon.Transparent -and $pixel.A -ne 255) { throw "$($icon.Name): maskable/Apple artwork must stay opaque" }
                if ($pixel.A -eq 255 -and $pixel.R -ge 250 -and $pixel.G -ge 250 -and $pixel.B -ge 250) { $whitePixels++ }
                $minimum = [Math]::Min([int]$pixel.R, [Math]::Min([int]$pixel.G, [int]$pixel.B))
                $maximum = [Math]::Max([int]$pixel.R, [Math]::Max([int]$pixel.G, [int]$pixel.B))
                # The original artwork had opaque light gray checkerboard pixels.
                if ($minimum -ge 220 -and $maximum -le 245 -and ($maximum - $minimum) -le 2) {
                    $gridPixels++
                }
            }
        }
        if ($gridPixels -gt 0) { throw "$($icon.Name): found $gridPixels baked-in checkerboard pixels" }
        if ($icon.Transparent -and ($transparentPixels -eq 0 -or $bitmap.GetPixel(0, 0).A -ne 0)) { throw "$($icon.Name): transparent canvas required" }
        if ($whitePixels -eq 0) { throw "$($icon.Name): white SAP lettering must be preserved" }
        Write-Output "PASS $($icon.Name): dimensions, expected alpha, preserved lettering, no checkerboard"
    }
    finally { $bitmap.Dispose() }
}

# Validate the actual install entry points, including the legacy UI5 document.
$uiPath = [IO.Path]::GetFullPath((Join-Path $publicPath '..'))
foreach ($entry in @('index.html', 'public/index.html', 'public/web-manifest.json', 'public/manifest.json', 'src/main.tsx')) {
    $sourceText = [IO.File]::ReadAllText((Join-Path $uiPath $entry))
    $references = [regex]::Matches($sourceText, 'sap-(?:apple-touch-icon|pwa-icon-[\w-]+|favicon)[\w-]*\.png')
    if ($references.Count -eq 0) { throw "${entry}: missing install artwork reference" }
    foreach ($reference in $references) {
        if ($reference.Value -notin $icons.Name) { throw "${entry}: stale artwork URL $($reference.Value)" }
        if (!(Test-Path -LiteralPath (Join-Path $publicPath $reference.Value))) { throw "${entry}: missing artwork $($reference.Value)" }
    }
    Write-Output "PASS ${entry}: versioned artwork references resolve"
}
