import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import type { ThemeConfig } from '../types';

interface Props { theme: ThemeConfig }

// ─── Types ────────────────────────────────────────────────────────────────────

interface Fase {
  nombre: string;
  estado: string;
  pct: number;
  detalle: string;
}

interface Plaza {
  id: string;
  nombre: string;
  emoji: string;
  core: string;
  infra: string;
  proveedor: string;
  clientes: number;
  estado: string;
  color: string;
  fases: Fase[];
}

interface Compromiso {
  id: string;
  responsable: string;
  compromiso: string;
  plaza: string;
  prioridad: string;
  estado: string;
  nota: string;
}

interface HistorialEntry {
  ts: string;
  tipo?: string;
  comp_id?: string;
  responsable?: string;
  plaza_id?: string;
  fase_idx?: number;
  user_nombre?: string;
  user_email?: string;
  cambios: Record<string, { de: unknown; a: unknown }>;
}

interface FibraData {
  plazas: Plaza[];
  compromisos: Compromiso[];
  historial: HistorialEntry[];
}

// ─── Static data (no editable via API) ───────────────────────────────────────

const DECISIONES = [
  { tema: 'Tecnología', decision: 'CWDM Raisecom · 9 clientes/fibra · 1–10 Gbps' },
  { tema: 'Fibra', decision: 'Monomodo para distancias >300 m' },
  { tema: 'Segmento', decision: 'Solo empresarial — NO residencial' },
  { tema: 'Criterio on-net', decision: 'Hasta 1 km desde caja de empalme = on-net última milla' },
  { tema: 'Drop base', decision: 'Hasta 200 m incluido · >200 m o subterráneo: costo extra' },
  { tema: 'Contrato mínimo', decision: '36 meses · $50,000 MXN fondo instalación' },
  { tema: 'SKU Odoo', decision: 'Variante SIDF (de SIDP) · precios homologados a microonda' },
  { tema: 'Troncales Neutra', decision: 'Solo Monterrey — PN y SLT son red propia X100' },
  { tema: 'Cadencia reuniones', decision: 'Martes mediodía · hasta 75–80% avance' },
];

const RIESGOS = [
  { riesgo: 'Retraso convenio Neutral Networks', plaza: 'MTY', nivel: 'critico', mitigacion: 'Convenio firmado con fecha compromiso escrita' },
  { riesgo: 'Electrónica CWDM incompleta PN', plaza: 'PN', nivel: 'critico', mitigacion: 'Ingeniería debe entregar fecha exacta de cierre urgente' },
  { riesgo: 'Falta de RZ MTY y SLT', plaza: 'MTY/SLT', nivel: 'alta', mitigacion: 'Gustavo Cavazos entrega urgente' },
  { riesgo: 'Técnicos sin experiencia en fibra', plaza: 'Todas', nivel: 'alta', mitigacion: 'Pablo Capetillo: sesiones campo + proveedor acompaña' },
  { riesgo: 'Flujo Odoo SIDF no documentado', plaza: 'Todas', nivel: 'alta', mitigacion: 'Pedro + Samara documentan flujo SIDF' },
  { riesgo: 'OFFNET registra medio incorrecto', plaza: 'Todas', nivel: 'media', mitigacion: 'Anel Alcaraz actualiza a "fibra" y notifica' },
];

const SIDF_PASOS = [
  { paso: 1, accion: 'Crear variante SIDF a partir de SIDP en Odoo', responsable: 'Pedro Botello', estado: 'pendiente' },
  { paso: 2, accion: 'Definir estándar técnico (SLA, velocidades, kits)', responsable: 'Ingeniería + Pedro', estado: 'pendiente' },
  { paso: 3, accion: 'Documentar flujo entrega/activación en Odoo', responsable: 'Samara + Pedro', estado: 'pendiente' },
  { paso: 4, accion: 'Validar flujo (anteproyecto → instalación → activación)', responsable: 'Cecilia + Operaciones', estado: 'pendiente' },
  { paso: 5, accion: 'Capacitar equipo en nuevo flujo SIDF', responsable: 'Pedro / Oswaldo', estado: 'pendiente' },
];

