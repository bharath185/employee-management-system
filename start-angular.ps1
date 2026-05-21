$logFile = "$env:TEMP\angular_start.log"
$proc = Start-Process -NoNewWindow -FilePath "npx.cmd" -ArgumentList "ng serve --host 0.0.0.0 --port 4200" -WorkingDirectory "H:\PARIKAR\employee-management-ui" -PassThru
"Angular started with PID: " + $proc.Id | Out-File $logFile
$proc.WaitForExit()
"Angular exited with code: " + $proc.ExitCode | Out-File $logFile -Append
