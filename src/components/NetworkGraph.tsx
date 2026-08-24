/**
 * NetworkGraph — Grafo de red con D3 force-directed
 * Vista por SITIO (default) o por dispositivo individual.
 * Nodos aislados ocultados por defecto.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { API_BASE } from '../config';

// ── Tipos raw ──────────────────────────────────────────────────────────────────
interface RawNode {
  id: string;
  label: string;
  model: string;
  type: string;
  status: string;
  signal: number | null;
  stations: number | null;
  site: string | null;
}
interface RawEdge { id: string; source: string; target: string }

// ── Tipos D3 ──────────────────────────────────────────────────────────────────
interface NodeDatum {
  id: string; label: string; type: string; status: string;
  count?: number; active?: number;
  signal?: number | null; model?: string; site?: string | null;
  x?: number; y?: number; vx?: number; vy?: number;
  fx?: number | null; fy?: number | null;
}
interface EdgeDatum {
  id: string;
  source: string | NodeDatum;
  target: string | NodeDatum;
  weight?: number;
}

// ── Paleta ────────────────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  airMax:'#00aff0', airFiber:'#a78bfa', wave:'#f59e0b',
  erouter:'#10b981', eswitch:'#34d399', blackBox:'#6b7280', uispr:'#f97316',
};
const TYPE_LABEL: Record<string, string> = {
  airMax:'airMax', airFiber:'airFiber', wave:'Wave',
  erouter:'Router', eswitch:'Switch', blackBox:'BlackBox', uispr:'UISP-R',
};

function pctColor(pct: number): string {
  if (pct >= 0.9) return '#10b981';
  if (pct >= 0.6) return '#f59e0b';
  return '#ef4444';
}
function typeCol(type: string, status: string) {
  return status === 'disconnected' ? '#334155' : (TYPE_COLOR[type] || '#94a3b8');
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function NetworkGraph({ height = '100%' }: { height?: number | string }) {
  const svgRef  = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const simRef  = useRef<d3.Simulation<NodeDatum, EdgeDatum> | null>(null);

  const [loading, setLoading]       = useState(true);
  const [error,   setError]         = useState<string | null>(null);
  const [selected, setSelected]     = useState<NodeDatum | null>(null);
  const [stats,   setStats]         = useState({ sites: 0, devices: 0, active: 0, edges: 0 });
  const [mode,    setMode]          = useState<'site' | 'device'>('site');
  const [showIsolated, setShowIsolated] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  const rawNodesRef = useRef<RawNode[]>([]);
  const rawEdgesRef = useRef<RawEdge[]>([]);

  // ── Aggregate: devices → sites ─────────────────────────────────────────────
  function buildSiteGraph(rawNodes: RawNode[], rawEdges: RawEdge[]) {
    const siteMap = new Map<string, { nodes: RawNode[] }>();
    rawNodes.forEach(n => {
      const k = n.site || `__no_site__${n.id}`;
      if (!siteMap.has(k)) siteMap.set(k, { nodes: [] });
      siteMap.get(k)!.nodes.push(n);
    });

    // Find inter-site edges
    const nodeToSite = new Map<string, string>();
    rawNodes.forEach(n => nodeToSite.set(n.id, n.site || `__no_site__${n.id}`));

    const edgeSet = new Map<string, number>(); // "siteA|siteB" → weight
    rawEdges.forEach(e => {
      const sa = nodeToSite.get(e.source);
      const sb = nodeToSite.get(e.target);
      if (!sa || !sb || sa === sb) return;
      const key = [sa, sb].sort().join('|');
      edgeSet.set(key, (edgeSet.get(key) || 0) + 1);
    });

    // Build connected site ids
    const connectedSites = new Set<string>();
    edgeSet.forEach((_, key) => {
      const [a, b] = key.split('|');
      connectedSites.add(a);
      connectedSites.add(b);
    });

    const siteNodes: NodeDatum[] = [];
    siteMap.forEach((val, siteId) => {
      const isConnected = connectedSites.has(siteId);
      if (!showIsolated && !isConnected) return;
      const total  = val.nodes.length;
      const active = val.nodes.filter(n => n.status === 'active').length;
      const name   = val.nodes[0].site || '(sin sitio)';
      siteNodes.push({
        id: siteId, label: name, type: 'site', status: active > 0 ? 'active' : 'disconnected',
        count: total, active,
      });
    });

    const siteEdges: EdgeDatum[] = [];
    edgeSet.forEach((weight, key) => {
      const [a, b] = key.split('|');
      if (!siteNodes.find(n => n.id === a) || !siteNodes.find(n => n.id === b)) return;
      siteEdges.push({ id: key, source: a, target: b, weight });
    });

    return { nodes: siteNodes, edges: siteEdges };
  }

  // ── Build device graph ──────────────────────────────────────────────────────
  function buildDeviceGraph(rawNodes: RawNode[], rawEdges: RawEdge[]) {
    const connected = new Set<string>();
    rawEdges.forEach(e => { connected.add(e.source); connected.add(e.target); });

    const nodes: NodeDatum[] = rawNodes
      .filter(n => {
        if (!showIsolated && !connected.has(n.id)) return false;
        if (typeFilter.length && !typeFilter.includes(n.type)) return false;
        return true;
      })
      .map(n => ({
        id: n.id, label: n.label, type: n.type, status: n.status,
        signal: n.signal, model: n.model, site: n.site,
      }));

    const ids = new Set(nodes.map(n => n.id));
    const edges: EdgeDatum[] = rawEdges
      .filter(e => ids.has(e.source) && ids.has(e.target))
      .map(e => ({ id: e.id, source: e.source, target: e.target }));

    return { nodes, edges };
  }

  // ── Draw D3 ────────────────────────────────────────────────────────────────
  const draw = useCallback((nodes: NodeDatum[], edges: EdgeDatum[], isSiteMode: boolean) => {
    const el  = wrapRef.current;
    const svg = svgRef.current;
    if (!el || !svg) return;

    const W = el.clientWidth  || 960;
    const H = el.clientHeight || 620;

    d3.select(svg).selectAll('*').remove();
    const root = d3.select(svg).attr('width', W).attr('height', H);

    // Defs: glow, arrow
    const defs = root.append('defs');
    defs.append('filter').attr('id','glow')
      .append('feGaussianBlur').attr('stdDeviation','3').attr('result','blur')
      .select(function() { return this.parentNode as Element; })
      .append('feMerge').selectAll('feMergeNode')
      .data(['blur','SourceGraphic']).join('feMergeNode').attr('in', d => d);

    defs.append('marker')
      .attr('id','arrow').attr('viewBox','0 -4 8 8')
      .attr('refX', isSiteMode ? 22 : 16).attr('refY', 0)
      .attr('markerWidth', 5).attr('markerHeight', 5)
      .attr('orient','auto')
      .append('path').attr('d','M0,-4L8,0L0,4').attr('fill','rgba(255,255,255,0.15)');

    const g = root.append('g');
    root.call(d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 6])
      .on('zoom', ev => g.attr('transform', ev.transform)));

    // ── Simulation ────────────────────────────────────────────────────────────
    const sim = d3.forceSimulation<NodeDatum>(nodes)
      .force('link', d3.forceLink<NodeDatum, EdgeDatum>(edges)
        .id(d => d.id)
        .distance(isSiteMode ? 140 : 60)
        .strength(isSiteMode ? 0.4 : 0.7))
      .force('charge', d3.forceManyBody<NodeDatum>().strength(d =>
        isSiteMode ? -600 * Math.sqrt(d.count || 1) / 3 : -180
      ))
      .force('center', d3.forceCenter(W / 2, H / 2).strength(0.05))
      .force('collide', d3.forceCollide<NodeDatum>(d =>
        isSiteMode ? 20 + Math.sqrt(d.count || 1) * 8 : 14
      ))
      .alphaDecay(0.018);
    simRef.current = sim;

    // ── Links ─────────────────────────────────────────────────────────────────
    const link = g.append('g').selectAll<SVGLineElement, EdgeDatum>('line')
      .data(edges).join('line')
      .attr('stroke', 'rgba(0,175,240,0.18)')
      .attr('stroke-width', d => isSiteMode ? Math.sqrt((d.weight || 1) * 2) : 1)
      .attr('marker-end', 'url(#arrow)');

    // ── Nodes ─────────────────────────────────────────────────────────────────
    const nodeG = g.append('g').selectAll<SVGGElement, NodeDatum>('g')
      .data(nodes).join('g')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, NodeDatum>()
        .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on('drag',  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
        .on('end',   (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }))
      .on('click', (_ev, d) => setSelected(d));

    if (isSiteMode) {
      // ── Site nodes: hexagonal appearance with count ring ──────────────────
      nodeG.each(function(d) {
        const el = d3.select(this);
        const r  = 12 + Math.sqrt(d.count || 1) * 4;
        const pct = (d.active || 0) / Math.max(d.count || 1, 1);
        const col = pctColor(pct);

        // Outer ring (arc = % active)
        const arc = d3.arc()({ innerRadius: r + 2, outerRadius: r + 6, startAngle: 0, endAngle: 2 * Math.PI * pct });
        el.append('path').attr('d', arc!).attr('fill', col).attr('opacity', 0.8);
        // BG ring
        const arcBg = d3.arc()({ innerRadius: r + 2, outerRadius: r + 6, startAngle: 0, endAngle: 2 * Math.PI });
        el.append('path').attr('d', arcBg!).attr('fill', 'rgba(255,255,255,0.06)');

        // Core circle
        el.append('circle').attr('r', r)
          .attr('fill', `rgba(0,175,240,0.12)`)
          .attr('stroke', col).attr('stroke-width', 1.5)
          .attr('filter', pct > 0.8 ? 'url(#glow)' : undefined);

        // Count label
        el.append('text').text(String(d.count || ''))
          .attr('text-anchor','middle').attr('dominant-baseline','central')
          .attr('fill', col).attr('font-size', Math.min(r * 0.7, 13))
          .attr('font-weight', 700).attr('font-family', 'monospace')
          .attr('pointer-events','none');

        // Site name
        el.append('text').text(
            (d.label || '').length > 16 ? (d.label || '').slice(0, 16) + '…' : (d.label || ''))
          .attr('text-anchor','middle').attr('y', r + 14)
          .attr('fill', 'rgba(255,255,255,0.65)')
          .attr('font-size', 8).attr('font-family', 'monospace')
          .attr('pointer-events','none');
      });
    } else {
      // ── Device nodes ──────────────────────────────────────────────────────
      nodeG.append('circle')
        .attr('r', d => d.type === 'wave' || d.type === 'airFiber' ? 8 : d.type === 'erouter' ? 6.5 : 5)
        .attr('fill', d => typeCol(d.type, d.status))
        .attr('stroke', d => typeCol(d.type, d.status))
        .attr('stroke-width', 1.5)
        .attr('opacity', d => d.status === 'disconnected' ? 0.3 : 1);

      nodeG.filter(d => ['wave','airFiber','erouter'].includes(d.type))
        .append('text')
        .text(d => (d.label||'').length > 20 ? (d.label||'').slice(0,20)+'…' : (d.label||''))
        .attr('x', d => (d.type === 'wave' ? 8 : 6) + 5).attr('y', 3.5)
        .attr('fill', 'rgba(255,255,255,0.75)').attr('font-size', 8)
        .attr('font-family','monospace').attr('pointer-events','none');
    }

    // ── Tick ──────────────────────────────────────────────────────────────────
    sim.on('tick', () => {
      link
        .attr('x1', d => (d.source as NodeDatum).x ?? 0)
        .attr('y1', d => (d.source as NodeDatum).y ?? 0)
        .attr('x2', d => (d.target as NodeDatum).x ?? 0)
        .attr('y2', d => (d.target as NodeDatum).y ?? 0);
      nodeG.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });
  }, [showIsolated, typeFilter]);

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/red/topologia`)
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(data => {
        if (cancelled) return;
        const rn: RawNode[] = (data.nodes || []).map((n: any) => ({
          id: n.id, label: n.data?.label || n.id, model: n.data?.model || '',
          type: n.data?.type || 'unknown', status: n.data?.status || 'unknown',
          signal: n.data?.signal ?? null, stations: n.data?.stations ?? null,
          site: n.data?.site ?? null,
        }));
        const re: RawEdge[] = (data.edges || []).map((e: any) => ({ id: e.id, source: e.source, target: e.target }));

        rawNodesRef.current = rn;
        rawEdgesRef.current = re;

        const sites = new Set(rn.map(n => n.site).filter(Boolean));
        setStats({
          sites:   sites.size,
          devices: rn.length,
          active:  rn.filter(n => n.status === 'active').length,
          edges:   re.length,
        });

        requestAnimationFrame(() => {
          const { nodes, edges } = buildSiteGraph(rn, re);
          draw(nodes, edges, true);
          setLoading(false);
        });
      })
      .catch((e: any) => { if (!cancelled) { setError(String(e)); setLoading(false); } });
    return () => { cancelled = true; simRef.current?.stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-draw on mode/filter change ─────────────────────────────────────────
  useEffect(() => {
    if (loading || rawNodesRef.current.length === 0) return;
    simRef.current?.stop();
    rawNodesRef.current.forEach(n => { (n as any).x = undefined; (n as any).y = undefined; });
    const isSite = mode === 'site';
    const { nodes, edges } = isSite
      ? buildSiteGraph(rawNodesRef.current, rawEdgesRef.current)
      : buildDeviceGraph(rawNodesRef.current, rawEdgesRef.current);
    requestAnimationFrame(() => draw(nodes, edges, isSite));
  }, [mode, showIsolated, typeFilter, draw]); // eslint-disable-line react-hooks/exhaustive-deps

  const types = Object.keys(TYPE_COLOR);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div ref={wrapRef} style={{ width:'100%', height, background:'#050810', position:'relative', overflow:'hidden' }}>
      <svg ref={svgRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} />

      {loading && !error && (
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14, color:'#00aff0' }}>
          <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid rgba(0,175,240,0.15)', borderTopColor:'#00aff0', animation:'spin 0.8s linear infinite' }} />
          <span style={{ fontSize:11, fontFamily:'monospace', letterSpacing:2 }}>CARGANDO TOPOLOGÍA…</span>
        </div>
      )}
      {error && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'#ff6b6b', fontSize:13, fontFamily:'monospace' }}>
          ⚠ {error}
        </div>
      )}

      {/* KPIs */}
      {!loading && !error && (
        <div style={{ position:'absolute', top:14, left:14, display:'flex', gap:8 }}>
          {[
            { v: stats.sites,   l:'Sitios',     c:'#00aff0' },
            { v: stats.devices, l:'Dispositivos',c:'#e2e8f0' },
            { v: stats.active,  l:'Activos',    c:'#10b981' },
            { v: stats.edges,   l:'Conexiones', c:'#a78bfa' },
          ].map(k => (
            <div key={k.l} style={{ background:'rgba(5,8,16,0.88)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:8, padding:'5px 11px', textAlign:'center', backdropFilter:'blur(8px)' }}>
              <div style={{ fontSize:18, fontWeight:900, color:k.c, lineHeight:1 }}>{k.v}</div>
              <div style={{ fontSize:8, color:'rgba(255,255,255,0.3)', letterSpacing:1, marginTop:2 }}>{k.l.toUpperCase()}</div>
            </div>
          ))}
        </div>
      )}

      {/* Controles */}
      {!loading && !error && (
        <div style={{ position:'absolute', bottom:14, left:14, background:'rgba(5,8,16,0.9)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'10px 14px', backdropFilter:'blur(8px)', display:'flex', flexDirection:'column', gap:6, minWidth:170 }}>

          {/* Modo */}
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', fontWeight:700, letterSpacing:1.2, marginBottom:2 }}>VISTA</div>
          <div style={{ display:'flex', gap:4, marginBottom:6 }}>
            {(['site','device'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex:1, padding:'4px 0', borderRadius:6, border:'none', cursor:'pointer',
                background: mode === m ? '#00aff0' : 'rgba(255,255,255,0.06)',
                color: mode === m ? '#000' : 'rgba(255,255,255,0.5)',
                fontSize:9, fontWeight:700, fontFamily:'monospace',
              }}>{m === 'site' ? 'SITIOS' : 'EQUIPOS'}</button>
            ))}
          </div>

          {/* Aislados */}
          <label style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer' }}>
            <input type="checkbox" checked={showIsolated} onChange={e => setShowIsolated(e.target.checked)} style={{ accentColor:'#00aff0', cursor:'pointer' }} />
            <span style={{ fontSize:9, color:'rgba(255,255,255,0.45)', fontFamily:'monospace' }}>MOSTRAR AISLADOS</span>
          </label>

          {/* Tipo filter — solo en modo dispositivo */}
          {mode === 'device' && <>
            <div style={{ fontSize:9, color:'#00aff0', fontWeight:700, letterSpacing:1.2, marginTop:4 }}>TIPO EQUIPO</div>
            {types.map(t => {
              const on = typeFilter.length === 0 || typeFilter.includes(t);
              return (
                <button key={t} onClick={() => setTypeFilter(p => p.includes(t) ? p.filter(x=>x!==t) : [...p,t])} style={{ display:'flex', alignItems:'center', gap:7, background:'none', border:'none', cursor:'pointer', opacity: on ? 1 : 0.3, padding:0 }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:TYPE_COLOR[t], boxShadow: on ? `0 0 5px ${TYPE_COLOR[t]}` : 'none' }} />
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.65)', fontFamily:'monospace' }}>{TYPE_LABEL[t]}</span>
                </button>
              );
            })}
          </>}

          {/* Leyenda sitios */}
          {mode === 'site' && <>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', marginTop:4 }}>
              <span style={{ color:'#10b981' }}>●</span> &gt;90% online<br/>
              <span style={{ color:'#f59e0b' }}>●</span> 60–90% online<br/>
              <span style={{ color:'#ef4444' }}>●</span> &lt;60% online
            </div>
            <div style={{ fontSize:8, color:'rgba(255,255,255,0.2)' }}>Tamaño = # dispositivos</div>
          </>}

          <div style={{ marginTop:4, paddingTop:6, borderTop:'1px solid rgba(255,255,255,0.05)', fontSize:9, color:'rgba(255,255,255,0.2)' }}>
            Scroll zoom · Drag · Click info
          </div>
        </div>
      )}

      {/* Inspector */}
      {selected && (
        <div style={{ position:'absolute', bottom:14, right:14, background:'rgba(5,8,16,0.96)', border:'1px solid rgba(0,175,240,0.25)', borderRadius:12, padding:'14px 18px', backdropFilter:'blur(12px)', minWidth:230, maxWidth:300 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'#fff', wordBreak:'break-word', lineHeight:1.3 }}>{selected.label}</div>
              {selected.type === 'site'
                ? <div style={{ fontSize:9, color:'#00aff0', fontFamily:'monospace', marginTop:3 }}>{selected.count} dispositivos · {selected.active} activos</div>
                : <div style={{ fontSize:9, color: typeCol(selected.type, selected.status), fontFamily:'monospace', marginTop:3 }}>{selected.model || selected.type}</div>
              }
            </div>
            <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:18, lineHeight:1, padding:'0 0 0 8px', flexShrink:0 }}>×</button>
          </div>

          {selected.type === 'site' ? (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                <div style={{ flex:1, height:6, borderRadius:3, background:'rgba(255,255,255,0.08)', overflow:'hidden' }}>
                  <div style={{ width: `${100*(selected.active||0)/Math.max(selected.count||1,1)}%`, height:'100%', background: pctColor((selected.active||0)/Math.max(selected.count||1,1)), borderRadius:3, transition:'width 0.3s' }} />
                </div>
                <span style={{ fontSize:10, color:'rgba(255,255,255,0.7)', fontFamily:'monospace' }}>
                  {Math.round(100*(selected.active||0)/Math.max(selected.count||1,1))}%
                </span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {[
                  { l:'Sitio', v: selected.label },
                  { l:'Total equipos', v: String(selected.count) },
                  { l:'Activos', v: String(selected.active) },
                  { l:'Offline', v: String((selected.count||0)-(selected.active||0)) },
                ].map(r => (
                  <div key={r.l} style={{ display:'flex', justifyContent:'space-between', gap:12 }}>
                    <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontFamily:'monospace' }}>{r.l}</span>
                    <span style={{ fontSize:10, color:'rgba(255,255,255,0.8)', fontFamily:'monospace' }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {[
                { l:'Tipo',      v: TYPE_LABEL[selected.type] || selected.type },
                { l:'Sitio',     v: selected.site || '—' },
                { l:'Modelo',    v: selected.model || '—' },
                { l:'Señal',     v: selected.signal != null ? `${selected.signal} dBm` : '—' },
              ].map(r => (
                <div key={r.l} style={{ display:'flex', justifyContent:'space-between', gap:12 }}>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.35)', fontFamily:'monospace' }}>{r.l}</span>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.8)', fontFamily:'monospace', wordBreak:'break-all', textAlign:'right' }}>{r.v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ position:'absolute', top:14, right:14, fontSize:9, color:'rgba(255,255,255,0.15)', fontFamily:'monospace' }}>SCROLL = ZOOM · DRAG = PAN</div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
