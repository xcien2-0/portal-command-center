#!/bin/bash
# XCIEN 2.0 — Production Startup Script (Proxy)

# Detectar la raíz del proyecto (donde está package.json)
PROJECT_ROOT="/Users/mesquite/Antigravity"

echo "🚀 Navegando a la raíz del proyecto: $PROJECT_ROOT"
cd "$PROJECT_ROOT" || { echo "❌ Error: No se encontró la carpeta raíz."; exit 1; }

echo "📦 Instalando dependencias de Node.js..."
npm install

echo "🏗️ Construyendo el frontend..."
npm run build

echo "🐍 Verificando entorno Python..."
pip install fastapi uvicorn requests python-dotenv anthropic

echo "📡 Iniciando Servidor de Academia & Orquestación en puerto 8000..."
python3 backend/servidor_academia.py
