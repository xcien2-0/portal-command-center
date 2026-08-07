import React, { useState, useMemo } from 'react';
import { ThemeConfig } from '../types';

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface Paso {
  n: number;
  texto: string;
  nota?: string;
}

interface Proceso {
  id: string;
  nombre: string;
  descripcion: string;
  rol: string[];
  pasos: Paso[];
  camposClave?: { campo: string; descripcion: string }[];
  erroresComunes?: { error: string; solucion: string }[];
  plazas?: string[];
}

interface ModuloOdoo {
  id: string;
  nombre: string;
  icono: string;
  descripcion: string;
  procesos: Proceso[];
}

// ── Contenido — Plazas ────────────────────────────────────────────────────────
const PLAZAS = [
  { id: 'piedras-negras', label: 'Piedras Negras', emoji: '🏙️' },
  { id: 'todas',          label: 'Todas las plazas', emoji: '🗺️' },
];

// ── Contenido — Directorio PDN (datos reales) ─────────────────────────────────
const EQUIPO_PDN = [
  {
    nombre: 'Francisco Alday Rodríguez',
    rol: 'Responsable de Plaza Coahuila',
    responsabilidades: ['Crear y asignar SOPs', 'Escalar equipo', 'Solicitar materiales', 'Autorizar transferencias de inventario'],
    odooFiltro: 'Creado por → Francisco Alday',
    emoji: '👔',
  },
  {
    nombre: 'Guillermo Hernandez Flores',
    rol: 'Técnico de Campo — PDN + Acuña',
    responsabilidades: ['Instalaciones y mantenimiento en campo', 'Cobertura Piedras Negras y Ciudad Acuña', 'Registro de materiales usados en tickets'],
    odooFiltro: 'Responsable → Guillermo Hernandez · User ID 467',
    emoji: '🔧',
  },
  {
    nombre: 'José Miguel Macías',
    rol: 'Supervisor y Auditor de Plaza',
    responsabilidades: ['Supervisión remota de operaciones', 'Auditoría de tickets y materiales', 'Escalamiento a dirección'],
    odooFiltro: 'Seguidor o Supervisor en tickets de Coahuila',
    emoji: '🛡️',
  },
];

