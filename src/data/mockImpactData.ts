export interface ImpactMonth {
  mes: string;
  mesIndex: number;
  year: number;
  comunidadesConectadas: number;
  usuariosUnicos: number;
  horasTotalesConexion: number;
  estados: string[];
  afiliadosActivos: number;
  municipiosNuevos: number;
  primeraVezInternet: number;
  cocoBoxesActivas: number;
  ingresoBruto: number;
}

export const MOCK_IMPACT_MONTHS: ImpactMonth[] = [
  {
    mes: 'Marzo', mesIndex: 2, year: 2026,
    comunidadesConectadas: 47, usuariosUnicos: 3_820, horasTotalesConexion: 112_400,
    estados: ['Oaxaca', 'Chiapas', 'Guerrero', 'Veracruz', 'Puebla'],
    afiliadosActivos: 39, municipiosNuevos: 3, primeraVezInternet: 640,
    cocoBoxesActivas: 52, ingresoBruto: 418_000,
  },
  {
    mes: 'Febrero', mesIndex: 1, year: 2026,
    comunidadesConectadas: 44, usuariosUnicos: 3_410, horasTotalesConexion: 98_700,
    estados: ['Oaxaca', 'Chiapas', 'Guerrero', 'Veracruz'],
    afiliadosActivos: 36, municipiosNuevos: 2, primeraVezInternet: 510,
    cocoBoxesActivas: 48, ingresoBruto: 375_000,
  },
  {
    mes: 'Enero', mesIndex: 0, year: 2026,
    comunidadesConectadas: 42, usuariosUnicos: 3_100, horasTotalesConexion: 89_200,
    estados: ['Oaxaca', 'Chiapas', 'Guerrero', 'Veracruz'],
    afiliadosActivos: 34, municipiosNuevos: 4, primeraVezInternet: 480,
    cocoBoxesActivas: 45, ingresoBruto: 341_000,
  },
  {
    mes: 'Diciembre', mesIndex: 11, year: 2025,
    comunidadesConectadas: 38, usuariosUnicos: 2_750, horasTotalesConexion: 78_500,
    estados: ['Oaxaca', 'Chiapas', 'Guerrero'],
    afiliadosActivos: 30, municipiosNuevos: 2, primeraVezInternet: 390,
    cocoBoxesActivas: 41, ingresoBruto: 302_000,
  },
];

export function generateImpactNarrative(d: ImpactMonth): string {
  return `Durante ${d.mes} ${d.year}, Coco conectó a ${d.usuariosUnicos.toLocaleString('es-MX')} familias en ${d.comunidadesConectadas} comunidades de ${d.estados.join(', ')}.\n\n${d.primeraVezInternet.toLocaleString('es-MX')} personas accedieron a internet por primera vez este mes, acumulando ${d.horasTotalesConexion.toLocaleString('es-MX')} horas totales de conexión.\n\nLa red operó con ${d.cocoBoxesActivas} Coco Boxes activas, gestionadas por ${d.afiliadosActivos} afiliados locales en ${d.estados.length} estados. Se incorporaron ${d.municipiosNuevos} municipios nuevos a la cobertura.\n\nEl ingreso bruto del mes fue de $${d.ingresoBruto.toLocaleString('es-MX')} MXN, contribuyendo directamente a la economía de las comunidades rurales a través de comisiones a afiliados locales.`;
}

export const IMPACT_AUDIENCES = [
  { id: 'fondos', label: 'Fondos de inversión de impacto', icon: 'TrendingUp' },
  { id: 'ift', label: 'IFT (Regulador)', icon: 'Scale' },
  { id: 'gobierno', label: 'Gobierno municipal/estatal', icon: 'Landmark' },
  { id: 'internacional', label: 'Organizaciones internacionales (UNICEF, BID)', icon: 'Globe' },
] as const;