// ─── Color maps ───────────────────────────────────────────────────────────────

const ESTADO_FASE: Record<string, { label: string; color: string }> = {
  completado: { label: 'Completado', color: '#00C896' },
  progreso:   { label: 'En progreso', color: '#FFB703' },
  bloqueado:  { label: 'Bloqueado', color: '#FF4757' },
  pendiente:  { label: 'Pendiente', color: '#6b7280' },
};

const PRIO_COLOR: Record<string, string> = {
  critica: '#FF4757', alta: '#FFB703', media: '#3B82F6', normal: '#6b7280',
};

const NIVEL_COLOR: Record<string, string> = {
  critico: '#FF4757', alta: '#FFB703', media: '#3B82F6',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function Card({ children, style, theme }: { children: React.ReactNode; style?: React.CSSProperties; theme: ThemeConfig }) {
  return (
    <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: '16px 20px', ...style }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: accent ?? '#00C896', marginBottom: 14 }}>
      {children}
    </h2>
  );
}

function ProgressBar({ pct, color, theme }: { pct: number; color: string; theme: ThemeConfig }) {
  return (
    <div style={{ background: theme.border, borderRadius: 6, height: 5, marginTop: 4, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color, borderRadius: 6, height: '100%', transition: 'width 0.4s ease' }} />
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block', width: 12, height: 12,
      border: '2px solid rgba(0,200,150,0.2)', borderTopColor: '#00C896',
      borderRadius: '50%', animation: 'spin 0.7s linear infinite',
      verticalAlign: 'middle',
    }} />
  );
}

