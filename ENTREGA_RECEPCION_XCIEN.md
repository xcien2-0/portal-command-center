# ACTA DE ENTREGA-RECEPCIÓN — XCIEN 2.0
## Estandarización Operativa y Profesionalización del Capital Humano

---

**Fecha:** 22 de Abril de 2026
**Responsable de Entrega:** Dirección General XCIEN
**Objetivo:** Consolidar, documentar y estandarizar el 100% de los procesos operativos y técnicos de XCIEN para garantizar su escalabilidad y profesionalización.

---

## PILAR I — ESTÁNDARES TÉCNICOS Y DE CAMPO

### 1.1 Estándares de Instalación

| Tipo | Altura | Herrajes | Ángulo / Separación | Observaciones |
|------|--------|----------|---------------------|---------------|
| Empotrado | 3m máx | 2 herrajes V | Separación 30 cm, pija broca | — |
| Tensado | 3m / 6m | Anclajes a 120° | Ángulo 45° | Resguardo: 1m arriba, 2m abajo |
| Telescópico | 12m | 4 niveles de retenidas | Anclajes a 5m de la base | Requiere LO autorizado |

### 1.2 Niveles de RF — Tabla de Referencia

| Rango (dBi) | Estado | Acción |
|-------------|--------|--------|
| 35 – 45 | Excelente | Proceder con instalación |
| 46 – 60 | Aceptable | Documentar y notificar |
| 61 – 74 | Degradado | Escalar a Ingeniería |
| ≥ 75 | Crítico | No instalar — dictaminar No Factible |

### 1.3 Protocolo de Calidad "Cero Basura"
- Evidencia fotográfica obligatoria al cierre de cada servicio.
- Registro de tarea completada en Odoo (`wispi17`) con foto de sitio limpio.
- Auditoría aleatoria diaria: 1 instalación verificada por Supervisor o Líder de Operaciones.

### 1.4 Flujos Operativos

**Implementación de Servicios:**
Venta → Comercial (Validación) → PMO (Agendamiento) → Almacén (Equipo OK) → Ops Campo (Ejecución) → Ingeniería → NOC (Liberación de Acceso)

**Soporte y Atención a Fallas:**
Reporte Cliente → ATC (Ticket) → NOC (L1/L2) → PMO (Field Service) → Ops Campo (Solución) → Infra/Ingeniería → Cierre y Notificación

---

## PILAR II — PROTOCOLO DE ESCALAFÓN TÉCNICO

### 2.1 Ruta: Auxiliar → Técnico de Instalación

**Objetivo:** Garantizar que el técnico ejecute instalaciones estándar de forma autónoma cumpliendo la calidad XCIEN.

#### Requisitos de Certificación (Academia)

| # | Requisito | Criterio de Aprobación |
|---|-----------|------------------------|
| 1 | Examen Teórico (Academia Digital) | Puntaje ≥ 90% |
| 2 | Seguridad Industrial — Arnés 5 puntos y ganchos dobles | Dominio total verificado en campo |
| 3 | RF Básico — Tabla de decibeles | Identificar rangos sin apoyo |

#### Evaluación de Campo

| # | Requisito | Criterio |
|---|-----------|----------|
| 1 | Instalaciones asistidas con Técnico Senior | Mínimo 15 servicios |
| 2 | Cierre de tareas en Odoo con evidencia fotográfica | 100% de servicios |
| 3 | Inventario personal de herramientas | Completo y verificado |

#### Proceso de Promoción
1. El sistema WFM detecta cumplimiento de servicios requeridos.
2. El Agente de RRHH genera examen personalizado basado en errores previos.
3. El Director General analiza % de éxito en campo + nota de examen y emite recomendación.
4. Se actualiza la Matriz de Habilidades 2026 y se notifica a Nóminas vía Odoo.

---

### 2.2 Ruta: Técnico → Líder de Operaciones en Campo (LO)

**Objetivo:** Formar líderes capaces de tomar decisiones técnicas complejas y supervisar la calidad de múltiples cuadrillas.

#### Competencias Estratégicas Requeridas

