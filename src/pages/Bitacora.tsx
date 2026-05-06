import { useState } from 'react';
import { BookOpen, Cpu, FileText, GraduationCap, BarChart2, Wrench, Layers, ExternalLink } from 'lucide-react';

const PROJECTS = [
  {
    id: 1,
    fecha: 'Abril 2026',
    org: 'XCIEN',
    categoria: 'Documentación',
    titulo: 'Libro Maestro de Operaciones XCIEN 2026',
    descripcion: 'Documento central que consolida el 100% de los procesos operativos. Estándares de instalación, niveles RF, flujos HL, protocolo Cero Basura y gobernanza por departamentos.',
    impacto: 'Línea base de calidad para toda la operación nacional',
    icon: FileText,
    color: '#1D9E75',
    tags: ['SOPs', 'Estándares', 'GitHub'],
    estado: 'completado',
  },
  {
    id: 2,
    fecha: 'Abril 2026',
    org: 'XCIEN',
    categoria: 'RRHH',
    titulo: 'Escalafón Técnico: Auxiliar → Técnico → Líder',
    descripcion: 'Programa de carrera con requisitos verificables. Auxiliar a Técnico: 90% examen + 15 instalaciones + EPP. Técnico a Líder: factibilidad avanzada + Odoo + liderazgo de cuadrilla.',
    impacto: 'Ruta de crecimiento clara para toda la fuerza técnica',
    icon: GraduationCap,
    color: '#534AB7',
    tags: ['Carrera', 'Certificación', 'Odoo'],
    estado: 'completado',
  },
  {
    id: 3,
    fecha: 'Abril–Mayo 2026',
    org: 'XCIEN',
    categoria: 'Academia',
    titulo: 'Academia XCIEN — Plataforma de Capacitación',
    descripcion: 'v1: servidor Flask + HTML estático con banco de preguntas. v2: Portal React con módulos, exámenes dinámicos, XP, leaderboard y panel de administración.',
    impacto: 'Capacitación 100% digital, consultable desde dispositivo móvil',
    icon: GraduationCap,
    color: '#F59E0B',
    tags: ['React', 'Python', 'Gamificación'],
    estado: 'en progreso',
  },
  {
    id: 4,
    fecha: 'Abril 2026',
    org: 'XCIEN',
    categoria: 'Infraestructura',
    titulo: 'Laboratorio de Pruebas y Capacitación',
    descripcion: 'Centro físico en Almacén Central. Primera sesión presencial CAP-LIVE-2026-001: digitalización operativa, consulta de estándares, integración WFM.',
    impacto: 'Espacio físico para certificación técnica práctica',
    icon: Wrench,
    color: '#EF4444',
    tags: ['Capacitación', 'Presencial', 'Lab'],
    estado: 'completado',
  },
  {
    id: 5,
    fecha: 'Abril 2026',
    org: 'XCIEN',
    categoria: 'Documentación',
    titulo: 'Estándares Técnicos de Instalación y RF',
    descripcion: 'Cuatro documentos de ingeniería: Estándar Corporativo de Instalación, Alineación de Antenas Microondas, Proceso Implementación HL, Proceso Soporte HL. Incluyen quizzes JSON para la Academia.',
    impacto: 'Eliminación de heterogeneidad en criterios de instalación',
    icon: FileText,
    color: '#1D9E75',
    tags: ['Microondas', 'RF', 'Instalación'],
    estado: 'completado',
  },
  {
    id: 6,
    fecha: 'Abril–Mayo 2026',
    org: 'XCIEN',
    categoria: 'IA',
    titulo: 'Ecosistema de Agentes IA — XCIEN 2.0',
    descripcion: 'Sistema multiagente: Director General (orquestador), Ops/Field Service (calidad), Academia (exámenes dinámicos), Odoo Sync (trazabilidad), RRHH (promociones).',
    impacto: 'Automatización de decisiones operativas y promociones técnicas',
    icon: Cpu,
    color: '#8B5CF6',
    tags: ['Python', 'LLM', 'Gemini', 'Qwen'],
    estado: 'en progreso',
  },
  {
    id: 7,
    fecha: 'Mayo 2026',
    org: 'XCIEN',
    categoria: 'Portal',
    titulo: 'Portal Live Status Hub — localhost:8080',
    descripcion: 'Dashboard interno React/TypeScript. Módulos: NOC, Dispatch, Call Center, Academia, Métricas (12 KPIs + 7 SLAs), Migración Odoo. Supabase eliminado; arquitectura mock → Odoo XML-RPC.',
    impacto: 'Centralización de operaciones en una sola interfaz',
    icon: Layers,
    color: '#0EA5E9',
    tags: ['React', 'TypeScript', 'Odoo'],
    estado: 'en progreso',
  },
  {
    id: 8,
    fecha: 'Mayo 2026',
    org: 'Next Ventures',
    categoria: 'Propuesta',
    titulo: 'La Mixtequita — Red Comunitaria LTE',
    descripcion: 'Propuesta de infraestructura para 2,500–3,000 usuarios. Backhaul PtP microondas + torre hub 25m + 4 sectores ePMP + 500 CPEs. Red Altan Band 28. Inversión: $59K–$101K USD.',
    impacto: 'Conectividad rural para comunidad sin acceso a internet',
    icon: BarChart2,
    color: '#1D9E75',
    tags: ['LTE', 'Rural', 'Altan', 'Cambium'],
    estado: 'propuesta',
  },
  {
    id: 9,
    fecha: 'Mayo 2026',
    org: 'Next Ventures',
    categoria: 'Propuesta',
    titulo: 'Bidrillas — Fuerza Técnica Certificada',
    descripcion: 'Modelo de cuadrillas de 2 personas certificadas bajo estándar XCIEN. 4 perfiles: Auxiliar, Técnico, Técnico RF/Microondas, Líder. Soporte IA embebido. PPTX ejecutivo v2 generado.',
    impacto: 'Modelo de negocio escalable de field service para terceros',
    icon: GraduationCap,
    color: '#F59E0B',
    tags: ['Field Service', 'Certificación', 'PPTX'],
    estado: 'propuesta',
  },
  {
    id: 10,
    fecha: 'Mayo 2026',
    org: 'XCIEN',
    categoria: 'Comercial',
    titulo: 'Saltillo — 300 Cámaras de Videovigilancia',
    descripcion: 'Propuesta de instalación masiva en infraestructura de alumbrado público. 8 puntos de definición pendientes. Piloto de 5 postes obligatorio antes de escalar.',
    impacto: 'Proyecto de seguridad pública en municipio de Coahuila',
    icon: Wrench,
    color: '#EF4444',
    tags: ['Videovigilancia', 'Saltillo', 'Coahuila'],
    estado: 'en negociación',
  },
];

