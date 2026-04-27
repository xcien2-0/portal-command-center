# Interacción de Agentes XCIEN 2.0
## Flujos Operativos y Orquestación

Este documento detalla cómo los diferentes Agentes de la plataforma XCIEN 2.0 interactúan entre sí para lograr una operación automatizada y profesional.

---

### 1. Flujo de Asignación Inteligente de Tickets
Este flujo involucra la colaboración entre **ERP (Odoo)**, **RRHH (Academia)** y **WFM (Dispatch)** para asegurar que cada ticket sea atendido por el técnico más capacitado disponible en la zona.

```mermaid
sequenceDiagram
    participant Odoo as 🗄️ Agente Odoo (ERP)
    participant DG as 🎯 Director General
    participant RRHH as 🎓 Agente RRHH
    participant WFM as 🚚 Agente WFM
    
    Odoo->>DG: Nuevo Ticket de Instalación Creado
    DG->>WFM: Iniciar proceso de asignación
    WFM->>RRHH: Consultar Matriz de Habilidades de Técnicos Libres
    RRHH-->>WFM: Retorna % de Skill por Técnico
    WFM->>WFM: Filtra por Zona Geográfica + Skill > 80%
    WFM->>Odoo: Actualiza ticket con Técnico Asignado
    Odoo-->>DG: Confirmación de agenda
```

---

### 2. Flujo de Soporte y Escalación en Campo
Define el proceso de atención a incidentes desde el monitoreo de red hasta la ejecución en campo con soporte experto.

```mermaid
sequenceDiagram
    participant NOC as 📡 Agente NOC
    participant DG as 🎯 Director General
    participant FS as 🔧 Agente Operaciones (FS)
    participant Odoo as 🗄️ Agente Odoo (ERP)
    
    NOC->>DG: Alarma de Degradación Detectada
    DG->>FS: Solicitar inspección de antena en sitio
    FS->>FS: Validación de Niveles (Estándar -35 a -45 dBi)
    FS->>Odoo: Subir Evidencia Fotográfica y Consumo de Materiales
    Odoo->>Odoo: Validación de Regla "Cero Basura"
    Odoo-->>DG: Ticket Cerrado Exitosamente
```

---

### 3. Flujo Comercial y Factibilidad Técnica
Asegura que todas las ventas estén respaldadas por viabilidad técnica antes de ser confirmadas y enviadas a campo.

```mermaid
sequenceDiagram
    participant CRM as 💼 Agente Comercial
    participant DG as 🎯 Director General
    participant PRE as 🗺️ Agente Preventa
    participant Odoo as 🗄️ Agente Odoo (ERP)
    
    CRM->>DG: Solicitud de Nuevo Servicio (Lead)
    DG->>PRE: Analizar Coordenadas y Línea de Vista (LV)
    PRE->>PRE: Simulación de Factibilidad
    alt Factibilidad OK
        PRE-->>DG: Viabilidad Confirmada
        DG->>Odoo: Convertir Lead a Oportunidad Ganada
    else Factibilidad NOK
        PRE-->>DG: Sin Línea de Vista
        DG->>CRM: Detener proceso de venta
    end
```

---

## Principios de Orquestación

1. **Centralización en el Director General:** Ningún agente toma decisiones destructivas (como cerrar una venta sin factibilidad) sin pasar por el orquestador principal.
2. **La Verdad Reside en Odoo:** Toda transacción, evidencia y estado actual se sincroniza en Odoo. Es la base de datos maestra.
3. **Calidad por Diseño (Academia):** La certificación continua en los "5 Pilares Maestros" restringe automáticamente quién puede ser despachado a tickets complejos.
