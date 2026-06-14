// Tipos y constantes compartidos entre vistas de Academia

export interface OdooMember { name: string; pct: number; status: string }

export interface OdooCurso {
  id: number;
  name: string;
  description: string;
  total_slides: number;
  total_time_h: number;
  members: number;
  published: boolean;
  avg_completion: number;
  members_list: OdooMember[];
}

export interface AcademiaStats {
  total_tecnicos: number;
  avance_global: number;
  total_cursos: number;
  total_badges: number;
  top5: { name: string; pct: number; cursos: number; level: string }[];
  level_distribution: Record<string, number>;
}

// Empleado enriquecido (calculado en el frontend a partir de Odoo eLearning + RRHH)
export interface Tecnico {
  name: string;
  avgPct: number;   // promedio de todos sus cursos
  cursos: number;   // cuántos cursos tiene inscritos
  level: string;
  levelColor: string;
  levelIcon: string;
  rank: number;
  plaza: string;    // ubicación (work_location_id) desde RRHH
  area: string;     // departamento desde RRHH
}

export const LEVELS = [
  { name: 'Aprendiz',     min: 0,  max: 30,  icon: '🌱', color: '#6b7280' },
  { name: 'Técnico',      min: 30, max: 50,  icon: '🔧', color: '#4FC3F7' },
  { name: 'Especialista', min: 50, max: 65,  icon: '⚙️', color: '#00C896' },
  { name: 'Avanzado',     min: 65, max: 80,  icon: '🏆', color: '#7c3aed' },
  { name: 'Experto',      min: 80, max: 95,  icon: '🎖️', color: '#FFB703' },
  { name: 'Leyenda',      min: 95, max: 101, icon: '⭐', color: '#FF4757' },
] as const;

export function getLevel(pct: number) {
  return LEVELS.find(l => pct >= l.min && pct < l.max) ?? LEVELS[0];
}

/**
 * Construye lista de empleados inscritos en la Academia desde los cursos Odoo.
 * Incluye a TODA la organización — técnicos, NOC, WFM, comercial, admin, etc.
 * El mapa de RRHH enriquece con plaza y área, pero NO excluye a nadie:
 * si alguien está en los cursos pero no en RRHH, igual aparece (con plaza/area vacíos).
 */
export function buildTecnicoList(
  cursos: OdooCurso[],
  plazaMapa?: Record<string, string>,
  areaMapa?: Record<string, string>,
): Tecnico[] {
  const map: Record<string, { sum: number; count: number }> = {};
  for (const c of cursos) {
    for (const m of c.members_list) {
      const name = (m.name ?? '').trim();
      if (!name || name === '—') continue;
      if (!map[name]) map[name] = { sum: 0, count: 0 };
      map[name].sum += typeof m.pct === 'number' ? m.pct : 0;
      map[name].count += 1;
    }
  }
  return Object.entries(map)
    .map(([name, { sum, count }]) => {
      const avgPct = count > 0 ? Math.round(sum / count * 10) / 10 : 0;
      const lv    = getLevel(avgPct);
      const key   = name.toLowerCase();
      return {
        name, avgPct, cursos: count,
        level: lv.name, levelColor: lv.color, levelIcon: lv.icon,
        rank: 0,
        plaza: plazaMapa?.[key] ?? '',
        area:  areaMapa?.[key]  ?? '',
      };
    })
    .sort((a, b) => b.avgPct - a.avgPct)
    .map((t, i) => ({ ...t, rank: i + 1 }));
}

export const ODOO_ELEARNING_URL = '/web#action=slide.action_slide_channel';
