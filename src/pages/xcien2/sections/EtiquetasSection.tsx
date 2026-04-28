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

interface Activo {
  activo_id: string;
  nombre: string;
  categoria_label: string;
  empresa: string;
  regimen: string;
  site: string;
  numero_serie: string;
  ip?: string;
  categoria: string;
}

interface Tx {
  tx_id: string;
  empresa_origen: string;
  empresa_destino: string;
  concepto: string;
  precio_preferencial: number;
  fecha: string;
}

const EMPRESA_COLOR: Record<string, string> = {
  xcien: '#00C896', luminet: '#4FC3F7', wispi: '#FFB703', huus: '#FF6B35',
};

const REGIMEN_COLOR: Record<string, string> = {
  PROPIO: '#00C896', RENTADO: '#FFB703', LEASING: '#4FC3F7',
  COMODATO: '#8B5CF6', COMPARTIDO: '#FF6B35',
};

function fmt(n: number) {
  return `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;
}

interface Props { theme: ThemeConfig; activeThemeId?: string }

export default function EtiquetasSection({ theme, activeThemeId }: Props) {
  const [activos, setActivos]   = useState<Activo[]>([]);
  const [txs, setTxs]           = useState<Tx[]>([]);
  const [tab, setTab]           = useState<'activos' | 'transacciones'>('activos');
  const [filtroSite, setFiltroSite] = useState('');
  const [filtroEmp, setFiltroEmp]   = useState('todas');
  const [online, setOnline]     = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '', categoria: 'equipo_red', empresa: 'xcien', regimen: 'PROPIO',
    site: '', numero_serie: '', marca: '', modelo: '', ip: '', network_code: 'X100'
  });

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/activos`).then(r => r.json()),
      fetch(`${API}/api/transacciones`).then(r => r.json()),
    ]).then(([a, t]) => {
      if (Array.isArray(a)) setActivos(a);
      if (Array.isArray(t)) setTxs(t);
      setOnline(true);
    }).catch(() => setOnline(false));
  }, []);

  const fetchAll = () => {
    Promise.all([
      fetch(`${API}/api/activos`).then(r => r.json()),
      fetch(`${API}/api/transacciones`).then(r => r.json()),
    ]).then(([a, t]) => {
      if (Array.isArray(a)) setActivos(a);
      if (Array.isArray(t)) setTxs(t);
      setOnline(true);
    }).catch(() => setOnline(false));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/activos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert("✅ Activo registrado y sincronizado con NOCBoard");
        setShowForm(false);
        setFormData({ ...formData, nombre: '', ip: '', numero_serie: '' });
        fetchAll();
      }
    } catch (err) { alert("Error registrando activo"); }
  };

  const sites   = [...new Set(activos.map(a => a.site).filter(Boolean))];
  const empresas = [...new Set(activos.map(a => a.empresa))];

  const activosFiltrados = activos.filter(a => {
    const okSite = !filtroSite || a.site === filtroSite;
    const okEmp  = filtroEmp === 'todas' || a.empresa === filtroEmp;
    return okSite && okEmp;
  });

  const accent = theme.accent;

  const btnStyle = (active: boolean, color = accent) => ({
    fontSize: 11, padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
    border: `1px solid ${active ? color : theme.border}`,
    background: active ? `${color}18` : 'transparent',
    color: active ? color : theme.dim, fontWeight: active ? 600 : 400,
  });

  const printUrl = (base: string) => {
    const params = new URLSearchParams();
    if (filtroEmp !== 'todas') params.set('empresa', filtroEmp);
    if (filtroSite) params.set('site', filtroSite);
    return `${base}${params.toString() ? '?' + params.toString() : ''}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
      {activeThemeId === 'matrix' && <MatrixBackground />}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>Etiquetas & Comprobantes</h2>
          <p style={{ fontSize: 12, color: theme.dim, margin: 0 }}>Imprime etiquetas de inventario y comprobantes de transacciones</p>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: online ? 'rgba(0,200,150,0.12)' : 'rgba(255,71,87,0.12)', color: online ? '#00C896' : '#FF4757', border: `1px solid ${online ? 'rgba(0,200,150,0.3)' : 'rgba(255,71,87,0.3)'}` }}>
          {online ? '● Backend conectado' : '● Sin conexión'}
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button style={btnStyle(tab === 'activos')}       onClick={() => setTab('activos')}>📦 Activos ({activos.length})</button>
        <button style={btnStyle(tab === 'transacciones')} onClick={() => setTab('transacciones')}>🔄 Transacciones ({txs.length})</button>
        <button 
          style={{ ...btnStyle(showForm, '#00C896'), marginLeft: 'auto' }} 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✖ Cancelar' : '➕ Nuevo Activo de Red'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleRegister} style={{ background: 'rgba(0,200,150,0.05)', border: `1px solid #00C89640`, borderRadius: theme.radius, padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, color: theme.dim }}>Nombre del Equipo</label>
            <input required style={{ background: '#000', border: `1px solid ${theme.border}`, color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 12 }} value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="PTP-Santa-Rosa" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, color: theme.dim }}>Dirección IP</label>
            <input required style={{ background: '#000', border: `1px solid #00C896`, color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 12 }} value={formData.ip} onChange={e => setFormData({...formData, ip: e.target.value})} placeholder="172.31.x.x" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, color: theme.dim }}>Código de Red</label>
            <input style={{ background: '#000', border: `1px solid ${theme.border}`, color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 12 }} value={formData.network_code} onChange={e => setFormData({...formData, network_code: e.target.value})} placeholder="X100" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, color: theme.dim }}>Site / Ciudad</label>
            <input style={{ background: '#000', border: `1px solid ${theme.border}`, color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 12 }} value={formData.site} onChange={e => setFormData({...formData, site: e.target.value})} placeholder="Monterrey" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 10, color: theme.dim }}>Marca / Modelo</label>
            <input style={{ background: '#000', border: `1px solid ${theme.border}`, color: '#fff', padding: '6px 10px', borderRadius: 6, fontSize: 12 }} value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} placeholder="MikroTik / Mimosa" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" style={{ width: '100%', background: '#00C896', color: '#000', fontWeight: 800, fontSize: 11, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer' }}>
              REGISTRAR Y SINCRONIZAR A NOCBOARD
            </button>
          </div>
        </form>
      )}

      {tab === 'activos' ? (
        <>
          {/* Filtros + Imprimir hoja */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', background: theme.card, border: `1px solid ${theme.border}`, borderRadius: theme.radius, padding: '14px 16px' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: theme.dim }}>Site:</span>
              <button style={btnStyle(!filtroSite)} onClick={() => setFiltroSite('')}>Todos</button>
              {sites.map(s => <button key={s} style={btnStyle(filtroSite === s)} onClick={() => setFiltroSite(s)}>{s}</button>)}
            </div>
            <div style={{ width: 1, height: 20, background: theme.border }} />
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: theme.dim }}>Empresa:</span>
              <button style={btnStyle(filtroEmp === 'todas')} onClick={() => setFiltroEmp('todas')}>Todas</button>
              {empresas.map(e => <button key={e} style={btnStyle(filtroEmp === e, EMPRESA_COLOR[e])} onClick={() => setFiltroEmp(e)}>{e.toUpperCase()}</button>)}
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <a
                href={printUrl(`${API}/api/etiquetas/hoja`)}
                target="_blank" rel="noreferrer"
                style={{ fontSize: 12, fontWeight: 600, padding: '8px 18px', borderRadius: 8, background: accent, color: '#fff', textDecoration: 'none', display: 'inline-block' }}
              >
                🖨️ Imprimir hoja completa ({activosFiltrados.length})
              </a>
            </div>
          </div>

          {/* Grid de activos */}
          {activosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: theme.dim }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
              <div>No hay activos{filtroSite ? ` en ${filtroSite}` : ''}</div>
              {!online && <div style={{ marginTop: 8, fontSize: 11, color: '#FF4757' }}>Backend apagado — inicia el servidor para ver activos reales</div>}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {activosFiltrados.map(a => {
                const ec = EMPRESA_COLOR[a.empresa] || '#94a3b8';
                const rc = REGIMEN_COLOR[a.regimen] || '#94a3b8';
                return (
                  <div key={a.activo_id} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: theme.radius, overflow: 'hidden' }}>
                    {/* Header card */}
                    <div style={{ padding: '10px 14px', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: theme.text }}>{a.nombre}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: `${rc}18`, color: rc, border: `1px solid ${rc}30` }}>{a.regimen}</span>
                    </div>
                    {/* Info */}
                    <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: theme.dim }}>{a.categoria_label}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, color: ec }}>{a.empresa.toUpperCase()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 11, color: theme.dim }}>Site: {a.site || '—'}</span>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: theme.dim }}>{a.activo_id}</span>
                      </div>
                      {a.ip && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2, padding: '2px 6px', background: 'rgba(0,255,136,0.05)', borderRadius: 4, border: '1px solid rgba(0,255,136,0.1)' }}>
                          <span style={{ fontSize: 9, fontWeight: 600, color: '#00ff88', textTransform: 'uppercase' }}>Dirección IP</span>
                          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', color: '#00ff88' }}>{a.ip}</span>
                        </div>
                      )}
                    </div>
                    {/* Actions */}
                    <div style={{ padding: '8px 14px', borderTop: `1px solid ${theme.border}`, display: 'flex', gap: 8 }}>
                      <a href={`${API}/api/etiquetas/activo/${a.activo_id}`} target="_blank" rel="noreferrer"
                        style={{ flex: 1, fontSize: 11, fontWeight: 600, padding: '6px 0', borderRadius: 6, background: `${accent}18`, color: accent, border: `1px solid ${accent}30`, textDecoration: 'none', textAlign: 'center' }}>
                        Ver etiqueta
                      </a>
                      <a href={`${API}/api/etiquetas/activo/${a.activo_id}`} download={`${a.activo_id}.png`}
                        style={{ flex: 1, fontSize: 11, fontWeight: 600, padding: '6px 0', borderRadius: 6, background: 'transparent', color: theme.dim, border: `1px solid ${theme.border}`, textDecoration: 'none', textAlign: 'center' }}>
                        Descargar
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* ── Transacciones ── */
        <>
          <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: theme.radius, padding: '12px 16px', fontSize: 12, color: theme.dim }}>
            Haz clic en <strong style={{ color: theme.text }}>Ver comprobante</strong> para abrir o imprimir el comprobante de cada transacción.
          </div>

          {txs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: theme.dim }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔄</div>
              <div>No hay transacciones registradas</div>
              {!online && <div style={{ marginTop: 8, fontSize: 11, color: '#FF4757' }}>Backend apagado — inicia el servidor para ver transacciones reales</div>}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...txs].reverse().map(tx => {
                const co = EMPRESA_COLOR[tx.empresa_origen]  || '#94a3b8';
                const cd = EMPRESA_COLOR[tx.empresa_destino] || '#94a3b8';
                return (
                  <div key={tx.tx_id} style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: theme.radius, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: `${co}18`, color: co }}>{tx.empresa_origen.toUpperCase()}</span>
                        <span style={{ fontSize: 11, color: theme.dim }}>→</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 20, background: `${cd}18`, color: cd }}>{tx.empresa_destino.toUpperCase()}</span>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: theme.dim, marginLeft: 4 }}>{tx.tx_id}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>{tx.concepto}</div>
                      <div style={{ fontSize: 11, color: '#00C896' }}>{fmt(tx.precio_preferencial)} MXN · {new Date(tx.fecha).toLocaleDateString('es-MX')}</div>
                    </div>
                    <a href={`${API}/api/etiquetas/transaccion/${tx.tx_id}`} target="_blank" rel="noreferrer"
                      style={{ fontSize: 11, fontWeight: 600, padding: '7px 14px', borderRadius: 8, background: `${accent}18`, color: accent, border: `1px solid ${accent}30`, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      🖨️ Ver comprobante
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
