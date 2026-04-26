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

// ── Preset themes ─────────────────────────────────────────────────────────────
export interface PresetTheme {
  id:          string;
  name:        string;
  description: string;
  emoji:       string;
  preview:     { bg: string; accent: string; card: string; text: string };
  config:      ThemeConfig;
}

export const PRESET_THEMES: PresetTheme[] = [
  {
    id: 'xcien',
    name: 'XCIEN 2.0',
    description: 'Verde corporativo sobre negro · tema por defecto',
    emoji: '🟢',
    preview: { bg: '#0A0A0A', accent: '#00A859', card: '#151515', text: '#F0F0F0' },
    config: DEFAULT_THEME,
  },
  {
    id: 'holo',
    name: 'NOC Holográfico',
    description: 'Neon verde · estilo sala de control sci-fi',
    emoji: '⚡',
    preview: { bg: '#000905', accent: '#00ff88', card: 'rgba(0,8,4,0.88)', text: '#d8f8e8' },
    config: {
      accent:       '#00ff88',
      bg:           '#000905',
      card:         '#050f07',
      sidebar:      '#020a04',
      border:       'rgba(0,255,136,0.12)',
      text:         '#d8f8e8',
      dim:          '#2a6040',
      sidebarWidth: 260,
      radius:       6,
      baseFontSize: 13,
      animations:   true,
      compact:      false,
    },
  },
  {
    id: 'corporate',
    name: 'Corporativo',
    description: 'Tema claro · presentaciones y clientes',
    emoji: '🏢',
    preview: { bg: '#F5F5F7', accent: '#0066CC', card: '#FFFFFF', text: '#1D1D1F' },
    config: {
      accent:       '#0066CC',
      bg:           '#F5F5F7',
      card:         '#FFFFFF',
      sidebar:      '#FAFAFA',
      border:       'rgba(0,0,0,0.08)',
      text:         '#1D1D1F',
      dim:          '#6E6E73',
      sidebarWidth: 260,
      radius:       12,
      baseFontSize: 14,
      animations:   true,
      compact:      false,
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Morado profundo · modo nocturno',
    emoji: '🌙',
    preview: { bg: '#0D0A1A', accent: '#8B5CF6', card: '#141020', text: '#EDE9FE' },
    config: {
      accent:       '#8B5CF6',
      bg:           '#0D0A1A',
      card:         '#141020',
      sidebar:      '#0F0C18',
      border:       'rgba(139,92,246,0.15)',
      text:         '#EDE9FE',
      dim:          '#6D5E8A',
      sidebarWidth: 260,
      radius:       14,
      baseFontSize: 14,
      animations:   true,
      compact:      false,
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Azul marino · vista de operaciones de red',
    emoji: '🌊',
    preview: { bg: '#0B1826', accent: '#00B4D8', card: '#0f2030', text: '#e2e8f0' },
    config: {
      accent:       '#00B4D8',
      bg:           '#0B1826',
      card:         '#0f2030',
      sidebar:      '#091520',
      border:       'rgba(0,180,216,0.12)',
      text:         '#e2e8f0',
      dim:          '#4a6a7a',
      sidebarWidth: 260,
      radius:       12,
      baseFontSize: 14,
      animations:   true,
      compact:      false,
    },
  },
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'Ámbar sobre negro · estilo consola clásica',
    emoji: '🖥️',
    preview: { bg: '#0A0800', accent: '#F59E0B', card: '#111000', text: '#FEF3C7' },
    config: {
      accent:       '#F59E0B',
      bg:           '#0A0800',
      card:         '#111000',
      sidebar:      '#0D0B00',
      border:       'rgba(245,158,11,0.12)',
      text:         '#FEF3C7',
      dim:          '#78600A',
      sidebarWidth: 260,
      radius:       4,
      baseFontSize: 13,
      animations:   false,
      compact:      true,
    },
  },
];

// ── Navigation ────────────────────────────────────────────────────────────────
export type SectionId = 'inicio' | 'noc' | 'academia' | 'wfm' | 'tokens' | 'transacciones' | 'etiquetas' | 'editor';

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
