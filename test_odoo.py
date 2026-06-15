import os
import xmlrpc.client
from dotenv import load_dotenv

# Cargar las variables desde el archivo .env
load_dotenv()

ODOO_URL = os.environ.get("ODOO_URL")
ODOO_DB = os.environ.get("ODOO_DB")
ODOO_USER = os.environ.get("ODOO_USER")
ODOO_PASSWORD = os.environ.get("ODOO_PASSWORD")

def test_odoo_connection():
    print(f"📡 Intentando conectar a Odoo en: {ODOO_URL}")
    print(f"📦 Base de Datos: {ODOO_DB}")
    print(f"👤 Usuario: {ODOO_USER}")
    
    if "tu_correo@xcien.mx" in ODOO_USER or "nombre_de_tu_base_de_datos" in ODOO_DB:
        print("\n❌ ALTO: Pareces no haber llenado tus datos reales en el archivo .env")
        print("Por favor, abre el archivo .env y cambia los datos de prueba por los correctos.")
        return

    try:
        # En Odoo xmlrpc hay dos endpoints: común (para login) y object (para consultas)
        common = xmlrpc.client.ServerProxy('{}/xmlrpc/2/common'.format(ODOO_URL))
        
        # El authenticate devuelve el "UID" del usuario si fue correcto
        uid = common.authenticate(ODOO_DB, ODOO_USER, ODOO_PASSWORD, {})
        
        if uid:
            print(f"\n✅ ¡ÉXITO TOTAL! Conexión a Odoo establecida.")
            print(f"🔑 UID asignado por el servidor: {uid}")
            
            # Hagamos una prueba súper rapida leyendo tu nombre desde la BD
            models = xmlrpc.client.ServerProxy('{}/xmlrpc/2/object'.format(ODOO_URL))
            user_info = models.execute_kw(ODOO_DB, uid, ODOO_PASSWORD,
                'res.users', 'read', [[uid]], {'fields': ['name', 'login']})
            
            print(f"🧠 Hola desde Odoo, {user_info[0]['name']}")
            print("El Agente ahora tiene permisos para leer y escribir tickets en nombre tuyo.")
            
        else:
            print("\n❌ Error de acceso: Usuario o Contraseña incorrectos")
            print("Verifica que tu usuario sea el correo completo y tu contraseña esté bien escrita.")
            print("(Si tienes código de doble factor 2FA en Odoo, ocuparemos sacar un API Key especial).")

    except Exception as e:
        print(f"\n⚠️ Error crítico conectando con el servidor:\n{e}")

if __name__ == "__main__":
    test_odoo_connection()
