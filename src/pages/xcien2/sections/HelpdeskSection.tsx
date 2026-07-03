import { useState, useEffect, useCallback } from 'react';
import { Headphones, RefreshCw, AlertTriangle, Clock, CheckCircle, TrendingUp, ChevronDown } from 'lucide-react';

interface Equipo  { id: number; name: string; total: number }
interface Ticket  {
  id: number; name: string; equipo: string; etapa: string;
  cliente: string; agente: string; tipo: string;
  prioridad: string; prioridad_n: number; kanban: string;
  sla_vencido: boolean; sla_deadline: string; creado: string;
  horas_cierre: number | null;
}
interface Resumen {
  total: number; urgentes: number; sla_vencidos: number;
  creados_hoy: number; resueltos: number; abiertos: number;
}

const PRIORIDAD_COLOR: Record<string, string> = {
  'Normal':      '#6b7280',
  'Urgente':     '#f59e0b',
  'Muy urgente': '#ef4444',
  'Bloqueante':  '#7c3aed',
};

export default function HelpdeskSection() {
  const [equipos,    setEquipos]  = useState<Equipo[]>([]);
  const [resumen,    setResumen]  = useState<Resumen | null>(null);
  const [tickets,    setTickets]  = useState<Ticket[]>([]);
  const [total,      setTotal]    = useState(0);
  const [teamId,     setTeamId]   = useState<number | null>(null);
  const [teamName,   setTeamName] = useState('Todos los equipos');
  const [loading,    setLoading]  = useState(false);
  const [page,       setPage]     = useState(0);
  const [showDrop,   setShowDrop] = useState(false);
  const LIMIT = 50;

  const fetchEquipos = useCallback(async () => {
    const r = await fetch('/api/helpdesk/equipos');
    if (r.ok) setEquipos(await r.json());
  }, []);

  const fetchResumen = useCallback(async (tid: number | null) => {
    const q = tid ? `?team_id=${tid}` : '';
    const r = await fetch(`/api/helpdesk/resumen${q}`);
    if (r.ok) setResumen(await r.json());
  }, []);

  const fetchTickets = useCallback(async (tid: number | null, p: number) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(LIMIT), offset: String(p * LIMIT) });
    if (tid) params.set('team_id', String(tid));
    const r = await fetch(`/api/helpdesk/tickets?${params}`);
    if (r.ok) {
      const d = await r.json();
      setTickets(d.tickets);
      setTotal(d.total);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEquipos();
  }, [fetchEquipos]);

  useEffect(() => {
    setPage(0);
    fetchResumen(teamId);
    fetchTickets(teamId, 0);
  }, [teamId, fetchResumen, fetchTickets]);

  const selectTeam = (id: number | null, name: string) => {
    setTeamId(id);
    setTeamName(name);
    setShowDrop(false);
  };

  const refresh = () => {
    fetchResumen(teamId);
    fetchTickets(teamId, page);
  };

  const kpis = resumen ? [
    { label: 'Total activos',  value: resumen.total,       icon: <Headphones size={16}/>, color: '#00A859' },
    { label: 'Abiertos',       value: resumen.abiertos,    icon: <Clock size={16}/>,      color: '#3b82f6' },
    { label: 'Urgentes',       value: resumen.urgentes,    icon: <AlertTriangle size={16}/>, color: '#f59e0b' },
    { label: 'SLA vencidos',   value: resumen.sla_vencidos,icon: <AlertTriangle size={16}/>, color: '#ef4444' },
    { label: 'Creados hoy',    value: resumen.creados_hoy, icon: <TrendingUp size={16}/>, color: '#a855f7' },
    { label: 'Resueltos',      value: resumen.resueltos,   icon: <CheckCircle size={16}/>, color: '#10b981' },
  ] : [];

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:700, color:'#f9fafb' }}>
            <Headphones size={18} style={{ marginRight:8, verticalAlign:'middle', color:'#00A859' }}/>
            Mesa de Ayuda — Helpdesk
          </h2>
          <div style={{ color:'#6b7280', fontSize:11, marginTop:3 }}>
            Odoo wispi17 · {teamName}
          </div>
        </div>
        <button onClick={refresh} style={{
          background:'#111827', border:'1px solid #374151', borderRadius:6,
          color:'#9ca3af', padding:'6px 12px', cursor:'pointer', display:'flex',
          alignItems:'center', gap:5, fontSize:11,
        }}>
          <RefreshCw size={12}/> Actualizar
        </button>
      </div>

      {/* Selector de equipo */}
      <div style={{ position:'relative', marginBottom:20, display:'inline-block' }}>
        <button onClick={() => setShowDrop(d => !d)} style={{
          background:'#111827', border:'1px solid #374151', borderRadius:8,
          color:'#e5e7eb', padding:'8px 16px', cursor:'pointer',
          display:'flex', alignItems:'center', gap:8, fontSize:12, fontFamily:'monospace',
        }}>
          <Headphones size={13} color="#00A859"/>
          {teamName}
          <ChevronDown size={13}/>
        </button>
        {showDrop && (
          <div style={{
            position:'absolute', top:'110%', left:0, zIndex:100,
            background:'#111827', border:'1px solid #374151', borderRadius:8,
            boxShadow:'0 8px 24px #000a', minWidth:260, maxHeight:340, overflowY:'auto',
          }}>
            <div onClick={() => selectTeam(null,'Todos los equipos')} style={{
              padding:'8px 14px', cursor:'pointer', fontSize:11,
              color: teamId===null ? '#00A859' : '#9ca3af',
              borderBottom:'1px solid #1f2937',
            }}>
              Todos los equipos
            </div>
            {equipos.map(e => (
              <div key={e.id} onClick={() => selectTeam(e.id, e.name)} style={{
                padding:'8px 14px', cursor:'pointer', fontSize:11,
                color: teamId===e.id ? '#00A859' : '#9ca3af',
                display:'flex', justifyContent:'space-between',
                borderBottom:'1px solid #0d1117',
              }}>
                <span>{e.name}</span>
                <span style={{ color:'#4b5563' }}>{e.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      {resumen && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:24 }}>
          {kpis.map(k => (
            <div key={k.label} style={{
              background:'#111827', border:`1px solid ${k.color}33`,
              borderRadius:8, padding:'14px 16px',
            }}>
              <div style={{ color:k.color, marginBottom:6 }}>{k.icon}</div>
              <div style={{ fontSize:24, fontWeight:700, color:'#f9fafb' }}>
                {k.value.toLocaleString()}
              </div>
              <div style={{ fontSize:10, color:'#6b7280', marginTop:2 }}>{k.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabla tickets */}
      <div style={{ background:'#111827', border:'1px solid #1f2937', borderRadius:10, overflow:'hidden' }}>
        <div style={{
          padding:'12px 16px', borderBottom:'1px solid #1f2937',
          display:'flex', justifyContent:'space-between', alignItems:'center',
        }}>
          <span style={{ fontSize:13, fontWeight:600, color:'#f9fafb' }}>
            Tickets — {total.toLocaleString()} registros
          </span>
          <div style={{ display:'flex', gap:8 }}>
            <button
              disabled={page === 0}
              onClick={() => { const p = page-1; setPage(p); fetchTickets(teamId,p); }}
              style={{ background:'#0d1117', border:'1px solid #374151', borderRadius:4,
                color: page===0 ? '#374151':'#9ca3af', padding:'4px 10px', cursor:page===0?'default':'pointer', fontSize:11 }}
            >← Ant</button>
            <span style={{ fontSize:11, color:'#6b7280', lineHeight:'26px' }}>
              {page+1} / {Math.ceil(total/LIMIT) || 1}
            </span>
            <button
              disabled={(page+1)*LIMIT >= total}
              onClick={() => { const p = page+1; setPage(p); fetchTickets(teamId,p); }}
              style={{ background:'#0d1117', border:'1px solid #374151', borderRadius:4,
                color:(page+1)*LIMIT>=total?'#374151':'#9ca3af', padding:'4px 10px',
                cursor:(page+1)*LIMIT>=total?'default':'pointer', fontSize:11 }}
            >Sig →</button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'#4b5563' }}>Cargando...</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr style={{ background:'#0d1117', color:'#6b7280' }}>
                  {['ID','Asunto','Cliente','Equipo','Etapa','Agente','Prioridad','SLA','Creado'].map(h => (
                    <th key={h} style={{ padding:'8px 10px', textAlign:'left', fontWeight:600,
                      borderBottom:'1px solid #1f2937', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom:'1px solid #0d1117',
                    background: i%2===0 ? '#111827' : '#0f1720' }}>
                    <td style={{ padding:'7px 10px', color:'#4b5563' }}>#{t.id}</td>
                    <td style={{ padding:'7px 10px', color:'#e5e7eb', maxWidth:220,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                      title={t.name}>{t.name}</td>
                    <td style={{ padding:'7px 10px', color:'#9ca3af', maxWidth:160,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                      title={t.cliente}>{t.cliente}</td>
                    <td style={{ padding:'7px 10px', color:'#9ca3af', whiteSpace:'nowrap' }}>{t.equipo}</td>
                    <td style={{ padding:'7px 10px' }}>
                      <span style={{ background:'#1f2937', borderRadius:4,
                        padding:'2px 8px', color:'#d1d5db', fontSize:10 }}>{t.etapa}</span>
                    </td>
                    <td style={{ padding:'7px 10px', color:'#9ca3af', whiteSpace:'nowrap' }}>{t.agente}</td>
                    <td style={{ padding:'7px 10px' }}>
                      <span style={{
                        color: PRIORIDAD_COLOR[t.prioridad] || '#6b7280',
                        fontWeight: t.prioridad_n > 0 ? 700 : 400,
                      }}>{t.prioridad}</span>
                    </td>
                    <td style={{ padding:'7px 10px' }}>
                      {t.sla_vencido
                        ? <span style={{ color:'#ef4444', fontWeight:700 }}>⚠ Vencido</span>
                        : <span style={{ color:'#10b981' }}>✓ OK</span>}
                    </td>
                    <td style={{ padding:'7px 10px', color:'#6b7280', whiteSpace:'nowrap' }}>
                      {t.creado.slice(0,16)}
                    </td>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr><td colSpan={9} style={{ padding:32, textAlign:'center', color:'#4b5563' }}>
                    Sin tickets para este filtro.
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
