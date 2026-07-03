import React, { useState, useReducer, useEffect, useCallback, useMemo, useRef, Suspense, lazy } from 'react';
import QRCode from 'qrcode';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Radio, Map, Settings, Truck, Phone, Package, ArrowLeftRight,
  GraduationCap, Link2, GitBranch, BarChart2, FileText, BookOpen,
  Shield, Users, User, Calendar, Bot, Zap, Swords, Smartphone, Bell,
  Database, Settings2, LayoutGrid, ChevronLeft, ChevronRight,
  Activity, Network, Layers, AlertTriangle, TrendingUp, BellRing,
} from 'lucide-react';
import { API_BASE } from '../../config';
import brand from '../../brand';
import { ThemeConfig, DEFAULT_THEME, SectionId, PresetTheme } from './types';
import { useAuth } from '../../contexts/AuthContext';
import { getRealCities, getRealAlerts, invalidateNOCCache } from '@/services/nocboard';
import { NOCCity, NOCAlert } from '@/types/noc';

// ── Siempre visibles — importación estática ───────────────────────────────────
import DevPanel from './DevPanel';
import NotificacionesPanel from './sections/NotificacionesPanel';
import CommandPalette from './sections/CommandPalette';
import InicioRol from './sections/InicioRol';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { useAnalytics } from '../../contexts/AnalyticsContext';
import FeedbackWidget from '../../components/FeedbackWidget';

import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, X as CloseIcon } from 'lucide-react';

// ── Secciones lazy — se cargan solo cuando el usuario las abre ────────────────
const HexoField3D        = lazy(() => import('../../components/HexoField3D'));
const InicioHoloSection  = lazy(() => import('./sections/InicioHoloSection'));
const NocSection         = lazy(() => import('./sections/NocSection'));
const InfraEnergiaSection = lazy(() => import('./sections/InfraEnergiaSection'));
const ProyectosSection    = lazy(() => import('./sections/ProyectosSection'));
const RedSection         = lazy(() => import('./sections/RedSection'));
const BidrillasSection   = lazy(() => import('./sections/BidrillasSection'));
const AcademiaSection    = lazy(() => import('./sections/AcademiaSection'));
const AcademiaHoloSection= lazy(() => import('./sections/AcademiaHoloSection'));
const WFMSection         = lazy(() => import('./sections/WFMSection'));
const RRHHSection        = lazy(() => import('./sections/RRHHSection'));
const SalaJuntasSection  = lazy(() => import('./sections/SalaJuntasSection'));
const VentasSection      = lazy(() => import('./sections/VentasSection'));
const AgentesSection     = lazy(() => import('./sections/AgentesSection'));
const InventarioSection  = lazy(() => import('./sections/InventarioSection'));
const InventarioTransfersSection = lazy(() => import('./sections/InventarioTransfersSection'));
const XcienTokensSection = lazy(() => import('./sections/XcienTokensSection'));
const MerkleFeedSection  = lazy(() => import('./sections/MerkleFeedSection'));
const FodaSection        = lazy(() => import('./sections/FodaSection'));
const Estrategia2030Section = lazy(() => import('./sections/Estrategia2030Section'));
const ProyectosDashboardSection = lazy(() => import('./sections/ProyectosDashboardSection'));
const SuperAdminSection     = lazy(() => import('./sections/SuperAdminSection'));
const CerebroSection        = lazy(() => import('./sections/CerebroSection'));
const AdopcionSection    = lazy(() => import('./sections/AdopcionSection'));
const TelegramBotSection = lazy(() => import('./sections/TelegramBotSection'));
const DocsSection        = lazy(() => import('./sections/DocsSection'));
const BackupSection      = lazy(() => import('./sections/BackupSection'));
const ReportLabSection   = lazy(() => import('./sections/ReportLabSection'));
const FinanzasSection    = lazy(() => import('./sections/FinanzasSection'));
const WarRoomSection          = lazy(() => import('./sections/WarRoomSection'));
const ReportesKPISection      = lazy(() => import('./sections/ReportesKPISection'));
const IncidentesSection       = lazy(() => import('./sections/IncidentesSection'));
const ComiteSection           = lazy(() => import('./sections/ComiteSection'));
const TokenConsumptionSection = lazy(() => import('./sections/TokenConsumptionSection'));
const ImpactoSection          = lazy(() => import('./sections/ImpactoSection'));
const IntegridadSection       = lazy(() => import('./sections/IntegridadSection'));
const AnalyticsSection        = lazy(() => import('./sections/AnalyticsSection'));
const HelpdeskSection         = lazy(() => import('./sections/HelpdeskSection'));
const Net2PhoneSection        = lazy(() => import('./sections/Net2PhoneSection'));
const CallCenter         = lazy(() => import('../CallCenter'));
const Gerencia           = lazy(() => import('../Gerencia'));
const ReportesGobierno   = lazy(() => import('../ReportesGobierno'));

