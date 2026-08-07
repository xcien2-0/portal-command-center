import { useState, useEffect } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Nivel  = 'critico' | 'urgente' | 'menor';
type Estado = 'pendiente' | 'en_proceso' | 'resuelto';

interface Hallazgo {
  id: string;
  fecha: string;
  componente: string;
  descripcion: string;
  nivel: Nivel;
  estado: Estado;
  reportado_por: string;
  folio_ref?: string;
}

interface Mantenimiento {
  ultimo_servicio?: string;
  km_ultimo?: number;
  garantia_vigente: boolean;
  observacion?: string;
}

interface Vehiculo {
  id: string;
  nombre: string;
  placa: string;
  conductor: string;
  email_conductor: string;
  tn360_id: number;
  anio?: string;
  marca?: string;
  modelo?: string;
  color?: string;
  mantenimiento: Mantenimiento;
  hallazgos: Hallazgo[];
}

// ─── Datos iniciales (expediente histórico) ───────────────────────────────────
const VEHICULOS_INICIAL: Vehiculo[] = [
  {
    id: 'lw204',
    nombre: 'LW-204',
    placa: 'EY5920B',
    conductor: 'Alberto Espinosa',
    email_conductor: 'espinosaalberto711@gmail.com',
    tn360_id: 3330,
    mantenimiento: {
      garantia_vigente: true,
      observacion: 'Sin datos de último servicio registrado aún.',
    },
    hallazgos: [
      {
        id: 'lw204-001',
        fecha: '2026-08-03',
        componente: 'Sistema de escape',
        descripcion: 'Escape roto en el múltiple de escape (salida del motor). Ruido excesivo y fuga directa de gases calientes hacia el compartimento del motor. Riesgo de incendio sobre cableado y mangueras.',
        nivel: 'critico',
        estado: 'pendiente',
        reportado_por: 'José Miguel Macías',
        folio_ref: 'XCIEN-PDN-VEH-2026-001',
      },
      {
        id: 'lw204-002',
        fecha: '2026-08-03',
        componente: 'Transmisión / Clutch',
        descripcion: 'Accionamiento del clutch con resistencia anormal. Posible desgaste severo del disco de embrague o falla en el sistema hidráulico de la transmisión.',
        nivel: 'critico',
        estado: 'pendiente',
        reportado_por: 'José Miguel Macías',
        folio_ref: 'XCIEN-PDN-VEH-2026-001',
      },
      {
        id: 'lw204-003',
        fecha: '2026-08-03',
        componente: 'Motor (rendimiento)',
        descripcion: 'Motor percibido como desforzado. Probable pérdida de contrapresión relacionada con el escape roto. Verificar en conjunto con diagnóstico de escape.',
        nivel: 'urgente',
        estado: 'pendiente',
        reportado_por: 'José Miguel Macías',
        folio_ref: 'XCIEN-PDN-VEH-2026-001',
      },
      {
        id: 'lw204-004',
        fecha: '2026-08-03',
        componente: 'Infracción de tránsito',
        descripcion: 'Infracción registrada durante la visita a Ciudad Acuña el 03 de agosto de 2026. Detalle de la boleta pendiente de documentar. El vehículo y conductor deben aclarar situación legal antes de próxima asignación.',
        nivel: 'urgente',
        estado: 'pendiente',
        reportado_por: 'José Miguel Macías',
        folio_ref: 'XCIEN-PDN-VEH-2026-001',
      },
      {
        id: 'lw204-005',
        fecha: '2026-08-03',
        componente: 'Licencia de conducir',
        descripcion: 'Licencia de conducir del conductor Alberto Espinosa VENCIDA. El conductor operó el vehículo LW-204 sin licencia vigente durante la comisión a Ciudad Acuña. Implica responsabilidad civil y legal para XCIEN en caso de accidente.',
        nivel: 'critico',
        estado: 'pendiente',
        reportado_por: 'José Miguel Macías',
        folio_ref: 'XCIEN-PDN-VEH-2026-001',
      },
    ],
  },
  {
    id: 'lw207',
    nombre: 'LW-207',
    placa: 'PX7538B',
    conductor: 'Guillermo Hernández',
    email_conductor: 'guillermo.hernandez@luminet.com.mx',
    tn360_id: 3314,
    mantenimiento: {
      garantia_vigente: false,
      observacion: 'Mantenimiento de agencia VENCIDO — garantía comprometida. Requiere cita urgente.',
    },
    hallazgos: [
      {
        id: 'lw207-001',
        fecha: '2026-08-03',
        componente: 'Mantenimiento preventivo',
        descripcion: 'Servicio de agencia vencido (km o fecha superados). Cualquier falla mecánica a partir de este punto no será cubierta por garantía. Aceite, filtros, frenos y otros componentes sin revisión desde el último servicio.',
        nivel: 'urgente',
        estado: 'pendiente',
        reportado_por: 'José Miguel Macías',
        folio_ref: 'XCIEN-PDN-VEH-2026-001',
      },
    ],
  },
];

