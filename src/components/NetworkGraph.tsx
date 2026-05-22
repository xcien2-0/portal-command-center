/**
 * NetworkGraph — Grafo de red completo con D3 force-directed
 * Muestra todos los dispositivos UISP y sus conexiones inalámbricas
 */
import { useEffect, useRef, useState } from 'react';
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
  // D3 internals
  x?: number; y?: number;
  vx?: number; vy?: number;
  fx?: number | null; fy?: number | null;
}

interface EdgeDatum {
  id: string;
  source: string | NodeDatum;
  target: string | NodeDatum;
}

// ── Paleta por tipo de dispositivo ───────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  airMax:    '#00aff0',
  airFiber:  '#a78bfa',
  wave:      '#f59e0b',
  erouter:   '#10b981',
  eswitch:   '#34d399',
  blackBox:  '#6b7280',
  uispr:     '#f97316',
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

function nodeColor(type: string, status: string): string {
  const base = TYPE_COLOR[type] || '#94a3b8';
  return status === 'disconnected' ? '#475569' : base;
}

function nodeRadius(type: string): number {
  if (type === 'wave' || type === 'airFiber') return 7;
  if (type === 'airMax') return 5.5;
  if (type === 'erouter') return 5;
  return 4.5;
}

// ── Componente ────────────────────────────────────────────────────────────────
interface NetworkGraphProps {
  height?: number | string;
}

