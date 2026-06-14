import { useState, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '../types';
import { API_BASE } from '../../../config';
import { useAuth } from '@/contexts/AuthContext';

interface Props { theme: ThemeConfig }

// ── Tipos ──────────────────────────────────────────────────────────────────────
export interface KPIConfig {
  id: string;
  label: string;
  endpoint: string;
  field: string;        // dot-path: "mrr" o "activeAlerts"
  format: 'number' | 'currency' | 'percent' | 'integer';
  enabled: boolean;
  threshold_ok: number;
  threshold_warn: number;
  invert?: boolean;     // true = menor es mejor (ej: alertas)
  color?: string;
}

interface KPIValue extends KPIConfig {
  value: number | null;
  status: 'ok' | 'warn' | 'critical' | 'loading' | 'error';
  delta?: number;       // variación vs periodo anterior (futuro)
}

const DEFAULT_KPIS: KPIConfig[] = [
  { id: 'mrr',            label: 'MRR Total',          endpoint: '/api/ventas/resumen',          field: 'mrr',            format: 'currency', enabled: true,  threshold_ok: 400000, threshold_warn: 300000 },
  { id: 'decrementos',    label: 'Decrementos',         endpoint: '/api/ventas/resumen',          field: 'decrementos',    format: 'integer',  enabled: true,  threshold_ok: 5,      threshold_warn: 15,    invert: true },
  { id: 'noc_health',     label: 'Salud NOC',           endpoint: '/api/noc/summary',             field: 'avgHealthScore', format: 'percent',  enabled: true,  threshold_ok: 90,     threshold_warn: 75 },
  { id: 'alertas',        label: 'Alertas Críticas',    endpoint: '/api/noc/summary',             field: 'criticalAlerts', format: 'integer',  enabled: true,  threshold_ok: 5,      threshold_warn: 15,    invert: true },
  { id: 'tickets_open',   label: 'Tickets Abiertos',    endpoint: '/api/wfm/field-tickets/summary', field: 'abiertos',     format: 'integer',  enabled: true,  threshold_ok: 50,     threshold_warn: 100,   invert: true },
  { id: 'tickets_closed', label: 'Tickets Cerrados Hoy',endpoint: '/api/wfm/field-tickets/summary', field: 'cerrados',     format: 'integer',  enabled: true,  threshold_ok: 10,     threshold_warn: 5 },
  { id: 'academia_avance',label: 'Avance Academia',     endpoint: '/api/academia/stats',          field: 'avance_global',  format: 'percent',  enabled: true,  threshold_ok: 60,     threshold_warn: 40 },
  { id: 'academia_tec',   label: 'Técnicos en Odoo',   endpoint: '/api/academia/stats',          field: 'total_tecnicos', format: 'integer',  enabled: false, threshold_ok: 500,    threshold_warn: 400 },
  { id: 'empleados',      label: 'Empleados Activos',   endpoint: '/api/rrhh/stats',              field: 'total',          format: 'integer',  enabled: false, threshold_ok: 100,    threshold_warn: 80 },
];

const KPI_STORAGE_KEY = 'xcien_kpi_config';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getNestedValue(obj: Record<string, unknown>, path: string): number | null {
  const val = path.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string,unknown>)[k] : undefined), obj);
  return typeof val === 'number' ? val : null;
}

function formatValue(v: number, fmt: KPIConfig['format']): string {
  if (fmt === 'currency') return `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v.toFixed(0)}`;
  if (fmt === 'percent')  return `${v.toFixed(1)}%`;
  return String(Math.round(v));
}

function getStatus(v: number, cfg: KPIConfig): KPIValue['status'] {
  const { threshold_ok, threshold_warn, invert } = cfg;
  if (!invert) {
    if (v >= threshold_ok)   return 'ok';
    if (v >= threshold_warn) return 'warn';
    return 'critical';
  } else {
    if (v <= threshold_ok)   return 'ok';
    if (v <= threshold_warn) return 'warn';
    return 'critical';
  }
}