// ─── Constantes de UI ─────────────────────────────────────────────────────────
const NIVEL_CFG: Record<Nivel, { label: string; dot: string; badge: string; row: string }> = {
  critico: { label: 'CRÍTICO',  dot: 'bg-red-500',   badge: 'bg-red-100 text-red-700 border-red-300',   row: 'border-l-red-500 bg-red-50/60 dark:bg-red-950/20'   },
  urgente: { label: 'URGENTE',  dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 border-amber-300', row: 'border-l-amber-500 bg-amber-50/60 dark:bg-amber-950/20' },
  menor:   { label: 'MENOR',    dot: 'bg-blue-400',  badge: 'bg-blue-100 text-blue-700 border-blue-300',  row: 'border-l-blue-400 bg-blue-50/40 dark:bg-blue-950/20'   },
};
const ESTADO_CFG: Record<Estado, { label: string; color: string; icon: string }> = {
  pendiente:  { label: 'Pendiente',  color: 'text-red-500',   icon: '⏳' },
  en_proceso: { label: 'En proceso', color: 'text-amber-500', icon: '🔧' },
  resuelto:   { label: 'Resuelto',   color: 'text-green-600', icon: '✅' },
};

const STORAGE_KEY = 'xcien_flotilla_expediente';

function loadData(): Vehiculo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return VEHICULOS_INICIAL;
    const saved: Vehiculo[] = JSON.parse(raw);
    // Merge: para cada vehículo, combinar hallazgos iniciales + guardados sin duplicar por id
    return VEHICULOS_INICIAL.map(base => {
      const savedVeh = saved.find(s => s.id === base.id);
      if (!savedVeh) return base;
      const savedIds = new Set(savedVeh.hallazgos.map(h => h.id));
      const newFromBase = base.hallazgos.filter(h => !savedIds.has(h.id));
      return {
        ...savedVeh,
        hallazgos: [...savedVeh.hallazgos, ...newFromBase],
      };
    });
  } catch {
    return VEHICULOS_INICIAL;
  }
}

function saveData(vehiculos: Vehiculo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vehiculos));
}

