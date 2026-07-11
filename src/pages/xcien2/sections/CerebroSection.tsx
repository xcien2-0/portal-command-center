import { useState, useEffect, useRef } from 'react';
import { ThemeConfig } from '../types';
import brand from '../../../brand';

interface Props { theme: ThemeConfig }

interface Provider {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: 'configured' | 'needs_key' | 'local' | 'online' | 'offline' | 'pending';
  models: string[];
  default_model: string;
  group?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
  agent_label?: string;
  route?: 'tars' | 'case' | 'both';
  ts: string;
}

const CONTEXT_MODULES = [
  { id: 'noc',        label: 'NOC / Alertas',     icon: '🖥️'  },
  { id: 'wfm',        label: 'Campo WFM',          icon: '🔧'  },
  { id: 'inventario', label: 'Inventario',         icon: '📦'  },
  { id: 'ventas',     label: 'Ventas / MRR',       icon: '💰'  },
  { id: 'rrhh',       label: 'RRHH',               icon: '👤'  },
  { id: 'incidentes', label: 'Incidentes activos', icon: '🚨'  },
];

type TabId = 'chat' | 'mapa';

// ── Mapa de Sistemas ─────────────────────────────────────────────────────────

interface SysNode {
  id: string; label: string; sub: string;
  status: 'ok' | 'warn' | 'err'; icon: string;
  r: number; ring: number; angle: number; detail: string;
}

const SYS_NODES: SysNode[] = [
  { id:'portal',    label:'XCIEN\nPortal',    sub:'localhost:8080',   status:'ok',   icon:'⚡', r:38, ring:0, angle:0,   detail:'React 18 + FastAPI · 100+ endpoints activos' },
  { id:'backend',   label:'Backend\nFastAPI', sub:':8002',            status:'ok',   icon:'⚙️', r:26, ring:1, angle:90,  detail:'servidor_academia.py · 8300+ líneas' },
  { id:'kmz',       label:'KMZ\n29 capas',    sub:'backend/static/',  status:'ok',   icon:'🗺️', r:22, ring:1, angle:160, detail:'Rutas fibra óptica · GeoJSON mapa de red' },
  { id:'odoo',      label:'Odoo\nwispi17',    sub:'odoo.wispi.mx',    status:'ok',   icon:'🗄️', r:30, ring:2, angle:0,   detail:'ERP Central · 12 modelos · 117K tickets' },
  { id:'nocboard',  label:'NOCBoard',         sub:':9400',            status:'ok',   icon:'📟', r:26, ring:2, angle:50,  detail:'v3.9.6 · 76 hosts · 29 SNMP energía' },
  { id:'telegram',  label:'Telegram\nBot',    sub:'api.telegram.org', status:'ok',   icon:'✈️', r:26, ring:2, angle:105, detail:'@jmmc2026_bot · @xcien_nocboard_bot' },
  { id:'anthropic', label:'IA\nClaude',       sub:'sonnet-4-6',       status:'ok',   icon:'🧠', r:26, ring:2, angle:155, detail:'5 agentes IA · Director · Comité ejecutivo' },
  { id:'syscom',    label:'Syscom\nAPI',      sub:'OAuth2',           status:'ok',   icon:'🛍️', r:24, ring:2, angle:210, detail:'Catálogo distribuidora · 60 req/min' },
  { id:'observium', label:'Observium',        sub:'TIMEOUT',          status:'warn', icon:'📡', r:24, ring:2, angle:255, detail:'Proxy activo · credenciales posiblemente expiradas' },
  { id:'uisp',      label:'UISP',             sub:'502',              status:'warn', icon:'🔗', r:24, ring:2, angle:295, detail:'xcien.uisp.com · token guardado · posible VPN' },
  { id:'tn360',     label:'TN360\nGPS',       sub:'400',              status:'warn', icon:'🚚', r:24, ring:2, angle:335, detail:'Flotilla vehicular · auth posiblemente expirada' },
  { id:'gcal',      label:'Google\nCalendar', sub:'Sin token',        status:'err',  icon:'📅', r:22, ring:2, angle:20,  detail:'Sala de juntas · requiere re-autorizar OAuth2' },
];

