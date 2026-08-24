/**
 * SyncSection — Panel de sincronización de fuentes de datos XCIEN
 * Muestra cobertura de: Odoo Operacional · Drive Contratos · Inventario IPs
 */
import { useEffect, useState } from 'react';
import { API_BASE } from '../../../config';

interface SyncResumen {
  total_fuentes_locales: number;
  drive_total: number;
  inventario_total: number;
  en_ambas: number;
  solo_drive: number;
  solo_inventario: number;
  con_coordenadas: number;
  con_ip_router: number;
  pct_drive: number;
  pct_inventario: number;
  pct_cruzados: number;
}

interface SyncSitio {
  key: string;
  nombre: string;
  drive: boolean;
  inv: boolean;
  lat: number | null;
  lng: number | null;
  vigencia: string | null;
  renta: string | null;
  city: string | null;
  ip_router: string | null;
  sop: string | null;
  plaza: string | null;
  suma_ok: number;
}

const G = '#009B4E';
const DARK = '#0D1B2A';
const G2 = '#00ff88';

function Bar({ pct, color = G2 }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', flex: 1 }}>
      <div style={{
        width: `${Math.min(pct, 100)}%`, height: '100%',
        background: color, borderRadius: 3,
        transition: 'width 0.5s ease',
        boxShadow: `0 0 6px ${color}60`,
      }} />
    </div>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20, fontSize: 9, fontFamily: 'monospace',
      background: ok ? 'rgba(0,255,136,0.1)' : 'rgba(100,116,139,0.15)',
      color: ok ? '#00ff88' : 'rgba(255,255,255,0.25)',
      border: `1px solid ${ok ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.06)'}`,
    }}>
      {ok ? '✓' : '–'} {label}
    </span>
  );
}

