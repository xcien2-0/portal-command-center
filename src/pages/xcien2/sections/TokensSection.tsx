import { useState, useEffect } from 'react';
import { ThemeConfig } from '../types';

const API_BASE = 'http://localhost:8000';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Token {
  token_id: string;
  tipo: string;
  empresa: string;
  oportunidad_id?: string;
  cliente?: string;
  vendedor?: string;
  tecnico?: string;
  agente?: string;
  nivel?: string;
  score?: number;
  monto?: number;
  extra?: Record<string, any>;
  emitido_en: string;
  firma: string;
}

// ── Demo fallback ─────────────────────────────────────────────────────────────
const DEMO_TOKENS: Token[] = [
  { token_id: "a1b2c3d4-0001", tipo: "certificacion",    empresa: "xcien",   tecnico: "Carlos Mendoza",    nivel: "Técnico",      score: 88,    extra: { pilares: { Instalación: 92, Soporte: 85, Seguridad: 90 } },                      emitido_en: "2026-04-25T09:15:00+00:00", firma: "demo" },
  { token_id: "a1b2c3d4-0002", tipo: "certificacion",    empresa: "luminet", tecnico: "Ana Rodríguez",     nivel: "Especialista", score: 94,    extra: { pilares: { Instalación: 96, Soporte: 92, Seguridad: 95 } },                      emitido_en: "2026-04-24T14:30:00+00:00", firma: "demo" },
  { token_id: "a1b2c3d4-0003", tipo: "oportunidad_ganada", empresa: "xcien", cliente: "Grupo Industrial Noreste", vendedor: "Luis Herrera", monto: 48500, extra: { nombre_oportunidad: "Enlace dedicado 500MB" }, emitido_en: "2026-04-25T11:00:00+00:00", firma: "demo" },
  { token_id: "a1b2c3d4-0004", tipo: "promocion",        empresa: "xcien",   tecnico: "Miguel Ángel Torres", nivel: "Especialista",           extra: { nivel_anterior: "Técnico", xp_total: 1520 },                                     emitido_en: "2026-04-23T10:00:00+00:00", firma: "demo" },
  { token_id: "a1b2c3d4-0005", tipo: "bono",             empresa: "wispi",   tecnico: "Laura Garza",       monto: 3200,           extra: { motivo: "Racha 3 meses sin revisitas" },                                                      emitido_en: "2026-04-22T08:00:00+00:00", firma: "demo" },
  { token_id: "a1b2c3d4-0006", tipo: "agente_ia",        empresa: "xcien",   agente: "Director General IA",                       extra: { accion: "Auto-asignación ticket T-1042", tecnico_asignado: "Carlos Mendoza" },                emitido_en: "2026-04-25T12:45:00+00:00", firma: "demo" },
  { token_id: "a1b2c3d4-0007", tipo: "oportunidad_ganada", empresa: "huus",  cliente: "Residencial Las Palmas", vendedor: "María Fernández", monto: 12000, extra: { nombre_oportunidad: "Internet residencial 50 unidades" },            emitido_en: "2026-04-24T16:20:00+00:00", firma: "demo" },
  { token_id: "a1b2c3d4-0008", tipo: "certificacion",    empresa: "wispi",   tecnico: "Roberto Salinas",   nivel: "Aprendiz",     score: 62,    extra: { pilares: { Instalación: 65, Soporte: 60, Seguridad: 58 } },                      emitido_en: "2026-04-21T09:00:00+00:00", firma: "demo" },
  { token_id: "a1b2c3d4-0009", tipo: "agente_ia",        empresa: "luminet", agente: "Director General IA",                       extra: { accion: "Generación examen Fibra Óptica", modulo: "estandar_fibra_optica.md" },               emitido_en: "2026-04-25T08:30:00+00:00", firma: "demo" },
  { token_id: "a1b2c3d4-0010", tipo: "bono",             empresa: "luminet", tecnico: "Jorge Martínez",    monto: 1800,           extra: { motivo: "Mejor score del mes — Instalación" },                                               emitido_en: "2026-04-20T17:00:00+00:00", firma: "demo" },
];

