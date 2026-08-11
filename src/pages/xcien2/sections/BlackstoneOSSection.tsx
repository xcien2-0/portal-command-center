// BlackstoneOS PDN — Piedras Negras · Dashboard exclusivo con features propios
import React, { useState, useEffect } from 'react';
import CiudadOSSection, { ExtraTab, PROSPECTOS_PDN } from './CiudadOSSection';
import { PDN_CONFIG, XCIEN_CORPORATE_THEME } from './ciudadConfigs';
import { ThemeConfig } from '../types';
import { API_BASE } from '../../../config';

// Paleta PDN fija (tema institucional claro)
const G  = '#2d7a3a';
const GD = '#1a3d2b';
const GB = '#c8dccb';
const BG = '#f8fdf9';
const SF = '#ffffff';
const TX = '#1a1a1a';
const DM = '#5a5a5a';
const RD = '#EF4444';
const AM = '#F59E0B';
const BL = '#3B82F6';
const SH = '0 1px 3px rgba(0,0,0,0.08)';

// ── Helpers ───────────────────────────────────────────────────────────────────

function tiempoAtras(fecha: string): string {
  if (!fecha) return '—';
  const diff = Date.now() - new Date(fecha.replace(' ', 'T') + 'Z').getTime();
  const h = Math.floor(diff / 3600000);
  if (h > 48) return `${Math.floor(h / 24)}d`;
  if (h > 0) return `${h}h`;
  return `${Math.floor((diff % 3600000) / 60000)}m`;
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: SF, borderRadius: 12, border: `1px solid ${GB}`,
      boxShadow: SH, ...style,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ icon, title, badge, badgeColor }: {
  icon: string; title: string; badge?: number | string; badgeColor?: string;
}) {
  return (
    <div style={{
      padding: '12px 18px', borderBottom: `1px solid ${GB}`,
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ fontSize: 10, color: DM }}>{icon}</span>
      <span style={{ fontSize: 10, color: DM, letterSpacing: 1.5, textTransform: 'uppercase', flex: 1 }}>
        {title}
      </span>
      {badge !== undefined && (
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 100,
          background: `${badgeColor ?? G}1a`, color: badgeColor ?? G,
          border: `1px solid ${badgeColor ?? G}33`, minWidth: 24, textAlign: 'center',
        }}>{badge}</span>
      )}
    </div>
  );
}

// ── 1. LANCEMEX TRACKER ───────────────────────────────────────────────────────

interface LancermexEntry { id: string; fecha: string; cajas: number; nota: string; }
const LS_LANCEMEX = 'xcien-lancermex-pdn';
const TOTAL_CAJAS = 21;

function loadLancermex(): LancermexEntry[] {
  try { return JSON.parse(localStorage.getItem(LS_LANCEMEX) ?? '[]'); } catch { return []; }
}

