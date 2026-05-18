import { useState, useEffect } from 'react';
import { ThemeConfig } from '../types';
import { API_BASE as API } from '../../../config';
// ── Matrix Background ─────────────────────────────────────────────────────────
function MatrixBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.1, pointerEvents: 'none', zIndex: 0 }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)',
        fontFamily: 'monospace', fontSize: 12, color: '#00ff88', textShadow: '0 0 8px #00ff88',
        whiteSpace: 'nowrap', userSelect: 'none'
      }}>
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} style={{ 
            animation: `matrixFall ${15 + Math.random() * 25}s linear infinite`,
            animationDelay: `${-Math.random() * 25}s`,
            writingMode: 'vertical-rl',
            textAlign: 'center'
          }}>
            {Array.from({ length: 60 }).map(() => Math.random() > 0.5 ? '1' : '0').join(' ')}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes matrixFall {
          from { transform: translateY(-100%); }
          to { transform: translateY(100%); }
        }
      `}</style>
    </div>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Transaccion {
  tx_id: string;
  empresa_origen: string;
  empresa_destino: string;
  area_origen: string;
  area_destino: string;
  concepto: string;
  precio_mercado: number;
  precio_preferencial: number;
  descuento_pct: number;
  ahorro: number;
  moneda: string;
  responsable: string;
  fecha: string;
}

interface Resumen {
  total_tx: number;
  valor_total: number;
  ahorro_total: number;
  matriz: Record<string, { count: number; valor: number }>;
  por_area: Record<string, { count: number; como_origen: number; como_destino: number; valor: number }>;
  recientes: Transaccion[];
}

interface AreaToken {
  area: string;
  ganados: number;
  gastados: number;
  saldo: number;
  valor_generado: number;
  valor_consumido: number;
  txs: number;
}

interface TokenHistorial {
  token_id: string;
  tx_id: string;
  area_origen: string;
  area_destino: string;
  empresa_origen: string;
  empresa_destino: string;
  concepto: string;
  valor_pesos: number;
  tokens: number;
  emitido_en: string;
}

interface TokensResumen {
  areas: AreaToken[];
  total_tokens_emitidos: number;
  total_txs: number;
  historial: TokenHistorial[];
}

// ── Colores ───────────────────────────────────────────────────────────────────
const EMPRESA_COLOR: Record<string, string> = {
  xcien:   '#00C896',
  luminet: '#4FC3F7',
  wispi:   '#FFB703',
  huus:    '#FF6B35',
};

const AREA_ICON: Record<string, string> = {
  noc:             '📡',
  campo:           '🔧',
  admin:           '📋',
  finanzas:        '💰',
  comercial:       '🤝',
  infraestructura: '🏗️',
  academia:        '🎓',
  almacen:         '📦',
};

const EMPRESAS = ['xcien', 'luminet', 'wispi', 'huus'];

const DEMO: Resumen = {
  total_tx: 8, valor_total: 37100, ahorro_total: 36600,
  matriz: {
    'xcien→luminet':  { count: 3, valor: 8000 },
    'xcien→wispi':    { count: 2, valor: 5600 },
    'xcien→huus':     { count: 1, valor: 2000 },
    'luminet→xcien':  { count: 2, valor: 13200 },
    'luminet→wispi':  { count: 1, valor: 7500 },
    'wispi→xcien':    { count: 1, valor: 3200 },
    'huus→luminet':   { count: 1, valor: 6000 },
  },
  por_area: {
    noc:             { count: 3, como_origen: 2, como_destino: 1, valor: 14000 },
    campo:           { count: 3, como_origen: 1, como_destino: 2, valor: 13100 },
    infraestructura: { count: 2, como_origen: 2, como_destino: 0, valor: 17500 },
    almacen:         { count: 2, como_origen: 1, como_destino: 1, valor: 5200 },
    admin:           { count: 2, como_origen: 0, como_destino: 2, valor: 8000 },
    finanzas:        { count: 1, como_origen: 1, como_destino: 0, valor: 6000 },
    comercial:       { count: 1, como_origen: 1, como_destino: 0, valor: 2000 },
    academia:        { count: 1, como_origen: 1, como_destino: 0, valor: 2400 },
  },
  recientes: [],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, theme }: { label: string; value: string; sub?: string; color: string; theme: ThemeConfig }) {
  return (
    <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: theme.radius, padding: '16px 20px' }}>
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#00C896', marginTop: 2 }}>{sub}</div>}
      <div style={{ fontSize: 11, color: theme.dim, marginTop: 6 }}>{label}</div>
    </div>
  );
}

// ── Empresa Badge ─────────────────────────────────────────────────────────────
function EmpresaBadge({ name }: { name: string }) {
  const color = EMPRESA_COLOR[name] || '#94a3b8';
  return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${color}18`, color, border: `1px solid ${color}30`, textTransform: 'uppercase' }}>
      {name}
    </span>
  );
}

