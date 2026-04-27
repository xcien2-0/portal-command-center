# Contexto del Proyecto — Live Status Hub XCIEN
> Briefing de Traspaso Operativo (Antigravity → Claude) · Actualizado 2026-04-26

---

## 🚀 Estado de la Unificación Operativa

Se ha completado la cirugía mayor de arquitectura para consolidar el portal bajo una experiencia única de "Fuente Única de Verdad".

### 1. Reestructuración de Rutas y Navegación
- **Hub Principal (`/`)**: Se restauró como la landing page central con tarjetas interactivas, ya que es el flujo preferido del usuario.
- **XCIEN 2.0 (`/xcien2`)**: Es ahora el **Dashboard Holo Unificado**. Se eliminó la fragmentación de rutas. 
- **Deep Linking**: Se implementó soporte para parámetros de URL (`/xcien2?section=noc`). Esto permite que las tarjetas del Hub Principal abran directamente el módulo correspondiente en la interfaz Holo.
- **Sidebar Inteligente**: Organizado por grupos: `Operaciones`, `Certificación & Academia`, `Administración` y `Configuración`.

### 2. Módulos Preservados e Integrados
Todos los módulos avanzados se mantienen funcionales y están mapeados en `src/pages/xcien2/index.tsx`:
- **NOC (Red en Vivo)**: Unificado con selector de Tenants y vistas Operador/Gerencial.
- **Academia & Holo**: El examen de certificación y el registro de tokens están integrados en el grupo de Certificación.
- **WFM, Call Center, Scanner, Gerencia y Reportes**: Todos migrados al shell holográfico.

### 3. Sistema de Temas Globales (Uniformidad)
Se implementó un motor de temas inyectado en el `:root` del documento para que toda la plataforma cambie de color simultáneamente.
- **Temas Disponibles**: Matrix (Verde terminal), Cyberpunk (Neon Rosa/Cian), Gamer RGB, Medianoche, Ocean y Corporativo.
- **Variables CSS**: Se usan `--xcien-accent`, `--xcien-bg`, `--xcien-card`, etc., en todos los componentes.

### 4. 🌉 Agente Puente (Antigravity Bridge)
Se creó un "puente" de comunicación entre el proceso de desarrollo de la IA y el portal:
- **Backend**: Nuevo endpoint `/api/bridge` (GET/POST) para reportar el estado de las tareas del agente.
- **Frontend**: El `FloatingChat` ahora tiene una sección de "Feedback del Agente" que muestra lo que la IA está haciendo en tiempo real.

---

## 🛠️ Stack Tecnológico (Actualizado)

| Capa | Tecnología |
|---|---|
| Backend | FastAPI (Puerto 8000) - `/api/bridge` añadido. |
| Temas | CSS Variables dinámicas en document.documentElement. |
| Navegación | React Router 6 con soporte de SearchParams en Xcien2Page. |

---

## 📋 Pendientes para Claude (Próximos Pasos)

1.  **Conexión Real con Odoo**: Ya se preparó el terreno (ver `servidor_academia.py` y `tokens_service.py`). Falta mapear los IDs de técnicos de Odoo con los resultados de los exámenes Holo.
2.  **Lógica de Negocio en el Puente**: Utilizar el `/api/bridge` para que el Director General (Claude interno) pueda recibir notificaciones de cambios en el código hechos por nosotros.
3.  **Auditoría de Datos**: El usuario enfatizó verificar que "los datos que tiene odoo son correctos".

---

## 🛡️ Instrucciones para el Próximo Agente
- **NO crear dashboards duplicados**. Toda nueva funcionalidad debe ir como una sección dentro de `Xcien2Page`.
- **Respetar las variables CSS**. No uses colores hex hardcodeados; usa `var(--xcien-accent)`, etc.
- **El Hub Principal (/) es sagrado**. No lo elimines; es la puerta de entrada.

---
*Documento generado por Antigravity para asegurar la continuidad del proyecto.*
