import React, { useState } from 'react';
import { ThemeConfig } from '../types';
import { ClipboardCheck, MapPin, AlertTriangle, CheckCircle2, Clock, ChevronRight, FileText, Send, Car, Package, Layers } from 'lucide-react';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Area { id: number; nombre: string; icono: string; real: number; meta: number; }
interface Hallazgo { id: string; nivel: 'CRITICO' | 'ALTO' | 'MEDIO' | 'INFO'; titulo: string; descripcion: string; }
interface Correctivo { id: string; accion: string; responsable: string; estado: 'COMPLETADO' | 'PENDIENTE' | 'VERIFICAR'; }
interface Plaza {
  id: string; nombre: string; estado: 'activo' | 'proximo';
  ciudad: string; icon: string;
  periodo: string; semanaAuditoria: string;
  areas: Area[]; hallazgos: Hallazgo[]; correctivos: Correctivo[];
  rbs: string[]; tecnicos: string[]; vehiculos: string[];
}

// ── Datos PDN — Agosto 2026 ───────────────────────────────────────────────────
const PLAZAS: Plaza[] = [
  {
    id: 'pdn',
    nombre: 'Plaza PDN',
    ciudad: 'Piedras Negras / Cd. Acuña',
    icon: '🏙️',
    estado: 'activo',
    periodo: 'Agosto 2026',
    semanaAuditoria: '15–19 Sep 2026',
    rbs: ['RB PDN', 'RB SISPA', 'RB Telco', 'RB Apolo', 'RB Steren'],
    tecnicos: ['Guillermo Hernández (LW-207)', 'Alberto Espinoza (LW-204)', 'Alfonso Zendejo'],
    vehiculos: ['LW-207 · PX-7538-B', 'LW-204 · Estaquitas'],
    areas: [
      { id: 1, nombre: 'Inventario en la Plaza',       icono: '📦', real: 35, meta: 75 },
      { id: 2, nombre: 'Estado de Infraestructura (RBs)', icono: '📡', real: 40, meta: 80 },
      { id: 3, nombre: 'Vehículos y Herramienta',       icono: '🚗', real: 55, meta: 85 },
      { id: 4, nombre: 'Cumplimiento del Personal',     icono: '👤', real: 30, meta: 70 },
      { id: 5, nombre: 'Auditorías en Campo',           icono: '🔍', real: 50, meta: 75 },
    ],
    hallazgos: [
      { id: 'H01', nivel: 'CRITICO', titulo: 'Cerveza en vehículo operativo', descripcion: 'Cerveza Tecate dentro del LW-207 (Guillermo H.) en operación activa.' },
      { id: 'H02', nivel: 'CRITICO', titulo: 'Consumo de alcohol en plaza', descripcion: 'Múltiples evidencias de consumo en cochera/almacén — patrón habitual.' },
      { id: 'H03', nivel: 'ALTO',    titulo: 'Chapa arrancada vehículo Estaquitas', descripcion: 'LW-204 con daño en chapa sin reporte de siniestro a aseguradora.' },
      { id: 'H04', nivel: 'ALTO',    titulo: 'Sin resguardos ni control herramienta', descripcion: 'Equipo spare sin identificación; planta de emergencia bajo resguardo de Guillermo.' },
      { id: 'H05', nivel: 'ALTO',    titulo: 'Almacén y cochera con basura severa', descripcion: 'Desorden generalizado, basura acumulada — no cumple estándar 5S.' },
      { id: 'H06', nivel: 'ALTO',    titulo: 'Seguridad física comprometida RB Apolo', descripcion: 'Candado inadecuado, malla dañada, puerta con intento de apertura forzada.' },
      { id: 'H07', nivel: 'MEDIO',   titulo: 'Mantenimiento deficiente RB Apolo', descripcion: 'Corte de cables, maleza, cableado sin gestión.' },
      { id: 'H08', nivel: 'MEDIO',   titulo: 'Condiciones sanitarias inadecuadas', descripcion: 'Baño de oficina de plaza fuera de estándar de higiene.' },
      { id: 'H09', nivel: 'INFO',    titulo: 'Daños en imagen oficina PDN', descripcion: 'Lona quemada, vidrio roto, equipo sin funcionar.' },
      { id: 'H10', nivel: 'INFO',    titulo: 'Levantamiento fotográfico RBs', descripcion: '5 RBs documentadas: PDN, SISPA, Telco, Apolo. RB Steren pendiente sep.' },
      { id: 'H11', nivel: 'INFO',    titulo: 'RB Telco — verificar contrato', descripcion: 'Servicio de cortesía con baja densidad de servicios.' },
      { id: 'H12', nivel: 'INFO',    titulo: 'Trazabilidad Odoo comprometida', descripcion: 'Tickets registrados a nombre de Guillermo por falta de cuenta de Alberto.' },
      { id: 'H13', nivel: 'INFO',    titulo: 'Trabajos campo documentados', descripcion: 'Clientes Cd. Acuña, ROLCAR, Farmacia del Ahorro — 3 visitas.' },
    ],
    correctivos: [
      { id: 'C1',  accion: 'Procedimiento disciplinario Guillermo (LW-207)',        responsable: 'F. Alday', estado: 'PENDIENTE' },
      { id: 'C2',  accion: 'Alcoholimetría al personal de la plaza',                responsable: 'F. Alday', estado: 'PENDIENTE' },
      { id: 'C3',  accion: 'Retiro y reparación vehículo Estaquitas (chapa)',       responsable: 'F. Alday', estado: 'VERIFICAR' },
      { id: 'C4',  accion: 'Reemplazar candado RB Apolo',                           responsable: 'F. Alday', estado: 'PENDIENTE' },
      { id: 'C5',  accion: 'Recuperar planta de emergencia de Guillermo',           responsable: 'F. Alday', estado: 'PENDIENTE' },
      { id: 'C6',  accion: 'Gestión legal con Gobierno — contrato RB Apolo',        responsable: 'Dirección', estado: 'PENDIENTE' },
      { id: 'C7',  accion: 'Levantamiento inventario activos (spare + herramienta)',responsable: 'F. Alday', estado: 'PENDIENTE' },
      { id: 'C8',  accion: 'Crear cuenta Odoo para Alberto Espinoza',               responsable: 'TI',       estado: 'PENDIENTE' },
      { id: 'C9',  accion: 'Verificar contrato vigente con Telco',                  responsable: 'F. Alday', estado: 'VERIFICAR' },
      { id: 'C10', accion: 'Reparar vidrio, manija y puerta oficina PDN',           responsable: 'F. Alday', estado: 'PENDIENTE' },
      { id: 'C11', accion: 'Limpieza y reorganización almacén/cochera (5S)',        responsable: 'F. Alday', estado: 'PENDIENTE' },
      { id: 'C12', accion: 'Reparar malla perimetral RB Apolo',                     responsable: 'F. Alday', estado: 'PENDIENTE' },
    ],
  },
  { id: 'mty', nombre: 'Plaza MTY', ciudad: 'Monterrey', icon: '🏔️', estado: 'proximo', periodo: '—', semanaAuditoria: '—', rbs: [], tecnicos: [], vehiculos: [], areas: [], hallazgos: [], correctivos: [] },
  { id: 'slt', nombre: 'Plaza SLT', ciudad: 'Saltillo',  icon: '🌵', estado: 'proximo', periodo: '—', semanaAuditoria: '—', rbs: [], tecnicos: [], vehiculos: [], areas: [], hallazgos: [], correctivos: [] },
  { id: 'ags', nombre: 'Plaza AGS', ciudad: 'Aguascalientes', icon: '🌶️', estado: 'proximo', periodo: '—', semanaAuditoria: '—', rbs: [], tecnicos: [], vehiculos: [], areas: [], hallazgos: [], correctivos: [] },
];

