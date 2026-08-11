import type { PlazaConfig } from './CiudadOSSection';
import type { ThemeConfig } from '../types';

// ── Tema institucional XCIEN — blanco + verde corporativo ─────────────────────
// Colores: GD=#1a3d2b (verde oscuro) GM=#2d7a3a (verde medio) LN=#c8dccb (bordes)
export const XCIEN_CORPORATE_THEME: ThemeConfig = {
  accent:       '#2d7a3a',
  bg:           '#f8fdf9',
  card:         '#ffffff',
  sidebar:      '#f0f9f3',
  border:       '#c8dccb',
  text:         '#1a1a1a',
  dim:          '#5a5a5a',
  sidebarWidth: 260,
  radius:       8,
  baseFontSize: 14,
  animations:   true,
  compact:      false,
};

// ── Plaza Piedras Negras ───────────────────────────────────────────────────────
export const PDN_CONFIG: PlazaConfig = {
  id: 'pdn',
  nombre: 'Piedras Negras',
  estado_mx: 'Coahuila',
  emoji: '🏙️',
  fibra_plaza_id: 'pn',
  tecnico_filter: '',
  ticket_terms: ['piedras', 'acuña', 'acuna', 'allende', 'nava', 'progreso', 'cd acuña'],
  noc_terms: ['piedras', 'acuña', 'acuna', 'pdn', 'acu'],
  blocker: 'F3 CWDM bloqueado — Lancermex 21 cajas, 10% avance · Escalado a Francisco Alday',
  equipo: [
    { nombre: 'Francisco Alday',        rol: 'Responsable de plaza',  emoji: '👔' },
    { nombre: 'Guillermo Hernandez F.', rol: 'Técnico campo',         emoji: '🔧', activo: true },
    { nombre: 'José Miguel Macías',     rol: 'Supervisor / Auditor',  emoji: '🛡️' },
  ],
};
