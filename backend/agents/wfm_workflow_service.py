import json
import os
import uuid
import base64
import xmlrpc.client
from datetime import datetime
from typing import List, Dict, Optional
import token_service

import sys

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(_BASE_DIR, "db", "wfm_orders.json")
EVIDENCIAS_DIR = os.path.join(_BASE_DIR, "db", "evidencias")

CHECKLIST_ITEMS = [
    {"id": "CK-01", "categoria": "Sitio",          "descripcion": "Verificar acceso y condiciones del sitio físico"},
    {"id": "CK-02", "categoria": "Sitio",          "descripcion": "Revisar energía eléctrica disponible (voltaje y tierra)"},
    {"id": "CK-03", "categoria": "Cableado",       "descripcion": "Tendido de cable (fibra/UTP) según plano aprobado"},
    {"id": "CK-04", "categoria": "Cableado",       "descripcion": "Fijación y etiquetado de cable en rack/canaleta"},
    {"id": "CK-05", "categoria": "Equipo",         "descripcion": "Instalación física del equipo en rack/caja"},
    {"id": "CK-06", "categoria": "Equipo",         "descripcion": "Configurar IP, gateway y VLAN según parámetros de aprovisionamiento"},
    {"id": "CK-07", "categoria": "Equipo",         "descripcion": "Verificar firmware y versión de software del equipo"},
    {"id": "CK-08", "categoria": "Conectividad",   "descripcion": "Ping exitoso al gateway del ISP"},
    {"id": "CK-09", "categoria": "Conectividad",   "descripcion": "Prueba de velocidad simétrica (descarga/subida ≥ 90% del contratado)"},
    {"id": "CK-10", "categoria": "Conectividad",   "descripcion": "Latencia hacia 8.8.8.8 ≤ 50 ms"},
    {"id": "CK-11", "categoria": "NOC",            "descripcion": "Equipo dado de alta en sistema de monitoreo (Zabbix/PRTG)"},
    {"id": "CK-12", "categoria": "NOC",            "descripcion": "Alertas configuradas y validadas con NOC"},
    {"id": "CK-13", "categoria": "Cliente",        "descripcion": "Demostración del servicio ante el cliente"},
    {"id": "CK-14", "categoria": "Cliente",        "descripcion": "Firma de conformidad / acta de entrega obtenida"},
    {"id": "CK-15", "categoria": "Limpieza",       "descripcion": "Sitio entregado limpio y ordenado (Bidrillas)"},
]

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
        os.makedirs(os.path.join(_BASE_DIR, "db"), exist_ok=True)
        os.makedirs(EVIDENCIAS_DIR, exist_ok=True)
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
            "evidencias": {
                "fotos_antes": [],
                "fotos_despues": [],
                "checklist_ok": False,
                "notas": "",
                "cerrado_por": None,
                "fecha_cierre": None
            },
            "checklist": [
                {**item, "completado": False, "completado_por": None, "fecha_completado": None, "observacion": ""}
                for item in CHECKLIST_ITEMS
            ],
            "pruebas_velocidad": [],
            "timestamps_estados": {
                "SOLICITUD_PREVENTA": datetime.now().isoformat()
            },
            "noc": {
                "ping_ok": None,
                "latencia_ms": None,
                "dado_de_alta": False,
                "herramienta_monitoreo": None,
                "host_id": None,
                "alertas_configuradas": False,
                "grupos_alerta": [],
                "aprobado": False,
                "aprobado_por": None,
                "fecha_alta": None,
                "observaciones": ""
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
                self._stamp(o, "ANTEPROYECTO")
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
                self._stamp(o, "ALMACEN_VALIDACION")
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

    def responder_almacen(self, order_id: str, respuesta: str, equipos: List[Dict],
                           fecha_estimada: Optional[str], motivo: str, usuario: str) -> Dict:
        """HU-05: Almacén responde con una de 3 opciones:
           'disponible' | 'no_disponible' | 'disponible_en_fecha'
        """
        if respuesta not in ("disponible", "no_disponible", "disponible_en_fecha"):
            raise ValueError("respuesta debe ser 'disponible', 'no_disponible' o 'disponible_en_fecha'")
        if respuesta == "disponible_en_fecha" and not fecha_estimada:
            raise ValueError("fecha_estimada requerida cuando respuesta='disponible_en_fecha'")

        orders = self._load_orders()
        for o in orders:
            if o["id"] == order_id:
                o["almacen"]["respuesta"]        = respuesta
                o["almacen"]["equipos_asignados"] = equipos
                o["almacen"]["fecha_estimada"]    = fecha_estimada
                o["almacen"]["motivo"]            = motivo
                o["almacen"]["respondido_por"]    = usuario
                o["almacen"]["fecha_respuesta"]   = datetime.now().isoformat()

                if respuesta == "disponible":
                    o["almacen"]["disponibilidad"]       = True
                    o["almacen"]["esperando_inventario"] = False
                    o["estado"] = "APROVISIONAMIENTO"
                    self._stamp(o, "APROVISIONAMIENTO")
                    accion = f"Almacén: DISPONIBLE — {len(equipos)} equipo(s) asignado(s)"
                elif respuesta == "no_disponible":
                    o["almacen"]["disponibilidad"]       = False
                    o["almacen"]["esperando_inventario"] = False
                    o["estado"] = "BACKLOG"
                    self._stamp(o, "BACKLOG")
                    accion = f"Almacén: NO DISPONIBLE — {motivo}"
                else:  # disponible_en_fecha
                    o["almacen"]["disponibilidad"]       = False
                    o["almacen"]["esperando_inventario"] = True
                    o["estado"] = "ESPERA_INVENTARIO"
                    self._stamp(o, "ESPERA_INVENTARIO")
                    accion = f"Almacén: DISPONIBLE EN FECHA {fecha_estimada} — {motivo}"

                o["historial"].append({"fecha": datetime.now().isoformat(), "accion": accion, "usuario": usuario})
                self._save_orders(orders)
                return o
        return None

    def asignar_equipos_almacen(self, order_id: str, equipos: List[Dict], usuario: str) -> Dict:
        """Compatibilidad retroactiva — llama a responder_almacen como 'disponible'."""
        return self.responder_almacen(order_id, "disponible", equipos, None, "", usuario)

    def aprovisionar_servicio(self, order_id: str, config: Dict, usuario: str) -> Dict:
        """US-020 / HU-07: Configuración lógica, parámetros, firmware y MAC."""
        orders = self._load_orders()
        for o in orders:
            if o["id"] == order_id:
                o["aprovisionamiento"].update(config)
                o["aprovisionamiento"]["listo"]         = True
                o["aprovisionamiento"]["aprovisionado_por"] = usuario
                o["aprovisionamiento"]["fecha_aprovisionamiento"] = datetime.now().isoformat()
                o["estado"] = "REVISION_PM"
                self._stamp(o, "REVISION_PM")
                accion_parts = ["Servicio aprovisionado"]
                if config.get("firmware"):
                    accion_parts.append(f"FW: {config['firmware']}")
                if config.get("mac_address"):
                    accion_parts.append(f"MAC: {config['mac_address']}")
                o["historial"].append({
                    "fecha": datetime.now().isoformat(),
                    "accion": " · ".join(accion_parts),
                    "usuario": usuario
                })
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
                    self._stamp(o, "LISTO_INSTALACION")
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

    def registrar_evidencia(self, order_id: str, tipo: str, filename: str, data_b64: str, usuario: str) -> Dict:
        """US-041A: Registrar foto antes/después. tipo = 'antes' | 'despues'"""
        if tipo not in ("antes", "despues"):
            raise ValueError("tipo debe ser 'antes' o 'despues'")

        # Guardar imagen en disco
        order_dir = os.path.join(EVIDENCIAS_DIR, order_id)
        os.makedirs(order_dir, exist_ok=True)
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        ext = os.path.splitext(filename)[1] or ".jpg"
        safe_filename = f"{tipo}_{ts}{ext}"
        file_path = os.path.join(order_dir, safe_filename)

        img_data = base64.b64decode(data_b64)
        with open(file_path, "wb") as f:
            f.write(img_data)

        # Guardar referencia en la orden
        orders = self._load_orders()
        for o in orders:
            if o["id"] == order_id:
                if "evidencias" not in o:
                    o["evidencias"] = {"fotos_antes": [], "fotos_despues": [], "checklist_ok": False, "notas": "", "cerrado_por": None, "fecha_cierre": None}
                foto_ref = {
                    "filename": safe_filename,
                    "path_rel": f"evidencias/{order_id}/{safe_filename}",
                    "tipo": tipo,
                    "fecha": datetime.now().isoformat(),
                    "usuario": usuario,
                    "size_kb": round(len(img_data) / 1024, 1)
                }
                if tipo == "antes":
                    o["evidencias"]["fotos_antes"].append(foto_ref)
                else:
                    o["evidencias"]["fotos_despues"].append(foto_ref)
                o["historial"].append({
                    "fecha": datetime.now().isoformat(),
                    "accion": f"Foto '{tipo}' registrada: {safe_filename}",
                    "usuario": usuario
                })
                self._save_orders(orders)
                return o
        raise ValueError(f"Orden {order_id} no encontrada")

    def cerrar_instalacion(self, order_id: str, notas: str, usuario: str) -> Dict:
        """US-041A: Cierra la instalación. Bloquea si faltan fotos antes o después."""
        orders = self._load_orders()
        for o in orders:
            if o["id"] == order_id:
                ev = o.get("evidencias", {})
                fotos_antes = ev.get("fotos_antes", [])
                fotos_despues = ev.get("fotos_despues", [])

                if len(fotos_antes) < 1:
                    raise ValueError("Se requiere al menos 1 foto ANTES de la instalación para cerrar")
                if len(fotos_despues) < 1:
                    raise ValueError("Se requiere al menos 1 foto DESPUÉS de la instalación para cerrar")

                o["evidencias"]["notas"] = notas
                o["evidencias"]["cerrado_por"] = usuario
                o["evidencias"]["fecha_cierre"] = datetime.now().isoformat()
                o["evidencias"]["checklist_ok"] = True
                o["estado"] = "CERRADO"
                o["historial"].append({
                    "fecha": datetime.now().isoformat(),
                    "accion": f"Instalación cerrada con {len(fotos_antes)} foto(s) antes y {len(fotos_despues)} foto(s) después",
                    "usuario": usuario
                })
                self._save_orders(orders)
                return o
        raise ValueError(f"Orden {order_id} no encontrada")

    def registrar_prueba_velocidad(self, order_id: str, bw_contratado_mbps: float,
                                    descarga_mbps: float, subida_mbps: float,
                                    latencia_ms: float, perdida_pct: float,
                                    servidor: str, herramienta: str, usuario: str) -> Dict:
        """US-038–040: Registrar prueba de velocidad y latencia."""
        # Criterios de aceptación: ≥90% del BW contratado, latencia ≤50ms, pérdida ≤1%
        umbral = bw_contratado_mbps * 0.9
        ok_descarga = descarga_mbps >= umbral
        ok_subida   = subida_mbps   >= umbral
        ok_latencia = latencia_ms   <= 50.0
        ok_perdida  = perdida_pct   <= 1.0
        aprobada    = ok_descarga and ok_subida and ok_latencia and ok_perdida

        prueba = {
            "id": f"PT-{uuid.uuid4().hex[:6].upper()}",
            "fecha": datetime.now().isoformat(),
            "usuario": usuario,
            "bw_contratado_mbps": bw_contratado_mbps,
            "descarga_mbps": descarga_mbps,
            "subida_mbps": subida_mbps,
            "latencia_ms": latencia_ms,
            "perdida_pct": perdida_pct,
            "servidor": servidor,
            "herramienta": herramienta,
            "resultados": {
                "ok_descarga": ok_descarga,
                "ok_subida":   ok_subida,
                "ok_latencia": ok_latencia,
                "ok_perdida":  ok_perdida,
                "aprobada":    aprobada,
                "pct_descarga": round((descarga_mbps / bw_contratado_mbps) * 100, 1) if bw_contratado_mbps else 0,
                "pct_subida":   round((subida_mbps   / bw_contratado_mbps) * 100, 1) if bw_contratado_mbps else 0,
            }
        }

        orders = self._load_orders()
        for o in orders:
            if o["id"] == order_id:
                if "pruebas_velocidad" not in o:
                    o["pruebas_velocidad"] = []
                o["pruebas_velocidad"].append(prueba)
                o["historial"].append({
                    "fecha": datetime.now().isoformat(),
                    "accion": f"Prueba velocidad {'✅ APROBADA' if aprobada else '❌ FALLIDA'}: ↓{descarga_mbps}/{bw_contratado_mbps}Mbps ↑{subida_mbps}Mbps lat:{latencia_ms}ms",
                    "usuario": usuario
                })
                self._save_orders(orders)
                return prueba
        raise ValueError(f"Orden {order_id} no encontrada")

    # ── KPIs US-054–057 ───────────────────────────────────────────────────────

    # SLAs en horas
    SLA_HORAS = {
        "preventa":         5 * 24,   # 5 días
        "almacen":          2 * 24,   # 2 días
        "aprovisionamiento": 1 * 24,  # 1 día
        "instalacion":      3 * 24,   # 3 días
        "noc":              1 * 24,   # 1 día
        "total":           15 * 24,   # 15 días
    }

    def _horas_entre(self, ts1: Optional[str], ts2: Optional[str]) -> Optional[float]:
        if not ts1 or not ts2:
            return None
        try:
            fmt = "%Y-%m-%dT%H:%M:%S.%f"
            def parse(s):
                for fmt in ("%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S"):
                    try: return datetime.strptime(s[:26], fmt)
                    except: pass
                return None
            d1, d2 = parse(ts1), parse(ts2)
            if d1 and d2:
                return round(abs((d2 - d1).total_seconds() / 3600), 2)
        except:
            pass
        return None

    def _kpi_etapa(self, horas: Optional[float], sla_horas: float) -> Dict:
        if horas is None:
            return {"horas": None, "dias": None, "sla_horas": sla_horas, "sla_dias": round(sla_horas/24, 1), "estado": "sin_datos", "pct_sla": None}
        pct = round((horas / sla_horas) * 100, 1)
        if pct <= 80:   estado = "ok"
        elif pct <= 100: estado = "alerta"
        else:            estado = "excedido"
        return {"horas": horas, "dias": round(horas/24, 2), "sla_horas": sla_horas, "sla_dias": round(sla_horas/24, 1), "estado": estado, "pct_sla": pct}

    def calcular_kpis_orden(self, order_id: str) -> Dict:
        """US-054–057: KPIs de tiempo por etapa para una orden."""
        orders = self._load_orders()
        for o in orders:
            if o["id"] == order_id:
                ts = o.get("timestamps_estados", {})
                fc = o.get("fecha_creacion")

                h_preventa        = self._horas_entre(fc or ts.get("SOLICITUD_PREVENTA"), ts.get("ALMACEN_VALIDACION"))
                h_almacen         = self._horas_entre(ts.get("ALMACEN_VALIDACION"), ts.get("APROVISIONAMIENTO"))
                h_aprovisionamiento = self._horas_entre(ts.get("APROVISIONAMIENTO"), ts.get("REVISION_PM"))
                h_instalacion     = self._horas_entre(ts.get("LISTO_INSTALACION"), ts.get("NOC_VALIDACION"))
                h_noc             = self._horas_entre(ts.get("NOC_VALIDACION"), ts.get("FACTURACION"))
                h_total           = self._horas_entre(fc or ts.get("SOLICITUD_PREVENTA"), ts.get("FACTURACION") or ts.get("CERRADO"))

                return {
                    "order_id":           order_id,
                    "cliente":            o["cliente"],
                    "servicio":           o["servicio"],
                    "estado_actual":      o["estado"],
                    "fecha_creacion":     fc,
                    "timestamps_estados": ts,
                    "etapas": {
                        "preventa":         self._kpi_etapa(h_preventa,          self.SLA_HORAS["preventa"]),
                        "almacen":          self._kpi_etapa(h_almacen,           self.SLA_HORAS["almacen"]),
                        "aprovisionamiento":self._kpi_etapa(h_aprovisionamiento, self.SLA_HORAS["aprovisionamiento"]),
                        "instalacion":      self._kpi_etapa(h_instalacion,       self.SLA_HORAS["instalacion"]),
                        "noc":              self._kpi_etapa(h_noc,               self.SLA_HORAS["noc"]),
                        "total":            self._kpi_etapa(h_total,             self.SLA_HORAS["total"]),
                    }
                }
        raise ValueError(f"Orden {order_id} no encontrada")

    def calcular_kpis_globales(self) -> Dict:
        """Agrega KPIs de todas las órdenes con datos suficientes."""
        orders = self._load_orders()
        etapas_keys = ["preventa", "almacen", "aprovisionamiento", "instalacion", "noc", "total"]
        acumulados = {k: [] for k in etapas_keys}
        por_estado: Dict[str, int] = {}
        ordenes_con_kpis = []

        for o in orders:
            por_estado[o["estado"]] = por_estado.get(o["estado"], 0) + 1
            try:
                kpi = self.calcular_kpis_orden(o["id"])
                ordenes_con_kpis.append(kpi)
                for k in etapas_keys:
                    h = kpi["etapas"][k]["horas"]
                    if h is not None:
                        acumulados[k].append(h)
            except:
                pass

        promedios = {}
        for k, vals in acumulados.items():
            if vals:
                promedios[k] = {
                    "promedio_horas": round(sum(vals)/len(vals), 2),
                    "promedio_dias":  round(sum(vals)/len(vals)/24, 2),
                    "min_horas":      round(min(vals), 2),
                    "max_horas":      round(max(vals), 2),
                    "n":              len(vals),
                    "sla_horas":      self.SLA_HORAS[k],
                    "pct_dentro_sla": round(sum(1 for v in vals if v <= self.SLA_HORAS[k]) / len(vals) * 100, 1),
                }
            else:
                promedios[k] = {"n": 0}

        return {
            "total_ordenes": len(orders),
            "por_estado": por_estado,
            "promedios_etapas": promedios,
            "ordenes": ordenes_con_kpis,
            "slas": self.SLA_HORAS,
        }

    def obtener_pruebas_velocidad(self, order_id: str) -> List[Dict]:
        """Retorna historial de pruebas de velocidad de una orden."""
        orders = self._load_orders()
        for o in orders:
            if o["id"] == order_id:
                return o.get("pruebas_velocidad", [])
        raise ValueError(f"Orden {order_id} no encontrada")

    def _stamp(self, o: Dict, estado: str):
        """Registra el timestamp de entrada a un estado."""
        if "timestamps_estados" not in o:
            o["timestamps_estados"] = {}
        if estado not in o["timestamps_estados"]:   # solo el primer ingreso
            o["timestamps_estados"][estado] = datetime.now().isoformat()

    def _get_noc(self, o: Dict) -> Dict:
        """Devuelve o inicializa el bloque noc de una orden."""
        if "noc" not in o:
            o["noc"] = {"ping_ok": None, "latencia_ms": None, "dado_de_alta": False, "herramienta_monitoreo": None, "host_id": None, "alertas_configuradas": False, "grupos_alerta": [], "aprobado": False, "aprobado_por": None, "fecha_alta": None, "observaciones": ""}
        return o["noc"]

    def registrar_ping_noc(self, order_id: str, ping_ok: bool, latencia_ms: float,
                            ip_destino: str, usuario: str) -> Dict:
        """US-047: NOC valida conectividad con ping."""
        orders = self._load_orders()
        for o in orders:
            if o["id"] == order_id:
                noc = self._get_noc(o)
                noc["ping_ok"]    = ping_ok
                noc["latencia_ms"] = latencia_ms
                noc["ip_destino"] = ip_destino
                if o["estado"] in ("LISTO_INSTALACION", "INSTALACION", "CERRADO"):
                    o["estado"] = "NOC_VALIDACION"
                    self._stamp(o, "NOC_VALIDACION")
                o["historial"].append({
                    "fecha": datetime.now().isoformat(),
                    "accion": f"NOC Ping {'✅ OK' if ping_ok else '❌ FALLO'} → {ip_destino} ({latencia_ms}ms)",
                    "usuario": usuario
                })
                self._save_orders(orders)
                return o
        raise ValueError(f"Orden {order_id} no encontrada")

    def dar_alta_monitoreo(self, order_id: str, herramienta: str, host_id: str,
                            grupos_alerta: List[str], usuario: str) -> Dict:
        """US-048–049: Alta en sistema de monitoreo + configurar alertas."""
        orders = self._load_orders()
        for o in orders:
            if o["id"] == order_id:
                noc = self._get_noc(o)
                noc["dado_de_alta"]          = True
                noc["herramienta_monitoreo"] = herramienta
                noc["host_id"]               = host_id
                noc["alertas_configuradas"]  = len(grupos_alerta) > 0
                noc["grupos_alerta"]         = grupos_alerta
                noc["fecha_alta"]            = datetime.now().isoformat()
                o["historial"].append({
                    "fecha": datetime.now().isoformat(),
                    "accion": f"Alta en monitoreo {herramienta}: host={host_id}, alertas={grupos_alerta}",
                    "usuario": usuario
                })
                self._save_orders(orders)
                return o
        raise ValueError(f"Orden {order_id} no encontrada")

    def aprobar_noc(self, order_id: str, observaciones: str, usuario: str) -> Dict:
        """US-050: NOC confirma monitoreo activo y aprueba para facturación."""
        orders = self._load_orders()
        for o in orders:
            if o["id"] == order_id:
                noc = self._get_noc(o)
                if not noc.get("ping_ok"):
                    raise ValueError("No se puede aprobar: ping NOC no registrado o fallido")
                if not noc.get("dado_de_alta"):
                    raise ValueError("No se puede aprobar: equipo no dado de alta en monitoreo")
                noc["aprobado"]       = True
                noc["aprobado_por"]   = usuario
                noc["observaciones"]  = observaciones
                o["estado"] = "FACTURACION"
                self._stamp(o, "FACTURACION")
                o["historial"].append({
                    "fecha": datetime.now().isoformat(),
                    "accion": f"NOC aprobó — equipo en monitoreo activo. Listo para facturación",
                    "usuario": usuario
                })
                self._save_orders(orders)
                return o
        raise ValueError(f"Orden {order_id} no encontrada")

    def obtener_estado_noc(self, order_id: str) -> Dict:
        orders = self._load_orders()
        for o in orders:
            if o["id"] == order_id:
                return self._get_noc(o)
        raise ValueError(f"Orden {order_id} no encontrada")

    def obtener_checklist(self, order_id: str) -> List[Dict]:
        """US-036: Devuelve checklist de la orden. Si no existe, genera uno nuevo."""
        orders = self._load_orders()
        for o in orders:
            if o["id"] == order_id:
                if "checklist" not in o or not o["checklist"]:
                    o["checklist"] = [
                        {**item, "completado": False, "completado_por": None, "fecha_completado": None, "observacion": ""}
                        for item in CHECKLIST_ITEMS
                    ]
                    self._save_orders(orders)
                return o["checklist"]
        raise ValueError(f"Orden {order_id} no encontrada")

    def marcar_checklist_item(self, order_id: str, item_id: str, completado: bool, observacion: str, usuario: str) -> Dict:
        """US-036: Marcar/desmarcar un item del checklist."""
        orders = self._load_orders()
        for o in orders:
            if o["id"] == order_id:
                if "checklist" not in o:
                    o["checklist"] = [
                        {**item, "completado": False, "completado_por": None, "fecha_completado": None, "observacion": ""}
                        for item in CHECKLIST_ITEMS
                    ]
                for item in o["checklist"]:
                    if item["id"] == item_id:
                        item["completado"] = completado
                        item["observacion"] = observacion
                        item["completado_por"] = usuario if completado else None
                        item["fecha_completado"] = datetime.now().isoformat() if completado else None
                        break

                completados = sum(1 for i in o["checklist"] if i["completado"])
                total = len(o["checklist"])
                o["historial"].append({
                    "fecha": datetime.now().isoformat(),
                    "accion": f"Checklist {item_id}: {'✓' if completado else '✗'} ({completados}/{total})",
                    "usuario": usuario
                })
                self._save_orders(orders)
                return o
        raise ValueError(f"Orden {order_id} no encontrada")

    def obtener_evidencias(self, order_id: str) -> Dict:
        """Retorna evidencias con fotos en base64 para visualización en UI."""
        orders = self._load_orders()
        for o in orders:
            if o["id"] == order_id:
                ev = o.get("evidencias", {"fotos_antes": [], "fotos_despues": []})
                result = {"fotos_antes": [], "fotos_despues": [], "checklist_ok": ev.get("checklist_ok", False), "notas": ev.get("notas", ""), "cerrado_por": ev.get("cerrado_por"), "fecha_cierre": ev.get("fecha_cierre")}

                for lista_key in ("fotos_antes", "fotos_despues"):
                    for foto in ev.get(lista_key, []):
                        file_path = os.path.join(EVIDENCIAS_DIR, order_id, foto["filename"])
                        foto_out = dict(foto)
                        if os.path.exists(file_path):
                            with open(file_path, "rb") as f:
                                foto_out["data_b64"] = base64.b64encode(f.read()).decode()
                        result[lista_key].append(foto_out)
                return result
        raise ValueError(f"Orden {order_id} no encontrada")
