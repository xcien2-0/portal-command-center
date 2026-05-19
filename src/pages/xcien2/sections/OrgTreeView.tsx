/**
 * OrgTreeView.tsx — Vista de árbol estilo "The Brain"
 * Grafo interactivo con nodo central navegable y física D3
 * Empresas → Departamentos → Empleados
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

interface Empleado {
  id: number;
  name: string;
  job_title: string;
  department: string;
  company: string;
  email: string;
  phone: string;
  manager: string | null;
}

interface Props {
  empleados: Empleado[];
  theme: {
    accent: string; bg: string; card: string; border: string;
    text: string; dim: string; radius: number;
  };
}

// ── Node types & colors ────────────────────────────────────────────────────────

type NodeType = 'root' | 'company' | 'department' | 'employee';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  sublabel?: string;
  type: NodeType;
  color: string;
  radius: number;
  data?: Empleado;
  expanded?: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

const COMPANY_COLOR: Record<string, string> = {
  'SERVICIOS CORPORATIVOS WISPI':                  '#00A859',
  'LUMINET WAN':                                   '#00B4D8',
  'ADMINISTRADORA DE SERVICIOS DE INTERNET SANDUR':'#8B5CF6',
  'ADMINISTRADORA DE SERVICIOS INTERNET SANDUR':   '#8B5CF6',
  'MATERIALES ASESORIAS Y SERVICIOS':              '#F97316',
  'SENEL':                                         '#EC4899',
  'HUUS VAS':                                      '#EAB308',
};

const COMPANY_SHORT: Record<string, string> = {
  'SERVICIOS CORPORATIVOS WISPI':                  'WISPI',
  'LUMINET WAN':                                   'LUMINET',
  'ADMINISTRADORA DE SERVICIOS DE INTERNET SANDUR':'SANDUR',
  'ADMINISTRADORA DE SERVICIOS INTERNET SANDUR':   'SANDUR',
  'MATERIALES ASESORIAS Y SERVICIOS':              'MAS',
  'SENEL':                                         'SENEL',
  'HUUS VAS':                                      'HUUS',
};

function shortDept(dept: string): string {
  const parts = dept.split('/');
  return parts[parts.length - 1].trim();
}

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 2) return name;
  return `${parts[0]} ${parts[1]}`;
}

function companyColor(company: string): string {
  return COMPANY_COLOR[company] || '#666';
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

// ── Build graph from employees ─────────────────────────────────────────────────

function buildGraph(empleados: Empleado[], focusId: string): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeSet = new Set<string>();

  const addNode = (n: GraphNode) => {
    if (!nodeSet.has(n.id)) {
      nodeSet.add(n.id);
      nodes.push(n);
    }
  };

  // Root
  addNode({
    id: 'root',
    label: 'XCIEN',
    sublabel: 'Grupo Empresarial',
    type: 'root',
    color: '#00A859',
    radius: 36,
    x: 0, y: 0,
  });

  // Group by company → department
  const structure: Record<string, Record<string, Empleado[]>> = {};
  for (const emp of empleados) {
    const co = emp.company || 'Sin empresa';
    const dept = shortDept(emp.department || 'Sin departamento');
    if (!structure[co]) structure[co] = {};
    if (!structure[co][dept]) structure[co][dept] = [];
    structure[co][dept].push(emp);
  }

  const isFocusCompany = Object.keys(structure).some(co => `co::${co}` === focusId);
  const isFocusDept = Object.keys(structure).some(co =>
    Object.keys(structure[co]).some(dept => `dept::${co}::${dept}` === focusId)
  );

  for (const [company, depts] of Object.entries(structure)) {
    const coId = `co::${company}`;
    const coColor = companyColor(company);
    const short = COMPANY_SHORT[company] || company.split(' ')[0];
    const totalEmps = Object.values(depts).reduce((a, b) => a + b.length, 0);

    // Show company if: focus is root, or focus is this company, or focus is a dept in this company
    const showCompany = focusId === 'root' || focusId === coId ||
      Object.keys(depts).some(dept => `dept::${co}::${dept}` === focusId) ||
      empleados.some(e => `emp::${e.id}` === focusId && e.company === company);

    if (!showCompany) continue;

    addNode({
      id: coId,
      label: short,
      sublabel: `${totalEmps} personas`,
      type: 'company',
      color: coColor,
      radius: 28,
    });
    links.push({ source: 'root', target: coId });

    for (const [dept, emps] of Object.entries(depts)) {
      const deptId = `dept::${company}::${dept}`;

      // Show dept if: focus is root/company, or this is the focused dept, or a child employee
      const showDept = focusId === 'root' || focusId === coId || focusId === deptId ||
        emps.some(e => `emp::${e.id}` === focusId);

      if (!showDept) continue;

      addNode({
        id: deptId,
        label: dept,
        sublabel: `${emps.length} personas`,
        type: 'department',
        color: coColor,
        radius: 20,
      });
      links.push({ source: coId, target: deptId });

      // Show employees only when dept or employee is focused
      const showEmps = focusId === deptId || emps.some(e => `emp::${e.id}` === focusId);
      if (showEmps) {
        for (const emp of emps) {
          const empId = `emp::${emp.id}`;
          addNode({
            id: empId,
            label: shortName(emp.name),
            sublabel: emp.job_title || '',
            type: 'employee',
            color: coColor,
            radius: 14,
            data: emp,
          });
          links.push({ source: deptId, target: empId });
        }
      }
    }
  }

  return { nodes, links };
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function OrgTreeView({ empleados, theme }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const [focusId, setFocusId] = useState('root');
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: GraphNode } | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string; label: string }[]>([{ id: 'root', label: 'XCIEN' }]);
  const { accent, bg, card, border, text, dim } = theme;

  const navigate = useCallback((node: GraphNode) => {
    if (node.type === 'employee') {
      setTooltip(null);
      return; // employees don't expand further
    }
    setFocusId(node.id);
    setBreadcrumb(prev => {
      const idx = prev.findIndex(b => b.id === node.id);
      if (idx >= 0) return prev.slice(0, idx + 1);
      return [...prev, { id: node.id, label: node.label }];
    });
  }, []);

  useEffect(() => {
    if (!svgRef.current || empleados.length === 0) return;

    const svg = d3.select(svgRef.current);
    const W = svgRef.current.clientWidth || 900;
    const H = svgRef.current.clientHeight || 600;

    svg.selectAll('*').remove();

    const { nodes, links } = buildGraph(empleados, focusId);

    // Container with zoom
    const g = svg.append('g');
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on('zoom', e => g.attr('transform', e.transform.toString()));
    svg.call(zoom);

    // Defs: glow filter + gradients
    const defs = svg.append('defs');
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Simulation
    const sim = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
        .id(d => d.id)
        .distance(d => {
          const s = d.source as GraphNode;
          const t = d.target as GraphNode;
          if (t.type === 'company') return 160;
          if (t.type === 'department') return 120;
          return 80;
        })
        .strength(0.6)
      )
      .force('charge', d3.forceManyBody().strength(d => {
        if (d.type === 'root') return -800;
        if (d.type === 'company') return -500;
        if (d.type === 'department') return -300;
        return -120;
      }))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide<GraphNode>(d => d.radius + 18));

    simRef.current = sim;

    // Fix root at center
    const rootNode = nodes.find(n => n.id === 'root');
    if (rootNode) { rootNode.fx = W / 2; rootNode.fy = H / 2; }

    // Links
    const linkSel = g.append('g').selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => {
        const t = d.target as GraphNode;
        return t.color || accent;
      })
      .attr('stroke-opacity', 0.3)
      .attr('stroke-width', d => {
        const t = d.target as GraphNode;
        if (t.type === 'company') return 2;
        if (t.type === 'department') return 1.5;
        return 1;
      });

    // Node groups
    const nodeSel = g.append('g').selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .join('g')
      .attr('cursor', d => d.type === 'employee' ? 'default' : 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => {
          if (!event.active) sim.alphaTarget(0);
          if (d.type !== 'root') { d.fx = null; d.fy = null; }
        })
      )
      .on('click', (event, d) => {
        event.stopPropagation();
        if (d.type === 'employee') {
          const rect = svgRef.current!.getBoundingClientRect();
          setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top, node: d });
        } else {
          navigate(d);
        }
      })
      .on('mouseover', function(_, d) {
        d3.select(this).select('circle').attr('filter', 'url(#glow)');
      })
      .on('mouseout', function() {
        d3.select(this).select('circle').attr('filter', null);
      });

    // Outer pulse ring for root
    nodeSel.filter(d => d.type === 'root')
      .append('circle')
      .attr('r', d => d.radius + 10)
      .attr('fill', 'none')
      .attr('stroke', d => d.color)
      .attr('stroke-opacity', 0.2)
      .attr('stroke-width', 8);

    // Main circle
    nodeSel.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => {
        if (d.type === 'root') return d.color;
        if (d.type === 'company') return `${d.color}22`;
        if (d.type === 'department') return `${d.color}15`;
        return `${d.color}10`;
      })
      .attr('stroke', d => d.color)
      .attr('stroke-width', d => {
        if (d.type === 'root') return 0;
        if (d.type === 'company') return 2;
        if (d.type === 'department') return 1.5;
        return 1;
      })
      .attr('stroke-opacity', d => d.type === 'employee' ? 0.4 : 0.8);

    // Initials for employees
    nodeSel.filter(d => d.type === 'employee')
      .append('text')
      .text(d => initials(d.label))
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', 8)
      .attr('font-weight', 800)
      .attr('fill', d => d.color)
      .attr('pointer-events', 'none');

    // Icon for root/company/dept
    nodeSel.filter(d => d.type !== 'employee')
      .append('text')
      .text(d => d.type === 'root' ? '🏢' : d.type === 'company' ? '🏛' : '📁')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', d => d.type === 'root' ? 18 : d.type === 'company' ? 14 : 10)
      .attr('pointer-events', 'none');

    // Label below node
    nodeSel.append('text')
      .text(d => d.label.length > 16 ? d.label.slice(0, 14) + '…' : d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.radius + 14)
      .attr('font-size', d => d.type === 'root' ? 12 : d.type === 'company' ? 11 : d.type === 'department' ? 10 : 9)
      .attr('font-weight', d => d.type === 'root' ? 800 : d.type === 'company' ? 700 : 500)
      .attr('fill', text)
      .attr('pointer-events', 'none');

    // Sublabel
    nodeSel.filter(d => !!d.sublabel && d.type !== 'employee')
      .append('text')
      .text(d => d.sublabel!)
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.radius + 26)
      .attr('font-size', 8)
      .attr('fill', dim)
      .attr('pointer-events', 'none');

    // Tick
    sim.on('tick', () => {
      linkSel
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);
      nodeSel.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Click background to dismiss tooltip
    svg.on('click', () => setTooltip(null));

    return () => { sim.stop(); };
  }, [empleados, focusId, accent, bg, text, dim, navigate]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 0 12px', flexShrink: 0 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, flexWrap: 'wrap' }}>
          {breadcrumb.map((b, i) => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {i > 0 && <span style={{ color: dim, fontSize: 11 }}>›</span>}
              <button
                onClick={() => {
                  setFocusId(b.id);
                  setBreadcrumb(prev => prev.slice(0, i + 1));
                }}
                style={{
                  background: i === breadcrumb.length - 1 ? `${accent}20` : 'transparent',
                  border: `1px solid ${i === breadcrumb.length - 1 ? accent + '50' : 'transparent'}`,
                  color: i === breadcrumb.length - 1 ? accent : dim,
                  padding: '3px 10px', borderRadius: 6, fontSize: 11,
                  fontWeight: i === breadcrumb.length - 1 ? 700 : 500,
                  cursor: 'pointer',
                }}
              >{b.label}</button>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, fontSize: 10, color: dim }}>
          {[
            { icon: '🏢', label: 'Grupo' },
            { icon: '🏛', label: 'Empresa' },
            { icon: '📁', label: 'Depto' },
            { icon: '●',  label: 'Empleado', color: accent },
          ].map(l => (
            <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: l.color }}>{l.icon}</span> {l.label}
            </span>
          ))}
        </div>

        <div style={{ fontSize: 10, color: dim, flexShrink: 0 }}>
          Clic en nodo para expandir · Arrastra para mover
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', background: `${bg}`, border: `1px solid ${border}`, borderRadius: 12, overflow: 'hidden' }}>
        {/* Grid dots background */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill={`${dim}30`} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        <svg ref={svgRef} style={{ width: '100%', height: '100%', position: 'relative' }} />

        {/* Help hint */}
        <div style={{ position: 'absolute', bottom: 12, left: 12, fontSize: 10, color: `${dim}70`, pointerEvents: 'none' }}>
          🖱 Scroll para zoom · Click nodo para explorar · Click empleado para ver detalle
        </div>
      </div>

      {/* Employee tooltip */}
      {tooltip && tooltip.node.data && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(tooltip.x + 12, (svgRef.current?.clientWidth || 800) - 260),
            top: Math.min(tooltip.y - 20, (svgRef.current?.clientHeight || 600) - 180),
            background: card, border: `1px solid ${tooltip.node.color}60`,
            borderRadius: 10, padding: '12px 14px', width: 240,
            boxShadow: `0 4px 20px ${tooltip.node.color}20`,
            zIndex: 10, pointerEvents: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: `${tooltip.node.color}20`, border: `2px solid ${tooltip.node.color}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: tooltip.node.color,
            }}>
              {initials(tooltip.node.data!.name)}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: text }}>{shortName(tooltip.node.data!.name)}</div>
              <div style={{ fontSize: 10, color: tooltip.node.color }}>{tooltip.node.data!.job_title || '—'}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
            {tooltip.node.data!.email && <span style={{ color: dim }}>✉️ {tooltip.node.data!.email}</span>}
            {tooltip.node.data!.phone && <span style={{ color: dim }}>📱 {tooltip.node.data!.phone}</span>}
            {tooltip.node.data!.manager && <span style={{ color: dim }}>👤 {shortName(tooltip.node.data!.manager)}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
