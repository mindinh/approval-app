# Derive transparent favicon/desktop icons and opaque mobile install icons from the same artwork.
# Then run test-pwa-icons.ps1; checkerboard previews must never be used as source.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$publicPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../public'))
$source = [System.Drawing.Bitmap]::FromFile((Join-Path $PSScriptRoot 'sap-logo.png'))
$transparent = $source.Clone([Drawing.Rectangle]::new(0, 0, $source.Width, $source.Height), [Drawing.Imaging.PixelFormat]::Format32bppArgb)

try {
    # Remove only white pixels connected to the canvas edge, preserving white SAP lettering.
    $visited = [bool[]]::new($source.Width * $source.Height)
    $queue = [Collections.Generic.Queue[int]]::new()
    for ($x = 0; $x -lt $source.Width; $x++) {
        $queue.Enqueue($x)
        $queue.Enqueue(($source.Height - 1) * $source.Width + $x)
    }
    for ($y = 0; $y -lt $source.Height; $y++) {
        $queue.Enqueue($y * $source.Width)
        $queue.Enqueue($y * $source.Width + $source.Width - 1)
    }
    while ($queue.Count -gt 0) {
        $index = $queue.Dequeue()
        if ($visited[$index]) { continue }
        $visited[$index] = $true
        $x = $index % $source.Width
        $y = [int][Math]::Floor($index / $source.Width)
        $pixel = $source.GetPixel($x, $y)
        if ($pixel.R -lt 245 -or $pixel.G -lt 245 -or $pixel.B -lt 245) { continue }
        $transparent.SetPixel($x, $y, [Drawing.Color]::Transparent)
        if ($x -gt 0) { $queue.Enqueue($index - 1) }
        if ($x -lt $source.Width - 1) { $queue.Enqueue($index + 1) }
        if ($y -gt 0) { $queue.Enqueue($index - $source.Width) }
        if ($y -lt $source.Height - 1) { $queue.Enqueue($index + $source.Width) }
    }

    $icons = @(
        @{ Name = 'sap-pwa-icon-192-v4.png'; Size = 192; Ratio = 0.88; Transparent = $true },
        @{ Name = 'sap-pwa-icon-512-v4.png'; Size = 512; Ratio = 0.88; Transparent = $true },
        # Keep the whole rectangular logo inside the maskable central safe circle.
        @{ Name = 'sap-pwa-icon-maskable-512-v3.png'; Size = 512; Ratio = 0.70 },
        @{ Name = 'sap-apple-touch-icon-v3.png'; Size = 180; Ratio = 0.88 },
        @{ Name = 'sap-favicon-v4.png'; Size = 32; Ratio = 0.88; Transparent = $true }
    )

    foreach ($icon in $icons) {
        $bitmap = [System.Drawing.Bitmap]::new($icon.Size, $icon.Size)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try {
            $graphics.Clear($(if ($icon.Transparent) { [Drawing.Color]::Transparent } else { [Drawing.Color]::White }))
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $scale = $icon.Size * $icon.Ratio / [Math]::Max($source.Width, $source.Height)
            $width = [single]($source.Width * $scale)
            $height = [single]($source.Height * $scale)
            $x = [single](($icon.Size - $width) / 2)
            $y = [single](($icon.Size - $height) / 2)
            $artwork = if ($icon.Transparent) { $transparent } else { $source }
            $graphics.DrawImage($artwork, $x, $y, $width, $height)
            $bitmap.Save((Join-Path $publicPath $icon.Name), [System.Drawing.Imaging.ImageFormat]::Png)
            Write-Output "Generated $($icon.Name) ($($icon.Size)x$($icon.Size))"
        }
        finally {
            $graphics.Dispose()
            $bitmap.Dispose()
        }
    }
}
finally {
    $transparent.Dispose()
    $source.Dispose()
}
