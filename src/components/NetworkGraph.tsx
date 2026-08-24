/**
 * NetworkGraph — Grafo de red con D3 force-directed
 * Nodes agrupados por sitio, filtro por tipo funcional,
 * señal como grosor de arista, hulls de cluster.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { API_BASE } from '../config';

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface NodeDatum {
  id: string;
  label: string;
  model: string;
  type: string;
  status: string;
  signal: number | null;
  stations: number | null;
  site: string | null;
  x?: number; y?: number;
  vx?: number; vy?: number;
  fx?: number | null; fy?: number | null;
}

interface EdgeDatum {
  id: string;
  source: string | NodeDatum;
  target: string | NodeDatum;
}

// ── Paleta ────────────────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  airMax:   '#00aff0',
  airFiber: '#a78bfa',
  wave:     '#f59e0b',
  erouter:  '#10b981',
  eswitch:  '#34d399',
  blackBox: '#6b7280',
  uispr:    '#f97316',
};

const TYPE_LABEL: Record<string, string> = {
  airMax:   'airMax',
  airFiber: 'airFiber',
  wave:     'Wave',
  erouter:  'Router',
  eswitch:  'Switch',
  blackBox: 'BlackBox',
  uispr:    'UISP-R',
};

// Paleta de sitios (10 colores ciclables)
const SITE_PALETTE = [
  '#00aff0','#a78bfa','#f59e0b','#10b981','#f97316',
  '#ec4899','#06b6d4','#84cc16','#ef4444','#8b5cf6',
];

function nodeColor(type: string, status: string): string {
  const base = TYPE_COLOR[type] || '#94a3b8';
  return status === 'disconnected' ? '#334155' : base;
}

function nodeRadius(type: string): number {
  if (type === 'wave' || type === 'airFiber') return 8;
  if (type === 'erouter') return 6.5;
  if (type === 'airMax') return 5;
  return 4;
}

// ── Componente ────────────────────────────────────────────────────────────────
interface NetworkGraphProps { height?: number | string }

export default function NetworkGraph({ height = '100%' }: NetworkGraphProps) {
  const svgRef   = useRef<SVGSVGElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const simRef   = useRef<d3.Simulation<NodeDatum, EdgeDatum> | null>(null);

  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [selected,   setSelected]   = useState<NodeDatum | null>(null);
  const [stats,      setStats]      = useState({ total: 0, active: 0, offline: 0, edges: 0 });
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [groupBySite, setGroupBySite] = useState(true);

  const nodesRef = useRef<NodeDatum[]>([]);
  const edgesRef = useRef<EdgeDatum[]>([]);

  // ── Build D3 graph ──────────────────────────────────────────────────────────
  const buildGraph = useCallback((allNodes: NodeDatum[], allEdges: EdgeDatum[]) => {
    const el  = wrapRef.current;
    const svg = svgRef.current;
    if (!el || !svg) return;

    // Apply type filter
    const nodes = typeFilter.length === 0
      ? allNodes
      : allNodes.filter(n => typeFilter.includes(n.type));
    const nodeIds = new Set(nodes.map(n => n.id));
    const edges = allEdges.filter(e => {
      const sid = typeof e.source === 'string' ? e.source : e.source.id;
      const tid = typeof e.target === 'string' ? e.target : e.target.id;
      return nodeIds.has(sid) && nodeIds.has(tid);
    });

    const W = el.clientWidth  || 900;
    const H = el.clientHeight || 600;

    d3.select(svg).selectAll('*').remove();

    const root = d3.select(svg).attr('width', W).attr('height', H);

    // Arrow marker
    root.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 16).attr('refY', 0)
      .attr('markerWidth', 5).attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', 'rgba(255,255,255,0.12)');

    const g = root.append('g');

    root.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.05, 5])
        .on('zoom', ev => g.attr('transform', ev.transform))
    );

    // ── Site color mapping
    const sites = Array.from(new Set(nodes.map(n => n.site).filter(Boolean))) as string[];
    const siteColor = new Map(sites.map((s, i) => [s, SITE_PALETTE[i % SITE_PALETTE.length]]));
    // Site centroids for cluster force
    const siteCentroids = new Map<string, { x: number; y: number }>();
    if (groupBySite && sites.length > 1) {
      const cols = Math.ceil(Math.sqrt(sites.length));
      sites.forEach((s, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        siteCentroids.set(s, {
          x: W * 0.15 + (W * 0.7) * (col / Math.max(cols - 1, 1)),
          y: H * 0.15 + (H * 0.7) * (row / Math.max(Math.ceil(sites.length / cols) - 1, 1)),
        });
      });
    }

    // ── Simulation ────────────────────────────────────────────────────────────
    const sim = d3.forceSimulation<NodeDatum>(nodes)
      .force('link', d3.forceLink<NodeDatum, EdgeDatum>(edges)
        .id(d => d.id)
        .distance(d => {
          const s = d.source as NodeDatum, t = d.target as NodeDatum;
          if (s.site && s.site === t.site) return 45;
          if (s.type === 'airFiber' || t.type === 'airFiber') return 100;
          if (s.type === 'wave'     || t.type === 'wave')     return 90;
          return 60;
        })
        .strength(0.7)
      )
      .force('charge', d3.forceManyBody<NodeDatum>().strength(d => {
        if (d.type === 'wave' || d.type === 'airFiber') return -350;
        if (d.type === 'erouter') return -250;
        return -150;
      }))
      .force('center', d3.forceCenter(W / 2, H / 2).strength(groupBySite ? 0.02 : 0.08))
      .force('collide', d3.forceCollide<NodeDatum>(d => nodeRadius(d.type) + 8))
      .alphaDecay(0.02);

    // Cluster force: pull same-site nodes toward their centroid
    if (groupBySite && siteCentroids.size > 0) {
      sim.force('cluster', (alpha: number) => {
        nodes.forEach(n => {
          if (!n.site) return;
          const c = siteCentroids.get(n.site);
          if (!c) return;
          n.vx = (n.vx ?? 0) + (c.x - (n.x ?? W/2)) * alpha * 0.08;
          n.vy = (n.vy ?? 0) + (c.y - (n.y ?? H/2)) * alpha * 0.08;
        });
      });
    }

    simRef.current = sim;

    // ── Hull layer (site bubbles) ─────────────────────────────────────────────
    const hullG = g.append('g').attr('class', 'hulls');

    // ── Links ─────────────────────────────────────────────────────────────────
    const link = g.append('g').selectAll<SVGLineElement, EdgeDatum>('line')
      .data(edges).join('line')
      .attr('stroke', d => {
        const s = d.source as NodeDatum;
        const t = d.target as NodeDatum;
        if (s.site && s.site === t.site && siteColor.has(s.site)) {
          return siteColor.get(s.site) + '40';
        }
        return 'rgba(255,255,255,0.07)';
      })
      .attr('stroke-width', (d: EdgeDatum) => {
        const s = d.source as NodeDatum;
        const sig = s.signal;
        if (sig == null) return 1;
        return Math.max(0.5, Math.min(3, 1 + (sig + 90) / 20));
      })
      .attr('marker-end', 'url(#arrow)');

    // ── Nodes ─────────────────────────────────────────────────────────────────
    const node = g.append('g').selectAll<SVGGElement, NodeDatum>('g')
      .data(nodes).join('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, NodeDatum>()
          .on('start', (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on('drag',  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
          .on('end',   (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      )
      .on('click', (_ev, d) => setSelected(d));

    // Site-colored outer ring
    node.append('circle')
      .attr('r', d => nodeRadius(d.type) + 4)
      .attr('fill', 'none')
      .attr('stroke', d => {
        if (d.status !== 'active') return 'transparent';
        if (d.site && siteColor.has(d.site)) return siteColor.get(d.site)!;
        return nodeColor(d.type, d.status);
      })
      .attr('stroke-width', 1.2)
      .attr('opacity', 0.3);

    // Main circle
    node.append('circle')
      .attr('r', d => nodeRadius(d.type))
      .attr('fill', d => nodeColor(d.type, d.status))
      .attr('stroke', d => d.status === 'active' ? nodeColor(d.type, d.status) : '#334155')
      .attr('stroke-width', 1.5)
      .attr('opacity', d => d.status === 'disconnected' ? 0.3 : 1);

    // Label for routers, wave, airFiber
    node.filter(d => ['wave', 'airFiber', 'erouter'].includes(d.type))
      .append('text')
      .text(d => d.label.length > 20 ? d.label.slice(0, 20) + '…' : d.label)
      .attr('x', d => nodeRadius(d.type) + 5)
      .attr('y', 3.5)
      .attr('fill', d => d.status === 'disconnected' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)')
      .attr('font-size', 8)
      .attr('font-family', 'monospace')
      .attr('pointer-events', 'none');

    // ── Tick ──────────────────────────────────────────────────────────────────
    sim.on('tick', () => {
      link
        .attr('x1', d => (d.source as NodeDatum).x ?? 0)
        .attr('y1', d => (d.source as NodeDatum).y ?? 0)
        .attr('x2', d => (d.target as NodeDatum).x ?? 0)
        .attr('y2', d => (d.target as NodeDatum).y ?? 0);

      node.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);

      // Update hulls every 5 ticks for performance
      if (groupBySite && Math.random() < 0.2) {
        hullG.selectAll('*').remove();
        sites.forEach(site => {
          const pts = nodes
            .filter(n => n.site === site && n.x != null && n.y != null)
            .map(n => [n.x!, n.y!] as [number, number]);
          if (pts.length < 3) return;
          const hull = d3.polygonHull(pts);
          if (!hull) return;
          const sc = siteColor.get(site) || '#ffffff';
          hullG.append('path')
            .attr('d', 'M' + hull.map(p => p.join(',')).join('L') + 'Z')
            .attr('fill', sc + '08')
            .attr('stroke', sc + '25')
            .attr('stroke-width', 1.5)
            .attr('stroke-linejoin', 'round');
        });
      }
    });
  }, [typeFilter, groupBySite]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/api/red/topologia`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        const rawNodes: NodeDatum[] = (data.nodes || []).map((n: any) => ({
          id:       n.id,
          label:    n.data?.label || n.id,
          model:    n.data?.model || '',
          type:     n.data?.type  || 'unknown',
          status:   n.data?.status || 'unknown',
          signal:   n.data?.signal ?? null,
          stations: n.data?.stations ?? null,
          site:     n.data?.site ?? null,
        }));

        const rawEdges: EdgeDatum[] = (data.edges || []).map((e: any) => ({
          id: e.id, source: e.source, target: e.target,
        }));

        setStats({
          total:   rawNodes.length,
          active:  rawNodes.filter(n => n.status === 'active').length,
          offline: rawNodes.filter(n => n.status === 'disconnected').length,
          edges:   rawEdges.length,
        });

        nodesRef.current = rawNodes;
        edgesRef.current = rawEdges;

        requestAnimationFrame(() => {
          buildGraph(rawNodes, rawEdges);
          setLoading(false);
        });
      } catch (e: any) {
        if (!cancelled) { setError(e.message); setLoading(false); }
      }
    }
    load();
    return () => { cancelled = true; simRef.current?.stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-render when filter or grouping changes ──────────────────────────────
  useEffect(() => {
    if (loading || nodesRef.current.length === 0) return;
    simRef.current?.stop();
    // Reset positions so new layout starts fresh
    nodesRef.current.forEach(n => { n.x = undefined; n.y = undefined; n.fx = null; n.fy = null; });
    requestAnimationFrame(() => buildGraph(nodesRef.current, edgesRef.current));
  }, [typeFilter, groupBySite, buildGraph]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const types = Object.keys(TYPE_COLOR);
  const toggleType = (t: string) =>
    setTypeFilter(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div ref={wrapRef} style={{
      width: '100%', height,
      background: '#050810',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <svg ref={svgRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* Loading */}
      {loading && !error && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 14, color: '#00aff0',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid rgba(0,175,240,0.15)', borderTopColor: '#00aff0',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: 2 }}>CARGANDO TOPOLOGÍA…</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ff6b6b', fontSize: 13, fontFamily: 'monospace',
        }}>
          ⚠ {error}
        </div>
      )}

      {/* KPIs */}
      {!loading && !error && (
        <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', gap: 8 }}>
          {[
            { v: stats.total,   l: 'Nodos',        c: '#e2e8f0' },
            { v: stats.active,  l: 'Activos',       c: '#10b981' },
            { v: stats.offline, l: 'Offline',        c: '#ef4444' },
            { v: stats.edges,   l: 'Aristas',       c: '#00aff0' },
          ].map(k => (
            <div key={k.l} style={{
              background: 'rgba(5,8,16,0.88)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8, padding: '5px 11px', textAlign: 'center',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{ fontSize: 19, fontWeight: 900, color: k.c, lineHeight: 1 }}>{k.v}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, marginTop: 2 }}>
                {k.l.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Controles bottom-left */}
      {!loading && !error && (
        <div style={{
          position: 'absolute', bottom: 14, left: 14,
          background: 'rgba(5,8,16,0.9)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {/* Cluster toggle */}
          <button onClick={() => setGroupBySite(p => !p)} style={{
            display: 'flex', alignItems: 'center', gap: 7, background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, marginBottom: 4,
          }}>
            <div style={{
              width: 28, height: 14, borderRadius: 7,
              background: groupBySite ? '#10b981' : '#334155',
              position: 'relative', transition: 'background 0.2s',
              flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 2, left: groupBySite ? 14 : 2,
                width: 10, height: 10, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
              }} />
            </div>
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace' }}>
              AGRUPAR POR SITIO
            </span>
          </button>

          <div style={{ fontSize: 9, color: '#00aff0', fontWeight: 700, letterSpacing: 1.5, marginBottom: 2 }}>
            TIPO DE DISPOSITIVO
          </div>
          {types.map(t => {
            const active = typeFilter.length === 0 || typeFilter.includes(t);
            return (
              <button key={t} onClick={() => toggleType(t)} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'none', border: 'none', cursor: 'pointer',
                opacity: active ? 1 : 0.3, padding: 0,
              }}>
                <div style={{
                  width: 9, height: 9, borderRadius: '50%', background: TYPE_COLOR[t],
                  boxShadow: active ? `0 0 5px ${TYPE_COLOR[t]}` : 'none',
                }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontFamily: 'monospace' }}>
                  {TYPE_LABEL[t]}
                </span>
              </button>
            );
          })}
          <div style={{
            marginTop: 4, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.05)',
            fontSize: 9, color: 'rgba(255,255,255,0.2)',
          }}>
            Scroll zoom · Drag nodos · Click info
          </div>
        </div>
      )}

      {/* Inspector */}
      {selected && (
        <div style={{
          position: 'absolute', bottom: 14, right: 14,
          background: 'rgba(5,8,16,0.96)',
          border: `1px solid ${nodeColor(selected.type, selected.status)}50`,
          borderRadius: 12, padding: '14px 18px', backdropFilter: 'blur(12px)',
          minWidth: 230, maxWidth: 290,
          boxShadow: `0 0 28px ${nodeColor(selected.type, selected.status)}18`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', wordBreak: 'break-word', lineHeight: 1.3 }}>
                {selected.label}
              </div>
              <div style={{ fontSize: 9, color: nodeColor(selected.type, selected.status), fontFamily: 'monospace', marginTop: 3 }}>
                {selected.model || selected.type}
              </div>
            </div>
            <button onClick={() => setSelected(null)} style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
              fontSize: 18, lineHeight: 1, padding: '0 0 0 8px', flexShrink: 0,
            }}>×</button>
          </div>

          {/* Status */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: selected.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${selected.status === 'active' ? '#10b981' : '#ef4444'}30`,
            borderRadius: 20, padding: '3px 10px', marginBottom: 10,
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: selected.status === 'active' ? '#10b981' : '#ef4444',
            }} />
            <span style={{
              fontSize: 9, fontWeight: 700, fontFamily: 'monospace',
              color: selected.status === 'active' ? '#10b981' : '#ef4444', letterSpacing: 1,
            }}>
              {selected.status === 'active' ? 'ACTIVO' : selected.status === 'disconnected' ? 'DESCONECTADO' : selected.status.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { l: 'Tipo',       v: TYPE_LABEL[selected.type] || selected.type },
              { l: 'Sitio',      v: selected.site || '—' },
              { l: 'Modelo',     v: selected.model || '—' },
              { l: 'Señal',      v: selected.signal != null ? `${selected.signal} dBm` : '—' },
              { l: 'Estaciones', v: selected.stations != null ? String(selected.stations) : '—' },
            ].map(row => (
              <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{row.l}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace', textAlign: 'right', wordBreak: 'break-all' }}>{row.v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 9, color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>
        SCROLL = ZOOM · DRAG = PAN
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
