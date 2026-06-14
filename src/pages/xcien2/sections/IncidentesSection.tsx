/**
 * IncidentesSection — Gestor de Incidentes de Red
 * P1/P2/P3 con timeline, estados, post-mortem y alerta Telegram automática.
 */
import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../../config';
import { useAuth } from '@/contexts/AuthContext';
import type { ThemeConfig } from '../types';

interface Props { theme: ThemeConfig }

const GREEN  = '#00C896';
const DIM    = '#6b7280';
const RED    = '#FF4757';
const ORANGE = '#FF6B35';
const YELLOW = '#FFB703';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface TimelineEntry {
  ts: string;
  autor: string;
  texto: string;
  tipo: 'declaracion' | 'estado' | 'update' | 'accion' | 'resolucion';
}

interface Incidente {
  id: string;
  titulo: string;
  severidad: 'P1' | 'P2' | 'P3';
  tipo: string;
  descripcion: string;
  plazas: string[];
  responsable: string;
  etr_min: number;
  estado: 'declarado' | 'en_atencion' | 'mitigado' | 'resuelto';
  fecha_inicio: string;
  fecha_resolucion: string | null;
  declarado_por: string;
  timeline: TimelineEntry[];
  postmortem: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const SEV: Record<string, { color: string; bg: string; label: string; emoji: string }> = {
  P1: { color: RED,    bg: 'rgba(255,71,87,0.12)',    label: 'P1 Crítico',  emoji: '🔴' },
  P2: { color: ORANGE, bg: 'rgba(255,107,53,0.12)',   label: 'P2 Alto',     emoji: '🟠' },
  P3: { color: YELLOW, bg: 'rgba(255,183,3,0.12)',    label: 'P3 Medio',    emoji: '🟡' },
};

const ESTADO: Record<string, { label: string; color: string; emoji: string }> = {
  declarado:   { label: 'Declarado',    color: RED,    emoji: '🚨' },
  en_atencion: { label: 'En Atención',  color: ORANGE, emoji: '🔧' },
  mitigado:    { label: 'Mitigado',     color: YELLOW, emoji: '🛡️' },
  resuelto:    { label: 'Resuelto',     color: GREEN,  emoji: '✅' },
};

const TIPO_OPTS = [
  { value: 'outage',        label: '📴 Corte total' },
  { value: 'degradacion',   label: '⚠️ Degradación' },
  { value: 'seguridad',     label: '🔐 Seguridad' },
  { value: 'mantenimiento', label: '🔧 Mantenimiento' },
  { value: 'otro',          label: '📋 Otro' },
];

const TIPO_LABEL: Record<string, string> = Object.fromEntries(TIPO_OPTS.map(t => [t.value, t.label]));

const PLAZAS_OPTS = [
  'Monterrey', 'CDMX', 'Guadalajara', 'Torreón', 'Saltillo',
  'San Luis Potosí', 'Puebla', 'León', 'Querétaro', 'Chihuahua',
];

function formatDuration(start: string, end: string | null): string {
  const from = new Date(start).getTime();
  const to   = end ? new Date(end).getTime() : Date.now();
  const mins = Math.round((to - from) / 60000);
  if (mins < 60)  return `${mins}min`;
  if (mins < 1440) return `${Math.floor(mins/60)}h ${mins%60}min`;
  return `${Math.floor(mins/1440)}d ${Math.floor((mins%1440)/60)}h`;
}

function fmtTs(ts: string): string {
  return new Date(ts).toLocaleString('es-MX', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ENTRY_COLOR: Record<string, string> = {
  declaracion: RED, estado: '#4FC3F7', update: DIM, accion: ORANGE, resolucion: GREEN,
};

// ── Componentes pequeños ──────────────────────────────────────────────────────
function SevBadge({ sev }: { sev: string }) {
  const s = SEV[sev] ?? SEV.P3;
  return (
    <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 9px', borderRadius: 20, background: s.bg, color: s.color, border: `1px solid ${s.color}30`, whiteSpace: 'nowrap' }}>
      {s.emoji} {s.label}
    </span>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const e = ESTADO[estado] ?? ESTADO.declarado;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20, background: `${e.color}12`, color: e.color, border: `1px solid ${e.color}25`, whiteSpace: 'nowrap' }}>
      {e.emoji} {e.label}
    </span>
  );
}

// ── Modal: Nuevo Incidente ────────────────────────────────────────────────────
function ModalNuevo({ onClose, onCreado }: { onClose: () => void; onCreado: (inc: Incidente) => void }) {
  const [form, setForm] = useState({
    titulo: '', severidad: 'P1', tipo: 'outage', descripcion: '',
    plazas: [] as string[], responsable: '', etr_min: 60,
  });
  const [saving, setSaving] = useState(false);

  const toggle = (p: string) =>
    setForm(f => ({ ...f, plazas: f.plazas.includes(p) ? f.plazas.filter(x => x !== p) : [...f.plazas, p] }));

  const submit = async () => {
    if (!form.titulo.trim()) return;
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/api/incidentes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('xcien_token')}` },
        body: JSON.stringify(form),
      });
      if (r.ok) {
        const inc = await r.json();
        onCreado(inc);
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box' as const,
    background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, padding: '10px 14px', color: '#f3f4f6', fontSize: 13, outline: 'none',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f9fafb' }}>🚨 Declarar Incidente</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: DIM, fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Severidad */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Severidad</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['P1', 'P2', 'P3'] as const).map(s => {
                const sv = SEV[s];
                const sel = form.severidad === s;
                return (
                  <button key={s} onClick={() => setForm(f => ({ ...f, severidad: s }))}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1.5px solid ${sel ? sv.color : 'rgba(255,255,255,0.08)'}`, background: sel ? sv.bg : 'transparent', color: sel ? sv.color : DIM, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                    {sv.emoji} {sv.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Título */}
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Título del incidente *</p>
            <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Ej: Corte de fibra en nodo Apodaca NL..."
              style={inputStyle} />
          </div>

          {/* Tipo + ETR */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Tipo</p>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={{ ...inputStyle }}>
                {TIPO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.07em' }}>ETR (min)</p>
              <input type="number" min={0} value={form.etr_min} onChange={e => setForm(f => ({ ...f, etr_min: +e.target.value }))} style={inputStyle} />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Descripción</p>
            <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              rows={3} placeholder="Síntomas, primera hipótesis de causa raíz..."
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          {/* Plazas */}
          <div>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Plazas afectadas</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PLAZAS_OPTS.map(p => {
                const sel = form.plazas.includes(p);
                return (
                  <button key={p} onClick={() => toggle(p)}
                    style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${sel ? GREEN : 'rgba(255,255,255,0.1)'}`, background: sel ? `${GREEN}15` : 'transparent', color: sel ? GREEN : DIM, fontSize: 12, cursor: 'pointer', fontWeight: sel ? 700 : 400 }}>
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Responsable */}
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Técnico responsable</p>
            <input value={form.responsable} onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))}
              placeholder="Nombre del técnico líder..."
              style={inputStyle} />
          </div>

          {/* P1 warning */}
          {form.severidad === 'P1' && (
            <div style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.25)', borderRadius: 10, padding: '10px 14px' }}>
              <p style={{ margin: 0, fontSize: 12, color: RED }}>🔴 Incidente P1 — se enviará alerta automática a Telegram al declarar.</p>
            </div>
          )}

          <button onClick={submit} disabled={saving || !form.titulo.trim()}
            style={{ padding: '12px', borderRadius: 12, background: RED, color: '#fff', fontSize: 14, fontWeight: 800, cursor: saving || !form.titulo.trim() ? 'not-allowed' : 'pointer', opacity: saving || !form.titulo.trim() ? 0.6 : 1, border: 'none' }}>
            {saving ? 'Declarando…' : '🚨 Declarar Incidente'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Panel detalle de incidente ────────────────────────────────────────────────
function DetallePanel({ inc, onClose, onRefresh }: { inc: Incidente; onClose: () => void; onRefresh: () => void }) {
  const [updateText, setUpdateText] = useState('');
  const [postmortem, setPostmortem] = useState(inc.postmortem || '');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const cambiarEstado = async (estado: string) => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/incidentes/${inc.id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('xcien_token')}` },
        body: JSON.stringify({ estado }),
      });
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const agregarUpdate = async () => {
    if (!updateText.trim()) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/incidentes/${inc.id}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('xcien_token')}` },
        body: JSON.stringify({ texto: updateText, tipo: 'update' }),
      });
      setUpdateText('');
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const guardarPostmortem = async () => {
    setSaving(true);
    try {
      await fetch(`${API_BASE}/api/incidentes/${inc.id}/postmortem`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('xcien_token')}` },
        body: JSON.stringify({ postmortem }),
      });
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const sev = SEV[inc.severidad] ?? SEV.P3;

