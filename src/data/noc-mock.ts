import { NOCCity, NOCAlert } from '@/types/noc';

export interface NOCTenantData {
  cities: NOCCity[];
}

// Datos de referencia — Abril 2026
// Fuente: Field Service (FSM) — project.task

const buildCity = (id: string, name: string, score: number, online: number, offline: number, alerts: number, lat: number, lng: number): NOCCity => {
  const makeHosts = (prefix: string, onlineCount: number, offlineCount: number) => {
    const hosts = [];
    for (let i = 1; i <= onlineCount + offlineCount; i++) {
      const isOnline = i <= onlineCount;
      hosts.push({
        id: `${prefix}-h${i}`,
        ip: `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${i}`,
        name: `${prefix.toUpperCase()}-AP-${String(i).padStart(3, '0')}`,
        score: isOnline ? 60 + Math.floor(Math.random() * 40) : 0,
        status: isOnline ? (Math.random() > 0.15 ? 'online' as const : 'degraded' as const) : 'offline' as const,
        lastSeen: isOnline ? new Date().toISOString() : new Date(Date.now() - Math.random() * 3600000).toISOString(),
      });
    }
    return hosts;
  };

  const o1 = Math.floor(online * 0.6);
  const f1 = Math.floor(offline * 0.6);
  return {
    id, name, score,
    sites: [
      { id: `${id}-s1`, name: `Site Principal ${name}`, hosts: makeHosts(id, o1, f1), hostsOnline: o1, hostsOffline: f1 },
      { id: `${id}-s2`, name: `Site ${name} Norte`,     hosts: makeHosts(`${id}n`, online - o1, offline - f1), hostsOnline: online - o1, hostsOffline: offline - f1 },
    ],
    totalHosts: online + offline, online, offline, alerts, lat, lng,
  };
};

export const mockNOCData: Record<string, NOCTenantData> = {
  // XCIEN — Nuevo León / Jalisco
  xcien: {
    cities: [
      buildCity('mty',      'Monterrey',      77, 121, 18, 4, 25.6866, -100.3161),
      buildCity('pnegras',  'Piedras Negras',  82,  12,  1, 0, 28.7000, -100.5231),
      buildCity('saltillo', 'Saltillo',        89,  22,  0, 1, 25.4232, -100.9928),
    ],
  },
  // WISPI — Nuevo León / Jalisco
  wispi: {
    cities: [
      buildCity('gdl', 'Guadalajara', 88, 42, 3, 1, 20.6597, -103.3496),
      buildCity('qro', 'Querétaro',   91, 34, 2, 0, 20.5888, -100.3899),
    ],
  },
  // LUMINET WAN — Coahuila | Abril 2026: 80 tareas, 6% cumplimiento
  luminet: {
    cities: [
      buildCity('trc',  'Torreón',        27, 18, 14, 6, 25.5428, -103.4068),
      buildCity('mxcl', 'Monclova',       31, 10,  8, 3, 26.9055, -101.4222),
      buildCity('snpm', 'San Pedro',      45, 12,  5, 2, 25.7556, -102.9939),
    ],
  },
  // HUUS — CDMX / Gto / Qro | Abril 2026: 14 tareas, 43% cumplimiento
  huus: {
    cities: [
      buildCity('cdmx', 'CDMX',       79, 45, 8, 3, 19.4326,  -99.1332),
      buildCity('gto',  'Guanajuato', 83, 22, 3, 1, 21.0190, -101.2574),
    ],
  },
  // SANDUR | Abril 2026: 316 tareas, 27% cumplimiento
  sandur: {
    cities: [
      buildCity('mty_snd',  'Monterrey',   27, 88, 61, 14, 25.6866, -100.3161),
      buildCity('spgg',     'San Pedro GG', 35, 32, 18,  5, 25.6597, -100.4010),
      buildCity('apodaca',  'Apodaca',      41, 45, 28,  8, 25.7778, -100.1864),
      buildCity('escobedo', 'Escobedo',     38, 28, 20,  6, 25.7967, -100.3178),
    ],
  },
};

export const TENANT_COLORS: Record<string, string> = {
  xcien:  '#1B7F4A',   // verde XCIEN
  luminet:'#0E6B3A',   // verde Luminet
  wispi:  '#0EA5E9',   // azul cielo Wispi
  huus:   '#7C3AED',   // morado Huus
  sandur: '#EA580C',   // naranja Sandur
};

