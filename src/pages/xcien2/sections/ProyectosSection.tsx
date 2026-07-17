import { useState } from 'react';
import type { ThemeConfig } from '../types';
import brand from '../../../brand';

interface Props { theme: ThemeConfig }

const GREEN  = '#00C896';
const RED    = '#FF4757';
const YELLOW = '#FFB703';
const BLUE   = '#3B82F6';
const CYAN   = '#00B4D8';
const PURPLE = '#8B5CF6';
const DIM    = '#6b7280';

interface Project {
  id: string;
  name: string;
  group: string;
  status: 'operativo' | 'en_progreso' | 'pendiente' | 'mock';
  progress: number;
  dataSource: string;
  notes: string;
}

const PROJECTS: Project[] = [
  // Operaciones
  { id: 'noc', name: 'NOC Virtual', group: 'Operaciones', status: 'operativo', progress: 95, dataSource: 'NOCBoard Proxy + Observium', notes: 'Mapa, alertas, desglose por board' },
  { id: 'infra-energia', name: 'Infraestructura Energía', group: 'Operaciones', status: 'en_progreso', progress: 70, dataSource: 'NOCBoard Energía SNMP + Drive', notes: '29 SNMP activos, perfiles pendientes en GUI, mapa con coords por ciudad' },
  { id: 'red', name: 'Mapa de Red', group: 'Operaciones', status: 'operativo', progress: 85, dataSource: 'NOCBoard + Leaflet', notes: 'Tiles Fastly, capas por board' },
  { id: 'wfm', name: 'Control Operativo WFM', group: 'Operaciones', status: 'operativo', progress: 90, dataSource: 'Odoo CAST (project.task)', notes: 'Tickets, Kanban, comentarios, SLA' },
  { id: 'bidrillas', name: 'Equipos de Campo', group: 'Operaciones', status: 'operativo', progress: 85, dataSource: 'Odoo tasks + mapa', notes: 'KPIs por técnico, geocodificación' },
  { id: 'call', name: 'Call Center', group: 'Operaciones', status: 'en_progreso', progress: 60, dataSource: 'Odoo', notes: 'Funcional pero falta integración telefónica' },
  { id: 'scan', name: 'Inventario & Scanner', group: 'Operaciones', status: 'operativo', progress: 80, dataSource: 'Odoo stock.quant', notes: 'Productos, QR, tránsito lento' },
  { id: 'inv-transfers', name: 'Transferencias', group: 'Operaciones', status: 'operativo', progress: 75, dataSource: 'token_service', notes: 'Audit log, transferencias entre bodegas' },
  { id: 'incidentes', name: 'Incidentes', group: 'Operaciones', status: 'en_progreso', progress: 65, dataSource: 'Manual + Odoo', notes: 'P1/P2/P3, timeline, post-mortem' },

  // Certificación
  { id: 'academia', name: 'Academia', group: 'Certificación', status: 'en_progreso', progress: 75, dataSource: 'Odoo eLearning', notes: '29 cursos, 10 módulos Proyectos. Dashboard pendiente rediseño' },

  // Administración
  { id: 'ventas', name: 'Resumen Ventas', group: 'Administración', status: 'operativo', progress: 90, dataSource: 'Odoo sale.order + CSV', notes: 'MRR, órdenes, gráficas mensuales' },
  { id: 'reportes-kpi', name: 'KPI Dashboard', group: 'Administración', status: 'en_progreso', progress: 70, dataSource: 'Odoo + NOCBoard', notes: 'KPIs básicos, falta financiero' },
  { id: 'rrhh', name: 'Recursos Humanos', group: 'Administración', status: 'operativo', progress: 80, dataSource: 'Odoo hr.employee', notes: 'Directorio, organigrama' },
  { id: 'docs', name: 'Documentos', group: 'Administración', status: 'operativo', progress: 70, dataSource: 'Filesystem', notes: 'Xcien_Docs/' },
  { id: 'reportlab', name: 'PDF Generator', group: 'Administración', status: 'operativo', progress: 95, dataSource: 'ReportLab + XcienPDF', notes: 'Plantilla institucional, Telegram' },
  { id: 'gerencia', name: 'Gerencia', group: 'Administración', status: 'en_progreso', progress: 50, dataSource: 'Odoo', notes: 'Vista ejecutiva básica' },
  { id: 'transacciones', name: 'Tokens Unificados', group: 'Administración', status: 'operativo', progress: 80, dataSource: 'token_service', notes: 'Audit log completo' },

  // Planeación
  { id: 'foda', name: 'Análisis Estratégico', group: 'Planeación', status: 'mock', progress: 30, dataSource: 'Estático', notes: 'Contenido de demo, pendiente datos reales' },
  { id: 'adopcion', name: 'Usuarios', group: 'Planeación', status: 'mock', progress: 20, dataSource: 'Estático', notes: 'Métricas de demo' },

  // Infraestructura
  { id: 'agentes', name: 'Agentes IA', group: 'Infraestructura', status: 'en_progreso', progress: 55, dataSource: 'Claude API', notes: 'Chat funcional, Paperclip pendiente' },
  { id: 'telegram', name: 'Bot de Alarmas', group: 'Infraestructura', status: 'operativo', progress: 90, dataSource: 'Telegram API', notes: '2 bots: reportes + NOCBoard alertas' },
];

