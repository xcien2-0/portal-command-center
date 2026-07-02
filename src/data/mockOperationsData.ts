// Mock data centralizado — reemplaza Supabase mientras se conecta Odoo

export const MOCK_TECHNICIANS = [
  { id: 'tech-1', name: 'Carlos Mendoza', plaza: 'CDMX', nivel: 3, xp_total: 4200, xp_mes_actual: 380, racha_meses_limpios: 4, phone: '5512345678', is_active: true },
  { id: 'tech-2', name: 'Juan López',     plaza: 'GDL',  nivel: 4, xp_total: 6800, xp_mes_actual: 520, racha_meses_limpios: 7, phone: '3312345678', is_active: true },
  { id: 'tech-3', name: 'Ana Torres',     plaza: 'MTY',  nivel: 2, xp_total: 1900, xp_mes_actual: 210, racha_meses_limpios: 2, phone: '8112345678', is_active: true },
  { id: 'tech-4', name: 'Pedro Ramírez',  plaza: 'CDMX', nivel: 5, xp_total: 9100, xp_mes_actual: 640, racha_meses_limpios: 11, phone: '5587654321', is_active: true },
  { id: 'tech-5', name: 'Laura Vega',     plaza: 'PUE',  nivel: 1, xp_total: 450,  xp_mes_actual: 90,  racha_meses_limpios: 1, phone: '2212345678', is_active: true },
];

export const MOCK_DISPATCH_JOBS = [
  {
    id: 'job-1', job_number: 'DSP-2026-001', project_id: 'WO-8821',
    customer_name: 'Ferretería Hernández', site_address: 'Av. Insurgentes 450, Col. Roma, CDMX',
    service_type: 'instalacion_residencial', visit_type: 'primera_visita',
    priority: 'alta', status: 'pending_dispatch', customer_status: 'confirmed',
    scheduled_date: '2026-05-05', scheduled_time: '10:00', estimated_duration_minutes: 90,
    contact_person: 'Sr. Hernández', contact_phone: '5543218765',
    zone: 'Roma-Condesa', territory: 'CDMX Norte', crew_id: null,
    work_order_id: 'WO-8821', odoo_order_id: 'S00221', notes: 'Acceso por puerta lateral',
    created_at: '2026-05-05T08:00:00Z', updated_at: '2026-05-05T08:00:00Z',
  },
  {
    id: 'job-2', job_number: 'DSP-2026-002', project_id: 'WO-8822',
    customer_name: 'Papelería El Sol', site_address: 'Calle Morelos 120, Tlalnepantla, EDOMEX',
    service_type: 'mantenimiento', visit_type: 'seguimiento',
    priority: 'media', status: 'scheduled', customer_status: 'confirmed',
    scheduled_date: '2026-05-05', scheduled_time: '11:30', estimated_duration_minutes: 60,
    contact_person: 'Dra. Martínez', contact_phone: '5598765432',
    zone: 'Tlalnepantla', territory: 'EDOMEX', crew_id: 'tech-1',
    work_order_id: 'WO-8822', odoo_order_id: 'S00222', notes: null,
    created_at: '2026-05-05T08:30:00Z', updated_at: '2026-05-05T09:00:00Z',
  },
  {
    id: 'job-3', job_number: 'DSP-2026-003', project_id: null,
    customer_name: 'Clínica San José', site_address: 'Blvd. Adolfo López Mateos 870, GDL',
    service_type: 'reparacion', visit_type: 'emergencia',
    priority: 'alta', status: 'in_route', customer_status: 'confirmed',
    scheduled_date: '2026-05-05', scheduled_time: '09:00', estimated_duration_minutes: 120,
    contact_person: 'Ing. Sánchez', contact_phone: '3365432187',
    zone: 'Zona Centro GDL', territory: 'GDL', crew_id: 'tech-2',
    work_order_id: 'WO-8823', odoo_order_id: 'S00223', notes: 'Sin señal desde ayer 18:00',
    created_at: '2026-05-05T07:00:00Z', updated_at: '2026-05-05T09:15:00Z',
  },
  {
    id: 'job-4', job_number: 'DSP-2026-004', project_id: 'WO-8824',
    customer_name: 'Taller Mecánico García', site_address: 'Av. Churubusco 320, Col. General Anaya, CDMX',
    service_type: 'instalacion_empresarial', visit_type: 'primera_visita',
    priority: 'baja', status: 'on_site', customer_status: 'confirmed',
    scheduled_date: '2026-05-05', scheduled_time: '08:00', estimated_duration_minutes: 180,
    contact_person: 'C. García', contact_phone: '5576543210',
    zone: 'Del Valle', territory: 'CDMX Sur', crew_id: 'tech-4',
    work_order_id: 'WO-8824', odoo_order_id: 'S00224', notes: 'Requiere mástil telescópico 6m',
    created_at: '2026-05-04T18:00:00Z', updated_at: '2026-05-05T08:05:00Z',
  },
  {
    id: 'job-5', job_number: 'DSP-2026-005', project_id: 'WO-8825',
    customer_name: 'Casa Habitación — Familia Torres', site_address: 'Calle Cedros 45, Fraccionamiento Pinos, MTY',
    service_type: 'instalacion_residencial', visit_type: 'primera_visita',
    priority: 'media', status: 'completed', customer_status: 'confirmed',
    scheduled_date: '2026-05-05', scheduled_time: '07:30', estimated_duration_minutes: 60,
    contact_person: 'Sra. Torres', contact_phone: '8187654321',
    zone: 'San Nicolás', territory: 'MTY', crew_id: 'tech-3',
    work_order_id: 'WO-8825', odoo_order_id: 'S00225', notes: 'RF final: -38 dBi ✅',
    created_at: '2026-05-04T22:00:00Z', updated_at: '2026-05-05T09:45:00Z',
  },
  {
    id: 'job-6', job_number: 'DSP-2026-006', project_id: null,
    customer_name: 'Restaurante El Fogón', site_address: 'Av. Juárez 88, Centro Histórico, PUE',
    service_type: 'reparacion', visit_type: 'revisita',
    priority: 'alta', status: 'blocked', customer_status: 'access_denied',
    scheduled_date: '2026-05-05', scheduled_time: '10:00', estimated_duration_minutes: 90,
    contact_person: 'Sr. Vázquez', contact_phone: '2221234567',
    zone: 'Centro PUE', territory: 'PUE', crew_id: 'tech-5',
    work_order_id: 'WO-8826', odoo_order_id: 'S00226', notes: 'Propietario no abrió — reagendar',
    created_at: '2026-05-05T06:00:00Z', updated_at: '2026-05-05T10:15:00Z',
  },
];

