import { ThemeConfig } from '../types';
import { useState, useEffect } from 'react';
import { API_BASE } from '../../../config';
import { User, Shield, Tool, Truck, CheckCircle, AlertTriangle } from 'lucide-react';

interface Bidrilla {
  id: string;
  name: string;
  zona: string;
  members: {
    lider: string;
    tecnico: string;
    auxiliar: string;
  };
  status: 'active' | 'maintenance' | 'idle';
  kpis: {
    productivity: number;
    signalQuality: number;
    satisfaction: number;
  };
  currentService?: string;
}

export default function BidrillasSection({ theme }: { theme: ThemeConfig }) {
  const [bidrillas, setBidrillas] = useState<Bidrilla[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulando carga de datos reales (esto vendría de Odoo en prod)
    setTimeout(() => {
      setBidrillas([
        {
          id: 'B-01',
          name: 'Escuadrón Monterrey Alpha',
          zona: 'Monterrey, NL',
          members: {
            lider: 'Laura Garza',
            tecnico: 'Carlos Mendoza',
            auxiliar: 'Jorge Martínez'
          },
          status: 'active',
          kpis: { productivity: 4.5, signalQuality: 98, satisfaction: 4.9 },
          currentService: 'Instalación Corporativa — San Pedro'
        },
        {
          id: 'B-02',
          name: 'Fuerza Saltillo Delta',
          zona: 'Saltillo, COAH',
          members: {
            lider: 'Ana Rodríguez',
            tecnico: 'Roberto Salinas',
            auxiliar: 'Pendiente'
          },
          status: 'idle',
          kpis: { productivity: 3.8, signalQuality: 95, satisfaction: 4.7 }
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const accent = theme.accent;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      <div style={{ borderBottom: `2px solid ${accent}`, paddingBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: theme.text, margin: 0, letterSpacing: -1 }}>🚛 GESTIÓN DE BIDRILLAS 2026</h2>
          <p style={{ fontSize: 13, color: theme.dim, marginTop: 4 }}>Unidades operativas mínimas certificadas por XCIEN Academia.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: 8, border: `1px solid ${theme.border}`, textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: theme.dim, fontWeight: 700 }}>REGLA DE ORO</div>
            <div style={{ fontSize: 12, color: accent, fontWeight: 800 }}>✨ CERO BASURA</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 20 }}>
        {bidrillas.map(b => (
          <div key={b.id} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 20, padding: 24, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: b.status === 'active' ? '#00ff88' : '#ffcc00' }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, color: accent, background: `${accent}10`, padding: '2px 8px', borderRadius: 4, letterSpacing: 1 }}>{b.id}</span>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: '8px 0 4px 0' }}>{b.name}</h3>
                <div style={{ fontSize: 12, color: theme.dim }}>📍 {b.zona}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: b.status === 'active' ? '#00ff88' : theme.dim }}>● {b.status.toUpperCase()}</span>
                {b.currentService && <div style={{ fontSize: 10, color: theme.dim, marginTop: 4, maxWidth: 150 }}>{b.currentService}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: theme.dim }}>EQUIPO ASIGNADO</div>
                <div style={{ fontSize: 12 }}>👑 <b>{b.members.lider}</b> (Líder)</div>
                <div style={{ fontSize: 12 }}>🛠️ {b.members.tecnico} (Técnico)</div>
                <div style={{ fontSize: 12, color: b.members.auxiliar === 'Pendiente' ? '#ff3366' : theme.text }}>👷 {b.members.auxiliar} (Auxiliar)</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: theme.dim }}>KPIs DE CAMPO</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                    <div style={{ width: `${b.kpis.signalQuality}%`, height: '100%', background: '#00ff88', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{b.kpis.signalQuality}% RF</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                    <div style={{ width: `${(b.kpis.productivity/5)*100}%`, height: '100%', background: accent, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{b.kpis.productivity} Srv/D</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.border}`, borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Ver Bitácora
              </button>
              <button style={{ flex: 1, padding: '10px', background: accent, border: 'none', borderRadius: 8, color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Auditar Sitio
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Standards Reminder */}
      <div style={{ background: 'linear-gradient(90deg, rgba(0,255,136,0.05), transparent)', border: `1px solid ${theme.border}`, borderRadius: 16, padding: 32, display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: `${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Shield size={32} color={accent} />
        </div>
        <div>
          <h4 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Cumplimiento de Estándar 2.0</h4>
          <p style={{ fontSize: 14, color: theme.dim, marginTop: 4, maxWidth: 600 }}>
            Toda Bidrilla debe portar su equipo de protección personal completo y herramienta certificada. 
            El reporte de cierre debe incluir evidencia fotográfica del sitio libre de residuos.
          </p>
        </div>
      </div>
    </div>
  );
}
