import React, { useState } from 'react';
import type { ThemeConfig } from '../types';

interface Props { theme: ThemeConfig }

// ─── Datos estáticos del producto ────────────────────────────────────────────

const DECISIONES = [
  { tema: 'Modelo',        decision: 'White-label SaaS · cada ISP con su propio subdominio y marca' },
  { tema: 'Stack',         decision: 'Next.js 16 App Router · Tailwind v4 · TypeScript' },
  { tema: 'Auth cliente',  decision: 'OTP por teléfono → verificar email en UISP → session JWT' },
  { tema: 'Dispositivos',  decision: 'UISP API v2.1 · token por tenant · datos en server-side (ocultar key)' },
  { tema: 'Facturación',   decision: 'MercadoPago para México · Stripe para USA (pendiente definir)' },
  { tema: 'Segmento',      decision: 'ISPs medianos MX · 200–5,000 clientes · microonda + fibra' },
  { tema: 'Cuadrillas',    decision: 'Integración cuadrillas.mx multi-tenant · Odoo como backend de tickets' },
  { tema: 'Idioma',        decision: 'Español por defecto · inglés disponible (next-intl instalado)' },
  { tema: 'Deploy',        decision: 'Vercel (frontend) + Railway / VPS (backend cuadrillas)' },
];

const MODULOS = [
  {
    id: 'zona-cliente',
    label: 'Zona de Cliente',
    icon: '🖥️',
    color: '#C8A84B',
    estado: 'progreso',
    pct: 45,
    rutas: ['/dashboard', '/dashboard/devices', '/dashboard/billing', '/dashboard/profile'],
    descripcion: 'Portal web para que el cliente final vea su estado de conexión, equipos, plan y facturas.',
    pendientes: ['Conectar datos de consumo reales desde UISP', 'Integrar MercadoPago billing real', 'OTP auth flow completo'],
  },
  {
    id: 'soporte',
    label: 'Soporte & Tickets',
    icon: '🎧',
    color: '#3B82F6',
    estado: 'pendiente',
    pct: 20,
    rutas: ['/dashboard/support'],
    descripcion: 'Sistema de tickets de soporte integrado con el equipo técnico del ISP.',
    pendientes: ['Conectar backend tickets', 'Vista técnico vs vista cliente', 'Notificación Telegram al técnico'],
  },
  {
    id: 'cuadrillas',
    label: 'Cuadrillas (Campo)',
    icon: '🚛',
    color: '#8B5CF6',
    estado: 'progreso',
    pct: 60,
    rutas: ['/cuadrillas (repo xcien-campo)'],
    descripcion: 'App de gestión de equipos de campo: tickets, mapa técnicos, Odoo sync, Telegram, multi-ISP.',
    pendientes: ['Frontend moderno (actualmente HTML estático)', 'Dashboard técnico vs admin', 'GPS en tiempo real'],
  },
  {
    id: 'speedtest',
    label: 'Speedtest NOC',
    icon: '⚡',
    color: '#10B981',
    estado: 'completado',
    pct: 90,
    rutas: ['/dashboard/speedtest'],
    descripcion: 'Test de velocidad desde el portal del cliente hacia el NOC del ISP.',
    pendientes: ['Calibrar servidor iperf por ISP'],
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: '📊',
    color: '#EF4444',
    estado: 'pendiente',
    pct: 15,
    rutas: ['/dashboard/reportes/tecnicos', '/dashboard/reportes/financieros'],
    descripcion: 'Reportes técnicos (caídas, latencia) y financieros (ingresos, morosidad) por ISP.',
    pendientes: ['Definir métricas por tipo de reporte', 'Conectar fuente de datos real', 'Export PDF'],
  },
];