function LancermexTracker() {
  const [entries, setEntries] = useState<LancermexEntry[]>(() => loadLancermex());
  const [showModal, setShowModal] = useState(false);
  const [inputCajas, setInputCajas] = useState(0);
  const [inputNota, setInputNota] = useState('');

  const current = entries[0]?.cajas ?? 0;
  const pct = Math.round((current / TOTAL_CAJAS) * 100);
  const statusColor = pct >= 100 ? G : pct >= 50 ? AM : RD;
  const statusLabel = pct >= 100 ? 'COMPLETADO' : 'BLOQUEADO';

  const handleSave = () => {
    if (!inputNota.trim()) return;
    const updated = [
      { id: Date.now().toString(), fecha: new Date().toISOString(), cajas: inputCajas, nota: inputNota.trim() },
      ...entries,
    ].slice(0, 30);
    localStorage.setItem(LS_LANCEMEX, JSON.stringify(updated));
    setEntries(updated);
    setShowModal(false);
    setInputNota('');
  };

  const fechaCorta = (iso: string) =>
    new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionCard style={{ padding: 20 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 18 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: `${statusColor}15`, border: `2px solid ${statusColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>🔌</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: TX }}>CWDM F3 — Lancermex</span>
              <span style={{
                fontSize: 9, padding: '3px 10px', borderRadius: 100,
                background: `${statusColor}15`, color: statusColor,
                border: `1px solid ${statusColor}40`, fontWeight: 800, letterSpacing: 1,
              }}>{statusLabel}</span>
            </div>
            <div style={{ fontSize: 12, color: DM, fontFamily: 'system-ui, sans-serif' }}>
              Escalado a Francisco Alday · Fibra Piedras Negras F3
            </div>
          </div>
          <button onClick={() => { setInputCajas(current); setShowModal(true); }} style={{
            padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
            background: GD, color: '#fff', border: 'none',
            fontSize: 11, fontWeight: 700, flexShrink: 0,
          }}>Actualizar avance</button>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: DM }}>Cajas completadas</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: statusColor, fontVariantNumeric: 'tabular-nums' }}>
              {current} / {TOTAL_CAJAS} — {pct}%
            </span>
          </div>
          <div style={{ height: 12, background: GB, borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: `linear-gradient(90deg, ${statusColor}88, ${statusColor})`,
              borderRadius: 6, transition: 'width 0.5s ease',
            }} />
          </div>
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: '21 cajas totales', c: DM },
            { label: 'F3 · Anillo Lancermex + ruta alterna', c: DM },
            { label: `${TOTAL_CAJAS - current} cajas restantes`, c: AM },
            { label: 'Escalado: Francisco Alday', c: RD },
          ].map(({ label, c }) => (
            <span key={label} style={{
              fontSize: 10, padding: '3px 10px', borderRadius: 100,
              background: `${c}12`, color: c, border: `1px solid ${c}25`,
            }}>{label}</span>
          ))}
        </div>
      </SectionCard>

      {/* Timeline */}
      <SectionCard>
        <SectionHeader icon="◷" title="Historial de avance" badge={entries.length} />
        {entries.length === 0 ? (
          <div style={{ padding: '36px 18px', textAlign: 'center', color: DM, fontSize: 12 }}>
            Sin actualizaciones — presiona "Actualizar avance" para registrar la primera
          </div>
        ) : (
          entries.map((e, i) => (
            <div key={e.id} style={{
              padding: '14px 18px',
              borderBottom: i < entries.length - 1 ? `1px solid ${GB}` : 'none',
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: `${G}12`, border: `1px solid ${G}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: G,
              }}>{e.cajas}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: DM, marginBottom: 3, fontVariantNumeric: 'tabular-nums' }}>
                  {fechaCorta(e.fecha)} · {Math.round((e.cajas / TOTAL_CAJAS) * 100)}%
                </div>
                <div style={{ fontSize: 12, color: TX, fontFamily: 'system-ui, sans-serif', lineHeight: 1.5 }}>
                  {e.nota}
                </div>
              </div>
            </div>
          ))
        )}
      </SectionCard>

      {/* Modal */}
      {showModal && (
        <div onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }} style={{
          position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div style={{
            background: SF, borderRadius: 12, border: `1px solid ${GB}`,
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)', width: '100%', maxWidth: 440, padding: 24,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: TX, marginBottom: 20 }}>
              🔌 Actualizar avance Lancermex
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: DM, letterSpacing: 1, marginBottom: 8 }}>
                CAJAS COMPLETADAS (de {TOTAL_CAJAS})
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <input
                  type="range" min={0} max={TOTAL_CAJAS} value={inputCajas}
                  onChange={e => setInputCajas(Number(e.target.value))}
                  style={{ flex: 1, accentColor: G }}
                />
                <span style={{ fontSize: 22, fontWeight: 800, color: G, minWidth: 36, textAlign: 'center' }}>
                  {inputCajas}
                </span>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: DM, letterSpacing: 1, marginBottom: 8 }}>
                NOTA / OBSERVACIÓN
              </div>
              <textarea
                value={inputNota}
                onChange={e => setInputNota(e.target.value)}
                placeholder="Ej: Guillermo visitó 3 cajas esta semana. Lancermex reporta acceso dificultado por construcción..."
                rows={4}
                style={{
                  width: '100%', boxSizing: 'border-box', background: BG,
                  border: `1px solid ${GB}`, borderRadius: 8, padding: '10px 12px',
                  color: TX, fontSize: 12, fontFamily: 'system-ui, sans-serif',
                  lineHeight: 1.6, resize: 'vertical', outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{
                padding: '9px 18px', borderRadius: 8, cursor: 'pointer',
                border: `1px solid ${GB}`, background: 'transparent', color: DM, fontSize: 12,
              }}>Cancelar</button>
              <button onClick={handleSave} disabled={!inputNota.trim()} style={{
                padding: '9px 22px', borderRadius: 8,
                cursor: inputNota.trim() ? 'pointer' : 'default',
                background: inputNota.trim() ? GD : GB, color: '#fff', border: 'none',
                fontSize: 12, fontWeight: 700,
              }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 2. AMISTAD PIPELINE ───────────────────────────────────────────────────────

type ProspectoStatus = 'prospecto' | 'conversacion' | 'propuesta' | 'ganado' | 'descartado';

const STATUS_META: Record<ProspectoStatus, { label: string; color: string; icon: string }> = {
  prospecto:    { label: 'Prospecto',    color: DM, icon: '○' },
  conversacion: { label: 'Conversación', color: BL, icon: '◎' },
  propuesta:    { label: 'Propuesta',    color: AM, icon: '◈' },
  ganado:       { label: 'Ganado',       color: G,  icon: '✓' },
  descartado:   { label: 'Descartado',   color: RD, icon: '✕' },
};

const LS_AMISTAD = 'xcien-amistad-pipeline';

function AmistadPipeline() {
  const [statuses, setStatuses] = useState<Record<string, ProspectoStatus>>(() => {
    try { return JSON.parse(localStorage.getItem(LS_AMISTAD) ?? '{}'); } catch { return {}; }
  });
  const [filter, setFilter] = useState<ProspectoStatus | 'todos'>('todos');

  const getStatus = (name: string): ProspectoStatus => statuses[name] ?? 'prospecto';

  const update = (name: string, s: ProspectoStatus) => {
    const updated = { ...statuses, [name]: s };
    setStatuses(updated);
    localStorage.setItem(LS_AMISTAD, JSON.stringify(updated));
  };

  const counts = (Object.keys(STATUS_META) as ProspectoStatus[]).reduce((acc, k) => {
    acc[k] = PROSPECTOS_PDN.filter(p => getStatus(p.name) === k).length;
    return acc;
  }, {} as Record<ProspectoStatus, number>);

  const visible = filter === 'todos'
    ? PROSPECTOS_PDN
    : [...PROSPECTOS_PDN].filter(p => getStatus(p.name) === filter);

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        {(Object.entries(STATUS_META) as [ProspectoStatus, typeof STATUS_META[ProspectoStatus]][]).map(([k, m]) => (
          <button key={k} onClick={() => setFilter(filter === k ? 'todos' : k)} style={{
            background: filter === k ? `${m.color}15` : SF,
            border: `1px solid ${filter === k ? m.color + '55' : GB}`,
            borderRadius: 10, padding: '12px 8px', cursor: 'pointer',
            textAlign: 'center', transition: 'all 0.15s', boxShadow: SH,
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: m.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {counts[k]}
            </div>
            <div style={{ fontSize: 9, color: DM, marginTop: 4, letterSpacing: 0.5 }}>
              {m.label.toUpperCase()}
            </div>
          </button>
        ))}
      </div>

      {/* List */}
      <SectionCard>
        <SectionHeader
          icon="🏭"
          title={`Parque Industrial Amistad · ${visible.length} prospectos`}
          badge={filter !== 'todos' ? `${filter}` : undefined}
          badgeColor={filter !== 'todos' ? STATUS_META[filter as ProspectoStatus]?.color : undefined}
        />
        {visible.map((p, i) => {
          const st = getStatus(p.name);
          const m = STATUS_META[st];
          return (
            <div key={p.name} style={{
              padding: '10px 18px',
              borderBottom: i < visible.length - 1 ? `1px solid ${GB}` : 'none',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 11, color: m.color, width: 14, flexShrink: 0 }}>{m.icon}</span>
              <div style={{ flex: 1, fontSize: 12, color: TX, fontFamily: 'system-ui, sans-serif' }}>
                {p.name}
              </div>
              <select
                value={st}
                onChange={e => update(p.name, e.target.value as ProspectoStatus)}
                style={{
                  fontSize: 10, padding: '4px 8px', borderRadius: 6,
                  border: `1px solid ${m.color}55`,
                  background: `${m.color}12`, color: m.color,
                  cursor: 'pointer', outline: 'none', fontWeight: 600,
                }}
              >
                {(Object.entries(STATUS_META) as [ProspectoStatus, typeof STATUS_META[ProspectoStatus]][]).map(([k, meta]) => (
                  <option key={k} value={k}>{meta.label}</option>
                ))}
              </select>
            </div>
          );
        })}
      </SectionCard>
    </div>
  );
}

// ── 3. CAMPO PDN — Guillermo ──────────────────────────────────────────────────

interface GPSVeh {
  nombre: string; placa: string; conductor?: string;
  lat?: number; lng?: number; velocidad?: number;
  km_hoy?: number; activo?: boolean; ubicacion?: string;
}
interface TicketG {
  id: string; odoo_id: number; nombre: string; cliente: string;
  tecnico: string | null; tipo: string; etapa_op: string;
  fecha_creacion: string; prioridad: string; cerrado: boolean;
}

function CampoPDN() {
  const [gps, setGps] = useState<GPSVeh | null>(null);
  const [tickets, setTickets] = useState<TicketG[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${API_BASE}/api/gps/vehiculos`).then(r => r.ok ? r.json() : { vehiculos: [] }),
      fetch(`${API_BASE}/api/wfm/field-tickets?limit=200`).then(r => r.ok ? r.json() : { tickets: [] }),
    ]).then(([g, w]) => {
      const v = (g.vehiculos ?? []).find((v: GPSVeh) =>
        (v.conductor ?? v.nombre ?? '').toLowerCase().includes('guillermo'));
      setGps(v ?? null);
      setTickets((w.tickets ?? []).filter((t: TicketG) =>
        !t.cerrado && (t.tecnico ?? '').toLowerCase().includes('guillermo')));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* GPS + info */}
      <SectionCard style={{ padding: 20 }}>
        <div style={{ fontSize: 10, color: DM, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
          🔧 Guillermo Hernandez F. — Técnico PDN + Acuña
        </div>

        {loading ? (
          <div style={{ fontSize: 12, color: DM }}>Cargando datos GPS...</div>
        ) : gps ? (
          <>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: TX, marginBottom: 3 }}>
                  {gps.placa} · {gps.nombre}
                </div>
                <div style={{ fontSize: 11, color: DM, fontFamily: 'system-ui, sans-serif' }}>
                  {gps.ubicacion || 'Ubicación no disponible'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                {[
                  { val: `${gps.velocidad ?? 0}`, unit: 'km/h', color: gps.activo ? G : DM },
                  { val: `${(gps.km_hoy ?? 0).toFixed(0)}`, unit: 'km hoy', color: BL },
                ].map(({ val, unit, color }) => (
                  <div key={unit} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{val}</div>
                    <div style={{ fontSize: 9, color: DM, marginTop: 2 }}>{unit}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 9, padding: '3px 10px', borderRadius: 100, fontWeight: 700,
                background: `${gps.activo ? G : DM}12`, color: gps.activo ? G : DM,
                border: `1px solid ${gps.activo ? G : DM}30`,
              }}>{gps.activo ? '● En movimiento' : '● Detenido'}</span>
              <span style={{
                fontSize: 9, padding: '3px 10px', borderRadius: 100,
                background: `${BL}12`, color: BL, border: `1px solid ${BL}30`,
              }}>Cobertura: PDN + Acuña</span>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: DM }}>Vehículo de Guillermo no localizado en GPS</div>
        )}

        {/* MikroTik Acuña */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${GB}` }}>
          <a href="http://localhost:8010" target="_blank" rel="noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 16px', borderRadius: 8, textDecoration: 'none',
            background: `${BL}12`, border: `1px solid ${BL}40`, color: BL,
            fontSize: 12, fontWeight: 600,
          }}>
            🌐 MikroTik Manager Acuña · :8010 ↗
          </a>
        </div>
      </SectionCard>

      {/* Tickets de Guillermo */}
      <SectionCard>
        <SectionHeader
          icon="⚙"
          title="Tickets asignados a Guillermo"
          badge={tickets.length}
          badgeColor={tickets.some(t => t.prioridad === 'urgent') ? RD : BL}
        />
        {tickets.length === 0 ? (
          <div style={{ padding: '36px 18px', textAlign: 'center', color: DM, fontSize: 12 }}>
            {loading ? 'Cargando...' : 'Sin tickets asignados'}
          </div>
        ) : (
          tickets.slice(0, 10).map((t, i) => {
            const typeColor = t.tipo === 'falla' ? RD : BL;
            return (
              <div key={t.id} style={{
                padding: '11px 18px',
                borderBottom: i < Math.min(tickets.length, 10) - 1 ? `1px solid ${GB}` : 'none',
                borderLeft: `3px solid ${typeColor}`,
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, color: DM, marginBottom: 2 }}>{t.id}</div>
                  <div style={{ fontSize: 12, color: TX, fontFamily: 'system-ui, sans-serif', fontWeight: 500, marginBottom: 3 }}>
                    {t.nombre}
                  </div>
                  <div style={{ fontSize: 10, color: DM }}>{t.cliente || '—'} · {t.etapa_op}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: DM, marginBottom: 4 }}>{tiempoAtras(t.fecha_creacion)}</div>
                  <span style={{
                    fontSize: 9, padding: '2px 7px', borderRadius: 100,
                    background: `${typeColor}12`, color: typeColor,
                    border: `1px solid ${typeColor}30`, fontWeight: 700,
                  }}>{t.tipo === 'falla' ? 'FALLA' : 'INST'}</span>
                </div>
              </div>
            );
          })
        )}
      </SectionCard>
    </div>
  );
}

