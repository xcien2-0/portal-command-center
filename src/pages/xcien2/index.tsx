import { useState, useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE } from '../../config';
import { ThemeConfig, DEFAULT_THEME, SectionId, PresetTheme } from './types';
import FloatingChat from './sections/FloatingChat';
import NocSection from './sections/NocSection';
import AcademiaSection from './sections/AcademiaSection';
import AcademiaHoloSection from './sections/AcademiaHoloSection';
import WFMSection from './sections/WFMSection';
import FinanzasSection from './sections/FinanzasSection';
import DevPanel from './DevPanel';
import FodaSection from './sections/FodaSection';
import AdopcionSection from './sections/AdopcionSection';
import TelegramBotSection from './sections/TelegramBotSection';
import DocsSection from './sections/DocsSection';
import BackupSection from './sections/BackupSection';
import InicioHoloSection from './sections/InicioHoloSection';
import BidrillasSection from './sections/BidrillasSection';
import AgentesSection from './sections/AgentesSection';
import RedSection from './sections/RedSection';
import RRHHSection from './sections/RRHHSection';
import SalaJuntasSection from './sections/SalaJuntasSection';
import { getRealCities, getRealAlerts } from '@/services/nocboard';
import { NOCCity, NOCAlert } from '@/types/noc';

import InventarioTransfersSection from './sections/InventarioTransfersSection';
import XcienTokensSection from './sections/XcienTokensSection';
import MerkleFeedSection from './sections/MerkleFeedSection';

// Bridge imports for classic components
import CallCenter from '../CallCenter';
import InventarioSection from './sections/InventarioSection';
import Gerencia from '../Gerencia';
import ReportesGobierno from '../ReportesGobierno';

// ── Theme reducer ─────────────────────────────────────────────────────────────
type ThemeAction = { type: 'patch'; payload: Partial<ThemeConfig> } | { type: 'reset' };

function themeReducer(state: ThemeConfig, action: ThemeAction): ThemeConfig {
  switch (action.type) {
    case 'patch': return { ...state, ...action.payload };
    case 'reset': return DEFAULT_THEME;
    default: return state;
  }
}

// ── Navigation structure ──────────────────────────────────────────────────────
interface NavEntry { id: SectionId; label: string; icon: string; group?: string }

const NAV: NavEntry[] = [
  { id: 'inicio', label: 'Hub Principal', icon: '🏠' },

  { id: 'noc', label: 'Red en Vivo', icon: '📡', group: 'Operaciones' },
  { id: 'red', label: 'Mapa de Red', icon: '🗺️', group: 'Operaciones' },
  { id: 'wfm', label: 'Control Operativo', icon: '⚙️', group: 'Operaciones' },
  { id: 'bidrillas', label: 'Equipos de Campo', icon: '🚛', group: 'Operaciones' },
  { id: 'call', label: 'Call Center', icon: '📞', group: 'Operaciones' },
  { id: 'scan', label: 'Inventario & Scanner', icon: '🔍', group: 'Operaciones' },
  { id: 'inv-transfers', label: 'Transferencias de Inventario', icon: '🏷️', group: 'Operaciones' },

  { id: 'academia', label: 'Dashboard Academia', icon: '🎓', group: 'Certificación & Academia' },

  { id: 'transacciones', label: 'Tokens Unificados', icon: '🔗', group: 'Administración' },
  { id: 'merkle', label: 'Merkle Feed — En Vivo', icon: '⛓️', group: 'Administración' },
  { id: 'gerencia', label: 'Dashboard Gerencial', icon: '📊', group: 'Administración' },
  { id: 'reports', label: 'Reportes & Gobierno', icon: '📋', group: 'Administración' },
  { id: 'docs', label: 'Biblioteca Documental', icon: '📚', group: 'Administración' },

  { id: 'foda', label: 'Análisis Estratégico', icon: '🛡️', group: 'Planeación' },
  { id: 'adopcion', label: 'Gestión de Usuarios', icon: '👥', group: 'Planeación' },
  { id: 'rrhh', label: 'Recursos Humanos', icon: '👤', group: 'Administración' },
  { id: 'sala_juntas', label: 'Sala de Juntas', icon: '📅', group: 'Administración' },

  { id: 'agentes', label: 'Agentes IA', icon: '🤖', group: 'Infraestructura' },
  { id: 'bridge', label: 'Puente de Datos (IA)', icon: '⚡', group: 'Infraestructura' },
  { id: 'war-room', label: 'Comando Multi-Agente', icon: '⚔️', group: 'Infraestructura' },
  { id: 'mobile', label: 'Terminal Móvil (QR)', icon: '📱', group: 'Infraestructura' },
  { id: 'telegram', label: 'Monitor de Alarmas Bot', icon: '🤖', group: 'Infraestructura' },
  { id: 'backup', label: 'Migración & Redundancia', icon: '💾', group: 'Sistema' },
  { id: 'editor', label: 'Configuración Matriz', icon: '🎨', group: 'Sistema' },
];

