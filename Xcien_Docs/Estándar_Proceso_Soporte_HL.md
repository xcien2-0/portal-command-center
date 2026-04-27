# Estándar HL: Proceso de Soporte Xcien

## 1. Objetivo
Estandarizar el flujo de atención a fallas y soporte técnico de Xcien, definiendo los niveles de escalación (NOC, PMO, Ops Campo, Infraestructura e Ingeniería) para garantizar una resolución rápida de incidentes (Cierre de Ticket).

## 2. Niveles de Atención
*Proceso basado en el diagrama oficial "Proceso HL Soporte" (Abril 2024).*

## 3. Desarrollo del Flujo de Soporte

### 3.1. ATC (Atención a Clientes)
1. **Reporte Cliente:** Recepción inicial de la falla por cualquier canal oficial.
2. **Generación de Ticket:** Registro en la plataforma (Odoo) con los datos del reporte.

### 3.2. NOC (Network Operations Center) - Nivel 1 y 2
1. **Soporte Nivel 1 (Sol L1):** Evaluación inicial y resolución básica.
   - Si **SI (Sol OK)**: Se notifica el **Cierre**.
   - Si **NO**: Escalación a Nivel 2.
2. **Soporte Nivel 2 (Sol L2):** Análisis técnico intermedio.
   - Si **SI (Sol OK)**: Se notifica el **Cierre**.
   - Si **NO**: El NOC determina si la falla requiere visita técnica en sitio o apoyo de infraestructura/ingeniería.

### 3.3. PMO (Project Management Office) y Agendamiento
1. **Requerimiento FS (Field Service):** Si la falla es física en sitio.
2. **Validación (Info OK?):**
   - Si **SI**: Se realiza la **Agenda de Visita**.
   - Si **NO**: Se regresa a Soporte L2 para depuración de información.

### 3.4. Operaciones de Campo (Ops Campo) - Soporte en Sitio
1. **Ejecución de Soporte (Sol OK?):** El técnico revisa la infraestructura en sitio.
   - Si **SI**: Se cierra el ciclo.
   - Si **NO**: El técnico solicita apoyo especializado.
2. **Apoyo Infraestructura / L3:** Escalamiento en campo si se detectan problemas de niveles superiores.

### 3.5. Infraestructura e Ingeniería
1. **Soporte de Infraestructura:** Resolución de fallas en torres, sitios de repetición o radio bases (**Sol OK?**).
2. **Soporte de Ingeniería:** Resolución de fallas de ruteo, IP o arquitectura lógica (**Sol OK?**).
   - En ambos casos, una vez resuelto (**SI**), se notifica el **Cierre de Ticket** definitivo.

## 4. Matriz de Cierre
- El único departamento que detona la **Notificación de Cierre** es aquel que resuelve la falla en su nivel correspondiente (NOC, Campo, Infra o Ingeniería).
- La comunicación debe fluir siempre de regreso al cliente para validar la satisfacción del servicio.

---
**Documento generado por el Agente de Profesionalización Xcien.**
