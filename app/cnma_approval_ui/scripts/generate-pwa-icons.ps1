# Regenerate install icons after changing public/sap-logo.png.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$publicPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../public'))
$source = [System.Drawing.Image]::FromFile((Join-Path $publicPath 'sap-logo.png'))

try {
    $icons = @(
        @{ Name = 'sap-pwa-icon-192.png'; Size = 192; Ratio = 0.88 },
        @{ Name = 'sap-pwa-icon-512.png'; Size = 512; Ratio = 0.88 },
        # Keep the whole rectangular logo inside the maskable central safe circle.
        @{ Name = 'sap-pwa-icon-maskable-512.png'; Size = 512; Ratio = 0.70 },
        @{ Name = 'sap-apple-touch-icon.png'; Size = 180; Ratio = 0.88 },
        @{ Name = 'sap-favicon.png'; Size = 32; Ratio = 0.88 }
    )

    foreach ($icon in $icons) {
        $bitmap = [System.Drawing.Bitmap]::new($icon.Size, $icon.Size)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        try {
            $graphics.Clear([System.Drawing.Color]::White)
            $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $scale = $icon.Size * $icon.Ratio / [Math]::Max($source.Width, $source.Height)
            $width = [single]($source.Width * $scale)
            $height = [single]($source.Height * $scale)
            $x = [single](($icon.Size - $width) / 2)
            $y = [single](($icon.Size - $height) / 2)
            $graphics.DrawImage($source, $x, $y, $width, $height)
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
    $source.Dispose()
}