// ── Config visual por tipo ─────────────────────────────────────────────────────
const TIPO_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  oportunidad_ganada: { label: 'Oportunidad ganada',    icon: '💼', color: '#00C896' },
  certificacion:      { label: 'Certificación',         icon: '🎓', color: '#534AB7' },
  promocion:          { label: 'Promoción de nivel',    icon: '⬆️', color: '#FFB703' },
  bono:               { label: 'Bono de desempeño',     icon: '🏆', color: '#FF6B35' },
  agente_ia:          { label: 'Acción agente IA',      icon: '🤖', color: '#4FC3F7' },
  despido:            { label: 'Baja',                  icon: '📋', color: '#FF4757' },
};

const EMPRESA_COLOR: Record<string, string> = {
  xcien:   '#00C896',
  luminet: '#4FC3F7',
  wispi:   '#FFB703',
  huus:    '#FF6B35',
};

const EMPRESAS = ['todas', 'xcien', 'luminet', 'wispi', 'huus'];
const TIPOS    = ['todos', ...Object.keys(TIPO_CONFIG)];

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getTitular(t: Token): string {
  return t.tecnico || t.vendedor || t.agente || t.cliente || '—';
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, theme }: { label: string; value: number | string; color: string; theme: ThemeConfig }) {
  return (
    <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: theme.radius, padding: '16px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: theme.dim, marginTop: 6 }}>{label}</div>
    </div>
  );
}