export default function NetworkGraph({ height = '100%' }: NetworkGraphProps) {
  const svgRef   = useRef<SVGSVGElement>(null);
  const wrapRef  = useRef<HTMLDivElement>(null);
  const simRef   = useRef<d3.Simulation<NodeDatum, EdgeDatum> | null>(null);

  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [selected, setSelected]     = useState<NodeDatum | null>(null);
  const [stats, setStats]           = useState({ total: 0, active: 0, offline: 0, edges: 0 });
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const nodesRef = useRef<NodeDatum[]>([]);
  const edgesRef = useRef<EdgeDatum[]>([]);

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
          id:     e.id,
          source: e.source,
          target: e.target,
        }));

        setStats({
          total:   rawNodes.length,
          active:  rawNodes.filter(n => n.status === 'active').length,
          offline: rawNodes.filter(n => n.status === 'disconnected').length,
          edges:   rawEdges.length,
        });

        nodesRef.current = rawNodes;
        edgesRef.current = rawEdges;
        // Esperar al siguiente frame para asegurar que el DOM tiene dimensiones
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildGraph(nodes: NodeDatum[], edges: EdgeDatum[]) {
    const el  = wrapRef.current;
    const svg = svgRef.current;
    if (!el || !svg) return;

    const W = el.clientWidth  || 900;
    const H = el.clientHeight || 600;

    // Limpiar SVG anterior
    d3.select(svg).selectAll('*').remove();

    const root = d3.select(svg)
      .attr('width', W).attr('height', H);

    // Definir marcador de flecha
    root.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 14).attr('refY', 0)
      .attr('markerWidth', 4).attr('markerHeight', 4)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', 'rgba(255,255,255,0.15)');

    // Grupo principal con zoom/pan
    const g = root.append('g');

    root.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.08, 4])
        .on('zoom', (event) => g.attr('transform', event.transform))
    );

    // Simulación
    const sim = d3.forceSimulation<NodeDatum>(nodes)
      .force('link', d3.forceLink<NodeDatum, EdgeDatum>(edges)
        .id(d => d.id)
        .distance(d => {
          const s = d.source as NodeDatum;
          const t = d.target as NodeDatum;
          if (s.type === 'airFiber' || t.type === 'airFiber') return 80;
          if (s.type === 'wave'     || t.type === 'wave')     return 90;
          return 55;
        })
        .strength(0.6)
      )
      .force('charge', d3.forceManyBody().strength(-220))
      .force('center', d3.forceCenter(W / 2, H / 2).strength(0.08))
      .force('collide', d3.forceCollide<NodeDatum>(d => nodeRadius(d.type) + 6))
      .alphaDecay(0.025);

    simRef.current = sim;

    // Links
    const link = g.append('g').selectAll<SVGLineElement, EdgeDatum>('line')
      .data(edges).join('line')
      .attr('stroke', 'rgba(255,255,255,0.08)')
      .attr('stroke-width', 1)
      .attr('marker-end', 'url(#arrow)');

    // Nodos
    const node = g.append('g').selectAll<SVGGElement, NodeDatum>('g')
      .data(nodes).join('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, NodeDatum>()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end',  (event, d) => {
            if (!event.active) sim.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      )
      .on('click', (_event, d) => setSelected(d));

    // Halo de status
    node.append('circle')
      .attr('r', d => nodeRadius(d.type) + 3)
      .attr('fill', 'none')
      .attr('stroke', d => d.status === 'active' ? nodeColor(d.type, d.status) : 'transparent')
      .attr('stroke-width', 1)
      .attr('opacity', 0.25);

    // Círculo principal
    node.append('circle')
      .attr('r', d => nodeRadius(d.type))
      .attr('fill', d => nodeColor(d.type, d.status))
      .attr('stroke', d => d.status === 'active' ? nodeColor(d.type, d.status) : '#334155')
      .attr('stroke-width', 1.2)
      .attr('opacity', d => d.status === 'disconnected' ? 0.4 : 1);

    // Label (solo para nodos grandes o wave/airFiber)
    node.filter(d => d.type === 'wave' || d.type === 'airFiber')
      .append('text')
      .text(d => d.label.length > 18 ? d.label.slice(0, 18) + '…' : d.label)
      .attr('x', d => nodeRadius(d.type) + 4)
      .attr('y', 4)
      .attr('fill', 'rgba(255,255,255,0.75)')
      .attr('font-size', 9)
      .attr('font-family', 'monospace')
      .attr('pointer-events', 'none');

    // Tick
    sim.on('tick', () => {
      link
        .attr('x1', d => (d.source as NodeDatum).x ?? 0)
        .attr('y1', d => (d.source as NodeDatum).y ?? 0)
        .attr('x2', d => (d.target as NodeDatum).x ?? 0)
        .attr('y2', d => (d.target as NodeDatum).y ?? 0);

      node.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const types = Object.keys(TYPE_COLOR);
  const toggleType = (t: string) =>
    setTypeFilter(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  return (
    <div ref={wrapRef} style={{
      width: '100%', height,
      background: '#050810',
      position: 'relative',
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      {/* SVG canvas */}
      <svg ref={svgRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

      {/* Loading */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 14, color: '#00aff0',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid rgba(0,175,240,0.15)',
            borderTopColor: '#00aff0',
            animation: 'spin 0.8s linear infinite',
          }} />
          <span style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: 2 }}>
            CARGANDO TOPOLOGÍA…
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ff6b6b', fontSize: 13,
        }}>
          Backend no disponible: {error}
        </div>
      )}

      {/* KPIs top-left */}
      {!loading && (
        <div style={{
          position: 'absolute', top: 16, left: 16,
          display: 'flex', gap: 8,
        }}>
          {[
            { v: stats.total,   l: 'Dispositivos', c: '#e2e8f0' },
            { v: stats.active,  l: 'Activos',       c: '#10b981' },
            { v: stats.offline, l: 'Desconectados', c: '#ef4444' },
            { v: stats.edges,   l: 'Enlaces',        c: '#00aff0' },
          ].map(k => (
            <div key={k.l} style={{
              background: 'rgba(5,8,16,0.88)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8, padding: '6px 12px',
              textAlign: 'center', backdropFilter: 'blur(8px)',
            }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: k.c, lineHeight: 1 }}>{k.v}</div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, marginTop: 2 }}>
                {k.l.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leyenda / filtros bottom-left */}
      {!loading && (
        <div style={{
          position: 'absolute', bottom: 16, left: 16,
          background: 'rgba(5,8,16,0.88)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: 9, color: '#00aff0', fontWeight: 700, letterSpacing: 1.5, marginBottom: 8 }}>
            TIPOS DE DISPOSITIVO
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {types.map(t => {
              const active = typeFilter.length === 0 || typeFilter.includes(t);
              return (
                <button key={t} onClick={() => toggleType(t)} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: 'none', border: 'none', cursor: 'pointer',
                  opacity: active ? 1 : 0.3, padding: 0,
                }}>
                  <div style={{
                    width: 9, height: 9, borderRadius: '50%',
                    background: TYPE_COLOR[t],
                    boxShadow: active ? `0 0 5px ${TYPE_COLOR[t]}` : 'none',
                  }} />
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontFamily: 'monospace' }}>
                    {TYPE_LABEL[t]}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{
            marginTop: 8, paddingTop: 7,
            borderTop: '1px solid rgba(255,255,255,0.05)',
            fontSize: 9, color: 'rgba(255,255,255,0.25)',
          }}>
            Drag nodos · Scroll zoom · Click info
          </div>
        </div>
      )}

      {/* Inspector de nodo seleccionado */}
      {selected && (
        <div style={{
          position: 'absolute', bottom: 16, right: 16,
          background: 'rgba(5,8,16,0.95)', border: `1px solid ${nodeColor(selected.type, selected.status)}40`,
          borderRadius: 12, padding: '14px 18px', backdropFilter: 'blur(12px)',
          minWidth: 220, maxWidth: 280,
          boxShadow: `0 0 24px ${nodeColor(selected.type, selected.status)}15`,
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#fff',
                wordBreak: 'break-word', lineHeight: 1.3,
              }}>
                {selected.label}
              </div>
              <div style={{
                fontSize: 9, color: nodeColor(selected.type, selected.status),
                fontFamily: 'monospace', marginTop: 3, letterSpacing: 0.5,
              }}>
                {selected.model || selected.type}
              </div>
            </div>
            <button onClick={() => setSelected(null)} style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
              fontSize: 16, lineHeight: 1, padding: '0 0 0 8px',
              flexShrink: 0,
            }}>×</button>
          </div>

          {/* Status badge */}
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
              color: selected.status === 'active' ? '#10b981' : '#ef4444',
              letterSpacing: 1,
            }}>
              {selected.status === 'active' ? 'ACTIVO' : selected.status === 'disconnected' ? 'DESCONECTADO' : selected.status.toUpperCase()}
            </span>
          </div>

          {/* Detalles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { l: 'Tipo',      v: TYPE_LABEL[selected.type] || selected.type },
              { l: 'Sitio',     v: selected.site || '—' },
              { l: 'Señal',     v: selected.signal != null ? `${selected.signal} dBm` : '—' },
              { l: 'Estaciones',v: selected.stations != null ? String(selected.stations) : '—' },
            ].map(row => (
              <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace' }}>{row.l}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontFamily: 'monospace', textAlign: 'right', wordBreak: 'break-all' }}>{row.v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hint zoom */}
      {!loading && (
        <div style={{
          position: 'absolute', top: 16, right: 16,
          fontSize: 9, color: 'rgba(255,255,255,0.2)',
          fontFamily: 'monospace',
        }}>
          SCROLL = ZOOM · DRAG = PAN
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