const STATUS_CONFIG = {
  operativo: { label: 'Operativo', color: GREEN, bg: 'rgba(0,200,150,0.1)' },
  en_progreso: { label: 'En progreso', color: YELLOW, bg: 'rgba(255,183,3,0.1)' },
  pendiente: { label: 'Pendiente', color: RED, bg: 'rgba(255,71,87,0.1)' },
  mock: { label: 'Mock/Demo', color: DIM, bg: 'rgba(255,255,255,0.03)' },
};

export default function ProyectosSection({ theme }: Props) {
  const [filter, setFilter] = useState<string>('all');

  const U = { bg: theme.bg, card: theme.card, text: theme.text, dim: theme.dim || '#8090a8', accent: theme.accent, border: theme.border || 'rgba(255,255,255,0.06)' };

  const filtered = filter === 'all' ? PROJECTS : PROJECTS.filter(p => p.status === filter || p.group === filter);
  const groups = [...new Set(PROJECTS.map(p => p.group))];

  const totalProgress = Math.round(PROJECTS.reduce((a, p) => a + p.progress, 0) / PROJECTS.length);
  const operativos = PROJECTS.filter(p => p.status === 'operativo').length;
  const enProgreso = PROJECTS.filter(p => p.status === 'en_progreso').length;
  const mocks = PROJECTS.filter(p => p.status === 'mock').length;

  const cardStyle = (extra?: React.CSSProperties): React.CSSProperties => ({ background: U.card, border: `1px solid ${U.border}`, borderRadius: 14, padding: 24, ...extra });

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1440, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>

      <div style={{ marginBottom: 6 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
          <span style={{ color: U.text }}>TABLERO DE </span>
          <span style={{ color: CYAN }}>PROYECTOS</span>
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: U.dim }}>
          {PROJECTS.length} secciones · Avance general {totalProgress}%
        </p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 20 }}>
        {[
          { label: 'AVANCE GENERAL', value: `${totalProgress}%`, color: totalProgress >= 70 ? GREEN : YELLOW, sub: `${PROJECTS.length} secciones` },
          { label: 'OPERATIVOS', value: operativos, color: GREEN, sub: `${Math.round(operativos/PROJECTS.length*100)}% del total` },
          { label: 'EN PROGRESO', value: enProgreso, color: YELLOW, sub: 'Desarrollo activo' },
          { label: 'MOCK / DEMO', value: mocks, color: DIM, sub: 'Pendiente datos reales' },
        ].map((kpi, i) => (
          <div key={i} style={cardStyle()}>
            <div style={{ fontSize: 10, fontWeight: 700, color: U.dim, letterSpacing: '0.1em', marginBottom: 8 }}>{kpi.label}</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: kpi.color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: U.dim, marginTop: 6 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Progress bar general */}
      <div style={cardStyle({ marginTop: 16 })}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: U.text }}>AVANCE POR GRUPO</span>
        </div>
        {groups.map(g => {
          const groupProjects = PROJECTS.filter(p => p.group === g);
          const groupPct = Math.round(groupProjects.reduce((a, p) => a + p.progress, 0) / groupProjects.length);
          return (
            <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: U.dim, width: 110, fontWeight: 600 }}>{g}</span>
              <div style={{ flex: 1, height: 10, background: U.border, borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${groupPct}%`, height: '100%', background: groupPct >= 80 ? GREEN : groupPct >= 50 ? YELLOW : RED, borderRadius: 5, transition: 'width 0.5s' }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: groupPct >= 80 ? GREEN : groupPct >= 50 ? YELLOW : RED, fontFamily: 'JetBrains Mono', width: 40, textAlign: 'right' }}>{groupPct}%</span>
              <span style={{ fontSize: 10, color: U.dim, width: 20 }}>{groupProjects.length}</span>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginTop: 20, marginBottom: 12, flexWrap: 'wrap' }}>
        {['all', 'operativo', 'en_progreso', 'mock', ...groups].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            background: filter === f ? 'rgba(0,200,150,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${filter === f ? GREEN : U.border}`,
            borderRadius: 20, padding: '5px 14px', color: filter === f ? GREEN : U.dim,
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>
            {{ all: 'Todos', operativo: '● Operativo', en_progreso: '● En progreso', mock: '● Mock' }[f] || f}
          </button>
        ))}
      </div>

      {/* Project cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {filtered.map(p => {
          const st = STATUS_CONFIG[p.status];
          return (
            <div key={p.id} style={cardStyle({ padding: 16 })}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: U.text }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: U.dim, marginTop: 2 }}>{p.group}</div>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 9, fontWeight: 700, color: st.color, background: st.bg, border: `1px solid ${st.color}30` }}>
                  {st.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1, height: 8, background: U.border, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${p.progress}%`, height: '100%', background: p.progress >= 80 ? GREEN : p.progress >= 50 ? YELLOW : RED, borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: p.progress >= 80 ? GREEN : p.progress >= 50 ? YELLOW : RED, fontFamily: 'JetBrains Mono', width: 38 }}>{p.progress}%</span>
              </div>
              <div style={{ fontSize: 10, color: CYAN, marginBottom: 4 }}>{p.dataSource}</div>
              <div style={{ fontSize: 10, color: U.dim }}>{p.notes}</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 14, fontSize: 10, color: U.dim, textAlign: 'right' }}>
        {brand.name} 2.0 · {PROJECTS.length} secciones · {new Date().toLocaleString('es-MX')}
      </div>
    </div>
  );
}
