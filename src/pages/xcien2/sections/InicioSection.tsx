import React from 'react';
import { ThemeConfig, SectionId } from '../types';
import { 
  Monitor, Radio, Send, Phone, ScanLine, LayoutDashboard, 
  FileBarChart, GraduationCap, ChevronRight 
} from 'lucide-react';

interface Props {
  theme: ThemeConfig;
  onNavigate: (id: SectionId) => void;
}

const MODULES: { id: SectionId; title: string; desc: string; icon: any; color: string }[] = [
  { id: 'noc',      title: 'Centro de Operaciones', desc: 'Estado global de redes y tenants', icon: Monitor, color: '#00B4D8' },
  { id: 'wfm',      title: 'Control Operativo',     desc: 'Gestión de técnicos y despacho', icon: Send, color: '#60A5FA' },
  { id: 'call',     title: 'Call Center',           icon: Phone, desc: 'Atención y escalamiento', color: '#A78BFA' },
  { id: 'scan',     title: 'Scanner de Inventario', icon: ScanLine, desc: 'Escaneo de equipos y red', color: '#FB923C' },
  { id: 'gerencia', title: 'Dashboard Gerencial',   icon: LayoutDashboard, desc: 'Revenue, SLAs y métricas', color: '#FBBF24' },
  { id: 'reports',  title: 'Reportes & Gobierno',   icon: FileBarChart, desc: 'Impacto y cumplimiento', color: '#F472B6' },
  { id: 'academia', title: 'Academia XCIEN',        icon: GraduationCap, desc: 'Capacitación y WFM', color: '#34D399' },
];

export default function InicioSection({ theme, onNavigate }: Props) {
  const accent = theme.accent;
  
  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: theme.text, marginBottom: 8, letterSpacing: -1 }}>
          Operations Hub <span style={{ color: accent }}>2.0</span>
        </h1>
        <p style={{ color: theme.dim, fontSize: 14 }}>Bienvenido al centro de mando unificado de XCIEN.</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
        gap: 20 
      }}>
        {MODULES.map(m => (
          <button
            key={m.id}
            onClick={() => onNavigate(m.id)}
            style={{
              background: theme.card,
              border: `1px solid ${theme.border}`,
              borderRadius: theme.radius,
              padding: 24,
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = m.color;
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = `0 10px 30px -10px ${m.color}30`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ 
              width: 48, height: 48, borderRadius: 12, 
              background: `${m.color}15`, display: 'flex', 
              alignItems: 'center', justifyContent: 'center' 
            }}>
              <m.icon size={24} color={m.color} />
            </div>
            
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.text, marginBottom: 4 }}>{m.title}</h3>
              <p style={{ fontSize: 12, color: theme.dim, lineHeight: 1.4 }}>{m.desc}</p>
            </div>

            <div style={{ 
              marginTop: 'auto', display: 'flex', alignItems: 'center', 
              gap: 4, fontSize: 11, fontWeight: 700, color: m.color,
              opacity: 0.8
            }}>
              ACCEDER <ChevronRight size={14} />
            </div>

            {/* Decorative background glow */}
            <div style={{ 
              position: 'absolute', bottom: -20, right: -20, 
              width: 100, height: 100, background: m.color, 
              filter: 'blur(60px)', opacity: 0.05, pointerEvents: 'none' 
            }} />
          </button>
        ))}
      </div>
    </div>
  );
}