// Inline-edit select for estado
function EstadoSelect({ value, onChange, options, color }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  color: string;
}) {
  return (
    <select
      autoFocus
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={e => onChange(e.target.value)}
      style={{
        background: color + '20', color, border: `1px solid ${color}55`,
        borderRadius: 6, padding: '2px 6px', fontSize: 11, fontWeight: 700,
        cursor: 'pointer', outline: 'none',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// Inline-edit text input
function InlineInput({ value, onSave, onCancel, style }: {
  value: string;
  onSave: (v: string) => void;
  onCancel: () => void;
  style?: React.CSSProperties;
}) {
  const [val, setVal] = useState(value);
  return (
    <input
      autoFocus
      value={val}
      onChange={e => setVal(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') onSave(val); if (e.key === 'Escape') onCancel(); }}
      onBlur={() => onSave(val)}
      style={{
        width: '100%', background: 'transparent', border: 'none',
        borderBottom: '1px solid #00C896', outline: 'none', fontSize: 12,
        color: 'inherit', padding: '2px 0',
        ...style,
      }}
    />
  );
}

function InlineNumber({ value, onSave, onCancel }: {
  value: number;
  onSave: (v: number) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(String(value));
  return (
    <input
      autoFocus
      type="number" min={0} max={100}
      value={val}
      onChange={e => setVal(e.target.value)}
      onKeyDown={e => { if (e.key === 'Enter') onSave(Number(val)); if (e.key === 'Escape') onCancel(); }}
      onBlur={() => onSave(Number(val))}
      style={{
        width: 56, background: 'transparent', border: 'none',
        borderBottom: '1px solid #00C896', outline: 'none', fontSize: 12,
        color: 'inherit', padding: '2px 4px', textAlign: 'right',
      }}
    />
  );
}

// Edit pencil icon shown on hover
const PencilIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

type Tab = 'plazas' | 'compromisos' | 'sidf' | 'riesgos' | 'decisiones' | 'historial';

const TABS: { id: Tab; label: string }[] = [
  { id: 'plazas',      label: '📍 Plazas' },
  { id: 'compromisos', label: '✅ Compromisos' },
  { id: 'sidf',        label: '🔁 Proceso SIDF' },
  { id: 'riesgos',     label: '⚠️ Riesgos' },
  { id: 'decisiones',  label: '📌 Decisiones' },
  { id: 'historial',   label: '🕐 Historial' },
];

// EditCell key: "comp:{id}:{field}" or "fase:{plaza_id}:{fase_idx}:{field}"
type EditKey = string;

export default function FibraSection({ theme }: Props) {
  const { user, authFetch } = useAuth();
  const [data, setData] = useState<FibraData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('plazas');
  const [plazaIdx, setPlazaIdx] = useState(0);
  const [editKey, setEditKey] = useState<EditKey | null>(null);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadData = useCallback(() => {
    authFetch('/api/fibra/data')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: FibraData) => setData(d))
      .catch(() => setLoadError('Error cargando datos de Fibra. Verifica tu sesión.'));
  }, [authFetch]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Permissions ────────────────────────────────────────────────────────────
  const isAdmin = user?.rol === 'admin' || user?.rol === 'director';
  const canEditComp = (comp: Compromiso) => {
    if (isAdmin) return true;
    const nombre = (user?.nombre ?? '').toLowerCase();
    return nombre && comp.responsable.toLowerCase().includes(nombre.split(' ')[0]);
  };

  // ── Save compromiso ────────────────────────────────────────────────────────
  const saveComp = useCallback(async (compId: string, patch: Partial<Compromiso>) => {
    setSaving(prev => new Set(prev).add(compId));
    setSaveError(null);
    try {
      const res = await authFetch(`/api/fibra/compromisos/${compId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Error ${res.status}`);
      }
      const { compromiso: updated } = await res.json();
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          compromisos: prev.compromisos.map(c => c.id === compId ? { ...c, ...updated } : c),
        };
      });
      // Reload historial silently
      authFetch('/api/fibra/historial')
        .then(r => r.ok ? r.json() : null)
        .then(h => h && setData(prev => prev ? { ...prev, historial: h.historial } : prev))
        .catch(() => {});
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(prev => { const n = new Set(prev); n.delete(compId); return n; });
      setEditKey(null);
    }
  }, [authFetch]);

  // ── Save fase ──────────────────────────────────────────────────────────────
  const saveFase = useCallback(async (plazaId: string, faseIdx: number, patch: Partial<Fase>) => {
    const key = `${plazaId}:${faseIdx}`;
    setSaving(prev => new Set(prev).add(key));
    setSaveError(null);
    try {
      const res = await authFetch(`/api/fibra/plazas/${plazaId}/fases/${faseIdx}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Error ${res.status}`);
      }
      const { fase: updated } = await res.json();
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          plazas: prev.plazas.map(p =>
            p.id !== plazaId ? p : {
              ...p,
              fases: p.fases.map((f, i) => i === faseIdx ? { ...f, ...updated } : f),
            }
          ),
        };
      });
      authFetch('/api/fibra/historial')
        .then(r => r.ok ? r.json() : null)
        .then(h => h && setData(prev => prev ? { ...prev, historial: h.historial } : prev))
        .catch(() => {});
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(prev => { const n = new Set(prev); n.delete(key); return n; });
      setEditKey(null);
    }
  }, [authFetch]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const startEdit = (key: EditKey) => { setSaveError(null); setEditKey(key); };
  const cancelEdit = () => setEditKey(null);

  const editableCell = (key: EditKey, canEdit: boolean, children: React.ReactNode) => {
    if (!canEdit) return <>{children}</>;
    return (
      <span
        onMouseEnter={() => setHoveredCell(key)}
        onMouseLeave={() => setHoveredCell(null)}
        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
        onClick={() => startEdit(key)}
      >
        {children}
        {hoveredCell === key && (
          <span style={{ color: '#00C896', opacity: 0.7 }}><PencilIcon /></span>
        )}
      </span>
    );
  };

  // ─── Loading / error states ─────────────────────────────────────────────────

  if (loadError) {
    return (
      <div style={{ padding: '40px 24px', color: '#FF4757', fontFamily: 'inherit' }}>
        <div style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 10, padding: '16px 20px' }}>
          ⚠️ {loadError}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '40px 24px', display: 'flex', alignItems: 'center', gap: 10, color: theme.dim, fontFamily: 'inherit' }}>
        <Spinner /> Cargando datos de Fibra X100…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ─── Derived ──────────────────────────────────────────────────────────────

  const { plazas, compromisos, historial } = data;
  const totalClientes = plazas.reduce((s, p) => s + p.clientes, 0);
  const pendientes = compromisos.filter(c => c.estado === 'pendiente').length;
  const criticos = RIESGOS.filter(r => r.nivel === 'critico').length;

  const compEstadoOptions = [
    { value: 'pendiente', label: '⏳ Pendiente' },
    { value: 'completado', label: '✓ Completado' },
    { value: 'en-progreso', label: '🔄 En progreso' },
    { value: 'bloqueado', label: '🔴 Bloqueado' },
  ];

  const faseEstadoOptions = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'progreso', label: 'En progreso' },
    { value: 'completado', label: 'Completado' },
    { value: 'bloqueado', label: 'Bloqueado' },
  ];

  const s: React.CSSProperties = { fontFamily: 'inherit', color: theme.text, padding: '20px 24px', maxWidth: 1100 };

  return (
    <div style={s}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 22 }}>🔆</span>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: theme.text }}>Fibra Óptica XCIEN · X100</h1>
          <span style={{ background: 'rgba(0,200,150,0.15)', color: '#00C896', border: '1px solid rgba(0,200,150,0.3)', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
            PROYECTO ACTIVO
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <p style={{ fontSize: 13, color: theme.dim }}>Reunión técnica 15 jul 2026 · 3 plazas · {compromisos.length} compromisos</p>
          {user && (
            <span style={{ fontSize: 11, color: '#00C896', background: 'rgba(0,200,150,0.1)', border: '1px solid rgba(0,200,150,0.2)', borderRadius: 12, padding: '1px 8px' }}>
              ✏️ {user.nombre} · {isAdmin ? 'Acceso total' : 'Edita tus compromisos'}
            </span>
          )}
        </div>
      </div>

      {/* Save error */}
      {saveError && (
        <div style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 8, padding: '8px 14px', marginBottom: 12, fontSize: 12, color: '#FF4757', display: 'flex', alignItems: 'center', gap: 8 }}>
          ⚠️ {saveError}
          <button onClick={() => setSaveError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF4757', marginLeft: 'auto', fontSize: 14 }}>✕</button>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Plazas activas', value: '3', sub: 'MTY · PN · SLT', color: '#00C896' },
          { label: 'Clientes activos', value: String(totalClientes), sub: '6 MTY · ~2 PN (piloto)', color: '#3B82F6' },
          { label: 'Compromisos pendientes', value: String(pendientes), sub: `de ${compromisos.length} totales`, color: '#FFB703' },
          { label: 'Riesgos críticos', value: String(criticos), sub: 'requieren atención urgente', color: '#FF4757' },
        ].map(k => (
          <Card key={k.label} theme={theme}>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.text, marginTop: 2 }}>{k.label}</div>
            <div style={{ fontSize: 11, color: theme.dim, marginTop: 2 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* Blocker banner */}
      <div style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>🔴</span>
        <div>
          <span style={{ fontWeight: 700, color: '#FF4757', fontSize: 13 }}>Blocker crítico PN — </span>
          <span style={{ fontSize: 13, color: theme.text }}>Electrónica CWDM incompleta · actualmente 1 hilo/cliente · Ingeniería debe entregar fecha exacta de cierre</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${theme.border}`, marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? 'rgba(0,200,150,0.12)' : 'transparent',
            border: 'none',
            borderBottom: tab === t.id ? '2px solid #00C896' : '2px solid transparent',
            borderRadius: '6px 6px 0 0',
            padding: '8px 14px',
            cursor: 'pointer',
            color: tab === t.id ? '#00C896' : theme.dim,
            fontSize: 13,
            fontWeight: tab === t.id ? 700 : 400,
            transition: 'all 0.15s',
            position: 'relative',
          }}>
            {t.label}
            {t.id === 'historial' && historial.length > 0 && (
              <span style={{ marginLeft: 5, background: '#00C896', color: '#000', fontSize: 9, fontWeight: 800, borderRadius: 10, padding: '1px 5px' }}>
                {historial.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Plazas ──────────────────────────────────────────────────────── */}
      {tab === 'plazas' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {plazas.map((p, i) => (
              <button key={p.id} onClick={() => setPlazaIdx(i)} style={{
                background: plazaIdx === i ? p.color + '22' : theme.card,
                border: `1px solid ${plazaIdx === i ? p.color + '60' : theme.border}`,
                borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
                color: plazaIdx === i ? p.color : theme.dim,
                fontSize: 13, fontWeight: plazaIdx === i ? 700 : 400,
                transition: 'all 0.15s',
              }}>
                {p.emoji} {p.nombre}
              </button>
            ))}
          </div>

          {(() => {
            const p = plazas[plazaIdx];
            if (!p) return null;
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Card theme={theme}>
                  <SectionTitle accent={p.color}>Arquitectura · {p.nombre}</SectionTitle>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <tbody>
                      {([
                        ['Core', p.core],
                        ['Infraestructura', p.infra],
                        ['Proveedor clave', p.proveedor],
                        ['Clientes activos', String(p.clientes)],
                        ['Estado', p.estado],
                      ] as [string, string][]).map(([k, v]) => (
                        <tr key={k} style={{ borderBottom: `1px solid ${theme.border}` }}>
                          <td style={{ padding: '7px 4px', color: theme.dim, fontWeight: 600, width: 140, fontSize: 12 }}>{k}</td>
                          <td style={{ padding: '7px 4px', color: theme.text }}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                <Card theme={theme}>
                  <SectionTitle accent={p.color}>Fases del Proyecto</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {p.fases.map((f, fi) => {
                      const cfg = ESTADO_FASE[f.estado] ?? { label: f.estado, color: '#6b7280' };
                      const faseKey = `fase:${p.id}:${fi}`;
                      const isSavingFase = saving.has(`${p.id}:${fi}`);

                      return (
                        <div key={f.nombre}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3, gap: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: theme.text, flex: 1 }}>{f.nombre}</span>
                            {isSavingFase ? (
                              <Spinner />
                            ) : isAdmin ? (
                              editKey === `${faseKey}:estado` ? (
                                <EstadoSelect
                                  value={f.estado}
                                  onChange={v => { if (v !== f.estado) saveFase(p.id, fi, { estado: v }); else cancelEdit(); }}
                                  options={faseEstadoOptions}
                                  color={cfg.color}
                                />
                              ) : (
                                editableCell(`${faseKey}:estado`, true,
                                  <span style={{ fontSize: 11, color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
                                )
                              )
                            ) : (
                              <span style={{ fontSize: 11, color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
                            )}
                          </div>

                          {/* Progress bar with editable pct */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1 }}>
                              <ProgressBar pct={f.pct} color={cfg.color} theme={theme} />
                            </div>
                            {isAdmin ? (
                              editKey === `${faseKey}:pct` ? (
                                <InlineNumber
                                  value={f.pct}
                                  onSave={v => saveFase(p.id, fi, { pct: v })}
                                  onCancel={cancelEdit}
                                />
                              ) : (
                                <span
                                  style={{ fontSize: 11, color: theme.dim, cursor: 'pointer', minWidth: 30, textAlign: 'right' }}
                                  onClick={() => startEdit(`${faseKey}:pct`)}
                                  title="Clic para editar"
                                >
                                  {f.pct}%
                                </span>
                              )
                            ) : (
                              <span style={{ fontSize: 11, color: theme.dim, minWidth: 30, textAlign: 'right' }}>{f.pct}%</span>
                            )}
                          </div>

                          {/* Detalle editable */}
                          {isAdmin && editKey === `${faseKey}:detalle` ? (
                            <InlineInput
                              value={f.detalle}
                              onSave={v => saveFase(p.id, fi, { detalle: v })}
                              onCancel={cancelEdit}
                              style={{ fontSize: 11, marginTop: 4 }}
                            />
                          ) : (
                            <div
                              style={{ fontSize: 11, color: theme.dim, marginTop: 4, cursor: isAdmin ? 'pointer' : 'default' }}
                              onClick={() => isAdmin && startEdit(`${faseKey}:detalle`)}
                              title={isAdmin ? 'Clic para editar' : undefined}
                            >
                              {f.detalle}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Tab: Compromisos ─────────────────────────────────────────────────── */}
      {tab === 'compromisos' && (
        <Card theme={theme} style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['#', 'Responsable', 'Compromiso', 'Plaza', 'Prioridad', 'Estado', 'Nota'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: theme.dim, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compromisos.map((c, i) => {
                  const canEdit = canEditComp(c);
                  const isSaving = saving.has(c.id);
                  const estadoColor = c.estado === 'completado' ? '#00C896' : c.estado === 'bloqueado' ? '#FF4757' : c.estado === 'en-progreso' ? '#3B82F6' : '#FFB703';
                  const estadoBg = estadoColor + '18';

                  return (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${theme.border}`, background: i % 2 === 0 ? theme.bg : 'transparent' }}>
                      <td style={{ padding: '9px 14px', color: theme.dim, fontSize: 11 }}>{i + 1}</td>
                      <td style={{ padding: '9px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>{c.responsable}</td>
                      <td style={{ padding: '9px 14px', color: theme.text }}>{c.compromiso}</td>
                      <td style={{ padding: '9px 14px', color: theme.dim, whiteSpace: 'nowrap', fontSize: 12 }}>{c.plaza}</td>
                      <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                        <span style={{ color: PRIO_COLOR[c.prioridad], fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {c.prioridad === 'critica' ? '🔴' : c.prioridad === 'alta' ? '🟠' : c.prioridad === 'media' ? '🔵' : '⚪'} {c.prioridad}
                        </span>
                      </td>
                      <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                        {isSaving ? <Spinner /> : canEdit && editKey === `comp:${c.id}:estado` ? (
                          <EstadoSelect
                            value={c.estado}
                            onChange={v => { if (v !== c.estado) saveComp(c.id, { estado: v }); else cancelEdit(); }}
                            options={compEstadoOptions}
                            color={estadoColor}
                          />
                        ) : (
                          editableCell(`comp:${c.id}:estado`, canEdit,
                            <span style={{
                              background: estadoBg, color: estadoColor,
                              border: `1px solid ${estadoColor}40`,
                              borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                            }}>
                              {c.estado === 'completado' ? '✓ Listo' : c.estado === 'en-progreso' ? '🔄 En progreso' : c.estado === 'bloqueado' ? '🔴 Bloqueado' : '⏳ Pendiente'}
                            </span>
                          )
                        )}
                      </td>
                      <td style={{ padding: '9px 14px', minWidth: 140 }}>
                        {canEdit && editKey === `comp:${c.id}:nota` ? (
                          <InlineInput
                            value={c.nota ?? ''}
                            onSave={v => saveComp(c.id, { nota: v })}
                            onCancel={cancelEdit}
                          />
                        ) : (
                          editableCell(`comp:${c.id}:nota`, canEdit,
                            <span style={{ fontSize: 12, color: c.nota ? theme.text : theme.dim, fontStyle: c.nota ? 'normal' : 'italic' }}>
                              {c.nota || (canEdit ? '+ agregar nota' : '—')}
                            </span>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!isAdmin && (
            <div style={{ padding: '10px 14px', borderTop: `1px solid ${theme.border}`, fontSize: 11, color: theme.dim }}>
              ℹ️ Puedes editar el estado y la nota de tus propios compromisos. Admin/Director pueden editar todos.
            </div>
          )}
        </Card>
      )}

      {/* ── Tab: Proceso SIDF ──────────────────────────────────────────────── */}
      {tab === 'sidf' && (
        <div>
          <Card theme={theme} style={{ marginBottom: 16 }}>
            <SectionTitle>Flujo SIDF — Internet Dedicado por Fibra Óptica</SectionTitle>
            <p style={{ fontSize: 13, color: theme.dim, marginBottom: 16 }}>
              El producto de fibra óptica se crea como variante de Internet Dedicado (SIDP), cambiando el sufijo a <strong style={{ color: '#00C896' }}>SIDF</strong>.
              Mismo precio homologado a microonda, diferente SLA y medio de transmisión.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SIDF_PASOS.map(p => (
                <div key={p.paso} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: p.estado === 'completado' ? 'rgba(0,200,150,0.2)' : 'rgba(255,183,3,0.12)',
                    border: `1px solid ${p.estado === 'completado' ? 'rgba(0,200,150,0.4)' : 'rgba(255,183,3,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800,
                    color: p.estado === 'completado' ? '#00C896' : '#FFB703',
                  }}>
                    {p.estado === 'completado' ? '✓' : p.paso}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{p.accion}</div>
                    <div style={{ fontSize: 12, color: theme.dim, marginTop: 2 }}>Responsable: {p.responsable}</div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: p.estado === 'completado' ? 'rgba(0,200,150,0.15)' : 'rgba(255,71,87,0.1)',
                    color: p.estado === 'completado' ? '#00C896' : '#FF4757',
                    border: `1px solid ${p.estado === 'completado' ? 'rgba(0,200,150,0.3)' : 'rgba(255,71,87,0.25)'}`,
                  }}>
                    {p.estado === 'completado' ? '✓ Listo' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card theme={theme}>
            <SectionTitle>Modelo Comercial</SectionTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['Concepto', 'Condición', 'Valor'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: theme.dim, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Fondo instalación', 'Contrato 36 meses', '$50,000 MXN'],
                  ['Drop base', 'Hasta 200 m', 'Incluido en el kit'],
                  ['Drop adicional', '>200 m o subterráneo', 'Costo extra (por definir)'],
                  ['SLA fibra propia', 'Tramos X100 (PN, SLT)', '99.5%–99.9%'],
                  ['SLA con Neutra', 'Tramos rentados (MTY)', '99.2%'],
                  ['Tiempo por sitio', 'Troncales disponibles', '2–4 semanas'],
                ].map(([c, cond, v], i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${theme.border}`, background: i % 2 === 0 ? theme.bg : 'transparent' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{c}</td>
                    <td style={{ padding: '8px 10px', color: theme.dim }}>{cond}</td>
                    <td style={{ padding: '8px 10px', color: '#00C896', fontWeight: 700 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ── Tab: Riesgos ─────────────────────────────────────────────────────── */}
      {tab === 'riesgos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {RIESGOS.map((r, i) => (
            <Card key={i} theme={theme} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '12px 16px' }}>
              <div style={{ width: 8, borderRadius: 4, flexShrink: 0, alignSelf: 'stretch', background: NIVEL_COLOR[r.nivel], minHeight: 40 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{r.riesgo}</span>
                  <span style={{ fontSize: 11, color: NIVEL_COLOR[r.nivel], fontWeight: 700, textTransform: 'uppercase', background: NIVEL_COLOR[r.nivel] + '18', padding: '2px 8px', borderRadius: 20, border: `1px solid ${NIVEL_COLOR[r.nivel]}40` }}>
                    {r.nivel}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: theme.dim }}>Plaza: <strong style={{ color: theme.text }}>{r.plaza}</strong> · Mitigación: {r.mitigacion}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Tab: Decisiones ──────────────────────────────────────────────────── */}
      {tab === 'decisiones' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {DECISIONES.map((d, i) => (
            <Card key={i} theme={theme} style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 18 }}>📌</span>
              <div>
                <div style={{ fontSize: 11, color: '#00C896', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{d.tema}</div>
                <div style={{ fontSize: 13, color: theme.text }}>{d.decision}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Tab: Historial ──────────────────────────────────────────────────── */}
      {tab === 'historial' && (
        <div>
          {historial.length === 0 ? (
            <Card theme={theme} style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <div style={{ color: theme.dim, fontSize: 13 }}>No hay cambios registrados aún.</div>
              <div style={{ color: theme.dim, fontSize: 12, marginTop: 4 }}>Edita un compromiso o fase para ver el historial aquí.</div>
            </Card>
          ) : (
            <Card theme={theme} style={{ padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                      {['Fecha / Hora', 'Usuario', 'Entidad', 'Cambios'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: theme.dim, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((h, i) => {
                      const fecha = new Date(h.ts + 'Z');
                      const fechaStr = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
                      const horaStr = fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

                      // Build entity description
                      let entidad = '—';
                      if (h.comp_id) {
                        const comp = compromisos.find(c => c.id === h.comp_id);
                        entidad = `📋 ${h.comp_id}${comp ? ` — ${comp.responsable}` : ''}`;
                      } else if (h.plaza_id !== undefined) {
                        const plaza = plazas.find(p => p.id === h.plaza_id);
                        entidad = `📍 ${plaza?.nombre ?? h.plaza_id} · F${(h.fase_idx ?? 0) + 1}`;
                      }

                      // Build changes description
                      const cambioLines = Object.entries(h.cambios ?? {}).map(([campo, { de, a }]) => (
                        <div key={campo} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 2 }}>
                          <span style={{ fontSize: 11, color: theme.dim, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{campo}:</span>
                          <span style={{ fontSize: 11, color: '#FF4757', background: 'rgba(255,71,87,0.1)', borderRadius: 4, padding: '0 4px' }}>{String(de ?? '—')}</span>
                          <span style={{ fontSize: 10, color: theme.dim }}>→</span>
                          <span style={{ fontSize: 11, color: '#00C896', background: 'rgba(0,200,150,0.1)', borderRadius: 4, padding: '0 4px' }}>{String(a ?? '—')}</span>
                        </div>
                      ));

                      return (
                        <tr key={i} style={{ borderBottom: `1px solid ${theme.border}`, background: i % 2 === 0 ? theme.bg : 'transparent' }}>
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{fechaStr}</div>
                            <div style={{ fontSize: 11, color: theme.dim }}>{horaStr} UTC</div>
                          </td>
                          <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#00C896' }}>{h.user_nombre ?? '—'}</div>
                            <div style={{ fontSize: 10, color: theme.dim }}>{h.user_email ?? ''}</div>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ fontSize: 12, color: theme.text }}>{entidad}</div>
                            {h.responsable && <div style={{ fontSize: 11, color: theme.dim }}>Resp: {h.responsable}</div>}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            {cambioLines.length > 0 ? cambioLines : <span style={{ color: theme.dim, fontSize: 11 }}>sin detalle</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      <div style={{ marginTop: 20, padding: '10px 14px', background: 'rgba(255,183,3,0.06)', border: '1px solid rgba(255,183,3,0.15)', borderRadius: 8, fontSize: 12, color: theme.dim }}>
        ⚠️ Próxima reunión: <strong style={{ color: '#FFB703' }}>martes mediodía</strong> · Cadencia semanal hasta 75–80% avance · Sesión 15 jul 2026 — 10 participantes · {compromisos.length} compromisos generados
      </div>
    </div>
  );
}
