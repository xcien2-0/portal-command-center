Remove-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0 -ErrorAction SilentlyContinue
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
Set-Service -Name sshd -StartupType Automatic
Start-Service sshd
Start-Sleep -Seconds 3
Remove-NetFirewallRule -Name "sshd-22" -ErrorAction SilentlyContinue
New-NetFirewallRule -Name "sshd-22" -DisplayName "SSH Port 22" -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22 -Profile Any
Write-Host "Servicio sshd:" (Get-Service sshd).Status
netstat -an | findstr " :22 "