export const MOCK_CONVERSATIONS = [
  {
    id: 'conv-1', company_id: 'comp-1', contact_id: 'cont-1',
    channel: 'whatsapp' as const, status: 'bot_active' as const,
    assigned_agent_id: null, subject: 'No tengo internet desde esta mañana',
    created_at: '2026-05-05T09:00:00Z', updated_at: '2026-05-05T09:35:00Z',
    contacts: { id: 'cont-1', name: 'Roberto Pérez', phone: '5512345678', email: null, odoo_client_id: 'C-4421', company_id: 'comp-1' },
    companies: { id: 'comp-1', name: 'ISP Principal', color: '#1D9E75' },
    agents: null,
  },
  {
    id: 'conv-2', company_id: 'comp-2', contact_id: 'cont-2',
    channel: 'ticket' as const, status: 'escalated' as const,
    assigned_agent_id: 'agent-1', subject: 'Velocidad muy baja — pago al corriente',
    created_at: '2026-05-05T08:00:00Z', updated_at: '2026-05-05T09:20:00Z',
    contacts: { id: 'cont-2', name: 'María González', phone: '3398765432', email: 'mgonzalez@empresa.com', odoo_client_id: 'C-3312', company_id: 'comp-2' },
    companies: { id: 'comp-2', name: 'ISP Principal', color: '#2563eb' },
    agents: { id: 'agent-1', name: 'Agente NOC', is_online: true },
  },
  {
    id: 'conv-3', company_id: 'comp-1', contact_id: 'cont-3',
    channel: 'call' as const, status: 'in_progress' as const,
    assigned_agent_id: 'agent-1', subject: 'Solicitud de cambio de plan',
    created_at: '2026-05-05T07:30:00Z', updated_at: '2026-05-05T08:50:00Z',
    contacts: { id: 'cont-3', name: 'Luis Hernández', phone: '8112345678', email: null, odoo_client_id: 'C-5587', company_id: 'comp-1' },
    companies: { id: 'comp-1', name: 'ISP Principal', color: '#1D9E75' },
    agents: { id: 'agent-1', name: 'Agente NOC', is_online: true },
  },
  {
    id: 'conv-4', company_id: 'comp-3', contact_id: 'cont-4',
    channel: 'whatsapp' as const, status: 'resolved' as const,
    assigned_agent_id: 'agent-1', subject: 'Instalación completada — confirmación',
    created_at: '2026-05-05T06:00:00Z', updated_at: '2026-05-05T08:00:00Z',
    contacts: { id: 'cont-4', name: 'Ana Martínez', phone: '2221234567', email: null, odoo_client_id: 'C-7712', company_id: 'comp-3' },
    companies: { id: 'comp-3', name: 'ISP 2', color: '#9333ea' },
    agents: { id: 'agent-1', name: 'Agente NOC', is_online: true },
  },
];