const ISPS = [
  {
    id: 'iblack',
    nombre: 'iBlack',
    emoji: '🖤',
    ciudad: 'Monterrey, NL',
    clientes: 850,
    estado: 'piloto',
    color: '#C8A84B',
    uisp: 'Disponible',
    mp: 'Pendiente conectar',
    notas: 'ISP piloto. Stack configurado. Datos de dispositivos reales vía UISP.',
  },
  {
    id: 'luminet',
    nombre: 'Luminet',
    emoji: '💡',
    ciudad: 'Aguascalientes, AGS',
    clientes: 320,
    estado: 'prospecto',
    color: '#F59E0B',
    uisp: 'Por definir',
    mp: 'Por definir',
    notas: 'Prospecto activo. Interés en cuadrillas.mx + zona de cliente.',
  },
  {
    id: 'wispi',
    nombre: 'XCIEN / wispi',
    emoji: '📡',
    ciudad: 'Multi-plaza',
    clientes: 2400,
    estado: 'prospecto',
    color: '#00C896',
    uisp: 'wispi17 activo',
    mp: 'No aplica (Odoo)',
    notas: 'Uso interno: cuadrillas ya integrado con wispi17. Zona cliente es evaluación.',
  },
];

const RIESGOS = [
  { riesgo: 'Dependencia total en UISP API', nivel: 'alta', mitigacion: 'Cache local + fallback si UISP no responde. No bloquear UI si API falla.' },
  { riesgo: 'OTP flow sin definir provider', nivel: 'critico', mitigacion: 'Decidir: Twilio vs Vonage vs WhatsApp Business API. Requiere presupuesto.' },
  { riesgo: 'MercadoPago sin integrar — billing estático', nivel: 'critico', mitigacion: 'Conectar /v1/payments y /v1/subscriptions antes de piloto con cliente real.' },
  { riesgo: 'Frontend cuadrillas.mx en HTML estático', nivel: 'alta', mitigacion: 'Migrar a React/Next.js o al menos modernizar con componentes reutilizables.' },
  { riesgo: 'Sin auth middleware en iBlack portal', nivel: 'alta', mitigacion: 'next-intl instalado pero middleware de sesión no activo. Bloquear rutas /dashboard sin token.' },
  { riesgo: 'Multi-tenant sin aislamiento de datos validado', nivel: 'media', mitigacion: 'Auditar tenants.yaml + filtros Odoo en cuadrillas — verificar que ISP A no vea datos de ISP B.' },
];

const PROCESO_ONBOARDING = [
  { paso: 1, accion: 'Alta de ISP: dominio, brand, colores, logo', responsable: 'José Miguel', estado: 'pendiente' },
  { paso: 2, accion: 'Configurar UISP_URL + UISP_TOKEN del ISP en env', responsable: 'José Miguel', estado: 'pendiente' },
  { paso: 3, accion: 'Configurar tenant en tenants.yaml (cuadrillas)', responsable: 'José Miguel', estado: 'pendiente' },
  { paso: 4, accion: 'Conectar MercadoPago del ISP (clave propia)', responsable: 'ISP + JM', estado: 'pendiente' },
  { paso: 5, accion: 'Prueba de zona de cliente con usuario real', responsable: 'José Miguel + ISP', estado: 'pendiente' },
  { paso: 6, accion: 'Capacitar admin del ISP en panel cuadrillas', responsable: 'José Miguel', estado: 'pendiente' },
  { paso: 7, accion: 'Go-live y monitoreo semana 1', responsable: 'José Miguel', estado: 'pendiente' },
];

const ESTADO_COLOR: Record<string, string> = {
  completado: '#00C896', progreso: '#FFB703', pendiente: '#6b7280', bloqueado: '#FF4757',
};
const NIVEL_COLOR: Record<string, string> = {
  critico: '#FF4757', alta: '#FFB703', media: '#3B82F6',
};
const ISP_ESTADO_COLOR: Record<string, string> = {
  piloto: '#C8A84B', prospecto: '#3B82F6', activo: '#00C896',
};

