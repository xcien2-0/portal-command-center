// Academia — Utility functions and constants

export const LEVEL_CONFIG = [
  { level: 1, name: 'Aprendiz', xpRequired: 0, color: '#94a3b8', multiplier: 1.0 },
  { level: 2, name: 'Técnico', xpRequired: 500, color: '#1D9E75', multiplier: 1.1 },
  { level: 3, name: 'Especialista', xpRequired: 1500, color: '#534AB7', multiplier: 1.2 },
  { level: 4, name: 'Senior', xpRequired: 3000, color: '#d97706', multiplier: 1.3 },
  { level: 5, name: 'Mentor', xpRequired: 5500, color: '#ef4444', multiplier: 1.4 },
  { level: 6, name: 'Leyenda', xpRequired: 9000, color: '#eab308', multiplier: 1.5 },
] as const;

export const PLAZA_MULTIPLIERS: Record<string, number> = {
  nuevo_leon: 1.0,
  cdmx: 1.0,
  jalisco: 1.1,
  queretaro: 1.1,
  coahuila: 1.15,
  tamaulipas: 1.15,
};

export const RACHA_MULTIPLIERS = [
  { months: 0, multiplier: 1.0 },
  { months: 1, multiplier: 1.2 },
  { months: 2, multiplier: 1.35 },
  { months: 3, multiplier: 1.5 },
];

export const PLAZA_LABELS: Record<string, string> = {
  nuevo_leon: 'Nuevo León',
  coahuila: 'Coahuila',
  tamaulipas: 'Tamaulipas',
  queretaro: 'Querétaro',
  jalisco: 'Jalisco',
  cdmx: 'CDMX',
};

export const XP_TYPE_LABELS: Record<string, { label: string; emoji: string }> = {
  ticket_ok: { label: 'Ticket resuelto', emoji: '🎫' },
  ticket_anticipado: { label: 'Ticket anticipado', emoji: '⚡' },
  ticket_critico: { label: 'Ticket crítico', emoji: '🔥' },
  instalacion: { label: 'Instalación', emoji: '🏠' },
  instalacion_empresa: { label: 'Instalación empresa', emoji: '🏢' },
  modulo: { label: 'Módulo completado', emoji: '📚' },
  examen_1er: { label: 'Examen (1er intento)', emoji: '🎓' },
  examen_reintento: { label: 'Examen (reintento)', emoji: '📝' },
  sop: { label: 'SOP documentado', emoji: '📋' },
  racha_30d: { label: 'Racha 30 días', emoji: '🔥' },
  badge: { label: 'Badge obtenido', emoji: '🏅' },
  mentoria: { label: 'Mentoría', emoji: '🤝' },
  revisita: { label: 'Revisita', emoji: '🔄' },
  sla_fail: { label: 'SLA incumplido', emoji: '⏰' },
  ticket_sin_evidencia: { label: 'Sin evidencia', emoji: '📷' },
  instalacion_falla: { label: 'Instalación con falla', emoji: '⚠️' },
};

export function getLevelInfo(level: number) {
  return LEVEL_CONFIG.find(l => l.level === level) || LEVEL_CONFIG[0];
}

export function getNextLevelInfo(level: number) {
  return LEVEL_CONFIG.find(l => l.level === level + 1);
}

export function getProgressToNextLevel(xpTotal: number, currentLevel: number) {
  const current = getLevelInfo(currentLevel);
  const next = getNextLevelInfo(currentLevel);
  if (!next) return { progress: 100, xpNeeded: 0, xpInLevel: 0 };
  const xpInLevel = xpTotal - current.xpRequired;
  const xpForLevel = next.xpRequired - current.xpRequired;
  return {
    progress: Math.min(100, Math.round((xpInLevel / xpForLevel) * 100)),
    xpNeeded: Math.max(0, next.xpRequired - xpTotal),
    xpInLevel,
    xpForLevel,
  };
}

export function getRachaMultiplier(racha: number, hasNegativeThisMonth: boolean) {
  if (hasNegativeThisMonth) return 1.0;
  if (racha >= 3) return 1.5;
  if (racha === 2) return 1.35;
  if (racha === 1) return 1.2;
  return 1.0;
}

export function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTimeAgo(date: string) {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Hace un momento';
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  return `Hace ${days} días`;
}
