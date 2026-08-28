// FibraXCIENSection — Parent de Fibra Óptica XCIEN
// Plazas hijas: PDN (Piedras Negras) · MTY (Monterrey) · SLT (Saltillo)
import React, { useState, useEffect } from 'react';
import type { ThemeConfig } from '../types';
import CiudadOSSection from './CiudadOSSection';
import BlackstoneOSSection from './BlackstoneOSSection';
import { MTY_CONFIG, SLT_CONFIG, XCIEN_CORPORATE_THEME } from './ciudadConfigs';
import { API_BASE } from '../../../config';

const G  = '#2d7a3a';
const GD = '#1a3d2b';
const GB = '#c8dccb';
const BG = '#f8fdf9';
const SF = '#ffffff';
const TX = '#1a1a1a';
const DM = '#5a5a5a';
const AM = '#d97706';
const RD = '#dc2626';
const BL = '#3b82f6';

// ── Tipos ─────────────────────────────────────────────────────────────────────

type PlazaId = 'pdn' | 'mty' | 'slt';

interface PlazaMeta {
  id: PlazaId;
  nombre: string;
  estado_mx: string;
  emoji: string;
  color: string;
  clientes: number;
  estado: string;
  blocker?: string;
}

// ── Overview cards ─────────────────────────────────────────────────────────────

function PlazaCard({
  plaza, active, onClick,
}: { plaza: PlazaMeta; active: boolean; onClick: () => void }) {
  const semColor = plaza.estado === 'Construida' ? G
    : plaza.estado === 'En piloto' ? AM : BL;

  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, minWidth: 200, padding: '18px 20px',
        background: active ? GD : SF,
        border: `2px solid ${active ? G : GB}`,
        borderRadius: 14, cursor: 'pointer', textAlign: 'left',
        transition: 'all 0.15s', boxShadow: active ? `0 4px 16px ${G}30` : '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 24 }}>{plaza.emoji}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: active ? '#fff' : TX }}>{plaza.nombre}</div>
          <div style={{ fontSize: 11, color: active ? `${G}aa` : DM }}>{plaza.estado_mx}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{
            fontSize: 10, padding: '3px 10px', borderRadius: 100,
            background: `${semColor}22`, color: semColor,
            border: `1px solid ${semColor}44`, fontWeight: 600,
          }}>
            {plaza.estado}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: active ? '#fff' : G }}>{plaza.clientes}</div>
          <div style={{ fontSize: 10, color: active ? `${G}aa` : DM, letterSpacing: 0.5 }}>CLIENTES</div>
        </div>
      </div>
      {plaza.blocker && (
        <div style={{
          marginTop: 10, padding: '6px 10px', borderRadius: 8,
          background: active ? '#ffffff18' : `${AM}12`,
          fontSize: 10, color: active ? '#ffffffbb' : AM,
          border: `1px solid ${active ? '#ffffff30' : `${AM}30`}`,
        }}>
          ⚠ {plaza.blocker.slice(0, 70)}{plaza.blocker.length > 70 ? '…' : ''}
        </div>
      )}
    </button>
  );
}

// ── MTY placeholder (crecerá con su propio CiudadOS) ─────────────────────────

function MTYSection({ theme }: { theme: ThemeConfig }) {
  return (
    <CiudadOSSection
      config={MTY_CONFIG}
      theme={XCIEN_CORPORATE_THEME}
    />
  );
}

function SLTSection({ theme }: { theme: ThemeConfig }) {
  return (
    <CiudadOSSection
      config={SLT_CONFIG}
      theme={XCIEN_CORPORATE_THEME}
    />
  );
}

// ── Resumen global — KPIs de las 3 plazas ─────────────────────────────────────

