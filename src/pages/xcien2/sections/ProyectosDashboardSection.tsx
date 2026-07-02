import { useEffect, useState } from 'react';
import { API_BASE } from '../../../config';

interface Tarea {
  id: string;
  nombre: string;
  status: string;
  status_type: string;
  due_date: string | null;
  start_date: string | null;
  url: string;
  asignados: string[];
}

interface Proyecto {
  code: string;
  nombre: string;
  color: string;
  list_id: string;
  total: number;
  completadas: number;
  en_progreso: number;
  pct: number;
  tareas: Tarea[];
  error?: string;
}

const STATUS_LABELS: Record<string, { label: string; bg: string; dot: string }> = {
  'to do':      { label: 'Pendiente',  bg: 'bg-[#1a1a1a]', dot: '#808080' },
  'complete':   { label: 'Completada', bg: 'bg-[#0a1f12]', dot: '#00A859' },
};

function statusMeta(s: string) {
  return STATUS_LABELS[s.toLowerCase()] ?? { label: s, bg: 'bg-[#1a1a1a]', dot: '#888' };
}

function formatDate(ts: string | null) {
  if (!ts) return '—';
  const d = new Date(Number(ts));
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' });
}

function ProgressRing({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2a2a2a" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize={size < 56 ? 10 : 13} fontWeight="bold"
        style={{ transform: `rotate(90deg)`, transformOrigin: `${size/2}px ${size/2}px` }}>
        {pct}%
      </text>
    </svg>
  );
}

export default function ProyectosDashboardSection() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [expandido, setExpandido] = useState<string | null>(null);
  const [updating, setUpdating]   = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`${API_BASE}/api/proyectos2026/dashboard`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      setProyectos(d.proyectos ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (taskId: string, newStatus: string) => {
    setUpdating(taskId);
    try {
      await fetch(`${API_BASE}/api/proyectos2026/tarea/${taskId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchData();
    } finally {
      setUpdating(null);
    }
  };

  const totalTareas     = proyectos.reduce((a, p) => a + p.total, 0);
  const totalCompletadas= proyectos.reduce((a, p) => a + p.completadas, 0);
  const pctGlobal       = totalTareas ? Math.round(totalCompletadas / totalTareas * 100) : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#00A859] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="p-6 text-red-400 bg-[#1a0a0a] rounded-xl border border-red-800">
      Error cargando ClickUp: {error}
    </div>
  );

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Plan de Trabajo 2026</h2>
          <p className="text-[#555] text-sm mt-0.5">Julio — Diciembre · Sincronizado con ClickUp</p>
        </div>
        <button onClick={fetchData}
          className="text-xs text-[#555] hover:text-white px-3 py-1.5 rounded-lg border border-[#2a2a2a] hover:border-[#444] transition-all">
          ↻ Actualizar
        </button>
      </div>

      {/* KPI global */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { val: '5',              label: 'Proyectos' },
          { val: String(totalTareas),     label: 'Fases totales' },
          { val: String(totalCompletadas),label: 'Completadas' },
          { val: `${pctGlobal}%`, label: 'Avance global' },
        ].map(({ val, label }) => (
          <div key={label} className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-[#00A859]">{val}</div>
            <div className="text-[#555] text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Barra global */}
      <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4">
        <div className="flex justify-between text-xs text-[#555] mb-2">
          <span>Avance consolidado</span>
          <span>{totalCompletadas}/{totalTareas} fases</span>
        </div>
        <div className="h-2.5 bg-[#222] rounded-full overflow-hidden">
          <div className="h-full bg-[#00A859] rounded-full transition-all duration-700"
               style={{ width: `${pctGlobal}%` }} />
        </div>
      </div>

      {/* Cards de proyectos */}
      <div className="grid grid-cols-1 gap-4">
        {proyectos.map((p) => {
          const isOpen = expandido === p.code;
          return (
            <div key={p.code}
              className="bg-[#111] border border-[#2a2a2a] rounded-2xl overflow-hidden">
              {/* Cabecera del proyecto */}
              <button
                className="w-full flex items-center gap-4 p-5 hover:bg-[#181818] transition-colors text-left"
                onClick={() => setExpandido(isOpen ? null : p.code)}>
                {/* Código */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white flex-shrink-0"
                     style={{ background: p.color }}>
                  {p.code}
                </div>
                {/* Nombre y barra */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-sm truncate">{p.nombre}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1.5 bg-[#222] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                           style={{ width: `${p.pct}%`, background: p.color }} />
                    </div>
                    <span className="text-xs text-[#555] flex-shrink-0">
                      {p.completadas}/{p.total}
                    </span>
                  </div>
                </div>
                {/* Ring */}
                <ProgressRing pct={p.pct} color={p.color} size={56} />
                {/* Chevron */}
                <span className={`text-[#555] transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                  ›
                </span>
              </button>

              {/* Detalle de tareas */}
              {isOpen && (
                <div className="border-t border-[#2a2a2a] divide-y divide-[#1e1e1e]">
                  {p.tareas.length === 0 && (
                    <div className="px-5 py-4 text-[#555] text-sm">Sin tareas registradas.</div>
                  )}
                  {p.tareas.map((t) => {
                    const meta = statusMeta(t.status);
                    return (
                      <div key={t.id}
                        className={`flex items-center gap-3 px-5 py-3 ${meta.bg} transition-colors`}>
                        {/* Dot */}
                        <div className="w-2 h-2 rounded-full flex-shrink-0"
                             style={{ background: meta.dot }} />
                        {/* Nombre */}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-white truncate block">{t.nombre}</span>
                          {(t.start_date || t.due_date) && (
                            <span className="text-xs text-[#444]">
                              {formatDate(t.start_date)} → {formatDate(t.due_date)}
                            </span>
                          )}
                        </div>
                        {/* Status select */}
                        <select
                          value={t.status}
                          disabled={updating === t.id}
                          onChange={(e) => updateStatus(t.id, e.target.value)}
                          className="bg-[#1a1a1a] border border-[#333] text-xs text-white rounded-lg px-2 py-1 cursor-pointer hover:border-[#555] transition-colors disabled:opacity-50">
                          <option value="to do">Pendiente</option>
                          <option value="complete">Completada</option>
                        </select>
                        {/* Link ClickUp */}
                        {t.url && (
                          <a href={t.url} target="_blank" rel="noreferrer"
                             className="text-[#444] hover:text-[#00A859] text-xs transition-colors flex-shrink-0"
                             title="Abrir en ClickUp">
                            ↗
                          </a>
                        )}
                      </div>
                    );
                  })}
                  {/* Footer con link a ClickUp */}
                  <div className="px-5 py-3 flex justify-end">
                    <a href={`https://app.clickup.com/${p.list_id}`}
                       target="_blank" rel="noreferrer"
                       className="text-xs text-[#555] hover:text-white transition-colors">
                      Ver lista completa en ClickUp ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
