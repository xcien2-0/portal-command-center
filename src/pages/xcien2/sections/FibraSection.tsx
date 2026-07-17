import React, { useState } from 'react';
import type { ThemeConfig } from '../types';

interface Props { theme: ThemeConfig }

// ─── Data ────────────────────────────────────────────────────────────────────

const PLAZAS = [
  {
    id: 'mty', nombre: 'Monterrey', emoji: '🟢',
    core: 'Purísima',
    infra: 'Anillo Alfa · 23 rutas KMZ',
    proveedor: 'Neutral Networks (troncales)',
    clientes: 6,
    estado: 'En piloto',
    color: '#00C896',
    fases: [
      { nombre: 'F1 — Diseño y definición', estado: 'progreso', pct: 45, detalle: 'SIDF en Odoo, kits, diagrama topológico, RZ Gustavo' },
      { nombre: 'F2 — Despliegue + convenio Neutral', estado: 'bloqueado', pct: 0, detalle: 'Requiere convenio firmado — blocker crítico' },
      { nombre: 'F3 — CWDM + pruebas', estado: 'pendiente', pct: 0, detalle: 'Depende de F2 · capacitación Raisecom' },
      { nombre: 'F4 — Piloto y lanzamiento', estado: 'pendiente', pct: 0, detalle: 'SLA 99.2% con 6 clientes piloto' },
    ],
  },
  {
    id: 'pn', nombre: 'Piedras Negras', emoji: '🔵',
    core: 'RB Piedras Negras',
    infra: 'Anillo + Lancemex · 21 cajas',
    proveedor: 'Monserrat (planta ext. · temporal)',
    clientes: 2,
    estado: 'Construida',
    color: '#3B82F6',
    fases: [
      { nombre: 'F1 — Diseño y definición', estado: 'completado', pct: 100, detalle: 'Kits básicos. Pendiente formalización SIDF en Odoo' },
      { nombre: 'F2 — Despliegue de fibra', estado: 'completado', pct: 100, detalle: 'Anillo PN (71 pts, 11 cajas) + Lancemex (50 pts, 7 cajas)' },
      { nombre: 'F3 — CWDM + migración topología', estado: 'bloqueado', pct: 10, detalle: 'Electrónica CWDM incompleta · 1 hilo/cliente — fecha urgente a Ingeniería' },
      { nombre: 'F4 — Activación y lanzamiento', estado: 'progreso', pct: 25, detalle: '~2.5 clientes activos. Expansión tras topología final' },
    ],
  },
  {
    id: 'slt', nombre: 'Saltillo', emoji: '🟣',
    core: 'Por definir',
    infra: '6 rutas KMZ disponibles',
    proveedor: 'Por definir',
    clientes: 0,
    estado: 'Mediano plazo',
    color: '#8B5CF6',
    fases: [
      { nombre: 'F1 — Levantamiento y definición', estado: 'pendiente', pct: 5, detalle: 'Requiere RZ de Gustavo. KMZ disponibles' },
      { nombre: 'F2 — Diseño de arquitectura', estado: 'pendiente', pct: 0, detalle: 'Core local, topología, switches. Depende F1' },
      { nombre: 'F3 — Despliegue de fibra', estado: 'pendiente', pct: 0, detalle: 'Red propia X100. Sin Neutral Networks' },
      { nombre: 'F4 — CWDM + SIDF + clientes', estado: 'pendiente', pct: 0, detalle: 'Piloto tras validar MTY y PN' },
    ],
  },
];