// ── Token Card ───────────────────────────────────���────────────────────────────
function TokenCard({ token, theme }: { token: Token; theme: ThemeConfig }) {
  const cfg = TIPO_CONFIG[token.tipo] || { label: token.tipo, icon: '🔖', color: '#94a3b8' };
  const empColor = EMPRESA_COLOR[token.empresa] || '#94a3b8';

  return (
    <div style={{
      background: theme.card,
      border: `1px solid ${theme.border}`,
      borderLeft: `3px solid ${cfg.color}`,
      borderRadius: theme.radius,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {/* Row 1: tipo + empresa */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>{cfg.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
          background: `${empColor}18`, color: empColor, border: `1px solid ${empColor}30`,
          textTransform: 'uppercase',
        }}>
          {token.empresa}
        </span>
      </div>

      {/* Row 2: titular */}
      <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>
        {getTitular(token)}
      </div>

      {/* Row 3: detalles */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {token.nivel && (
          <span style={{ fontSize: 11, color: theme.dim }}>Nivel: <strong style={{ color: theme.text }}>{token.nivel}</strong></span>
        )}
        {token.score !== undefined && (
          <span style={{ fontSize: 11, color: theme.dim }}>Score: <strong style={{ color: theme.text }}>{token.score}%</strong></span>
        )}
        {token.monto !== undefined && token.monto > 0 && (
          <span style={{ fontSize: 11, color: theme.dim }}>Monto: <strong style={{ color: theme.text }}>${token.monto.toLocaleString('es-MX')}</strong></span>
        )}
        {token.extra?.nombre_oportunidad && (
          <span style={{ fontSize: 11, color: theme.dim, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {token.extra.nombre_oportunidad}
          </span>
        )}
      </div>

      {/* Row 4: id + fecha */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
        <span style={{ fontSize: 10, fontFamily: 'monospace', color: theme.dim, background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4 }}>
          #{shortId(token.token_id)}
        </span>
        <span style={{ fontSize: 10, color: theme.dim }}>{formatDate(token.emitido_en)}</span>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface Props { theme: ThemeConfig }

export default function TokensSection({ theme }: Props) {
  const [tokens, setTokens]           = useState<Token[]>([]);
  const [loading, setLoading]         = useState(true);
  const [empresaFiltro, setEmpresa]   = useState('todas');
  const [tipoFiltro, setTipo]         = useState('todos');
  const [backendOnline, setOnline]    = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/tokens`)
      .then(r => r.json())
      .then(data => { setTokens(data); setOnline(true); })
      .catch(() => { setTokens(DEMO_TOKENS); setOnline(false); })
      .finally(() => setLoading(false));
  }, []);

  const filtrados = tokens.filter(t => {
    const okEmpresa = empresaFiltro === 'todas' || t.empresa === empresaFiltro;
    const okTipo    = tipoFiltro === 'todos'    || t.tipo === tipoFiltro;
    return okEmpresa && okTipo;
  });

  const accent = theme.accent;

  // KPIs
  const kpi = {
    total:      tokens.length,
    humanos:    tokens.filter(t => t.tipo !== 'agente_ia').length,
    ia:         tokens.filter(t => t.tipo === 'agente_ia').length,
    hoy:        tokens.filter(t => new Date(t.emitido_en).toDateString() === new Date().toDateString()).length,
    empresas:   [...new Set(tokens.map(t => t.empresa))].length,
  };

  const filterStyle = (active: boolean) => ({
    fontSize: 11, padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
    border: `1px solid ${active ? accent : theme.border}`,
    background: active ? `${accent}18` : 'transparent',
    color: active ? accent : theme.dim,
    fontWeight: active ? 600 : 400,
    transition: 'all 0.15s',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Registro de Tokens</h2>
          <p style={{ fontSize: 12, color: theme.dim, margin: 0 }}>Certificaciones, logros y eventos de agentes humanos e IA</p>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
          background: backendOnline ? 'rgba(0,200,150,0.12)' : 'rgba(255,71,87,0.12)',
          color: backendOnline ? '#00C896' : '#FF4757',
          border: `1px solid ${backendOnline ? 'rgba(0,200,150,0.3)' : 'rgba(255,71,87,0.3)'}`,
        }}>
          {backendOnline ? '● Conectado' : '● Sin conexión'}
        </span>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
        <KpiCard label="Total tokens"   value={kpi.total}    color={accent}     theme={theme} />
        <KpiCard label="Agentes humanos" value={kpi.humanos}  color="#00C896"    theme={theme} />
        <KpiCard label="Agentes IA"      value={kpi.ia}       color="#4FC3F7"    theme={theme} />
        <KpiCard label="Emitidos hoy"    value={kpi.hoy}      color="#FFB703"    theme={theme} />
        <KpiCard label="Empresas activas" value={kpi.empresas} color="#534AB7"   theme={theme} />
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: theme.dim, marginRight: 4 }}>Empresa:</span>
          {EMPRESAS.map(e => (
            <button key={e} onClick={() => setEmpresa(e)} style={filterStyle(empresaFiltro === e)}>
              {e === 'todas' ? 'Todas' : e.toUpperCase()}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: theme.dim, marginRight: 4 }}>Tipo:</span>
          {TIPOS.map(t => (
            <button key={t} onClick={() => setTipo(t)} style={filterStyle(tipoFiltro === t)}>
              {t === 'todos' ? 'Todos' : (TIPO_CONFIG[t]?.icon + ' ' + TIPO_CONFIG[t]?.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de tokens */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: theme.dim, fontSize: 13 }}>Cargando tokens...</div>
      ) : filtrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: theme.dim }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔖</div>
          <div style={{ fontSize: 13 }}>
            {tokens.length === 0
              ? 'No hay tokens emitidos aún. Se generarán automáticamente con cada evento.'
              : 'No hay tokens con ese filtro.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {filtrados.slice().reverse().map(t => (
            <TokenCard key={t.token_id} token={t} theme={theme} />
          ))}
        </div>
      )}

      {filtrados.length > 0 && (
        <div style={{ fontSize: 11, color: theme.dim, textAlign: 'right' }}>
          {filtrados.length} token{filtrados.length !== 1 ? 's' : ''} mostrados
        </div>
      )}
    </div>
  );
}
