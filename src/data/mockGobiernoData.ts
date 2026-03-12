export interface DailyAvailability {
  fecha: string;
  disponibilidad: number;
  incidentes: number;
  tiempoInactivo: string;
  observaciones: string;
}

export interface GobIncident {
  folio: string;
  fechaInicio: string;
  fechaResolucion: string;
  duracion: string;
  tipo: string;
  causaRaiz: string;
  impacto: string;
  resolucion: string;
  detalles?: string;
}

export interface SLATerm {
  nombre: string;
  garantizado: string;
  actual: string;
  cumplido: boolean;
}

export interface GeneratedReport {
  id: string;
  periodo: string;
  folio: string;
  generadoPor: string;
  fecha: string;
  disponibilidad: number;
  estado: 'completado' | 'pendiente';
}

export const GOB_CLIENT = {
  nombre: 'Gobierno del Estado de Nuevo León',
  plan: 'Enlace Dedicado Gubernamental 500 Mbps',
  contrato: 'GOB-NL-2025-0142',
  slaUptime: 99.5,
};

export function generateDailyAvailability(year: number, month: number): DailyAvailability[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const data: DailyAvailability[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const fecha = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const rand = Math.random();
    let disponibilidad: number;
    let incidentes = 0;
    let tiempoInactivo = '0 min';
    let observaciones = 'Sin novedad';

    if (rand < 0.05) {
      disponibilidad = 95 + Math.random() * 3;
      incidentes = 1;
      tiempoInactivo = `${Math.floor((100 - disponibilidad) * 14.4)} min`;
      observaciones = 'Incidente de conectividad registrado';
    } else if (rand < 0.15) {
      disponibilidad = 98 + Math.random() * 1.5;
      incidentes = 1;
      tiempoInactivo = `${Math.floor((100 - disponibilidad) * 14.4)} min`;
      observaciones = 'Mantenimiento programado';
    } else {
      disponibilidad = 99.5 + Math.random() * 0.5;
      incidentes = 0;
      tiempoInactivo = '0 min';
    }

    data.push({
      fecha,
      disponibilidad: parseFloat(disponibilidad.toFixed(2)),
      incidentes,
      tiempoInactivo,
      observaciones,
    });
  }
  return data;
}

export const MOCK_GOB_INCIDENTS: GobIncident[] = [
  {
    folio: 'INC-GOB-2026-0031',
    fechaInicio: '2026-03-03 08:15:00',
    fechaResolucion: '2026-03-03 09:02:00',
    duracion: '47 min',
    tipo: 'Conectividad',
    causaRaiz: 'Falla en puerto de switch de distribución',
    impacto: 'Pérdida parcial de conectividad en edificio principal',
    resolucion: 'Reemplazo de puerto y redireccionamiento de tráfico',
    detalles: 'Se detectó falla en puerto GigabitEthernet 0/24 del switch Cisco 9300. Se migró el enlace al puerto de respaldo y se programó reemplazo de módulo.',
  },
  {
    folio: 'INC-GOB-2026-0028',
    fechaInicio: '2026-03-07 14:30:00',
    fechaResolucion: '2026-03-07 15:05:00',
    duracion: '35 min',
    tipo: 'Latencia',
    causaRaiz: 'Saturación de enlace por actualización masiva de sistemas',
    impacto: 'Latencia elevada en aplicaciones web',
    resolucion: 'QoS ajustado para priorizar tráfico crítico',
    detalles: 'La Dirección de TI ejecutó actualizaciones de Windows en 200+ equipos simultáneamente. Se aplicó política de QoS temporal.',
  },
  {
    folio: 'INC-GOB-2026-0025',
    fechaInicio: '2026-03-11 10:00:00',
    fechaResolucion: '2026-03-11 11:15:00',
    duracion: '75 min',
    tipo: 'DNS',
    causaRaiz: 'Servidor DNS primario no respondía',
    impacto: 'Resolución de nombres intermitente',
    resolucion: 'Reinicio del servicio DNS y failover a servidor secundario',
    detalles: 'El servidor DNS primario (10.0.1.53) dejó de responder queries. Se realizó reinicio del servicio bind9 y se verificó la replicación de zonas.',
  },
];

export const MOCK_SLA_TERMS: SLATerm[] = [
  { nombre: 'Disponibilidad del servicio', garantizado: '99.5%', actual: '99.7%', cumplido: true },
  { nombre: 'Tiempo de respuesta P1 (Crítico)', garantizado: '2 horas', actual: '47 min promedio', cumplido: true },
  { nombre: 'Tiempo de respuesta P2 (Alto)', garantizado: '4 horas', actual: '1.5 horas promedio', cumplido: true },
  { nombre: 'Penalización por incumplimiento', garantizado: '5% factura mensual', actual: 'N/A', cumplido: true },
];

export const MOCK_REPORT_HISTORY: GeneratedReport[] = [
  { id: 'r1', periodo: 'Febrero 2026', folio: 'RPT-GOB-2026-02', generadoPor: 'Sistema automático', fecha: '2026-03-01 08:00', disponibilidad: 99.8, estado: 'completado' },
  { id: 'r2', periodo: 'Enero 2026', folio: 'RPT-GOB-2026-01', generadoPor: 'Ing. Carlos Mendoza', fecha: '2026-02-01 09:15', disponibilidad: 99.6, estado: 'completado' },
  { id: 'r3', periodo: 'Diciembre 2025', folio: 'RPT-GOB-2025-12', generadoPor: 'Sistema automático', fecha: '2026-01-02 08:00', disponibilidad: 99.9, estado: 'completado' },
  { id: 'r4', periodo: 'Noviembre 2025', folio: 'RPT-GOB-2025-11', generadoPor: 'Ing. Ana Rodríguez', fecha: '2025-12-01 10:30', disponibilidad: 99.4, estado: 'completado' },
];

export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
