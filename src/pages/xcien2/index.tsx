import { useState, useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Radio, Map, Settings, Truck, Phone, Package, ArrowLeftRight,
  GraduationCap, Link2, GitBranch, BarChart2, FileText, BookOpen,
  Shield, Users, User, Calendar, Bot, Zap, Swords, Smartphone, Bell,
  Database, Settings2, LayoutGrid, ChevronLeft, ChevronRight,
  Activity, Network, Layers, AlertTriangle,
} from 'lucide-react';
import HexoField3D from '../../components/HexoField3D';
import { API_BASE } from '../../config';
import brand from '../../brand';
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
  { id: 'inv-transfers', label: 'Transferencias', icon: '🏷️', group: 'Operaciones' },

  { id: 'academia', label: 'Academia', icon: '🎓', group: 'Certificación' },

  { id: 'transacciones', label: 'Tokens Unificados', icon: '🔗', group: 'Administración' },
  { id: 'merkle', label: 'Merkle Feed', icon: '⛓️', group: 'Administración' },
  { id: 'gerencia', label: 'Gerencia', icon: '📊', group: 'Administración' },
  { id: 'reports', label: 'Reportes', icon: '📋', group: 'Administración' },
  { id: 'docs', label: 'Documentos', icon: '📚', group: 'Administración' },
  { id: 'rrhh', label: 'Recursos Humanos', icon: '👤', group: 'Administración' },
  { id: 'sala_juntas', label: 'Sala de Juntas', icon: '📅', group: 'Administración' },

  { id: 'foda', label: 'Análisis Estratégico', icon: '🛡️', group: 'Planeación' },
  { id: 'adopcion', label: 'Usuarios', icon: '👥', group: 'Planeación' },

  { id: 'agentes', label: 'Agentes IA', icon: '🤖', group: 'Infraestructura' },
  { id: 'bridge', label: 'Data Bridge', icon: '⚡', group: 'Infraestructura' },
  { id: 'war-room', label: 'Multi-Agente', icon: '⚔️', group: 'Infraestructura' },
  { id: 'mobile', label: 'Terminal Móvil', icon: '📱', group: 'Infraestructura' },
  { id: 'telegram', label: 'Bot de Alarmas', icon: '🤖', group: 'Infraestructura' },
  { id: 'backup', label: 'Migración', icon: '💾', group: 'Sistema' },
  { id: 'editor', label: 'Configuración', icon: '🎨', group: 'Sistema' },
];

// ── Lucide icon map ───────────────────────────────────────────────────────────
const NAV_ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  inicio: Home,
  noc: Radio,
  red: Network,
  wfm: Settings,
  bidrillas: Truck,
  call: Phone,
  scan: Package,
  'inv-transfers': ArrowLeftRight,
  academia: GraduationCap,
  transacciones: Link2,
  merkle: GitBranch,
  gerencia: BarChart2,
  reports: FileText,
  docs: BookOpen,
  rrhh: User,
  sala_juntas: Calendar,
  foda: Shield,
  adopcion: Users,
  agentes: Bot,
  bridge: Zap,
  'war-room': Swords,
  mobile: Smartphone,
  telegram: Bell,
  backup: Database,
  editor: Settings2,
  tokens: Link2,
  etiquetas: Package,
};

const SECTION_TITLE: Record<SectionId, string> = {
  inicio: 'Hub Principal',
  noc: 'Red en Vivo',
  red: 'Mapa de Red',
  wfm: 'Control Operativo',
  bidrillas: 'Equipos de Campo',
  call: 'Call Center',
  scan: 'Inventario & Scanner',
  tokens: 'Transacciones & Tokens',
  transacciones: 'Tokens Unificados',
  etiquetas: 'Etiquetas & Comprobantes',
  foda: 'Análisis Estratégico',
  adopcion: 'Gestión de Usuarios',
  academia: brand.academiaLabel,
  gerencia: 'Dashboard Gerencial',
  reports: 'Reportes & Gobierno',
  bridge: 'Antigravity Data Bridge',
  'war-room': 'Comando Multi-Agente',
  mobile: 'Terminal Móvil',
  telegram: 'Monitor de Alarmas',
  docs: 'Biblioteca Documental',
  rrhh: 'Recursos Humanos',
  sala_juntas: 'Sala de Juntas',
  backup: 'Migración & Redundancia',
  editor: 'Configuración',
  agentes: 'Agentes IA',
};