// ── Colores nivel ─────────────────────────────────────────────────────────────
const NIVEL_COLOR: Record<string, string> = {
  CRITICO: '#dc2626', ALTO: '#d97706', MEDIO: '#2563eb', INFO: '#16a34a',
};
const NIVEL_BG: Record<string, string> = {
  CRITICO: '#fef2f2', ALTO: '#fffbeb', MEDIO: '#eff6ff', INFO: '#f0fdf4',
};
const ESTADO_COLOR: Record<string, string> = {
  COMPLETADO: '#16a34a', PENDIENTE: '#dc2626', VERIFICAR: '#d97706',
};

// ── Componente ────────────────────────────────────────────────────────────────
export default function AuditoriasPlazasSection({ theme }: { theme: ThemeConfig }) {
  const [plazaId, setPlazaId] = useState<string>('pdn');
  const [tab, setTab] = useState<'resumen' | 'hallazgos' | 'correctivos' | 'inventario' | 'documentos'>('resumen');

  const plaza = PLAZAS.find(p => p.id === plazaId)!;
  const avanceGlobal = plaza.areas.length
    ? Math.round(plaza.areas.reduce((s, a) => s + a.real, 0) / plaza.areas.length)
    : 0;
  const criticos  = plaza.hallazgos.filter(h => h.nivel === 'CRITICO').length;
  const altos     = plaza.hallazgos.filter(h => h.nivel === 'ALTO').length;
  const pendientes = plaza.correctivos.filter(c => c.estado === 'PENDIENTE').length;
  const completados = plaza.correctivos.filter(c => c.estado === 'COMPLETADO').length;

  const G = theme.text;
  const DIM = theme.dim;
  const CARD = theme.card;
  const BORDER = theme.border;
  const BG = theme.bg;

  // ── ProgressBar ──────────────────────────────────────────────────────────────
  const ProgressBar = ({ real, meta, height = 8 }: { real: number; meta: number; height?: number }) => (
    <div style={{ position: 'relative', background: BORDER, borderRadius: height, height, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${meta}%`, background: '#d1fae5', borderRadius: height }} />
      <div style={{
        position: 'absolute', left: 0, top: 0, height: '100%',
        width: `${real}%`, borderRadius: height,
        background: real >= meta ? '#16a34a' : real >= meta * 0.7 ? '#d97706' : '#dc2626',
        transition: 'width 0.4s ease',
      }} />
    </div>
  );

  // ── KPI card ─────────────────────────────────────────────────────────────────
  const KpiCard = ({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) => (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderTop: `3px solid ${color}`, borderRadius: 8, padding: '12px 16px', flex: 1, minWidth: 110 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 11, color: G, fontWeight: 600, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: DIM, marginTop: 1 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ padding: '20px 24px', width: '100%', boxSizing: 'border-box' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#1a4a2e', borderRadius: 10, padding: '8px 10px', display: 'flex' }}>
          <ClipboardCheck size={22} color="#c8a84b" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: G }}>Auditorías de Plazas</h2>
          <p style={{ margin: 0, fontSize: 12, color: DIM }}>
            Modelo PDN · Alcance Rodrigo Flores · 5 áreas · 3ª semana de cada mes
          </p>
        </div>
      </div>

      {/* ── Selector de plazas ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {PLAZAS.map(p => (
          <button
            key={p.id}
            onClick={() => { if (p.estado === 'activo') setPlazaId(p.id); }}
            style={{
              padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${plazaId === p.id ? '#2d7a4f' : BORDER}`,
              background: plazaId === p.id ? '#eef4ee' : CARD,
              color: p.estado === 'proximo' ? DIM : G,
              cursor: p.estado === 'proximo' ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
              opacity: p.estado === 'proximo' ? 0.55 : 1,
            }}
          >
            <span>{p.icon}</span>
            <span>{p.nombre}</span>
            {p.estado === 'proximo' && <span style={{ fontSize: 10, background: BORDER, padding: '1px 5px', borderRadius: 4 }}>Próx.</span>}
            {p.estado === 'activo' && plazaId === p.id && <span style={{ fontSize: 10, background: '#16a34a', color: '#fff', padding: '1px 5px', borderRadius: 4 }}>Activa</span>}
          </button>
        ))}
      </div>

      {/* ── Info plaza ── */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderLeft: '4px solid #1a4a2e', borderRadius: 8, padding: '12px 16px', marginBottom: 18, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div><div style={{ fontSize: 10, color: DIM, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Ciudad</div><div style={{ fontSize: 13, color: G, fontWeight: 600, marginTop: 2 }}><MapPin size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />{plaza.ciudad}</div></div>
        <div><div style={{ fontSize: 10, color: DIM, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Último período</div><div style={{ fontSize: 13, color: G, fontWeight: 600, marginTop: 2 }}>{plaza.periodo}</div></div>
        <div><div style={{ fontSize: 10, color: DIM, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Próxima auditoría</div><div style={{ fontSize: 13, color: '#d97706', fontWeight: 700, marginTop: 2 }}>{plaza.semanaAuditoria}</div></div>
        <div><div style={{ fontSize: 10, color: DIM, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Radiobases</div><div style={{ fontSize: 13, color: G, fontWeight: 600, marginTop: 2 }}>{plaza.rbs.length} RBs</div></div>
        <div><div style={{ fontSize: 10, color: DIM, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Personal</div><div style={{ fontSize: 13, color: G, fontWeight: 600, marginTop: 2 }}>{plaza.tecnicos.length} técnicos</div></div>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <KpiCard label="Avance Global" value={`${avanceGlobal}%`} color={avanceGlobal >= 60 ? '#16a34a' : '#d97706'} sub="Meta: ≥76% sep" />
        <KpiCard label="Críticos" value={criticos} color="#dc2626" sub="Requieren acción" />
        <KpiCard label="Altos" value={altos} color="#d97706" sub="Seguimiento" />
        <KpiCard label="Correctivos Pendientes" value={pendientes} color="#dc2626" sub={`${completados} completados`} />
        <KpiCard label="Hallazgos Totales" value={plaza.hallazgos.length} color="#2563eb" sub="Agosto 2026" />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: BG, borderRadius: 8, padding: 4, width: 'fit-content', border: `1px solid ${BORDER}` }}>
        {(['resumen', 'hallazgos', 'correctivos', 'inventario', 'documentos'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 16px', borderRadius: 6, border: 'none',
            background: tab === t ? '#1a4a2e' : 'transparent',
            color: tab === t ? '#fff' : DIM,
            fontWeight: tab === t ? 700 : 400, fontSize: 13, cursor: 'pointer',
            textTransform: 'capitalize',
          }}>
            {t === 'resumen' ? '📊 Resumen' : t === 'hallazgos' ? '⚠️ Hallazgos' : t === 'correctivos' ? '✅ Correctivos' : t === 'inventario' ? '📦 Inventario' : '📁 Documentos'}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB: RESUMEN — 5 áreas con progress bars
      ══════════════════════════════════════════════════════════════ */}
      {tab === 'resumen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {plaza.areas.map(area => (
            <div key={area.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{area.icono}</span>
                  <div>
                    <span style={{ fontSize: 10, color: DIM, fontWeight: 600 }}>ÁREA {area.id}</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: G }}>{area.nombre}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: area.real >= area.meta ? '#16a34a' : '#d97706', fontVariantNumeric: 'tabular-nums' }}>{area.real}%</span>
                  <div style={{ fontSize: 11, color: DIM }}>meta: {area.meta}%</div>
                </div>
              </div>
              <ProgressBar real={area.real} meta={area.meta} height={10} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                <span style={{ fontSize: 10, color: DIM }}>Ago 2026 (real)</span>
                <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>Meta Sep: {area.meta}%</span>
              </div>
            </div>
          ))}

          {/* Global */}
          <div style={{ background: '#1a4a2e', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: '#c8a84b', fontWeight: 700, letterSpacing: 1 }}>AVANCE GLOBAL</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Auditoría Plaza PDN — Agosto 2026</div>
              </div>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#c8a84b', fontVariantNumeric: 'tabular-nums' }}>{avanceGlobal}%</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, height: 12, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${avanceGlobal}%`, background: '#c8a84b', borderRadius: 10, transition: 'width 0.4s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Resultado agosto</span>
              <span style={{ fontSize: 11, color: '#c8a84b', fontWeight: 700 }}>Meta septiembre: ≥76%</span>
            </div>
          </div>

          {/* RBs y equipo */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, color: DIM, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>📡 Radiobases (5)</div>
              {plaza.rbs.map((rb, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: i < plaza.rbs.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: rb.includes('Steren') ? '#d97706' : '#16a34a', display: 'inline-block' }} />
                  <span style={{ fontSize: 12, color: G }}>{rb}</span>
                  {rb.includes('Steren') && <span style={{ fontSize: 9, background: '#fef3c7', color: '#d97706', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>NUEVO</span>}
                </div>
              ))}
            </div>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 18px', flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, color: DIM, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>👤 Personal de Plaza</div>
              {plaza.tecnicos.map((t, i) => (
                <div key={i} style={{ fontSize: 12, color: G, padding: '4px 0', borderBottom: i < plaza.tecnicos.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <ChevronRight size={11} style={{ verticalAlign: 'middle', color: DIM }} /> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: HALLAZGOS
      ══════════════════════════════════════════════════════════════ */}
      {tab === 'hallazgos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(['CRITICO', 'ALTO', 'MEDIO', 'INFO'] as const).map(nivel => {
            const grupo = plaza.hallazgos.filter(h => h.nivel === nivel);
            if (!grupo.length) return null;
            return (
              <div key={nivel}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, marginTop: 8 }}>
                  <span style={{ background: NIVEL_COLOR[nivel], color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, letterSpacing: 1 }}>{nivel}</span>
                  <span style={{ fontSize: 12, color: DIM }}>{grupo.length} hallazgo{grupo.length > 1 ? 's' : ''}</span>
                </div>
                {grupo.map(h => (
                  <div key={h.id} style={{
                    background: NIVEL_BG[h.nivel] || CARD,
                    border: `1px solid ${NIVEL_COLOR[h.nivel]}33`,
                    borderLeft: `4px solid ${NIVEL_COLOR[h.nivel]}`,
                    borderRadius: 8, padding: '12px 16px', marginBottom: 6,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 800, color: NIVEL_COLOR[h.nivel], marginRight: 8 }}>{h.id}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{h.titulo}</span>
                        <div style={{ fontSize: 12, color: '#444', marginTop: 3 }}>{h.descripcion}</div>
                      </div>
                      <AlertTriangle size={14} color={NIVEL_COLOR[h.nivel]} style={{ flexShrink: 0, marginTop: 2 }} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: CORRECTIVOS
      ══════════════════════════════════════════════════════════════ */}
      {tab === 'correctivos' && (
        <div>
          <div style={{ marginBottom: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(['PENDIENTE', 'VERIFICAR', 'COMPLETADO'] as const).map(e => {
              const n = plaza.correctivos.filter(c => c.estado === e).length;
              return (
                <div key={e} style={{ background: CARD, border: `1px solid ${BORDER}`, borderTop: `3px solid ${ESTADO_COLOR[e]}`, borderRadius: 8, padding: '8px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: ESTADO_COLOR[e] }}>{n}</span>
                  <span style={{ fontSize: 12, color: G }}>{e}</span>
                </div>
              );
            })}
          </div>

          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#1a4a2e', color: '#fff' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', width: 50 }}>ID</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left' }}>Acción Correctiva</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', width: 110 }}>Responsable</th>
                  <th style={{ padding: '10px 14px', textAlign: 'center', width: 110 }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {plaza.correctivos.map((c, i) => (
                  <tr key={c.id} style={{ background: i % 2 === 0 ? CARD : BG, borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1a4a2e' }}>{c.id}</td>
                    <td style={{ padding: '10px 14px', color: G }}>{c.accion}</td>
                    <td style={{ padding: '10px 14px', color: DIM }}>{c.responsable}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                      <span style={{
                        background: `${ESTADO_COLOR[c.estado]}22`,
                        color: ESTADO_COLOR[c.estado],
                        border: `1px solid ${ESTADO_COLOR[c.estado]}55`,
                        padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700,
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}>
                        {c.estado === 'COMPLETADO' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                        {c.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: INVENTARIO
      ══════════════════════════════════════════════════════════════ */}
      {tab === 'inventario' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* KPIs inventario */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <KpiCard label="Equipos Spare" value={79} color="#1a4a2e" sub="Agosto 2026" />
            <KpiCard label="Condición Buena" value="29 (37%)" color="#16a34a" sub="C5X, HAP LITE, RB2011" />
            <KpiCard label="Condición Regular" value="50 (63%)" color="#d97706" sub="C5C, RB951, A5C" />
            <KpiCard label="QC Pendiente" value="100%" color="#dc2626" sub="79/79 sin pruebas" />
          </div>

          {/* Tabla resumen por modelo */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ background: '#1a4a2e', color: '#fff', padding: '10px 16px', fontSize: 12, fontWeight: 700 }}>
              📦 Inventario Spare — Resumen por Modelo
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: BG }}>
                  <th style={{ padding: '8px 14px', textAlign: 'left', color: DIM, fontWeight: 700 }}>Modelo</th>
                  <th style={{ padding: '8px 14px', textAlign: 'left', color: DIM, fontWeight: 700 }}>Familia</th>
                  <th style={{ padding: '8px 14px', textAlign: 'center', color: DIM, fontWeight: 700 }}>Total</th>
                  <th style={{ padding: '8px 14px', textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>Buena</th>
                  <th style={{ padding: '8px 14px', textAlign: 'center', color: '#d97706', fontWeight: 700 }}>Regular</th>
                  <th style={{ padding: '8px 14px', textAlign: 'center', color: '#dc2626', fontWeight: 700 }}>QC</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { modelo: 'C5X',           familia: 'Ubiquiti CPE',    total: 20, b: 11, r: 9 },
                  { modelo: 'RB951UI2HND',   familia: 'MikroTik Router', total: 19, b: 9,  r: 10 },
                  { modelo: 'C5C',           familia: 'Ubiquiti CPE',    total: 16, b: 0,  r: 16 },
                  { modelo: 'HAP LITE',      familia: 'MikroTik AP',     total: 7,  b: 4,  r: 3 },
                  { modelo: 'A5C',           familia: 'Ubiquiti CPE',    total: 4,  b: 0,  r: 4 },
                  { modelo: 'HAP AC LITE',   familia: 'MikroTik AP',     total: 3,  b: 0,  r: 3 },
                  { modelo: 'RB2011UIAS2HND',familia: 'MikroTik Router', total: 3,  b: 2,  r: 1 },
                  { modelo: 'UTR211',        familia: 'Otro',            total: 3,  b: 2,  r: 1 },
                  { modelo: 'Otros',         familia: 'NETONIX / C050900 / AX10', total: 4, b: 1, r: 3 },
                ].map((row, i) => (
                  <tr key={row.modelo} style={{ background: i % 2 === 0 ? CARD : BG, borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 14px', fontWeight: 700, color: '#1a4a2e' }}>{row.modelo}</td>
                    <td style={{ padding: '8px 14px', color: DIM }}>{row.familia}</td>
                    <td style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 700, color: G }}>{row.total}</td>
                    <td style={{ padding: '8px 14px', textAlign: 'center', color: '#16a34a', fontWeight: 700 }}>{row.b}</td>
                    <td style={{ padding: '8px 14px', textAlign: 'center', color: '#d97706', fontWeight: 700 }}>{row.r}</td>
                    <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                      <span style={{ fontSize: 10, background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>✗ Pte.</span>
                    </td>
                  </tr>
                ))}
                <tr style={{ background: '#1a4a2e', color: '#fff', fontWeight: 700 }}>
                  <td style={{ padding: '8px 14px', color: '#c8a84b' }}>TOTAL</td>
                  <td style={{ padding: '8px 14px' }}>—</td>
                  <td style={{ padding: '8px 14px', textAlign: 'center', color: '#c8a84b' }}>79</td>
                  <td style={{ padding: '8px 14px', textAlign: 'center', color: '#6ee7b7' }}>29</td>
                  <td style={{ padding: '8px 14px', textAlign: 'center', color: '#fcd34d' }}>50</td>
                  <td style={{ padding: '8px 14px', textAlign: 'center', color: '#fca5a5' }}>79 SIN QC</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Hallazgos inventario */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ background: '#d97706', color: '#fff', padding: '10px 16px', fontSize: 12, fontWeight: 700 }}>
              ⚠️ Hallazgos del Inventario
            </div>
            {[
              { id: 'H-I01', nivel: 'ALTO',  titulo: 'QC sin completar — 79/79 (100%)', desc: 'Pruebas QC1–QC9 en blanco. Jornada QC programada semana 15-19 sep.' },
              { id: 'H-I02', nivel: 'MEDIO', titulo: 'Registro con cuenta Luminet', desc: 'Alfonso registró con @luminet.com.mx, no @xcien.com.mx. Solicitar cuenta XCIEN a TI.' },
              { id: 'H-I03', nivel: 'MEDIO', titulo: 'Sin categoría Dañado — probable sub-registro', desc: 'Verificar físicamente equipos "Regular" durante jornada QC.' },
              { id: 'H-I04', nivel: 'INFO',  titulo: 'Sin asignación de cliente ni estatus operativo', desc: 'Definir con F. Alday: spare activo vs. baja potencial.' },
            ].map((h, i) => (
              <div key={h.id} style={{ padding: '10px 16px', borderBottom: i < 3 ? `1px solid ${BORDER}` : 'none', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 800, fontSize: 11, color: NIVEL_COLOR[h.nivel], minWidth: 50 }}>{h.id}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: G }}>{h.titulo}</div>
                  <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>{h.desc}</div>
                </div>
                <span style={{ marginLeft: 'auto', flexShrink: 0, background: `${NIVEL_COLOR[h.nivel]}22`, color: NIVEL_COLOR[h.nivel], fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700, border: `1px solid ${NIVEL_COLOR[h.nivel]}44` }}>{h.nivel}</span>
              </div>
            ))}
          </div>

          {/* Link al PDF */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={16} color="#1a4a2e" />
            <span style={{ fontSize: 12, color: G }}>PDF completo enviado a Telegram:</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1a4a2e' }}>inventario-spare-pdn-ago2026-V1.pdf</span>
            <span style={{ fontSize: 11, color: DIM, marginLeft: 'auto' }}>msg_id: 1903</span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB: DOCUMENTOS — Reporte integral de la sesión
      ══════════════════════════════════════════════════════════════ */}
      {tab === 'documentos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ── Reporte integral header ── */}
          <div style={{ background: '#1a4a2e', borderRadius: 10, padding: '16px 20px', color: '#fff' }}>
            <div style={{ fontSize: 10, color: '#c8a84b', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>REPORTE INTEGRAL · PLAZA PDN</div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Auditoría Mensual — Agosto 2026</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
              Elaborado: José Miguel Macías Contreras · Next Ventures × XCIEN · 4–5 sep 2026
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
              {[['5 PDFs', 'Entregados vía Telegram'], ['13 Hallazgos', '2 críticos / 4 altos'], ['12 Correctivos', '10 pendientes'], ['79 Equipos', 'QC 0% (jornada sep)']].map(([v, l]) => (
                <div key={v}><div style={{ fontSize: 18, fontWeight: 800, color: '#c8a84b' }}>{v}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{l}</div></div>
              ))}
            </div>
          </div>

          {/* ── PDFs generados ── */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ background: '#f0fdf4', borderBottom: `1px solid ${BORDER}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Send size={14} color="#16a34a" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>PDFs entregados a Telegram @jmmc2026_bot</span>
            </div>
            {[
              { archivo: 'reporte-auditoria-pdn-ago2026-V4C5.pdf', desc: 'Reporte final completo con ~50 fotos de evidencia', peso: '11.6 MB', msg: '1901', icono: '📋', estado: 'FINAL' },
              { archivo: 'plan-auditoria-pdn-sep2026-v4.pdf',       desc: 'Plan auditoría sep 2026 con grado de avance visual (5 RBs + Steren)', peso: '~53 KB', msg: '1902', icono: '📅', estado: 'ENTREGADO' },
              { archivo: 'checklist-campo-pdn-sep2026-v1.pdf',      desc: 'Checklist de campo: 5 áreas × 5 RBs, mediciones eléctricas, 3 técnicos', peso: '~53 KB', msg: '1902', icono: '✅', estado: 'ENTREGADO' },
              { archivo: 'inventario-spare-pdn-ago2026-V1.pdf',     desc: 'Inventario 79 equipos spare: KPIs, tabla modelos, 4 hallazgos QC', peso: '~41 KB', msg: '1903', icono: '📦', estado: 'ENTREGADO' },
              { archivo: 'reporte-flotilla-pdn-ago2026-xcien.pdf',  desc: 'Análisis TN360: LW-207 (Guillermo) y LW-204 (Alberto) agosto 2026', peso: '—',      msg: 'local', icono: '🚗', estado: 'LOCAL' },
            ].map((d, i) => (
              <div key={d.archivo} style={{ padding: '12px 16px', borderBottom: i < 4 ? `1px solid ${BORDER}` : 'none', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{d.icono}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: G, fontFamily: 'monospace' }}>{d.archivo}</div>
                  <div style={{ fontSize: 11, color: DIM, marginTop: 2 }}>{d.desc}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: DIM }}>📎 {d.peso}</span>
                    {d.msg !== 'local' && <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 700 }}>✓ Telegram msg_id: {d.msg}</span>}
                  </div>
                </div>
                <span style={{
                  fontSize: 10, padding: '2px 7px', borderRadius: 5, fontWeight: 700, flexShrink: 0,
                  background: d.estado === 'FINAL' ? '#1a4a2e' : d.estado === 'ENTREGADO' ? '#dcfce7' : '#f1f5f9',
                  color: d.estado === 'FINAL' ? '#c8a84b' : d.estado === 'ENTREGADO' ? '#16a34a' : '#64748b',
                }}>{d.estado}</span>
              </div>
            ))}
          </div>

          {/* ── Flotilla — resumen ── */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ background: '#fffbeb', borderBottom: `1px solid ${BORDER}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Car size={14} color="#d97706" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>Flotilla — Análisis TN360 Agosto 2026</span>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ background: BG }}>
                  {['Vehículo', 'Técnico', 'Viajes', 'Km total', 'Fuera horario', 'Madrugada', 'Anomalía clave'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: DIM, fontWeight: 700, fontSize: 11 }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  <tr style={{ background: '#fef2f2', borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: '#dc2626' }}>LW-207</td>
                    <td style={{ padding: '8px 10px', color: G }}>Guillermo Hernández</td>
                    <td style={{ padding: '8px 10px', color: G }}>456</td>
                    <td style={{ padding: '8px 10px', color: G }}>6,492 km</td>
                    <td style={{ padding: '8px 10px', color: '#d97706', fontWeight: 700 }}>56.1%</td>
                    <td style={{ padding: '8px 10px', color: '#dc2626', fontWeight: 700 }}>17 viajes</td>
                    <td style={{ padding: '8px 10px' }}><span style={{ background: '#fee2e2', color: '#dc2626', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>845 km lun 31 ago</span></td>
                  </tr>
                  <tr style={{ background: CARD }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: DIM }}>LW-204</td>
                    <td style={{ padding: '8px 10px', color: G }}>Alberto Espinoza</td>
                    <td style={{ padding: '8px 10px', color: G }}>101</td>
                    <td style={{ padding: '8px 10px', color: G }}>571 km</td>
                    <td style={{ padding: '8px 10px', color: '#d97706', fontWeight: 700 }}>64.4%</td>
                    <td style={{ padding: '8px 10px', color: G }}>0</td>
                    <td style={{ padding: '8px 10px' }}><span style={{ background: '#f1f5f9', color: '#64748b', fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>Sin actividad sem. 35</span></td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: 10, fontSize: 11, color: '#dc2626', background: '#fef2f2', padding: '8px 12px', borderRadius: 6, display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                <span><strong>Hallazgo crítico:</strong> 17 viajes en madrugada (0–5h) LW-207 refuerzan H01/H02 (alcohol en unidad). Lunes 31 ago: 845 km en un día — actividad extremadamente anómala, requiere contraste vs. Odoo Field Service.</span>
              </div>
            </div>
          </div>

          {/* ── Inventario — resumen ejecutivo ── */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ background: '#eff6ff', borderBottom: `1px solid ${BORDER}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={14} color="#2563eb" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}>Inventario Spare — 79 equipos · Agosto 2026</span>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                {[
                  { v: '40 (51%)', l: 'Ubiquiti CPE', c: '#2563eb' },
                  { v: '22 (28%)', l: 'MikroTik Routers', c: '#7c3aed' },
                  { v: '10 (13%)', l: 'MikroTik APs', c: '#0891b2' },
                  { v: '7 (8%)',   l: 'Otros', c: '#64748b' },
                ].map(({ v, l, c }) => (
                  <div key={l} style={{ background: BG, border: `1px solid ${BORDER}`, borderTop: `3px solid ${c}`, borderRadius: 8, padding: '8px 14px', flex: 1, minWidth: 120 }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: c }}>{v}</div>
                    <div style={{ fontSize: 11, color: DIM }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '6px 12px', fontSize: 11, color: '#16a34a', fontWeight: 700 }}>
                  ✓ 29 (37%) condición Buena — C5X, HAP LITE, RB2011
                </div>
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '6px 12px', fontSize: 11, color: '#d97706', fontWeight: 700 }}>
                  ⚠ 50 (63%) condición Regular — C5C, RB951, A5C, HAP AC
                </div>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '6px 12px', fontSize: 11, color: '#dc2626', fontWeight: 700 }}>
                  ✗ QC 0% — 79/79 sin pruebas QC1–QC9 · Jornada sep 15–19
                </div>
              </div>
            </div>
          </div>

          {/* ── Checklist sep ── */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ background: '#f0fdf4', borderBottom: `1px solid ${BORDER}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={14} color="#16a34a" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>Checklist Auditoría Campo — Sep 15–19, 2026</span>
            </div>
            <div style={{ padding: '12px 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                {[
                  { area: '1. Inventario', items: ['79 equipos QC1–QC9', 'Fotos almacén organizado', 'Excel actualizado'], meta: '75%' },
                  { area: '2. Infraestructura (RBs)', items: ['5 RBs visitadas incl. Steren', 'Mediciones AC/DC + baterías', 'Fotos exterior/gabinete'], meta: '80%' },
                  { area: '3. Vehículos', items: ['LW-207 alcoholimetría', 'LW-204 chapa reparada', 'Herramienta inventariada'], meta: '85%' },
                  { area: '4. Personal', items: ['Disciplinaria Guillermo', 'Uniformes / Puntualidad', 'Eval. Alfonso (aux→TC)'], meta: '70%' },
                  { area: '5. Campo', items: ['3 visitas con técnicos', 'Criterios 1–5 evaluados', 'Reporte por área'], meta: '75%' },
                ].map(a => (
                  <div key={a.area} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: '#1a4a2e', marginBottom: 6 }}>{a.area}</div>
                    {a.items.map(item => (
                      <div key={item} style={{ fontSize: 10, color: G, display: 'flex', gap: 5, marginBottom: 2 }}>
                        <span style={{ color: BORDER, flexShrink: 0 }}>☐</span>{item}
                      </div>
                    ))}
                    <div style={{ marginTop: 6, fontSize: 10, color: '#16a34a', fontWeight: 700 }}>Meta: {a.meta}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Línea de tiempo sesión ── */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: G, marginBottom: 10 }}>📅 Línea de tiempo — Trabajo de auditoría PDN</div>
            {[
              { fecha: 'Ago 2026',      accion: 'Auditoría en campo — semana 3', por: 'F. Alday + equipo PDN' },
              { fecha: '4 sep 2026',    accion: 'Sesión análisis: hallazgos, flotilla TN360, inventario 79 equipos', por: 'JM + Claude Code' },
              { fecha: '4 sep 2026',    accion: 'V4C5 FINAL entregado (11.6 MB, ~50 fotos)', por: 'Telegram ✓' },
              { fecha: '5 sep 2026',    accion: 'Alcance Rodrigo Flores procesado — 5 RBs + QC + grado avance', por: 'JM + Claude Code' },
              { fecha: '5 sep 2026',    accion: 'Inventario 79 equipos analizado — 4 hallazgos, PDF Telegram', por: 'Telegram msg 1903 ✓' },
              { fecha: '5 sep 2026',    accion: 'Checklist campo sep + plan auditoría generados', por: 'Telegram msg 1902 ✓' },
              { fecha: '5 sep 2026',    accion: 'Vault XCIEN-Vault limpiado — contenido personal movido a JMMC/NextVentures', por: 'git commit 2d95b54' },
              { fecha: 'Sep 15–19 2026',accion: 'Próxima auditoría campo — meta ≥76% global', por: 'F. Alday + JM supervisor' },
            ].map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, paddingBottom: 8, borderBottom: i < 7 ? `1px solid ${BORDER}` : 'none', marginBottom: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#1a4a2e', minWidth: 110, flexShrink: 0 }}>{e.fecha}</span>
                <span style={{ fontSize: 11, color: G, flex: 1 }}>{e.accion}</span>
                <span style={{ fontSize: 10, color: DIM, minWidth: 130, textAlign: 'right' }}>{e.por}</span>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ marginTop: 20, padding: '10px 0', borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: DIM }}>
        <span>📋 Alcance: Rodrigo Flores · Director Operaciones XCIEN · 10 jul 2026</span>
        <span>Plaza PDN como modelo base · Expandir a MTY · SLT · AGS</span>
      </div>
    </div>
  );
}