const SECTION_TITLE: Record<SectionId, string> = {
  inicio: 'Hub Principal',
  noc: 'Red en Vivo',
  red: 'Mapa de Red — Dispositivos por Marca',
  wfm: 'Control Operativo — WFM',
  bidrillas: 'Gestión de Bidrillas 2026',
  call: 'Centro de Atención (Call Center)',
  scan: 'Inventario & Scanner QR',
  tokens: 'Transacciones & Tokens',
  transacciones: 'Transacciones & Tokens',
  etiquetas: 'Creación de Etiquetas & Comprobantes',
  foda: 'Análisis de Riesgos y Oportunidades',
  adopcion: 'Adopción y Gestión de Usuarios',
  academia: 'XCIEN Academia',
  gerencia: 'Control Gerencial',
  reports: 'Gobierno de Datos',
  bridge: 'Antigravity Data Bridge',
  'war-room': 'Centro de Comando Multi-Agente',
  mobile: 'Acceso Remoto Móvil',
  telegram: 'Monitor de Alarmas (Telegram)',
  docs: 'Repositorio Documental',
  rrhh: 'Recursos Humanos — Directorio',
  sala_juntas: 'Sala de Juntas — Calendarios',
  backup: 'Gestión de Migración y Redundancia',
  editor: 'Ajustes de Infraestructura',
  agentes: 'Ecosistema de Agentes IA',
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
interface SidebarProps {
  active: SectionId;
  onSelect: (id: SectionId) => void;
  theme: ThemeConfig;
}

function NavButton({ item, active, onSelect, theme, sub = false }: { item: NavEntry, active: SectionId, onSelect: (id: SectionId) => void, theme: ThemeConfig, sub?: boolean }) {
  const isActive = active === item.id;
  const accent = theme.accent;

  return (
    <button
      onClick={() => onSelect(item.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: sub ? '8px 12px' : (theme.compact ? '7px 12px' : '10px 12px'),
        background: isActive ? `${accent}20` : 'transparent',
        color: isActive ? accent : (sub ? theme.dim : theme.text),
        border: 'none', borderRadius: 8, cursor: 'pointer',
        transition: 'all 0.2s', fontSize: sub ? '0.85rem' : '0.9rem',
        fontWeight: isActive ? 600 : 500,
        width: '100%', textAlign: 'left',
      }}
    >
      <span style={{ fontSize: sub ? '1rem' : '1.1rem', opacity: isActive ? 1 : 0.7 }}>{item.icon}</span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {isActive && (
        <div style={{ width: 4, height: 16, background: accent, borderRadius: 2 }} />
      )}
    </button>
  );
}

function Sidebar({ active, onSelect, theme, backendStatus }: SidebarProps) {
  const [now, setNow] = useState(new Date());
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Operaciones', 'Certificación & Academia', 'Administración', 'Planeación', 'Infraestructura', 'Sistema']);

  useEffect(() => {
    const timeId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timeId);
  }, []);

  const toggleGroup = (label: string) => {
    setExpandedGroups(prev =>
      prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]
    );
  };

  const groups = useMemo(() => {
    const grouped: { label: string | null; items: NavEntry[] }[] = [];
    let current: NavEntry[] = [];
    let currentLabel: string | null = null;

    for (const entry of NAV) {
      if (entry.group !== currentLabel) {
        if (current.length) grouped.push({ label: currentLabel, items: current });
        currentLabel = entry.group ?? null;
        current = [];
      }
      current.push(entry);
    }
    if (current.length) grouped.push({ label: currentLabel, items: current });
    return grouped;
  }, []);

  const accent = theme.accent;

  return (
    <div style={{
      width: theme.sidebarWidth, flexShrink: 0,
      background: theme.id === 'holo' ? 'rgba(2, 10, 4, 0.85)' : theme.sidebar,
      backdropFilter: theme.id === 'holo' ? 'blur(12px)' : 'none',
      borderRight: `1px solid ${theme.border}`,
      display: 'flex', flexDirection: 'column', transition: 'width 0.2s',
    }}>
      {/* Logo */}
      <div style={{ padding: 24, borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/xcien.png" alt="XCIEN" style={{ height: 28, objectFit: 'contain' }} />
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: -0.5, color: theme.text }}>XCIEN</span>
            <span style={{ color: accent, fontSize: '0.7rem', background: `${accent}20`, padding: '2px 6px', borderRadius: 4, marginLeft: 6 }}>2.0</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: theme.dim }}>
            {now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 800, color: backendStatus === 'online' ? '#00ff88' : '#ff3366' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: backendStatus === 'online' ? '#00ff88' : '#ff3366', boxShadow: backendStatus === 'online' ? '0 0 8px #00ff88' : 'none' }} />
            {backendStatus.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
        {groups.map(({ label, items }) => {
          if (!label) {
            return items.map(item => (
              <NavButton key={item.id} item={item} active={active} onSelect={onSelect} theme={theme} />
            ));
          }

          const isExpanded = expandedGroups.includes(label);
          const hasActive = items.some(it => it.id === active);

          return (
            <div key={label} style={{ marginBottom: 4 }}>
              <button
                onClick={() => toggleGroup(label)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer', border: 'none', background: 'transparent',
                  color: hasActive ? theme.text : theme.dim, transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</span>
                </div>
                <span style={{ fontSize: 10, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none', opacity: 0.5 }}>▼</span>
              </button>

              <div style={{
                maxHeight: isExpanded ? 500 : 0, overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0, 1, 0, 1)',
                paddingLeft: 8, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 2
              }}>
                {items.map(item => (
                  <NavButton key={item.id} item={item} active={active} onSelect={onSelect} theme={theme} sub />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer user pill & Settings */}
      <div style={{ padding: 20, borderTop: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          onClick={() => onSelect('editor')}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px',
            background: active === 'editor' ? `${theme.accent}20` : 'transparent',
            border: active === 'editor' ? `1px solid ${theme.accent}30` : '1px solid transparent',
            color: active === 'editor' ? theme.text : theme.dim,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 8, transition: 'all 0.15s',
          }}
        >
          <span>⚙️</span>
          <span>Ajustes del Portal</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: theme.card, padding: 10, borderRadius: theme.radius }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#fff', flexShrink: 0 }}>
            JM
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: theme.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Admin XCIEN</div>
            <div style={{ fontSize: '0.7rem', color: theme.dim }}>Director General</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Content ──────────────────────────────────────────────────────────────
interface ContentProps {
  section: SectionId;
  theme: ThemeConfig;
  activeThemeId: string;
  onThemeChange: (p: Partial<ThemeConfig>) => void;
  onThemeReset: () => void;
  onApplyPreset: (preset: PresetTheme) => void;
  cities: NOCCity[];
  alerts: NOCAlert[];
  activeTenantId: string | null;
  onTenantChange: (id: string | null) => void;
  bridgeData: any;
}

function Content({
  section, theme, activeThemeId, onThemeChange, onThemeReset, onApplyPreset,
  cities, alerts, activeTenantId, onTenantChange, bridgeData, backendStatus, onSelect
}: ContentProps & { backendStatus: 'online' | 'offline', onSelect: (id: SectionId) => void }) {
  const padding = theme.compact ? 20 : 32;
  const isFullHeight = section === 'red';
  return (
    <div style={{
      flex: 1, overflowY: isFullHeight ? 'hidden' : 'auto',
      padding: isFullHeight ? 0 : padding,
      background: theme.bg, minWidth: 0,
      display: 'flex', flexDirection: 'column',
    }}>
      {section === 'inicio'   && <InicioHoloSection theme={theme} backendStatus={backendStatus} onSelect={onSelect} />}
      {section === 'noc' && (
        <NocSection 
          theme={theme} 
          activeThemeId={activeThemeId}
          cities={cities} 
          alerts={alerts} 
          activeTenantId={activeTenantId} 
          onTenantChange={onTenantChange} 
        />
      )}
      {section === 'red'      && <RedSection      theme={theme} />}
      {section === 'academia' && <AcademiaSection theme={theme} activeThemeId={activeThemeId} />}
      {section === 'wfm'      && <WFMSection      theme={theme} activeThemeId={activeThemeId} />}
      {section === 'bidrillas' && <BidrillasSection theme={theme} />}
      {section === 'rrhh'      && <RRHHSection      theme={theme} />}
      {section === 'sala_juntas' && <SalaJuntasSection theme={theme} />}
      {section === 'agentes'   && <AgentesSection   theme={theme} />}
      {section === 'foda'     && <FodaSection     theme={theme} />}
      {section === 'adopcion' && <AdopcionSection theme={theme} />}
      {section === 'call'     && <CallCenter      theme={theme} activeThemeId={activeThemeId} />}
      {section === 'scan'          && <InventarioSection theme={theme} />}
      {section === 'etiquetas'     && <InventarioSection theme={theme} initialTab="etiquetas" />}
      {section === 'inv-transfers' && <InventarioTransfersSection theme={theme} />}
      {section === 'gerencia' && <Gerencia />}
      {section === 'reports' && <ReportesGobierno />}

      {section === 'bridge' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', maxHeight: 'calc(100vh - 140px)' }}>
          <div style={{ padding: 20, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: theme.radius }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: theme.accent, marginBottom: 4 }}>⚡ ANTIGRAVITY BRIDGE</h2>
            <p style={{ fontSize: 13, color: theme.dim }}>Terminal de ejecución en tiempo real y recepción de órdenes.</p>
          </div>

          <div style={{
            flex: 1, background: '#000', border: `1px solid ${theme.accent}40`, borderRadius: 12,
            padding: 20, fontFamily: 'monospace', fontSize: 13, overflowY: 'auto',
            boxShadow: `0 0 30px ${theme.accent}10`, position: 'relative'
          }}>
            <div style={{ color: theme.accent, marginBottom: 10 }}>[SISTEMA] Puente establecido. Escuchando...</div>
            <div style={{ color: theme.text, whiteSpace: 'pre-wrap' }}>
              {`> Estado: trabajando en ${bridgeData.current_task}\n`}
              {`> Ultima actualización: ${bridgeData.last_update}\n\n`}
              {bridgeData.log.map((line: string, i: number) => (
                <div key={i} style={{ color: i === bridgeData.log.length - 1 ? theme.accent : '#888', marginBottom: 4 }}>
                  {`[${i}] ${line}`}
                </div>
              ))}
              <div style={{ color: theme.accent, marginTop: 10, animation: 'pulse 1s infinite' }}>_</div>
            </div>
          </div>

          <div style={{ background: '#111', border: `2px solid ${theme.accent}`, borderRadius: 12, padding: '16px 20px', boxShadow: `0 0 20px ${theme.accent}20` }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: theme.accent, marginBottom: 8, letterSpacing: '0.1em' }}>TERMINAL DE COMANDOS (Escribe aquí)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: theme.accent, fontSize: 20, fontWeight: 900 }}>{'>'}</span>
              <input
                id="bridge-input-main"
                autoFocus
                placeholder="Escribe tu orden para Antigravity..."
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const el = e.currentTarget;
                    const val = el.value;
                    if (!val) return;
                    el.value = 'Enviando...';
                    el.disabled = true;
                    try {
                      await fetch(`${API_BASE}/api/bridge/command`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command: val, context: 'bridge' })
                      });
                      el.value = '✅ Orden recibida — di "EJECUTA" en el chat';
                      setTimeout(() => { el.value = ''; }, 3000);
                    } catch (err) {
                      el.value = '❌ Error de conexión';
                      setTimeout(() => { el.value = ''; }, 3000);
                    }
                    el.disabled = false;
                    el.focus();
                  }
                }}
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  color: '#fff', outline: 'none', fontSize: 16, fontWeight: 500,
                  fontFamily: 'monospace'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {section === 'war-room' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%', maxHeight: 'calc(100vh - 140px)' }}>
          <div style={{ padding: 20, background: theme.card, border: `1px solid ${theme.border}`, borderRadius: theme.radius }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#FFB703', marginBottom: 4 }}>⚔️ SALA DE GUERRA: ORQUESTACIÓN</h2>
            <p style={{ fontSize: 13, color: theme.dim }}>Lluvia de ideas y resolución de procesos críticos.</p>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', paddingRight: 8 }}>
            {[
              { agent: 'Director General', text: 'Agentes, tenemos una degradación del 30% en el nodo "Saltillo-Sur". Odoo reporta 5 tickets de clientes VIP afectados. ¿Propuestas?', color: theme.accent },
              { agent: 'NOC Agent', text: 'Confirmado. El switch principal del sitio reporta temperatura alta. Es propenso a falla total en 2 horas. Necesitamos reemplazo físico.', color: '#FF4D4D' },
              { agent: 'WFM Agent', text: 'Tengo a Ana Rodríguez a 15km, pero su camioneta está en mantenimiento. Miguel Ángel está disponible pero a 60km. Sugiero enviar a Miguel con prioridad.', color: '#00B4D8' },
              { agent: 'Academia Agent', text: '⚠️ Alerta: El equipo en Saltillo-Sur es un Carrier-Grade de nueva generación. Miguel Ángel no ha completado el módulo de certificación 2026 para este modelo. Ana sí lo tiene.', color: '#34D399' },
              { agent: 'Director General', text: 'Decisión: WFM, coordina con Odoo la renta de un vehículo de emergencia para Ana Rodríguez. Academia, habilita un "Fast-Pass" de repaso para ella en el camino. NOC, mantén el balanceo de carga para minimizar impacto.', color: theme.accent },
            ].map((m, i) => (
              <div key={i} style={{ padding: 14, background: `${m.color}08`, border: `1px solid ${m.color}25`, borderRadius: 12, marginLeft: i % 2 === 0 ? 0 : 40, marginRight: i % 2 === 0 ? 40 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: m.color }} />
                  <span style={{ fontSize: 10, fontWeight: 800, color: m.color, letterSpacing: '0.05em' }}>{m.agent.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.5 }}>{m.text}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#111', border: `2px solid #FFB703`, borderRadius: 12, padding: '16px 20px', boxShadow: `0 0 20px #FFB70320` }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#FFB703', marginBottom: 8, letterSpacing: '0.1em' }}>INTERVENIR EN LA ORQUESTACIÓN</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ color: '#FFB703', fontSize: 20, fontWeight: 900 }}>{'>'}</span>
              <input
                id="war-room-input"
                placeholder="Da una orden a los agentes (ej: 'Cancela el envío y prioriza Monterrey')"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const el = e.currentTarget;
                    const val = el.value;
                    if (!val) return;
                    el.value = 'Procesando...';
                    el.disabled = true;
                    try {
                      await fetch(`${API_BASE}/api/bridge/command`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command: val, context: 'war_room' })
                      });
                      el.value = '✅ Orden enviada — Antigravity la procesará ahora';
                      setTimeout(() => { el.value = ''; }, 3000);
                    } catch (err) {
                      el.value = '❌ Error enviando orden';
                      setTimeout(() => { el.value = ''; }, 3000);
                    }
                    el.disabled = false;
                    el.focus();
                  }
                }}
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  color: '#fff', outline: 'none', fontSize: 16, fontFamily: 'monospace'
                }}
              />
            </div>
          </div>
        </div>
      )}
      {section === 'mobile' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 32 }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: theme.accent, marginBottom: 12 }}>📱 ACCESO MÓVIL</h2>
            <p style={{ fontSize: 16, color: theme.dim }}>Escanea el código para llevar el centro de mando XCIEN 2.0 en tu celular.</p>
          </div>

          <div style={{
            background: '#fff', padding: 24, borderRadius: 24,
            boxShadow: `0 20px 50px ${theme.accent}30`,
            border: `4px solid ${theme.accent}`
          }}>
            <img
              src="/mobile_qr.png"
              alt="QR de Acceso"
              style={{ width: 250, height: 250, imageRendering: 'pixelated' }}
            />
          </div>

          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 16, padding: '16px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 12, color: theme.dim, marginBottom: 4 }}>URL de Red Local:</div>
            <code style={{ fontSize: 18, fontWeight: 700, color: theme.accent }}>http://192.168.1.75:8080/</code>
          </div>

          <p style={{ fontSize: 12, color: theme.dim, maxWidth: 300, textAlign: 'center' }}>
            Asegúrate de que tu celular esté conectado a la misma red Wi-Fi que este equipo.
          </p>
        </div>
      )}
      {section === 'telegram' && <TelegramBotSection theme={theme} />}
      {section === 'docs' && <DocsSection theme={theme} />}
      {section === 'backup' && <BackupSection theme={theme} />}
      {section === 'transacciones' && <XcienTokensSection theme={theme} />}
      {section === 'tokens'        && <XcienTokensSection theme={theme} />}
      {section === 'merkle'        && <MerkleFeedSection theme={theme} />}
      {section === 'editor' && (
        <DevPanel
          theme={theme}
          activeThemeId={activeThemeId}
          onChange={onThemeChange}
          onApplyPreset={onApplyPreset}
          onReset={onThemeReset}
        />
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Xcien2Page() {
  const navigate = useNavigate();
  const [bridgeData, setBridgeData] = useState({ current_task: 'Inactivo', status: 'idle', log: [], last_update: '' });
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline'>('offline');
  const [section, setSection] = useState<SectionId>(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('section') as SectionId;
    return (s && SECTION_TITLE[s]) ? s : 'noc';
  });

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        if (res.ok) setBackendStatus('online');
        else setBackendStatus('offline');
      } catch { setBackendStatus('offline'); }
    };
    checkBackend();
    const id = setInterval(checkBackend, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchBridge = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/bridge`);
        if (res.ok) setBridgeData(await res.json());
      } catch (e) { }
    };
    const id = setInterval(fetchBridge, 3000);
    fetchBridge();
    return () => clearInterval(id);
  }, []);

  // Sync section with URL search params
  const [theme, dispatch] = useReducer(themeReducer, DEFAULT_THEME, (initial) => {
    try {
      const saved = localStorage.getItem('xcien2_theme');
      return saved ? { ...initial, ...JSON.parse(saved) } : initial;
    } catch { return initial; }
  });
  const [activeThemeId, setActiveThemeId] = useState('xcien');

  // NOC State
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [realCities, setRealCities] = useState<NOCCity[]>([]);
  const [realAlerts, setRealAlerts] = useState<NOCAlert[]>([]);

  const loadRealData = async () => {
    try {
      const [cities, alerts] = await Promise.all([getRealCities(), getRealAlerts()]);
      if (cities) setRealCities(cities);
      if (alerts) setRealAlerts(alerts);
    } catch (e) { console.error("Error loading NOC data in Holo:", e); }
  };

  useEffect(() => {
    loadRealData();
    const id = setInterval(loadRealData, 30_000);
    return () => clearInterval(id);
  }, []);

  const patchTheme = useCallback((patch: Partial<ThemeConfig>) => dispatch({ type: 'patch', payload: patch }), []);
  const resetTheme = useCallback(() => { dispatch({ type: 'reset' }); setActiveThemeId('xcien'); }, []);
  const applyPreset = useCallback((preset: PresetTheme) => {
    dispatch({ type: 'patch', payload: preset.config });
    setActiveThemeId(preset.id);
  }, []);

  // Apply CSS variables globally for uniformity
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--xcien-accent', theme.accent);
    root.style.setProperty('--xcien-bg', theme.bg);
    root.style.setProperty('--xcien-card', theme.card);
    root.style.setProperty('--xcien-border', theme.border);
    root.style.setProperty('--xcien-text', theme.text);
    root.style.setProperty('--xcien-dim', theme.dim);
    root.style.setProperty('--xcien-radius', `${theme.radius}px`);
    root.style.setProperty('--xcien-font', `${theme.baseFontSize}px`);

    // Update body background to match theme
    document.body.style.background = theme.bg;
  }, [theme]);

  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('section') as SectionId;
    if (id && id !== section) {
      if (SECTION_TITLE[id]) {
        setSection(id);
      } else {
        setSection('inicio');
      }
    }
  }, [location.search, section]);

  const onSelectSection = useCallback((id: SectionId) => {
    setSection(id);
    navigate(`?section=${id}`, { replace: true });
  }, [navigate]);

  return (
    <div
      style={{
        display: 'flex', height: '100vh', overflow: 'hidden',
        fontFamily: "'Inter', sans-serif",
        fontSize: theme.baseFontSize,
        color: theme.text,
        background: theme.bg,
      }}
    >
      <Sidebar active={section} onSelect={onSelectSection} theme={theme} backendStatus={backendStatus} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Top header */}
        <header style={{
          height: 64, padding: '0 24px',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: `${theme.bg}cc`, backdropFilter: 'blur(10px)',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>{SECTION_TITLE[section]}</h2>
              <div style={{ 
                width: 8, height: 8, borderRadius: '50%', 
                background: backendStatus === 'online' ? theme.accent : '#ff3366', 
                boxShadow: `0 0 12px ${backendStatus === 'online' ? theme.accent : '#ff3366'}`, 
                animation: theme.animations ? 'pulse-dot 2s infinite' : 'none' 
              }} />
            </div>

            {/* Quick Access Desktop */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 20, padding: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: `1px solid ${theme.border}` }}>
              {[
                { id: 'noc', label: 'NOC', icon: '📡' },
                { id: 'wfm', label: 'Dispatch', icon: '⚙️' },
                { id: 'war-room', label: 'War Room', icon: '⚔️' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => onSelectSection(item.id as any)}
                  style={{
                    padding: '6px 12px', borderRadius: 8, border: 'none',
                    background: section === item.id ? `${theme.accent}20` : 'transparent',
                    color: section === item.id ? theme.accent : theme.dim,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', gap: 6
                  }}
                >
                  <span>{item.icon}</span>
                  <span className="hidden md:inline">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* City Filter */}
            <div style={{ position: 'relative', display: section === 'noc' || section === 'wfm' ? 'block' : 'none' }}>
              <select 
                style={{
                  background: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.border}`,
                  color: theme.text, borderRadius: 8, padding: '6px 32px 6px 12px',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', appearance: 'none', outline: 'none'
                }}
              >
                <option value="">Monterrey ▼</option>
                <option value="mty">Monterrey</option>
                <option value="sal">Saltillo</option>
                <option value="pn">Piedras Negras</option>
              </select>
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 8, opacity: 0.5 }}>▼</span>
            </div>

            {/* Notifications */}
            <button style={{ position: 'relative', background: 'transparent', border: 'none', cursor: 'pointer', padding: 8 }}>
              <span style={{ fontSize: 20 }}>🔔</span>
              <div style={{
                position: 'absolute', top: 0, right: 0,
                background: '#FF4D6D', color: '#fff', fontSize: 9, fontWeight: 900,
                padding: '2px 5px', borderRadius: 10, border: `2px solid ${theme.bg}`,
                boxShadow: '0 2px 10px rgba(255,77,109,0.4)'
              }}>
                235
              </div>
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${theme.accent}10`, border: `1px solid ${theme.accent}30`, borderRadius: 20, padding: '6px 16px' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: theme.accent, animation: theme.animations ? 'pulse-dot 1.5s infinite' : 'none' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: theme.accent, letterSpacing: 0.5 }}>LIVE MONITOR</span>
            </div>
          </div>
        </header>

        <Content
          section={section}
          theme={theme}
          activeThemeId={activeThemeId}
          onThemeChange={patchTheme}
          onThemeReset={resetTheme}
          onApplyPreset={applyPreset}
          cities={realCities}
          alerts={realAlerts}
          activeTenantId={activeTenantId}
          onTenantChange={setActiveTenantId}
          bridgeData={bridgeData}
          backendStatus={backendStatus}
          onSelect={onSelectSection}
        />
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%,100% { opacity:1; transform:scale(1) }
          50%      { opacity:.5; transform:scale(1.3) }
        }
        @keyframes matrix-scroll {
          0% { background-position: 0 0 }
          100% { background-position: 0 100% }
        }
        .matrix-bg {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(rgba(0,255,65,0.03) 50%, transparent 50%);
          background-size: 100% 4px;
          pointer-events: none; z-index: 100;
          animation: matrix-scroll 20s linear infinite;
        }
        input[type=range] { height: 4px }
        ::-webkit-scrollbar { width:4px }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:2px }
        button:focus { outline:none }
      `}</style>
      {activeThemeId === 'matrix' && <div className="matrix-bg" />}
      <FloatingChat theme={theme} section={section} />
    </div>
  );
}
