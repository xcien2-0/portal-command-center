import React, { useState, useEffect, useCallback } from 'react';
import { ThemeConfig } from '../types';
import { API_BASE } from '../../../config';
import FibraSection from './FibraSection';

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface PersonaConfig {
  nombre: string;
  rol: string;
  emoji: string;
  activo?: boolean;
}

export interface PlazaConfig {
  id: string;
  nombre: string;
  estado_mx: string;
  emoji: string;
  fibra_plaza_id: string;
  tecnico_filter: string;   // nombre parcial del técnico; '' = ignorar
  ticket_terms?: string[];  // términos en nombre/cliente del ticket (OR con tecnico_filter)
  noc_terms: string[];
  equipo: PersonaConfig[];
  blocker?: string;
}

interface Ticket {
  id: string; odoo_id: number; nombre: string; cliente: string;
  tecnico: string | null; tipo: 'falla' | 'habilitacion';
  prioridad: string; etapa_op: string; etapa_op_idx: number;
  etapa_color: string; fecha_creacion: string;
  cerrado: boolean; kanban_state: string;
}

interface Alerta {
  id: string; cityName: string; siteName: string;
  hostName: string; hostIp: string; type: string;
  message: string; severity: string; timestamp: string;
  ticketCreated: boolean;
}

// ── Colores semánticos fijos ───────────────────────────────────────────────────
const BLUE = '#3B82F6', BLUE_DIM = '#1E3A5F';
const RED  = '#EF4444', RED_DIM  = '#3F1515';
const AMB  = '#F59E0B', AMB_DIM  = '#3D2800';

interface C {
  bg: string; surface: string; surface2: string; border: string;
  text: string; muted: string; dim: string;
  green: string; greenDim: string; white: string;
  blue: string; blueDim: string; red: string; redDim: string;
  amber: string; amberDim: string;
}

function mkC(t: ThemeConfig): C {
  return {
    bg: t.bg, surface: t.card, surface2: t.sidebar,
    border: t.border, text: t.text, muted: t.dim, dim: t.dim,
    green: t.accent, greenDim: t.accent + '22', white: t.text,
    blue: BLUE, blueDim: BLUE_DIM, red: RED, redDim: RED_DIM,
    amber: AMB, amberDim: AMB_DIM,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function tiempoTranscurrido(fecha: string): string {
  if (!fecha) return '—';
  const diff = Date.now() - new Date(fecha.replace(' ', 'T') + 'Z').getTime();
  const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000);
  if (h > 48) return `${Math.floor(h / 24)}d`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const horaLocal = () =>
  new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const fechaCorta = () =>
  new Date().toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });

const sevColor = (s: string, c: C) =>
  s === 'critical' ? c.red : s === 'warning' ? c.amber : c.blue;

const etapaColor = (idx: number, c: C) =>
  ({ 0: c.muted, 1: c.blue, 2: c.amber, 3: c.green, 4: c.dim } as Record<number, string>)[idx] ?? c.muted;

type OSTab = 'ops' | 'fibra';

// ── Componente principal ──────────────────────────────────────────────────────

