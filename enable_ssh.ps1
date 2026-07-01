Write-Host "Habilitando SSH en Windows..." -ForegroundColor Cyan

# Instalar OpenSSH Server
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0

# Iniciar servicio
Start-Service sshd

# Arranque automatico
Set-Service -Name sshd -StartupType Automatic

# Abrir firewall
New-NetFirewallRule -Name "OpenSSH-Server-In-TCP" -DisplayName "OpenSSH Server (sshd)" -Enabled True -Direction Inbound -Protocol TCP -Action Allow -LocalPort 22 -ErrorAction SilentlyContinue

# Mostrar IP
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne "127.0.0.1" } | Select-Object -First 1).IPAddress
Write-Host ""
Write-Host "=== SSH HABILITADO ===" -ForegroundColor Green
Write-Host "IP de esta maquina: $ip" -ForegroundColor Yellow
Write-Host "Puerto: 22" -ForegroundColor Yellow
Write-Host "Usuario: $env:USERNAME" -ForegroundColor Yellow
Write-Host ""
Write-Host "Comparte esta informacion para que puedan conectarse." -ForegroundColor Cyan
