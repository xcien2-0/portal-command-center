// ── Theme ─────────────────────────────────────────────────────────────────────
export interface ThemeConfig {
  accent: string;
  bg: string;
  card: string;
  sidebar: string;
  border: string;
  text: string;
  dim: string;
  sidebarWidth: number;
  radius: number;
  baseFontSize: number;
  animations: boolean;
  compact: boolean;
}

export const DEFAULT_THEME: ThemeConfig = {
  accent:      '#00A859',
  bg:          '#0A0A0A',
  card:        '#151515',
  sidebar:     '#0F0F0F',
  border:      'rgba(255,255,255,0.06)',
  text:        '#F0F0F0',
  dim:         '#808080',
  sidebarWidth: 260,
  radius:       12,
  baseFontSize: 14,
  animations:   true,
  compact:      false,
};

export const PRESET_ACCENTS = [
  { label: 'Verde XCIEN', value: '#00A859' },
  { label: 'Cian NOC',    value: '#00B4D8' },
  { label: 'Azul',        value: '#3B82F6' },
  { label: 'Morado',      value: '#8B5CF6' },
  { label: 'Naranja',     value: '#F97316' },
  { label: 'Rosa',        value: '#EC4899' },
];

// ── Navigation ────────────────────────────────────────────────────────────────
export type SectionId = 'inicio' | 'noc' | 'academia' | 'wfm' | 'editor';

export interface NavItem {
  id: SectionId;
  label: string;
  icon: string;
  group?: string;
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: string;
}

// ── WFM ───────────────────────────────────────────────────────────────────────
export type TechStatus = 'Disponible' | 'En Sitio' | 'En Oficina';
export type TicketPriority = 'critical' | 'high' | 'medium';

export interface WFMTechnician {
  id: string;
  name: string;
  zone: string;
  specialization: string;
  skillPct: number;
  status: TechStatus;
}

export interface WFMTicket {
  id: string;
  client: string;
  description: string;
  location: string;
  priority: TicketPriority;
  assignedTo: string | null;
}

// ── WFM mock data ─────────────────────────────────────────────────────────────
export const WFM_TECHNICIANS: WFMTechnician[] = [
  { id: 't1', name: 'Carlos Mendoza',       zone: 'Nuevo León',  specialization: 'Instalación Fibra', skillPct: 92, status: 'Disponible' },
  { id: 't2', name: 'Ana Rodríguez',         zone: 'Coahuila',    specialization: 'RF & Wireless',     skillPct: 87, status: 'En Sitio'   },
  { id: 't3', name: 'Miguel Ángel Torres',   zone: 'San Luis P.', specialization: 'Soporte Nivel 2',   skillPct: 78, status: 'Disponible' },
  { id: 't4', name: 'Laura Garza',           zone: 'Nuevo León',  specialization: 'Splicing Óptico',   skillPct: 95, status: 'En Oficina' },
  { id: 't5', name: 'Roberto Salinas',       zone: 'CDMX',        specialization: 'Infraestructura',   skillPct: 83, status: 'En Sitio'   },
  { id: 't6', name: 'Jorge Martínez',        zone: 'Jalisco',     specialization: 'Instalación Fibra', skillPct: 71, status: 'Disponible' },
];

export const WFM_TICKETS: WFMTicket[] = [
  { id: 'T-1042', client: 'Xcien Monterrey',  description: 'Latencia elevada en nodo core',    location: 'Apodaca, NL',     priority: 'critical', assignedTo: null },
  { id: 'T-1043', client: 'Luminet WAN',       description: 'Fibra cortada — restitución',      location: 'Torreón, COAH',   priority: 'critical', assignedTo: 't2' },
  { id: 'T-1044', client: 'Sandur SLP',        description: 'Configuración de equipo nuevo',    location: 'Soledad G.S.',    priority: 'high',     assignedTo: null },
  { id: 'T-1045', client: 'Huus CDMX',         description: 'Revisión de nodo secundario',      location: 'CDMX Sur',        priority: 'medium',   assignedTo: 't5' },
  { id: 'T-1046', client: 'Wispi Jalisco',      description: 'Instalación cliente corporativo',  location: 'Guadalajara, JAL',priority: 'high',     assignedTo: null },
];