| # | Competencia | Descripción |
|---|-------------|-------------|
| 1 | Factibilidad Avanzada | Dictaminar sitios "No Factibles" — maquetas 3m, 6m y 12m telescópico |
| 2 | Gestión ERP (Odoo) | Registro de viáticos, materiales especiales y gestión de tickets en `wispi17` |
| 3 | Liderazgo de Seguridad | Responsable de la integridad física de Auxiliar y Técnico a su cargo |
| 4 | Supervisión de Cuadrilla | Auditoría de calidad, puntualidad y uniformidad del equipo |

#### Proceso de Promoción
1. El sistema WFM detecta cumplimiento de métricas de liderazgo.
2. El Agente de RRHH genera examen avanzado de competencias estratégicas.
3. El Director General valida resultados y emite nombramiento formal.
4. Se actualiza rol en Odoo y se reporta a Nóminas.

---

## PILAR III — ECOSISTEMA DIGITAL Y ERP

### 3.1 Estado de Integraciones

| Sistema | Estado | Detalles |
|---------|--------|----------|
| Odoo (`wispi17`) | Activo | UID 944 — JOSE MIGUEL MACIAS |
| Claude (Anthropic) | Activo | `claude-3-5-sonnet-20241022` |
| Gemini (Antigravity) | Activo | Google DeepMind local |
| GitHub | Activo | `jmmcmx/XCIEN2.0`, `jmmcmx/live-status-hub` |
| Lovable (live-status-hub) | En desarrollo | React + Supabase |

### 3.2 Operadores Activos en Plataforma

| Operador | Región | Estado |
|----------|--------|--------|
| XCIEN | Nuevo León / Jalisco | Activo |
| Wispi | Nuevo León / Jalisco | Activo |
| Luminet WAN | Coahuila | Activo |
| Huus | CDMX / Gto / Qro | Activo |
| Sandur | — | Activo |

### 3.3 Módulos del Portal (live-status-hub)

| Módulo | Estado | Prioridad |
|--------|--------|-----------|
| NOC — Vista Global | En desarrollo | Alta |
| Dispatch | Funcional (Supabase) | Alta |
| Call Center | Funcional (Supabase) | Alta |
| Red en Vivo | En desarrollo | Media |
| Reportes Gobierno | En desarrollo | Media |
| Gerencia | En desarrollo | Media |
| Scanner de Campo | En desarrollo | Alta |
| Academia | En desarrollo | Alta |

---

## PILAR IV — ESTRUCTURA ORGANIZACIONAL

### 4.1 Modelo de Gobernanza XCIEN 2.0

| Área | Responsabilidad |
|------|----------------|
| Dirección General | Orquestación estratégica |
| Operaciones | Calidad técnica y seguridad en campo |
| RRHH / Academia | Capacitación, evaluación y escalafón |
| Odoo Sync | Gestión de datos, viáticos y recursos |
| NOC / Dispatch | Logística y salud de red |

### 4.2 Cobertura Estratégica

| Región | Operador |
|--------|----------|
| Nuevo León / Jalisco | XCIEN / Wispi |
| Coahuila | Luminet WAN |
| CDMX / Gto / Qro | Huus |
| Yucatán | Senel |

---

## ESTADO GENERAL DEL ACTA

| Pilar | Avance | Siguiente Paso |
|-------|--------|----------------|
| I — Estándares Técnicos | 80% | Validar con Ops campo |
| II — Escalafón Técnico | 90% | Activar en Academia Digital |
| III — Ecosistema Digital | 60% | Ambiente de pruebas Odoo |
| IV — Organización | 70% | Completar matriz de competencias 2026 |

---

## FIRMAS DE AUTORIZACIÓN

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Director General | | | |
| Gerente de Operaciones | | | |
| Responsable de RRHH | | | |
| Responsable TI / Digital | | | |

---

*Documento oficial XCIEN 2.0 — Única Fuente de Verdad (Single Source of Truth)*
*Repositorio: github.com/jmmcmx/XCIEN2.0*
*Prohibida su reproducción parcial o total sin autorización de la Dirección General.*