// ── UISP color constants ──────────────────────────────────────────────────────
const U = {
  bg: '#0d1117',
  sidebar: '#141921',
  header: '#0f1520',
  accent: '#00aff0',
  border: 'rgba(255,255,255,0.06)',
  text: '#e2e8f0',
  dim: '#64748b',
  muted: '#94a3b8',
  card: '#1a2234',
  active: 'rgba(0,175,240,0.08)',
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
interface SidebarProps {
  active: SectionId;
  onSelect: (id: SectionId) => void;
  theme: ThemeConfig;
  backendStatus: 'online' | 'offline';
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function Sidebar({ active, onSelect, backendStatus, collapsed, onToggleCollapse }: SidebarProps) {
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

  return (
    <div style={{
      width: collapsed ? 56 : 220,
      flexShrink: 0,
      background: U.sidebar,
      borderRight: `1px solid ${U.border}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 200,
    }}>
      {/* Logo bar */}
      <div style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 16px',
        borderBottom: `1px solid ${U.border}`,
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        <img src={brand.logo} alt={brand.name} style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }} />
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: U.text, letterSpacing: -0.3 }}>{brand.name}</span>
            <span style={{
              color: U.accent, fontSize: 9, fontWeight: 700,
              background: 'rgba(0,175,240,0.12)',
              padding: '2px 5px', borderRadius: 3, letterSpacing: 0.5,
            }}>{brand.version}</span>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '6px 0' }}>
        {groups.map(({ label, items }) => (
          <div key={label ?? '__root__'}>
            {/* Group separator / label */}
            {label && (
              collapsed
                ? <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '6px 8px' }} />
                : <div style={{
                    padding: '10px 16px 3px',
                    fontSize: 9, fontWeight: 700,
                    letterSpacing: 1.5,
                    color: U.dim,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}>{label}</div>
            )}

            {items.map(item => {
              const Icon = NAV_ICONS[item.id] || LayoutGrid;
              const isActive = active === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
                  title={collapsed ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: 10,
                    width: '100%',
                    padding: collapsed ? '10px 0' : '8px 14px',
                    background: isActive ? U.active : 'transparent',
                    borderTop: 'none',
                    borderRight: 'none',
                    borderBottom: 'none',
                    borderLeft: isActive ? `2px solid ${U.accent}` : '2px solid transparent',
                    color: isActive ? U.accent : U.muted,
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    letterSpacing: 0.1,
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
                  {!collapsed && (
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${U.border}`, flexShrink: 0 }}>
        {/* User */}
        {!collapsed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            borderBottom: `1px solid ${U.border}`,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: U.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 10, color: '#0d1117', flexShrink: 0,
            }}>JM</div>
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: U.text, whiteSpace: 'nowrap' }}>{brand.adminLabel}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: backendStatus === 'online' ? '#22c55e' : '#ef4444',
                }} />
                <span style={{ fontSize: 9, color: U.dim }}>
                  {backendStatus === 'online' ? 'Conectado' : 'Sin conexión'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-end',
            gap: 6,
            width: '100%',
            padding: collapsed ? '12px 0' : '10px 14px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: U.dim,
            fontSize: 11,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = U.text}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = U.dim}
        >
          {collapsed
            ? <ChevronRight size={15} />
            : <><span>Colapsar</span><ChevronLeft size={15} /></>
          }
        </button>
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
            <p style={{ fontSize: 16, color: theme.dim }}>Escanea el código para llevar el centro de mando {brand.name} {brand.version} en tu celular.</p>
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
    document.body.style.background = theme.bg;
  }, [theme]);

  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('section') as SectionId;
    if (id && id !== section) {
      if (SECTION_TITLE[id]) setSection(id);
      else setSection('inicio');
    }
  }, [location.search, section]);

  const onSelectSection = useCallback((id: SectionId) => {
    setSection(id);
    navigate(`?section=${id}`, { replace: true });
  }, [navigate]);

  const alertCount = realAlerts.filter(a => a.severity === 'critical' || a.severity === 'warning').length;

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
      fontSize: theme.baseFontSize,
      color: U.text,
      background: U.bg,
    }}>
      <Sidebar
        active={section}
        onSelect={onSelectSection}
        theme={theme}
        backendStatus={backendStatus}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(p => !p)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* UISP-style top header — 48px */}
        <header style={{
          height: 48,
          flexShrink: 0,
          padding: '0 20px',
          borderBottom: `1px solid ${U.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: U.header,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          {/* Left: breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: U.dim }}>{brand.name} {brand.version}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>/</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: U.text }}>
              {SECTION_TITLE[section]}
            </span>
          </div>

          {/* Right: status + alerts + user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Backend status */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px',
              background: backendStatus === 'online' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${backendStatus === 'online' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              borderRadius: 20,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: backendStatus === 'online' ? '#22c55e' : '#ef4444',
                boxShadow: backendStatus === 'online' ? '0 0 6px #22c55e' : 'none',
              }} />
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: backendStatus === 'online' ? '#22c55e' : '#ef4444',
                letterSpacing: 0.5,
              }}>
                {backendStatus === 'online' ? 'EN LÍNEA' : 'OFFLINE'}
              </span>
            </div>

            {/* Alerts bell */}
            <button
              onClick={() => onSelectSection('noc')}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34,
                background: alertCount > 0 ? 'rgba(239,68,68,0.08)' : 'transparent',
                border: `1px solid ${alertCount > 0 ? 'rgba(239,68,68,0.2)' : 'transparent'}`,
                borderRadius: 8, cursor: 'pointer',
                color: alertCount > 0 ? '#ef4444' : U.dim,
                transition: 'all 0.15s',
              }}
              title="Ver alertas"
            >
              <AlertTriangle size={15} />
              {alertCount > 0 && (
                <div style={{
                  position: 'absolute', top: 3, right: 3,
                  background: '#ef4444', color: '#fff',
                  fontSize: 8, fontWeight: 700,
                  width: 14, height: 14, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${U.header}`,
                }}>{alertCount > 99 ? '99' : alertCount}</div>
              )}
            </button>

            {/* Live pulse */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px',
              background: 'rgba(0,175,240,0.06)',
              border: '1px solid rgba(0,175,240,0.15)',
              borderRadius: 20,
            }}>
              <Activity size={11} color={U.accent} />
              <span style={{ fontSize: 10, fontWeight: 700, color: U.accent, letterSpacing: 0.5 }}>LIVE</span>
            </div>

            {/* User avatar */}
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: U.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 10, color: '#0d1117',
              marginLeft: 4, cursor: 'pointer',
              flexShrink: 0,
            }}>JM</div>
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
      {/* Matrix theme: hexo-particles 3D + scanline combinados */}
      {activeThemeId === 'matrix' && (
        <>
          <div className="matrix-bg" />
          <HexoField3D
            mode="ambient"
            accentColor="#00ff41"
            interactive={false}
            opacity={0.18}
            style={{
              position: 'fixed', inset: 0,
              pointerEvents: 'none',
              zIndex: 99,
            }}
          />
        </>
      )}
      <FloatingChat theme={theme} section={section} />
    </div>
  );
}