const SYS_EDGES: [string, string, 'solid' | 'dashed' | 'inactive'][] = [
  ['portal','backend','solid'],   ['portal','odoo','solid'],      ['portal','nocboard','solid'],
  ['portal','telegram','solid'],  ['portal','anthropic','solid'], ['portal','syscom','solid'],
  ['portal','observium','dashed'],['portal','uisp','dashed'],     ['portal','tn360','dashed'],
  ['portal','gcal','inactive'],   ['portal','kmz','solid'],
  ['backend','odoo','solid'],     ['backend','telegram','solid'],
];

const SYS_STATUS_HEX = { ok: '#22C55E', warn: '#F59E0B', err: '#EF4444' };

const WFM_LANES = [
  { label: 'NOC / Ing.',  color: '#38BDF8', states: [
    { name: 'SOLICITUD\nPREVENTA', count: '~28',   crit: false, note: '' },
    { name: 'ANTE-\nPROYECTO',    count: '135 🔴', crit: true,  note: 'cuello de botella' },
  ]},
  { label: 'Almacén',     color: '#F97316', states: [
    { name: 'ALMACÉN\nVALID.',    count: '~22',   crit: false, note: '' },
    { name: 'ESPERA\nALMACÉN',    count: '57 ⏸',  crit: false, note: 'Odoo stock' },
    { name: 'ESPERA\nINVENT.',    count: '~11',   crit: false, note: '' },
  ]},
  { label: 'Operaciones', color: '#A78BFA', states: [
    { name: 'ORDEN\nIMPL.',       count: '~40',   crit: false, note: '' },
    { name: 'APROVIS.',           count: '~18',   crit: false, note: '' },
    { name: 'REVISIÓN\nPM',       count: '~9',    crit: false, note: '' },
  ]},
  { label: 'Campo',       color: '#22C55E', states: [
    { name: 'LISTO\nINSTALL.',    count: '~30',   crit: false, note: '' },
    { name: 'INSTA-\nLACIÓN',    count: '~47 🟡', crit: false, note: '' },
    { name: 'NOC\nVALID.',        count: '~15',   crit: false, note: '' },
  ]},
  { label: 'Finanzas',    color: '#F59E0B', states: [
    { name: 'FACTU-\nRACIÓN',    count: '~12',   crit: false, note: '' },
    { name: 'CERRADO',            count: '✓',     crit: false, note: '' },
  ]},
];

