# Sistema de Tokens de Oportunidad Ganada — XCIEN 2.0

**Fecha:** 2026-04-25  
**Estado:** Implementado — en definición de casos de uso  
**Empresas:** Xcien, Luminet, Wispi, Huus

---

## Qué es

Un sistema de **tokens firmados internamente** que registra y certifica eventos comerciales importantes dentro de las operadoras del grupo.

No requiere blockchain, wallets ni costo de transacción. Cada token es un documento JSON con firma criptográfica HMAC-SHA256 que garantiza que su contenido no fue alterado desde que se emitió.

---

## Archivos relevantes

| Archivo | Descripción |
|---------|-------------|
| `backend/agents/token_service.py` | Lógica de emisión, verificación y listado |
| `backend/db/tokens.json` | Base de datos de tokens emitidos |
| `backend/servidor_academia.py` | Endpoints REST del sistema |

---

## Estructura de un token

```json
{
  "token_id": "uuid-único",
  "tipo": "oportunidad_ganada",
  "empresa": "xcien",
  "oportunidad_id": "OPP-001",
  "cliente": "Nombre del cliente",
  "vendedor": "Nombre del vendedor",
  "monto": 2500.0,
  "extra": { "nombre_oportunidad": "Proyecto fibra norte" },
  "emitido_en": "2026-04-25T18:00:00+00:00",
  "firma": "sha256-hash-unico"
}
```

---

## Endpoints disponibles

### Emitir token manualmente
```
POST /api/tokens/emitir
```
```json
{
  "empresa": "xcien",
  "oportunidad_id": "OPP-001",
  "cliente": "Empresa S.A.",
  "vendedor": "Juan Pérez",
  "monto": 5000.0
}
```

### Verificar autenticidad
```
GET /api/tokens/verificar/{token_id}
```
Respuesta si válido:
```json
{ "valido": true, "token": { ... } }
```
Respuesta si comprometido:
```json
{ "valido": false, "motivo": "Firma inválida — token comprometido" }
```

### Listar tokens
```
GET /api/tokens
GET /api/tokens?empresa=luminet
```

### Webhook Odoo (automático)
```
POST /api/webhook/odoo/oportunidad-ganada
```
Odoo llama este endpoint automáticamente cuando una oportunidad cambia a etapa ganada.

---

## Flujo de operación

```
Vendedor cierra oportunidad en Odoo CRM
        ↓
Odoo dispara webhook automático
        ↓
Backend recibe evento y detecta empresa
(xcien / luminet / wispi / huus)
        ↓
Se emite token firmado con datos del cierre
        ↓
Token queda almacenado y disponible para:
  - consulta por frontend
  - validación por terceros
  - activación de beneficios (por definir)
```

---

## Configuración en Odoo

1. Ir a `Ajustes → Técnico → Automatizaciones`
2. Nueva automatización:
   - **Modelo:** CRM Oportunidad
   - **Disparador:** Al actualizar → campo `stage_id` cuando sea etapa ganada
   - **Acción:** Llamar webhook
   - **URL:** `http://tu-servidor:8000/api/webhook/odoo/oportunidad-ganada`

---

## Seguridad

- La firma usa HMAC-SHA256 con una clave secreta definida en `.env` como `TOKEN_SECRET`
- La comparación de firmas usa `hmac.compare_digest` para prevenir ataques de timing
- Los tokens son inmutables: cualquier modificación invalida la firma

---

## Variable de entorno requerida

```env
TOKEN_SECRET=clave-secreta-segura-aqui
```

Si no se define, usa `xcien-secret-2026` por defecto (cambiar en producción).

---

## Casos de uso (por definir)

*Pendiente de definición con el equipo. Los tokens ya están siendo emitidos y almacenados; la lógica de qué activan o representan se configurará en la siguiente fase.*

---

## Migración futura a blockchain

El sistema está diseñado para migrar a blockchain sin cambiar la interfaz. El `token_id` y la estructura de datos son compatibles con NFT standards (ERC-721 metadata). Cuando se decida migrar, el `token_service.py` puede reemplazarse sin afectar los endpoints ni el frontend.
