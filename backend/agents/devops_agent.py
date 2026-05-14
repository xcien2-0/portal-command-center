import os
import json
import subprocess
import anthropic
from dotenv import load_dotenv

# Configuración de rutas
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"), override=True)

class DevOpsAgent:
    def __init__(self):
        self.name = "Antigravity SRE & Odoo Expert"
        self.client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
        print(f"🛠️ [{self.name}] Agente de Infraestructura y ERP activo.")

    def _run_command(self, cmd: list):
        """Ejecuta un comando como lista de args (sin shell) y retorna el output."""
        try:
            result = subprocess.run(cmd, shell=False, capture_output=True, text=True, timeout=5)
            return result.stdout.strip() if result.returncode == 0 else result.stderr.strip()
        except Exception as e:
            return f"Error ejecutando comando: {str(e)}"

    def get_git_status(self):
        """Obtiene el estado actual del repositorio local."""
        status = self._run_command(["git", "status", "-s"])
        branch = self._run_command(["git", "branch", "--show-current"])
        unpushed = self._run_command(["git", "log", "@{u}..", "--oneline"])
        return {
            "branch": branch,
            "modified_files": status.split("\n") if status and status.strip() else [],
            "unpushed_commits": unpushed.split("\n") if unpushed and unpushed.strip() else []
        }

    def get_pm2_status(self):
        """Obtiene el estado de los procesos gestionados por PM2."""
        status_raw = self._run_command(["pm2", "jlist"])
        try:
            data = json.loads(status_raw)
            return [
                {
                    "name": p["name"],
                    "status": p["pm2_env"]["status"],
                    "cpu": p["monit"]["cpu"],
                    "memory": round(p["monit"]["memory"] / (1024 * 1024), 1),
                    "restarts": p["pm2_env"]["restart_time"]
                }
                for p in data
            ]
        except Exception:
            return "PM2 no disponible o sin procesos."

    def get_odoo_status(self):
        """Verifica si el servicio de Odoo está activo (buscando por proceso)."""
        try:
            ps_result = subprocess.run(["ps", "aux"], capture_output=True, text=True, timeout=5)
            odoo_procs = [l for l in ps_result.stdout.splitlines() if "odoo" in l and "grep" not in l]
        except Exception:
            odoo_procs = []
        odoo_conf = os.path.join(BASE_DIR, "..", "odoo.conf")
        return {
            "is_running": len(odoo_procs) > 0,
            "processes": odoo_procs,
            "config_found": os.path.exists(odoo_conf)
        }

    def get_system_metrics(self):
        """Obtiene métricas básicas de CPU y Memoria del sistema."""
        try:
            mem_out = subprocess.run(["free", "-m"], capture_output=True, text=True, timeout=5).stdout
            mem_line = next((l for l in mem_out.splitlines() if l.startswith("Mem")), "")
            parts = mem_line.split()
            mem = f"{parts[2]}/{parts[1]}MB used" if len(parts) >= 3 else "N/A"
        except Exception:
            mem = "N/A"

        try:
            df_out = subprocess.run(["df", "-h", "/"], capture_output=True, text=True, timeout=5).stdout
            df_line = df_out.splitlines()[-1].split() if df_out.strip() else []
            disk = f"{df_line[4]} used ({df_line[3]} avail)" if len(df_line) >= 5 else "N/A"
        except Exception:
            disk = "N/A"

        return {
            "memory": mem,
            "cpu_usage": "N/A (use psutil for cross-platform CPU)",
            "disk_space": disk
        }

    def analizar_y_responder(self, consulta_usuario, history=None):
        if history is None: history = []
        
        # 1. Recolectar datos técnicos en tiempo real
        git_info = self.get_git_status()
        pm2_info = self.get_pm2_status()
        sys_info = self.get_system_metrics()
        odoo_info = self.get_odoo_status()

        # 2. Definir Persona y Contexto
        system_prompt = f"""Eres el 'Antigravity SRE & Odoo Expert', un experto senior en DevOps, GitHub, VPS Linux y el ecosistema Odoo (v17/v19).
Tu misión es mantener la infraestructura y el ERP de XCIEN en estado óptimo.

[DATOS TÉCNICOS DEL SERVIDOR EN TIEMPO REAL]
- REPOSITORIO (Git): Rama: {git_info['branch']}, Cambios locales: {len(git_info['modified_files'])}, Commits sin subir: {len(git_info['unpushed_commits'])}
- ODOO ERP: Estado: {'EJECUTÁNDOSE' if odoo_info['is_running'] else 'DETENIDO'}, Config: {'Detectada' if odoo_info['config_found'] else 'No encontrada'}
- PROCESOS (PM2): {json.dumps(pm2_info, indent=2)}
- MÉTRICAS VPS: Memoria: {sys_info['memory']}, CPU: {sys_info['cpu_usage']}, Disco: {sys_info['disk_space']}

Tu tono es técnico, resolutivo y proactivo. Conoces a fondo la migración de Odoo 17 a 19.
Si detectas que Odoo está abajo o hay muchos cambios sin commit en el repo, adviértelo de inmediato.

Capacidades: Diagnóstico de servidores, gestión de repositorios, optimización de Odoo y resolución de problemas de despliegue.
"""

        try:
            messages = [{"role": h["role"], "content": h["content"]} for h in history[-4:]]
            messages.append({"role": "user", "content": consulta_usuario})

            # Usar un modelo estable. Si falla, intentar el fallback.
            try:
                response = self.client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=1024,
                    system=system_prompt,
                    messages=messages
                )
            except:
                response = self.client.messages.create(
                    model="claude-3-5-sonnet-20240620",
                    max_tokens=1024,
                    system=system_prompt,
                    messages=messages
                )
                
            return response.content[0].text
        except Exception as e:
            return f"⚠️ Error en el núcleo SRE/Odoo: {str(e)}"

if __name__ == "__main__":
    agent = DevOpsAgent()
    print(agent.analizar_y_responder("¿Cómo está la salud de mi servidor, Odoo y mi repo?"))
