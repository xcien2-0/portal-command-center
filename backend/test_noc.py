import requests
import json

def test_noc_integration():
    print("🔍 Iniciando prueba de integración NOC (Puerto 9401)...")
    
    # 1. Probar conexión directa a NOCBoard en 9401
    try:
        r_direct = requests.get("http://localhost:9401/api/hosts", timeout=2)
        if r_direct.status_code == 200:
            count = r_direct.json().get("count", 0)
            print(f"✅ Conexión directa a NOCBoard (9401) EXITOSA. Hosts detectados: {count}")
        else:
            print(f"❌ Fallo conexión directa a 9401. Status: {r_direct.status_code}")
    except Exception as e:
        print(f"❌ Error conectando a 9401: {e}")

    # 2. Probar nuestro Backend (Puerto 8000)
    try:
        r_api = requests.get("http://localhost:8000/api/noc/summary", timeout=2)
        if r_api.status_code == 200:
            summary = r_api.json()
            print(f"✅ API XCIEN (8000) EXITOSA. Resumen: {summary}")
        else:
            print(f"❌ API XCIEN (8000) falló. Status: {r_api.status_code}")
    except Exception as e:
        print(f"❌ Error conectando a API 8000: {e}")

if __name__ == "__main__":
    test_noc_integration()
