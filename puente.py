import sys
import requests
import json
import argparse
from datetime import datetime

# Configuración del Puente
BRIDGE_URL = "http://localhost:8000/api/bridge"

def update_bridge(task=None, status=None, log_entry=None):
    try:
        # Obtener tarea actual si no se proporciona (campo requerido por la API)
        current_task = task
        if not current_task:
            try:
                r = requests.get(BRIDGE_URL, timeout=2)
                current_task = r.json().get("current_task", "Inactivo")
            except Exception:
                current_task = "Inactivo"

        data = {"task": current_task}
        if status: data["status"] = status
        if log_entry: data["log_entry"] = log_entry

        response = requests.post(BRIDGE_URL, json=data, timeout=2)
        if response.status_code == 200:
            print(f"✅ [Puente] Estado actualizado: {task or status or log_entry}")
        else:
            print(f"⚠️ [Puente] Error del servidor: {response.status_code}")
    except Exception as e:
        print(f"❌ [Puente] No se pudo conectar con el Hub (¿Está el backend encendido?): {e}")

def get_status():
    try:
        response = requests.get(BRIDGE_URL, timeout=2)
        if response.status_code == 200:
            status = response.json()
            print("\n🌉 === ESTADO DEL PUENTE (LIVE STATUS HUB) ===")
            print(f"📍 Tarea Actual: {status.get('current_task', 'N/A')}")
            print(f"🚦 Status: {status.get('status', 'N/A')}")
            print(f"🕒 Última Actualización: {status.get('last_update', 'N/A')}")
            print("\n📋 Registro Operativo:")
            for log in status.get('log', [])[-5:]:
                print(f"  - {log}")
            print("============================================\n")
        else:
            print(f"⚠️ [Puente] Error al obtener estado: {response.status_code}")
    except Exception as e:
        print(f"❌ [Puente] Error de conexión: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CLI del Agente Puente para XCIEN Live Status Hub")
    parser.add_argument("--task", type=str, help="Actualiza la tarea actual en el dashboard")
    parser.add_argument("--status", type=str, choices=["idle", "working", "error", "success"], help="Cambia el estado visual")
    parser.add_argument("--log", type=str, help="Añade una entrada al registro operativo")
    parser.add_argument("--query", action="store_true", help="Muestra el estado actual del puente")
    
    args = parser.parse_args()
    
    if args.query:
        get_status()
    elif args.task or args.status or args.log:
        update_bridge(task=args.task, status=args.status, log_entry=args.log)
    else:
        parser.print_help()
