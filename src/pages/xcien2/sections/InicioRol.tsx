/**
 * InicioRol — Dashboard de inicio personalizado por rol.
 * Director/Admin → KPIs ejecutivos + alertas + Academia + accesos rápidos
 * Técnico       → Perfil Academia + tickets asignados + ranking
 * NOC           → Alertas críticas en tiempo real + ciudades afectadas
 * WFM           → Cola de tickets + técnicos en campo
 * Genérico      → Cards de acceso rápido + estado de sistemas
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { API_BASE } from '../../../config';
import brand from '../../../brand';
import type { ThemeConfig, SectionId } from '../types';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  theme: ThemeConfig;
  onNavigate: (id: SectionId) => void;
  backendStatus: 'online' | 'offline';
  odooStatus: 'conectado' | 'desconectado';
  observiumStatus: 'conectado' | 'desconectado';
}

// ─── Shared primitives ────────────────────────────────────────────────────────

const C = {
  green:   '#00C896',
  yellow:  '#FFB703',
  red:     '#FF4757',
  blue:    '#4FC3F7',
  purple:  '#7c3aed',
  dim:     '#6b7280',
  card:    '#111827',
  border:  'rgba(255,255,255,0.06)',
  text:    '#f9fafb',
  textSub: '#f3f4f6',
  rowBg:   '#0d1117',
};

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: 20,
      ...style,
    }}>
      {children}
    </div>
  );
}

function KPICard({ label, value, sub, color, icon, onClick }:
  { label: string; value: string | number; sub?: string; color: string; icon: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 18px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => onClick && ((e.currentTarget as HTMLDivElement).style.borderColor = `${color}40`)}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = C.border)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ margin: 0, fontSize: 11, color: C.dim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</p>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <p style={{ margin: '8px 0 4px', fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ margin: 0, fontSize: 11, color: C.dim }}>{sub}</p>}
    </div>
  );
}

function SectionBtn({ icon, label, desc, color, onClick }:
  { icon: string; label: string; desc: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: `${color}08`, border: `1px solid ${color}20`,
      borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
      textAlign: 'left', transition: 'all 0.15s', width: '100%',
    }}
      onMouseEnter={e => { const el = e.currentTarget; el.style.background = `${color}14`; el.style.borderColor = `${color}40`; }}
      onMouseLeave={e => { const el = e.currentTarget; el.style.background = `${color}08`; el.style.borderColor = `${color}20`; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textSub }}>{label}</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: C.dim }}>{desc}</p>
        </div>
        <span style={{ marginLeft: 'auto', color: `${color}60`, fontSize: 16 }}>→</span>
      </div>
    </button>
  );
}

// ─── Vista: Director / Admin ───────────────────────────────────────────────────

function HomeDirector({ onNavigate }: { onNavigate: (id: SectionId) => void }) {
  const isMobile = useIsMobile();
  const [nocStats, setNocStats]     = useState<Record<string, number> | null>(null);
  const [wfmStats, setWfmStats]     = useState<Record<string, number> | null>(null);
  const [acadStats, setAcadStats]   = useState<Record<string, number> | null>(null);
  const [ventas, setVentas]         = useState<Record<string, number> | null>(null);
  const [alertas, setAlertas]       = useState<{ id: string; entity: string; severity: string }[]>([]);

  const loadKPIs = useCallback(() => {
    Promise.allSettled([
      fetch(`${API_BASE}/api/noc/dashboard-stats`).then(r => r.ok ? r.json() : null).then(d => d && setNocStats(d)),
      fetch(`${API_BASE}/api/wfm/kpis`).then(r => r.ok ? r.json() : null).then(d => d && setWfmStats(d)),
      fetch(`${API_BASE}/api/academia/stats`).then(r => r.ok ? r.json() : null).then(d => d && setAcadStats(d)),
      fetch(`${API_BASE}/api/ventas/resumen`).then(r => r.ok ? r.json() : null).then(d => d && setVentas(d)),
      fetch(`${API_BASE}/api/noc/alerts`).then(r => r.ok ? r.json() : []).then(d => {
        const crits = (Array.isArray(d) ? d : [])
          .filter((a: { severity?: string; alert_severity?: string }) => {
            const sev = (a.severity ?? a.alert_severity ?? '').toLowerCase();
            return ['critical', 'high'].includes(sev);
          })
          .slice(0, 5)
          .map((a: { id?: string | number; entity_name?: string; hostName?: string; siteName?: string; severity?: string; alert_severity?: string; cityName?: string }) => ({
            id: String(a.id ?? ''),
            entity: a.entity_name ?? a.hostName ?? a.siteName ?? a.cityName ?? 'Dispositivo',
            severity: a.severity ?? a.alert_severity ?? 'critical',
          }));
        setAlertas(crits);
      }),
    ]);
  }, []);

  useEffect(() => {
    loadKPIs();
    const t = setInterval(loadKPIs, 60_000);
    return () => clearInterval(t);
  }, [loadKPIs]);

  const hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20, width: '100%', maxWidth: '100%' }}>
      {/* Greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 19 : 24, fontWeight: 800, color: C.text }}>Buenos días, Director</h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: C.dim }}>{brand.name} · Centro de Mando · {hora} hrs</p>
        </div>
        <button onClick={() => onNavigate('war-room')} style={{
          padding: '10px 20px', borderRadius: 10, background: 'rgba(124,58,237,0.15)',
          border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          width: isMobile ? '100%' : 'auto',
        }}>⚔️ Abrir War Room</button>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 14 }}>
        <KPICard label="Salud de Red" value={nocStats ? `${nocStats.uptime_pct ?? 0}%` : '—'} sub={nocStats ? `${nocStats.up}/${nocStats.total} nodos` : 'cargando'} color={nocStats && (nocStats.uptime_pct ?? 0) >= 90 ? C.green : C.yellow} icon="📡" onClick={() => onNavigate('noc')} />
        <KPICard label="Tickets Abiertos" value={wfmStats?.abiertos ?? '—'} sub={`${wfmStats?.urgentes ?? 0} urgentes`} color={wfmStats && (wfmStats.urgentes ?? 0) > 0 ? C.yellow : C.green} icon="⚙️" onClick={() => onNavigate('wfm')} />
        <KPICard label="Avance Academia" value={acadStats ? `${acadStats.avance_activos ?? 0}%` : '—'} sub={`${acadStats?.total_activos ?? 0} de ${acadStats?.total_tecnicos ?? 0} activos`} color={C.green} icon="🎓" onClick={() => onNavigate('academia')} />
        <KPICard label="MRR" value={ventas?.mrr ? `$${Number(ventas.mrr).toLocaleString()}` : '—'} sub="Ingresos recurrentes" color={C.blue} icon="📈" onClick={() => onNavigate('ventas')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 16 }}>
        {/* Alertas críticas */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textSub }}>🔴 Alertas Críticas NOC</p>
            <button onClick={() => onNavigate('noc')} style={{ background: 'none', border: 'none', color: C.blue, fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>Ver todas →</button>
          </div>
          {alertas.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: C.green, fontSize: 13 }}>✓ Sin alertas críticas activas</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alertas.map(a => (
                <div key={a.id} onClick={() => onNavigate('noc')} style={{
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.15)',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{ fontSize: 16 }}>{a.severity === 'critical' ? '🔴' : '🟡'}</span>
                  <p style={{ margin: 0, fontSize: 12, color: C.textSub, fontWeight: 600 }}>{a.entity}</p>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: C.red, fontWeight: 700 }}>{a.severity.toUpperCase()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Accesos rápidos */}
        <Card>
          <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: C.textSub }}>⚡ Accesos Rápidos</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SectionBtn icon="🎯" label="KPI Dashboard" desc="Indicadores ejecutivos configurables" color={C.purple} onClick={() => onNavigate('reportes-kpi')} />
            <SectionBtn icon="⚔️" label="War Room IA" desc="Comando multi-agente en tiempo real" color={C.purple} onClick={() => onNavigate('war-room')} />
            <SectionBtn icon="👥" label="Gestión de Usuarios" desc="Crear y administrar accesos" color={C.blue} onClick={() => onNavigate('adopcion')} />
            <SectionBtn icon="🛡️" label="Análisis Estratégico" desc="FODA con regeneración por IA" color={C.green} onClick={() => onNavigate('foda')} />
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Vista: Técnico ────────────────────────────────────────────────────────────