const STATUS_COLOR = { ok: '#00C896', warn: '#FFB703', critical: '#FF4757', loading: '#6b7280', error: '#6b7280' };
const STATUS_LABEL = { ok: 'OK', warn: 'Alerta', critical: 'Crítico', loading: '…', error: 'Error' };

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KPICard({ kpi, onEdit }: { kpi: KPIValue; onEdit?: () => void }) {
  const color = STATUS_COLOR[kpi.status];
  return (
    <div style={{ background: '#111827', border: `1px solid ${color}25`, borderRadius: 16, padding: '18px 20px', position: 'relative', transition: 'border-color 0.3s' }}>
      <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 6px ${color}` }} />
        <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase' }}>{STATUS_LABEL[kpi.status]}</span>
      </div>
      {onEdit && (
        <button onClick={onEdit} style={{ position: 'absolute', top: 14, right: 80, background: 'none', border: 'none', color: '#374151', cursor: 'pointer', fontSize: 13 }}>✎</button>
      )}
      <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{kpi.label}</p>
      <p style={{ margin: 0, fontSize: 38, fontWeight: 800, color, lineHeight: 1, letterSpacing: -1 }}>
        {kpi.value === null ? '—' : formatValue(kpi.value, kpi.format)}
      </p>
      <div style={{ marginTop: 10, height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
        {kpi.value !== null && (
          <div style={{ height: '100%', borderRadius: 2, background: color, width: `${Math.min(100, (kpi.value / kpi.threshold_ok) * 100)}%`, transition: 'width 1s ease' }} />
        )}
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 11, color: '#6b7280' }}>
        Meta: {formatValue(kpi.threshold_ok, kpi.format)}
      </p>
    </div>
  );
}

// ── Editor de umbral ──────────────────────────────────────────────────────────
function KPIEditor({ kpi, onSave, onClose }: { kpi: KPIConfig; onSave: (k: KPIConfig) => void; onClose: () => void }) {
  const [cfg, setCfg] = useState({ ...kpi });
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32, width: 420, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f9fafb' }}>Configurar KPI</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        {[
          { label: 'Etiqueta', key: 'label', type: 'text' },
        ].map(f => (
          <div key={f.key}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{f.label}</label>
            <input value={(cfg as Record<string,unknown>)[f.key] as string} onChange={e => setCfg(c => ({ ...c, [f.key]: e.target.value }))}
              style={{ width: '100%', background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '9px 12px', color: '#f3f4f6', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
        ))}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: `Umbral OK (${cfg.invert ? '≤' : '≥'})`, key: 'threshold_ok' },
            { label: `Umbral Alerta (${cfg.invert ? '≤' : '≥'})`, key: 'threshold_warn' },
          ].map(f => (
            <div key={f.key}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input type="number" value={(cfg as Record<string,unknown>)[f.key] as number}
                onChange={e => setCfg(c => ({ ...c, [f.key]: Number(e.target.value) }))}
                style={{ width: '100%', background: '#0d1117', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '9px 12px', color: '#f3f4f6', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" id="inv" checked={!!cfg.invert} onChange={e => setCfg(c => ({ ...c, invert: e.target.checked }))} />
          <label htmlFor="inv" style={{ fontSize: 13, color: '#d1d5db', cursor: 'pointer' }}>Invertir (menor es mejor — ej: alertas, tickets)</label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="checkbox" id="en" checked={cfg.enabled} onChange={e => setCfg(c => ({ ...c, enabled: e.target.checked }))} />
          <label htmlFor="en" style={{ fontSize: 13, color: '#d1d5db', cursor: 'pointer' }}>Mostrar en dashboard</label>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
          <button onClick={() => { onSave(cfg); onClose(); }} style={{ padding: '9px 20px', borderRadius: 8, background: '#00C896', border: 'none', color: '#001a12', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ── Generador de reporte ──────────────────────────────────────────────────────
function GenerarReporte({ kpis }: { kpis: KPIValue[] }) {
  const [tipo, setTipo]       = useState<'diario' | 'semanal' | 'mensual'>('diario');
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState('');

  const generar = async () => {
    setLoading(true); setResult('');
    try {
      const snapshot = kpis.filter(k => k.enabled && k.value !== null).map(k => ({
        label: k.label,
        value: formatValue(k.value!, k.format),
        status: k.status,
      }));

      const res = await fetch(`${API_BASE}/api/reportes/generar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, kpis: snapshot }),
      });

      if (res.ok) {
        const d = await res.json();
        setResult(d.message ?? '✅ Reporte enviado a Telegram');
      } else {
        setResult('❌ Error generando reporte');
      }
    } catch {
      setResult('❌ Error de conexión');
    }
    setLoading(false);
  };

  return (
    <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 24 }}>
      <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: '#f9fafb' }}>📤 Generar Reporte</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: '#0d1117', borderRadius: 10, padding: 4 }}>
          {(['diario', 'semanal', 'mensual'] as const).map(t => (
            <button key={t} onClick={() => setTipo(t)}
              style={{ padding: '7px 16px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: tipo === t ? '#00C896' : 'transparent', color: tipo === t ? '#001a12' : '#6b7280' }}>
              {t === 'diario' ? '📅 Diario' : t === 'semanal' ? '📆 Semanal' : '🗓️ Mensual'}
            </button>
          ))}
        </div>
        <button onClick={generar} disabled={loading}
          style={{ padding: '9px 22px', borderRadius: 10, background: loading ? 'rgba(0,200,150,0.3)' : '#00C896', border: 'none', color: '#001a12', fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontSize: 13 }}>
          {loading ? 'Generando...' : 'Generar y enviar a Telegram'}
        </button>
        {result && <span style={{ fontSize: 13, color: result.startsWith('✅') ? '#00C896' : '#FF4757' }}>{result}</span>}
      </div>
      <p style={{ margin: '10px 0 0', fontSize: 11, color: '#6b7280' }}>
        {tipo === 'diario' ? 'Incluye snapshot de los KPIs activos con semáforo de estado.'
          : tipo === 'semanal' ? 'Incluye tendencia de 7 días y comparativa vs semana anterior.'
          : 'Resumen ejecutivo mensual con análisis del Director General IA.'}
      </p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ReportesKPISection({ theme }: Props) {
  const { user } = useAuth();
  const esDirector = user?.rol === 'admin' || user?.rol === 'director';

  // Cargar config desde localStorage
  const [configs, setConfigs] = useState<KPIConfig[]>(() => {
    try {
      const saved = localStorage.getItem(KPI_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as KPIConfig[];
        // Merge: mantiene defaults si hay nuevos KPIs no guardados
        return DEFAULT_KPIS.map(d => parsed.find(p => p.id === d.id) ?? d);
      }
    } catch {}
    return DEFAULT_KPIS;
  });

  const [values, setValues]     = useState<KPIValue[]>([]);
  const [loading, setLoading]   = useState(true);
  const [lastFetch, setLast]    = useState('');
  const [editingId, setEditing] = useState<string | null>(null);
  const [showAll, setShowAll]   = useState(false);

  // Guardar config cuando cambia
  useEffect(() => {
    localStorage.setItem(KPI_STORAGE_KEY, JSON.stringify(configs));
  }, [configs]);

  // Fetch todos los endpoints únicos
  const fetchKPIs = useCallback(async () => {
    setLoading(true);
    const uniqueEndpoints = [...new Set(configs.map(k => k.endpoint))];
    const cache: Record<string, Record<string, unknown>> = {};

    await Promise.all(uniqueEndpoints.map(async ep => {
      try {
        const r = await fetch(`${API_BASE}${ep}`);
        if (r.ok) cache[ep] = await r.json();
      } catch {}
    }));

    const newValues: KPIValue[] = configs.map(cfg => {
      const data = cache[cfg.endpoint];
      if (!data) return { ...cfg, value: null, status: 'error' as const };
      const value = getNestedValue(data, cfg.field);
      const status = value === null ? 'error' as const : getStatus(value, cfg);
      return { ...cfg, value, status };
    });

    setValues(newValues);
    setLast(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setLoading(false);
  }, [configs]);

  useEffect(() => { fetchKPIs(); }, [fetchKPIs]);
  // Auto-refresh cada 60s
  useEffect(() => {
    const id = setInterval(fetchKPIs, 60_000);
    return () => clearInterval(id);
  }, [fetchKPIs]);

  const visible  = values.filter(k => k.enabled || showAll);
  const editing  = editingId ? configs.find(c => c.id === editingId) : null;
  const critical = values.filter(k => k.status === 'critical' && k.enabled).length;
  const warn     = values.filter(k => k.status === 'warn'     && k.enabled).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f9fafb', letterSpacing: -0.5 }}>
              Dashboard KPI
            </h2>
            {critical > 0 && (
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20, background: 'rgba(255,71,87,0.12)', color: '#FF4757', border: '1px solid rgba(255,71,87,0.3)' }}>
                {critical} crítico{critical > 1 ? 's' : ''}
              </span>
            )}
            {warn > 0 && (
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20, background: 'rgba(255,183,3,0.12)', color: '#FFB703', border: '1px solid rgba(255,183,3,0.3)' }}>
                {warn} alerta{warn > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
            Última actualización: {lastFetch || '…'} · Auto-refresh 60s
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {esDirector && (
            <button onClick={() => setShowAll(v => !v)}
              style={{ padding: '8px 16px', borderRadius: 10, background: '#111827', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
              {showAll ? 'Solo habilitados' : 'Ver todos'}
            </button>
          )}
          <button onClick={fetchKPIs} disabled={loading}
            style={{ padding: '8px 16px', borderRadius: 10, background: '#111827', border: '1px solid rgba(255,255,255,0.08)', color: loading ? '#374151' : '#9ca3af', fontSize: 12, cursor: loading ? 'default' : 'pointer', fontWeight: 600 }}>
            {loading ? '↻ Actualizando...' : '↻ Refrescar'}
          </button>
        </div>
      </div>

      {/* Grid KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {visible.map(kpi => (
          <KPICard key={kpi.id} kpi={kpi} onEdit={esDirector ? () => setEditing(kpi.id) : undefined} />
        ))}
      </div>

      {/* Generador de reporte — solo director/admin */}
      {esDirector && <GenerarReporte kpis={values} />}

      {/* Tabla resumen completo */}
      <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#f9fafb' }}>Resumen de Estado</p>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0d1117' }}>
              {['KPI', 'Valor actual', 'Meta', 'Estado', esDirector && 'Habilitado'].filter(Boolean).map(h => (
                <th key={h as string} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {values.map(k => {
              const color = STATUS_COLOR[k.status];
              return (
                <tr key={k.id} style={{ borderTop: '1px solid rgba(255,255,255,0.04)', opacity: k.enabled ? 1 : 0.4 }}>
                  <td style={{ padding: '11px 16px', fontSize: 13, color: '#e5e7eb', fontWeight: 500 }}>{k.label}</td>
                  <td style={{ padding: '11px 16px', fontSize: 14, fontWeight: 800, color }}>{k.value === null ? '—' : formatValue(k.value, k.format)}</td>
                  <td style={{ padding: '11px 16px', fontSize: 13, color: '#6b7280' }}>{formatValue(k.threshold_ok, k.format)}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: `${color}12`, color, border: `1px solid ${color}25` }}>
                      {STATUS_LABEL[k.status]}
                    </span>
                  </td>
                  {esDirector && (
                    <td style={{ padding: '11px 16px' }}>
                      <button onClick={() => setConfigs(cs => cs.map(c => c.id === k.id ? { ...c, enabled: !c.enabled } : c))}
                        style={{ fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 20, border: `1px solid ${k.enabled ? '#00C89630' : 'rgba(255,255,255,0.1)'}`, background: k.enabled ? 'rgba(0,200,150,0.1)' : 'transparent', color: k.enabled ? '#00C896' : '#6b7280', cursor: 'pointer' }}>
                        {k.enabled ? 'Activo' : 'Desactivado'}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal editor */}
      {editing && (
        <KPIEditor
          kpi={editing}
          onSave={updated => setConfigs(cs => cs.map(c => c.id === updated.id ? updated : c))}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
