#!/bin/bash
# XCIEN 2.0 — Production Startup Script

echo "🚀 Iniciando despliegue de XCIEN 2.0..."

# 1. Instalar dependencias del frontend
echo "📦 Instalando dependencias de Node.js..."
npm install

# 2. Construir el frontend (Vite SPA)
echo "🏗️ Construyendo el frontend..."
npm run build

# 3. Instalar dependencias del backend (Python)
echo "🐍 Verificando entorno Python..."
# Se asume que el usuario tiene pip instalado
pip install fastapi uvicorn requests python-dotenv anthropic

# 4. Iniciar el servidor unificado
echo "📡 Iniciando Servidor de Academia & Orquestación en puerto 8000..."
python3 backend/servidor_academia.py