  // Próximos estados posibles
  const NEXT_ESTADOS: Record<string, string[]> = {
    declarado:   ['en_atencion'],
    en_atencion: ['mitigado', 'resuelto'],
    mitigado:    ['resuelto'],
    resuelto:    [],
  };
  const nextStates = NEXT_ESTADOS[inc.estado] ?? [];

  return (
    <div style={{
      position: 'fixed', right: 0, top: 0, bottom: 0, width: 520,
      background: '#111827', borderLeft: '1px solid rgba(255,255,255,0.08)',
      zIndex: 500, display: 'flex', flexDirection: 'column', overflowY: 'hidden',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, background: `${sev.color}08` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
              <SevBadge sev={inc.severidad} />
              <EstadoBadge estado={inc.estado} />
              <span style={{ fontSize: 11, color: DIM }}>{inc.id}</span>
            </div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#f9fafb', lineHeight: 1.3 }}>{inc.titulo}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: DIM, fontSize: 20, cursor: 'pointer', flexShrink: 0, marginLeft: 8 }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: DIM }}>⏱ Duración: <b style={{ color: inc.estado === 'resuelto' ? GREEN : sev.color }}>{formatDuration(inc.fecha_inicio, inc.fecha_resolucion)}</b></span>
          {inc.etr_min > 0 && <span style={{ fontSize: 11, color: DIM }}>ETR: <b style={{ color: '#f3f4f6' }}>{inc.etr_min}min</b></span>}
          {inc.responsable && <span style={{ fontSize: 11, color: DIM }}>👤 <b style={{ color: '#f3f4f6' }}>{inc.responsable}</b></span>}
          {inc.plazas.length > 0 && <span style={{ fontSize: 11, color: DIM }}>📍 {inc.plazas.join(', ')}</span>}
        </div>
        {inc.descripcion && <p style={{ margin: '10px 0 0', fontSize: 12, color: DIM, lineHeight: 1.5 }}>{inc.descripcion}</p>}
      </div>

      {/* Acciones de estado */}
      {nextStates.length > 0 && (
        <div style={{ padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8, flexShrink: 0 }}>
          {nextStates.map(e => {
            const est = ESTADO[e];
            return (
              <button key={e} onClick={() => cambiarEstado(e)} disabled={saving}
                style={{ padding: '8px 16px', borderRadius: 10, background: `${est.color}12`, border: `1px solid ${est.color}30`, color: est.color, fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {est.emoji} Mover a {est.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Timeline */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#f3f4f6' }}>Timeline</p>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[...inc.timeline].reverse().map((e, i) => {
              const c = ENTRY_COLOR[e.tipo] ?? DIM;
              return (
                <div key={i} style={{ display: 'flex', gap: 14, position: 'relative' }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: `${c}20`, border: `2px solid ${c}`, flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: c }}>{e.autor}</span>
                      <span style={{ fontSize: 10, color: DIM }}>{fmtTs(e.ts)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#d1d5db', lineHeight: 1.5 }}>{e.texto}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Agregar update */}
        {inc.estado !== 'resuelto' && (
          <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
            <input value={updateText} onChange={e => setUpdateText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregarUpdate()}
              placeholder="Agregar actualización al timeline…"
              style={{ flex: 1, background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '9px 14px', color: '#f3f4f6', fontSize: 12, outline: 'none' }}
            />
            <button onClick={agregarUpdate} disabled={!updateText.trim() || saving}
              style={{ padding: '9px 16px', borderRadius: 10, background: `${GREEN}15`, border: `1px solid ${GREEN}30`, color: GREEN, fontSize: 12, fontWeight: 700, cursor: !updateText.trim() || saving ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
              ＋
            </button>
          </div>
        )}

        {/* Post-mortem (solo si resuelto) */}
        {inc.estado === 'resuelto' && (
          <div style={{ marginTop: 20, background: 'rgba(0,200,150,0.04)', border: '1px solid rgba(0,200,150,0.12)', borderRadius: 12, padding: 16 }}>
            <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: GREEN }}>📋 Post-mortem</p>
            <textarea value={postmortem} onChange={e => setPostmortem(e.target.value)}
              rows={4} placeholder="Causa raíz, acciones tomadas, prevención futura…"
              style={{ width: '100%', boxSizing: 'border-box', background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', color: '#f3f4f6', fontSize: 12, resize: 'vertical', fontFamily: 'inherit', outline: 'none' }}
            />
            <button onClick={guardarPostmortem} disabled={saving}
              style={{ marginTop: 8, padding: '7px 16px', borderRadius: 8, background: `${GREEN}15`, border: `1px solid ${GREEN}30`, color: GREEN, fontSize: 12, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
              Guardar Post-mortem
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── IncidenteCard ─────────────────────────────────────────────────────────────
function IncidenteCard({ inc, onClick }: { inc: Incidente; onClick: () => void }) {
  const sev = SEV[inc.severidad] ?? SEV.P3;
  const est = ESTADO[inc.estado] ?? ESTADO.declarado;
  return (
    <div
      onClick={onClick}
      style={{
        background: '#111827', border: `1px solid ${inc.estado === 'resuelto' ? 'rgba(255,255,255,0.06)' : `${sev.color}25`}`,
        borderRadius: 14, padding: '18px 20px', cursor: 'pointer', transition: 'all 0.18s',
        opacity: inc.estado === 'resuelto' ? 0.65 : 1,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 24px ${sev.color}15`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <SevBadge sev={inc.severidad} />
          <EstadoBadge estado={inc.estado} />
        </div>
        <span style={{ fontSize: 10, color: DIM, flexShrink: 0, marginLeft: 8 }}>{inc.id}</span>
      </div>
      <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#f3f4f6', lineHeight: 1.4 }}>{inc.titulo}</p>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: DIM }}>⏱ {formatDuration(inc.fecha_inicio, inc.fecha_resolucion)}</span>
        {inc.responsable && <span style={{ fontSize: 11, color: DIM }}>👤 {inc.responsable}</span>}
        {inc.plazas.length > 0 && <span style={{ fontSize: 11, color: DIM }}>📍 {inc.plazas.slice(0, 3).join(', ')}{inc.plazas.length > 3 ? ` +${inc.plazas.length - 3}` : ''}</span>}
        <span style={{ fontSize: 11, color: DIM }}>{TIPO_LABEL[inc.tipo] ?? inc.tipo}</span>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function IncidentesSection({ theme }: Props) {
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showNuevo, setShowNuevo]   = useState(false);
  const [selected, setSelected]     = useState<Incidente | null>(null);
  const [tab, setTab]               = useState<'activos' | 'historial'>('activos');
  const { user } = useAuth();

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/incidentes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('xcien_token')}` },
      });
      if (r.ok) setIncidentes(await r.json());
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refrescar el incidente seleccionado tras cambios
  const handleRefresh = async () => {
    await load();
    if (selected) {
      const r = await fetch(`${API_BASE}/api/incidentes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('xcien_token')}` },
      });
      if (r.ok) {
        const all: Incidente[] = await r.json();
        const updated = all.find(x => x.id === selected.id);
        if (updated) setSelected(updated);
      }
    }
  };

  const activos   = incidentes.filter(i => i.estado !== 'resuelto');
  const historial = incidentes.filter(i => i.estado === 'resuelto');
  const p1Abiertos = activos.filter(i => i.severidad === 'P1').length;
  const durPromedio = historial.length
    ? Math.round(historial.reduce((sum, i) => {
        const mins = (new Date(i.fecha_resolucion!).getTime() - new Date(i.fecha_inicio).getTime()) / 60000;
        return sum + mins;
      }, 0) / historial.length)
    : null;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: DIM }}>
      <div style={{ width: 18, height: 18, border: `2px solid ${RED}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }} />
      Cargando incidentes…
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const canDeclare = ['admin', 'director', 'noc'].includes(user?.rol ?? '');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      {showNuevo && <ModalNuevo onClose={() => setShowNuevo(false)} onCreado={() => { load(); setShowNuevo(false); }} />}
      {selected && <DetallePanel inc={selected} onClose={() => setSelected(null)} onRefresh={handleRefresh} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f9fafb', letterSpacing: -0.5 }}>
            Incidentes de Red
            {p1Abiertos > 0 && (
              <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: 'rgba(255,71,87,0.15)', color: RED, border: `1px solid ${RED}30`, verticalAlign: 'middle', animation: 'pulse 1.5s ease infinite' }}>
                🔴 {p1Abiertos} P1 ACTIVO{p1Abiertos > 1 ? 'S' : ''}
              </span>
            )}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: DIM }}>
            {activos.length} activos · {historial.length} resueltos
            {durPromedio !== null && ` · MTTR ${formatDuration(new Date(Date.now() - durPromedio * 60000).toISOString(), null)}`}
          </p>
        </div>
        {canDeclare && (
          <button onClick={() => setShowNuevo(true)}
            style={{ padding: '10px 20px', borderRadius: 12, background: RED, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 7 }}>
            🚨 Declarar Incidente
          </button>
        )}
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Incidentes activos', value: activos.length, color: activos.length > 0 ? RED : GREEN },
          { label: 'P1 abiertos', value: p1Abiertos, color: p1Abiertos > 0 ? RED : DIM },
          { label: 'Resueltos (total)', value: historial.length, color: GREEN },
          { label: 'MTTR promedio', value: durPromedio !== null ? formatDuration(new Date(Date.now() - durPromedio * 60000).toISOString(), null) : '—', color: '#4FC3F7' },
        ].map(k => (
          <div key={k.label} style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '16px 20px' }}>
            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: DIM, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k.label}</p>
            <p style={{ margin: '6px 0 0', fontSize: 28, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#111827', borderRadius: 12, padding: 4, alignSelf: 'flex-start', border: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { id: 'activos'   as const, label: 'Activos',   badge: activos.length },
          { id: 'historial' as const, label: 'Historial', badge: historial.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '8px 20px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8,
              background: tab === t.id ? (t.id === 'activos' ? RED : GREEN) : 'transparent',
              color: tab === t.id ? '#fff' : DIM,
            }}>
            {t.label}
            {t.badge > 0 && <span style={{ fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, borderRadius: 9, background: tab === t.id ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'activos' && (
          activos.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '60px 0', color: DIM }}>
              <span style={{ fontSize: 48 }}>✅</span>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: GREEN }}>Sin incidentes activos</p>
              <p style={{ margin: 0, fontSize: 13 }}>La red opera con normalidad.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* P1 primero, luego P2, luego P3 */}
              {['P1', 'P2', 'P3'].flatMap(sev =>
                activos.filter(i => i.severidad === sev).map(inc => (
                  <IncidenteCard key={inc.id} inc={inc} onClick={() => setSelected(inc)} />
                ))
              )}
            </div>
          )
        )}
        {tab === 'historial' && (
          historial.length === 0 ? (
            <p style={{ color: DIM, fontSize: 13, textAlign: 'center', padding: '40px 0' }}>No hay incidentes resueltos aún.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {historial.map(inc => (
                <IncidenteCard key={inc.id} inc={inc} onClick={() => setSelected(inc)} />
              ))}
            </div>
          )
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>
    </div>
  );
}
