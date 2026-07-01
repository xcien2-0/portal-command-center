Write-Host "Abriendo SSH y ping en firewall..." -ForegroundColor Cyan

# Permitir SSH en TODOS los perfiles (Domain, Private, Public)
Remove-NetFirewallRule -Name "OpenSSH-Server-In-TCP" -ErrorAction SilentlyContinue
New-NetFirewallRule -Name "OpenSSH-Server-In-TCP" `
    -DisplayName "OpenSSH Server (sshd)" `
    -Enabled True `
    -Direction Inbound `
    -Protocol TCP `
    -Action Allow `
    -LocalPort 22 `
    -Profile Any

# Permitir ping ICMP (para que el Mac pueda verificar conectividad)
Enable-NetFirewallRule -Name "FPS-ICMP4-ERQ-In" -ErrorAction SilentlyContinue
New-NetFirewallRule -Name "Allow-ICMPv4-In" `
    -DisplayName "Allow ICMPv4 Inbound" `
    -Protocol ICMPv4 `
    -IcmpType 8 `
    -Direction Inbound `
    -Action Allow `
    -Profile Any `
    -ErrorAction SilentlyContinue

# Verificar que sshd esta corriendo
$svc = Get-Service sshd -ErrorAction SilentlyContinue
if ($svc.Status -ne "Running") {
    Start-Service sshd
}

Write-Host ""
Write-Host "=== FIREWALL ABIERTO ===" -ForegroundColor Green
Write-Host "SSH puerto 22: ABIERTO" -ForegroundColor Green
Write-Host "ICMP (ping):   ABIERTO" -ForegroundColor Green
Write-Host ""
Write-Host "Estado sshd: $((Get-Service sshd).Status)" -ForegroundColor Yellow
Write-Host "IP:          $((Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -like '192.168.*' } | Select-Object -First 1).IPAddress)" -ForegroundColor Yellow