// ── Tokens View ───────────────────────────────────────────────────────────────
function TokensView({ theme, accent }: { theme: ThemeConfig; accent: string }) {
  const [data, setData]       = useState<TokensResumen | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/transacciones/tokens`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: theme.dim }}>Cargando tokens…</div>;

  const areas = data?.areas ?? [];
  const maxAbs = Math.max(1, ...areas.map(a => Math.max(a.ganados, a.gastados)));

  if (areas.length === 0) return (
    <div style={{ textAlign: 'center', padding: 60, color: theme.dim }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🪙</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: theme.text, marginBottom: 6 }}>Sin tokens emitidos aún</div>
      <div style={{ fontSize: 12 }}>Los tokens se generan automáticamente al registrar una transacción intragrupo.</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {[
          { label: 'Tokens en circulación', value: (data?.total_tokens_emitidos ?? 0).toLocaleString('es-MX'), color: '#FFB703' },
          { label: 'Transacciones tokenizadas', value: String(data?.total_txs ?? 0), color: accent },
          { label: 'Áreas activas', value: String(areas.length), color: '#00C896' },
        ].map(k => (
          <div key={k.label} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: theme.radius, padding: '14px 18px' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: 11, color: theme.dim, marginTop: 6 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Ranking de áreas */}
      <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: theme.radius, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Saldo de tokens por área</span>
          <span style={{ fontSize: 11, color: theme.dim }}>🟢 Proveedora &nbsp;🔴 Consumidora</span>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {areas.map(a => {
            const positivo = a.saldo >= 0;
            const pctGanado  = (a.ganados  / maxAbs) * 100;
            const pctGastado = (a.gastados / maxAbs) * 100;
            return (
              <div key={a.area}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>{AREA_ICON[a.area] || '📌'}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{a.area}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: '#00C896' }}>+{a.ganados} 🪙</span>
                    <span style={{ fontSize: 10, color: '#FF4757' }}>-{a.gastados} 🪙</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: positivo ? '#00C896' : '#FF4757', minWidth: 60, textAlign: 'right' }}>
                      {positivo ? '+' : ''}{a.saldo} 🪙
                    </span>
                  </div>
                </div>
                {/* Barra doble: ganados (verde) y gastados (rojo) */}
                <div style={{ height: 6, background: theme.border, borderRadius: 3, overflow: 'hidden', display: 'flex', gap: 2 }}>
                  <div style={{ width: `${pctGanado}%`, background: '#00C896', borderRadius: 3, transition: 'width .4s' }} />
                  <div style={{ width: `${pctGastado}%`, background: '#FF4757', borderRadius: 3, transition: 'width .4s' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historial reciente */}
      {(data?.historial ?? []).length > 0 && (
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: theme.radius, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${theme.border}` }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Historial de emisiones</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {data!.historial.map(t => (
              <div key={t.token_id} style={{ padding: '10px 18px', borderBottom: `1px solid ${theme.border}`, display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>{t.area_origen}</span>
                    <span style={{ fontSize: 10, color: theme.dim }}>→</span>
                    <span style={{ fontSize: 11, textTransform: 'capitalize', color: theme.dim }}>{t.area_destino}</span>
                    <span style={{ fontSize: 10, color: theme.dim }}>·</span>
                    <EmpresaBadge name={t.empresa_origen} />
                    <span style={{ fontSize: 10, color: theme.dim }}>→</span>
                    <EmpresaBadge name={t.empresa_destino} />
                  </div>
                  <div style={{ fontSize: 11, color: theme.dim }}>{t.concepto}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#FFB703' }}>+{t.tokens} 🪙</span>
                  <span style={{ fontSize: 10, color: theme.dim }}>{fmt(t.valor_pesos)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
interface Props { theme: ThemeConfig; activeThemeId?: string }

export default function TransaccionesSection({ theme, activeThemeId }: Props) {
  const [resumen, setResumen]       = useState<Resumen>(DEMO);
  const [txs, setTxs]               = useState<Transaccion[]>([]);
  const [backendOnline, setOnline]  = useState(false);
  const [filtroEmp, setFiltroEmp]   = useState('todas');
  const [vista, setVista]           = useState<'tablero' | 'lista' | 'tokens'>('tablero');

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/transacciones/resumen`).then(r => r.json()),
      fetch(`${API}/api/transacciones`).then(r => r.json()),
    ]).then(([res, lista]) => {
      if (res.total_tx !== undefined) { setResumen(res); setOnline(true); }
      if (Array.isArray(lista)) setTxs(lista);
    }).catch(() => setOnline(false));
  }, []);

  const txsFiltradas = (txs.length > 0 ? txs : resumen.recientes).filter(t =>
    filtroEmp === 'todas' || t.empresa_origen === filtroEmp || t.empresa_destino === filtroEmp
  );

  const accent = theme.accent;

  // Calcular max count para escala de la matriz
  const maxCount = Math.max(1, ...Object.values(resumen.matriz).map(v => v.count));

  const tabStyle = (active: boolean) => ({
    fontSize: 12, padding: '5px 16px', borderRadius: 20, cursor: 'pointer', fontWeight: active ? 600 : 400,
    background: active ? `${accent}18` : 'transparent',
    border: `1px solid ${active ? accent : theme.border}`,
    color: active ? accent : theme.dim,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
      {activeThemeId === 'matrix' && <MatrixBackground />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Transacciones Intragrupo</h2>
          <p style={{ fontSize: 12, color: theme.dim, margin: 0 }}>Flujo de servicios y recursos entre empresas del grupo · precio preferencial</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button style={tabStyle(vista === 'tablero')} onClick={() => setVista('tablero')}>Tablero</button>
            <button style={tabStyle(vista === 'lista')}   onClick={() => setVista('lista')}>Transacciones</button>
            <button style={tabStyle(vista === 'tokens')}  onClick={() => setVista('tokens')}>🪙 Tokens</button>
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: backendOnline ? 'rgba(0,200,150,0.12)' : 'rgba(255,71,87,0.12)', color: backendOnline ? '#00C896' : '#FF4757', border: `1px solid ${backendOnline ? 'rgba(0,200,150,0.3)' : 'rgba(255,71,87,0.3)'}` }}>
            {backendOnline ? '● En vivo' : '● Demo'}
          </span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        <KpiCard label="Total transacciones"    value={String(resumen.total_tx)}              color={accent}     theme={theme} />
        <KpiCard label="Valor total (pref.)"     value={fmt(resumen.valor_total)}             color="#4FC3F7"    theme={theme} />
        <KpiCard label="Ahorro vs mercado"       value={fmt(resumen.ahorro_total)}            color="#00C896"    sub="precio preferencial intragrupo" theme={theme} />
        <KpiCard label="Empresas activas"        value={String(EMPRESAS.length)}              color="#FFB703"    theme={theme} />
      </div>

      {vista === 'tablero' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* Matriz de flujos */}
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: theme.radius, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${theme.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Flujo entre empresas</span>
              <span style={{ fontSize: 11, color: theme.dim, marginLeft: 8 }}>transacciones × valor</span>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(resumen.matriz).sort((a, b) => b[1].count - a[1].count).map(([clave, val]) => {
                const [origen, destino] = clave.split('→');
                const pct = Math.round((val.count / maxCount) * 100);
                const co  = EMPRESA_COLOR[origen]  || '#94a3b8';
                const cd  = EMPRESA_COLOR[destino] || '#94a3b8';
                return (
                  <div key={clave} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <EmpresaBadge name={origen} />
                        <span style={{ fontSize: 12, color: theme.dim }}>→</span>
                        <EmpresaBadge name={destino} />
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <span style={{ fontSize: 11, color: theme.text, fontWeight: 600 }}>{val.count} tx</span>
                        <span style={{ fontSize: 11, color: theme.dim }}>{fmt(val.valor)}</span>
                      </div>
                    </div>
                    <div style={{ height: 4, background: theme.border, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${co}, ${cd})`, borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Por área */}
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: theme.radius, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${theme.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Actividad por área</span>
              <span style={{ fontSize: 11, color: theme.dim, marginLeft: 8 }}>origen · destino</span>
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(resumen.por_area).sort((a, b) => b[1].count - a[1].count).map(([area, val]) => {
                const maxA = Math.max(1, ...Object.values(resumen.por_area).map(v => v.count));
                return (
                  <div key={area} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, width: 20, flexShrink: 0 }}>{AREA_ICON[area] || '📌'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, textTransform: 'capitalize' }}>{area}</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <span style={{ fontSize: 10, color: accent }}>↑{val.como_origen}</span>
                          <span style={{ fontSize: 10, color: '#4FC3F7' }}>↓{val.como_destino}</span>
                          <span style={{ fontSize: 10, color: theme.dim }}>{fmt(val.valor)}</span>
                        </div>
                      </div>
                      <div style={{ height: 4, background: theme.border, borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${(val.como_origen / val.count) * (val.count / maxA) * 100}%`, background: accent, borderRadius: '2px 0 0 2px' }} />
                        <div style={{ width: `${(val.como_destino / val.count) * (val.count / maxA) * 100}%`, background: '#4FC3F7' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        /* Lista de transacciones */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Filtro */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: theme.dim }}>Empresa:</span>
            {['todas', ...EMPRESAS].map(e => (
              <button key={e} onClick={() => setFiltroEmp(e)} style={tabStyle(filtroEmp === e)}>
                {e === 'todas' ? 'Todas' : e.toUpperCase()}
              </button>
            ))}
          </div>

          {txsFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: theme.dim }}>Sin transacciones registradas</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...txsFiltradas].reverse().map(tx => (
                <div key={tx.tx_id} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: theme.radius, padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <EmpresaBadge name={tx.empresa_origen} />
                      <span style={{ fontSize: 11, color: theme.dim }}>→</span>
                      <EmpresaBadge name={tx.empresa_destino} />
                      <span style={{ fontSize: 11, color: theme.dim }}>·</span>
                      <span style={{ fontSize: 11, color: theme.dim }}>{AREA_ICON[tx.area_origen]} {tx.area_origen} → {AREA_ICON[tx.area_destino]} {tx.area_destino}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{tx.concepto}</div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <span style={{ fontSize: 11, color: theme.dim }}>Mercado: <span style={{ color: theme.text, textDecoration: 'line-through' }}>{fmt(tx.precio_mercado)}</span></span>
                      <span style={{ fontSize: 11, color: theme.dim }}>Preferencial: <span style={{ color: '#00C896', fontWeight: 600 }}>{fmt(tx.precio_preferencial)}</span></span>
                      <span style={{ fontSize: 11, color: '#FFB703' }}>-{tx.descuento_pct}%</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: theme.dim }}>{tx.tx_id}</span>
                    <span style={{ fontSize: 11, color: theme.dim }}>{fmtDate(tx.fecha)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {vista === 'tokens' && <TokensView theme={theme} accent={accent} />}
    </div>
  );
}