const ORGS = ['Todos', 'XCIEN', 'Next Ventures'];
const CATS = ['Todos', 'Documentación', 'RRHH', 'Academia', 'Infraestructura', 'IA', 'Portal', 'Propuesta', 'Comercial'];

const ESTADO_CONFIG: Record<string, { label: string; cls: string }> = {
  completado: { label: 'Completado', cls: 'bg-emerald-100 text-emerald-700' },
  'en progreso': { label: 'En progreso', cls: 'bg-blue-100 text-blue-700' },
  propuesta: { label: 'Propuesta', cls: 'bg-purple-100 text-purple-700' },
  'en negociación': { label: 'En negociación', cls: 'bg-amber-100 text-amber-700' },
};

export default function Bitacora() {
  const [org, setOrg] = useState('Todos');
  const [cat, setCat] = useState('Todos');
  const [search, setSearch] = useState('');

  const filtered = PROJECTS.filter(p => {
    if (org !== 'Todos' && p.org !== org) return false;
    if (cat !== 'Todos' && p.categoria !== cat) return false;
    if (search && !p.titulo.toLowerCase().includes(search.toLowerCase()) && !p.descripcion.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const completados = PROJECTS.filter(p => p.estado === 'completado').length;
  const enProgreso = PROJECTS.filter(p => p.estado === 'en progreso').length;
  const propuestas = PROJECTS.filter(p => p.estado === 'propuesta' || p.estado === 'en negociación').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Bitácora de trabajo</h1>
        <p className="text-sm text-gray-500 mt-1">José Miguel Macías Contreras · XCIEN & Next Ventures · 2026</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Completados', value: completados, color: '#1D9E75', bg: '#f0fdf4' },
          { label: 'En progreso', value: enProgreso, color: '#3B82F6', bg: '#eff6ff' },
          { label: 'Propuestas activas', value: propuestas, color: '#8B5CF6', bg: '#f5f3ff' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 bg-white" style={{ border: '0.5px solid #e5e7eb', background: s.bg }}>
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-xl bg-white outline-none"
          style={{ border: '0.5px solid #e5e7eb' }}
        />
        <div className="flex gap-1.5">
          {ORGS.map(o => (
            <button key={o} onClick={() => setOrg(o)}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-colors ${org === o ? 'text-white' : 'text-gray-500 bg-white hover:bg-gray-50'}`}
              style={org === o ? { background: '#1D9E75' } : { border: '0.5px solid #e5e7eb' }}>
              {o}
            </button>
          ))}
        </div>
        <select value={cat} onChange={e => setCat(e.target.value)}
          className="text-xs px-3 py-1.5 rounded-xl bg-white" style={{ border: '0.5px solid #e5e7eb' }}>
          {CATS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => {
          const Icon = p.icon;
          const estado = ESTADO_CONFIG[p.estado];
          return (
            <div key={p.id} className="rounded-2xl p-5 bg-white flex flex-col gap-3" style={{ border: '0.5px solid #e5e7eb' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${p.color}18` }}>
                  <Icon className="w-4.5 h-4.5" style={{ color: p.color }} size={18} />
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${estado.cls}`}>
                  {estado.label}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ background: p.org === 'XCIEN' ? '#1D9E75' : '#534AB7' }}>
                    {p.org}
                  </span>
                  <span className="text-[10px] text-gray-400">{p.fecha}</span>
                </div>
                <h3 className="text-sm font-semibold leading-snug">{p.titulo}</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed flex-1">{p.descripcion}</p>
              <div className="pt-2 border-t border-gray-50">
                <p className="text-[11px] text-gray-400"><span className="font-medium text-gray-600">Impacto:</span> {p.impacto}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {p.tags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{t}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          No hay proyectos que coincidan con los filtros.
        </div>
      )}
    </div>
  );
}
