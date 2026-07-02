import { ThemeConfig } from '../types';
import { useState, useEffect } from 'react';
import brand from '../../../brand';
import { API_BASE } from '../../../config';
import {
  Zap, Shield, Activity, Globe, Cpu, Database, BarChart3, CheckCircle2, AlertCircle, Radio
} from 'lucide-react';

interface InicioHoloSectionProps {
  theme: ThemeConfig;
  backendStatus: 'online' | 'offline';
  odooStatus?: 'conectado' | 'desconectado';
  observiumStatus?: 'conectado' | 'desconectado';
  onSelect: (id: any) => void;
  bridgeData?: { current_task: string; status: string; log: string[]; last_update: string };
}

const G = '#00ff88';
const Y = '#ffcc00';
const R = '#ff3366';

export default function InicioHoloSection({ theme, backendStatus, odooStatus = 'desconectado', observiumStatus = 'desconectado', onSelect }: InicioHoloSectionProps) {
  const [nocStats, setNocStats]     = useState<any>(null);
  const [wfmKpis, setWfmKpis]       = useState<any>(null);
  const [nocbStatus, setNocbStatus] = useState<'conectado' | 'desconectado'>('desconectado');
  const [logs, setLogs]             = useState<{ ts: string; msg: string; level: 'info' | 'warn' | 'ok' }[]>([]);
  const accent = theme.accent;

  useEffect(() => {
    const addLog = (msg: string, level: 'info' | 'warn' | 'ok' = 'info') => {
      const ts = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLogs(prev => [{ ts, msg, level }, ...prev].slice(0, 8));
    };

    const fetchAll = async () => {
      // NOC stats desde NOCBoard
      try {
        const r = await fetch(`${API_BASE}/api/noc/dashboard-stats`);
        if (r.ok) {
          const d = await r.json();
          setNocStats(d);
          setNocbStatus('conectado');
          addLog(`NOCBoard: ${d.up}/${d.total} nodos online (${d.uptime_pct}% uptime)`, d.uptime_pct >= 80 ? 'ok' : 'warn');
        }
      } catch { setNocbStatus('desconectado'); }

      // WFM KPIs desde Odoo
      try {
        const r = await fetch(`${API_BASE}/api/wfm/kpis`);
        if (r.ok) {
          const d = await r.json();
          setWfmKpis(d);
          addLog(`WFM: ${d.abiertos} tickets abiertos de ${d.total} totales`, 'info');
        }
      } catch { }
    };

    fetchAll();
    const id = setInterval(fetchAll, 30_000);
    return () => clearInterval(id);
  }, []);

  const uptime = nocStats ? `${nocStats.uptime_pct}%` : '—';
  const uptimeColor = nocStats ? (nocStats.uptime_pct >= 80 ? G : nocStats.uptime_pct >= 60 ? Y : R) : theme.dim;

  const stats = [
    { label: 'DISPONIBILIDAD RED', value: uptime, icon: Globe, color: uptimeColor },
    { label: 'NODOS ONLINE', value: nocStats ? `${nocStats.up} / ${nocStats.total}` : '—', icon: Radio, color: G },
    { label: 'TICKETS WFM', value: wfmKpis ? `${wfmKpis.abiertos} ABIERTOS` : '—', icon: Activity, color: accent },
    { label: 'CIUDADES ON-NET', value: nocStats ? `${nocStats.ciudades}` : '—', icon: Zap, color: Y },
  ];

  const systems = [
    {
      label: 'Backend Antigravity (FastAPI)',
      sub: 'Puerto 8000 · API principal',
      icon: Cpu,
      status: backendStatus === 'online' ? 'conectado' : 'desconectado',
    },
    {
      label: `ERP Odoo (${brand.odooDb || 'ERP'})`,
      sub: `XML-RPC over HTTPS · ${brand.emailDomain}`,
      icon: Database,
      status: odooStatus,
    },
    {
      label: 'NOCBoard (Red On-Net)',
      sub: `Puerto 9401 · 384 dispositivos`,
      icon: Radio,
      status: nocbStatus,
    },
    {
      label: 'Observium NMS',
      sub: '172.31.150.244 · Monitoreo extendido',
      icon: Activity,
      status: observiumStatus,
    },
  ];

  return (
    <div style={{ color: theme.text, fontFamily: "'Inter', sans-serif", paddingBottom: 40 }}>
      {/* Hero */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 42, fontWeight: 900, margin: 0, letterSpacing: -2, lineHeight: 1 }}>
          CENTRO DE COMANDO <span style={{ color: accent }}>{brand.name} {brand.version}</span>
        </h1>
        <p style={{ fontSize: 16, color: theme.dim, marginTop: 12, maxWidth: 600 }}>
          Orquestación multi-agente para la profesionalización operativa.
          Sistema de misión crítica para la infraestructura nacional de {brand.name}.
        </p>
      </div>

      {/* KPIs reales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            padding: 24, borderRadius: 20, background: theme.card, border: `1px solid ${theme.border}`,
            display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden'
          }}>
            <s.icon size={20} style={{ color: s.color, opacity: 0.8 }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: theme.dim, letterSpacing: 1 }}>{s.label}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color, marginTop: 4 }}>{s.value}</div>
            </div>
            <div style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.03 }}>
              <s.icon size={100} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
        {/* Panel de integridad */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ padding: 32, borderRadius: 24, background: theme.card, border: `1px solid ${theme.border}` }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield style={{ color: accent }} />
              ESTADO DE INTEGRIDAD DEL SISTEMA
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {systems.map((sys, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <sys.icon size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{sys.label}</div>
                      <div style={{ fontSize: 12, color: theme.dim }}>{sys.sub}</div>
                    </div>
                  </div>
                  <div style={{ color: sys.status === 'conectado' ? G : R, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {sys.status === 'conectado' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {sys.status === 'conectado' ? 'CONECTADO' : 'DESCONECTADO'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accesos rápidos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <button onClick={() => onSelect('noc')} style={{ padding: 24, borderRadius: 20, background: `${accent}10`, border: `1px solid ${accent}30`, textAlign: 'left', cursor: 'pointer' }}>
              <Globe style={{ color: accent, marginBottom: 12 }} />
              <div style={{ fontWeight: 800, fontSize: 15 }}>Monitor de Red</div>
              <div style={{ fontSize: 12, color: theme.dim, marginTop: 4 }}>Ver estados de nodos y alertas.</div>
            </button>
            <button onClick={() => onSelect('wfm')} style={{ padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.border}`, textAlign: 'left', cursor: 'pointer' }}>
              <BarChart3 style={{ color: Y, marginBottom: 12 }} />
              <div style={{ fontWeight: 800, fontSize: 15 }}>Gestión WFM</div>
              <div style={{ fontSize: 12, color: theme.dim, marginTop: 4 }}>Asignación de técnicos y tickets.</div>
            </button>
          </div>
        </div>

        {/* Logs en vivo */}
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 24, border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: 12, fontWeight: 800, margin: 0, letterSpacing: 1 }}>LOGS DE INFRAESTRUCTURA</h4>
            <span style={{ fontSize: 10, color: G }}>● LIVE</span>
          </div>
          <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, fontFamily: 'monospace', fontSize: 11, overflowY: 'auto' }}>
            {logs.length === 0 && (
              <div style={{ color: theme.dim }}>Conectando con sistemas...</div>
            )}
            {logs.map((l, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, opacity: i > 3 ? 0.5 : 1 }}>
                <span style={{ color: accent, flexShrink: 0 }}>[{l.ts}]</span>
                <span style={{ color: l.level === 'warn' ? Y : l.level === 'ok' ? G : theme.text }}>{l.msg}</span>
              </div>
            ))}
            <div style={{ marginTop: 'auto', textAlign: 'center', color: accent, fontSize: 10, fontWeight: 800 }}>
              ESCUCHANDO EVENTOS...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
