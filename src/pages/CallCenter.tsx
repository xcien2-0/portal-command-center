import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, RefreshCw, AlertTriangle, Send, Clock, User,
         ChevronRight, Filter, Search, CheckCircle2, XCircle } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Ticket {
  id: number; name: string;
  equipo: string; equipo_id: number | null;
  etapa: string; etapa_id: number | null;
  cliente: string; agente: string; tipo: string;
  prioridad: string; prioridad_n: number;
  kanban: string; sla_vencido: boolean;
  sla_deadline: string; creado: string; horas_cierre: number | null;
}
interface Mensaje {
  id: number; autor: string; fecha: string; cuerpo: string; tipo: string;
}
interface TicketDetail {
  ticket: Ticket; descripcion: string; mensajes: Mensaje[];
}
interface Equipo { id: number; name: string; total: number }

// ── Palette ───────────────────────────────────────────────────────────────────
const BG   = '#0f1117';
const BG2  = '#161b27';
const BG3  = '#1a2035';
const BOR  = '#1e2535';
const G    = '#00c46a';
const DIM  = '#64748b';
const TXT  = '#e2e8f0';
const RED  = '#ef4444';
const AMB  = '#f59e0b';

const PRI_COLOR: Record<string, string> = {
  'Normal': DIM, 'Urgente': AMB, 'Muy urgente': '#f97316', 'Bloqueante': RED,
};
const KAN_COLOR: Record<string, string> = {
  normal: DIM, done: G, blocked: RED,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso.replace(' ','T')+'Z').getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2)  return 'ahora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h/24)}d`;
}

