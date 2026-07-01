Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force

$PROJECT_DIR = "C:\Antigravity"
$MAC_IP = "192.168.1.86"

Write-Host "=== XCIEN 2.0 Setup ===" -ForegroundColor Cyan

# Git
Write-Host "[1/6] Verificando Git..."
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    winget install --id Git.Git -e --source winget --silent
    refreshenv
}
Write-Host "    Git OK"

# Node.js
Write-Host "[2/6] Verificando Node.js..."
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    winget install --id OpenJS.NodeJS.LTS -e --source winget --silent
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}
Write-Host "    Node OK: $(node --version)"

# Python
Write-Host "[3/6] Verificando Python..."
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    winget install --id Python.Python.3.11 -e --source winget --silent
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}
Write-Host "    Python OK"

# Clonar repo
Write-Host "[4/6] Clonando repositorio..."
if (Test-Path $PROJECT_DIR) {
    Write-Host "    Carpeta existe, actualizando..."
    Set-Location $PROJECT_DIR
    git pull origin main
} else {
    git clone https://github.com/jmmcmx/portal-command-center.git $PROJECT_DIR
    Set-Location $PROJECT_DIR
}
Write-Host "    Repo OK"

# npm install
Write-Host "[5/6] Instalando dependencias Node..."
Set-Location $PROJECT_DIR
npm install
Write-Host "    npm OK"

# Python venv
Write-Host "[6/6] Creando entorno Python..."
python -m venv .venv
& ".\.venv\Scripts\pip.exe" install --upgrade pip -q
& ".\.venv\Scripts\pip.exe" install -r backend\requirements.txt
Write-Host "    Python venv OK"

# Copiar .env
Write-Host "[+] Copiando .env desde Mac..."
New-Item -ItemType Directory -Force -Path "$PROJECT_DIR\backend" | Out-Null
Invoke-WebRequest -Uri "http://${MAC_IP}:9999/backend/.env" -OutFile "$PROJECT_DIR\backend\.env"
Write-Host "    .env copiado"

# Claude Code
Write-Host "[+] Instalando Claude Code..."
npm install -g @anthropic-ai/claude-code
Write-Host "    Claude Code OK"

Write-Host ""
Write-Host "=== INSTALACION COMPLETA ===" -ForegroundColor Green
Write-Host ""
Write-Host "Para arrancar:" -ForegroundColor Yellow
Write-Host "  Terminal 1: cd C:\Antigravity && .\.venv\Scripts\activate && python backend\servidor_academia.py"
Write-Host "  Terminal 2: cd C:\Antigravity && npm run dev"
Write-Host "  Portal:     http://localhost:8080"
Write-Host "  Claude:     cd C:\Antigravity && claude"
