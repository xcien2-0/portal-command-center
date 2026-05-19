import xmlrpc.client
import os
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger("ODOO-CONNECTOR")

class OdooConnector:
    """
    Conector bidireccional para Odoo.
    Permite lectura y escritura (Create, Write, Unlink) en modelos de Odoo.
    """
    
    def __init__(self):
        self.url = os.environ.get("ODOO_URL")
        self.db = os.environ.get("ODOO_DB")
        self.user = os.environ.get("ODOO_USER")
        self.password = os.environ.get("ODOO_PASSWORD")
        self.uid = None
        self.models = None

    def _connect(self):
        if self.uid: return True
        try:
            if not all([self.url, self.db, self.user, self.password]):
                logger.warning("Faltan credenciales de Odoo en el entorno.")
                return False
            
            common = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/common')
            self.uid = common.authenticate(self.db, self.user, self.password, {})
            if self.uid:
                self.models = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/object')
                logger.info(f"Conexión exitosa a Odoo DB: {self.db} (UID: {self.uid})")
                return True
            return False
        except Exception as e:
            logger.error(f"Error de conexión a Odoo: {e}")
            return False

    def execute(self, model: str, method: str, *args, **kwargs) -> Any:
        """Ejecuta cualquier método en Odoo (search_read, create, write, etc)"""
        if not self._connect():
            return None
        try:
            return self.models.execute_kw(self.db, self.uid, self.password, model, method, args, kwargs)
        except Exception as e:
            logger.error(f"Error ejecutando {method} en {model}: {e}")
            # Resetear conexión para que el próximo request reconecte
            self.uid = None
            self.models = None
            # Reintentar una vez
            try:
                if self._connect():
                    return self.models.execute_kw(self.db, self.uid, self.password, model, method, args, kwargs)
            except Exception as e2:
                logger.error(f"Reintento fallido {method} en {model}: {e2}")
            return None

    # --- Métodos de Conveniencia ---

    def create_record(self, model: str, vals: Dict[str, Any]) -> Optional[int]:
        """Crea un registro y devuelve su ID"""
        return self.execute(model, 'create', [vals])

    def write_record(self, model: str, record_id: int, vals: Dict[str, Any]) -> bool:
        """Actualiza un registro existente"""
        return self.execute(model, 'write', [[record_id], vals])

    def search_read(self, model: str, domain: List = [], fields: List = [], limit: int = 80) -> List[Dict]:
        """Busca y lee registros"""
        result = self.execute(model, 'search_read', domain, {'fields': fields, 'limit': limit})
        return result if result else []

odoo_conn = OdooConnector()