// ── Contenido — Módulos y Procesos ────────────────────────────────────────────
const MODULOS: ModuloOdoo[] = [
  {
    id: 'field-service',
    nombre: 'Field Service (CAST)',
    icono: '⚙️',
    descripcion: 'Gestión de tickets de campo, asignación de técnicos y cierre de órdenes de servicio.',
    procesos: [
      {
        id: 'fs-crear-ticket',
        nombre: 'Crear ticket de campo',
        descripcion: 'Registrar una nueva orden de servicio para un técnico.',
        rol: ['NOC', 'Supervisor', 'Admin'],
        plazas: ['todas'],
        pasos: [
          { n: 1, texto: 'En Odoo, ir a Field Service → Órdenes de Trabajo.' },
          { n: 2, texto: 'Click en "Nuevo" (botón azul arriba a la izquierda).' },
          { n: 3, texto: 'Llenar el campo "Nombre" con una descripción breve del trabajo (ej: "Instalación fibra — Col. Obrera").' },
          { n: 4, texto: 'Seleccionar el "Proyecto" correspondiente: XCIEN-CAST para tickets de campo general.' },
          { n: 5, texto: 'En "Cliente", buscar y seleccionar el cliente afectado. Si no existe, crearlo antes.', nota: 'Piedras Negras: los clientes del edificio Plaza PDN ya están registrados.' },
          { n: 6, texto: 'Asignar el "Responsable" (técnico de campo).' },
          { n: 7, texto: 'Establecer la fecha límite en "Fecha Planificada".' },
          { n: 8, texto: 'Agregar descripción detallada en la pestaña "Notas".' },
          { n: 9, texto: 'Click en "Guardar" (o Ctrl+S). El ticket queda en estado Nuevo.' },
        ],
        camposClave: [
          { campo: 'Proyecto',          descripcion: 'Siempre "XCIEN-CAST" para tickets de servicio técnico' },
          { campo: 'Cliente',           descripcion: 'Debe estar registrado en Odoo antes de asignar' },
          { campo: 'Responsable',       descripcion: 'Técnico que va a ejecutar el trabajo' },
          { campo: 'Fecha Planificada', descripcion: 'Fecha máxima de resolución del ticket' },
          { campo: 'Etapa',             descripcion: 'Nuevo → En Progreso → Listo → Cerrado' },
        ],
        erroresComunes: [
          { error: 'El cliente no aparece en la búsqueda',
            solucion: 'Crear primero el cliente en Contactos → Nuevo, con nombre, RFC y correo.' },
          { error: 'No puedo asignar el técnico',
            solucion: 'El técnico debe tener un usuario Odoo activo con perfil "Field Service".' },
        ],
      },
      {
        id: 'fs-cerrar-ticket',
        nombre: 'Cerrar ticket y registrar materiales',
        descripcion: 'Mover el ticket a Cerrado y registrar los materiales consumidos.',
        rol: ['Técnico', 'Supervisor', 'Admin'],
        plazas: ['todas'],
        pasos: [
          { n: 1, texto: 'Abrir el ticket desde Field Service → Mis Tareas o buscarlo por folio.' },
          { n: 2, texto: 'Verificar que el trabajo está completo y el cliente firmó (si aplica).' },
          { n: 3, texto: 'En la pestaña "Materiales", click en "Agregar una línea".' },
          { n: 4, texto: 'Seleccionar cada producto utilizado y anotar la cantidad.' },
          { n: 5, texto: 'En la pestaña "Notas", agregar observaciones del trabajo realizado (fotos, serial de equipo instalado).' },
          { n: 6, texto: 'Cambiar la etapa a "Listo" arrastrando el ticket en el Kanban, o desde el menú de etapa.' },
          { n: 7, texto: 'El supervisor revisa y mueve a "Cerrado". El inventario se descuenta automáticamente.', nota: 'Solo supervisores y admin pueden pasar a "Cerrado".' },
        ],
        camposClave: [
          { campo: 'Pestaña Materiales', descripcion: 'Aquí se registran los equipos/materiales usados — alimenta el inventario' },
          { campo: 'Pestaña Notas',      descripcion: 'Evidencia del trabajo: descripción, fotos, seriales' },
          { campo: 'Etapa "Listo"',      descripcion: 'El técnico la marca cuando termina; el supervisor cierra' },
        ],
        erroresComunes: [
          { error: 'El producto no aparece en Materiales',
            solucion: 'Verificar que el producto esté marcado como "Puede ser usado en Field Service" en el catálogo.' },
          { error: 'El inventario no bajó después de cerrar',
            solucion: 'Revisar que el almacén del ticket coincida con la ubicación real del stock.' },
        ],
      },
      {
        id: 'fs-filtrar-tickets',
        nombre: 'Filtrar y buscar tickets',
        descripcion: 'Localizar tickets por técnico, cliente, folio o fecha.',
        rol: ['NOC', 'Supervisor', 'Admin'],
        plazas: ['todas'],
        pasos: [
          { n: 1, texto: 'Ir a Field Service → Órdenes de Trabajo.' },
          { n: 2, texto: 'Usar la barra de búsqueda superior. Puedes buscar por: folio (ej: CAST-0123), nombre del cliente, técnico asignado.' },
          { n: 3, texto: 'Para filtros avanzados: click en "Filtros" → seleccionar combinaciones (ej: "Mis Tareas" + "Esta Semana").' },
          { n: 4, texto: 'Para agrupar por técnico: "Agrupar Por" → "Responsable".' },
          { n: 5, texto: 'El portal XCIEN 2.0 también muestra tickets en la sección WFM con vista Kanban en tiempo real.' },
        ],
      },
    ],
  },
  {
    id: 'inventario',
    nombre: 'Inventario',
    icono: '📦',
    descripcion: 'Recepciones de mercancía, transferencias entre almacenes, ajustes de inventario y uso del scanner.',
    procesos: [
      {
        id: 'inv-recepcion',
        nombre: 'Recibir mercancía de proveedor',
        descripcion: 'Registrar la entrada de equipos o materiales de un proveedor.',
        rol: ['Almacén', 'Admin'],
        plazas: ['todas'],
        pasos: [
          { n: 1, texto: 'Ir a Inventario → Operaciones → Recepciones.' },
          { n: 2, texto: 'Click en "Nuevo".' },
          { n: 3, texto: 'En "Operación", verificar que sea "Recepción".' },
          { n: 4, texto: 'En "Empresa de Origen (Contacto)", seleccionar el proveedor.' },
          { n: 5, texto: 'Agregar los productos recibidos: click en "Agregar una línea", seleccionar producto, anotar cantidad.' },
          { n: 6, texto: 'Verificar la "Ubicación de Destino" — debe ser el almacén de Piedras Negras.', nota: 'Piedras Negras: ubicación = "PN/Stock".' },
          { n: 7, texto: 'Click en "Validar". Aparece un aviso si la cantidad recibida difiere de la esperada — confirmar o ajustar.' },
          { n: 8, texto: 'El stock se incrementa inmediatamente en la ubicación de destino.' },
        ],
        camposClave: [
          { campo: 'Ubicación de Destino', descripcion: 'Almacén donde entra la mercancía — debe ser PN/Stock para Piedras Negras' },
          { campo: 'Cantidad Hecha',        descripcion: 'Lo que físicamente llegó — puede diferir de la orden de compra' },
          { campo: 'Número de Serie/Lote',  descripcion: 'Obligatorio para equipos trazables (radios, switches, cámaras)' },
        ],
        erroresComunes: [
          { error: 'No aparece la recepción esperada',
            solucion: 'Verificar que el proveedor haya confirmado la orden de compra. Sin OC confirmada no se genera recepción.' },
          { error: 'El número de serie ya existe',
            solucion: 'El equipo ya está registrado. Revisar si es devolución o error de captura.' },
        ],
      },
      {
        id: 'inv-transferencia',
        nombre: 'Transferir equipos entre almacenes',
        descripcion: 'Mover stock de Piedras Negras a otro almacén o viceversa.',
        rol: ['Almacén', 'Supervisor', 'Admin'],
        plazas: ['piedras-negras'],
        pasos: [
          { n: 1, texto: 'Ir a Inventario → Operaciones → Transferencias.' },
          { n: 2, texto: 'Click en "Nuevo".' },
          { n: 3, texto: 'Tipo de operación: seleccionar "Transferencia Interna".' },
          { n: 4, texto: 'Ubicación de Origen: donde está actualmente el producto (ej: PN/Stock).' },
          { n: 5, texto: 'Ubicación de Destino: a dónde va (ej: MTY/Stock para Monterrey).', nota: 'Las transferencias entre plazas requieren aprobación del supervisor destino.' },
          { n: 6, texto: 'Agregar los productos y cantidades en las líneas de movimiento.' },
          { n: 7, texto: 'Click en "Guardar" y luego "Validar". Si hay series/lotes, asignarlos antes de validar.' },
          { n: 8, texto: 'La plaza destino verá la transferencia en su lista de recepciones pendientes.' },
        ],
      },
      {
        id: 'inv-ajuste',
        nombre: 'Ajuste de inventario (conteo físico)',
        descripcion: 'Corregir diferencias entre el stock en Odoo y el stock físico real.',
        rol: ['Almacén', 'Admin'],
        plazas: ['todas'],
        pasos: [
          { n: 1, texto: 'Ir a Inventario → Operaciones → Inventarios Físicos.' },
          { n: 2, texto: 'Click en "Nuevo Ajuste de Inventario".' },
          { n: 3, texto: 'Seleccionar la ubicación a ajustar (ej: PN/Stock).' },
          { n: 4, texto: 'Iniciar el conteo: en cada línea, ingresar la "Cantidad Contada" real.' },
          { n: 5, texto: 'Odoo muestra la diferencia entre el sistema y el conteo. Revisar discrepancias.', nota: 'Diferencias mayores a 3 unidades requieren justificación escrita en el campo "Notas".' },
          { n: 6, texto: 'Click en "Aplicar Todos". El sistema genera movimientos de ajuste automáticamente.' },
        ],
        erroresComunes: [
          { error: 'No puedo validar el ajuste',
            solucion: 'Solo usuarios con perfil "Gestor de Inventario" pueden aplicar ajustes. Solicitar al Admin.' },
        ],
      },
    ],
  },
  {
    id: 'elearning',
    nombre: 'Academia (eLearning)',
    icono: '🎓',
    descripcion: 'Inscripción a cursos, seguimiento de avance, certificaciones y creación de contenido.',
    procesos: [
      {
        id: 'el-inscribirse',
        nombre: 'Inscribirse a un curso',
        descripcion: 'Cómo un empleado se une a un curso en la Academia XCIEN.',
        rol: ['Técnico', 'Comercial', 'NOC', 'Admin', 'Todos'],
        plazas: ['todas'],
        pasos: [
          { n: 1, texto: 'Acceder a la Academia XCIEN: ir a odoo.wispi.mx → módulo eLearning, o usar el portal xcien2.0 → sección Academia.' },
          { n: 2, texto: 'Explorar el catálogo. Los cursos están organizados por área (Técnico, NOC, Comercial, RH).' },
          { n: 3, texto: 'Click en el curso deseado → botón "Iniciar" o "Inscribirme".' },
          { n: 4, texto: 'El sistema registra la inscripción automáticamente. El curso aparece en "Mis Cursos".' },
          { n: 5, texto: 'Completar las lecciones en orden. Al terminar cada lección, marcar como completada.' },
          { n: 6, texto: 'Si el curso tiene examen, aparece al final. Mínimo aprobatorio: 70%.', nota: 'Los cursos de certificación (CAST, Alturas, CAST-cert) requieren 80% mínimo.' },
          { n: 7, texto: 'Al completar el 100%, se genera automáticamente el certificado descargable en PDF.' },
        ],
      },
      {
        id: 'el-ver-avance',
        nombre: 'Ver avance de un alumno (supervisor)',
        descripcion: 'Revisar el progreso de los miembros del equipo en sus cursos.',
        rol: ['Supervisor', 'RH', 'Admin'],
        plazas: ['todas'],
        pasos: [
          { n: 1, texto: 'En el portal XCIEN 2.0 → sección Academia, buscar la vista "Equipo" o "Alumnos".' },
          { n: 2, texto: 'Alternativamente en Odoo: eLearning → Reporte → Análisis de Miembros del Canal.' },
          { n: 3, texto: 'Filtrar por "Canal" (curso) y "Empresa" para ver solo los empleados de Piedras Negras.' },
          { n: 4, texto: 'La columna "% Completado" muestra el avance de cada alumno.' },
          { n: 5, texto: 'Para ver el detalle de qué lecciones completó: click en el nombre del alumno → Cursos.' },
        ],
      },
      {
        id: 'el-crear-curso',
        nombre: 'Crear un curso nuevo',
        descripcion: 'Publicar nuevo contenido de capacitación en la Academia.',
        rol: ['Admin', 'RH'],
        plazas: ['todas'],
        pasos: [
          { n: 1, texto: 'En Odoo: eLearning → Cursos → Nuevo.' },
          { n: 2, texto: 'Llenar: Nombre del curso, Descripción, Tags (área).' },
          { n: 3, texto: 'En "Opciones": definir si es público o solo para empleados internos.' },
          { n: 4, texto: 'Agregar lecciones: click en "Ir a las Presentaciones" → Nuevo por cada lección.' },
          { n: 5, texto: 'Tipo de lección: PDF (subir archivo), Video (pegar URL YouTube), Página web (contenido inline).' },
          { n: 6, texto: 'Para publicar: en el curso, mover el switch "Publicado" a activo.', nota: 'Publicar solo cuando el contenido esté revisado y completo.' },
          { n: 7, texto: 'Informar a los alumnos por Telegram o correo para que se inscriban.' },
        ],
        erroresComunes: [
          { error: 'El video de YouTube no carga',
            solucion: 'Pegar solo el ID del video (ej: dQw4w9WgXcQ), no la URL completa.' },
          { error: 'El PDF no se muestra correctamente',
            solucion: 'Máximo 20 MB por archivo. PDFs con formularios activos pueden fallar — usar PDF plano.' },
        ],
      },
    ],
  },
  {
    id: 'ventas',
    nombre: 'Ventas y CRM',
    icono: '📈',
    descripcion: 'Cotizaciones, órdenes de venta, seguimiento de oportunidades CRM y facturación.',
    procesos: [
      {
        id: 'vta-cotizar',
        nombre: 'Crear cotización para cliente',
        descripcion: 'Generar una propuesta de servicio o venta de equipo.',
        rol: ['Comercial', 'Admin'],
        plazas: ['todas'],
        pasos: [
          { n: 1, texto: 'Ir a Ventas → Órdenes → Cotizaciones → Nuevo.' },
          { n: 2, texto: 'Seleccionar el cliente. Si es nuevo, crearlo en Contactos primero.' },
          { n: 3, texto: 'Verificar la "Lista de Precios" correcta para el tipo de cliente (Menudeo, Canal, Gobierno).' },
          { n: 4, texto: 'Agregar los productos/servicios en las líneas. Para servicio de fibra, buscar el producto "SIDF".' },
          { n: 5, texto: 'Revisar totales, impuestos y condiciones de pago.' },
          { n: 6, texto: 'Click en "Enviar por Email" para mandar la cotización al cliente, o "Imprimir" para PDF.' },
          { n: 7, texto: 'Cuando el cliente acepta, click en "Confirmar Orden" — pasa a Orden de Venta activa.' },
        ],
        camposClave: [
          { campo: 'Lista de Precios',     descripcion: 'Determina los precios aplicados — seleccionar la correcta según el tipo de cliente' },
          { campo: 'Plazo de Pago',        descripcion: 'Inmediato, 15 días, 30 días — según el acuerdo comercial' },
          { campo: 'Política de Factura',  descripcion: '"A la orden" = factura al confirmar; "Según entrega" = al completar' },
        ],
      },
      {
        id: 'vta-seguimiento',
        nombre: 'Seguimiento de oportunidad CRM',
        descripcion: 'Registrar y seguir prospectos hasta convertirlos en clientes.',
        rol: ['Comercial', 'Admin'],
        plazas: ['todas'],
        pasos: [
          { n: 1, texto: 'Ir a CRM → Vista Kanban (Pipeline).' },
          { n: 2, texto: 'Click en "+ Agregar" en la columna de la etapa correcta (ej: Prospecto, Calificado, Propuesta).' },
          { n: 3, texto: 'Llenar: Nombre de la oportunidad, Cliente/Contacto, Ingreso esperado, Fecha de cierre probable.' },
          { n: 4, texto: 'Registrar cada interacción en el Chatter (parte inferior) — llamadas, reuniones, correos.' },
          { n: 5, texto: 'Mover la tarjeta entre etapas conforme avanza el proceso.' },
          { n: 6, texto: 'Al ganar: click en "Ganado". Al perder: click en "Perdido" e indicar la razón.', nota: 'Las razones de pérdida ayudan a mejorar el proceso comercial — llenarlas siempre.' },
        ],
      },
    ],
  },
  {
    id: 'empleados',
    nombre: 'Empleados y RRHH',
    icono: '👤',
    descripcion: 'Directorio de empleados, estructura organizacional, gestión de permisos y asistencias.',
    procesos: [
      {
        id: 'rrhh-consultar',
        nombre: 'Consultar directorio de empleados',
        descripcion: 'Encontrar información de contacto y datos de un empleado.',
        rol: ['Todos'],
        plazas: ['todas'],
        pasos: [
          { n: 1, texto: 'Ir a Empleados → Empleados.' },
          { n: 2, texto: 'Buscar por nombre en la barra de búsqueda.' },
          { n: 3, texto: 'El portal XCIEN 2.0 → sección RRHH muestra el directorio completo con foto, cargo y correo.' },
          { n: 4, texto: 'Para ver el organigrama: Empleados → vista de "Organigrama" (icono de árbol arriba a la derecha).' },
        ],
      },
      {
        id: 'rrhh-permiso',
        nombre: 'Solicitar permiso o ausencia',
        descripcion: 'Registrar vacaciones, permiso médico u otra ausencia.',
        rol: ['Técnico', 'Comercial', 'NOC', 'Todos'],
        plazas: ['todas'],
        pasos: [
          { n: 1, texto: 'Ir a Tiempo Personal → Mis Ausencias → Nuevo.' },
          { n: 2, texto: 'Seleccionar el tipo de ausencia: Vacaciones, Permiso Médico, Personal, etc.' },
          { n: 3, texto: 'Ingresar las fechas de inicio y fin.' },
          { n: 4, texto: 'Agregar descripción en el campo "Motivo".' },
          { n: 5, texto: 'Click en "Guardar" → "Solicitar Aprobación". Tu supervisor recibe una notificación.' },
          { n: 6, texto: 'Recibirás confirmación por correo cuando sea aprobada o rechazada.', nota: 'Solicitar con mínimo 3 días hábiles de anticipación para vacaciones.' },
        ],
      },
    ],
  },

  // ── MÓDULO EXCLUSIVO PIEDRAS NEGRAS ───────────────────────────────────────
  {
    id: 'pdn',
    nombre: 'Plaza Piedras Negras',
    icono: '🏙️',
    descripcion: 'Guías, contactos y procedimientos específicos de la plaza Piedras Negras y Ciudad Acuña.',
    procesos: [
      {
        id: 'pdn-equipo',
        nombre: 'Quién hace qué en la plaza',
        descripcion: 'Roles y responsabilidades del equipo de Piedras Negras.',
        rol: ['Todos'],
        plazas: ['piedras-negras'],
        pasos: [
          { n: 1, texto: 'Francisco Alday Rodríguez — Responsable de Plaza Coahuila. Él crea los SOPs, escala el equipo y solicita materiales. Es el primer punto de contacto para problemas operativos.' },
          { n: 2, texto: 'Guillermo Hernandez Flores — Técnico de campo asignado a PDN y Ciudad Acuña. Ejecuta instalaciones, mantenimientos y registra materiales en Odoo. En Odoo: User ID 467.' },
          { n: 3, texto: 'José Miguel Macías — Supervisor y auditor de la plaza. Supervisa remotamente, audita tickets y escala a dirección cuando es necesario. No está en campo.' },
          { n: 4, texto: 'Para escalar una falla urgente: contactar primero a Guillermo → si no responde, escalar a Francisco Alday → si no responde, José Miguel.' },
        ],
      },
      {
        id: 'pdn-filtrar-tickets',
        nombre: 'Ver tickets de PDN en Odoo',
        descripcion: 'Cómo filtrar en Field Service solo los tickets de Piedras Negras y Ciudad Acuña.',
        rol: ['Supervisor', 'NOC', 'Admin'],
        plazas: ['piedras-negras'],
        pasos: [
          { n: 1, texto: 'Ir a Field Service → Órdenes de Trabajo.' },
          { n: 2, texto: 'En la barra de búsqueda, click en "Filtros" → "Buscar por Responsable".' },
          { n: 3, texto: 'Escribir "Guillermo" y seleccionar "Guillermo Hernandez Flores" (User ID 467). Esto muestra TODOS los tickets asignados al técnico de PDN y Acuña.', nota: 'Guillermo cubre tanto Piedras Negras como Ciudad Acuña — ambas zonas aparecen en este filtro.' },
          { n: 4, texto: 'Para ver solo tickets creados por Francisco Alday: en la barra de búsqueda → "Buscar por" → "Creado por" → seleccionar Francisco Alday.' },
          { n: 5, texto: 'Combinar filtros: Responsable = Guillermo + Esta Semana → tickets activos de la plaza en la semana.' },
          { n: 6, texto: 'Alternativamente: en el portal XCIEN 2.0 → sección WFM → filtrar por "Coahuila" en el selector de plaza.' },
        ],
        camposClave: [
          { campo: 'Responsable',   descripcion: 'Guillermo Hernandez Flores (User ID 467) — técnico de campo PDN + Acuña' },
          { campo: 'Creado por',    descripcion: 'Francisco Alday Rodríguez — responsable de plaza que abre los tickets' },
          { campo: 'Proyecto',      descripcion: 'XCIEN-CAST para tickets de campo; buscar también "Coahuila" si existe proyecto específico' },
        ],
      },
      {
        id: 'pdn-impresora',
        nombre: 'Impresora de oficina (HP M28w)',
        descripcion: 'Cómo imprimir desde cualquier equipo en la red de la oficina Piedras Negras.',
        rol: ['Todos'],
        plazas: ['piedras-negras'],
        pasos: [
          { n: 1, texto: 'La impresora HP LaserJet MFP M28w está conectada a la red OF.PIEDRAS_NEGRAS_LUMINET.' },
          { n: 2, texto: 'Dirección IP fija: 192.168.88.248. Solo funciona desde dentro de la red de oficina (o VPN).', nota: 'La impresora no tiene Ethernet — usa exclusivamente WiFi.' },
          { n: 3, texto: 'Para agregar la impresora en macOS: Preferencias del Sistema → Impresoras y Escáneres → "+" → buscar HP LaserJet MFP M28w o agregar por IP 192.168.88.248.' },
          { n: 4, texto: 'Para imprimir PDFs de Odoo: en cualquier factura o reporte → botón "Imprimir" → seleccionar HP M28w → Imprimir.' },
          { n: 5, texto: 'Si la impresora no aparece o no responde: verificar que el equipo esté en la misma red (OF.PIEDRAS_NEGRAS_LUMINET). Reiniciar la impresora si no responde en 2 minutos.' },
        ],
        camposClave: [
          { campo: 'IP',     descripcion: '192.168.88.248 (asignación DHCP fija por MAC)' },
          { campo: 'Red',    descripcion: 'OF.PIEDRAS_NEGRAS_LUMINET — solo visible dentro de la oficina' },
          { campo: 'Modelo', descripcion: 'HP LaserJet MFP M28w — impresión + escaneo, solo B/N' },
        ],
        erroresComunes: [
          { error: 'La impresora no aparece en la red',
            solucion: 'Verificar que el equipo esté conectado a OF.PIEDRAS_NEGRAS_LUMINET, no a otra red. La impresora solo responde dentro de esa VLAN.' },
          { error: 'El trabajo de impresión se queda "en espera"',
            solucion: 'Abrir Preferencias → Impresoras, seleccionar la HP M28w y reanudar la cola. Si persiste, eliminar el trabajo y volver a imprimir.' },
        ],
      },
      {
        id: 'pdn-zonas',
        nombre: 'Zonas de cobertura — PDN y Acuña',
        descripcion: 'Referencia de la infraestructura de campo y zonas que cubre la plaza.',
        rol: ['NOC', 'Supervisor', 'Técnico'],
        plazas: ['piedras-negras'],
        pasos: [
          { n: 1, texto: 'La plaza Coahuila cubre dos ciudades: Piedras Negras (sede) y Ciudad Acuña (~120 km al oeste).' },
          { n: 2, texto: 'Técnico responsable de ambas zonas: Guillermo Hernandez Flores. Los tickets de Acuña y PDN se filtran por el mismo técnico en Odoo.' },
          { n: 3, texto: 'Radio base de referencia en Acuña: RB Acuña Steren. Sector Sur_Oeste activo. La migración PTMP→PTP fue gestionada via SOP-16479.' },
          { n: 4, texto: 'Para ver el estado de radiobases de la plaza en tiempo real: portal XCIEN 2.0 → sección NOC → filtrar ciudad "Piedras Negras" y "Acuña".' },
          { n: 5, texto: 'Para ver los equipos en mapa: sección Red → las radiobases de Coahuila aparecen agrupadas en la región noreste del mapa.', nota: 'El CCR de Acuña tiene pendiente habilitar el puerto 8728 (Guillermo debe hacerlo presencialmente).' },
        ],
        camposClave: [
          { campo: 'RB Acuña Steren',  descripcion: 'Radiobase principal CD Acuña — sector Sur_Oeste, migrado a PTP' },
          { campo: 'CCR Acuña',        descripcion: 'Router core Ciudad Acuña — puerto 8728 pendiente activar' },
          { campo: 'SOP-16479',        descripcion: 'Referencia del ticket de migración PTMP→PTP en Acuña Steren' },
        ],
      },
      {
        id: 'pdn-materiales',
        nombre: 'Solicitar materiales para la plaza',
        descripcion: 'Cómo gestionar solicitudes de equipos e insumos para PDN y Acuña.',
        rol: ['Francisco Alday', 'Técnico', 'Supervisor'],
        plazas: ['piedras-negras'],
        pasos: [
          { n: 1, texto: 'Las solicitudes de materiales pasan por Francisco Alday — él es quien autoriza y gestiona las transferencias de inventario hacia la plaza.' },
          { n: 2, texto: 'Guillermo identifica el material necesario en campo y lo comunica a Francisco (WhatsApp / chatter del ticket en Odoo).' },
          { n: 3, texto: 'Francisco abre una transferencia en Odoo: Inventario → Operaciones → Transferencias → Nuevo, origen = almacén central, destino = PDN/Stock.' },
          { n: 4, texto: 'José Miguel puede auditar las transferencias pendientes en el portal XCIEN 2.0 → sección Inventario → Transferencias → filtrar plaza Coahuila.' },
          { n: 5, texto: 'Una vez validada la transferencia, Guillermo recibe los materiales y confirma en Odoo la recepción desde la app móvil o web.', nota: 'Si el material es urgente y la transferencia demora, escalar directamente a José Miguel para autorizar un movimiento express.' },
        ],
      },
    ],
  },
];

