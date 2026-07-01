// Tipos y constantes compartidos entre vistas de Academia

export interface OdooMember { partner_id: number | null; name: string; pct: number; status: string }

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
  total_activos: number;
  avance_global: number;
  avance_activos: number;
  total_cursos: number;
  total_badges: number;
  top5: { name: string; pct: number; cursos: number; level: string }[];
  level_distribution: Record<string, number>;
  mayor_avance: { name: string; pct: number } | null;
  menor_avance: { name: string; pct: number } | null;
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
function fuzzyLookup(map: Record<string, string> | undefined, nameKey: string): string {
  if (!map) return '';
  if (map[nameKey]) return map[nameKey];
  // Intenta coincidencia por prefijo (ej. "jose miguel macias" ↔ "jose miguel macias contreras")
  for (const [k, v] of Object.entries(map)) {
    if (k.startsWith(nameKey) || nameKey.startsWith(k)) return v;
  }
  return '';
}

export function buildTecnicoList(
  cursos: OdooCurso[],
  plazaMapa?: Record<string, string>,
  areaMapa?: Record<string, string>,
): Tecnico[] {
  // Agrupa por partner_id cuando está disponible; fallback a nombre normalizado.
  // Esto evita duplicados cuando la misma persona tiene ligeras variantes de nombre en Odoo.
  const map: Record<string | number, { name: string; sum: number; count: number }> = {};

  for (const c of cursos) {
    for (const m of c.members_list) {
      const name = (m.name ?? '').trim();
      if (!name || name === '—') continue;
      const key: string | number = m.partner_id ?? name.toLowerCase();
      if (!map[key]) {
        map[key] = { name, sum: 0, count: 0 };
      } else if (name.length > map[key].name.length) {
        map[key].name = name; // conservar nombre más completo
      }
      map[key].sum   += typeof m.pct === 'number' ? m.pct : 0;
      map[key].count += 1;
    }
  }

  return Object.values(map)
    .map(({ name, sum, count }) => {
      const avgPct = count > 0 ? Math.round(sum / count * 10) / 10 : 0;
      const lv     = getLevel(avgPct);
      const nameKey = name.toLowerCase();
      return {
        name, avgPct, cursos: count,
        level: lv.name, levelColor: lv.color, levelIcon: lv.icon,
        rank: 0,
        plaza: fuzzyLookup(plazaMapa, nameKey),
        area:  fuzzyLookup(areaMapa, nameKey),
      };
    })
    .sort((a, b) => b.avgPct - a.avgPct)
    .map((t, i) => ({ ...t, rank: i + 1 }));
}

export const ODOO_ELEARNING_URL = '/web#action=slide.action_slide_channel';