export default function SyncSection() {
  const [resumen, setResumen] = useState<SyncResumen | null>(null);
  const [sitios,  setSitios]  = useState<SyncSitio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState<'all' | 'ambas' | 'solo_drive' | 'solo_inv' | 'sin_ip'>('all');
  const [harmonizedTotal, setHarmonizedTotal] = useState<number | null>(null);

  useEffect(() => {
    // Carga rápida: sync-status (no llama Odoo)
    fetch(`${API_BASE}/api/infra/sitios/sync-status`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        setResumen(d.resumen);
        setSitios(d.sitios || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    // Carga lenta: total unificado (incluye Odoo)
    fetch(`${API_BASE}/api/infra/sitios`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.total) setHarmonizedTotal(d.total); })
      .catch(() => {});
  }, []);

  const filtered = sitios.filter(s => {
    const q = search.toLowerCase();
    if (q && !s.nombre.toLowerCase().includes(q) && !(s.city || '').toLowerCase().includes(q) && !(s.plaza || '').toLowerCase().includes(q)) return false;
    if (filter === 'ambas'      && !(s.drive && s.inv))  return false;
    if (filter === 'solo_drive' && !(s.drive && !s.inv)) return false;
    if (filter === 'solo_inv'   && !(s.inv && !s.drive)) return false;
    if (filter === 'sin_ip'     && s.ip_router)           return false;
    return true;
  });

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color: G2, fontFamily:'monospace' }}>
      Cargando sincronización…
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', background: DARK, color:'#e2e8f0', fontFamily:'system-ui, sans-serif', overflow:'hidden' }}>

      {/* Header */}
      <div style={{ padding:'20px 24px 0', borderBottom:'1px solid rgba(0,255,136,0.08)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
          <div style={{ width:6, height:28, background: G2, borderRadius:3 }} />
          <div>
            <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:'#fff' }}>Sincronización de Fuentes</h2>
            <p style={{ margin:0, fontSize:11, color:'rgba(255,255,255,0.35)' }}>
              Cobertura cruzada: Odoo Operacional · Drive Contratos · Inventario IPs/Equipos
            </p>
          </div>
        </div>

        {/* KPI cards */}
        <div style={{ display:'flex', gap:12, paddingTop:16, paddingBottom:16, flexWrap:'wrap' }}>
          {[
            { label:'Total unificado', value: harmonizedTotal ?? '…', sub:'Odoo + Drive + Inv', color: G2 },
            { label:'Drive (contratos)', value: resumen?.drive_total ?? '–', sub:`${resumen?.pct_drive ?? 0}% del total`, color:'#f59e0b' },
            { label:'Inventario (IPs)', value: resumen?.inventario_total ?? '–', sub:`${resumen?.pct_inventario ?? 0}% del total`, color:'#a78bfa' },
            { label:'Las 3 fuentes',   value: resumen?.en_ambas ?? '–', sub:`${resumen?.pct_cruzados ?? 0}% cruzados`, color:'#10b981' },
            { label:'Con IP router',   value: resumen?.con_ip_router ?? '–', sub:'acceso de red confirmado', color:'#00aff0' },
            { label:'Con coordenadas', value: resumen?.con_coordenadas ?? '–', sub:'visibles en mapa', color:'#f97316' },
          ].map(k => (
            <div key={k.label} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'10px 14px', minWidth:120 }}>
              <div style={{ fontSize:22, fontWeight:900, color: k.color }}>{k.value}</div>
              <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.6)', marginTop:1 }}>{k.label}</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.25)', marginTop:1 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Barras de cobertura */}
        <div style={{ display:'flex', flexDirection:'column', gap:8, paddingBottom:16 }}>
          {[
            { label:'Drive',      pct: resumen?.pct_drive ?? 0,      color:'#f59e0b', n: resumen?.drive_total },
            { label:'Inventario', pct: resumen?.pct_inventario ?? 0, color:'#a78bfa', n: resumen?.inventario_total },
            { label:'Cruzados',   pct: resumen?.pct_cruzados ?? 0,   color:'#10b981', n: resumen?.en_ambas },
          ].map(b => (
            <div key={b.label} style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:9, color:'rgba(255,255,255,0.4)', fontFamily:'monospace', width:72, textAlign:'right' }}>{b.label}</span>
              <Bar pct={b.pct} color={b.color} />
              <span style={{ fontSize:11, fontWeight:700, color: b.color, width:36, fontFamily:'monospace' }}>{b.pct}%</span>
              <span style={{ fontSize:9, color:'rgba(255,255,255,0.25)', fontFamily:'monospace' }}>{b.n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0 }}>
        {/* Barra de búsqueda y filtros */}
        <div style={{ padding:'10px 24px', display:'flex', gap:10, alignItems:'center', borderBottom:'1px solid rgba(255,255,255,0.05)', flexWrap:'wrap' }}>
          <input
            placeholder="Buscar sitio, ciudad, plaza…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex:1, minWidth:200, padding:'6px 12px', borderRadius:8,
              background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)',
              color:'#fff', fontSize:12, outline:'none',
            }}
          />
          {([
            { id:'all',       label:`Todos (${sitios.length})` },
            { id:'ambas',     label:`En ambas (${resumen?.en_ambas ?? 0})` },
            { id:'solo_drive',label:`Solo Drive (${resumen?.solo_drive ?? 0})` },
            { id:'solo_inv',  label:`Solo Inv. (${resumen?.solo_inventario ?? 0})` },
            { id:'sin_ip',    label:'Sin IP router' },
          ] as const).map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding:'5px 11px', borderRadius:8, border:'none', cursor:'pointer', fontSize:10, fontFamily:'monospace',
              background: filter === f.id ? G2 : 'rgba(255,255,255,0.07)',
              color: filter === f.id ? DARK : 'rgba(255,255,255,0.5)',
              fontWeight: filter === f.id ? 700 : 400,
            }}>{f.label}</button>
          ))}
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.25)' }}>{filtered.length} filas</span>
        </div>

        {/* Encabezado tabla */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 80px 100px 130px 110px 80px', padding:'6px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(0,0,0,0.2)' }}>
          {['Sitio / Ciudad','Drive','Inventario','IP Router','Vigencia Contrato','Renta','Score'].map(h => (
            <span key={h} style={{ fontSize:9, color:'rgba(255,255,255,0.35)', fontFamily:'monospace', fontWeight:700, letterSpacing:0.5 }}>{h}</span>
          ))}
        </div>

        {/* Filas */}
        <div style={{ flex:1, overflowY:'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding:40, textAlign:'center', color:'rgba(255,255,255,0.2)', fontSize:13 }}>Sin resultados</div>
          )}
          {filtered.map((s, i) => (
            <div key={s.key} style={{
              display:'grid', gridTemplateColumns:'1fr 90px 80px 100px 130px 110px 80px',
              padding:'8px 24px', alignItems:'center',
              borderBottom:'1px solid rgba(255,255,255,0.04)',
              background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
              transition:'background 0.1s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,255,136,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = i%2===0 ? 'transparent' : 'rgba(255,255,255,0.015)')}
            >
              {/* Nombre */}
              <div>
                <div style={{ fontSize:11, fontWeight:600, color:'#fff' }}>{s.nombre}</div>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:1 }}>
                  {[s.city, s.plaza].filter(Boolean).join(' · ') || s.key.slice(0,30)}
                </div>
              </div>
              {/* Drive */}
              <Badge ok={s.drive} label="Drive" />
              {/* Inventario */}
              <Badge ok={s.inv} label="Inv." />
              {/* IP Router */}
              <span style={{ fontSize:9, fontFamily:'monospace', color: s.ip_router ? '#00aff0' : 'rgba(255,255,255,0.2)' }}>
                {s.ip_router || '—'}
              </span>
              {/* Vigencia */}
              <span style={{ fontSize:9, color: s.vigencia ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', lineHeight:1.3 }}>
                {s.vigencia ? s.vigencia.slice(0,35) : '—'}
              </span>
              {/* Renta */}
              <span style={{ fontSize:9, fontFamily:'monospace', color: s.renta ? '#f59e0b' : 'rgba(255,255,255,0.2)' }}>
                {s.renta || '—'}
              </span>
              {/* Score */}
              <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:32, height:4, borderRadius:2, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                  <div style={{
                    width: `${Math.round(100 * s.suma_ok / 30)}%`, height:'100%',
                    background: s.suma_ok >= 24 ? '#10b981' : s.suma_ok >= 12 ? '#f59e0b' : '#ef4444',
                    borderRadius:2,
                  }} />
                </div>
                <span style={{ fontSize:9, fontFamily:'monospace', color:'rgba(255,255,255,0.4)' }}>{s.suma_ok || '—'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