// ── 4. KPIs PDN ───────────────────────────────────────────────────────────────

interface SidfCliente {
  id: string; nombre: string; estado: string;
  plaza: string; velocidad?: string; noc_monitoreado?: boolean;
}

function KPIsPDN() {
  const [tickets, setTickets] = useState<TicketG[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [sidf, setSidf] = useState<SidfCliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const pdnTerms = ['piedras', 'acuña', 'acuna', 'pdn', 'acu'];
    Promise.all([
      fetch(`${API_BASE}/api/wfm/field-tickets?limit=200`).then(r => r.ok ? r.json() : { tickets: [] }),
      fetch(`${API_BASE}/api/noc/alerts?active_only=true&limit=500`).then(r => r.ok ? r.json() : {}),
      fetch(`${API_BASE}/api/red/clientes-sidf`).then(r => r.ok ? r.json() : { clientes: [] }),
    ]).then(([w, n, s]) => {
      const ts = (w.tickets ?? []).filter((t: TicketG) => {
        const hay = `${t.nombre} ${t.cliente || ''}`.toLowerCase();
        return !t.cerrado && pdnTerms.some(term => hay.includes(term));
      });
      setTickets(ts);

      const alerts = Array.isArray(n) ? n : (n.alerts ?? []);
      setAlertas(alerts.filter((a: any) => {
        const hay = `${a.cityName} ${a.hostName} ${a.siteName}`.toLowerCase();
        return pdnTerms.some(t => hay.includes(t));
      }));

      setSidf((s.clientes ?? []).filter((c: SidfCliente) => c.plaza === 'pn'));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const fallas     = tickets.filter(t => t.tipo === 'falla');
  const habs       = tickets.filter(t => t.tipo === 'habilitacion');
  const urgentes   = tickets.filter(t => t.prioridad === 'urgent');
  const criticas   = alertas.filter(a => a.severity === 'critical');
  const avgAgeH    = tickets.length > 0
    ? tickets.reduce((s, t) => s + (Date.now() - new Date(t.fecha_creacion.replace(' ', 'T') + 'Z').getTime()) / 3600000, 0) / tickets.length
    : 0;
  const avgAgeStr  = avgAgeH > 48 ? `${Math.floor(avgAgeH / 24)}d` : `${Math.round(avgAgeH)}h`;

  const sidfActivos     = sidf.filter(c => c.estado === 'activo').length;
  const sidfInstalacion = sidf.filter(c => c.estado === 'instalacion').length;

  const kpis = [
    { label: 'Tickets PDN', value: tickets.length, sub: `${urgentes.length} urgentes`, color: urgentes.length > 0 ? RD : G, icon: '⚡' },
    { label: 'Fallas activas', value: fallas.length, sub: 'plaza PDN', color: fallas.length > 0 ? AM : G, icon: '⚠' },
    { label: 'Habilitaciones', value: habs.length, sub: 'en proceso', color: BL, icon: '✦' },
    { label: 'Alertas NOC', value: alertas.length, sub: `${criticas.length} críticas`, color: criticas.length > 0 ? RD : alertas.length > 0 ? AM : G, icon: '◈' },
    { label: 'SIDF activos', value: sidfActivos, sub: `${sidfInstalacion} en instalación`, color: G, icon: '◎' },
    { label: 'Edad promedio', value: 0, rawStr: loading ? '—' : avgAgeStr, sub: 'tickets abiertos', color: DM, icon: '◷' },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: SF, borderRadius: 12, border: `1px solid ${GB}`,
            boxShadow: SH, padding: '18px 20px',
            borderLeft: `3px solid ${k.color}`, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: 0, right: 0, width: 60, height: 60,
              background: `radial-gradient(circle at 80% 20%, ${k.color}0c, transparent 70%)`,
              pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 9, color: k.color, opacity: 0.7 }}>{k.icon}</span>
              <span style={{ fontSize: 9, color: DM, letterSpacing: 1.5, textTransform: 'uppercase' }}>{k.label}</span>
            </div>
            <div style={{
              fontSize: 36, fontWeight: 800, color: k.color, lineHeight: 1,
              opacity: loading ? 0.3 : 1, transition: 'opacity 0.3s', fontVariantNumeric: 'tabular-nums',
            }}>
              {loading ? '—' : (k.rawStr ?? k.value)}
            </div>
            <div style={{ fontSize: 10, color: DM, marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* SIDF breakdown */}
      <SectionCard>
        <SectionHeader icon="◎" title="Clientes SIDF — Piedras Negras" badge={sidf.length} badgeColor={G} />
        {sidf.length === 0 ? (
          <div style={{ padding: '32px 18px', textAlign: 'center', color: DM, fontSize: 12 }}>
            {loading ? 'Cargando...' : 'Sin clientes SIDF en PDN'}
          </div>
        ) : (
          <div style={{ padding: '8px 0' }}>
            {sidf.map((c, i) => {
              const col = c.estado === 'activo' ? G : c.estado === 'instalacion' ? AM : BL;
              return (
                <div key={c.id} style={{
                  padding: '10px 18px',
                  borderBottom: i < sidf.length - 1 ? `1px solid ${GB}` : 'none',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 12, color: TX, fontFamily: 'system-ui, sans-serif' }}>
                    {c.nombre}
                  </div>
                  {c.velocidad && (
                    <span style={{ fontSize: 10, color: DM, fontVariantNumeric: 'tabular-nums' }}>{c.velocidad}</span>
                  )}
                  {c.noc_monitoreado && (
                    <span style={{ fontSize: 9, color: G }}>✓ NOC</span>
                  )}
                  <span style={{
                    fontSize: 9, padding: '2px 9px', borderRadius: 100, fontWeight: 700,
                    background: `${col}15`, color: col, border: `1px solid ${col}30`,
                  }}>{c.estado}</span>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Prospectos Amistad resumen */}
      <SectionCard style={{ padding: 18 }}>
        <div style={{ fontSize: 10, color: DM, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>
          🏭 Pipeline Amistad — resumen
        </div>
        <div style={{ fontSize: 12, color: TX, fontFamily: 'system-ui, sans-serif', lineHeight: 1.7 }}>
          <span style={{ fontWeight: 700, color: GD }}>{PROSPECTOS_PDN.length}</span> prospectos industriales identificados en Parque Amistad.
          Gestiona el pipeline completo en el tab <span style={{ color: G, fontWeight: 600 }}>🏭 AMISTAD</span>.
        </div>
      </SectionCard>
    </div>
  );
}

// ── BlackstoneOSSection — componente principal ────────────────────────────────

export default function BlackstoneOSSection({ theme: _theme }: { theme: ThemeConfig }) {
  const extraTabs: ExtraTab[] = [
    { id: 'lancemex', icon: '🔌', label: 'Lancermex', content: <LancermexTracker /> },
    { id: 'amistad',  icon: '🏭', label: 'Amistad',  content: <AmistadPipeline /> },
    { id: 'campo',    icon: '🔧', label: 'Guillermo', content: <CampoPDN /> },
    { id: 'kpis',     icon: '📊', label: 'KPIs PDN', content: <KPIsPDN /> },
  ];

  return (
    <CiudadOSSection
      config={PDN_CONFIG}
      theme={XCIEN_CORPORATE_THEME}
      extraTabs={extraTabs}
    />
  );
}