export default function CiudadOSSection({
  config, theme,
}: { config: PlazaConfig; theme: ThemeConfig }) {
  const C = mkC(theme);

  const [osTab, setOsTab]             = useState<OSTab>('ops');
  const [tickets, setTickets]         = useState<Ticket[]>([]);
  const [alertas, setAlertas]         = useState<Alerta[]>([]);
  const [hora, setHora]               = useState(horaLocal());
  const [loadingT, setLoadingT]       = useState(true);
  const [loadingA, setLoadingA]       = useState(true);
  const [errorT, setErrorT]           = useState<string | null>(null);
  const [errorA, setErrorA]           = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [ticketDetail, setTicketDetail] = useState<Ticket | null>(null);

  useEffect(() => {
    const id = setInterval(() => setHora(horaLocal()), 1000);
    return () => clearInterval(id);
  }, []);

  const matchesTicket = useCallback((t: Ticket) => {
    const byTech = config.tecnico_filter
      ? (t.tecnico || '').toLowerCase().includes(config.tecnico_filter.toLowerCase())
      : false;
    const byTerms = config.ticket_terms?.length
      ? (() => {
          const hay = `${t.nombre} ${t.cliente || ''}`.toLowerCase();
          return config.ticket_terms!.some(term => hay.includes(term));
        })()
      : false;
    // Si hay algún criterio definido, mostrar si cumple al menos uno (OR)
    // Si no hay ninguno, mostrar todos
    const hasCriteria = !!config.tecnico_filter || (config.ticket_terms?.length ?? 0) > 0;
    return hasCriteria ? (byTech || byTerms) : true;
  }, [config.tecnico_filter, config.ticket_terms]);

  const matchesCiudad = useCallback((a: Alerta) => {
    const hay = (a.cityName + ' ' + a.hostName + ' ' + a.siteName).toLowerCase();
    return config.noc_terms.some(t => hay.includes(t));
  }, [config.noc_terms]);

  const fetchTickets = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/wfm/field-tickets?limit=200`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      const todos: Ticket[] = d.tickets ?? [];
      setTickets(todos.filter(t => matchesTicket(t) && !t.cerrado));
      setErrorT(null);
    } catch (e: any) { setErrorT(e.message); }
    finally { setLoadingT(false); setLastRefresh(new Date()); }
  }, [matchesTicket]);

  const fetchAlertas = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/noc/alerts?active_only=true&limit=500`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      const todas: Alerta[] = Array.isArray(d) ? d : (d.alerts ?? []);
      setAlertas(todas.filter(matchesCiudad));
      setErrorA(null);
    } catch (e: any) { setErrorA(e.message); }
    finally { setLoadingA(false); }
  }, [matchesCiudad]);

  useEffect(() => {
    fetchTickets(); fetchAlertas();
    const t1 = setInterval(fetchTickets, 60_000);
    const t2 = setInterval(fetchAlertas, 30_000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [fetchTickets, fetchAlertas, matchesTicket]);

  const fallas         = tickets.filter(t => t.tipo === 'falla');
  const habilitaciones = tickets.filter(t => t.tipo === 'habilitacion');
  const criticas       = alertas.filter(a => a.severity === 'critical');
  const urgentes       = tickets.filter(t => t.prioridad === 'urgent');

  const tecLabel = config.tecnico_filter
    ? config.tecnico_filter.charAt(0).toUpperCase() + config.tecnico_filter.slice(1)
    : 'Todos';

  return (
    <div style={{
      background: C.bg, minHeight: '100%', color: C.text,
      fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: `linear-gradient(135deg, ${C.green}, ${C.green}88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0,
          }}>
            {config.emoji}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 2, color: C.white, fontFamily: 'inherit' }}>
              {config.nombre.toLowerCase()}<span style={{ color: C.green }}>OS</span>
            </div>
            <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1 }}>
              PLAZA {config.nombre.toUpperCase()} · {config.estado_mx.toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <StatusDot label="Odoo" ok={!errorT} loading={loadingT} c={C} />
          <StatusDot label="NOC"  ok={!errorA} loading={loadingA} c={C} />
        </div>

        <div style={{ fontSize: 10, color: C.dim, textAlign: 'right' }}>
          <div>ACTUALIZACIÓN</div>
          <div style={{ color: C.muted }}>
            {lastRefresh.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <button
          onClick={() => { fetchTickets(); fetchAlertas(); }}
          title="Actualizar ahora"
          style={{
            background: C.surface2, border: `1px solid ${C.border}`,
            borderRadius: 6, color: C.muted, padding: '4px 10px',
            cursor: 'pointer', fontSize: 12,
          }}
        >↻</button>

        <div style={{ textAlign: 'right', minWidth: 90 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.green, letterSpacing: 1, fontFamily: 'inherit' }}>
            {hora}
          </div>
          <div style={{ fontSize: 10, color: C.muted }}>{fechaCorta()}</div>
        </div>
      </div>

      {/* ── KPI STRIP ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1, background: C.border, borderBottom: `1px solid ${C.border}`,
      }}>
        <KPITile label="Tickets abiertos" value={tickets.length}
          sub={`${urgentes.length} urgentes`}
          color={urgentes.length > 0 ? C.red : C.green} loading={loadingT} c={C} />
        <KPITile label="Fallas activas" value={fallas.length}
          sub={`${tecLabel} asignado`}
          color={fallas.length > 0 ? C.amber : C.green} loading={loadingT} c={C} />
        <KPITile label="Habilitaciones" value={habilitaciones.length}
          sub="en proceso" color={C.blue} loading={loadingT} c={C} />
        <KPITile label={`Alertas red ${config.id.toUpperCase()}`} value={alertas.length}
          sub={`${criticas.length} críticas`}
          color={criticas.length > 0 ? C.red : alertas.length > 0 ? C.amber : C.green}
          loading={loadingA} c={C} />
      </div>

      {/* ── BLOCKER BANNER ───────────────────────────────────────────────────── */}
      {config.blocker && (
        <div style={{
          background: C.redDim, borderBottom: `1px solid ${C.red}33`,
          padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 12, color: C.red, flexShrink: 0,
        }}>
          <span style={{ fontSize: 14 }}>🔴</span>
          <span><strong>Blocker crítico — </strong>{config.blocker}</span>
        </div>
      )}

      {/* ── TAB BAR ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', borderBottom: `1px solid ${C.border}`,
        background: C.surface2, flexShrink: 0,
      }}>
        {([
          { id: 'ops',   icon: '⚙️', label: 'OPERACIONES' },
          { id: 'fibra', icon: '🔆', label: `FIBRA X100 · ${config.id.toUpperCase()}` },
        ] as { id: OSTab; icon: string; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setOsTab(t.id)} style={{
            padding: '8px 20px', border: 'none', cursor: 'pointer',
            background: 'transparent',
            borderBottom: osTab === t.id ? `2px solid ${C.green}` : '2px solid transparent',
            color: osTab === t.id ? C.green : C.muted,
            fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── FIBRA TAB ────────────────────────────────────────────────────────── */}
      {osTab === 'fibra' && (
        <div style={{ flex: 1, overflowY: 'auto', background: C.bg }}>
          <FibraSection theme={theme} />
        </div>
      )}

      {/* ── OPS: cuerpo principal ────────────────────────────────────────────── */}
      {osTab === 'ops' && (
        <div style={{
          flex: 1, display: 'grid', gridTemplateColumns: '1fr 420px',
          gap: 0, overflow: 'hidden', background: C.border, minHeight: 0,
        }}>

          {/* Col izquierda: Tickets */}
          <div style={{ background: C.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <PanelHeader
              icon="⚙️"
              title={config.tecnico_filter
                ? `Tickets Activos — ${tecLabel}`
                : `Tickets Abiertos — ${config.nombre}`}
              badge={tickets.length}
              badgeColor={C.blue} c={C}
            />
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 12px' }}>
              {loadingT && <LoadingRows c={C} />}
              {!loadingT && errorT && <ErrorMsg msg={errorT} c={C} />}
              {!loadingT && !errorT && tickets.length === 0 && (
                <EmptyState icon="✅"
                  msg={config.tecnico_filter
                    ? `Sin tickets abiertos para ${tecLabel}`
                    : `Sin tickets abiertos en ${config.nombre}`}
                  c={C} />
              )}
              {!loadingT && tickets.map(t => (
                <TicketRow
                  key={t.id} ticket={t}
                  isSelected={ticketDetail?.id === t.id}
                  onClick={() => setTicketDetail(p => p?.id === t.id ? null : t)}
                  c={C}
                />
              ))}
            </div>
          </div>

          {/* Col derecha: Alertas NOC */}
          <div style={{
            background: C.surface, display: 'flex', flexDirection: 'column',
            borderLeft: `1px solid ${C.border}`, overflow: 'hidden',
          }}>
            <PanelHeader
              icon="📡"
              title={`Red ${config.nombre}`}
              badge={alertas.length}
              badgeColor={criticas.length > 0 ? C.red : C.amber}
              c={C}
            />
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 12px' }}>
              {loadingA && <LoadingRows c={C} />}
              {!loadingA && errorA && <ErrorMsg msg={errorA} c={C} />}
              {!loadingA && !errorA && alertas.length === 0 && (
                <EmptyState icon="🟢" msg={`Sin alertas activas en ${config.nombre}`} c={C} />
              )}
              {!loadingA && alertas
                .sort((a, b) => (b.severity === 'critical' ? 1 : 0) - (a.severity === 'critical' ? 1 : 0))
                .map(a => <AlertaRow key={a.id} alerta={a} c={C} />)
              }
            </div>

            {/* Equipo */}
            <div style={{
              borderTop: `1px solid ${C.border}`, padding: '10px 14px', background: C.surface2,
            }}>
              <div style={{ fontSize: 9, color: C.dim, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
                Equipo de plaza
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {config.equipo.map(p => (
                  <PersonaChip key={p.nombre} {...p} c={C} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL DRAWER ────────────────────────────────────────────────────── */}
      {osTab === 'ops' && ticketDetail && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: C.surface, borderTop: `2px solid ${C.blue}`,
          padding: '16px 24px', zIndex: 100,
          display: 'flex', gap: 24, alignItems: 'flex-start',
          maxHeight: '40vh', overflowY: 'auto',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: C.blue, fontFamily: 'inherit' }}>{ticketDetail.id}</span>
              <span style={{
                fontSize: 10, padding: '2px 8px', borderRadius: 4,
                background: ticketDetail.tipo === 'falla' ? C.redDim : C.blueDim,
                color: ticketDetail.tipo === 'falla' ? C.red : C.blue,
              }}>{ticketDetail.tipo.toUpperCase()}</span>
              {ticketDetail.prioridad === 'urgent' && (
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: C.redDim, color: C.red, fontWeight: 700 }}>
                  URGENTE
                </span>
              )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.white, marginBottom: 4 }}>
              {ticketDetail.nombre}
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>
              {ticketDetail.cliente} · {ticketDetail.etapa_op} · {tiempoTranscurrido(ticketDetail.fecha_creacion)} ago
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <a
              href={`https://odoo.wispi.mx/odoo/helpdesk/${ticketDetail.odoo_id}`}
              target="_blank" rel="noreferrer"
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 12,
                background: C.blue, color: C.white, textDecoration: 'none', fontFamily: 'inherit',
              }}
            >Abrir en Odoo ↗</a>
            <button onClick={() => setTicketDetail(null)} style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 12,
              background: C.surface2, border: `1px solid ${C.border}`,
              color: C.muted, cursor: 'pointer', fontFamily: 'inherit',
            }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function StatusDot({ label, ok, loading, c }: { label: string; ok: boolean; loading: boolean; c: C }) {
  const color = loading ? c.amber : ok ? c.green : c.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 7, height: 7, borderRadius: '50%', background: color,
        boxShadow: `0 0 6px ${color}`, animation: loading ? 'pulse 1s infinite' : 'none' }} />
      <span style={{ fontSize: 10, color: c.muted }}>{label}</span>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}