const COMPROMISOS = [
  { responsable: 'Ingeniería', compromiso: 'Fecha exacta culminación electrónica CWDM en PN', plaza: 'PN', prioridad: 'critica', estado: 'pendiente' },
  { responsable: 'Oswaldo Lozano', compromiso: 'Cargar SIDF con precios homologados en sistema', plaza: 'Todas', prioridad: 'alta', estado: 'pendiente' },
  { responsable: 'Rodrigo Flores', compromiso: 'Entregar framework/diagrama de diseño de red', plaza: 'MTY', prioridad: 'alta', estado: 'pendiente' },
  { responsable: 'Pedro Botello', compromiso: 'Documentar topología red (salida por POP PN)', plaza: 'PN', prioridad: 'alta', estado: 'pendiente' },
  { responsable: 'Alejandro Guzmán', compromiso: 'KMZ MTY + lista parques industriales al Sheet', plaza: 'MTY', prioridad: 'alta', estado: 'pendiente' },
  { responsable: 'Cecilia Núñez', compromiso: 'Cotización estándar Preventa para OC Neutral', plaza: 'MTY', prioridad: 'alta', estado: 'pendiente' },
  { responsable: 'Cecilia Núñez', compromiso: 'Conjuntar requerimientos Preventa + Infraestructura', plaza: 'MTY', prioridad: 'alta', estado: 'pendiente' },
  { responsable: 'José Miguel', compromiso: 'Solicitar mapa red Neutral + contrato a Rodrigo', plaza: 'MTY', prioridad: 'alta', estado: 'pendiente' },
  { responsable: 'José Miguel', compromiso: 'Visita a Piedras Negras — validación distribución', plaza: 'PN', prioridad: 'alta', estado: 'pendiente' },
  { responsable: 'José Miguel', compromiso: 'Compartir HTML al equipo + Drive compartido', plaza: 'Todas', prioridad: 'alta', estado: 'completado' },
  { responsable: 'JM + Oswaldo', compromiso: 'Documentar cajas de empalme con radios de alcance', plaza: 'Todas', prioridad: 'alta', estado: 'pendiente' },
  { responsable: 'Gustavo Cavazos', compromiso: 'Info red Neutral para mapa MTY', plaza: 'MTY', prioridad: 'media', estado: 'pendiente' },
  { responsable: 'Raúl Zapata', compromiso: 'KMZ validación rutas/empalmes MTY y SLT', plaza: 'MTY/SLT', prioridad: 'media', estado: 'pendiente' },
  { responsable: 'José Miguel', compromiso: 'Documentar Academia WISTI/ODU en base conocimiento', plaza: 'Interna', prioridad: 'media', estado: 'pendiente' },
  { responsable: 'Elizabeth Marines', compromiso: 'Llamar a José Miguel — grabación de sesión', plaza: 'Interna', prioridad: 'normal', estado: 'pendiente' },
];

const DECISIONES = [
  { tema: 'Tecnología', decision: 'CWDM Raisecom · 9 clientes/fibra · 1–10 Gbps' },
  { tema: 'Fibra', decision: 'Monomodo para distancias >300 m' },
  { tema: 'Segmento', decision: 'Solo empresarial — NO residencial' },
  { tema: 'Criterio on-net', decision: 'Hasta 1 km desde caja de empalme = on-net última milla' },
  { tema: 'Drop base', decision: 'Hasta 200 m incluido · >200 m o subterráneo: costo extra' },
  { tema: 'Contrato mínimo', decision: '36 meses · $50,000 MXN fondo instalación' },
  { tema: 'SKU Odoo', decision: 'Variante SIDF (de SIDP) · precios homologados a microonda' },
  { tema: 'Troncales Neutra', decision: 'Solo Monterrey — PN y SLT son red propia X100' },
  { tema: 'Cadencia reuniones', decision: 'Martes mediodía · hasta 75–80% avance' },
];

const RIESGOS = [
  { riesgo: 'Retraso convenio Neutral Networks', plaza: 'MTY', nivel: 'critico', mitigacion: 'Convenio firmado con fecha compromiso escrita' },
  { riesgo: 'Electrónica CWDM incompleta PN', plaza: 'PN', nivel: 'critico', mitigacion: 'Ingeniería debe entregar fecha exacta de cierre urgente' },
  { riesgo: 'Falta de RZ MTY y SLT', plaza: 'MTY/SLT', nivel: 'alta', mitigacion: 'Gustavo Cavazos entrega urgente' },
  { riesgo: 'Técnicos sin experiencia en fibra', plaza: 'Todas', nivel: 'alta', mitigacion: 'Pablo Capetillo: sesiones campo + proveedor acompaña' },
  { riesgo: 'Flujo Odoo SIDF no documentado', plaza: 'Todas', nivel: 'alta', mitigacion: 'Pedro + Samara documentan flujo SIDF' },
  { riesgo: 'OFFNET registra medio incorrecto', plaza: 'Todas', nivel: 'media', mitigacion: 'Anel Alcaraz actualiza a "fibra" y notifica' },
];

const SIDF_PASOS = [
  { paso: 1, accion: 'Crear variante SIDF a partir de SIDP en Odoo', responsable: 'Pedro Botello', estado: 'pendiente' },
  { paso: 2, accion: 'Definir estándar técnico (SLA, velocidades, kits)', responsable: 'Ingeniería + Pedro', estado: 'pendiente' },
  { paso: 3, accion: 'Documentar flujo entrega/activación en Odoo', responsable: 'Samara + Pedro', estado: 'pendiente' },
  { paso: 4, accion: 'Validar flujo (anteproyecto → instalación → activación)', responsable: 'Cecilia + Operaciones', estado: 'pendiente' },
  { paso: 5, accion: 'Capacitar equipo en nuevo flujo SIDF', responsable: 'Pedro / Oswaldo', estado: 'pendiente' },
];