function ResumenGlobal() {
  const [data, setData] = useState<{ plazas: PlazaMeta[] } | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/fibra/resumen-plazas`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setData(d))
      .catch(() => {});
  }, []);

  const totalClientes = data?.plazas.reduce((s, p) => s + (p.clientes || 0), 0) ?? '—';
  const plazasActivas = data?.plazas.filter(p => p.estado !== 'Mediano plazo').length ?? '—';

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {[
        { label: 'Plazas activas', value: plazasActivas, color: G },
        { label: 'Clientes FO', value: totalClientes, color: BL },
        { label: 'Plazas totales', value: 3, color: DM },
      ].map(k => (
        <div key={k.label} style={{
          background: SF, border: `1px solid ${GB}`, borderRadius: 10,
          padding: '12px 20px', flex: 1, minWidth: 120,
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
          <div style={{ fontSize: 10, color: DM, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>{k.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── FibraXCIENSection — componente principal ───────────────────────────────────

const PLAZAS: PlazaMeta[] = [
  {
    id: 'pdn',
    nombre: 'Piedras Negras',
    estado_mx: 'Coahuila',
    emoji: '🏙️',
    color: G,
    clientes: 4,
    estado: 'Construida',
    blocker: 'F3 CWDM bloqueado — Lancermex 21 cajas, 10% avance',
  },
  {
    id: 'mty',
    nombre: 'Monterrey',
    estado_mx: 'Nuevo León',
    emoji: '🏔️',
    color: AM,
    clientes: 6,
    estado: 'En piloto',
    blocker: 'Red rentada Neutra Networks — convenio en proceso',
  },
  {
    id: 'slt',
    nombre: 'Saltillo',
    estado_mx: 'Coahuila',
    emoji: '🌵',
    color: BL,
    clientes: 0,
    estado: 'Mediano plazo',
    blocker: 'Infraestructura pendiente — sin RZ disponible',
  },
];

export default function FibraXCIENSection({ theme }: { theme: ThemeConfig }) {
  const [plaza, setPlaza] = useState<PlazaId>('pdn');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minHeight: '100%', background: BG }}>

      {/* Header */}
      <div style={{
        background: GD, padding: '18px 28px',
        display: 'flex', alignItems: 'center', gap: 14,
        borderBottom: `1px solid ${G}`,
      }}>
        <span style={{ fontSize: 28 }}>🔆</span>
        <div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: 0.3 }}>
            Fibra Óptica XCIEN
          </div>
          <div style={{ fontSize: 12, color: '#ffffffaa', marginTop: 2 }}>
            3 plazas · MTY · SLT · PDN
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: '#ffffffaa' }}>Fibra propia X100</span>
        </div>
      </div>

      {/* Selector de plazas — cards clickables */}
      <div style={{ padding: '20px 24px 0', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {PLAZAS.map(p => (
          <PlazaCard
            key={p.id}
            plaza={p}
            active={plaza === p.id}
            onClick={() => setPlaza(p.id)}
          />
        ))}
      </div>

      {/* Separador con tab activo */}
      <div style={{
        padding: '16px 24px 0',
        display: 'flex', gap: 0, borderBottom: `2px solid ${GB}`,
      }}>
        {PLAZAS.map(p => (
          <button
            key={p.id}
            onClick={() => setPlaza(p.id)}
            style={{
              padding: '8px 20px', border: 'none', background: 'transparent',
              fontSize: 13, fontWeight: plaza === p.id ? 700 : 400,
              color: plaza === p.id ? G : DM,
              borderBottom: plaza === p.id ? `3px solid ${G}` : '3px solid transparent',
              cursor: 'pointer', marginBottom: -2,
              transition: 'all 0.15s',
            }}
          >
            {p.emoji} {p.nombre}
          </button>
        ))}
      </div>

      {/* Contenido de la plaza seleccionada */}
      <div style={{ flex: 1 }}>
        {plaza === 'pdn' && <BlackstoneOSSection theme={theme} />}
        {plaza === 'mty' && <MTYSection theme={theme} />}
        {plaza === 'slt' && <SLTSection theme={theme} />}
      </div>
    </div>
  );
}
