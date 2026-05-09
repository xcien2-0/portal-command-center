import json
import os
import uuid
import xmlrpc.client
from datetime import datetime
from typing import List, Dict, Optional
import token_service

import sys

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(_BASE_DIR, "db", "wfm_orders.json")

class WFMWorkflowService:
    def __init__(self):
        self._ensure_db()
        self.odoo_url = os.environ.get("ODOO_URL")
        self.odoo_db = os.environ.get("ODOO_DB")
        self.odoo_user = os.environ.get("ODOO_USER")
        self.odoo_pwd = os.environ.get("ODOO_PASSWORD")
        self.last_sync = 0
        self.sync_interval = 600 # 10 minutos

    def _sync_with_odoo(self):
        """ODOO es la fuente de verdad única. Sincroniza CRM Leads como Órdenes WFM."""
        if not self.odoo_url or not self.odoo_pwd:
            return
        
        # Evitar sincronizaciones muy seguidas si no se solicita forzado
        import time
        if time.time() - self.last_sync < self.sync_interval:
            return

        try:
            print("📡 Sincronizando WFM con Odoo (crm.lead)...")
            common = xmlrpc.client.ServerProxy(f'{self.odoo_url}/xmlrpc/2/common')
            uid = common.authenticate(self.odoo_db, self.odoo_user, self.odoo_pwd, {})
            
            if not uid:
                print("❌ Autenticación fallida en Odoo para WFM.")
                return

            models = xmlrpc.client.ServerProxy(f'{self.odoo_url}/xmlrpc/2/object')
            # Buscamos leads/oportunidades que no estén en etapas de 'Perdido' o 'Ganado' (opcional)
            leads = models.execute_kw(self.odoo_db, uid, self.odoo_pwd,
                'crm.lead', 'search_read',
                [[]], # Traer todos por ahora para demo, luego filtrar por tags
                {'fields': ['id', 'name', 'partner_name', 'contact_name', 'stage_id', 'description', 'create_date'], 'limit': 20}
            )

            if not leads:
                print("ℹ️ No se encontraron leads en Odoo.")
                return

            current_orders = self._load_orders()
            # Mapa de IDs de Odoo existentes para no duplicar
            odoo_ids = {o.get("odoo_id") for o in current_orders if o.get("odoo_id")}

            for lead in leads:
                if lead['id'] in odoo_ids: continue

                # Crear estructura de orden WFM basada en el lead de Odoo
                nueva_orden = {
                    "id": f"ODOO-{lead['id']}",
                    "odoo_id": lead['id'],
                    "cliente": lead['partner_name'] or lead['contact_name'] or "Cliente sin nombre",
                    "servicio": lead['name'],
                    "comercial": "Sincronizado Odoo",
                    "estado": "SOLICITUD_PREVENTA", # Estado inicial por defecto
                    "fecha_creacion": lead['create_date'],
                    "preventa": {
                        "analisis": lead['description'] or "",
                        "factibilidad": None,
                        "tecnologia": None,
                        "equipos_sugeridos": [],
                        "anteproyecto_url": None
                    },
                    "almacen": {"disponibilidad": False, "equipos_asignados": [], "esperando_inventario": False},
                    "aprovisionamiento": {"config_logica": None, "parametros_red": {}, "listo": False},
                    "pm": {"auditoria_ok": False, "bloqueada": False, "motivo_bloqueo": None, "backlogs": []},
                    "historial": [
                        {"fecha": datetime.now().isoformat(), "accion": "Sincronizado desde Odoo CRM", "usuario": "Sistema"}
                    ]
                }
                current_orders.append(nueva_orden)
            
            self._save_orders(current_orders)
            self.last_sync = time.time()
            print(f"✅ Sincronización completada. {len(leads)} registros procesados.")

        except Exception as e:
            print(f"❌ Error en sincronización Odoo WFM: {e}")

    def _ensure_db(self):
        os.makedirs("backend/db", exist_ok=True)
        if not os.path.exists(DB_PATH):
            with open(DB_PATH, "w") as f:
                json.dump([], f)

    def _load_orders(self) -> List[Dict]:
        if not os.path.exists(DB_PATH): return []
        try:
            with open(DB_PATH, "r") as f:
                return json.load(f)
        except:
            return []

    def _save_orders(self, orders: List[Dict]):
        with open(DB_PATH, "w") as f:
            json.dump(orders, f, indent=2)

    def crear_solicitud_comercial(self, cliente: str, servicio: str, comercial: str) -> Dict:
        """US-001: Crear solicitud de análisis técnico"""
        nueva_orden = {
            "id": f"OI-{uuid.uuid4().hex[:6].upper()}",
            "cliente": cliente,
            "servicio": servicio,
            "comercial": comercial,
            "estado": "SOLICITUD_PREVENTA",
            "fecha_creacion": datetime.now().isoformat(),
            "preventa": {
                "analisis": None,
                "factibilidad": None,
                "tecnologia": None,
                "equipos_sugeridos": [],
                "anteproyecto_url": None
            },
            "almacen": {
                "disponibilidad": False,
                "equipos_asignados": [],
                "esperando_inventario": False
            },
            "aprovisionamiento": {
                "config_logica": None,
                "parametros_red": {},
                "listo": False
            },
            "pm": {
                "auditoria_ok": False,
                "bloqueada": False,
                "motivo_bloqueo": None,
                "backlogs": []
            },
            "historial": [
                {"fecha": datetime.now().isoformat(), "accion": "Solicitud creada por Comercial", "usuario": comercial}
            ]
        }
        orders = self._load_orders()
        orders.append(nueva_orden)
        self._save_orders(orders)
        return nueva_orden

    def actualizar_preventa(self, order_id: str, data: Dict, usuario: str) -> Dict:
        """US-006 a US-009: Capturar factibilidad, tecnología y equipos"""
        orders = self._load_orders()
        for o in orders:
            if o["id"] == order_id:
                o["preventa"].update(data)
                o["estado"] = "ANTEPROYECTO"
                o["historial"].append({"fecha": datetime.now().isoformat(), "accion": "Preventa actualizó análisis", "usuario": usuario})
                self._save_orders(orders)
                return o
        return None

    def contratar_orden(self, order_id: str, usuario: str) -> Dict:
        """US-011: El cliente firma contrato, pasa a Almacén"""
        orders = self._load_orders()
        for o in orders:
            if o["id"] == order_id:
                o["estado"] = "ALMACEN_VALIDACION"
                o["historial"].append({"fecha": datetime.now().isoformat(), "accion": "Contrato firmado. Enviado a Almacén", "usuario": usuario})
                
                # Emitir Token de Oportunidad Ganada (Bono Comercial)
                try:
                    token_service.emitir(
                        empresa="xcien",
                        oportunidad_id=order_id,
                        cliente=o["cliente"],
                        vendedor=o["comercial"],
                        monto=1000.0, # Ejemplo de meta
                        extra={"servicio": o["servicio"], "fase": "contratacion"}
                    )
                except Exception as e:
                    print(f"⚠️ Error emitiendo token: {e}")

                self._save_orders(orders)
                return o
        return None

    def asignar_equipos_almacen(self, order_id: str, equipos: List[Dict], usuario: str) -> Dict:
        """US-017: Asignar equipos específicos (trazabilidad)"""
        orders = self._load_orders()
        for o in orders:
            if o["id"] == order_id:
                o["almacen"]["equipos_asignados"] = equipos
                o["almacen"]["disponibilidad"] = True
                o["estado"] = "APROVISIONAMIENTO"
                o["historial"].append({"fecha": datetime.now().isoformat(), "accion": "Equipos asignados en Almacén", "usuario": usuario})
                self._save_orders(orders)
                return o
        return None

    def aprovisionar_servicio(self, order_id: str, config: Dict, usuario: str) -> Dict:
        """US-020: Configuración lógica y parámetros"""
        orders = self._load_orders()
        for o in orders:
            if o["id"] == order_id:
                o["aprovisionamiento"].update(config)
                o["aprovisionamiento"]["listo"] = True
                o["estado"] = "REVISION_PM"
                o["historial"].append({"fecha": datetime.now().isoformat(), "accion": "Servicio aprovisionado", "usuario": usuario})
                self._save_orders(orders)
                return o
        return None

    def auditar_pm(self, order_id: str, ok: bool, motivo: str, usuario: str) -> Dict:
        """US-025, US-026, US-027: Revisión final y Backlogs"""
        orders = self._load_orders()
        for o in orders:
            if o["id"] == order_id:
                o["pm"]["auditoria_ok"] = ok
                o["pm"]["bloqueada"] = not ok
                o["pm"]["motivo_bloqueo"] = motivo if not ok else None
                if ok:
                    o["estado"] = "LISTO_INSTALACION"
                    # Emitir Token de Instalación Exitosa (Bono Técnico)
                    try:
                        token_service.emitir(
                            empresa="xcien",
                            oportunidad_id=order_id,
                            cliente=o["cliente"],
                            vendedor=usuario, # Auditor/Ingeniero
                            monto=500.0,
                            extra={"servicio": o["servicio"], "fase": "auditoria_pm"}
                        )
                    except Exception as e:
                        print(f"⚠️ Error emitiendo token en auditoría: {e}")
                else:
                    # US-027: Generar backlog
                    o["pm"]["backlogs"].append({
                        "id": f"B-{uuid.uuid4().hex[:4].upper()}",
                        "fecha": datetime.now().isoformat(),
                        "descripcion": motivo,
                        "area_responsable": "POR_DEFINIR"
                    })
                    o["estado"] = "BACKLOG"
                
                o["historial"].append({"fecha": datetime.now().isoformat(), "accion": f"Auditoría PM: {'Aprobada' if ok else 'Rechazada'}", "usuario": usuario})
                self._save_orders(orders)
                return o
        return None

    def obtener_ordenes(self, estado: Optional[str] = None) -> List[Dict]:
        orders = self._load_orders()
        if estado:
            return [o for o in orders if o["estado"] == estado]
        return orders