// ── Colores por plaza ─────────────────────────────────────────────────────────
const PLAZA_COLOR: Record<string, string> = {
  'piedras-negras': '#1D4ED8',
  'todas': '#6B7280',
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function OdooDocsSection({ theme }: { theme: ThemeConfig }) {
  const [moduloActivo, setModuloActivo] = useState<string>(MODULOS[0].id);
  const [procesoActivo, setProcesoActivo] = useState<string>(MODULOS[0].procesos[0].id);
  const [busqueda, setBusqueda] = useState('');
  const [plazaFiltro, setPlazaFiltro] = useState('piedras-negras');

  const isDark = theme.mode === 'dark';

  const c = {
    bg:       isDark ? '#0D1117' : '#F8FAFC',
    surface:  isDark ? '#161B22' : '#FFFFFF',
    border:   isDark ? '#30363D' : '#E2E8F0',
    text:     isDark ? '#E6EDF3' : '#1A202C',
    muted:    isDark ? '#8B949E' : '#718096',
    accent:   '#009A5A',
    step:     isDark ? '#0D2818' : '#F0FDF4',
    stepBdr:  isDark ? '#166534' : '#BBF7D0',
    warn:     isDark ? '#1E1207' : '#FFFBEB',
    warnBdr:  isDark ? '#92400E' : '#FCD34D',
    err:      isDark ? '#1E0707' : '#FFF5F5',
    errBdr:   isDark ? '#991B1B' : '#FCA5A5',
    navBg:    isDark ? '#0D1117' : '#F1F5F9',
    navHover: isDark ? '#1F2937' : '#E2E8F0',
    navAct:   isDark ? '#0D2818' : '#DCFCE7',
    navActTxt: '#009A5A',
    tag:      isDark ? '#1F2937' : '#F1F5F9',
    tagTxt:   isDark ? '#9CA3AF' : '#64748B',
  };

  // ── Búsqueda global ──────────────────────────────────────────────────────────
  const resultadosBusqueda = useMemo(() => {
    if (busqueda.trim().length < 2) return [];
    const q = busqueda.toLowerCase();
    const hits: { modulo: ModuloOdoo; proceso: Proceso }[] = [];
    for (const mod of MODULOS) {
      for (const proc of mod.procesos) {
        if (
          proc.nombre.toLowerCase().includes(q) ||
          proc.descripcion.toLowerCase().includes(q) ||
          proc.pasos.some(p => p.texto.toLowerCase().includes(q))
        ) {
          hits.push({ modulo: mod, proceso: proc });
        }
      }
    }
    return hits;
  }, [busqueda]);

  const moduloActual = MODULOS.find(m => m.id === moduloActivo) ?? MODULOS[0];

  const procesosFiltrados = moduloActual.procesos.filter(p =>
    !p.plazas || p.plazas.includes('todas') || p.plazas.includes(plazaFiltro)
  );

  const procesoActual = procesosFiltrados.find(p => p.id === procesoActivo)
    ?? procesosFiltrados[0];

  const handleSelectProceso = (modId: string, procId: string) => {
    setModuloActivo(modId);
    setProcesoActivo(procId);
    setBusqueda('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: c.surface, borderBottom: `1px solid ${c.border}`,
        padding: '16px 20px', display: 'flex', alignItems: 'center',
        gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>📖</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: c.text }}>
                Documentación Odoo
              </div>
              <div style={{ fontSize: 12, color: c.muted }}>
                Guías de proceso por módulo
              </div>
            </div>
          </div>
        </div>

        {/* Filtro plaza */}
        <div style={{ display: 'flex', gap: 6 }}>
          {PLAZAS.map(p => (
            <button
              key={p.id}
              onClick={() => setPlazaFiltro(p.id)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                border: `1px solid ${plazaFiltro === p.id ? PLAZA_COLOR[p.id] : c.border}`,
                background: plazaFiltro === p.id ? PLAZA_COLOR[p.id] + '22' : 'transparent',
                color: plazaFiltro === p.id ? PLAZA_COLOR[p.id] : c.muted,
                fontWeight: plazaFiltro === p.id ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {p.emoji} {p.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div style={{ position: 'relative', minWidth: 220 }}>
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: c.muted, fontSize: 14,
          }}>🔍</span>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar proceso..."
            style={{
              width: '100%', padding: '7px 12px 7px 32px', borderRadius: 8,
              border: `1px solid ${c.border}`, background: c.bg,
              color: c.text, fontSize: 13, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: c.muted, fontSize: 16, lineHeight: 1,
            }}>×</button>
          )}
        </div>
      </div>

      {/* ── Resultados de búsqueda ──────────────────────────────────────────── */}
      {busqueda.trim().length >= 2 && (
        <div style={{
          background: c.surface, borderBottom: `1px solid ${c.border}`,
          padding: '12px 20px',
        }}>
          {resultadosBusqueda.length === 0 ? (
            <div style={{ color: c.muted, fontSize: 13 }}>
              Sin resultados para "{busqueda}"
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, color: c.muted, textTransform: 'uppercase',
                letterSpacing: 1, marginBottom: 4 }}>
                {resultadosBusqueda.length} resultado{resultadosBusqueda.length !== 1 ? 's' : ''}
              </div>
              {resultadosBusqueda.map(({ modulo, proceso }) => (
                <button
                  key={proceso.id}
                  onClick={() => handleSelectProceso(modulo.id, proceso.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                    border: `1px solid ${c.border}`, background: c.navHover,
                    textAlign: 'left', width: '100%',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{modulo.icono}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: c.text }}>
                      {proceso.nombre}
                    </div>
                    <div style={{ fontSize: 11, color: c.muted }}>
                      {modulo.nombre} — {proceso.descripcion}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Cuerpo: nav + contenido ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 400 }}>

        {/* Nav izquierdo — módulos */}
        <div style={{
          width: 220, flexShrink: 0, background: c.navBg,
          borderRight: `1px solid ${c.border}`, overflowY: 'auto',
          padding: '12px 8px',
        }}>
          {MODULOS.map(mod => {
            const modProcs = mod.procesos.filter(p =>
              !p.plazas || p.plazas.includes('todas') || p.plazas.includes(plazaFiltro)
            );
            if (modProcs.length === 0) return null;
            const isModActivo = mod.id === moduloActivo;

            return (
              <div key={mod.id} style={{ marginBottom: 4 }}>
                {/* Módulo header */}
                <button
                  onClick={() => {
                    setModuloActivo(mod.id);
                    setProcesoActivo(modProcs[0].id);
                  }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                    border: 'none', textAlign: 'left',
                    background: isModActivo ? c.navAct : 'transparent',
                    color: isModActivo ? c.navActTxt : c.text,
                    fontWeight: isModActivo ? 700 : 500,
                    fontSize: 13,
                    transition: 'background 0.15s',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{mod.icono}</span>
                  <span style={{ flex: 1 }}>{mod.nombre}</span>
                  <span style={{
                    fontSize: 10, background: c.tag, color: c.tagTxt,
                    borderRadius: 10, padding: '1px 6px',
                  }}>{modProcs.length}</span>
                </button>

                {/* Procesos del módulo activo */}
                {isModActivo && (
                  <div style={{ paddingLeft: 12, marginTop: 2 }}>
                    {modProcs.map(proc => {
                      const isAct = proc.id === procesoActivo;
                      return (
                        <button
                          key={proc.id}
                          onClick={() => setProcesoActivo(proc.id)}
                          style={{
                            width: '100%', padding: '6px 8px', borderRadius: 6,
                            cursor: 'pointer', border: 'none', textAlign: 'left',
                            fontSize: 12,
                            background: isAct ? c.navAct : 'transparent',
                            color: isAct ? c.navActTxt : c.muted,
                            fontWeight: isAct ? 600 : 400,
                            borderLeft: isAct ? `2px solid ${c.accent}` : '2px solid transparent',
                            transition: 'all 0.15s',
                          }}
                        >
                          {proc.nombre}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Panel de contenido */}
        {procesoActual ? (
          <div style={{
            flex: 1, overflowY: 'auto', padding: '24px 28px',
            background: c.bg,
          }}>
            {/* Breadcrumb */}
            <div style={{ fontSize: 11, color: c.muted, marginBottom: 16 }}>
              {moduloActual.icono} {moduloActual.nombre} → {procesoActual.nombre}
            </div>

            {/* Título del proceso */}
            <h2 style={{
              fontSize: 22, fontWeight: 700, color: c.text, margin: '0 0 6px',
            }}>
              {procesoActual.nombre}
            </h2>
            <p style={{ color: c.muted, fontSize: 14, margin: '0 0 20px' }}>
              {procesoActual.descripcion}
            </p>

            {/* Tags de rol y plaza */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
              <span style={{ fontSize: 10, color: c.muted, alignSelf: 'center' }}>
                Roles:
              </span>
              {procesoActual.rol.map(r => (
                <span key={r} style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 10,
                  background: c.tag, color: c.tagTxt, fontWeight: 500,
                }}>
                  {r}
                </span>
              ))}
              {procesoActual.plazas && procesoActual.plazas[0] !== 'todas' && (
                <>
                  <span style={{ fontSize: 10, color: c.muted, alignSelf: 'center', marginLeft: 4 }}>
                    Plaza:
                  </span>
                  {procesoActual.plazas.map(pl => (
                    <span key={pl} style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 10,
                      background: PLAZA_COLOR[pl] + '22',
                      color: PLAZA_COLOR[pl], fontWeight: 600,
                    }}>
                      {PLAZAS.find(p => p.id === pl)?.emoji} {PLAZAS.find(p => p.id === pl)?.label}
                    </span>
                  ))}
                </>
              )}
            </div>

            {/* Directorio PDN — tarjetas visuales para el proceso pdn-equipo */}
            {procesoActual.id === 'pdn-equipo' && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
                {EQUIPO_PDN.map(persona => (
                  <div key={persona.nombre} style={{
                    flex: '1 1 200px', padding: 16, borderRadius: 12,
                    background: c.surface, border: `1px solid ${c.border}`,
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{persona.emoji}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{persona.nombre}</div>
                    <div style={{
                      fontSize: 11, color: '#1D4ED8', fontWeight: 600,
                      marginBottom: 10, marginTop: 2,
                    }}>
                      {persona.rol}
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {persona.responsabilidades.map(r => (
                        <li key={r} style={{ fontSize: 12, color: c.muted, marginBottom: 3 }}>{r}</li>
                      ))}
                    </ul>
                    <div style={{
                      marginTop: 10, padding: '5px 8px', borderRadius: 6,
                      background: c.step, border: `1px solid ${c.stepBdr}`,
                      fontSize: 11, color: c.accent, fontFamily: 'monospace',
                    }}>
                      🔎 Odoo: {persona.odooFiltro}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pasos */}
            <div style={{ marginBottom: 28 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: c.muted,
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
              }}>
                Pasos
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {procesoActual.pasos.map(paso => (
                  <div key={paso.n} style={{
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    padding: 14, borderRadius: 10,
                    background: c.step, border: `1px solid ${c.stepBdr}`,
                  }}>
                    <div style={{
                      minWidth: 26, height: 26, borderRadius: '50%',
                      background: c.accent, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                    }}>
                      {paso.n}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: c.text, lineHeight: 1.5 }}>
                        {paso.texto}
                      </div>
                      {paso.nota && (
                        <div style={{
                          marginTop: 6, padding: '6px 10px', borderRadius: 6,
                          background: c.warn, border: `1px solid ${c.warnBdr}`,
                          fontSize: 12, color: isDark ? '#FCD34D' : '#92400E',
                        }}>
                          💡 {paso.nota}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Campos clave */}
            {procesoActual.camposClave && procesoActual.camposClave.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: c.muted,
                  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
                }}>
                  Campos clave
                </div>
                <div style={{
                  background: c.surface, border: `1px solid ${c.border}`,
                  borderRadius: 10, overflow: 'hidden',
                }}>
                  {procesoActual.camposClave.map((cf, i) => (
                    <div key={cf.campo} style={{
                      display: 'flex', gap: 16, padding: '10px 16px',
                      borderBottom: i < procesoActual.camposClave!.length - 1
                        ? `1px solid ${c.border}` : 'none',
                    }}>
                      <div style={{
                        minWidth: 160, fontSize: 13, fontWeight: 600,
                        color: c.accent, fontFamily: 'monospace',
                      }}>
                        {cf.campo}
                      </div>
                      <div style={{ fontSize: 13, color: c.muted }}>
                        {cf.descripcion}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Errores comunes */}
            {procesoActual.erroresComunes && procesoActual.erroresComunes.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: c.muted,
                  textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
                }}>
                  Errores frecuentes
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {procesoActual.erroresComunes.map((e, i) => (
                    <div key={i} style={{
                      padding: 14, borderRadius: 10,
                      background: c.err, border: `1px solid ${c.errBdr}`,
                    }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600,
                        color: isDark ? '#FCA5A5' : '#991B1B', marginBottom: 4,
                      }}>
                        ❌ {e.error}
                      </div>
                      <div style={{ fontSize: 13, color: c.text }}>
                        ✅ {e.solucion}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Enlace a Odoo */}
            <div style={{
              marginTop: 8, padding: 14, borderRadius: 10,
              background: c.surface, border: `1px solid ${c.border}`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 18 }}>🔗</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: c.muted }}>Acceso directo</div>
                <div style={{ fontSize: 13, color: c.text }}>
                  Ir a Odoo XCIEN:&nbsp;
                  <a
                    href="https://odoo.wispi.mx"
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: c.accent, textDecoration: 'none', fontWeight: 600 }}
                  >
                    odoo.wispi.mx
                  </a>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: c.muted, fontSize: 14,
          }}>
            Selecciona un proceso del menú lateral
          </div>
        )}
      </div>
    </div>
  );
}
