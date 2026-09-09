param (
    [int[]]$Ports = @(4005, 4004, 3000)
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "      Kill Processes by Port (PowerShell)  " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$killedCount = 0

foreach ($port in $Ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($conns) {
            $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($processId in $pids) {
                if ($processId -and $processId -ne 0 -and $processId -ne $PID) {
                    $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
                    $procName = if ($proc) { $proc.ProcessName } else { "Unknown" }
                    Write-Host "[KILL] Port $port occupied by PID $processId ($procName). Terminating..." -ForegroundColor Yellow
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    $killedCount++
                }
            }
        } else {
            Write-Host "[OK]   Port $port is free." -ForegroundColor DarkGray
        }
    } catch {
        # Ignore errors if connection closed during check
    }
}

Start-Sleep -Milliseconds 400

Write-Host "------------------------------------------" -ForegroundColor Cyan
if ($killedCount -gt 0) {
    Write-Host "[DONE] Successfully terminated $killedCount process(es)." -ForegroundColor Green
} else {
    Write-Host "[DONE] All ports (@($($Ports -join ', '))) are already clear." -ForegroundColor Green
}
