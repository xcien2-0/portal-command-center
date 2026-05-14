#!/bin/bash

# Iniciar el puente informando que Claude está entrando en sesión como Auditor
python3 puente.py --task "Claude Code: Auditoría Técnica Iniciada" --status "working" --log "Permisos de lectura profunda concedidos al Auditor"

echo "💎 [Antigravity] Claude Code está listo. Rol: Auditor Técnico."
echo "🛠️  Herramientas disponibles: python3 auditor_codigo.py, npx eslint, npm test."
# Nota: Esto asume que 'claude' está en el PATH
claude

# Al salir, actualizar el estado
python3 puente.py --task "Claude terminó sesión" --status "idle" --log "Claude cerró la terminal"