// ─── Formulario nuevo hallazgo ────────────────────────────────────────────────
function NuevoHallazgoForm({
  vehiculoNombre, onSave, onCancel,
}: { vehiculoNombre: string; onSave: (h: Omit<Hallazgo, 'id'>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    componente: '',
    descripcion: '',
    nivel: 'urgente' as Nivel,
    estado: 'pendiente' as Estado,
    reportado_por: 'José Miguel Macías',
    folio_ref: '',
  });

  const ok = form.componente.trim() && form.descripcion.trim();

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
        Nuevo hallazgo — {vehiculoNombre}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha</label>
          <input type="date" value={form.fecha}
            onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Componente</label>
          <input type="text" placeholder="Ej: Motor, Llantas, Frenos…" value={form.componente}
            onChange={e => setForm(f => ({ ...f, componente: e.target.value }))}
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Descripción del hallazgo</label>
          <textarea rows={3} placeholder="Descripción detallada del problema observado…" value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nivel de riesgo</label>
          <select value={form.nivel} onChange={e => setForm(f => ({ ...f, nivel: e.target.value as Nivel }))}
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option value="critico">🔴 Crítico</option>
            <option value="urgente">🟡 Urgente</option>
            <option value="menor">🔵 Menor</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Folio de referencia (opcional)</label>
          <input type="text" placeholder="Ej: XCIEN-PDN-VEH-2026-002" value={form.folio_ref}
            onChange={e => setForm(f => ({ ...f, folio_ref: e.target.value }))}
            className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
        </div>
      </div>
      <div className="flex gap-2 mt-3 justify-end">
        <button onClick={onCancel}
          className="text-sm px-3 py-1.5 rounded border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
          Cancelar
        </button>
        <button onClick={() => ok && onSave(form)} disabled={!ok}
          className="text-sm px-4 py-1.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium">
          Guardar hallazgo
        </button>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function FlotillaSection({ theme }: { theme?: any }) {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>(loadData);
  const [selected, setSelected] = useState<string>('lw204');
  const [showForm, setShowForm] = useState(false);
  const [filterEstado, setFilterEstado] = useState<string>('todos');

  useEffect(() => { saveData(vehiculos); }, [vehiculos]);

  const veh = vehiculos.find(v => v.id === selected)!;
  const hallazgos = veh.hallazgos
    .filter(h => filterEstado === 'todos' || h.estado === filterEstado)
    .sort((a, b) => {
      const order: Record<Nivel, number> = { critico: 0, urgente: 1, menor: 2 };
      if (order[a.nivel] !== order[b.nivel]) return order[a.nivel] - order[b.nivel];
      return b.fecha.localeCompare(a.fecha);
    });

  const addHallazgo = (data: Omit<Hallazgo, 'id'>) => {
    const id = `${selected}-${Date.now()}`;
    setVehiculos(prev => prev.map(v =>
      v.id === selected ? { ...v, hallazgos: [...v.hallazgos, { ...data, id }] } : v
    ));
    setShowForm(false);
  };

  const updateEstado = (hid: string, estado: Estado) => {
    setVehiculos(prev => prev.map(v =>
      v.id !== selected ? v : {
        ...v,
        hallazgos: v.hallazgos.map(h => h.id === hid ? { ...h, estado } : h),
      }
    ));
  };

  const updateMantenimiento = (patch: Partial<Mantenimiento>) => {
    setVehiculos(prev => prev.map(v =>
      v.id !== selected ? v : { ...v, mantenimiento: { ...v.mantenimiento, ...patch } }
    ));
  };

  // KPIs globales
  const allHallazgos  = vehiculos.flatMap(v => v.hallazgos);
  const criticos      = allHallazgos.filter(h => h.nivel === 'critico' && h.estado !== 'resuelto').length;
  const urgentes      = allHallazgos.filter(h => h.nivel === 'urgente' && h.estado !== 'resuelto').length;
  const pendientes    = allHallazgos.filter(h => h.estado === 'pendiente').length;
  const sinGarantia   = vehiculos.filter(v => !v.mantenimiento.garantia_vigente).length;

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Expediente Vehicular — Plaza PDN
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Supervisión: José Miguel Macías Contreras · Folio base: XCIEN-PDN-VEH-2026-001
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { v: criticos,    l: 'Críticos activos',    c: 'text-red-600',   bg: 'bg-red-50 dark:bg-red-950/20',    i: '🔴' },
          { v: urgentes,    l: 'Urgentes activos',    c: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20',i: '🟡' },
          { v: pendientes,  l: 'Sin resolver',        c: 'text-red-600',   bg: 'bg-red-50 dark:bg-red-950/20',    i: '⏳' },
          { v: sinGarantia, l: 'Sin garantía vigente',c: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20',i: '⚠️' },
        ].map(k => (
          <div key={k.l} className={`${k.bg} rounded-lg p-3 border border-gray-200 dark:border-gray-700`}>
            <div className="text-base">{k.i}</div>
            <div className={`text-2xl font-bold ${k.c}`}>{k.v}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">{k.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs por vehículo */}
      <div className="flex gap-2">
        {vehiculos.map(v => {
          const pendV = v.hallazgos.filter(h => h.estado !== 'resuelto');
          const hasCrit = pendV.some(h => h.nivel === 'critico');
          const isActive = v.id === selected;
          return (
            <button key={v.id} onClick={() => { setSelected(v.id); setShowForm(false); setFilterEstado('todos'); }}
              className={`flex-1 text-left p-3 rounded-xl border-2 transition-all ${
                isActive
                  ? 'border-green-500 bg-white dark:bg-gray-800 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-gray-300'
              }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-gray-900 dark:text-white text-sm">{v.nombre}</span>
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  hasCrit ? 'bg-red-100 text-red-700' : pendV.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                }`}>
                  {hasCrit ? '🔴 CRÍTICO' : pendV.length > 0 ? '🟡 URGENTE' : '✅ OK'}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{v.conductor}</div>
              <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">{v.placa}</div>
              <div className="text-xs mt-1">
                <span className="text-red-500 font-medium">{pendV.length} hallazgo{pendV.length !== 1 ? 's' : ''} activo{pendV.length !== 1 ? 's' : ''}</span>
                {!v.mantenimiento.garantia_vigente && (
                  <span className="text-amber-600 ml-2">· ⚠ Garantía</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Expediente del vehículo seleccionado */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">

        {/* Header unidad */}
        <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold">{veh.nombre}</span>
            <span className="text-gray-400 text-sm">·</span>
            <span className="text-gray-300 text-sm font-mono">{veh.placa}</span>
            <span className="text-gray-400 text-sm">·</span>
            <span className="text-gray-300 text-sm">{veh.conductor}</span>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
            veh.mantenimiento.garantia_vigente
              ? 'bg-green-900 text-green-300'
              : 'bg-red-900 text-red-300'
          }`}>
            {veh.mantenimiento.garantia_vigente ? '✓ Garantía OK' : '⚠ Sin garantía'}
          </span>
        </div>

        {/* Mantenimiento */}
        <div className={`px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2 ${
          !veh.mantenimiento.garantia_vigente
            ? 'bg-amber-50 dark:bg-amber-950/20'
            : 'bg-gray-50 dark:bg-gray-900/50'
        }`}>
          <span className="text-xs text-gray-600 dark:text-gray-400">
            🔧 {veh.mantenimiento.observacion || 'Mantenimiento: sin observaciones'}
          </span>
          <button
            onClick={() => updateMantenimiento({ garantia_vigente: !veh.mantenimiento.garantia_vigente })}
            className={`text-xs px-2 py-0.5 rounded border font-medium shrink-0 ${
              veh.mantenimiento.garantia_vigente
                ? 'border-green-300 text-green-700 hover:bg-green-100'
                : 'border-amber-300 text-amber-700 hover:bg-amber-100'
            }`}>
            {veh.mantenimiento.garantia_vigente ? 'Marcar vencida' : 'Marcar vigente'}
          </button>
        </div>

        {/* Barra de acciones */}
        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {(['todos','pendiente','en_proceso','resuelto'] as const).map(e => (
              <button key={e} onClick={() => setFilterEstado(e)}
                className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                  filterEstado === e
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400'
                }`}>
                {e === 'todos' ? 'Todos' : ESTADO_CFG[e].label}
                {e !== 'todos' && (
                  <span className="ml-1 opacity-60">
                    ({veh.hallazgos.filter(h => h.estado === e).length})
                  </span>
                )}
              </button>
            ))}
          </div>
          <button onClick={() => setShowForm(f => !f)}
            className="text-xs px-3 py-1.5 rounded bg-green-600 hover:bg-green-700 text-white font-medium transition-colors">
            {showForm ? '✕ Cancelar' : '+ Nuevo hallazgo'}
          </button>
        </div>

        {/* Formulario nuevo hallazgo */}
        {showForm && (
          <NuevoHallazgoForm
            vehiculoNombre={veh.nombre}
            onSave={addHallazgo}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Lista hallazgos */}
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {hallazgos.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-gray-400 dark:text-gray-500">
              {filterEstado === 'todos'
                ? 'Esta unidad no tiene hallazgos registrados.'
                : `Sin hallazgos en estado "${ESTADO_CFG[filterEstado as Estado]?.label}".`}
            </div>
          )}
          {hallazgos.map(h => {
            const nc = NIVEL_CFG[h.nivel];
            const ec = ESTADO_CFG[h.estado];
            return (
              <div key={h.id} className={`px-4 py-3 border-l-4 ${nc.row}`}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${nc.badge}`}>
                        {nc.label}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {h.componente}
                      </span>
                      <span className="text-xs text-gray-400">{h.fecha}</span>
                      {h.folio_ref && (
                        <span className="text-xs text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">
                          {h.folio_ref}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                      {h.descripcion}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Reportado por: {h.reportado_por}
                    </p>
                  </div>
                  {/* Cambio de estado */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <span className={`text-xs font-medium ${ec.color} text-right`}>
                      {ec.icon} {ec.label}
                    </span>
                    <select
                      value={h.estado}
                      onChange={e => updateEstado(h.id, e.target.value as Estado)}
                      className="text-xs border border-gray-200 dark:border-gray-600 rounded px-1.5 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                      <option value="pendiente">Pendiente</option>
                      <option value="en_proceso">En proceso</option>
                      <option value="resuelto">Resuelto</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumen por vehículo */}
        {veh.hallazgos.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Total hallazgos: <b className="text-gray-700 dark:text-gray-300">{veh.hallazgos.length}</b></span>
            <span>Críticos: <b className="text-red-600">{veh.hallazgos.filter(h => h.nivel === 'critico').length}</b></span>
            <span>Urgentes: <b className="text-amber-600">{veh.hallazgos.filter(h => h.nivel === 'urgente').length}</b></span>
            <span>Resueltos: <b className="text-green-600">{veh.hallazgos.filter(h => h.estado === 'resuelto').length}</b></span>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        El reporte semanal de flotilla (viernes 08:00 AM) cruza automáticamente los viajes TN360 con tickets Odoo Field Service.
        Los hallazgos se guardan localmente en este navegador.
      </p>
    </div>
  );
}
