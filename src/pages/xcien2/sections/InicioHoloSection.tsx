import { ThemeConfig } from '../types';
import { useState, useEffect } from 'react';
import { API_BASE } from '../../../config';
import { 
  Zap, 
  Shield, 
  Activity, 
  Globe, 
  Cpu, 
  Database,
  BarChart3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface InicioHoloSectionProps {
  theme: ThemeConfig;
  backendStatus: 'online' | 'offline';
  onSelect: (id: any) => void;
  bridgeData?: { current_task: string; status: string; log: string[]; last_update: string };
}

const G = '#00ff88';
const Y = '#ffcc00';
const R = '#ff3366';

export default function InicioHoloSection({ theme, backendStatus, onSelect, bridgeData }: InicioHoloSectionProps) {
  const [liveStats, setLiveStats] = useState<any>(null);
  const accent = theme.accent;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/bridge/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: 'get_dashboard_stats' })
        });
        const data = await res.json();
        if (data.status === 'success') setLiveStats(data.data);
      } catch (e) { console.error("Error fetching hub stats:", e); }
    };
    fetchStats();
    const id = setInterval(fetchStats, 10000);
    return () => clearInterval(id);
  }, []);

  const stats = [
    { label: 'DISPONIBILIDAD RED', value: liveStats?.availability || '99.98%', icon: Globe, color: G },
    { label: 'TICKETS WFM', value: liveStats ? `${liveStats.pending_tickets} ACTIVOS` : 'Cargando...', icon: Activity, color: accent },
    { label: 'PRODUCTIVIDAD', value: liveStats?.productivity || '---', icon: Cpu, color: Y },
    { label: 'EQUIPOS CAMPO', value: liveStats ? `${liveStats.active_teams} BIDRILLAS` : '---', icon: Zap, color: G },
  ];

  return (
    <div style={{ color: theme.text, fontFamily: "'Inter', sans-serif", paddingBottom: 40 }}>
      {/* Hero Welcome */}
      <div style={{ marginBottom: 48, position: 'relative' }}>
        <h1 style={{ fontSize: 42, fontWeight: 900, margin: 0, letterSpacing: -2, lineHeight: 1 }}>
          CENTRO DE COMANDO <span style={{ color: accent }}>XCIEN 2.0</span>
        </h1>
        <p style={{ fontSize: 16, color: theme.dim, marginTop: 12, maxWidth: 600 }}>
          Orquestación multi-agente para la profesionalización operativa. 
          Sistema de misión crítica para la infraestructura nacional de XCIEN.
        </p>
      </div>

      {/* Real-time Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ 
            padding: 24, borderRadius: 20, background: theme.card, border: `1px solid ${theme.border}`,
            display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden'
          }}>
            <s.icon size={20} style={{ color: s.color, opacity: 0.8 }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: theme.dim, letterSpacing: 1 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: theme.text, marginTop: 4 }}>{s.value}</div>
            </div>
            <div style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.03 }}>
              <s.icon size={100} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
        {/* System Health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ padding: 32, borderRadius: 24, background: theme.card, border: `1px solid ${theme.border}`, position: 'relative' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield style={{ color: accent }} />
              ESTADO DE INTEGRIDAD DEL SISTEMA
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Cpu size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Backend Antigravity (FastAPI)</div>
                    <div style={{ fontSize: 12, color: theme.dim }}>Puerto 8000 · v2.0.5</div>
                  </div>
                </div>
                <div style={{ color: backendStatus === 'online' ? G : R, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {backendStatus === 'online' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {backendStatus.toUpperCase()}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Database size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Conector ERP (Odoo wispi17)</div>
                    <div style={{ fontSize: 12, color: theme.dim }}>XML-RPC over HTTPS</div>
                  </div>
                </div>
                <div style={{ color: backendStatus === 'online' ? Y : R, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={14} />
                  PENDIENTE PASS
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Activity size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>NOCBoard Sync (Real-time)</div>
                    <div style={{ fontSize: 12, color: theme.dim }}>Sincronización de 142 hosts</div>
                  </div>
                </div>
                <div style={{ color: G, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={14} />
                  SINCRONIZADO
                </div>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <button 
              onClick={() => onSelect('noc')}
              style={{ 
                padding: 24, borderRadius: 20, background: `${accent}10`, border: `1px solid ${accent}30`,
                textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <Globe style={{ color: accent, marginBottom: 12 }} />
              <div style={{ fontWeight: 800, fontSize: 15 }}>Monitor de Red</div>
              <div style={{ fontSize: 12, color: theme.dim, marginTop: 4 }}>Ver estados de nodos y alertas.</div>
            </button>
            <button 
              onClick={() => onSelect('wfm')}
              style={{ 
                padding: 24, borderRadius: 20, background: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.border}`,
                textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <BarChart3 style={{ color: Y, marginBottom: 12 }} />
              <div style={{ fontWeight: 800, fontSize: 15 }}>Gestión WFM</div>
              <div style={{ fontSize: 12, color: theme.dim, marginTop: 4 }}>Asignación de técnicos y tickets.</div>
            </button>
          </div>
        </div>

        {/* System Logs / Timeline */}
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 24, border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: 12, fontWeight: 800, margin: 0, letterSpacing: 1 }}>LOGS DE INFRAESTRUCTURA</h4>
            <span style={{ fontSize: 10, color: theme.dim }}>LIVE</span>
          </div>
          <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'monospace', fontSize: 11 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ color: accent }}>[06:45:12]</span>
              <span>Conexión establecida con Bridge Antigravity.</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <span style={{ color: accent }}>[06:45:08]</span>
              <span>Sincronizando base de datos wispi17... OK.</span>
            </div>
            <div style={{ display: 'flex', gap: 12, opacity: 0.6 }}>
              <span style={{ color: accent }}>[06:44:55]</span>
              <span>Iniciando servicio de orquestación multi-agente.</span>
            </div>
            <div style={{ display: 'flex', gap: 12, opacity: 0.6 }}>
              <span style={{ color: accent }}>[06:44:50]</span>
              <span>Carga de manuales técnicos completada. (14 docs)</span>
            </div>
            <div style={{ display: 'flex', gap: 12, color: Y }}>
              <span style={{ color: accent }}>[06:42:10]</span>
              <span style={{ fontWeight: 800 }}>[ALERTA] Redundancia Saltillo requiere revisión.</span>
            </div>
            <div style={{ marginTop: 'auto', textAlign: 'center', color: accent, fontSize: 10, fontWeight: 800 }}>
              ESCUCHANDO EVENTOS...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