const TABS = ['Módulos', 'ISPs', 'Decisiones', 'Proceso', 'Riesgos'] as const;
type Tab = typeof TABS[number];

// ─── Componentes base ────────────────────────────────────────────────────────

function Card({ children, style, theme }: { children: React.ReactNode; style?: React.CSSProperties; theme: ThemeConfig }) {
  return (
    <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 12, padding: '16px 20px', ...style }}>
      {children}
    </div>
  );
}

function SLabel({ children, color = '#C8A84B' }: { children: React.ReactNode; color?: string }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color, marginBottom: 10 }}>
      {children}
    </p>
  );
}

function Bar({ pct, color, theme }: { pct: number; color: string; theme: ThemeConfig }) {
  return (
    <div style={{ background: theme.border, borderRadius: 6, height: 5, marginTop: 4, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, pct)}%`, background: color, height: '100%', borderRadius: 6, transition: 'width 0.4s ease' }} />
    </div>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      background: color + '22', color, border: `1px solid ${color}55`,
      borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700,
    }}>
      {label}
    </span>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function IBlackSection({ theme }: Props) {
  const [tab, setTab] = useState<Tab>('Módulos');

  const totalModulos   = MODULOS.length;
  const modulosActivos = MODULOS.filter(m => m.estado === 'progreso' || m.estado === 'completado').length;
  const riesgoCritico  = RIESGOS.filter(r => r.nivel === 'critico').length;
  const ispPiloto      = ISPS.filter(i => i.estado === 'piloto').length;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto', fontFamily: 'inherit' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 900, color: theme.text }}>🖤 iBlack — Zona de Cliente + Cuadrillas</span>
            <Chip label="PRODUCTO EN DESARROLLO" color="#C8A84B" />
          </div>
          <p style={{ fontSize: 13, color: theme.muted }}>
            White-label SaaS para ISPs · Portal de cliente + gestión de equipos de campo · Multi-tenant
          </p>
        </div>
      </div>

      {/* ── Blocker banner ──────────────────────────────────────────────────── */}
      <div style={{
        background: '#FF475712', border: '1px solid #FF475740',
        borderRadius: 10, padding: '10px 16px', marginBottom: 20,
        display: 'flex', alignItems: 'center', gap: 10, fontSize: 13,
      }}>
        <span style={{ color: '#FF4757', fontWeight: 700 }}>🔴 Bloqueadores críticos</span>
        <span style={{ color: theme.text }}>OTP provider sin definir · MercadoPago sin integrar · Middleware de auth inactivo</span>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Módulos activos', value: `${modulosActivos} / ${totalModulos}`, sub: 'en progreso o completo', color: '#C8A84B' },
          { label: 'ISPs configurados', value: String(ispPiloto),  sub: 'piloto iBlack', color: '#00C896' },
          { label: 'Riesgos críticos',  value: String(riesgoCritico), sub: 'requieren decisión', color: '#FF4757' },
          { label: 'Estado general',    value: '45%', sub: 'avance MVP cliente', color: '#8B5CF6' },
        ].map(k => (
          <Card key={k.label} theme={theme}>
            <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.muted, marginBottom: 6 }}>{k.label}</p>
            <p style={{ fontSize: 28, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</p>
            <p style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>{k.sub}</p>
          </Card>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${theme.border}`, paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 16px', fontSize: 13, fontWeight: 600,
              color: tab === t ? '#C8A84B' : theme.muted,
              borderBottom: tab === t ? '2px solid #C8A84B' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── MÓDULOS ─────────────────────────────────────────────────────────── */}
      {tab === 'Módulos' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {MODULOS.map(m => (
            <Card key={m.id} theme={theme}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{m.icon}</span>
                  <span style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>{m.label}</span>
                </div>
                <Chip label={m.estado} color={ESTADO_COLOR[m.estado]} />
              </div>
              <p style={{ fontSize: 12, color: theme.muted, marginBottom: 10, lineHeight: 1.5 }}>{m.descripcion}</p>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: theme.muted }}>
                  <span>Avance</span><span style={{ color: m.color, fontWeight: 700 }}>{m.pct}%</span>
                </div>
                <Bar pct={m.pct} color={m.color} theme={theme} />
              </div>
              {m.pendientes.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#FFB703', marginBottom: 4 }}>Pendientes</p>
                  {m.pendientes.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 3 }}>
                      <span style={{ color: '#FFB703', fontSize: 10, marginTop: 2 }}>○</span>
                      <span style={{ fontSize: 12, color: theme.muted }}>{p}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ── ISPs ────────────────────────────────────────────────────────────── */}
      {tab === 'ISPs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {ISPS.map(isp => (
            <Card key={isp.id} theme={theme}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{isp.emoji}</span>
                  <div>
                    <span style={{ fontWeight: 800, color: theme.text, fontSize: 15 }}>{isp.nombre}</span>
                    <span style={{ marginLeft: 8, fontSize: 12, color: theme.muted }}>{isp.ciudad}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Chip label={isp.estado} color={ISP_ESTADO_COLOR[isp.estado] ?? '#6b7280'} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: isp.color }}>{isp.clientes.toLocaleString()} clientes</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                <div style={{ background: theme.border + '44', borderRadius: 8, padding: '8px 12px' }}>
                  <p style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>UISP</p>
                  <p style={{ fontSize: 12, color: theme.text }}>{isp.uisp}</p>
                </div>
                <div style={{ background: theme.border + '44', borderRadius: 8, padding: '8px 12px' }}>
                  <p style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>MercadoPago</p>
                  <p style={{ fontSize: 12, color: theme.text }}>{isp.mp}</p>
                </div>
                <div style={{ background: theme.border + '44', borderRadius: 8, padding: '8px 12px' }}>
                  <p style={{ fontSize: 10, color: theme.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>Notas</p>
                  <p style={{ fontSize: 11, color: theme.muted }}>{isp.notas}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── DECISIONES ──────────────────────────────────────────────────────── */}
      {tab === 'Decisiones' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {DECISIONES.map((d, i) => (
            <Card key={i} theme={theme} style={{ borderLeft: '3px solid #C8A84B' }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#C8A84B', marginBottom: 6 }}>
                {d.tema}
              </p>
              <p style={{ fontSize: 13, color: theme.text, lineHeight: 1.5 }}>{d.decision}</p>
            </Card>
          ))}
        </div>
      )}

      {/* ── PROCESO ONBOARDING ISP ──────────────────────────────────────────── */}
      {tab === 'Proceso' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SLabel>Proceso de onboarding — nuevo ISP cliente</SLabel>
          {PROCESO_ONBOARDING.map(p => {
            const color = ESTADO_COLOR[p.estado] ?? '#6b7280';
            return (
              <Card key={p.paso} theme={theme} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: color + '22', border: `2px solid ${color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color,
                }}>
                  {p.paso}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: theme.text, fontWeight: 500 }}>{p.accion}</p>
                  <p style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>👤 {p.responsable}</p>
                </div>
                <Chip label={p.estado} color={color} />
              </Card>
            );
          })}
        </div>
      )}

      {/* ── RIESGOS ─────────────────────────────────────────────────────────── */}
      {tab === 'Riesgos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {RIESGOS.map((r, i) => {
            const c = NIVEL_COLOR[r.nivel] ?? '#6b7280';
            return (
              <Card key={i} theme={theme} style={{ borderLeft: `3px solid ${c}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, color: theme.text, fontSize: 13 }}>{r.riesgo}</span>
                  <Chip label={r.nivel} color={c} />
                </div>
                <p style={{ fontSize: 12, color: theme.muted }}>
                  <span style={{ color: '#00C896', fontWeight: 600 }}>Mitigación:</span> {r.mitigacion}
                </p>
              </Card>
            );
          })}
        </div>
      )}

    </div>
  );
}