function HomeTecnico({ nombreTecnico, onNavigate }: { nombreTecnico: string; onNavigate: (id: SectionId) => void }) {
  const isMobile = useIsMobile();
  const [perfil, setPerfil]   = useState<{ avgPct: number; rank: number; total: number; cursos: number; completados: number } | null>(null);
  const [tickets, setTickets] = useState<{ id: number; name: string; priority: string; stage: string }[]>([]);

  useEffect(() => {
    // Academia: buscar técnico en cursos
    fetch(`${API_BASE}/api/academia/cursos`)
      .then(r => r.ok ? r.json() : [])
      .then((cursos: { members_list: { name: string; pct: number }[] }[]) => {
        const map: Record<string, { sum: number; count: number }> = {};
        for (const c of cursos) {
          for (const m of c.members_list) {
            const n = (m.name ?? '').trim();
            if (!n) continue;
            if (!map[n]) map[n] = { sum: 0, count: 0 };
            map[n].sum += m.pct ?? 0;
            map[n].count += 1;
          }
        }
        const sorted = Object.entries(map)
          .map(([n, { sum, count }]) => ({ name: n, avg: count > 0 ? Math.round(sum / count) : 0, cursos: count }))
          .sort((a, b) => b.avg - a.avg);
        const total = sorted.length;
        const me = sorted.find(t => t.name.toLowerCase() === nombreTecnico.toLowerCase());
        const rank = me ? sorted.findIndex(t => t.name.toLowerCase() === nombreTecnico.toLowerCase()) + 1 : 0;

        // mis cursos
        const misCursos = cursos.map(c => {
          const m = c.members_list.find(x => x.name?.toLowerCase() === nombreTecnico.toLowerCase());
          return m ? m.pct : null;
        }).filter(p => p !== null) as number[];
        const completados = misCursos.filter(p => p === 100).length;

        if (me) setPerfil({ avgPct: me.avg, rank, total, cursos: misCursos.length, completados });
      })
      .catch(() => {});

    // WFM tickets filtrados por técnico asignado
    fetch(`${API_BASE}/api/wfm/field-tickets?limit=100`)
      .then(r => r.ok ? r.json() : { tickets: [] })
      .then((d: { tickets?: { id: string; nombre?: string; name?: string; prioridad?: string; priority?: string; etapa_op?: string; stage_name?: string; tecnico?: string | null; cerrado?: boolean }[] }) => {
        const all = d.tickets ?? [];
        const mine = nombreTecnico
          ? all.filter(t => {
              const asignado = t.tecnico ?? '';
              return !t.cerrado && asignado.toLowerCase().includes(nombreTecnico.toLowerCase().split(' ')[0]);
            })
          : all.filter(t => !t.cerrado);
        setTickets(mine.slice(0, 5).map(t => ({
          id: t.id as unknown as number, name: t.nombre ?? t.name ?? '', priority: t.prioridad === 'alta' ? '1' : '0', stage: t.etapa_op ?? t.stage_name ?? '',
        })));
      })
      .catch(() => {});
  }, [nombreTecnico]);

  const LEVELS = [
    { min: 0, name: 'Aprendiz', icon: '🌱', color: '#6b7280' },
    { min: 30, name: 'Técnico', icon: '🔧', color: '#4FC3F7' },
    { min: 50, name: 'Especialista', icon: '⚙️', color: '#00C896' },
    { min: 65, name: 'Avanzado', icon: '🏆', color: '#7c3aed' },
    { min: 80, name: 'Experto', icon: '🎖️', color: '#FFB703' },
    { min: 95, name: 'Leyenda', icon: '⭐', color: '#FF4757' },
  ];
  const nivel = perfil
    ? [...LEVELS].reverse().find(l => (perfil.avgPct) >= l.min) ?? LEVELS[0]
    : LEVELS[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20, width: '100%', maxWidth: '100%' }}>
      {/* Greeting */}
      <div>
        <h1 style={{ margin: 0, fontSize: isMobile ? 19 : 24, fontWeight: 800, color: C.text }}>Hola, {nombreTecnico.split(' ')[0]} 👋</h1>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: C.dim }}>Técnico de Campo · {brand.name}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 16 }}>
        {/* Perfil Academia */}
        <Card>
          <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: C.textSub }}>🎓 Mi Progreso Academia</p>
          {perfil ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 40, fontWeight: 900, color: nivel.color, lineHeight: 1 }}>{perfil.avgPct}%</p>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: C.dim }}>promedio</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: nivel.color }}>{nivel.icon} {nivel.name}</p>
                  <p style={{ margin: '3px 0', fontSize: 12, color: C.dim }}>#{perfil.rank} de {perfil.total} técnicos</p>
                  <p style={{ margin: 0, fontSize: 12, color: C.dim }}>{perfil.completados} cursos completados</p>
                </div>
              </div>
              <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${perfil.avgPct}%`, height: '100%', background: nivel.color, borderRadius: 3, transition: 'width 1s ease' }} />
              </div>
            </>
          ) : (
            <div style={{ color: C.dim, fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Cargando perfil…</div>
          )}
          <button onClick={() => onNavigate('academia')} style={{
            marginTop: 14, width: '100%', padding: '9px', borderRadius: 8,
            background: `${nivel.color}12`, border: `1px solid ${nivel.color}25`,
            color: nivel.color, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>Ver mi Academia completa →</button>
        </Card>

        {/* Stats rápidas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <KPICard label="Ranking Global" value={perfil ? `#${perfil.rank}` : '—'} sub={`de ${perfil?.total ?? 0} técnicos`} color={C.yellow} icon="🏅" onClick={() => onNavigate('academia')} />
          <KPICard label="Cursos Inscritos" value={perfil?.cursos ?? '—'} sub={`${perfil?.completados ?? 0} completados`} color={C.green} icon="📚" onClick={() => onNavigate('academia')} />
        </div>
      </div>

      {/* Tickets */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.textSub }}>⚙️ Últimos Tickets WFM</p>
          <button onClick={() => onNavigate('wfm')} style={{ background: 'none', border: 'none', color: C.blue, fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>Ver todos →</button>
        </div>
        {tickets.length === 0 ? (
          <p style={{ color: C.dim, fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Sin tickets recientes</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tickets.map(t => (
              <div key={t.id} style={{ padding: '9px 12px', borderRadius: 8, background: C.rowBg, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14 }}>{t.priority === '1' ? '🔥' : '📋'}</span>
                <p style={{ margin: 0, fontSize: 12, color: C.textSub, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                {t.stage && <span style={{ fontSize: 10, color: C.dim, flexShrink: 0 }}>{t.stage}</span>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Vista: NOC Operator ──────────────────────────────────────────────────────

function HomeNOC({ onNavigate }: { onNavigate: (id: SectionId) => void }) {
  const isMobile = useIsMobile();
  const [stats, setStats]   = useState<Record<string, number> | null>(null);
  const [alertas, setAlertas] = useState<{ id: string; entity: string; severity: string; message: string }[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/noc/dashboard-stats`).then(r => r.ok ? r.json() : null).then(d => d && setStats(d)).catch(() => {});
    fetch(`${API_BASE}/api/noc/alerts`).then(r => r.ok ? r.json() : []).then((d: { id?: string | number; entity_name?: string; alert_severity?: string; alert_message?: string }[]) => {
      setAlertas((Array.isArray(d) ? d : []).slice(0, 15).map(a => ({
        id: String(a.id ?? ''), entity: a.entity_name ?? '', severity: a.alert_severity ?? 'warning', message: a.alert_message ?? '',
      })));
    }).catch(() => {});
  }, []);

  const crits = alertas.filter(a => ['critical', 'high'].includes(a.severity.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20, width: '100%', maxWidth: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? 19 : 24, fontWeight: 800, color: C.text }}>Centro NOC</h1>
        <button onClick={() => onNavigate('noc')} style={{ padding: '9px 18px', borderRadius: 9, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}>
          Ver NOC completo →
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? 10 : 14 }}>
        <KPICard label="Uptime" value={stats ? `${stats.uptime_pct ?? 0}%` : '—'} sub={`${stats?.up ?? 0}/${stats?.total ?? 0} nodos`} color={(stats?.uptime_pct ?? 0) >= 95 ? C.green : (stats?.uptime_pct ?? 0) >= 80 ? C.yellow : C.red} icon="📡" onClick={() => onNavigate('noc')} />
        <KPICard label="Alertas Críticas" value={crits.length} sub="activas ahora" color={crits.length > 0 ? C.red : C.green} icon="🔴" onClick={() => onNavigate('noc')} />
        <KPICard label="Mapa de Red" value="Ver" sub="Topología en vivo" color={C.blue} icon="🗺️" onClick={() => onNavigate('red')} />
      </div>

      <Card>
        <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: C.textSub }}>
          Alertas Activas
          {crits.length > 0 && <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 10, background: 'rgba(255,71,87,0.1)', color: C.red, fontSize: 11 }}>{crits.length} críticas</span>}
        </p>
        {alertas.length === 0
          ? <p style={{ color: C.green, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>✓ Todo en orden · Sin alertas activas</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
              {alertas.map(a => {
                const isCrit = ['critical', 'high'].includes(a.severity.toLowerCase());
                return (
                  <div key={a.id} onClick={() => onNavigate('noc')} style={{
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                    background: isCrit ? 'rgba(255,71,87,0.06)' : 'rgba(255,183,3,0.04)',
                    border: `1px solid ${isCrit ? 'rgba(255,71,87,0.2)' : 'rgba(255,183,3,0.15)'}`,
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}>
                    <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{isCrit ? '🔴' : '🟡'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: C.textSub }}>{a.entity}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: C.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.message}</p>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 800, color: isCrit ? C.red : C.yellow, flexShrink: 0 }}>{a.severity.toUpperCase()}</span>
                  </div>
                );
              })}
            </div>
        }
      </Card>
    </div>
  );
}

// ─── Vista: WFM Operator ──────────────────────────────────────────────────────

function HomeWFM({ onNavigate }: { onNavigate: (id: SectionId) => void }) {
  const isMobile = useIsMobile();
  const [kpis, setKpis]   = useState<Record<string, number> | null>(null);
  const [tickets, setTickets] = useState<{ id: number; name: string; priority: string; stage: string; partner: string }[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/wfm/kpis`).then(r => r.ok ? r.json() : null).then(d => d && setKpis(d)).catch(() => {});
    fetch(`${API_BASE}/api/wfm/field-tickets?limit=20`).then(r => r.ok ? r.json() : { tickets: [] })
      .then((d: { tickets?: { id: number; name: string; priority?: string; stage_name?: string; partner_name?: string }[] }) => {
        setTickets((d.tickets ?? []).map(t => ({
          id: t.id, name: t.name, priority: t.priority ?? '0',
          stage: t.stage_name ?? '', partner: t.partner_name ?? '',
        })));
      }).catch(() => {});
  }, []);

  const urgentes = tickets.filter(t => t.priority === '1');
  const normales  = tickets.filter(t => t.priority !== '1');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20, width: '100%', maxWidth: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? 19 : 24, fontWeight: 800, color: C.text }}>Control WFM</h1>
        <button onClick={() => onNavigate('wfm')} style={{ padding: '9px 18px', borderRadius: 9, background: 'rgba(255,183,3,0.1)', border: '1px solid rgba(255,183,3,0.3)', color: C.yellow, fontSize: 13, fontWeight: 700, cursor: 'pointer', width: isMobile ? '100%' : 'auto' }}>
          Control operativo →
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 14 }}>
        <KPICard label="Total Tickets" value={kpis?.total ?? '—'} sub="en el sistema" color={C.blue} icon="📋" onClick={() => onNavigate('wfm')} />
        <KPICard label="Abiertos" value={kpis?.abiertos ?? '—'} sub="pendientes" color={C.yellow} icon="⏳" onClick={() => onNavigate('wfm')} />
        <KPICard label="Urgentes" value={urgentes.length} sub="requieren atención" color={urgentes.length > 0 ? C.red : C.green} icon="🔥" onClick={() => onNavigate('wfm')} />
        <KPICard label="Equipo Campo" value="Ver" sub="Técnicos activos" color={C.green} icon="🚛" onClick={() => onNavigate('bidrillas')} />
      </div>

      <Card>
        <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: C.textSub }}>Cola de Tickets</p>
        {tickets.length === 0
          ? <p style={{ color: C.dim, fontSize: 13, textAlign: 'center', padding: '16px 0' }}>Cargando tickets…</p>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 340, overflowY: 'auto' }}>
              {[...urgentes, ...normales].map(t => (
                <div key={t.id} onClick={() => onNavigate('wfm')} style={{
                  padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                  background: t.priority === '1' ? 'rgba(255,183,3,0.04)' : C.rowBg,
                  border: `1px solid ${t.priority === '1' ? 'rgba(255,183,3,0.2)' : C.border}`,
                  display: 'flex', gap: 10, alignItems: 'center',
                }}>
                  <span style={{ fontSize: 14 }}>{t.priority === '1' ? '🔥' : '📋'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.textSub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                    {t.partner && <p style={{ margin: 0, fontSize: 10, color: C.dim }}>{t.partner}</p>}
                  </div>
                  <span style={{ fontSize: 10, color: C.dim, flexShrink: 0 }}>{t.stage}</span>
                </div>
              ))}
            </div>
        }
      </Card>
    </div>
  );
}

// ─── Vista: Genérico (readonly, otros) ────────────────────────────────────────

function HomeGenerico({ onNavigate, backendStatus, odooStatus, observiumStatus }:
  { onNavigate: (id: SectionId) => void; backendStatus: 'online' | 'offline'; odooStatus: string; observiumStatus: string }) {
  const isMobile = useIsMobile();

  const ACCESOS: { icon: string; label: string; desc: string; id: SectionId; color: string }[] = [
    { icon: '📡', label: 'NOC Virtual',      desc: 'Estado de la red en tiempo real', id: 'noc',          color: C.blue   },
    { icon: '⚙️', label: 'Control WFM',      desc: 'Tickets y operaciones de campo',  id: 'wfm',          color: C.yellow },
    { icon: '🎓', label: 'Academia',          desc: 'Cursos y leaderboard',            id: 'academia',     color: C.green  },
    { icon: '📈', label: 'Ventas',            desc: 'MRR y resumen comercial',         id: 'ventas',       color: C.blue   },
    { icon: '👤', label: 'RRHH',              desc: 'Directorio de empleados',         id: 'rrhh',         color: C.green  },
    { icon: '📅', label: 'Sala de Juntas',    desc: 'Calendario y reuniones',          id: 'sala_juntas',  color: C.purple },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20, width: '100%', maxWidth: '100%' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: isMobile ? 19 : 24, fontWeight: 800, color: C.text, letterSpacing: '-0.01em' }}>Centro de Mando</h1>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: C.dim }}>{brand.name} — Portal de Operaciones</p>
      </div>

      {/* Sistema status */}
      <Card style={isMobile ? { padding: 16 } : undefined}>
        <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: C.textSub, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Estado de Sistemas</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Backend API', status: backendStatus === 'online', color: C.green },
            { label: 'Odoo ERP', status: odooStatus === 'conectado', color: C.green },
            { label: 'Observium NOC', status: observiumStatus === 'conectado', color: C.green },
          ].map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: isMobile ? '7px 12px' : '6px 14px', borderRadius: 20,
              background: s.status ? 'rgba(0,200,150,0.06)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${s.status ? 'rgba(0,200,150,0.2)' : 'rgba(239,68,68,0.2)'}`,
              flex: isMobile ? '1 1 auto' : 'none',
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.status ? C.green : C.red, boxShadow: s.status ? `0 0 6px ${C.green}` : 'none', flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: s.status ? C.green : C.red, whiteSpace: 'nowrap' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? 8 : 10 }}>
        {ACCESOS.map(a => (
          <SectionBtn key={a.id} icon={a.icon} label={a.label} desc={a.desc} color={a.color} onClick={() => onNavigate(a.id)} />
        ))}
      </div>
    </div>
  );
}

// ─── Router por rol ───────────────────────────────────────────────────────────

export default function InicioRol({ theme, onNavigate, backendStatus, odooStatus, observiumStatus }: Props) {
  const { user } = useAuth();
  const rol = user?.rol ?? 'readonly';

  // Sync shared C palette with current theme so all sub-components inherit it
  C.card    = theme.card;
  C.border  = theme.border;
  C.dim     = theme.dim;
  C.text    = theme.text;
  C.textSub = theme.text;
  C.rowBg   = theme.bg;

  if (rol === 'admin' || rol === 'director' || rol === 'comercial')
    return <HomeDirector onNavigate={onNavigate} />;

  if (rol === 'tecnico' || rol === 'academico')
    return <HomeTecnico nombreTecnico={user?.nombre ?? ''} onNavigate={onNavigate} />;

  if (rol === 'noc')
    return <HomeNOC onNavigate={onNavigate} />;

  if (rol === 'wfm')
    return <HomeWFM onNavigate={onNavigate} />;

  return <HomeGenerico onNavigate={onNavigate} backendStatus={backendStatus} odooStatus={odooStatus} observiumStatus={observiumStatus} />;
}