// ─── Color helpers ────────────────────────────────────────────────────────────

const ESTADO_FASE: Record<string, { label: string; color: string }> = {
  completado: { label: 'Completado', color: '#00C896' },
  progreso:   { label: 'En progreso', color: '#FFB703' },
  bloqueado:  { label: 'Bloqueado', color: '#FF4757' },
  pendiente:  { label: 'Pendiente', color: '#6b7280' },
};

const PRIO_COLOR: Record<string, string> = {
  critica: '#FF4757',
  alta:    '#FFB703',
  media:   '#3B82F6',
  normal:  '#6b7280',
};

const NIVEL_COLOR: Record<string, string> = {
  critico: '#FF4757',
  alta:    '#FFB703',
  media:   '#3B82F6',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function Card({ children, style, theme }: { children: React.ReactNode; style?: React.CSSProperties; theme: ThemeConfig }) {
  return (
    <div style={{
      background: theme.card,
      border: `1px solid ${theme.border}`,
      borderRadius: 12,
      padding: '16px 20px',
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: accent ?? '#00C896', marginBottom: 14 }}>
      {children}
    </h2>
  );
}

function ProgressBar({ pct, color, theme }: { pct: number; color: string; theme: ThemeConfig }) {
  return (
    <div style={{ background: theme.border, borderRadius: 6, height: 5, marginTop: 4, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, background: color, borderRadius: 6, height: '100%', transition: 'width 0.4s ease' }} />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Tab = 'plazas' | 'compromisos' | 'sidf' | 'riesgos' | 'decisiones';

const TABS: { id: Tab; label: string }[] = [
  { id: 'plazas',      label: '📍 Plazas' },
  { id: 'compromisos', label: '✅ Compromisos' },
  { id: 'sidf',        label: '🔁 Proceso SIDF' },
  { id: 'riesgos',     label: '⚠️ Riesgos' },
  { id: 'decisiones',  label: '📌 Decisiones' },
];

export default function FibraSection({ theme }: Props) {
  const [tab, setTab] = useState<Tab>('plazas');
  const [plazaIdx, setPlazaIdx] = useState(0);

  const totalClientes = PLAZAS.reduce((s, p) => s + p.clientes, 0);
  const pendientes = COMPROMISOS.filter(c => c.estado === 'pendiente').length;
  const criticos = RIESGOS.filter(r => r.nivel === 'critico').length;

  const s: React.CSSProperties = {
    fontFamily: 'inherit',
    color: theme.text,
    padding: '20px 24px',
    maxWidth: 1100,
  };

  return (
    <div style={s}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 22 }}>🔆</span>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: theme.text }}>Fibra Óptica XCIEN · X100</h1>
          <span style={{ background: 'rgba(0,200,150,0.15)', color: '#00C896', border: '1px solid rgba(0,200,150,0.3)', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
            PROYECTO ACTIVO
          </span>
        </div>
        <p style={{ fontSize: 13, color: theme.dim }}>Reunión técnica 15 jul 2026 · 3 plazas · 15 compromisos</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Plazas activas', value: '3', sub: 'MTY · PN · SLT', color: '#00C896' },
          { label: 'Clientes activos', value: String(totalClientes), sub: '6 MTY · ~2 PN (piloto)', color: '#3B82F6' },
          { label: 'Compromisos pendientes', value: String(pendientes), sub: `de ${COMPROMISOS.length} totales`, color: '#FFB703' },
          { label: 'Riesgos críticos', value: String(criticos), sub: 'requieren atención urgente', color: '#FF4757' },
        ].map(k => (
          <Card key={k.label} theme={theme}>
            <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: theme.text, marginTop: 2 }}>{k.label}</div>
            <div style={{ fontSize: 11, color: theme.dim, marginTop: 2 }}>{k.sub}</div>
          </Card>
        ))}
      </div>

      {/* Blocker banner */}
      <div style={{ background: 'rgba(255,71,87,0.1)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 16 }}>🔴</span>
        <div>
          <span style={{ fontWeight: 700, color: '#FF4757', fontSize: 13 }}>Blocker crítico PN — </span>
          <span style={{ fontSize: 13, color: theme.text }}>Electrónica CWDM incompleta · actualmente 1 hilo/cliente · Ingeniería debe entregar fecha exacta de cierre</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${theme.border}`, marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? 'rgba(0,200,150,0.12)' : 'transparent',
            border: 'none',
            borderBottom: tab === t.id ? '2px solid #00C896' : '2px solid transparent',
            borderRadius: '6px 6px 0 0',
            padding: '8px 14px',
            cursor: 'pointer',
            color: tab === t.id ? '#00C896' : theme.dim,
            fontSize: 13,
            fontWeight: tab === t.id ? 700 : 400,
            transition: 'all 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Plazas ────────────────────────────────────────────────────── */}
      {tab === 'plazas' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {PLAZAS.map((p, i) => (
              <button key={p.id} onClick={() => setPlazaIdx(i)} style={{
                background: plazaIdx === i ? p.color + '22' : theme.card,
                border: `1px solid ${plazaIdx === i ? p.color + '60' : theme.border}`,
                borderRadius: 8, padding: '8px 16px', cursor: 'pointer',
                color: plazaIdx === i ? p.color : theme.dim,
                fontSize: 13, fontWeight: plazaIdx === i ? 700 : 400,
                transition: 'all 0.15s',
              }}>
                {p.emoji} {p.nombre}
              </button>
            ))}
          </div>

          {(() => {
            const p = PLAZAS[plazaIdx];
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Card theme={theme}>
                  <SectionTitle accent={p.color}>Arquitectura · {p.nombre}</SectionTitle>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <tbody>
                      {[
                        ['Core', p.core],
                        ['Infraestructura', p.infra],
                        ['Proveedor clave', p.proveedor],
                        ['Clientes activos', String(p.clientes)],
                        ['Estado', p.estado],
                      ].map(([k, v]) => (
                        <tr key={k} style={{ borderBottom: `1px solid ${theme.border}`}}>
                          <td style={{ padding: '7px 4px', color: theme.dim, fontWeight: 600, width: 140, fontSize: 12 }}>{k}</td>
                          <td style={{ padding: '7px 4px', color: theme.text }}>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                <Card theme={theme}>
                  <SectionTitle accent={p.color}>Fases del Proyecto</SectionTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {p.fases.map(f => {
                      const cfg = ESTADO_FASE[f.estado];
                      return (
                        <div key={f.nombre}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{f.nombre}</span>
                            <span style={{ fontSize: 11, color: cfg.color, fontWeight: 700 }}>{cfg.label}</span>
                          </div>
                          <ProgressBar pct={f.pct} color={cfg.color} theme={theme} />
                          <div style={{ fontSize: 11, color: theme.dim, marginTop: 4 }}>{f.detalle}</div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Tab: Compromisos ───────────────────────────────────────────────── */}
      {tab === 'compromisos' && (
        <Card theme={theme} style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['#', 'Responsable', 'Compromiso', 'Plaza', 'Prioridad', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: theme.dim, fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPROMISOS.map((c, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${theme.border}`, background: i % 2 === 0 ? theme.bg : 'transparent' }}>
                    <td style={{ padding: '9px 14px', color: theme.dim, fontSize: 11 }}>{i + 1}</td>
                    <td style={{ padding: '9px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>{c.responsable}</td>
                    <td style={{ padding: '9px 14px', color: theme.text }}>{c.compromiso}</td>
                    <td style={{ padding: '9px 14px', color: theme.dim, whiteSpace: 'nowrap', fontSize: 12 }}>{c.plaza}</td>
                    <td style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ color: PRIO_COLOR[c.prioridad], fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {c.prioridad === 'critica' ? '🔴' : c.prioridad === 'alta' ? '🟠' : c.prioridad === 'media' ? '🔵' : '⚪'} {c.prioridad}
                      </span>
                    </td>
                    <td style={{ padding: '9px 14px' }}>
                      <span style={{
                        background: c.estado === 'completado' ? 'rgba(0,200,150,0.15)' : 'rgba(255,183,3,0.1)',
                        color: c.estado === 'completado' ? '#00C896' : '#FFB703',
                        border: `1px solid ${c.estado === 'completado' ? 'rgba(0,200,150,0.3)' : 'rgba(255,183,3,0.25)'}`,
                        borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700,
                      }}>
                        {c.estado === 'completado' ? '✓ Listo' : '⏳ Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Tab: Proceso SIDF ─────────────────────────────────────────────── */}
      {tab === 'sidf' && (
        <div>
          <Card theme={theme} style={{ marginBottom: 16 }}>
            <SectionTitle>Flujo SIDF — Internet Dedicado por Fibra Óptica</SectionTitle>
            <p style={{ fontSize: 13, color: theme.dim, marginBottom: 16 }}>
              El producto de fibra óptica se crea como variante de Internet Dedicado (SIDP), cambiando el sufijo a <strong style={{ color: '#00C896' }}>SIDF</strong>.
              Mismo precio homologado a microonda, diferente SLA y medio de transmisión.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SIDF_PASOS.map(p => (
                <div key={p.paso} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: p.estado === 'completado' ? 'rgba(0,200,150,0.2)' : 'rgba(255,183,3,0.12)',
                    border: `1px solid ${p.estado === 'completado' ? 'rgba(0,200,150,0.4)' : 'rgba(255,183,3,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800,
                    color: p.estado === 'completado' ? '#00C896' : '#FFB703',
                  }}>
                    {p.estado === 'completado' ? '✓' : p.paso}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{p.accion}</div>
                    <div style={{ fontSize: 12, color: theme.dim, marginTop: 2 }}>Responsable: {p.responsable}</div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: p.estado === 'completado' ? 'rgba(0,200,150,0.15)' : 'rgba(255,71,87,0.1)',
                    color: p.estado === 'completado' ? '#00C896' : '#FF4757',
                    border: `1px solid ${p.estado === 'completado' ? 'rgba(0,200,150,0.3)' : 'rgba(255,71,87,0.25)'}`,
                  }}>
                    {p.estado === 'completado' ? '✓ Listo' : 'Pendiente'}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card theme={theme}>
            <SectionTitle>Modelo Comercial</SectionTitle>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['Concepto', 'Condición', 'Valor'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: theme.dim, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Fondo instalación', 'Contrato 36 meses', '$50,000 MXN'],
                  ['Drop base', 'Hasta 200 m', 'Incluido en el kit'],
                  ['Drop adicional', '>200 m o subterráneo', 'Costo extra (por definir)'],
                  ['SLA fibra propia', 'Tramos X100 (PN, SLT)', '99.5%–99.9%'],
                  ['SLA con Neutra', 'Tramos rentados (MTY)', '99.2%'],
                  ['Tiempo por sitio', 'Troncales disponibles', '2–4 semanas'],
                ].map(([c, cond, v], i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${theme.border}`, background: i % 2 === 0 ? theme.bg : 'transparent' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{c}</td>
                    <td style={{ padding: '8px 10px', color: theme.dim }}>{cond}</td>
                    <td style={{ padding: '8px 10px', color: '#00C896', fontWeight: 700 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* ── Tab: Riesgos ─────────────────────────────────────────────────── */}
      {tab === 'riesgos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {RIESGOS.map((r, i) => (
            <Card key={i} theme={theme} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '12px 16px' }}>
              <div style={{
                width: 8, borderRadius: 4, flexShrink: 0, alignSelf: 'stretch',
                background: NIVEL_COLOR[r.nivel],
                minHeight: 40,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{r.riesgo}</span>
                  <span style={{ fontSize: 11, color: NIVEL_COLOR[r.nivel], fontWeight: 700, textTransform: 'uppercase', background: NIVEL_COLOR[r.nivel] + '18', padding: '2px 8px', borderRadius: 20, border: `1px solid ${NIVEL_COLOR[r.nivel]}40` }}>
                    {r.nivel}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: theme.dim }}>Plaza: <strong style={{ color: theme.text }}>{r.plaza}</strong> · Mitigación: {r.mitigacion}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Tab: Decisiones ───────────────────────────────────────────────── */}
      {tab === 'decisiones' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {DECISIONES.map((d, i) => (
            <Card key={i} theme={theme} style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 18 }}>📌</span>
              <div>
                <div style={{ fontSize: 11, color: '#00C896', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{d.tema}</div>
                <div style={{ fontSize: 13, color: theme.text }}>{d.decision}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20, padding: '10px 14px', background: 'rgba(255,183,3,0.06)', border: '1px solid rgba(255,183,3,0.15)', borderRadius: 8, fontSize: 12, color: theme.dim }}>
        ⚠️ Próxima reunión: <strong style={{ color: '#FFB703' }}>martes mediodía</strong> · Cadencia semanal hasta 75–80% avance · Sesión 15 jul 2026 — 10 participantes · 15 compromisos generados
      </div>
    </div>
  );
}
