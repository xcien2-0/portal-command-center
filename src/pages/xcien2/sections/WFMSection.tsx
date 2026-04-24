import { useState, useCallback } from 'react';
import { ThemeConfig, WFMTechnician, WFMTicket, TechStatus, TicketPriority,
  WFM_TECHNICIANS, WFM_TICKETS } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<TechStatus, { bg: string; color: string }> = {
  'Disponible': { bg: 'rgba(0,200,150,0.12)', color: '#00C896' },
  'En Sitio':   { bg: 'rgba(251,191,36,0.12)', color: '#FFB703' },
  'En Oficina': { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8' },
};

const PRIORITY_COLOR: Record<TicketPriority, string> = {
  critical: '#FF4757',
  high:     '#FFB703',
  medium:   '#4FC3F7',
};

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  critical: 'Crítico',
  high:     'Alto',
  medium:   'Medio',
};

function kpiCount(techs: WFMTechnician[], tickets: WFMTicket[]) {
  return {
    total:       techs.length,
    disponible:  techs.filter(t => t.status === 'Disponible').length,
    enSitio:     techs.filter(t => t.status === 'En Sitio').length,
    pendientes:  tickets.filter(t => !t.assignedTo).length,
    criticos:    tickets.filter(t => t.priority === 'critical' && !t.assignedTo).length,
  };
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, accent, theme }: { label: string; value: number; accent: string; theme: ThemeConfig }) {
  return (
    <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: theme.radius, padding: '16px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 32, fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: theme.dim, marginTop: 6 }}>{label}</div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface Props { theme: ThemeConfig }

export default function WFMSection({ theme }: Props) {
  const [technicians, setTechnicians] = useState<WFMTechnician[]>(WFM_TECHNICIANS);
  const [tickets, setTickets]         = useState<WFMTicket[]>(WFM_TICKETS);

  const kpi = kpiCount(technicians, tickets);
  const accent = theme.accent;

  const assignTicket = useCallback((ticketId: string) => {
    const available = technicians.find(t => t.status === 'Disponible');
    if (!available) return;
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, assignedTo: available.id } : t));
    setTechnicians(prev => prev.map(t => t.id === available.id ? { ...t, status: 'En Sitio' } : t));
  }, [technicians]);

  const releasetech = useCallback((techId: string) => {
    setTechnicians(prev => prev.map(t => t.id === techId ? { ...t, status: 'Disponible' } : t));
  }, []);

  const getTechName = (id: string | null) =>
    id ? (technicians.find(t => t.id === id)?.name ?? '—') : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Control Operativo — WFM</h2>
        <p style={{ fontSize: 12, color: theme.dim, margin: 0 }}>Gestión de técnicos y tickets de campo en tiempo real</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
        <KpiCard label="Total técnicos"  value={kpi.total}      accent={theme.text}  theme={theme} />
        <KpiCard label="Disponibles"     value={kpi.disponible} accent="#00C896"     theme={theme} />
        <KpiCard label="En sitio"        value={kpi.enSitio}    accent="#FFB703"     theme={theme} />
        <KpiCard label="Tickets pend."   value={kpi.pendientes} accent="#4FC3F7"     theme={theme} />
        <KpiCard label="Críticos s/asig" value={kpi.criticos}   accent="#FF4757"     theme={theme} />
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Technicians */}
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: theme.radius, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}` }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Técnicos de campo</span>
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {technicians.map(tech => {
              const st = STATUS_STYLE[tech.status];
              return (
                <div key={tech.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border}`, borderRadius: theme.radius - 4 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: accent, flexShrink: 0 }}>
                    {tech.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tech.name}</div>
                    <div style={{ fontSize: 11, color: theme.dim }}>{tech.zone} · {tech.specialization}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <div style={{ flex: 1, height: 2, background: theme.border, borderRadius: 1, overflow: 'hidden' }}>
                        <div style={{ width: `${tech.skillPct}%`, height: '100%', background: accent }} />
                      </div>
                      <span style={{ fontSize: 10, color: theme.dim }}>{tech.skillPct}%</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: st.bg, color: st.color }}>
                      {tech.status}
                    </span>
                    {tech.status !== 'Disponible' && (
                      <button
                        onClick={() => releasetech(tech.id)}
                        style={{ fontSize: 9, padding: '2px 8px', borderRadius: 4, background: 'transparent', border: `1px solid ${theme.border}`, color: theme.dim, cursor: 'pointer' }}
                      >
                        Liberar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tickets */}
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: theme.radius, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${theme.border}` }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Tickets activos</span>
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tickets.map(ticket => {
              const pc = PRIORITY_COLOR[ticket.priority];
              const assignee = getTechName(ticket.assignedTo);
              return (
                <div key={ticket.id} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.border}`, borderLeft: `3px solid ${pc}`, borderRadius: theme.radius - 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{ticket.client}</span>
                      <span style={{ fontSize: 10, color: theme.dim, marginLeft: 8 }}>{ticket.id}</span>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: pc, background: `${pc}18`, padding: '2px 8px', borderRadius: 20 }}>
                      {PRIORITY_LABEL[ticket.priority]}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: theme.dim, margin: '0 0 6px' }}>{ticket.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: theme.dim }}>📍 {ticket.location}</span>
                    {assignee ? (
                      <span style={{ fontSize: 11, color: '#00C896' }}>✓ {assignee}</span>
                    ) : (
                      <button
                        onClick={() => assignTicket(ticket.id)}
                        disabled={kpi.disponible === 0}
                        style={{ fontSize: 10, padding: '3px 10px', borderRadius: 6, background: kpi.disponible > 0 ? accent : '#333', border: 'none', color: '#fff', cursor: kpi.disponible > 0 ? 'pointer' : 'not-allowed', fontWeight: 600 }}
                      >
                        Auto-asignar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