// ── Ticket Row ────────────────────────────────────────────────────────────────
function TicketRow({ t, active, onClick }: { t: Ticket; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'block', width: '100%', textAlign: 'left',
      padding: '10px 14px', borderBottom: `1px solid ${BOR}`,
      background: active ? 'rgba(0,196,106,0.08)' : 'transparent',
      boxShadow: active ? `inset 3px 0 0 ${G}` : 'none',
      cursor: 'pointer', border: 'none',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: active ? G : DIM, fontFamily: 'monospace' }}>
          #{t.id}
        </span>
        <span style={{ fontSize: 9, color: DIM }}>{timeAgo(t.creado)}</span>
      </div>
      <div style={{ fontSize: 12, color: TXT, fontWeight: 500, marginBottom: 4,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {t.name}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 9, color: PRI_COLOR[t.prioridad] || DIM, fontWeight: 600 }}>
          {t.prioridad}
        </span>
        <span style={{ fontSize: 9, color: DIM }}>·</span>
        <span style={{ fontSize: 9, color: DIM, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>
          {t.cliente}
        </span>
        {t.sla_vencido && (
          <span style={{ fontSize: 9, color: RED, fontWeight: 700 }}>SLA ✗</span>
        )}
      </div>
    </button>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function Bubble({ m }: { m: Mensaje }) {
  const isSystem = m.tipo === 'notification' || m.autor === 'Sistema';
  return (
    <div style={{ marginBottom: 12, padding: '8px 12px',
      background: isSystem ? 'transparent' : BG3,
      borderRadius: 8, border: isSystem ? 'none' : `1px solid ${BOR}`,
      borderLeft: isSystem ? `2px solid ${DIM}` : undefined,
    }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
        <User style={{ width: 12, height: 12, color: isSystem ? DIM : G }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: isSystem ? DIM : TXT }}>{m.autor}</span>
        <span style={{ fontSize: 9, color: DIM }}>{m.fecha?.slice(11,16) || ''}</span>
        <span style={{ fontSize: 9, color: DIM }}>{m.fecha?.slice(0,10) || ''}</span>
      </div>
      <p style={{ fontSize: 12, color: isSystem ? DIM : TXT, margin: 0, lineHeight: 1.6,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {m.cuerpo}
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CallCenter() {
  const [equipos, setEquipos]         = useState<Equipo[]>([]);
  const [teamId, setTeamId]           = useState<number | null>(null);
  const [tickets, setTickets]         = useState<Ticket[]>([]);
  const [total, setTotal]             = useState(0);
  const [offset, setOffset]           = useState(0);
  const [hasMore, setHasMore]         = useState(false);
  const PER_PAGE = 25;
  const [periodo, setPeriodo]         = useState('mes');
  const [search, setSearch]           = useState('');
  const [selected, setSelected]       = useState<number | null>(null);
  const [detail, setDetail]           = useState<TicketDetail | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);
  const [error, setError]             = useState('');
  const [respuesta, setRespuesta]     = useState('');
  const [postOk, setPostOk]           = useState(false);
  const msgEndRef = useRef<HTMLDivElement>(null);

  // Load teams
  useEffect(() => {
    fetch('/api/helpdesk/equipos')
      .then(r => r.json())
      .then(d => setEquipos(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Load tickets
  const loadTickets = useCallback(async (off = 0) => {
    setLoadingList(true);
    setError('');
    try {
      const params = new URLSearchParams({ periodo, limit: String(PER_PAGE), offset: String(off) });
      if (teamId) params.set('team_id', String(teamId));
      const r = await fetch(`/api/helpdesk/tickets?${params}`);
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      const list: Ticket[] = Array.isArray(d.tickets) ? d.tickets : [];
      setTickets(off === 0 ? list : prev => [...prev, ...list]);
      setTotal(d.total ?? 0);
      setHasMore(off + PER_PAGE < (d.total ?? 0));
      setOffset(off);
    } catch (e: any) {
      setError(e.message || 'Error cargando tickets');
    } finally {
      setLoadingList(false);
    }
  }, [teamId, periodo]);

  useEffect(() => { loadTickets(1); }, [loadTickets]);

  // Load detail
  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    setLoadingDetail(true);
    setPostOk(false);
    setRespuesta('');
    fetch(`/api/helpdesk/tickets/${selected}/mensajes`)
      .then(r => r.json())
      .then(d => { setDetail(d); setLoadingDetail(false); })
      .catch(e => { setError(String(e)); setLoadingDetail(false); });
  }, [selected]);

  useEffect(() => {
    if (detail) setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [detail]);

  // Post reply
  const postReply = async () => {
    if (!selected || !respuesta.trim()) return;
    setLoadingPost(true);
    try {
      const r = await fetch(`/api/helpdesk/tickets/${selected}/responder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: respuesta.trim(), agente: 'Agente XCIEN' }),
      });
      if (!r.ok) throw new Error(await r.text());
      setRespuesta('');
      setPostOk(true);
      setTimeout(() => setPostOk(false), 3000);
      // Reload detail
      const d2 = await fetch(`/api/helpdesk/tickets/${selected}/mensajes`).then(r2 => r2.json());
      setDetail(d2);
    } catch (e: any) {
      setError(e.message || 'Error enviando respuesta');
    } finally {
      setLoadingPost(false);
    }
  };

  const filtered = tickets.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.cliente.toLowerCase().includes(search.toLowerCase()) ||
    String(t.id).includes(search)
  );

  return (
    <div style={{ display: 'flex', height: '100%', background: BG, overflow: 'hidden' }}>

      {/* ── Left panel: ticket list ─────────────────────────────────────── */}
      <div style={{ width: 280, flexShrink: 0, borderRight: `1px solid ${BOR}`,
        display: 'flex', flexDirection: 'column', background: BG2 }}>

        {/* Filters */}
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${BOR}` }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <select value={teamId ?? ''} onChange={e => setTeamId(e.target.value ? Number(e.target.value) : null)}
              style={{ flex: 1, background: BG3, color: TXT, border: `1px solid ${BOR}`,
                borderRadius: 5, fontSize: 11, padding: '4px 6px' }}>
              <option value="">Todos los equipos</option>
              {equipos.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.name} ({eq.total})</option>
              ))}
            </select>
            <select value={periodo} onChange={e => setPeriodo(e.target.value)}
              style={{ background: BG3, color: TXT, border: `1px solid ${BOR}`,
                borderRadius: 5, fontSize: 11, padding: '4px 6px' }}>
              <option value="hoy">Hoy</option>
              <option value="semana">Semana</option>
              <option value="mes">Mes</option>
              <option value="90d">90 días</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Search style={{ width: 12, height: 12, color: DIM, flexShrink: 0 }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar ticket..."
              style={{ flex: 1, background: BG3, color: TXT, border: `1px solid ${BOR}`,
                borderRadius: 5, fontSize: 11, padding: '4px 6px', outline: 'none' }} />
            <button onClick={() => loadTickets(1)} title="Actualizar"
              style={{ background: 'none', border: 'none', color: G, cursor: 'pointer', padding: 2 }}>
              <RefreshCw style={{ width: 13, height: 13 }} className={loadingList ? 'animate-spin' : ''} />
            </button>
          </div>
          <div style={{ marginTop: 6, fontSize: 10, color: DIM }}>
            {total} ticket{total !== 1 ? 's' : ''} · Odoo helpdesk.ticket
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {error && (
            <div style={{ padding: 12, color: RED, fontSize: 11 }}>
              <AlertTriangle style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />
              {error}
            </div>
          )}
          {loadingList && filtered.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: DIM, fontSize: 12 }}>
              Cargando tickets Odoo…
            </div>
          )}
          {!loadingList && filtered.length === 0 && !error && (
            <div style={{ padding: 20, textAlign: 'center', color: DIM, fontSize: 12 }}>
              Sin tickets en el período
            </div>
          )}
          {filtered.map(t => (
            <TicketRow key={t.id} t={t} active={selected === t.id}
              onClick={() => setSelected(t.id)} />
          ))}
          {hasMore && (
            <button onClick={() => loadTickets(offset + PER_PAGE)} style={{
              display: 'block', width: '100%', padding: '10px',
              background: 'none', border: 'none', color: G,
              fontSize: 11, cursor: 'pointer',
            }}>
              Cargar más…
            </button>
          )}
        </div>
      </div>

      {/* ── Right panel: detail ──────────────────────────────────────────── */}
      {!selected ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 12, color: DIM }}>
          <MessageSquare style={{ width: 40, height: 40, opacity: 0.3 }} />
          <p style={{ fontSize: 13 }}>Selecciona un ticket para ver la conversación</p>
          <p style={{ fontSize: 11 }}>Datos reales de Odoo · helpdesk.ticket</p>
        </div>
      ) : loadingDetail ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: DIM }}>
          <RefreshCw className="animate-spin" style={{ width: 20, height: 20 }} />
        </div>
      ) : detail ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BOR}`, background: BG2, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: G, fontFamily: 'monospace', fontWeight: 700 }}>
                    #{detail.ticket.id}
                  </span>
                  <span style={{ fontSize: 10, color: PRI_COLOR[detail.ticket.prioridad] || DIM, fontWeight: 600 }}>
                    {detail.ticket.prioridad}
                  </span>
                  {detail.ticket.sla_vencido && (
                    <span style={{ fontSize: 9, color: RED, fontWeight: 700, background: 'rgba(239,68,68,0.12)',
                      padding: '1px 5px', borderRadius: 3 }}>SLA vencido</span>
                  )}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: TXT, marginBottom: 4,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {detail.ticket.name}
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 10, color: DIM, flexWrap: 'wrap' }}>
                  <span>Cliente: <b style={{ color: TXT }}>{detail.ticket.cliente}</b></span>
                  <span>Equipo: <b style={{ color: TXT }}>{detail.ticket.equipo}</b></span>
                  <span>Etapa: <b style={{ color: TXT }}>{detail.ticket.etapa}</b></span>
                  <span>Agente: <b style={{ color: TXT }}>{detail.ticket.agente}</b></span>
                  <span>
                    <Clock style={{ width: 9, height: 9, display: 'inline', marginRight: 2 }} />
                    {detail.ticket.creado}
                  </span>
                </div>
              </div>
            </div>
            {detail.descripcion && (
              <div style={{ marginTop: 8, fontSize: 11, color: DIM, background: BG,
                padding: '6px 10px', borderRadius: 5, borderLeft: `2px solid ${BOR}` }}>
                {detail.descripcion.slice(0, 300)}
              </div>
            )}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
            {detail.mensajes.length === 0 ? (
              <p style={{ color: DIM, fontSize: 12, textAlign: 'center', marginTop: 20 }}>
                Sin mensajes en este ticket
              </p>
            ) : (
              detail.mensajes.map(m => <Bubble key={m.id} m={m} />)
            )}
            <div ref={msgEndRef} />
          </div>

          {/* Reply box */}
          <div style={{ padding: '10px 16px', borderTop: `1px solid ${BOR}`, background: BG2, flexShrink: 0 }}>
            {postOk && (
              <div style={{ fontSize: 11, color: G, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle2 style={{ width: 12, height: 12 }} />
                Respuesta enviada a Odoo
              </div>
            )}
            {error && (
              <div style={{ fontSize: 11, color: RED, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <XCircle style={{ width: 12, height: 12 }} />
                {error}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <textarea
                value={respuesta}
                onChange={e => setRespuesta(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) postReply(); }}
                placeholder="Escribe tu respuesta… (Cmd+Enter para enviar)"
                rows={3}
                style={{ flex: 1, background: BG, color: TXT, border: `1px solid ${BOR}`,
                  borderRadius: 6, fontSize: 12, padding: '8px 10px', resize: 'none', outline: 'none',
                  fontFamily: 'inherit' }}
              />
              <button onClick={postReply} disabled={loadingPost || !respuesta.trim()}
                style={{ padding: '8px 14px', borderRadius: 6, border: 'none',
                  background: respuesta.trim() ? G : BOR, color: respuesta.trim() ? '#000' : DIM,
                  cursor: respuesta.trim() ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}>
                {loadingPost
                  ? <RefreshCw className="animate-spin" style={{ width: 14, height: 14 }} />
                  : <Send style={{ width: 14, height: 14 }} />
                }
                Enviar
              </button>
            </div>
            <div style={{ fontSize: 9, color: DIM, marginTop: 4 }}>
              Se publicará como comentario en Odoo helpdesk.ticket #{selected}
            </div>
          </div>

        </div>
      ) : null}
    </div>
  );
}