// ── Theme reducer ─────────────────────────────────────────────────────────────
type ThemeAction = { type: 'patch'; payload: Partial<ThemeConfig> } | { type: 'reset' };

function themeReducer(state: ThemeConfig, action: ThemeAction): ThemeConfig {
  switch (action.type) {
    case 'patch': return { ...state, ...action.payload };
    case 'reset': return DEFAULT_THEME;
    default: return state;
  }
}

// ── Acceso por rol ────────────────────────────────────────────────────────────
const ROLE_SECTIONS: Record<string, SectionId[] | '*'> = {
  admin:     '*',
  director:  ['inicio','impacto','noc','red','incidentes','ventas','integridad','reportes-kpi',
               'rrhh','sala_juntas','proyectos','plan2026','estrategia2030','foda',
               'agentes','war-room','comite','docs','reportlab','analytics'],
  noc:       ['inicio','noc','red','infra-energia','incidentes','telegram','wfm','bidrillas','helpdesk','docs'],
  wfm:       ['inicio','wfm','bidrillas','scan','inv-transfers','docs','sala_juntas'],
  comercial: ['inicio','ventas','integridad','reportes-kpi','docs','sala_juntas'],
  preventa:  ['inicio','ventas','reportes-kpi','proyectos','plan2026','docs','sala_juntas'],
  almacen:   ['inicio','scan','inv-transfers','docs'],
  rrhh:      ['inicio','rrhh','academia','docs','sala_juntas'],
  academico: ['inicio','academia','docs'],
  tecnico:   ['inicio','academia','docs'],
  readonly:  ['inicio'],
};

function canAccess(rol: string | undefined, id: SectionId): boolean {
  if (!rol) return false;
  const allowed = ROLE_SECTIONS[rol] ?? [];
  if (allowed === '*') return true;
  return allowed.includes(id);
}

// ── Navigation structure ──────────────────────────────────────────────────────
interface NavEntry { id: SectionId; label: string; icon: string; group?: string }