function KPITile({ label, value, sub, color, loading, c }:
  { label: string; value: number; sub: string; color: string; loading: boolean; c: C }) {
  return (
    <div style={{ background: c.surface, padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: 9, color: c.dim, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color, lineHeight: 1, fontFamily: 'inherit', opacity: loading ? 0.4 : 1 }}>
        {loading ? '—' : value}
      </div>
      <div style={{ fontSize: 10, color: c.muted }}>{sub}</div>
    </div>
  );
}

function PanelHeader({ icon, title, badge, badgeColor, c }:
  { icon: string; title: string; badge: number; badgeColor: string; c: C }) {
  return (
    <div style={{
      padding: '10px 14px', borderBottom: `1px solid ${c.border}`,
      display: 'flex', alignItems: 'center', gap: 8, background: c.surface2, flexShrink: 0,
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span style={{ fontSize: 11, color: c.muted, flex: 1, letterSpacing: 0.5 }}>{title.toUpperCase()}</span>
      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
        background: badgeColor + '22', color: badgeColor, fontFamily: 'inherit' }}>{badge}</span>
    </div>
  );
}

function TicketRow({ ticket, isSelected, onClick, c }:
  { ticket: Ticket; isSelected: boolean; onClick: () => void; c: C }) {
  const typeColor = ticket.tipo === 'falla' ? c.red : c.blue;
  const stageColor = etapaColor(ticket.etapa_op_idx, c);
  return (
    <div onClick={onClick} style={{
      padding: '10px 14px', borderBottom: `1px solid ${c.border}`, cursor: 'pointer',
      background: isSelected ? c.surface2 : 'transparent',
      borderLeft: `3px solid ${isSelected ? c.blue : 'transparent'}`,
      transition: 'background 0.1s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 3, flexShrink: 0,
          background: typeColor + '22', color: typeColor, fontFamily: 'inherit',
          letterSpacing: 0.5, marginTop: 2 }}>
          {ticket.tipo === 'falla' ? 'FALLA' : 'INST'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: c.dim, fontFamily: 'inherit' }}>{ticket.id}</span>
            {ticket.prioridad === 'urgent' && <span style={{ fontSize: 9, color: c.red }}>● URGENTE</span>}
            <span style={{ marginLeft: 'auto', fontSize: 10, color: c.muted }}>{tiempoTranscurrido(ticket.fecha_creacion)}</span>
          </div>
          <div style={{ fontSize: 12, color: c.text, whiteSpace: 'nowrap',
            overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 3, fontFamily: 'system-ui, sans-serif' }}>
            {ticket.nombre}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: c.muted, flex: 1, overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'system-ui, sans-serif' }}>
              {ticket.cliente}
            </span>
            <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3,
              background: stageColor + '22', color: stageColor, fontFamily: 'inherit', flexShrink: 0 }}>
              {ticket.etapa_op}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertaRow({ alerta, c }: { alerta: Alerta; c: C }) {
  const color = sevColor(alerta.severity, c);
  const time = alerta.timestamp
    ? new Date(alerta.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : '—';
  return (
    <div style={{ padding: '10px 14px', borderBottom: `1px solid ${c.border}`, borderLeft: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 4,
          boxShadow: alerta.severity === 'critical' ? `0 0 8px ${color}` : 'none' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3,
              background: color + '22', color, fontFamily: 'inherit', letterSpacing: 0.5 }}>
              {alerta.severity.toUpperCase()}
            </span>
            <span style={{ fontSize: 10, color: c.dim, marginLeft: 'auto' }}>{time}</span>
          </div>
          <div style={{ fontSize: 11, color: c.text, marginBottom: 2, fontFamily: 'system-ui, sans-serif',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {alerta.hostName || alerta.siteName || '—'}
          </div>
          <div style={{ fontSize: 10, color: c.muted, fontFamily: 'system-ui, sans-serif',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {alerta.cityName} · {alerta.type}
          </div>
          {alerta.ticketCreated && <div style={{ fontSize: 9, color: c.green, marginTop: 2 }}>✓ ticket creado</div>}
        </div>
      </div>
    </div>
  );
}

function PersonaChip({ nombre, rol, emoji, activo, c }:
  PersonaConfig & { c: C }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 14 }}>{emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: c.text, fontFamily: 'system-ui, sans-serif' }}>{nombre}</div>
        <div style={{ fontSize: 9, color: c.muted }}>{rol}</div>
      </div>
      {activo && <div style={{ width: 7, height: 7, borderRadius: '50%', background: c.green, boxShadow: `0 0 6px ${c.green}` }} />}
    </div>
  );
}

function LoadingRows({ c }: { c: C }) {
  return (
    <div style={{ padding: '20px 14px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ height: 60, borderRadius: 4, background: c.surface2, marginBottom: 8, opacity: 0.6 - i * 0.15 }} />
      ))}
    </div>
  );
}

function ErrorMsg({ msg, c }: { msg: string; c: C }) {
  return (
    <div style={{ padding: '16px 14px' }}>
      <div style={{ padding: 12, borderRadius: 6, background: c.redDim,
        border: `1px solid ${c.red}22`, fontSize: 11, color: c.red, fontFamily: 'inherit' }}>
        ⚠ Error: {msg}
      </div>
    </div>
  );
}

function EmptyState({ icon, msg, c }: { icon: string; msg: string; c: C }) {
  return (
    <div style={{ padding: '40px 14px', textAlign: 'center', color: c.dim, fontSize: 12, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      {msg}
    </div>
  );
}