function MapaSistemasView({ theme }: { theme: ThemeConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);
  const tipRef    = useRef<{ x: number; y: number; node: SysNode } | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: SysNode } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    let frameId = 0;

    function resize() {
      const w = wrap!.clientWidth, h = wrap!.clientHeight;
      canvas!.width = w * dpr; canvas!.height = h * dpr;
      canvas!.style.width = w + 'px'; canvas!.style.height = h + 'px';
    }

    function npos(n: SysNode, W: number, H: number) {
      const R = [0, Math.min(W, H) * 0.2, Math.min(W, H) * 0.41];
      if (n.ring === 0) return { x: W / 2, y: H / 2 };
      const rad = (n.angle - 90) * Math.PI / 180;
      return { x: W / 2 + Math.cos(rad) * R[n.ring], y: H / 2 + Math.sin(rad) * R[n.ring] };
    }

    function rgb(hex: string) {
      return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
    }

    function draw(t: number) {
      const ctx = canvas!.getContext('2d')!;
      const W = canvas!.width / dpr, H = canvas!.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const dark = document.documentElement.getAttribute('data-theme') !== 'light';
      const textCol = dark ? '#BDD0E8' : '#1A2B40';
      const dimCol  = dark ? '#4E6A88' : '#64748B';
      const bgFill  = dark ? '#0E1B2C' : '#FFFFFF';

      SYS_EDGES.forEach(([a, b, style], idx) => {
        const na = SYS_NODES.find(n => n.id === a)!, nb = SYS_NODES.find(n => n.id === b)!;
        const pa = npos(na, W, H), pb = npos(nb, W, H);
        const r = rgb(SYS_STATUS_HEX[nb.status]);
        ctx.save(); ctx.setLineDash([]);
        if (style === 'solid') {
          ctx.strokeStyle = `rgba(${r},0.3)`; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
          const p = ((t * 0.0008 + idx * 0.13) % 1);
          ctx.beginPath(); ctx.arc(pa.x+(pb.x-pa.x)*p, pa.y+(pb.y-pa.y)*p, 2.5, 0, Math.PI*2);
          ctx.fillStyle = `rgba(${r},0.85)`; ctx.fill();
        } else if (style === 'dashed') {
          ctx.strokeStyle = `rgba(${rgb('#F59E0B')},0.28)`; ctx.lineWidth = 1; ctx.setLineDash([5,5]);
          ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        } else {
          ctx.strokeStyle = `rgba(${rgb('#EF4444')},0.15)`; ctx.lineWidth = 1; ctx.setLineDash([3,8]);
          ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        }
        ctx.restore();
      });

      SYS_NODES.forEach(n => {
        const p = npos(n, W, H);
        const col = SYS_STATUS_HEX[n.status];
        const r = rgb(col);
        const hov = tipRef.current?.node.id === n.id;
        const rr = n.r + (hov ? 3 : 0);
        const grd = ctx.createRadialGradient(p.x,p.y,rr*0.3, p.x,p.y,rr*1.9);
        grd.addColorStop(0, `rgba(${r},${hov?0.2:0.09})`); grd.addColorStop(1, `rgba(${r},0)`);
        ctx.beginPath(); ctx.arc(p.x,p.y,rr*1.9,0,Math.PI*2); ctx.fillStyle=grd; ctx.fill();
        ctx.beginPath(); ctx.arc(p.x,p.y,rr,0,Math.PI*2);
        ctx.fillStyle=bgFill; ctx.fill();
        ctx.strokeStyle=`rgba(${r},${hov?0.9:0.55})`; ctx.lineWidth=hov?2.5:1.5; ctx.stroke();
        if (n.id==='portal') {
          const pulse=0.6+0.4*Math.sin(t*0.002);
          ctx.beginPath(); ctx.arc(p.x,p.y,rr+7,0,Math.PI*2);
          ctx.strokeStyle=`rgba(0,168,89,${0.12+0.07*pulse})`; ctx.lineWidth=1;
          ctx.setLineDash([]); ctx.stroke();
        }
        ctx.font=`${Math.round(rr*0.7)}px serif`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(n.icon, p.x, p.y-(n.ring===0?5:3));
        ctx.beginPath(); ctx.arc(p.x+rr*0.65,p.y-rr*0.65,5,0,Math.PI*2);
        ctx.fillStyle=col; ctx.fill(); ctx.strokeStyle=bgFill; ctx.lineWidth=1.5; ctx.stroke();
        const lines=n.label.split('\n'); const fs=n.ring===0?12:10;
        ctx.font=`${n.ring===0?700:600} ${fs}px system-ui,sans-serif`;
        ctx.textAlign='center'; ctx.textBaseline='top';
        const ly=p.y+rr+5;
        lines.forEach((line,i)=>{ ctx.fillStyle=hov?col:textCol; ctx.fillText(line,p.x,ly+i*(fs+2)); });
        if (n.ring>0) { ctx.font=`${fs-2}px system-ui,sans-serif`; ctx.fillStyle=dimCol; ctx.fillText(n.sub,p.x,ly+lines.length*(fs+2)); }
      });
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const t0 = performance.now();
    const loop = () => { draw(performance.now()-t0); frameId=requestAnimationFrame(loop); };
    frameId = requestAnimationFrame(loop);
    const onMove = (e: MouseEvent) => {
      const rect = canvas!.getBoundingClientRect();
      const mx=e.clientX-rect.left, my=e.clientY-rect.top;
      const W=wrap!.clientWidth, H=wrap!.clientHeight;
      const found = SYS_NODES.find(n=>{ const p=npos(n,W,H); return Math.hypot(mx-p.x,my-p.y)<n.r+12; })??null;
      canvas!.style.cursor = found?'pointer':'default';
      const val = found?{x:e.clientX,y:e.clientY,node:found}:null;
      tipRef.current=val; setTooltip(val);
    };
    const onLeave = () => { tipRef.current=null; setTooltip(null); };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    return () => { cancelAnimationFrame(frameId); ro.disconnect(); canvas.removeEventListener('mousemove',onMove); canvas.removeEventListener('mouseleave',onLeave); };
  }, []);

  return (
    <div className="flex flex-col flex-1 overflow-y-auto min-h-0">
      <div ref={wrapRef} className="relative flex-shrink-0" style={{ height: 360, borderBottom: `1px solid ${theme.border}` }}>
        <canvas ref={canvasRef} style={{ display:'block', width:'100%', height:'100%' }} />
        {tooltip && (
          <div className="fixed z-50 pointer-events-none rounded-lg px-3 py-2"
               style={{ left: tooltip.x+14, top: tooltip.y-10, background: theme.card,
                        border:`1px solid ${theme.border}`, boxShadow:'0 8px 24px rgba(0,0,0,.35)', maxWidth:210 }}>
            <div className="font-bold text-sm mb-1" style={{ color: theme.text }}>
              {tooltip.node.label.replace('\n',' ')}
            </div>
            <div className="font-mono text-xs" style={{ color: SYS_STATUS_HEX[tooltip.node.status] }}>
              {tooltip.node.status==='ok'?'✓ CONECTADO':tooltip.node.status==='warn'?'⚠ DEGRADADO':'✗ SIN CONEXIÓN'}{' · '}{tooltip.node.sub}
            </div>
            <div className="text-xs mt-1" style={{ color: theme.dim }}>{tooltip.node.detail}</div>
          </div>
        )}
      </div>

      <div className="p-4 flex-shrink-0">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: theme.dim }}>
          Pipeline WFM — responsable por área
        </p>
        <div className="rounded-lg overflow-hidden border" style={{ borderColor: theme.border, minWidth: 580 }}>
          {WFM_LANES.map((lane, li) => (
            <div key={lane.label} className="flex items-stretch"
                 style={{ borderBottom: li < WFM_LANES.length-1 ? `1px solid ${theme.border}` : undefined }}>
              <div className="flex-shrink-0 flex items-center px-3 py-2 text-[11px] font-bold border-r w-24"
                   style={{ color:lane.color, borderColor:theme.border, background:theme.surface, borderLeft:`3px solid ${lane.color}` }}>
                {lane.label}
              </div>
              <div className="flex items-center gap-2 px-3 py-2 flex-1 overflow-x-auto" style={{ background:theme.card }}>
                {lane.states.map((s, si) => (
                  <div key={s.name} className="flex items-center gap-2">
                    {si>0 && <span style={{ color:theme.dim }}>→</span>}
                    <div className="flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-1.5 rounded text-center"
                         style={{ border:`1px solid ${s.crit?'#EF4444':lane.color}55`,
                                  background:s.crit?'rgba(239,68,68,0.1)':`${lane.color}12`,
                                  minWidth:70, animation:s.crit?'wcPulse 2s ease-in-out infinite':undefined }}>
                      <span className="text-[10px] font-bold leading-tight whitespace-pre"
                            style={{ color:s.crit?'#EF4444':lane.color }}>{s.name}</span>
                      <span className="font-mono text-[11px] font-bold"
                            style={{ color:s.crit?'#EF4444':lane.color }}>{s.count}</span>
                      {s.note && <span className="text-[9px] font-semibold uppercase tracking-wide"
                                       style={{ color:s.crit?'#EF4444':theme.dim }}>{s.note}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes wcPulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.35)}50%{box-shadow:0 0 0 8px rgba(239,68,68,0)}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  configured: '#22c55e',
  online:     '#22c55e',
  local:      '#a78bfa',
  needs_key:  '#f59e0b',
  offline:    '#6b7280',
  pending:    '#6b7280',
};

const STATUS_LABEL: Record<string, string> = {
  configured: 'Listo',
  online:     'Online',
  local:      'Local',
  needs_key:  'Falta key',
  offline:    'Offline',
  pending:    'Pendiente',
};

function uid() { return Math.random().toString(36).slice(2); }
function fmtTime(ts: string) {
  try { return new Date(ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

export default function CerebroSection({ theme }: Props) {
  const G = theme.accent;
  const [providers, setProviders] = useState<Record<string, Provider>>({});
  const [activeProvider, setActiveProvider] = useState('ollama');
  const [activeModel, setActiveModel] = useState('llama3.2:3b');
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [showConfig, setShowConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch('/api/cerebro/providers')
      .then(r => r.json())
      .then(data => {
        setProviders(data);
        // Auto-select first available provider (preferring claude, then antigravity, then any available)
        const preferred = ['claude', 'antigravity', 'case', 'ollama'];
        const avail = preferred.find(id => data[id] &&
          !['pending', 'offline', 'needs_key'].includes(data[id].status));
        const pick = avail || Object.keys(data)[0];
        if (pick && data[pick]) {
          setActiveProvider(pick);
          setActiveModel(data[pick].default_model || data[pick].models[0] || '');
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const selectProvider = (id: string) => {
    const prov = providers[id];
    if (!prov || prov.status === 'pending' || prov.status === 'offline') return;
    setActiveProvider(id);
    setActiveModel(prov.default_model || prov.models[0] || '');
  };

  const toggleModule = (id: string) => {
    setActiveModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: uid(), role: 'user', content: text, ts: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const r = await fetch('/api/cerebro/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          provider: activeProvider,
          model: activeModel,
          context_modules: activeModules,
          history,
          temperature,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({ detail: r.statusText }));
        throw new Error(err.detail || 'Error del servidor');
      }
      const data = await r.json();
      setMessages(prev => [...prev, {
        id: uid(), role: 'assistant',
        content: data.response,
        provider: data.provider,
        model: data.model,
        agent_label: data.agent_label,
        route: data.route,
        ts: new Date().toISOString(),
      }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setMessages(prev => [...prev, {
        id: uid(), role: 'assistant',
        content: `⚠️ Error: ${msg}`,
        ts: new Date().toISOString(),
      }]);
    }
    setLoading(false);
  };

  const prov = providers[activeProvider];
  const provList = Object.values(providers);

  // Group providers for sidebar display
  const GROUP_ORDER = ['Agentes XCIEN', 'Local', 'Cloud'];
  const grouped = GROUP_ORDER.map(g => ({
    group: g,
    items: provList.filter(p => (p.group || 'Cloud') === g),
  })).filter(g => g.items.length > 0);

  return (
    <div className="flex flex-col h-full" style={{ maxHeight: 'calc(100vh - 100px)' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
           style={{ borderColor: theme.border }}>
        <div>
          <h1 style={{ color: G }} className="text-xl font-bold leading-tight">
            🧠 Supercerebro Contextual
          </h1>
          <p style={{ color: theme.dim }} className="text-xs">
            Multi-proveedor · contexto operativo {brand.name} en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeModules.length > 0 && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: `${G}22`, color: G }}>
              {activeModules.length} módulo{activeModules.length > 1 ? 's' : ''} activo{activeModules.length > 1 ? 's' : ''}
            </span>
          )}
          <button onClick={() => setShowConfig(v => !v)}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.dim }}>
            ⚙️ Config
          </button>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])}
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.dim }}>
              ✕ Limpiar
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b flex-shrink-0 px-5" style={{ borderColor: theme.border }}>
        {(['chat', 'mapa'] as TabId[]).map(id => {
          const label = id === 'chat' ? '💬 Chat' : '🗺️ Mapa de Sistemas';
          return (
            <button key={id} onClick={() => setActiveTab(id)}
                    className="px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors"
                    style={{ borderBottomColor: activeTab === id ? G : 'transparent',
                             color: activeTab === id ? G : theme.dim, background: 'transparent' }}>
              {label}
            </button>
          );
        })}
      </div>

      {activeTab === 'mapa' && <MapaSistemasView theme={theme} />}
      {activeTab === 'chat' && <div className="flex flex-1 min-h-0">

        {/* ── Left panel: providers + modules ── */}
        <div className="flex-shrink-0 flex flex-col gap-3 p-3 border-r overflow-y-auto"
             style={{ width: 220, borderColor: theme.border, background: theme.sidebar }}>

          {/* Providers — grouped */}
          <div className="space-y-3">
            {grouped.length === 0 && (
              <div style={{ color: theme.dim, fontSize: 11, textAlign: 'center', padding: '20px 8px', lineHeight: 1.5 }}>
                Cargando proveedores…<br/>
                <span style={{ fontSize: 10 }}>Verifica que el backend esté activo</span>
              </div>
            )}
            {grouped.map(({ group, items }) => (
              <div key={group}>
                <p style={{ color: theme.dim }}
                   className="text-[9px] font-semibold uppercase tracking-widest mb-1.5 px-1">
                  {group}
                </p>
                <div className="space-y-0.5">
                  {items.map(p => {
                    const disabled = p.status === 'pending' || p.status === 'offline' || p.status === 'needs_key';
                    const active = activeProvider === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => selectProvider(p.id)}
                        disabled={disabled}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all"
                        style={{
                          background: active ? `${G}22` : 'transparent',
                          border: `1px solid ${active ? G : 'transparent'}`,
                          opacity: disabled ? 0.4 : 1,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                        }}
                        title={disabled && p.status === 'needs_key'
                          ? `${p.description} — Configura la API key en .env`
                          : p.description}
                      >
                        <span className="text-sm flex-shrink-0">{p.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div style={{ color: active ? G : theme.text }}
                               className="text-[11px] font-semibold truncate leading-tight">{p.name}</div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                  style={{ background: STATUS_COLOR[p.status] || '#6b7280' }} />
                            <span style={{ color: theme.dim }} className="text-[9px]">
                              {STATUS_LABEL[p.status] || p.status}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Context modules */}
          <div>
            <p style={{ color: theme.dim }} className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-1">
              Contexto
            </p>
            <div className="space-y-1">
              {CONTEXT_MODULES.map(m => {
                const on = activeModules.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleModule(m.id)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-all"
                    style={{
                      background: on ? `${G}15` : 'transparent',
                      border: `1px solid ${on ? `${G}44` : 'transparent'}`,
                    }}
                  >
                    <span className="text-sm">{m.icon}</span>
                    <span style={{ color: on ? theme.text : theme.dim }}
                          className="text-xs truncate">{m.label}</span>
                    {on && <span style={{ color: G }} className="ml-auto text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
            {activeModules.length > 0 && (
              <button onClick={() => setActiveModules([])}
                      className="text-[10px] mt-2 px-3 w-full text-center"
                      style={{ color: theme.dim }}>
                Desactivar todos
              </button>
            )}
          </div>

          {/* Config panel */}
          {showConfig && (
            <div className="border-t pt-3" style={{ borderColor: theme.border }}>
              <p style={{ color: theme.dim }} className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-1">
                Configuración
              </p>

              {prov && prov.models.length > 0 && (
                <div className="mb-3">
                  <label style={{ color: theme.dim }} className="text-[10px] block mb-1 px-1">Modelo</label>
                  <select
                    value={activeModel}
                    onChange={e => setActiveModel(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 rounded-lg outline-none"
                    style={{ background: theme.bg, border: `1px solid ${theme.border}`, color: theme.text }}
                  >
                    {prov.models.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ color: theme.dim }} className="text-[10px] block mb-1 px-1">
                  Temperatura: {temperature.toFixed(1)}
                </label>
                <input
                  type="range" min="0" max="1" step="0.1"
                  value={temperature}
                  onChange={e => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                  style={{ accentColor: G }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Chat area ── */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-5xl mb-4">🧠</div>
                <p style={{ color: theme.text }} className="text-lg font-semibold mb-1">
                  Supercerebro listo
                </p>
                <p style={{ color: theme.dim }} className="text-sm max-w-sm">
                  Selecciona un proveedor, activa los módulos de contexto que necesitas y haz tu primera pregunta.
                </p>
                <div className="mt-5 space-y-3 w-full max-w-lg">
                  {[
                    { label: '🖥️ TARS — Operativo', color: '#60a5fa', border: '#1d4ed8', bg: '#1e3a5f',
                      qs: ['¿Qué tickets están abiertos hoy?', '¿Hay sitios caídos ahora?', 'Muestra el backlog de cuadrillas'] },
                    { label: '🤖 CASE — Análisis', color: '#4ade80', border: '#16a34a', bg: '#1a2e1a',
                      qs: ['¿Cuál es la tendencia de cumplimiento SLA?', '¿Qué ciudades tienen más reincidencias?', 'Genera un reporte ejecutivo de campo'] },
                    { label: '⚡ Auto (TARS+CASE)', color: '#c084fc', border: '#7c3aed', bg: '#2d1a4a',
                      qs: ['¿Qué está pasando con el NOC y qué debería priorizarse?'] },
                  ].map(({ label, color, border, bg, qs }) => (
                    <div key={label}>
                      <p className="text-[10px] font-semibold mb-1.5 px-1"
                         style={{ color }}>{label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {qs.map(q => (
                          <button key={q}
                            onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                            className="text-[11px] px-3 py-1 rounded-full"
                            style={{ background: bg, color, border: `1px solid ${border}` }}>
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="max-w-[75%] rounded-2xl px-4 py-3"
                  style={{
                    background: msg.role === 'user' ? `${G}22` : theme.card,
                    border: `1px solid ${msg.role === 'user' ? `${G}44` : theme.border}`,
                  }}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      {msg.agent_label ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                              style={{
                                background: msg.route === 'tars' ? '#1e3a5f' :
                                            msg.route === 'case' ? '#1a2e1a' :
                                            msg.route === 'both' ? '#2d1a4a' : `${G}15`,
                                color: msg.route === 'tars' ? '#60a5fa' :
                                       msg.route === 'case' ? '#4ade80' :
                                       msg.route === 'both' ? '#c084fc' : G,
                                border: `1px solid ${
                                  msg.route === 'tars' ? '#1d4ed8' :
                                  msg.route === 'case' ? '#16a34a' :
                                  msg.route === 'both' ? '#7c3aed' : `${G}44`}`,
                              }}>
                          {msg.agent_label}
                        </span>
                      ) : msg.provider ? (
                        <span className="text-xs" style={{ color: theme.dim }}>
                          {providers[msg.provider]?.icon || '🤖'} {providers[msg.provider]?.name || msg.provider}
                        </span>
                      ) : null}
                      {msg.model && !['tars-ops','case-analysis','auto-route','director-general','case-field'].includes(msg.model) && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${G}15`, color: G }}>
                          {msg.model}
                        </span>
                      )}
                    </div>
                  )}
                  <p style={{ color: theme.text }} className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>
                  <p style={{ color: theme.dim }} className="text-[10px] mt-1.5 text-right">
                    {fmtTime(msg.ts)}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: G }} className="text-sm">
                      {providers[activeProvider]?.icon || '🤖'}
                    </span>
                    <span style={{ color: theme.dim }} className="text-xs">Pensando…</span>
                    <span className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                              style={{ background: G, animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 px-4 py-3 border-t" style={{ borderColor: theme.border }}>
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                  placeholder={`Pregunta al ${prov?.name || 'Supercerebro'}… (Enter para enviar, Shift+Enter para nueva línea)`}
                  rows={2}
                  className="w-full resize-none rounded-xl px-4 py-3 text-sm outline-none"
                  style={{
                    background: theme.card,
                    border: `1.5px solid ${input ? G : theme.border}`,
                    color: theme.text,
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
                style={{ background: G }}
              >
                <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                  <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-3 mt-2 px-1">
              <span style={{ color: theme.dim }} className="text-[10px]">
                Proveedor activo: <strong style={{ color: G }}>{prov?.icon} {prov?.name || activeProvider}</strong>
              </span>
              {activeModel && (
                <span style={{ color: theme.dim }} className="text-[10px]">· {activeModel}</span>
              )}
              {activeModules.length > 0 && (
                <span style={{ color: theme.dim }} className="text-[10px]">
                  · Contexto: {activeModules.map(m => CONTEXT_MODULES.find(x => x.id === m)?.icon).join(' ')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}