const NAV: NavEntry[] = [
  { id: 'inicio',  label: 'Hub Principal',     icon: '🏠' },
  { id: 'impacto', label: 'Impacto Operacional', icon: '🚀' },

  { id: 'noc', label: 'NOC VIRTUAL', icon: '📡', group: 'Operaciones' },
  { id: 'infra-energia', label: 'Infraestructura Energía', icon: '⚡', group: 'Operaciones' },
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
  { id: 'ventas',  label: 'Resumen Ventas', icon: '📈', group: 'Administración' },
  { id: 'integridad', label: 'Integridad Comercial', icon: '🔍', group: 'Administración' },
  { id: 'analytics',  label: 'Analytics de Uso',     icon: '📊', group: 'Administración' },
  { id: 'helpdesk',   label: 'Mesa de Ayuda',        icon: '🎧', group: 'Operaciones' },
  { id: 'net2phone',  label: 'Net2Phone Call Center', icon: '📞', group: 'Operaciones' },
  { id: 'reportes-kpi', label: 'KPI Dashboard', icon: '🎯', group: 'Administración' },
  { id: 'reports', label: 'Reportes', icon: '📋', group: 'Administración' },
  { id: 'reportlab', label: 'PDF Generator', icon: '📄', group: 'Administración' },
  { id: 'docs', label: 'Documentos', icon: '📚', group: 'Administración' },
  { id: 'rrhh', label: 'Recursos Humanos', icon: '👤', group: 'Administración' },

  { id: 'plan2026',  label: 'Plan 2026 · ClickUp',   icon: '🎯', group: 'Planeación' },
  { id: 'proyectos', label: 'Tablero de Proyectos', icon: '📊', group: 'Planeación' },
  { id: 'estrategia2030', label: 'Estrategia 2030', icon: '🚀', group: 'Planeación' },
  { id: 'foda', label: 'Análisis Estratégico', icon: '🛡️', group: 'Planeación' },
  { id: 'adopcion', label: 'Usuarios', icon: '👥', group: 'Planeación' },

  { id: 'incidentes', label: 'Incidentes', icon: '🚨', group: 'Operaciones' },
  { id: 'cerebro', label: 'Supercerebro', icon: '🧠', group: 'Infraestructura' },
  { id: 'agentes',  label: 'Agentes IA',       icon: '🤖', group: 'Infraestructura' },
  { id: 'comite',   label: 'Comité de Dirección', icon: '🏛️', group: 'Infraestructura' },
  { id: 'token-ai', label: 'Consumo de Tokens',  icon: '📈', group: 'Infraestructura' },
  { id: 'mobile', label: 'Terminal Móvil', icon: '📱', group: 'Infraestructura' },
  { id: 'telegram', label: 'Bot de Alarmas', icon: '🤖', group: 'Infraestructura' },
  { id: 'backup', label: 'Migración', icon: '💾', group: 'Sistema' },
  { id: 'editor', label: 'Configuración', icon: '🎨', group: 'Sistema' },
  { id: 'superadmin', label: 'Super Admin', icon: '🔐', group: 'Sistema' },
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
  ventas: TrendingUp,
  'reportes-kpi': Activity,
  reports: FileText,
  reportlab: FileText,
  docs: BookOpen,
  rrhh: User,
  sala_juntas: Calendar,
  foda: Shield,
  adopcion: Users,
  incidentes: AlertTriangle,
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
  noc: 'NOC VIRTUAL',
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
  ventas:   'Resumen de Ventas',
  'reportes-kpi': 'KPI Dashboard Ejecutivo',
  reports: 'Reportes & Gobierno',
  reportlab: 'PDF Generator',
  bridge: 'Antigravity Data Bridge',
  incidentes: 'Gestor de Incidentes de Red',
  'war-room': 'Comando Multi-Agente',
  mobile: 'Terminal Móvil',
  telegram: 'Monitor de Alarmas',
  docs: 'Biblioteca Documental',
  rrhh: 'Recursos Humanos',
  sala_juntas: 'Sala de Juntas',
  backup: 'Migración & Redundancia',
  editor: 'Configuración',
  agentes: 'Agentes IA',
  comite: 'Comité de Dirección',
  'token-ai': 'Consumo de Tokens AI',
  plan2026:  'Plan de Trabajo 2026',
  proyectos: 'Tablero de Proyectos',
  'infra-energia': 'Infraestructura Energía',
  cerebro: 'Supercerebro',
  'inv-transfers': 'Transferencias de Inventario',
  merkle: 'Merkle Feed',
  estrategia2030: 'Estrategia 2030',
  superadmin: 'Super Admin',
  holo: 'Academia Holográfica',
  integridad: 'Integridad Comercial',
  analytics:  'Analytics de Uso',
  helpdesk:   'Mesa de Ayuda',
  net2phone:  'Net2Phone Call Center',
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
  isMobile?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function Sidebar({ active, onSelect, backendStatus, collapsed, onToggleCollapse, isMobile, mobileOpen, onMobileClose }: SidebarProps) {
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

  const mobileStyle: React.CSSProperties = isMobile ? {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    width: 250,
    maxWidth: '82vw',
    transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
    boxShadow: mobileOpen ? '4px 0 24px rgba(0,0,0,0.4)' : 'none',
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'env(safe-area-inset-bottom)',
  } : {};
  const effCollapsed = isMobile ? false : collapsed;

  return (
    <>
    {isMobile && mobileOpen && (
      <div
        onClick={onMobileClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 199 }}
      />
    )}
    <div style={{
      width: isMobile ? 250 : (collapsed ? 56 : 220),
      flexShrink: 0,
      background: U.sidebar,
      borderRight: `1px solid ${U.border}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 200,
      ...mobileStyle,
    }}>
      {/* Logo bar */}
      <div style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '0 16px',
        borderBottom: `1px solid ${U.border}`,
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
        <img src={brand.logo} alt={brand.name} style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }} />
        {(!collapsed || isMobile) && (
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
        {isMobile && (
          <button
            onClick={onMobileClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, flexShrink: 0,
              background: 'transparent', border: 'none', color: U.dim, cursor: 'pointer',
            }}
            title="Cerrar menú"
          >
            <CloseIcon size={18} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '6px 0' }}>
        {groups.map(({ label, items }) => (
          <div key={label ?? '__root__'}>
            {/* Group separator / label */}
            {label && (
              collapsed && !isMobile
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
                  onClick={() => { onSelect(item.id); if (isMobile && onMobileClose) onMobileClose(); }}
                  title={effCollapsed ? item.label : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: effCollapsed ? 'center' : 'flex-start',
                    gap: 10,
                    width: '100%',
                    padding: effCollapsed ? '10px 0' : (isMobile ? '12px 14px' : '8px 14px'),
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
                  <Icon size={isMobile ? 17 : 15} strokeWidth={isActive ? 2.2 : 1.8} />
                  {!effCollapsed && (
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: isMobile ? 13 : 12 }}>
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
        {!effCollapsed && (
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

        {/* Collapse toggle — no aplica en móvil, ahí se cierra con el backdrop o la X */}
        {!isMobile && (
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
        )}
      </div>
    </div>
    </>
  );
}

// ── Error Boundary ────────────────────────────────────────────────────────────
type EBProps = { children: React.ReactNode; section: string };
type EBState = { error: Error | null };

class SectionErrorBoundary extends React.Component<EBProps, EBState> {
  constructor(props: EBProps) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidUpdate(prev: EBProps) {
    if (prev.section !== this.props.section && this.state.error) {
      this.setState({ error: null });
    }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 40, flexDirection: 'column', gap: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#ff3366', fontFamily: 'monospace' }}>
            ERROR EN SECCIÓN: {this.props.section.toUpperCase()}
          </div>
          <pre style={{
            background: 'rgba(255,51,102,0.08)', border: '1px solid rgba(255,51,102,0.3)',
            borderRadius: 10, padding: '16px 20px', fontSize: 11, color: '#fca5a5',
            maxWidth: 700, overflowX: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace',
          }}>
            {this.state.error.message}{'\n\n'}{this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Suspense fallback ─────────────────────────────────────────────────────────
function SectionSpinner() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#555', fontSize: 13 }}>
      <div style={{ width: 16, height: 16, border: '2px solid #00A651', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      Cargando sección...
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
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
  onNocRefresh?: () => void;
}

function Content({
  section, theme, activeThemeId, onThemeChange, onThemeReset, onApplyPreset,
  cities, alerts, activeTenantId, onTenantChange, bridgeData, onNocRefresh, backendStatus, odooStatus, observiumStatus, onSelect
}: ContentProps & { backendStatus: 'online' | 'offline', odooStatus: 'conectado' | 'desconectado', observiumStatus: 'conectado' | 'desconectado', onSelect: (id: SectionId) => void }) {
  const isMobile = useIsMobile();
  const padding = isMobile ? 16 : (theme.compact ? 20 : 32);
  const isFullHeight = section === 'red';
  return (
    <div style={{
      flex: 1, overflowY: isFullHeight ? 'hidden' : 'auto',
      padding: isFullHeight ? 0 : padding,
      background: theme.bg, minWidth: 0, width: '100%',
      display: 'flex', flexDirection: 'column',
      paddingBottom: isFullHeight ? 0 : `calc(${padding}px + env(safe-area-inset-bottom))`,
    }}>
      <Suspense fallback={<SectionSpinner />}>
      {section === 'inicio'   && <InicioRol theme={theme} onNavigate={onSelect} backendStatus={backendStatus} odooStatus={odooStatus} observiumStatus={observiumStatus} />}
      {section === 'impacto'  && <ImpactoSection />}
      {section === 'noc' && (
        <NocSection
          theme={theme}
          activeThemeId={activeThemeId}
          cities={cities}
          alerts={alerts}
          activeTenantId={activeTenantId}
          onTenantChange={onTenantChange}
          onRefresh={onNocRefresh}
        />
      )}
      {section === 'infra-energia' && <InfraEnergiaSection theme={theme} />}
      {section === 'red'      && <RedSection      theme={theme} />}
      {section === 'academia' && <AcademiaSection theme={theme} activeThemeId={activeThemeId} />}
      {section === 'wfm'      && <WFMSection      theme={theme} activeThemeId={activeThemeId} />}
      {section === 'bidrillas' && <BidrillasSection theme={theme} />}
      {section === 'rrhh'      && <RRHHSection      theme={theme} />}
      {section === 'sala_juntas' && <SalaJuntasSection theme={theme} />}
      {section === 'agentes'   && <AgentesSection   theme={theme} />}
      {section === 'comite'    && <ComiteSection    theme={theme} />}
      {section === 'token-ai'  && <TokenConsumptionSection theme={theme} />}
      {section === 'plan2026'  && <ProyectosDashboardSection />}
      {section === 'proyectos' && <ProyectosSection theme={theme} />}
      {section === 'estrategia2030' && <Estrategia2030Section theme={theme} />}
      {section === 'foda'     && <FodaSection     theme={theme} />}
      {section === 'adopcion' && <AdopcionSection theme={theme} />}
      {section === 'call'     && <CallCenter      theme={theme} activeThemeId={activeThemeId} />}
      {section === 'scan'          && <InventarioSection theme={theme} />}
      {section === 'etiquetas'     && <InventarioSection theme={theme} initialTab="etiquetas" />}
      {section === 'inv-transfers' && <InventarioTransfersSection theme={theme} />}
      {section === 'gerencia' && <Gerencia />}
      {section === 'ventas'   && <VentasSection theme={theme} />}
      {section === 'integridad' && <IntegridadSection theme={theme} />}
      {section === 'analytics'  && <AnalyticsSection />}
      {section === 'helpdesk'   && <HelpdeskSection />}
      {section === 'net2phone'  && <Net2PhoneSection />}
      {section === 'reportes-kpi' && <ReportesKPISection theme={theme} />}
      {section === 'reports' && <ReportesGobierno />}
      {section === 'reportlab' && <ReportLabSection theme={theme} />}
      {section === 'superadmin' && <SuperAdminSection theme={theme} />}
      {section === 'cerebro'    && <CerebroSection    theme={theme} />}

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

      {section === 'incidentes' && (
        <Suspense fallback={<SectionSpinner />}>
          <IncidentesSection theme={theme} />
        </Suspense>
      )}

      {section === 'war-room' && (
        <Suspense fallback={<SectionSpinner />}>
          <WarRoomSection theme={theme} />
        </Suspense>
      )}

      {section === 'mobile' && <MobileAccessSection theme={theme} />}
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
      </Suspense>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
// ── Terminal Móvil — QR dinámico ──────────────────────────────────────────────
function MobileAccessSection({ theme }: { theme: ThemeConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);

  // URL siempre derivada del hostname actual del browser.
  // Si estás en localhost → http://localhost:8080/
  // Si el celular abre 192.168.1.82:8080 → http://192.168.1.82:8080/
  // Funciona en cualquier red sin configuración extra.
  const mobileUrl = `${window.location.protocol}//${window.location.hostname}:8080/`;

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, mobileUrl, {
      width: 260,
      margin: 2,
      color: { dark: '#00A651', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    });
  }, [mobileUrl]);

  const copy = () => {
    navigator.clipboard.writeText(mobileUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const accent = theme.accent || '#00A651';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 28, fontFamily: "'Inter', sans-serif" }}>

      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: accent, marginBottom: 8, opacity: 0.7 }}>TERMINAL MÓVIL</div>
        <h2 style={{ fontSize: 30, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: -1 }}>
          Acceso desde <span style={{ color: accent }}>cualquier red</span>
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
          Escanea el código con tu celular en la misma red Wi-Fi
        </p>
      </div>

      {/* QR Card */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${accent}30`,
        borderRadius: 28,
        padding: 32,
        boxShadow: `0 0 80px ${accent}15, 0 30px 60px rgba(0,0,0,0.4)`,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Corner accents */}
        {[{top:0,left:0},{top:0,right:0},{bottom:0,left:0},{bottom:0,right:0}].map((pos, i) => (
          <div key={i} style={{
            position: 'absolute', width: 20, height: 20,
            borderTop: i < 2 ? `2px solid ${accent}` : 'none',
            borderBottom: i >= 2 ? `2px solid ${accent}` : 'none',
            borderLeft: i % 2 === 0 ? `2px solid ${accent}` : 'none',
            borderRight: i % 2 === 1 ? `2px solid ${accent}` : 'none',
            ...pos,
          }} />
        ))}

        <div style={{ background: '#fff', borderRadius: 16, padding: 12, boxShadow: `0 0 30px ${accent}20` }}>
          <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 8 }} />
        </div>
      </div>

      {/* URL pill */}
      <div
        onClick={copy}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${copied ? accent : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 16, padding: '14px 28px', textAlign: 'center', cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: copied ? `0 0 20px ${accent}30` : 'none',
        }}
      >
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, letterSpacing: 1 }}>URL DE RED LOCAL</div>
        <code style={{ fontSize: 18, fontWeight: 700, color: copied ? accent : '#fff', letterSpacing: 0.5 }}>
          {mobileUrl || '—'}
        </code>
        <div style={{ fontSize: 11, color: accent, marginTop: 6, opacity: copied ? 1 : 0, transition: 'opacity 0.2s' }}>
          ✓ Copiado al portapapeles
        </div>
      </div>

      {/* Info pills */}
      <div style={{ display: 'flex', gap: 12 }}>
        {[
          { icon: '📡', label: 'Misma red Wi-Fi' },
          { icon: '🔒', label: 'Red local privada' },
          { icon: '⚡', label: 'Sin internet requerido' },
        ].map(({ icon, label }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12, padding: '8px 14px', fontSize: 12, color: 'rgba(255,255,255,0.5)',
          }}>
            <span>{icon}</span>{label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Xcien2Page() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  // embed=1 → running inside native macOS app; hide the web sidebar
  const embedMode = new URLSearchParams(window.location.search).get('embed') === '1';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [cmdPaletteOpen, setCmdPaletteOpen] = useState(false);
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas, limpiar } = useNotificaciones();
  const [bridgeData, setBridgeData] = useState({ current_task: 'Inactivo', status: 'idle', log: [], last_update: '' });
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline'>('offline');
  const [odooStatus, setOdooStatus] = useState<'conectado' | 'desconectado'>('desconectado');
  const [observiumStatus, setObserviumStatus] = useState<'conectado' | 'desconectado'>('desconectado');
  const rol = user?.rol ?? 'readonly';
  const navFiltrado = useMemo(() => NAV.filter(e => canAccess(rol, e.id)), [rol]);
  const { trackSection, track } = useAnalytics();

  const [section, setSection] = useState<SectionId>(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get('section') as SectionId;
    return (s && SECTION_TITLE[s]) ? s : 'inicio';
  });

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`);
        if (res.ok) {
          setBackendStatus('online');
          const data = await res.json();
          if (data.odoo) setOdooStatus(data.odoo === 'conectado' ? 'conectado' : 'desconectado');
          if (data.observium) setObserviumStatus(data.observium === 'conectado' ? 'conectado' : 'desconectado');
        } else {
          setBackendStatus('offline');
        }
      } catch { setBackendStatus('offline'); }
    };
    checkBackend();
    const id = setInterval(checkBackend, 10000);
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
      const saved = localStorage.getItem('app_theme');
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

  const refreshNOC = useCallback(async () => {
    invalidateNOCCache();
    await loadRealData();
  }, []);

  useEffect(() => {
    loadRealData();
    const id = setInterval(loadRealData, 30_000);
    return () => clearInterval(id);
  }, []);

  // Global Cmd+K shortcut for command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(p => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const patchTheme = useCallback((patch: Partial<ThemeConfig>) => dispatch({ type: 'patch', payload: patch }), []);
  const resetTheme = useCallback(() => { dispatch({ type: 'reset' }); setActiveThemeId('xcien'); }, []);
  const applyPreset = useCallback((preset: PresetTheme) => {
    dispatch({ type: 'patch', payload: preset.config });
    setActiveThemeId(preset.id);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--app-accent', theme.accent);
    root.style.setProperty('--app-bg', theme.bg);
    root.style.setProperty('--app-card', theme.card);
    root.style.setProperty('--app-border', theme.border);
    root.style.setProperty('--app-text', theme.text);
    root.style.setProperty('--app-dim', theme.dim);
    root.style.setProperty('--app-radius', `${theme.radius}px`);
    root.style.setProperty('--app-font', `${theme.baseFontSize}px`);
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
    trackSection(id, undefined, section);
    setSection(id);
    navigate(`?section=${id}`, { replace: true });
  }, [navigate, section, trackSection]);

  const alertCount = realAlerts.filter(a => a.severity === 'critical' || a.severity === 'warning').length;

  return (
    <div style={{
      display: 'flex', height: '100vh', overflow: 'hidden',
      fontFamily: "'Inter', sans-serif",
      fontSize: theme.baseFontSize,
      color: U.text,
      background: U.bg,
    }}>
      {!embedMode && (
        <Sidebar
          active={section}
          onSelect={onSelectSection}
          theme={theme}
          backendStatus={backendStatus}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(p => !p)}
          isMobile={isMobile}
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* UISP-style top header — 48px (+ safe-area iOS en standalone) */}
        <header style={{
          height: 48,
          paddingTop: isMobile ? 'env(safe-area-inset-top)' : 0,
          minHeight: isMobile ? 'calc(48px + env(safe-area-inset-top))' : 48,
          flexShrink: 0,
          padding: isMobile
            ? 'env(safe-area-inset-top) 12px 0 12px'
            : '0 20px',
          borderBottom: `1px solid ${U.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: U.header,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          {/* Left: hamburger (móvil) + breadcrumb + search trigger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
            {isMobile && (
              <button
                onClick={() => setMobileNavOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40, flexShrink: 0,
                  background: 'rgba(255,255,255,0.04)', border: `1px solid ${U.border}`,
                  borderRadius: 8, color: U.text, cursor: 'pointer', marginRight: 2,
                }}
                title="Abrir menú"
              >
                <Menu size={18} />
              </button>
            )}
            {!isMobile && <span style={{ fontSize: 11, color: U.dim }}>{brand.name} {brand.version}</span>}
            {!isMobile && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>/</span>}
            <span style={{ fontSize: 12, fontWeight: 600, color: U.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
              {SECTION_TITLE[section]}
            </span>
            {!isMobile && (
              <button
                onClick={() => setCmdPaletteOpen(true)}
                style={{
                  marginLeft: 12,
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '4px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8, cursor: 'pointer', color: U.dim,
                  fontSize: 11, fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                title="Búsqueda global (Cmd+K)"
              >
                <span style={{ opacity: 0.6 }}>🔍</span>
                <span>Buscar…</span>
                <kbd style={{ padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 9, fontFamily: 'monospace', color: '#6b7280' }}>⌘K</kbd>
              </button>
            )}
          </div>

          {/* Right: status + alerts + user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 6, flexShrink: 0 }}>
            {/* Backend status — en móvil solo el punto, sin texto, para ahorrar espacio */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: isMobile ? 6 : '4px 10px',
              background: backendStatus === 'online' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${backendStatus === 'online' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
              borderRadius: 20,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: backendStatus === 'online' ? '#22c55e' : '#ef4444',
                boxShadow: backendStatus === 'online' ? '0 0 6px #22c55e' : 'none',
              }} />
              {!isMobile && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: backendStatus === 'online' ? '#22c55e' : '#ef4444',
                  letterSpacing: 0.5,
                }}>
                  {backendStatus === 'online' ? 'EN LÍNEA' : 'OFFLINE'}
                </span>
              )}
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

            {/* Live pulse — oculto en móvil para no saturar el header */}
            {!isMobile && (
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
            )}

            {/* Notification bell */}
            <button
              onClick={() => setNotifPanelOpen(p => !p)}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34,
                background: notifPanelOpen
                  ? 'rgba(255,183,3,0.12)'
                  : noLeidas > 0 ? 'rgba(255,183,3,0.06)' : 'transparent',
                border: `1px solid ${notifPanelOpen || noLeidas > 0 ? 'rgba(255,183,3,0.25)' : 'transparent'}`,
                borderRadius: 8, cursor: 'pointer',
                color: noLeidas > 0 ? '#FFB703' : U.dim,
                transition: 'all 0.15s',
              }}
              title="Notificaciones"
            >
              {noLeidas > 0 ? <BellRing size={15} /> : <Bell size={15} />}
              {noLeidas > 0 && (
                <div style={{
                  position: 'absolute', top: 3, right: 3,
                  background: '#FFB703', color: '#0d1117',
                  fontSize: 8, fontWeight: 900,
                  width: 14, height: 14, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${U.header}`,
                }}>{noLeidas > 99 ? '99' : noLeidas}</div>
              )}
            </button>

            {/* User badge real — en móvil solo el avatar, sin nombre/rol */}
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 4 }}>
                {!isMobile && (
                <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#e5e7eb' }}>
                    {user.nombre.split(' ').slice(0, 2).join(' ')}
                  </p>
                  <p style={{ margin: 0, fontSize: 9, color: U.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {user.rol}
                  </p>
                </div>
                )}
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${U.accent}, #00ff88)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 11, color: '#0d1117',
                  flexShrink: 0, cursor: 'default',
                  border: '2px solid rgba(255,255,255,0.1)',
                }}>
                  {user.nombre.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <button
                  onClick={logout}
                  title="Cerrar sesión"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: 6,
                    background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.15)',
                    color: '#ef4444', cursor: 'pointer', fontSize: 13,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.14)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.06)'; }}
                >
                  ⏻
                </button>
              </div>
            )}
          </div>
        </header>

        <SectionErrorBoundary section={section}>
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
            onNocRefresh={refreshNOC}
            backendStatus={backendStatus}
            odooStatus={odooStatus}
            observiumStatus={observiumStatus}
            onSelect={onSelectSection}
          />
        </SectionErrorBoundary>
      </div>

      {/* Notificaciones Panel */}
      <NotificacionesPanel
        open={notifPanelOpen}
        notificaciones={notificaciones}
        noLeidas={noLeidas}
        onClose={() => setNotifPanelOpen(false)}
        onMarcarLeida={marcarLeida}
        onMarcarTodasLeidas={marcarTodasLeidas}
        onLimpiar={limpiar}
        onNavigate={(id) => { onSelectSection(id); setNotifPanelOpen(false); }}
      />

      {/* Feedback Widget — mejora continua por proceso */}
      <FeedbackWidget
        section={section}
        sectionLabel={SECTION_TITLE[section]}
      />

      {/* Command Palette */}
      <CommandPalette
        open={cmdPaletteOpen}
        onClose={() => setCmdPaletteOpen(false)}
        onNavigate={(id) => { onSelectSection(id); setCmdPaletteOpen(false); }}
        secciones={navFiltrado}
      />

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
    </div>
  );
}