export const MOCK_MESSAGES: Record<string, Array<{ id: string; conversation_id: string; sender_type: 'bot' | 'client' | 'agent'; sender_name: string; content: string; created_at: string }>> = {
  'conv-1': [
    { id: 'm1', conversation_id: 'conv-1', sender_type: 'client', sender_name: 'Roberto Pérez', content: 'Hola, no tengo internet desde esta mañana', created_at: '2026-05-05T09:00:00Z' },
    { id: 'm2', conversation_id: 'conv-1', sender_type: 'bot', sender_name: 'Bot Soporte', content: '¡Hola Roberto! Entiendo que tienes problemas con tu conexión. Voy a verificar el estado de tu servicio. Un momento por favor.', created_at: '2026-05-05T09:00:30Z' },
    { id: 'm3', conversation_id: 'conv-1', sender_type: 'bot', sender_name: 'Bot Soporte', content: 'Detecté una alerta en tu nodo. El equipo técnico ya fue notificado. El tiempo estimado de resolución es 2 horas. ¿Necesitas algo más?', created_at: '2026-05-05T09:01:00Z' },
  ],
  'conv-2': [
    { id: 'm4', conversation_id: 'conv-2', sender_type: 'client', sender_name: 'María González', content: 'Llevo 3 días con velocidad muy baja. Tengo contratados 100Mbps y me da 5Mbps', created_at: '2026-05-05T08:00:00Z' },
    { id: 'm5', conversation_id: 'conv-2', sender_type: 'agent', sender_name: 'Agente NOC', content: 'Hola María, voy a revisar tu caso. Tu número de cliente es C-3312, ¿correcto?', created_at: '2026-05-05T08:05:00Z' },
    { id: 'm6', conversation_id: 'conv-2', sender_type: 'client', sender_name: 'María González', content: 'Sí, es correcto. Soy cliente desde hace 2 años y siempre he pagado a tiempo.', created_at: '2026-05-05T08:06:00Z' },
    { id: 'm7', conversation_id: 'conv-2', sender_type: 'agent', sender_name: 'Agente NOC', content: 'Confirmo María. Estoy viendo interferencia en el nodo de tu zona. Voy a escalar con el equipo de campo para una revisita mañana. ¿Te funciona antes de las 12?', created_at: '2026-05-05T08:10:00Z' },
  ],
};

export const MOCK_ACADEMY_MODULES = [
  { id: 'mod-1', titulo: 'Seguridad en Alturas NOM-009', nivel_requerido: 1, orden: 1, duracion_min: 45, xp_recompensa: 150, descripcion: 'Fundamentos de trabajo en altura, uso correcto de arnés y EPP.', activo: true },
  { id: 'mod-2', titulo: 'Tipos de Mástil y Anclaje', nivel_requerido: 1, orden: 2, duracion_min: 60, xp_recompensa: 200, descripcion: 'Empotrado, tensado y telescópico. Normas de instalación.', activo: true },
  { id: 'mod-3', titulo: 'Lectura de Señal RF', nivel_requerido: 2, orden: 1, duracion_min: 30, xp_recompensa: 100, descripcion: 'Interpretación de RSRP, dBm, dBi. Rango óptimo de instalación.', activo: true },
  { id: 'mod-4', titulo: 'ERP — Tickets y Materiales', nivel_requerido: 2, orden: 2, duracion_min: 40, xp_recompensa: 120, descripcion: 'Registro de servicios, materiales y cierre con evidencia fotográfica.', activo: true },
  { id: 'mod-5', titulo: 'Equipos Cambium y Ubiquiti', nivel_requerido: 3, orden: 1, duracion_min: 90, xp_recompensa: 300, descripcion: 'Configuración básica y avanzada de radios de acceso.', activo: true },
  { id: 'mod-6', titulo: 'Factibilidad de Sitio', nivel_requerido: 4, orden: 1, duracion_min: 60, xp_recompensa: 250, descripcion: 'Línea de vista, fresnel, topografía y análisis de obstrucciones.', activo: true },
];

export const MOCK_TECHNICIAN_PROGRESS = [
  { technician_id: 'tech-1', module_id: 'mod-1', completado: true, score: 92, fecha_completado: '2026-03-15T10:00:00Z' },
  { technician_id: 'tech-1', module_id: 'mod-2', completado: true, score: 88, fecha_completado: '2026-03-20T10:00:00Z' },
  { technician_id: 'tech-1', module_id: 'mod-3', completado: true, score: 95, fecha_completado: '2026-04-01T10:00:00Z' },
  { technician_id: 'tech-1', module_id: 'mod-4', completado: false, score: null, fecha_completado: null },
];

export const MOCK_XP_LOG = [
  { technician_id: 'tech-1', tipo: 'modulo_completado', xp: 150, descripcion: 'Módulo Seguridad en Alturas', created_at: '2026-03-15T10:00:00Z' },
  { technician_id: 'tech-1', tipo: 'modulo_completado', xp: 200, descripcion: 'Módulo Tipos de Mástil', created_at: '2026-03-20T10:00:00Z' },
  { technician_id: 'tech-1', tipo: 'examen_aprobado', xp: 95, descripcion: 'Examen RF primer intento', created_at: '2026-04-01T10:00:00Z' },
  { technician_id: 'tech-2', tipo: 'modulo_completado', xp: 300, descripcion: 'Módulo Cambium avanzado', created_at: '2026-04-10T10:00:00Z' },
];