// Alertas reales Abril 2026 — derivadas de tareas No Visitadas y backlog crítico
export const mockAlerts: NOCAlert[] = [
  // SANDUR — 6 no visitadas, backlog 223
  { id: 'a1', cityId: 'mty_snd',  cityName: 'Monterrey (SANDUR)',   siteName: 'Site Apodaca',        hostIp: '172.31.5.2',  type: 'No Visitada',       severity: 'critical', timestamp: new Date(Date.now() - 300000).toISOString(),   ticketCreated: false },
  { id: 'a2', cityId: 'apodaca',  cityName: 'Apodaca (SANDUR)',     siteName: 'Site Escobedo',       hostIp: '172.31.6.8',  type: 'Tarea sin cerrar',  severity: 'warning',  timestamp: new Date(Date.now() - 600000).toISOString(),   ticketCreated: false },
  { id: 'a3', cityId: 'mty_snd',  cityName: 'Monterrey (SANDUR)',   siteName: 'Site Principal',      hostIp: '172.31.5.22', type: 'Backlog crítico',    severity: 'critical', timestamp: new Date(Date.now() - 120000).toISOString(),   ticketCreated: true  },
  // LUMINET — 1 no visitada, 74 pendientes (93%)
  { id: 'a4', cityId: 'trc',      cityName: 'Torreón (LUMINET)',    siteName: 'Site Torreón Norte',  hostIp: '10.40.1.15',  type: 'No Visitada',       severity: 'critical', timestamp: new Date(Date.now() - 900000).toISOString(),   ticketCreated: false },
  { id: 'a5', cityId: 'trc',      cityName: 'Torreón (LUMINET)',    siteName: 'Site Principal',      hostIp: '10.40.2.3',   type: 'Backlog crítico',    severity: 'critical', timestamp: new Date(Date.now() - 450000).toISOString(),   ticketCreated: false },
  { id: 'a6', cityId: 'mxcl',     cityName: 'Monclova (LUMINET)',   siteName: 'Site Monclova',       hostIp: '10.41.1.10',  type: 'Tarea sin cerrar',  severity: 'warning',  timestamp: new Date(Date.now() - 1800000).toISOString(),  ticketCreated: false },
  // HUUS — 8 pendientes
  { id: 'a7', cityId: 'cdmx',     cityName: 'CDMX (HUUS)',          siteName: 'Site CDMX Sur',       hostIp: '10.20.1.12',  type: 'Tarea sin cerrar',  severity: 'warning',  timestamp: new Date(Date.now() - 2400000).toISOString(),  ticketCreated: false },
];

export const alertTenantMap: Record<string, string> = {
  a1: 'sandur', a2: 'sandur', a3: 'sandur',
  a4: 'luminet', a5: 'luminet', a6: 'luminet',
  a7: 'huus',
};

// Resumen operaciones campo Abril 2026 — directo de Odoo FSM
export const FSM_ABRIL_2026 = {
  periodo: 'Abril 2026',
  total: 411,
  completadas: 98,
  pendientes: 306,
  noVisitadas: 7,
  cumplimiento: 24,
  porEmpresa: [
    { empresa: 'SANDUR',     total: 316, completadas: 87, pendientes: 223, noVisitadas: 6, pct: 27 },
    { empresa: 'LUMINET WAN',total:  80, completadas:  5, pendientes:  74, noVisitadas: 1, pct:  6 },
    { empresa: 'HUUS VAS',   total:  14, completadas:  6, pendientes:   8, noVisitadas: 0, pct: 43 },
    { empresa: 'SENEL',      total:   1, completadas:  0, pendientes:   1, noVisitadas: 0, pct:  0 },
  ],
  topTecnicos: [
    { nombre: 'Guillermo Hernández Flores',         tareas: 40, completadas:  6, empresa: 'LUMINET/HUUS' },
    { nombre: 'Jhony Gabriel Collazo Collazo',      tareas: 37, completadas: 12, empresa: 'SANDUR'       },
    { nombre: 'Ricardo Fidel Cisneros Cárdenas',    tareas: 37, completadas:  2, empresa: 'LUMINET'      },
    { nombre: 'Jesús Andrés Marroquín Corona',      tareas: 30, completadas:  0, empresa: 'SANDUR'       },
    { nombre: 'Francisco Javier Marines Olivares',  tareas: 30, completadas:  8, empresa: 'SANDUR'       },
    { nombre: 'Rogelio Robles Covarrubias',         tareas: 28, completadas: 12, empresa: 'SANDUR'       },
    { nombre: 'Marcos Alva',                        tareas: 27, completadas:  0, empresa: 'SANDUR'       },
    { nombre: 'Armando Graciano Aguilar',           tareas: 23, completadas: 14, empresa: 'SANDUR'       },
  ],
};
