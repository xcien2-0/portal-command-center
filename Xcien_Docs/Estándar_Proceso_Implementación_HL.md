# Estándar HL: Proceso de Implementación Xcien

## 1. Objetivo
Definir el flujo de trabajo de "Alto Nivel" (High Level) para la implementación de nuevos servicios, desde la venta inicial hasta la liberación técnica y de accesos, garantizando la coordinación entre todas las áreas involucradas (PMO, Campo, Almacén, NOC, Ingeniería).

## 2. Diagrama de Referencia
*Proceso basado en el diagrama oficial "Proceso HL Implementación" (Abril 2024).*

## 3. Desarrollo del Flujo por Departamentos

### 3.1. Comercial / Preventa
1. **Venta:** Inicio del proceso tras el cierre comercial.
2. **Validación de Información:** Se envía la información al PMO para validar si los datos son correctos (**Info Ok?**).
   - Si **NO**: Se regresa a Comercial para corrección.
   - Si **SI**: Avanza a la fase de PMO.

### 3.2. Project Management Office (PMO)
1. **Solicitud de Equipos:** El PMO genera el requerimiento de materiales necesarios.
2. **Documentación de Equipos:** Supervisa que los folios y requerimientos estén asignados.
3. **Solicitud de Provisión:** Detona la configuración lógica del servicio.
4. **Revisión de Instalación:** Valida los reportes previos y programa la **Agenda de Instalación**.

### 3.3. Almacén
1. **Validación de Inventario (Equipo OK?):**
   - Si **SI**: Se realiza la **Asignación de Equipos**.
   - Si **NO**: Se detona el flujo de **Compra** para adquisición de materiales.

### 3.4. Operaciones de Campo (Ops Campo)
1. **Ejecución de Instalación:** Basado en la agenda, el equipo técnico acude al sitio.
2. **Validación (Inst OK?):**
   - Si **SI**: El proceso avanza a Ingeniería y NOC.
   - Si **NO**: Se regresa a PMO para re-agendar o Provisión para soporte.

### 3.5. Provisión e Ingeniería
1. **Provisión:** Gestiona el servicio documental y genera la configuración lógica (**Genera Doc**).
2. **Ingeniería:** Realiza la validación técnica final (**Ing OK?**).
3. **Liberación de Ingeniería:** Una vez validado, se libera el flujo hacia el NOC.

### 3.6. NOC (Network Operations Center)
1. **Validación Final (Ing OK?):**
   - Si **SI**: Se procede a la **Liberación de Acceso** definitiva para el cliente.
   - Si **NO**: Se escala a Ingeniería para corrección de configuración.

## 4. Puntos Críticos de Control
- **Decisión Info Ok:** Evita que el equipo técnico pierda tiempo en sitio con datos incompletos.
- **Decisión Equipo OK:** Asegura que Almacén detone compras con antelación si no hay stock.
- **Liberación de Acceso:** Último filtro de seguridad antes de entregar el servicio al cliente.

---
**Documento generado por el Agente de Profesionalización Xcien.**
